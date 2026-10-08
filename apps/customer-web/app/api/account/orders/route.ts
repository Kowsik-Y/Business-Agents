import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * BFF route to proxy customer order retrieval to Integration Service.
 * GET /api/account/orders?customerId=CUST-XXXX
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const customerId = searchParams.get('customerId');

  if (!customerId) {
    return NextResponse.json({ error: 'customerId is required' }, { status: 400 });
  }

  try {
    const integrationUrl = process.env.INTEGRATION_SERVICE_URL || 'http://localhost:8003';
    const response = await fetch(
      `${integrationUrl}/internal/v1/orders?customerId=${encodeURIComponent(customerId)}`,
      { cache: 'no-store' }
    );

    if (!response.ok) {
      return NextResponse.json({ orders: [], count: 0 });
    }

    const orders = await response.json();
    return NextResponse.json({ orders, count: Array.isArray(orders) ? orders.length : 0 });
  } catch {
    return NextResponse.json({ orders: [], count: 0 });
  }
}
