import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const CORE_API_URL = process.env.CORE_API_URL || 'http://localhost:8000';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const response = await fetch(`${CORE_API_URL}/v1/conversations/${id}`, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();
      return NextResponse.json(data);
    }

    return NextResponse.json({ id, messages: [] });
  } catch {
    const { id } = await params;
    return NextResponse.json({ id, messages: [] });
  }
}
