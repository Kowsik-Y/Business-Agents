import { NextResponse } from 'next/server';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

const CORE_API_URL = process.env.CORE_API_URL || 'http://localhost:8000';

export async function POST(request: Request) {
  try {
    const body = ((await request.json().catch(() => ({}))) || {}) as {
      customerId?: string;
      channel?: string;
    };
    const customerId = body.customerId || 'cust_anon_' + crypto.randomBytes(4).toString('hex');
    const channel = body.channel || 'web_chat';

    const response = await fetch(`${CORE_API_URL}/v1/conversations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Correlation-ID': crypto.randomUUID(),
      },
      body: JSON.stringify({
        customerId,
        channel,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      return NextResponse.json(data);
    }

    // Fallback if core API is offline
    const fallbackId = `conv_${crypto.randomUUID()}`;
    return NextResponse.json({
      id: fallbackId,
      customerId,
      channel,
      status: 'active',
      createdAt: new Date().toISOString(),
    });
  } catch {
    const fallbackId = `conv_${crypto.randomUUID()}`;
    return NextResponse.json({
      id: fallbackId,
      customerId: 'cust_local',
      channel: 'web_chat',
      status: 'active',
      createdAt: new Date().toISOString(),
    });
  }
}
