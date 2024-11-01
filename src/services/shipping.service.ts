import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Shipping } from '../models/shipping.entity';

@Injectable()
export class ShippingService {
  constructor(
    @InjectRepository(Shipping)
    private readonly shippingRepository: Repository<Shipping>,
  ) {}

  async updateShippingStatus(id: number, status: string, courierName?: string, trackingNumber?: string): Promise<Shipping> {
    const shipping = await this.shippingRepository.findOne({ where: { id } });
    if (!shipping) {
      throw new Error('배송 정보를 찾을 수 없습니다.');
    }

    shipping.status = status;
    if (courierName) shipping.courierName = courierName;
    if (trackingNumber) shipping.trackingNumber = trackingNumber;
    
    return await this.shippingRepository.save(shipping);
  }
}
