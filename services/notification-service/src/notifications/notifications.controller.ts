import { Controller, Post, Get, Body, Param, Inject, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service.js';
import { NotificationRequestSchema } from './notifications.dto.js';

@ApiTags('notifications')
@Controller('internal/v1/notifications')
export class NotificationsController {
  constructor(@Inject(NotificationsService) private readonly service: NotificationsService) {}

  @Post()
  @ApiOperation({ summary: 'Send a transactional notification' })
  @ApiResponse({ status: 201, description: 'Notification queued or sent successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request or unknown template' })
  async create(@Body() body: unknown) {
    const parsed = NotificationRequestSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException({
        error: 'Invalid notification request',
        issues: parsed.error.issues,
      });
    }
    return this.service.sendNotification(parsed.data);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Retrieve notification status by ID' })
  @ApiResponse({ status: 200, description: 'Notification record found' })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  async findOne(@Param('id') id: string) {
    return this.service.getNotification(id);
  }
}
