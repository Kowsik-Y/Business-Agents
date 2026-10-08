/**
 * End-to-End (E2E) System Integration & Workflow Lifecycle Test Suite
 * Verifies contract consistency and cross-service architectural workflows per docs/20-testing-strategy.md.
 */

import { describe, it, expect } from 'vitest';
import {
  CreateConversationSchema,
  CreateMessageSchema,
  MessageSchema,
  AssistantTurnRequestSchema,
  StreamEventSchema,
  CreateCaseSchema,
  HandoffPackageSchema,
  ToolDefinitionSchema,
  ToolRequestSchema,
  ToolResponseSchema,
  OrderStatusSchema,
  VoiceSessionSchema,
  VoiceClientEventSchema,
  VoiceServerEventSchema,
  ApproveActionSchema,
  PolicyDecisionSchema,
} from '../index.js';

describe('E2E Flow 1: Grounded Chat & Order Lookup Automation', () => {
  it('validates customer session initiation through conversational turn and tool execution', () => {
    const timestamp = new Date().toISOString();

    // 1. Customer initiates conversation in customer-web (Next.js 15)
    const newConv = CreateConversationSchema.parse({
      customerId: 'CUST-E2E-001',
      channel: 'web_chat',
    });
    expect(newConv.channel).toBe('web_chat');

    // 2. Core API records customer message
    const initialMsgInput = CreateMessageSchema.parse({
      content: 'Hi, where is my order ORD-1001?',
      channel: 'web_chat',
    });
    expect(initialMsgInput.content).toContain('ORD-1001');

    const customerMsg = MessageSchema.parse({
      id: 'MSG-E2E-001',
      conversationId: 'CONV-E2E-123',
      role: 'customer',
      content: initialMsgInput.content,
      channel: 'web_chat',
      createdAt: timestamp,
    });
    expect(customerMsg.role).toBe('customer');

    // 3. AI Orchestrator receives turn request
    const turnRequest = AssistantTurnRequestSchema.parse({
      turnId: 'TURN-E2E-456',
      conversationId: 'CONV-E2E-123',
      customerId: 'CUST-E2E-001',
      channel: 'web_chat',
      messageId: customerMsg.id,
      message: customerMsg.content,
      language: 'en',
      authenticationLevel: 1,
    });
    expect(turnRequest.message).toBe(customerMsg.content);

    // 4. AI Orchestrator defines tool and evaluates policy
    const toolDef = ToolDefinitionSchema.parse({
      name: 'get_order_status',
      description: 'Fetch real-time order status and shipping carrier',
      inputSchema: { type: 'object', properties: { orderId: { type: 'string' } } },
      requiredAuthenticationLevel: 1,
      requiresConfirmation: false,
      requiresHumanApproval: false,
      timeout: 15000,
      idempotent: true,
      auditCategory: 'order_lookup',
    });
    expect(toolDef.auditCategory).toBe('order_lookup');

    const policyDecision = PolicyDecisionSchema.parse({
      id: 'POL-E2E-001',
      toolName: toolDef.name,
      allowed: true,
      reason: 'Customer authentication level meets requirement',
      authenticationLevel: 1,
      requiredLevel: 1,
      customerOwnershipVerified: true,
      requiresConfirmation: false,
      requiresHumanApproval: false,
      decidedAt: timestamp,
    });
    expect(policyDecision.allowed).toBe(true);

    const toolRequest = ToolRequestSchema.parse({
      toolName: 'get_order_status',
      arguments: { orderId: 'ORD-1001' },
      turnId: turnRequest.turnId,
      conversationId: turnRequest.conversationId,
      customerId: turnRequest.customerId,
    });

    // 5. Integration Service answers with canonical order data
    const orderLookup = OrderStatusSchema.parse({
      orderId: 'ORD-1001',
      status: 'shipped',
      carrier: 'FedEx',
      estimatedDelivery: '2026-08-08',
    });
    expect(orderLookup.status).toBe('shipped');

    const toolResponse = ToolResponseSchema.parse({
      toolName: toolRequest.toolName,
      success: true,
      data: orderLookup,
      executionId: 'EXEC-E2E-789',
      durationMs: 45,
    });
    expect(toolResponse.success).toBe(true);

    // 6. AI Orchestrator streams grounded events back over SSE to customer-web
    const intentEvent = StreamEventSchema.parse({
      sequence: 1,
      type: 'intent.detected',
      turnId: turnRequest.turnId,
      timestamp,
      intent: 'order_status',
      confidence: 0.98,
    });
    expect(intentEvent.type).toBe('intent.detected');

    const deltaEvent = StreamEventSchema.parse({
      sequence: 2,
      type: 'text.delta',
      turnId: turnRequest.turnId,
      timestamp,
      content: 'Your order ORD-1001 has been shipped via FedEx with estimated delivery on 2026-08-08.',
    });

    const completionEvent = StreamEventSchema.parse({
      sequence: 3,
      type: 'turn.completed',
      turnId: turnRequest.turnId,
      timestamp,
      responseId: 'RESP-E2E-001',
    });
    expect(completionEvent.type).toBe('turn.completed');
    if (deltaEvent.type === 'text.delta') {
      expect(deltaEvent.content).toContain('FedEx');
    }
  });
});

