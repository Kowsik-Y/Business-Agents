import { Controller, Get, Query, Inject } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { DevicesService } from './devices.service.js';

@ApiTags('devices')
@Controller('internal/v1/devices')
export class DevicesController {
  constructor(@Inject(DevicesService) private readonly devicesService: DevicesService) {}

  @Get('telemetry')
  @ApiOperation({ summary: 'Get canonical device telemetry and network diagnostic status' })
  @ApiQuery({ name: 'customerId', description: 'Customer identifier', example: 'CUST-1001' })
  @ApiResponse({ status: 200, description: 'Device telemetry retrieved' })
  async getTelemetry(@Query('customerId') customerId: string) {
    return this.devicesService.getDeviceTelemetry(customerId || 'CUST-1001');
  }
}
