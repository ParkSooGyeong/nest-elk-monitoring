import { Test, TestingModule } from '@nestjs/testing';
import { ShippingService } from './shipping.service';
import { Repository } from 'typeorm';
import { Shipping } from '../models/shipping.entity';
import { getRepositoryToken } from '@nestjs/typeorm';

describe('ShippingService', () => {
  let shippingService: ShippingService;
  let shippingRepository: Partial<Repository<Shipping>>;

  beforeEach(async () => {
    shippingRepository = {
      findOne: jest.fn(),
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ShippingService,
        { provide: getRepositoryToken(Shipping), useValue: shippingRepository },
      ],
    }).compile();

    shippingService = module.get<ShippingService>(ShippingService);
  });

  describe('updateShippingStatus', () => {
    it('존재하는 배송 정보를 업데이트하고 반환해야 합니다.', async () => {
      const mockShipping = { id: 1, status: '준비 중' } as Shipping;
      const updatedShipping = { ...mockShipping, status: '배송 중', courierName: '대한통운', trackingNumber: '123456789' } as Shipping;

      (shippingRepository.findOne as jest.Mock).mockResolvedValue(mockShipping);
      (shippingRepository.save as jest.Mock).mockResolvedValue(updatedShipping);

      const result = await shippingService.updateShippingStatus(1, '배송 중', '대한통운', '123456789');

      expect(shippingRepository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(shippingRepository.save).toHaveBeenCalledWith(updatedShipping);
      expect(result).toEqual(updatedShipping);
    });

    it('배송 정보를 찾지 못할 경우 오류를 발생시켜야 합니다.', async () => {
      (shippingRepository.findOne as jest.Mock).mockResolvedValue(undefined);

      await expect(shippingService.updateShippingStatus(1, '배송 중')).rejects.toThrow('배송 정보를 찾을 수 없습니다.');
    });

    it('courierName과 trackingNumber 없이 상태만 업데이트할 수 있어야 합니다.', async () => {
      const mockShipping = { id: 1, status: '준비 중' } as Shipping;
      const updatedShipping = { ...mockShipping, status: '배송 완료' } as Shipping;

      (shippingRepository.findOne as jest.Mock).mockResolvedValue(mockShipping);
      (shippingRepository.save as jest.Mock).mockResolvedValue(updatedShipping);

      const result = await shippingService.updateShippingStatus(1, '배송 완료');

      expect(shippingRepository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(shippingRepository.save).toHaveBeenCalledWith(updatedShipping);
      expect(result).toEqual(updatedShipping);
    });
  });
});
