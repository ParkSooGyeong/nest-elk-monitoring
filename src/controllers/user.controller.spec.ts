import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from '../services/user.service';
import { AuthService } from '../services/auth.service';
import { LoggingService } from '../services/logging.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { Request, Response } from 'express';
import * as bcrypt from 'bcrypt';

jest.mock('../services/user.service');
jest.mock('../services/auth.service');

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
}));

interface CustomRequest extends Request {
  user?: { userId: number };
}

describe('UserController', () => {
  let userController: UserController;
  let userService: UserService;
  let authService: AuthService;
  let loggingService: LoggingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        UserService,
        AuthService,
        {
          provide: LoggingService,
          useValue: {
            logInfo: jest.fn().mockResolvedValue(undefined),
            logWarning: jest.fn().mockResolvedValue(undefined),
            logError: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: jest.fn().mockReturnValue(true),
      })
      .compile();

    userController = module.get<UserController>(UserController);
    userService = module.get<UserService>(UserService);
    authService = module.get<AuthService>(AuthService);
    loggingService = module.get<LoggingService>(LoggingService);

    jest.clearAllMocks();
  });

  describe('signUp', () => {
    it('should sign up a user successfully', async () => {
      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        cookie: jest.fn(),
      } as unknown as Response;

      (userService.signUp as jest.Mock).mockResolvedValue({ user: { id: 1, email: 'test@test.com' } });
      (authService.generateAccessToken as jest.Mock).mockResolvedValue('access-token');
      (authService.generateRefreshToken as jest.Mock).mockResolvedValue('refresh-token');

      await userController.signUp('테스트', new Date(), 'test@test.com', '1234', {} as Request, mockResponse);

      expect(loggingService.logInfo).toHaveBeenCalledWith('User signed up successfully: 1');
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: '회원가입이 완료되었습니다.',
        userId: 1,
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      });
    });
  });

  describe('login', () => {
    it('should log in a user successfully', async () => {
      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        cookie: jest.fn(),
      } as unknown as Response;

      const mockUser = { id: 1, email: 'test@test.com', password: 'hashedPassword' };
      (userService.findByEmail as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (authService.generateAccessToken as jest.Mock).mockResolvedValue('access-token');
      (authService.generateRefreshToken as jest.Mock).mockResolvedValue('refresh-token');

      await userController.login('test@test.com', '1234', {} as Request, mockResponse);

      expect(loggingService.logInfo).toHaveBeenCalledWith('User logged in successfully: 1');
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: '로그인에 성공하였습니다.',
        userId: 1,
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      });
    });
  });

  describe('logout', () => {
    it('should log out a user successfully', async () => {
      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        clearCookie: jest.fn(),
      } as unknown as Response;

      (userService.deleteRefreshToken as jest.Mock).mockResolvedValue(undefined);

      await userController.logout(1, mockResponse);

      expect(loggingService.logInfo).toHaveBeenCalledWith('User logged out successfully: 1');
      expect(mockResponse.clearCookie).toHaveBeenCalledWith('accessToken');
      expect(mockResponse.clearCookie).toHaveBeenCalledWith('refreshToken');
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: '로그아웃이 완료되었습니다.',
      });
    });
  });

  describe('getProfile', () => {
    it('should retrieve a user profile successfully', async () => {
      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response;

      const mockRequest = {
        user: { userId: 1 },
      } as CustomRequest;

      (userService.findById as jest.Mock).mockResolvedValue({
        id: 1,
        email: 'test@test.com',
        name: '테스트',
        password: 'hashedPassword',
      });

      await userController.getProfile(mockRequest, mockResponse, '');

      expect(loggingService.logInfo).toHaveBeenCalledWith('Profile retrieved successfully for userId: 1');
      expect(mockResponse.json).toHaveBeenCalledWith({
        user: { id: 1, email: 'test@test.com', name: '테스트' },
      });
    });
  });

  describe('getBalance', () => {
    it('should retrieve user balance successfully', async () => {
      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response;

      const mockUser = {
        id: 1,
        email: 'test@test.com',
        balance: { balance: 1000 },
      };
      (userService.findByEmail as jest.Mock).mockResolvedValue(mockUser);

      await userController.getBalance(mockResponse, 'test@test.com', undefined);

      expect(loggingService.logInfo).toHaveBeenCalledWith('Balance retrieved successfully for userId: 1');
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: '잔액 조회 성공',
        userId: 1,
        email: 'test@test.com',
        balance: 1000,
      });
    });
  });
});
