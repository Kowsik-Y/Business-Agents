/**
 * Unit tests for @csp/contracts — Zod schema validation
 */
import { describe, expect, it } from 'vitest';
import {
  ApiErrorSchema,
  AssistantTurnRequestSchema,
  CaseSchema,
  ConversationSchema,
  CreateMessageSchema,
  CustomerSchema,
  MessageSchema,
  OrderStatusSchema,
  PolicyDecisionSchema,
  ToolDefinitionSchema,
  ToolRequestSchema,
  VoiceClientEventSchema,
  VoiceServerEventSchema,
  VoiceSessionSchema,
} from '../index.js';

describe('ApiErrorSchema', () => {
  it('validates a correct error', () => {
    const result = ApiErrorSchema.safeParse({
      error: {
        code: 'ORDER_NOT_FOUND',
        message: 'The requested order could not be found.',
        correlationId: 'COR-100',
        details: {},
      },
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing code', () => {
    const result = ApiErrorSchema.safeParse({
      error: { message: 'no code' },
    });
    expect(result.success).toBe(false);
  });
});

describe('CustomerSchema', () => {
  it('validates a full customer', () => {
    const result = CustomerSchema.safeParse({
      id: 'CUST-1',
      email: 'test@example.com',
      name: 'Test User',
      authenticationLevel: 2,
      locale: 'en',
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid email', () => {
    const result = CustomerSchema.safeParse({
      id: 'CUST-1',
      email: 'not-an-email',
      authenticationLevel: 1,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid authentication level', () => {
    const result = CustomerSchema.safeParse({
      id: 'CUST-1',
      authenticationLevel: 5,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    });
    expect(result.success).toBe(false);
  });
});

describe('ConversationSchema', () => {
  it('validates a conversation', () => {
    const result = ConversationSchema.safeParse({
      id: 'CONV-1',
      customerId: 'CUST-1',
      status: 'active',
      channel: 'web_chat',
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid status', () => {
    const result = ConversationSchema.safeParse({
      id: 'CONV-1',
      customerId: 'CUST-1',
      status: 'invalid_status',
      channel: 'web_chat',
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    });
    expect(result.success).toBe(false);
  });
});

describe('CreateMessageSchema', () => {
  it('validates a message', () => {
    const result = CreateMessageSchema.safeParse({
      content: 'Where is my order?',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.channel).toBe('web_chat'); // default
    }
  });

  it('rejects empty content', () => {
    const result = CreateMessageSchema.safeParse({ content: '' });
    expect(result.success).toBe(false);
  });

  it('rejects content exceeding 4000 chars', () => {
    const result = CreateMessageSchema.safeParse({
      content: 'x'.repeat(4001),
    });
    expect(result.success).toBe(false);
  });
});

describe('MessageSchema', () => {
  it('validates a full message', () => {
    const result = MessageSchema.safeParse({
      id: 'MSG-1',
      conversationId: 'CONV-1',
      role: 'customer',
      content: 'Where is my order?',
      channel: 'web_chat',
      createdAt: '2026-01-01T00:00:00Z',
    });
    expect(result.success).toBe(true);
  });
});

describe('CaseSchema', () => {
  it('validates a case', () => {
    const result = CaseSchema.safeParse({
      id: 'CASE-1',
      conversationId: 'CONV-1',
      customerId: 'CUST-1',
      status: 'open',
      priority: 'medium',
      subject: 'Order inquiry',
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    });
    expect(result.success).toBe(true);
  });
});

describe('OrderStatusSchema', () => {
  it('validates the documented mock order', () => {
    const result = OrderStatusSchema.safeParse({
      orderId: 'ORD-1001',
      status: 'in_transit',
      carrier: 'Demo Logistics',
      estimatedDelivery: '2026-08-08',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid status', () => {
    const result = OrderStatusSchema.safeParse({
      orderId: 'ORD-1',
      status: 'flying',
    });
    expect(result.success).toBe(false);
  });
});

describe('AssistantTurnRequestSchema', () => {
  it('validates the documented example', () => {
    const result = AssistantTurnRequestSchema.safeParse({
      turnId: 'TURN-101',
      conversationId: 'CONV-200',
      customerId: 'CUST-300',
      channel: 'web_chat',
      messageId: 'MSG-400',
      message: 'Where is my order?',
      language: 'en-IN',
      authenticationLevel: 2,
      context: { recentOrderIds: ['ORD-500'] },
    });
    expect(result.success).toBe(true);
  });
});

describe('ToolDefinitionSchema', () => {
  it('validates a tool definition', () => {
    const result = ToolDefinitionSchema.safeParse({
      name: 'get_order_status',
      description: 'Retrieve order status',
      inputSchema: { type: 'object', properties: { orderId: { type: 'string' } } },
      requiredAuthenticationLevel: 1,
      requiresConfirmation: false,
      requiresHumanApproval: false,
      timeout: 15000,
      idempotent: true,
      auditCategory: 'order_lookup',
    });
    expect(result.success).toBe(true);
  });
});

describe('ToolRequestSchema', () => {
  it('validates a tool request', () => {
    const result = ToolRequestSchema.safeParse({
      toolName: 'get_order_status',
      arguments: { orderId: 'ORD-1001' },
      turnId: 'TURN-1',
      conversationId: 'CONV-1',
      customerId: 'CUST-1',
    });
    expect(result.success).toBe(true);
  });
});

describe('PolicyDecisionSchema', () => {
  it('validates an allowed decision', () => {
    const result = PolicyDecisionSchema.safeParse({
      id: 'POL-1',
      toolName: 'get_order_status',
      allowed: true,
      reason: 'Customer owns the order',
      authenticationLevel: 2,
      requiredLevel: 1,
      customerOwnershipVerified: true,
      requiresConfirmation: false,
      requiresHumanApproval: false,
      decidedAt: '2026-01-01T00:00:00Z',
    });
    expect(result.success).toBe(true);
  });
});

describe('VoiceSessionSchema', () => {
  it('validates a voice session', () => {
    const result = VoiceSessionSchema.safeParse({
      sessionId: 'VS-1',
      conversationId: 'CONV-1',
      customerId: 'CUST-1',
      token: 'short-lived-token',
      websocketUrl: 'wss://localhost:8300/voice/v1/sessions/VS-1',
      expiresAt: '2026-01-01T01:00:00Z',
      supportedCodecs: ['pcm_s16le'],
    });
    expect(result.success).toBe(true);
  });
});

describe('VoiceClientEventSchema', () => {
  it('validates a session.start event', () => {
    const result = VoiceClientEventSchema.safeParse({
      type: 'session.start',
      sessionId: 'VS-1',
      timestamp: '2026-01-01T00:00:00Z',
    });
    expect(result.success).toBe(true);
  });
});

describe('VoiceServerEventSchema', () => {
  it('validates a transcript.final event', () => {
    const result = VoiceServerEventSchema.safeParse({
      type: 'transcript.final',
      sessionId: 'VS-1',
      timestamp: '2026-01-01T00:00:00Z',
      content: 'Where is my order?',
    });
    expect(result.success).toBe(true);
  });
});
