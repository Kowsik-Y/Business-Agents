import { NextResponse } from 'next/server';

const CORE_API_URL = process.env.CORE_API_URL || 'http://localhost:8000';
const ORCHESTRATOR_URL = process.env.AI_ORCHESTRATOR_URL || 'http://localhost:8002';
const INTEGRATION_URL = process.env.INTEGRATION_SERVICE_URL || 'http://localhost:8003';

export async function GET() {
  const results = {
    coreApi: 'offline',
    orchestrator: 'offline',
    integrationService: 'offline',
    timestamp: new Date().toISOString(),
  };

  const checks = [
    fetch(`${CORE_API_URL}/health/ready`, { cache: 'no-store', signal: AbortSignal.timeout(1500) })
      .then((r) => r.ok ? r.json() : null)
      .then((d) => {
        if (d?.status === 'ok') results.coreApi = 'healthy';
        else if (d?.status) results.coreApi = d.status;
      })
      .catch(() => {}),

    fetch(`${ORCHESTRATOR_URL}/health/ready`, { cache: 'no-store', signal: AbortSignal.timeout(1500) })
      .then((r) => r.ok ? r.json() : null)
      .then((d) => {
        if (d?.status === 'ok') results.orchestrator = 'healthy';
        else if (d?.status) results.orchestrator = d.status;
      })
      .catch(() => {}),

    fetch(`${INTEGRATION_URL}/health/ready`, { cache: 'no-store', signal: AbortSignal.timeout(1500) })
      .then((r) => r.ok ? r.json() : null)
      .then((d) => {
        if (d?.status === 'ok') results.integrationService = 'healthy';
        else if (d?.status) results.integrationService = d.status;
      })
      .catch(() => {}),
  ];

  await Promise.allSettled(checks);

  return NextResponse.json(results);
}
