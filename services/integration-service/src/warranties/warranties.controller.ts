import { Controller, Get, Query, Inject } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { WarrantiesService } from './warranties.service.js';

@ApiTags('warranties')
@Controller('internal/v1/warranties')
export class WarrantiesController {
  constructor(@Inject(WarrantiesService) private readonly warrantiesService: WarrantiesService) {}

  @Get('eligibility')
  @ApiOperation({ summary: 'Check canonical hardware warranty and RMA eligibility' })
  @ApiQuery({ name: 'customerId', description: 'Customer identifier', example: 'CUST-1001' })
  @ApiResponse({ status: 200, description: 'Warranty eligibility retrieved' })
  async checkEligibility(@Query('customerId') customerId: string) {
    return this.warrantiesService.getWarrantyEligibility(customerId || 'CUST-1001');
  }
}
