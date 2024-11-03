import { Test, TestingModule } from '@nestjs/testing';
import { ProductController } from './product.controller';
import { ProductService } from '../services/product.service';
import { LoggingService } from '../services/logging.service';
import { StoreService } from '../services/store.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { Request, Response } from 'express';
import { HttpStatus } from '@nestjs/common';

jest.mock('../services/product.service');
jest.mock('../services/logging.service');
jest.mock('../services/store.service');

interface CustomRequest extends Request {
  user?: { userId: number };
}

describe('ProductController', () => {
  let productController: ProductController;
  let productService: ProductService;
  let loggingService: LoggingService;
  let storeService: StoreService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductController],
      providers: [
        ProductService,
        LoggingService,
        StoreService,
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .compile();

    productController = module.get<ProductController>(ProductController);
    productService = module.get<ProductService>(ProductService);
    loggingService = module.get<LoggingService>(LoggingService);
    storeService = module.get<StoreService>(StoreService);
  });

  describe('createProducts', () => {
    let mockRequest: Partial<CustomRequest>;
    let mockResponse: Partial<Response>;

    beforeEach(() => {
      mockRequest = {
        user: { userId: 1 },
      } as CustomRequest;

      mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response;
    });

    it('최대 5개의 물품만 등록할 수 있습니다.', async () => {
      const products = Array(6).fill({
        name: '상품명',
        category: '카테고리',
        subCategory: '서브카테고리',
        price: 1000,
      });

      await productController.createProducts(products, mockRequest as Request, mockResponse as Response);

      expect(loggingService.logWarning).toHaveBeenCalledWith(
        `Product creation failed: More than 5 products attempted`,
      );
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: '한 번에 최대 5개의 물품만 등록 가능합니다.',
      });
    });

    it('사용자 ID가 없으면 인증 오류를 반환해야 합니다.', async () => {
      mockRequest.user = undefined;

      await productController.createProducts([], mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.UNAUTHORIZED);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: '사용자 인증 정보가 필요합니다.',
      });
    });

    it('스토어를 찾을 수 없으면 404 오류를 반환해야 합니다.', async () => {
      const products = [
        { name: '상품명', category: '카테고리', subCategory: '서브카테고리', price: 1000 },
      ];

      (storeService.findByUserId as jest.Mock).mockResolvedValue(null);

      await productController.createProducts(products, mockRequest as Request, mockResponse as Response);

      expect(loggingService.logWarning).toHaveBeenCalledWith(
        `Product creation failed: Store not found for userId: 1`,
      );
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: `스토어를 찾을 수 없습니다. (userId: 1)`,
      });
    });

    it('성공적으로 물품을 생성하고 응답을 반환해야 합니다.', async () => {
      const products = [
        { name: '상품명', category: '카테고리', subCategory: '서브카테고리', price: 1000 },
      ];
      const store = { id: 1, name: '테스트 스토어' };
      const createdProducts = [
        { id: 1, name: '상품명', category: '카테고리', subCategory: '서브카테고리', price: 1000, store },
      ];

      (storeService.findByUserId as jest.Mock).mockResolvedValue(store);
      (productService.createProducts as jest.Mock).mockResolvedValue(createdProducts);

      await productController.createProducts(products, mockRequest as Request, mockResponse as Response);

      expect(loggingService.logInfo).toHaveBeenCalledWith(
        `Products created successfully for userId: 1`,
      );
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.CREATED);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: '물품 생성이 완료되었습니다.',
        products: createdProducts,
      });
    });

    it('물품 생성 중 오류가 발생하면 500 오류를 반환해야 합니다.', async () => {
      const products = [
        { name: '상품명', category: '카테고리', subCategory: '서브카테고리', price: 1000 },
      ];
      const errorMessage = '물품 생성 중 오류';

      (storeService.findByUserId as jest.Mock).mockResolvedValue({ id: 1, name: '테스트 스토어' });
      (productService.createProducts as jest.Mock).mockRejectedValue(new Error(errorMessage));

      await productController.createProducts(products, mockRequest as Request, mockResponse as Response);

      expect(loggingService.logError).toHaveBeenCalledWith(
        `Product creation failed: ${errorMessage}`,
      );
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: '물품 생성 중 오류가 발생했습니다.',
      });
    });
  });
});
