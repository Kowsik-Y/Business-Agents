import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * BFF route to proxy customer subscription retrieval to Integration Service.
 * GET /api/account/subscription?customerId=CUST-XXXX
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const customerId = searchParams.get('customerId') || 'CUST-1001';

  try {
    const integrationUrl = process.env.INTEGRATION_SERVICE_URL || 'http://localhost:8003';
    const response = await fetch(
      `${integrationUrl}/internal/v1/subscriptions?customerId=${encodeURIComponent(customerId)}`,
      { cache: 'no-store' }
    );

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch subscription details' }, { status: 502 });
    }

    const subscription = await response.json();
    return NextResponse.json({ subscription });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
