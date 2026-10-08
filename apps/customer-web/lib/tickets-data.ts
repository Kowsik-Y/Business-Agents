export interface TicketMessage {
  id: string;
  sender: string;
  role: 'system' | 'client' | 'agent';
  timestamp: string;
  content: string;
  avatar?: string;
  isAlert?: boolean;
}

export interface TicketItem {
  id: string;
  ticketNumber: string;
  title: string;
  description: string;
  client: string;
  reportedBy: string;
  reporterEmail: string;
  createdAt: string;
  timeAgo: string;
  status: 'open' | 'in_progress' | 'resolved' | 'requires_action';
  priority: 'high' | 'normal' | 'low' | 'urgent';
  category: 'Tech' | 'Billing' | 'Logistics' | 'Integration';
  assignee: string;
  slaRemaining: string;
  aiSummary: string;
  suggestedAction: string;
  messages: TicketMessage[];
}

export const MOCK_TICKETS: TicketItem[] = [
  {
    id: 't-1',
    ticketNumber: '#SR-9942',
    title: 'API Rate Limit Exceeded on Production',
    description: 'Customer experiencing 429 errors when attempting to batch process invoices for Q3 close.',
    client: 'Acme Corp',
    reportedBy: 'Sarah Jenkins',
    reporterEmail: 'sarah.j@acme-corp.com',
    createdAt: 'Oct 24, 14:32 PST',
    timeAgo: '10m ago',
    status: 'requires_action',
    priority: 'high',
    category: 'Tech',
    assignee: 'AI Agent Alpha',
    slaRemaining: '1h 45m',
    aiSummary:
      "The client's integration service (IP: 192.168.1.105) is hitting the `v2/invoices/batch` endpoint 15x higher than their provisioned tier limit (100 req/min). Log analysis indicates a recursive retry loop following a momentary network timeout at 14:30 PST.",
    suggestedAction: 'Temporary 30-minute quota burst approved via LangGraph policy node.',
    messages: [
      {
        id: 'm-1',
        sender: 'System Alert',
        role: 'system',
        timestamp: '14:32 PST',
        content: '[ALERT] Threshold exceeded: 1,542 requests/min on tenant_id: acme_449. Automatic throttling engaged.',
        isAlert: true,
      },
      {
        id: 'm-2',
        sender: 'Sarah Jenkins',
        role: 'client',
        timestamp: '14:45 PST',
        content:
          "Hi team, our end-of-month invoice processing job is failing repeatedly with 429 errors. We haven't changed our sync script. Can someone look into this ASAP? It's blocking revenue recognition.",
      },
      {
        id: 'm-3',
        sender: 'Concierge AI',
        role: 'agent',
        timestamp: '14:46 PST',
        content:
          "Hello Sarah, we detected the burst in batch requests from your worker node. I've initiated a temporary quota increase while your team adjusts the exponential backoff parameters.",
      },
    ],
  },
  {
    id: 't-2',
    ticketNumber: '#SR-9941',
    title: 'Billing Address Update Failed',
    description: "UI shows success but database doesn't reflect the new postal code on invoice generation.",
    client: 'Global Logistics Inc',
    reportedBy: 'Jordan Taylor',
    reporterEmail: 'jordan.t@globallogistics.com',
    createdAt: 'Oct 24, 13:15 PST',
    timeAgo: '1h ago',
    status: 'in_progress',
    priority: 'normal',
    category: 'Billing',
    assignee: 'Billing Bot Beta',
    slaRemaining: '4h 10m',
    aiSummary:
      'Stripe customer metadata sync was desynchronized due to postal code regex validation mismatch on international ISO-3166 address schemas.',
    suggestedAction: 'Address updated and re-verified against USPS address cleansing service.',
    messages: [
      {
        id: 'm-21',
        sender: 'Jordan Taylor',
        role: 'client',
        timestamp: '13:15 PST',
        content: 'I updated our VAT address in the billing portal but the receipt still showed our old branch location.',
      },
      {
        id: 'm-22',
        sender: 'Concierge AI',
        role: 'agent',
        timestamp: '13:18 PST',
        content: 'We have resynchronized your account record with the Stripe billing engine. A corrected receipt #INV-9021 has been emailed.',
      },
    ],
  },
  {
    id: 't-3',
    ticketNumber: '#SR-9938',
    title: 'Request for Custom Report Integration',
    description: 'Need assistance connecting Snowflake data warehouse to the dashboard analytics module.',
    client: 'Starlight Analytics',
    reportedBy: 'David Kim',
    reporterEmail: 'david.k@starlight.io',
    createdAt: 'Oct 24, 10:00 PST',
    timeAgo: '4h ago',
    status: 'open',
    priority: 'low',
    category: 'Integration',
    assignee: 'Unassigned',
    slaRemaining: '18h 00m',
    aiSummary:
      'Standard Snowflake JDBC connector schema mapped. Awaiting customer staging token approval.',
    suggestedAction: 'Provide standard OAuth2 client connection credentials guide.',
    messages: [
      {
        id: 'm-31',
        sender: 'David Kim',
        role: 'client',
        timestamp: '10:00 PST',
        content: 'Hi, we are setting up our daily telemetry sync with Snowflake. Can you share the IP allowlist and required permissions?',
      },
    ],
  },
  {
    id: 't-4',
    ticketNumber: '#SR-9932',
    title: 'Expedited Order Tracking Inconsistency',
    description: 'Carrier tracking status stuck in transit for 48 hours for expedited hardware delivery.',
    client: 'Nexus Cloud Systems',
    reportedBy: 'Elena Rostova',
    reporterEmail: 'elena@nexuscloud.de',
    createdAt: 'Oct 23, 16:20 PST',
    timeAgo: '1d ago',
    status: 'resolved',
    priority: 'normal',
    category: 'Logistics',
    assignee: 'Logistics Agent Delta',
    slaRemaining: 'Completed',
    aiSummary: 'FedEx webhook update received. Package cleared customs and scheduled for delivery tomorrow 10:00 AM.',
    suggestedAction: 'Ticket resolved automatically upon courier status confirmation.',
    messages: [
      {
        id: 'm-41',
        sender: 'Elena Rostova',
        role: 'client',
        timestamp: 'Oct 23, 16:20 PST',
        content: 'Order #ORD-8844 has been showing In Transit with no scan updates for two days.',
      },
      {
        id: 'm-42',
        sender: 'Concierge AI',
        role: 'agent',
        timestamp: 'Oct 23, 16:25 PST',
        content: 'Checked with FedEx international dispatch. Clearance completed in Frankfurt; estimated delivery is on schedule.',
      },
    ],
  },
];
