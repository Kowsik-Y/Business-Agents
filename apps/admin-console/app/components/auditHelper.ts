'use client';

export interface AuditRecord {
  id: string;
  timestamp: string;
  domain: 'AI Tools' | 'Prompts' | 'Feature Flags' | 'Routing';
  action: string;
  author: string;
  approver?: string;
  version: string;
  status: 'Committed' | 'Pending 4-Eyes' | 'Rolled Back';
}

export const INITIAL_LOGS: AuditRecord[] = [
  { id: 'LOG-8901', timestamp: '2026-08-05 17:15:04', domain: 'Feature Flags', action: 'Enabled 24kHz High-Fidelity Voice Streaming across global cluster.', author: 'Kowsik Y. (Root Admin)', version: 'v7.4.2', status: 'Committed' },
  { id: 'LOG-8894', timestamp: '2026-08-05 16:40:12', domain: 'AI Tools', action: 'Upgraded process_refund minimum authentication level to Assurance Level 3.', author: 'Sarah Jenkins', approver: 'David Chen', version: 'v7.4.1', status: 'Committed' },
  { id: 'LOG-8882', timestamp: '2026-08-05 14:12:00', domain: 'Prompts', action: 'Staged System Prompt v7.5.0-RC1 for automated regression evaluation.', author: 'AI Alignment Pipeline', version: 'v7.5.0-RC1', status: 'Pending 4-Eyes' },
  { id: 'LOG-8871', timestamp: '2026-08-04 19:30:45', domain: 'Routing', action: 'Activated VIP SLA Fast-Path direct routing queue rules.', author: 'David Chen', approver: 'Sarah Jenkins', version: 'v7.3.9', status: 'Committed' },
  { id: 'LOG-8850', timestamp: '2026-08-03 11:22:15', domain: 'Prompts', action: 'Executed emergency rollback from v7.3.8 to v7.3.7 due to hallucination anomaly.', author: 'Kowsik Y. (Root Admin)', version: 'v7.3.7', status: 'Rolled Back' },
];

export function getAuditLogs(): AuditRecord[] {
  if (typeof window === 'undefined') return INITIAL_LOGS;
  const stored = localStorage.getItem('csp_admin_audit_logs');
  if (!stored) return INITIAL_LOGS;
  try {
    return JSON.parse(stored);
  } catch {
    return INITIAL_LOGS;
  }
}

export function recordAuditEvent(record: Omit<AuditRecord, 'id' | 'timestamp'>): AuditRecord {
  const current = getAuditLogs();
  const newRecord: AuditRecord = {
    ...record,
    id: `LOG-${Math.floor(1000 + Math.random() * 9000)}`,
    timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
  };
  const updated = [newRecord, ...current];
  if (typeof window !== 'undefined') {
    localStorage.setItem('csp_admin_audit_logs', JSON.stringify(updated));
  }
  return newRecord;
}
