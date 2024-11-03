import { Test, TestingModule } from '@nestjs/testing';
import { PurchasesController } from './purchases.controller';
import { PurchaseService } from '../services/purchase.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { Request } from 'express';
import { HttpException, HttpStatus } from '@nestjs/common';

interface CustomRequest extends Request {
  user?: {
    email: string;
    userId: number;
  };
}

describe('PurchasesController', () => {
  let purchasesController: PurchasesController;
  let purchaseService: PurchaseService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PurchasesController],
      providers: [
        {
          provide: PurchaseService,
          useValue: {
            purchaseProduct: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .compile();

    purchasesController = module.get<PurchasesController>(PurchasesController);
    purchaseService = module.get<PurchaseService>(PurchaseService);
  });

  describe('buyProduct', () => {
    let mockRequest: Partial<CustomRequest>;

    beforeEach(() => {
      mockRequest = { user: { email: 'user@example.com', userId: 1 } } as CustomRequest;
    });

    it('성공적으로 상품을 구매해야 합니다.', async () => {
      (purchaseService.purchaseProduct as jest.Mock).mockResolvedValue({
        message: '상품 구매가 완료되었습니다.',
      });

      const result = await purchasesController.buyProduct(mockRequest as Request, 1, 2);

      expect(purchaseService.purchaseProduct).toHaveBeenCalledWith('user@example.com', 1, 2);
      expect(result).toEqual({ message: '상품 구매가 완료되었습니다.' });
    });

    it('구매 중 오류가 발생하면 BAD_REQUEST 예외를 던져야 합니다.', async () => {
      const errorMessage = '구매 중 오류 발생';
      (purchaseService.purchaseProduct as jest.Mock).mockRejectedValue(new Error(errorMessage));

      await expect(purchasesController.buyProduct(mockRequest as Request, 1, 2)).rejects.toThrow(
        new HttpException(errorMessage, HttpStatus.BAD_REQUEST),
      );
    });
  });
});
