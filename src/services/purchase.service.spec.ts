import { Test, TestingModule } from '@nestjs/testing';
import { PurchaseService } from './purchase.service';
import { Repository } from 'typeorm';
import { User } from '../models/user.entity';
import { Balance } from '../models/balance.entity';
import { Transaction } from '../models/transaction.entity';
import { Product } from '../models/products.entity';
import { Shipping } from '../models/shipping.entity';
import { EmailAlertService } from './email-alert.service';
import { LoggingService } from './logging.service';
import { getRepositoryToken } from '@nestjs/typeorm';

describe('PurchaseService', () => {
  let purchaseService: PurchaseService;
  let userRepository: Partial<Repository<User>>;
  let balanceRepository: Partial<Repository<Balance>>;
  let transactionRepository: Partial<Repository<Transaction>>;
  let productRepository: Partial<Repository<Product>>;
  let shippingRepository: Partial<Repository<Shipping>>;
  let loggingService: LoggingService;
  let emailAlertService: EmailAlertService;

  beforeEach(async () => {
    userRepository = {
      findOne: jest.fn(),
      save: jest.fn(),
    };
    balanceRepository = {
      save: jest.fn(),
    };
    transactionRepository = {
      create: jest.fn(),
      save: jest.fn(),
    };
    productRepository = {
      findOne: jest.fn(),
    };
    shippingRepository = {
      create: jest.fn(),
      save: jest.fn(),
    };
    loggingService = {
      logInfo: jest.fn(),
      logError: jest.fn(),
    } as unknown as LoggingService;
    emailAlertService = {
      sendPurchaseNotification: jest.fn(),
      sendShippingRequestNotification: jest.fn(),
    } as unknown as EmailAlertService;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PurchaseService,
        { provide: getRepositoryToken(User), useValue: userRepository },
        { provide: getRepositoryToken(Balance), useValue: balanceRepository },
        { provide: getRepositoryToken(Transaction), useValue: transactionRepository },
        { provide: getRepositoryToken(Product), useValue: productRepository },
        { provide: getRepositoryToken(Shipping), useValue: shippingRepository },
        { provide: LoggingService, useValue: loggingService },
        { provide: EmailAlertService, useValue: emailAlertService },
      ],
    }).compile();

    purchaseService = module.get<PurchaseService>(PurchaseService);
  });

  describe('purchaseProduct', () => {
    it('상품을 성공적으로 구매하고 이메일을 전송해야 합니다.', async () => {
      const mockUser = { id: 1, email: 'test@test.com', name: '테스트', balance: { balance: 10000 } } as User;
      const mockProduct = { id: 1, name: '테스트 상품', price: 5000, store: { user: { email: 'seller@test.com', name: '판매자' } } } as Product;
      const mockTransaction = { 
        transactionId: 1,
        id: 1, 
        user: mockUser, 
        amount: 5000, 
        type: 'PAYMENT', 
        date: '2023-10-10' 
      } as Transaction;
      const mockShipping = { id: 1, product: mockProduct, buyer: mockUser, status: 'PENDING' } as Shipping;

      (userRepository.findOne as jest.Mock).mockResolvedValue(mockUser);
      (productRepository.findOne as jest.Mock).mockResolvedValue(mockProduct);
      (transactionRepository.create as jest.Mock).mockReturnValue(mockTransaction);
      (transactionRepository.save as jest.Mock).mockResolvedValue(mockTransaction);
      (shippingRepository.create as jest.Mock).mockReturnValue(mockShipping);
      (shippingRepository.save as jest.Mock).mockResolvedValue(mockShipping);
      (balanceRepository.save as jest.Mock).mockResolvedValue({ balance: 5000 });

      const result = await purchaseService.purchaseProduct('test@test.com', 1, 1);

      expect(userRepository.findOne).toHaveBeenCalledWith({ where: { email: 'test@test.com' }, relations: ['balance'] });
      expect(productRepository.findOne).toHaveBeenCalledWith({ where: { id: 1 }, relations: ['store', 'store.user'] });
      expect(balanceRepository.save).toHaveBeenCalledWith({ balance: 5000 });
      expect(transactionRepository.save).toHaveBeenCalledWith(mockTransaction);
      expect(shippingRepository.save).toHaveBeenCalledWith(mockShipping);
      expect(emailAlertService.sendPurchaseNotification).toHaveBeenCalledWith('test@test.com', '테스트', '테스트 상품', 5000);
      expect(emailAlertService.sendShippingRequestNotification).toHaveBeenCalledWith('seller@test.com', '판매자', '테스트', '테스트 상품');
      expect(result).toEqual({ message: '상품 구매가 완료되었습니다.' });
    });

    it('사용자를 찾지 못할 경우 오류를 발생시켜야 합니다.', async () => {
      (userRepository.findOne as jest.Mock).mockResolvedValue(undefined);

      await expect(purchaseService.purchaseProduct('test@test.com', 1, 1)).rejects.toThrow('사용자를 찾을 수 없습니다.');
      expect(loggingService.logError).toHaveBeenCalledWith('Purchase failed for email test@test.com: 사용자를 찾을 수 없습니다.');
    });

    it('상품을 찾지 못할 경우 오류를 발생시켜야 합니다.', async () => {
      const mockUser = { id: 1, email: 'test@test.com', name: '테스트', balance: { balance: 10000 } } as User;

      (userRepository.findOne as jest.Mock).mockResolvedValue(mockUser);
      (productRepository.findOne as jest.Mock).mockResolvedValue(undefined);

      await expect(purchaseService.purchaseProduct('test@test.com', 1, 1)).rejects.toThrow('상품 또는 판매자를 찾을 수 없습니다.');
      expect(loggingService.logError).toHaveBeenCalledWith('Purchase failed for productId 1: 상품 또는 판매자를 찾을 수 없습니다.');
    });

    it('잔액이 부족할 경우 오류를 발생시켜야 합니다.', async () => {
      const mockUser = { id: 1, email: 'test@test.com', name: '테스트', balance: { balance: 1000 } } as User;
      const mockProduct = { id: 1, name: '테스트 상품', price: 5000, store: { user: { email: 'seller@test.com', name: '판매자' } } } as Product;

      (userRepository.findOne as jest.Mock).mockResolvedValue(mockUser);
      (productRepository.findOne as jest.Mock).mockResolvedValue(mockProduct);

      await expect(purchaseService.purchaseProduct('test@test.com', 1, 1)).rejects.toThrow('잔액이 부족합니다. 구매할 수 없습니다.');
      expect(loggingService.logError).toHaveBeenCalledWith('Purchase failed for email test@test.com due to insufficient balance.');
    });
  });
});
