import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const VOICE_SERVICE_URL = process.env.VOICE_SERVICE_URL || 'http://localhost:8004';

export async function POST(request: Request) {
  try {
    const body = ((await request.json().catch(() => ({}))) || {}) as {
      conversationId?: string;
      customerId?: string;
    };
    const conversationId = body.conversationId || `conv_voice_${Date.now()}`;
    const customerId = body.customerId || 'cust_web_user';

    const response = await fetch(`${VOICE_SERVICE_URL}/internal/v1/voice/sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        conversation_id: conversationId,
        customer_id: customerId,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      return NextResponse.json(data);
    }

    // Fallback response for direct connection
    const fallbackId = `vsession_${Date.now()}`;
    return NextResponse.json({
      session_id: fallbackId,
      conversation_id: conversationId,
      customer_id: customerId,
      token: `vtoken_${fallbackId}`,
      ws_url: `ws://localhost:8004/voice/v1/sessions/${fallbackId}`,
      state: 'connecting',
    });
  } catch {
    const fallbackId = `vsession_${Date.now()}`;
    return NextResponse.json({
      session_id: fallbackId,
      conversation_id: 'conv_voice_local',
      customer_id: 'cust_web_user',
      token: `vtoken_${fallbackId}`,
      ws_url: `ws://localhost:8004/voice/v1/sessions/${fallbackId}`,
      state: 'connecting',
    });
  }
}
