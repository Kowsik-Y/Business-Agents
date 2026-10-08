import { Injectable } from '@nestjs/common';

export interface WarrantyEligibility {
  warrantyId: string;
  customerId: string;
  hardwareModel: string;
  serialNumber: string;
  coverageType: string;
  isCovered: boolean;
  rmaEligible: boolean;
  startDate: string;
  expirationDate: string;
  replacementOption: string;
}

@Injectable()
export class WarrantiesService {
  async getWarrantyEligibility(customerId: string): Promise<WarrantyEligibility> {
    return {
      warrantyId: 'WAR-7741',
      customerId: customerId || 'CUST-1001',
      hardwareModel: 'Enterprise AI Gateway Hub X-2000',
      serialNumber: 'SN-GW-98214',
      coverageType: '2-Year Advanced Replacement Warranty',
      isCovered: true,
      rmaEligible: true,
      startDate: '2025-01-15T00:00:00Z',
      expirationDate: '2027-01-15T00:00:00Z',
      replacementOption: 'Instant Overnight Express Freight RMA',
    };
  }
}
