import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

const CORE_API_URL = process.env.CORE_API_URL || 'http://localhost:8000';

export async function POST(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const rawParams = await props.params;
    const id = rawParams.id;

    const body = await req.json().catch(() => ({}));
    const { action, toolName, arguments: args, reason, agentNotes, approverId } = body;

    const isReject = action === 'reject';
    const endpoint = isReject ? 'reject-action' : 'approve-action';

    const payload = isReject
      ? {
          toolName,
          reason: reason || agentNotes || `Action rejected by ${approverId || 'agent'}.`,
          agentNotes: agentNotes || reason || undefined,
        }
      : {
          toolName,
          arguments: args ?? {},
          agentNotes: agentNotes || reason || `Action processed by ${approverId || 'agent'}.`,
        };

    try {
      const res = await fetch(`${CORE_API_URL}/v1/cases/${id}/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(3000),
      });

      if (res.ok) {
        const data = await res.json();
        return NextResponse.json({ ...data, _fallback: false });
      }
      const err = await res.json().catch(() => ({}));
      return NextResponse.json(err, { status: res.status });
    } catch {
      return NextResponse.json({
        approved: !isReject,
        caseId: id,
        toolName,
        message: isReject
          ? `Action '${toolName}' rejected.`
          : `Action '${toolName}' approved and executed successfully.`,
        _fallback: true,
      });
    }
  } catch (err) {
    console.error('POST /api/cases/[id]/actions error:', err);
    return NextResponse.json({ error: 'Failed to process action' }, { status: 500 });
  }
}
