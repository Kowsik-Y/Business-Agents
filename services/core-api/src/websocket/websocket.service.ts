/**
 * Real-time WebSocket Service for Core API
 * Handles live bidirectional events for chat, cases, human escalation, and tool approvals.
 */
import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { WebSocketServer, WebSocket } from 'ws';
import type { IncomingMessage, Server } from 'http';
import { createLogger } from '@csp/logger';

const logger = createLogger('core-api').child({ module: 'websocket' });

interface ClientMetadata {
  conversationId?: string;
  clientId: string;
  role: 'customer' | 'agent' | 'admin';
}

@Injectable()
export class WebSocketService implements OnModuleDestroy {
  private wss: WebSocketServer | null = null;
  private clients = new Map<WebSocket, ClientMetadata>();

  initialize(server: Server) {
    this.wss = new WebSocketServer({ server, path: '/ws' });

    this.wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
      const url = new URL(req.url || '', `http://${req.headers.host || 'localhost'}`);
      const conversationId = url.searchParams.get('conversationId') || undefined;
      const role = (url.searchParams.get('role') as 'customer' | 'agent' | 'admin') || 'customer';
      const clientId = `client_${Math.random().toString(36).substring(2, 9)}`;

      const meta: ClientMetadata = { conversationId, role, clientId };
      this.clients.set(ws, meta);

      logger.info('WebSocket client connected', { clientId, conversationId, role });

      // Send connection acknowledgement
      ws.send(
        JSON.stringify({
          type: 'connected',
          clientId,
          conversationId,
          timestamp: new Date().toISOString(),
        }),
      );

      ws.on('message', (rawData) => {
        try {
          const data = JSON.parse(rawData.toString());
          if (data.type === 'join' && data.conversationId) {
            meta.conversationId = data.conversationId;
            ws.send(
              JSON.stringify({
                type: 'joined',
                conversationId: data.conversationId,
              }),
            );
          } else if (data.type === 'ping') {
            ws.send(JSON.stringify({ type: 'pong' }));
          }
        } catch {
          // ignore non-json
        }
      });

      ws.on('close', () => {
        this.clients.delete(ws);
        logger.info('WebSocket client disconnected', { clientId });
      });

      ws.on('error', (err) => {
        logger.warn('WebSocket error', { clientId, error: err.message });
      });
    });

    logger.info('WebSocket Server initialized on path /ws');
  }

  /**
   * Broadcast an event to all subscribers of a specific conversation (or all connected clients if no conversationId)
   */
  broadcast(event: {
    type: string;
    conversationId?: string;
    caseId?: string;
    message?: any;
    data?: any;
    timestamp?: string;
  }) {
    if (!this.wss) return;

    const payload = JSON.stringify({
      ...event,
      timestamp: event.timestamp || new Date().toISOString(),
    });

    for (const [ws, meta] of this.clients.entries()) {
      if (ws.readyState === WebSocket.OPEN) {
        // Send if global broadcast OR matching conversation OR agent monitoring
        if (!event.conversationId || meta.conversationId === event.conversationId || meta.role === 'agent' || meta.role === 'admin') {
          try {
            ws.send(payload);
          } catch (err) {
            logger.warn('Failed to send WebSocket message', { clientId: meta.clientId, error: String(err) });
          }
        }
      }
    }
  }

  onModuleDestroy() {
    if (this.wss) {
      this.wss.close();
      this.wss = null;
    }
  }
}
