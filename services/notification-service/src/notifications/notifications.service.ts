import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { createLogger } from '@csp/logger';
import type { NotificationRequest, NotificationRecord } from './notifications.dto.js';

const logger = createLogger('notification-service').child({ module: 'notifications' });

interface TemplateDefinition {
  subject: string;
  body: string;
}

@Injectable()
export class NotificationsService {
  private readonly store: Map<string, NotificationRecord> = new Map();
  private readonly idempotencyCache: Map<string, NotificationRecord> = new Map();
  private readonly suppressionList: Set<string> = new Set(['suppressed@example.com', 'CUST-BLOCKED']);

  // Pre-configured versioned templates for transactional domain events
  private readonly templates: Record<string, Record<string, TemplateDefinition>> = {
    en: {
      'order-shipped': {
        subject: 'Your order {{orderId}} has shipped!',
        body: 'Hello, your order {{orderId}} is on its way via {{carrier}}. Tracking Number: {{trackingNumber}}.',
      },
      'warranty-claim-created': {
        subject: 'Warranty Claim Registered: {{claimId}}',
        body: 'We have received your warranty claim {{claimId}} for item {{itemName}}. Next step: {{nextStep}}',
      },
      'warranty-claim-approved': {
        subject: 'Warranty Claim Approved: {{claimId}}',
        body: 'Good news! Your warranty claim {{claimId}} has been approved by our specialist team. Your prepaid replacement shipping label is ready: {{labelUrl}}.',
      },
      'refund-review': {
        subject: 'Refund Processing for Order {{orderId}}',
        body: 'Your refund request of ${{amount}} for order {{orderId}} is currently under review by our senior finance specialists.',
      },
      'refund-processed': {
        subject: 'Refund Approved & Processed: Order {{orderId}}',
        body: 'Your refund of ${{amount}} for order {{orderId}} has been approved and posted back to your payment method.',
      },
      'human-handoff-notification': {
        subject: 'Support Ticket #{{caseId}} Escalated to Live Specialist',
        body: 'Your inquiry has been matched with a dedicated Tier 2 Customer Success Specialist. Estimated wait time: {{waitTime}}.',
      },
    },
  };

  /**
   * Render template variables replacing {{var}} syntax
   */
  private renderTemplate(templateStr: string, variables: Record<string, unknown>): string {
    return templateStr.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (match, key) => {
      return variables[key] !== undefined ? String(variables[key]) : match;
    });
  }

  /**
   * Dispatch a transactional notification with idempotency and suppression checks
   */
  async sendNotification(req: NotificationRequest): Promise<NotificationRecord> {
    logger.info('Processing notification request', {
      channel: req.channel,
      template: req.template,
      recipient: req.recipient,
      idempotencyKey: req.idempotencyKey,
    });

    // 1. Check idempotency key
    if (req.idempotencyKey && this.idempotencyCache.has(req.idempotencyKey)) {
      const existing = this.idempotencyCache.get(req.idempotencyKey)!;
      logger.info('Returning cached idempotent notification', { id: existing.id });
      return existing;
    }

    // 2. Check suppression opt-out list
    const isSuppressed =
      this.suppressionList.has(req.recipient.customerId) ||
      (req.recipient.email && this.suppressionList.has(req.recipient.email));

    if (isSuppressed) {
      logger.warn('Recipient is suppressed; dropping notification', { recipient: req.recipient });
      const record: NotificationRecord = {
        id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        channel: req.channel,
        template: req.template,
        locale: req.locale,
        recipient: req.recipient,
        renderedSubject: '',
        renderedBody: '',
        status: 'suppressed',
        errorReason: 'Recipient opt-out or blocklist',
        idempotencyKey: req.idempotencyKey,
        createdAt: new Date().toISOString(),
      };
      this.store.set(record.id, record);
      if (req.idempotencyKey) this.idempotencyCache.set(req.idempotencyKey, record);
      return record;
    }

    // 3. Lookup template and render
    const fallbackLocale = this.templates['en'] || {};
    const localeTemplates = this.templates[req.locale] || fallbackLocale;
    const templateDef = localeTemplates[req.template] || fallbackLocale[req.template];

    if (!templateDef) {
      throw new BadRequestException(`Template '${req.template}' not found for locale '${req.locale}'`);
    }

    const renderedSubject = this.renderTemplate(templateDef.subject, req.variables);
    const renderedBody = this.renderTemplate(templateDef.body, req.variables);

    // 4. Simulate delivery success
    const record: NotificationRecord = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      channel: req.channel,
      template: req.template,
      locale: req.locale,
      recipient: req.recipient,
      renderedSubject,
      renderedBody,
      status: 'delivered',
      idempotencyKey: req.idempotencyKey,
      createdAt: new Date().toISOString(),
    };

    this.store.set(record.id, record);
    if (req.idempotencyKey) {
      this.idempotencyCache.set(req.idempotencyKey, record);
    }

    logger.info('Notification successfully delivered', {
      id: record.id,
      status: record.status,
      subject: renderedSubject,
    });
    return record;
  }

  /**
   * Get notification details by ID
   */
  async getNotification(id: string): Promise<NotificationRecord> {
    const record = this.store.get(id);
    if (!record) {
      throw new NotFoundException(`Notification '${id}' not found`);
    }
    return record;
  }
}
