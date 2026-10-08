import { Module, Global } from '@nestjs/common';
import { WebSocketService } from './websocket.service.js';

@Global()
@Module({
  providers: [WebSocketService],
  exports: [WebSocketService],
})
export class WebSocketModule {}
