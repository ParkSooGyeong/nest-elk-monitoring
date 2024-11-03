import { Test, TestingModule } from '@nestjs/testing';
import { StoreController } from './store.controller';
import { StoreService } from '../services/store.service';
import { LoggingService } from '../services/logging.service';
import { UserService } from '../services/user.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { Request, Response } from 'express';
import { HttpStatus } from '@nestjs/common';

interface CustomRequest extends Request {
  user?: { userId: number };
}

describe('StoreController', () => {
  let storeController: StoreController;
  let storeService: StoreService;
  let loggingService: LoggingService;
  let userService: UserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StoreController],
      providers: [
        {
          provide: StoreService,
          useValue: {
            findByUserId: jest.fn(),
            findByName: jest.fn(),
            createStore: jest.fn(),
          },
        },
        {
          provide: LoggingService,
          useValue: {
            logInfo: jest.fn(),
            logWarning: jest.fn(),
            logError: jest.fn(),
          },
        },
        {
          provide: UserService,
          useValue: {
            findById: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .compile();

    storeController = module.get<StoreController>(StoreController);
    storeService = module.get<StoreService>(StoreService);
    loggingService = module.get<LoggingService>(LoggingService);
    userService = module.get<UserService>(UserService);
  });

  describe('createStore', () => {
    let mockRequest: Partial<CustomRequest>;
    let mockResponse: Partial<Response>;

    beforeEach(() => {
      mockRequest = { user: { userId: 1 } };
      mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response;
    });

    it('사용자가 없으면 404 오류를 반환해야 합니다.', async () => {
      (userService.findById as jest.Mock).mockResolvedValue(null);

      await storeController.createStore(
        '스토어 이름',
        '스토어 설명',
        '1234567890',
        '오너 이름',
        '010-1234-5678',
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(loggingService.logWarning).toHaveBeenCalledWith(
        `Store creation failed: User not found (userId: 1)`,
      );
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: '사용자를 찾을 수 없습니다.' });
    });

    it('사용자가 이미 샵을 가지고 있으면 400 오류를 반환해야 합니다.', async () => {
      (userService.findById as jest.Mock).mockResolvedValue({ id: 1 });
      (storeService.findByUserId as jest.Mock).mockResolvedValue({ id: 1, name: '기존 스토어' });

      await storeController.createStore(
        '스토어 이름',
        '스토어 설명',
        '1234567890',
        '오너 이름',
        '010-1234-5678',
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(loggingService.logWarning).toHaveBeenCalledWith(
        `Store creation failed: User already has a store (userId: 1)`,
      );
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: '이미 샵을 소유하고 있습니다.' });
    });

    it('스토어 이름이 이미 존재하면 400 오류를 반환해야 합니다.', async () => {
      (userService.findById as jest.Mock).mockResolvedValue({ id: 1 });
      (storeService.findByUserId as jest.Mock).mockResolvedValue(null);
      (storeService.findByName as jest.Mock).mockResolvedValue({ id: 2, name: '스토어 이름' });

      await storeController.createStore(
        '스토어 이름',
        '스토어 설명',
        '1234567890',
        '오너 이름',
        '010-1234-5678',
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(loggingService.logWarning).toHaveBeenCalledWith(
        `Store creation failed: Store name already in use (name: 스토어 이름)`,
      );
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: '이미 존재하는 샵 이름입니다.' });
    });

    it('스토어 생성이 성공하면 성공 메시지를 반환해야 합니다.', async () => {
      const store = { id: 1, name: '새로운 스토어' };
      (userService.findById as jest.Mock).mockResolvedValue({ id: 1 });
      (storeService.findByUserId as jest.Mock).mockResolvedValue(null);
      (storeService.findByName as jest.Mock).mockResolvedValue(null);
      (storeService.createStore as jest.Mock).mockResolvedValue(store);

      await storeController.createStore(
        '스토어 이름',
        '스토어 설명',
        '1234567890',
        '오너 이름',
        '010-1234-5678',
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(loggingService.logInfo).toHaveBeenCalledWith(`Store created successfully: 1`);
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.CREATED);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: '스토어 생성이 완료되었습니다.',
        storeId: store.id,
      });
    });

    it('스토어 생성 중 오류가 발생하면 500 오류를 반환해야 합니다.', async () => {
      const errorMessage = '스토어 생성 중 오류';
      (userService.findById as jest.Mock).mockResolvedValue({ id: 1 });
      (storeService.findByUserId as jest.Mock).mockResolvedValue(null);
      (storeService.findByName as jest.Mock).mockResolvedValue(null);
      (storeService.createStore as jest.Mock).mockRejectedValue(new Error(errorMessage));

      await storeController.createStore(
        '스토어 이름',
        '스토어 설명',
        '1234567890',
        '오너 이름',
        '010-1234-5678',
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(loggingService.logError).toHaveBeenCalledWith(
        `Store creation failed: ${errorMessage}`,
      );
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: '스토어 생성 중 오류가 발생했습니다.',
      });
    });
  });
});