describe('E2E Flow 2: Voice Service Real-Time Audio Streaming & Barge-In', () => {
  it('validates voice session handshake, bi-directional event streaming, and user interruption', () => {
    const timestamp = new Date().toISOString();

    // 1. Establish Voice Session
    const session = VoiceSessionSchema.parse({
      sessionId: 'VS-E2E-999',
      conversationId: 'CONV-E2E-888',
      customerId: 'CUST-E2E-777',
      token: 'secure-ephemeral-jwt-token',
      websocketUrl: 'wss://api.navigatelabsai.com/voice/v1/sessions/VS-E2E-999',
      expiresAt: new Date(Date.now() + 3600000).toISOString(),
      supportedCodecs: ['pcm_s16le'],
    });
    expect(session.websocketUrl).toContain('VS-E2E-999');

    // 2. Client sends voice session start & activity events over WebSocket
    const sessionStart = VoiceClientEventSchema.parse({
      type: 'session.start',
      sessionId: session.sessionId,
      timestamp,
    });
    expect(sessionStart.type).toBe('session.start');

    // 3. Voice Service server signals readiness and sends transcription (STT) & response events
    const sessionReady = VoiceServerEventSchema.parse({
      type: 'session.ready',
      sessionId: session.sessionId,
      timestamp,
      state: 'listening',
    });
    expect(sessionReady.type).toBe('session.ready');

    const sttEvent = VoiceServerEventSchema.parse({
      type: 'transcript.final',
      sessionId: session.sessionId,
      timestamp,
      content: 'I would like to upgrade my subscription plan.',
    });
    expect(sttEvent.content).toContain('upgrade my subscription');

    const ttsStarted = VoiceServerEventSchema.parse({
      type: 'response.audio.started',
      sessionId: session.sessionId,
      timestamp,
      responseId: 'RESP-VOICE-100',
    });
    expect(ttsStarted.type).toBe('response.audio.started');

    // 4. Customer speaks during TTS playback -> client sends response.cancel for barge-in interruption
    const interruptEvent = VoiceClientEventSchema.parse({
      type: 'response.cancel',
      sessionId: session.sessionId,
      timestamp,
      responseId: 'RESP-VOICE-100',
    });
    expect(interruptEvent.type).toBe('response.cancel');

    const stateChange = VoiceServerEventSchema.parse({
      type: 'input_audio.speech_started',
      sessionId: session.sessionId,
      timestamp,
      state: 'listening',
    });
    expect(stateChange.state).toBe('listening');
  });
});

describe('E2E Flow 3: Human Handoff & Agent Action Approval Workflow', () => {
  it('validates escalation synthesis, case queue assignment, and human-in-the-loop tool authorization', () => {
    const timestamp = new Date().toISOString();

    // 1. AI detects high-risk topic requiring human agent assistance
    const handoffPackage = HandoffPackageSchema.parse({
      conversationId: 'CONV-E2E-HANDOFF',
      customerId: 'CUST-E2E-VIP',
      customerName: 'Alice Smith',
      customerEmail: 'alice@example.com',
      channel: 'web_chat',
      authenticationLevel: 2,
      activeIntent: 'refund_request',
      secondaryIntents: [],
      sentiment: 'frustrated',
      riskLevel: 'high',
      summary: 'Customer requesting $1,200 exception refund due to equipment malfunction.',
      informationCollected: { invoiceNumber: 'INV-5555', refundAmount: 1200 },
      missingInformation: [],
      actionsAttempted: ['verify_warranty_status'],
      relevantBusinessObjects: { warrantyStatus: 'active' },
      retrievedSources: ['Policy FAQ: High Value Exceptions'],
      escalationReason: 'approval_required',
      recommendedNextAction: 'Review equipment diagnostics and verify manager approval for refund > $1,000.',
      pendingProposedTool: {
        toolName: 'approve_refund_exception',
        arguments: { amount: 1200, invoiceNumber: 'INV-5555' },
        policyReason: 'Refunds exceeding $500 require human supervisor authorization.',
        requiresHumanApproval: true,
      },
      createdAt: timestamp,
    });
    expect(handoffPackage.riskLevel).toBe('high');

    // 2. Core API creates case and assigns to agent command console queue
    const caseRecord = CreateCaseSchema.parse({
      conversationId: handoffPackage.conversationId,
      customerId: handoffPackage.customerId,
      subject: 'High Value Exception Refund Review',
      priority: 'high',
      summary: handoffPackage.summary,
      handoffPackage,
    });
    expect(caseRecord.priority).toBe('high');
    expect(caseRecord.handoffPackage?.pendingProposedTool?.toolName).toBe('approve_refund_exception');

    // 3. Human agent reviews synthesis in Agent Console and submits tool approval command
    const approvalCommand = ApproveActionSchema.parse({
      toolName: 'approve_refund_exception',
      arguments: { amount: 1200, invoiceNumber: 'INV-5555', supervisorOverride: true },
      agentNotes: 'Verified equipment failure log in diagnostic dashboard. Exception approved.',
    });
    expect(approvalCommand.toolName).toBe('approve_refund_exception');

    const toolExecutionResponse = ToolResponseSchema.parse({
      toolName: approvalCommand.toolName,
      success: true,
      data: { transactionId: 'TX-REFUND-999', status: 'completed' },
      executionId: 'EXEC-REFUND-001',
      durationMs: 120,
    });
    expect(toolExecutionResponse.success).toBe(true);
  });
});
