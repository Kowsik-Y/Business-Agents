import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

const CORE_API_URL = process.env.CORE_API_URL || 'http://localhost:8000';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const body = await req.json().catch(() => ({}));
    const { conversationId, content, role = 'agent', channel = 'web_chat' } = body;

    const targetConvId = conversationId || id;

    try {
      const res = await fetch(`${CORE_API_URL}/v1/conversations/${targetConvId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          role,
          channel,
        }),
        signal: AbortSignal.timeout(3000),
      });

      if (res.ok) {
        const data = await res.json();
        return NextResponse.json({ ...data, _fallback: false }, { status: 201 });
      }
      const err = await res.json().catch(() => ({}));
      return NextResponse.json(err, { status: res.status });
    } catch {
      // Fallback response for offline preview
      return NextResponse.json({
        id: `msg-${Date.now()}`,
        conversationId: id,
        role: body.role || 'agent',
        content: body.content || '',
        channel: body.channel || 'web_chat',
        createdAt: new Date().toISOString(),
        _fallback: true,
      }, { status: 201 });
    }
  } catch (err) {
    console.error('POST /api/cases/[id]/messages error:', err);
    return NextResponse.json({ error: 'Failed to create message' }, { status: 500 });
  }
}
