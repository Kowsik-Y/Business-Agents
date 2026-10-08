import { NextResponse } from 'next/server';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

const AI_ORCHESTRATOR_URL = process.env.AI_ORCHESTRATOR_URL || 'http://localhost:8002';
const CORE_API_URL = process.env.CORE_API_URL || 'http://localhost:8000';

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      conversationId?: string;
      message?: string;
      customerId?: string;
      channel?: string;
      authenticationLevel?: number;
    };
    const { conversationId, message, customerId = 'CUST-ANON', channel = 'web_chat', authenticationLevel = 0 } = body;

    if (!conversationId || !message) {
      return NextResponse.json(
        { error: 'conversationId and message are required' },
        { status: 400 }
      );
    }

    const turnId = `turn_${crypto.randomUUID()}`;
    const messageId = `msg_${crypto.randomUUID()}`;
    const correlationId = request.headers.get('x-correlation-id') || crypto.randomUUID();

    // 1. Ensure conversation exists and store user message in Core API
    fetch(`${CORE_API_URL}/v1/conversations/${conversationId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Correlation-ID': correlationId,
      },
      body: JSON.stringify({
        content: message,
        role: 'customer',
        channel: 'web_chat',
      }),
    }).catch(() => {
      // Ignored for resilience if Core API is offline
    });

    // 2. Call AI Orchestrator turn endpoint
    const orchestratorPayload = {
      turn_id: turnId,
      conversation_id: conversationId,
      customer_id: customerId,
      channel,
      message_id: messageId,
      message,
      language: 'en',
      authentication_level: authenticationLevel,
    };

    const aiResponse = await fetch(`${AI_ORCHESTRATOR_URL}/internal/v1/assistant/turns`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Correlation-ID': correlationId,
      },
      body: JSON.stringify(orchestratorPayload),
    });

    if (!aiResponse.ok || !aiResponse.body) {
      return NextResponse.json(
        { error: 'Failed to communicate with AI Orchestrator' },
        { status: 502 }
      );
    }

    // 3. Return streaming SSE response to browser
    return new Response(aiResponse.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message || 'Internal error' },
      { status: 500 }
    );
  }
}
