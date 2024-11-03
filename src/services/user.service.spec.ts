import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { Repository } from 'typeorm';
import { User } from '../models/user.entity';
import { Auth } from '../models/auth.entity';
import { Balance } from '../models/balance.entity';
import { LoggingService } from './logging.service';
import * as bcrypt from 'bcrypt';
import { getRepositoryToken } from '@nestjs/typeorm';

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
}));

describe('UserService', () => {
  let userService: UserService;
  let userRepository: Partial<Repository<User>>;
  let authRepository: Partial<Repository<Auth>>;
  let balanceRepository: Partial<Repository<Balance>>;
  let loggingService: LoggingService;

  beforeEach(async () => {
    userRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
    };

    authRepository = {
      create: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    };

    balanceRepository = {
      create: jest.fn(),
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: getRepositoryToken(User), useValue: userRepository },
        { provide: getRepositoryToken(Auth), useValue: authRepository },
        { provide: getRepositoryToken(Balance), useValue: balanceRepository },
        {
          provide: LoggingService,
          useValue: {
            logInfo: jest.fn(),
            logWarning: jest.fn(),
            logError: jest.fn(),
          },
        },
      ],
    }).compile();

    userService = module.get<UserService>(UserService);
    loggingService = module.get<LoggingService>(LoggingService);

    (bcrypt.hash as jest.Mock).mockResolvedValue('암호화된-비밀번호');
  });

  describe('signUp', () => {
    it('새로운 사용자, 잔액 및 인증 정보를 생성해야 합니다.', async () => {
      const mockUser = { id: 1, name: '테스트', birthdate: new Date(), email: 'test@test.com' } as User;
      const mockAuth = { userid: 1, refreshToken: 'some-refresh-token' } as Auth;

      (userRepository.create as jest.Mock).mockReturnValue(mockUser);
      (userRepository.save as jest.Mock).mockResolvedValue(mockUser);
      (balanceRepository.create as jest.Mock).mockReturnValue({ id: 1, user: mockUser, balance: 0 } as Balance);
      (balanceRepository.save as jest.Mock).mockResolvedValue({ id: 1, user: mockUser, balance: 0 } as Balance);
      (authRepository.create as jest.Mock).mockReturnValue(mockAuth);
      (authRepository.save as jest.Mock).mockResolvedValue(mockAuth);

      const result = await userService.signUp(
        '테스트',
        new Date(),
        'test@test.com',
        '1234',
        'some-refresh-token',
      );

      expect(userRepository.save).toHaveBeenCalled();
      expect(balanceRepository.save).toHaveBeenCalled();
      expect(authRepository.save).toHaveBeenCalled();
      expect(loggingService.logInfo).toHaveBeenCalledWith(`User signed up successfully: ${mockUser.id}`);
      expect(result).toEqual({ user: mockUser, auth: mockAuth });
    });

    it('회원가입에 실패하면 오류 로그를 기록해야 합니다.', async () => {
      (userRepository.save as jest.Mock).mockRejectedValue(new Error('사용자 생성 실패'));

      await expect(
        userService.signUp('테스트', new Date(), 'test@test.com', '1234', 'some-refresh-token'),
      ).rejects.toThrow('사용자 생성 실패');

      expect(loggingService.logError).toHaveBeenCalledWith('User sign-up failed for email test@test.com: 사용자 생성 실패');
    });
  });

  describe('findById', () => {
    it('ID로 사용자를 찾아 반환해야 합니다.', async () => {
      const mockUser = { id: 1, name: '테스트', balance: { balance: 0 } } as User;
      (userRepository.findOne as jest.Mock).mockResolvedValue(mockUser);

      const result = await userService.findById(1);

      expect(result).toEqual(mockUser);
      expect(loggingService.logInfo).toHaveBeenCalledWith('User found by ID: 1');
    });

    it('ID로 사용자를 찾지 못할 경우 경고 로그를 기록해야 합니다.', async () => {
      (userRepository.findOne as jest.Mock).mockResolvedValue(undefined);

      const result = await userService.findById(1);

      expect(result).toBeUndefined();
      expect(loggingService.logWarning).toHaveBeenCalledWith('User not found by ID: 1');
    });
  });

  describe('findByEmail', () => {
    it('이메일로 사용자를 찾아 반환해야 합니다.', async () => {
      const mockUser = { id: 1, name: '테스트', email: 'test@test.com', balance: { balance: 0 } } as User;
      (userRepository.findOne as jest.Mock).mockResolvedValue(mockUser);

      const result = await userService.findByEmail('test@test.com');

      expect(result).toEqual(mockUser);
      expect(loggingService.logInfo).toHaveBeenCalledWith('User found by email: test@test.com');
    });

    it('이메일로 사용자를 찾지 못할 경우 경고 로그를 기록해야 합니다.', async () => {
      (userRepository.findOne as jest.Mock).mockResolvedValue(undefined);

      const result = await userService.findByEmail('test@test.com');

      expect(result).toBeUndefined();
      expect(loggingService.logWarning).toHaveBeenCalledWith('User not found by email: test@test.com');
    });
  });

  describe('deleteRefreshToken', () => {
    it('사용자의 리프레시 토큰을 삭제해야 합니다.', async () => {
      (authRepository.delete as jest.Mock).mockResolvedValue(undefined);

      await userService.deleteRefreshToken(1);

      expect(authRepository.delete).toHaveBeenCalledWith({ userid: 1 });
      expect(loggingService.logInfo).toHaveBeenCalledWith('Refresh token deleted for userId: 1');
    });

    it('리프레시 토큰 삭제에 실패하면 오류 로그를 기록해야 합니다.', async () => {
      (authRepository.delete as jest.Mock).mockRejectedValue(new Error('삭제 실패'));

      await expect(userService.deleteRefreshToken(1)).rejects.toThrow('리프레시 토큰 삭제에 실패했습니다.');
      expect(loggingService.logError).toHaveBeenCalledWith('Failed to delete refresh token for userId 1: 삭제 실패');
    });
  });
});
