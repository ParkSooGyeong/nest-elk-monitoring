import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { LoggingService } from './logging.service';

describe('AuthService', () => {
  let authService: AuthService;
  let jwtService: JwtService;
  let configService: ConfigService;
  let loggingService: LoggingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('test-secret'),
          },
        },
        {
          provide: LoggingService,
          useValue: {
            logError: jest.fn(),
          },
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    jwtService = module.get<JwtService>(JwtService);
    configService = module.get<ConfigService>(ConfigService);
    loggingService = module.get<LoggingService>(LoggingService);
  });

  describe('generateAccessToken', () => {
    it('액세스 토큰을 생성해야 합니다.', async () => {
      const userId = 1;
      const accessToken = 'test-access-token';
      jest.spyOn(jwtService, 'sign').mockReturnValue(accessToken);

      const result = await authService.generateAccessToken(userId);

      expect(jwtService.sign).toHaveBeenCalledWith({ userId }, { secret: 'test-secret', expiresIn: '1h' });
      expect(result).toBe(accessToken);
    });

    it('토큰 생성에 실패하면 오류 로그를 기록해야 합니다.', async () => {
      const userId = 1;
      const error = new Error('토큰 생성 실패');
      jest.spyOn(jwtService, 'sign').mockImplementation(() => {
        throw error;
      });
      jest.spyOn(loggingService, 'logError');

      await expect(authService.generateAccessToken(userId)).rejects.toThrow(error);
      expect(loggingService.logError).toHaveBeenCalledWith(`Failed to generate access token for userId ${userId}: ${error.message}`);
    });
  });

  describe('generateRefreshToken', () => {
    it('리프레시 토큰을 생성해야 합니다.', async () => {
      const refreshToken = 'test-refresh-token';
      jest.spyOn(jwtService, 'sign').mockReturnValue(refreshToken);

      const result = await authService.generateRefreshToken();

      expect(jwtService.sign).toHaveBeenCalledWith({}, { secret: 'test-secret', expiresIn: '7d' });
      expect(result).toBe(refreshToken);
    });

    it('리프레시 토큰 생성에 실패하면 오류 로그를 기록해야 합니다.', async () => {
      const error = new Error('토큰 생성 실패');
      jest.spyOn(jwtService, 'sign').mockImplementation(() => {
        throw error;
      });
      jest.spyOn(loggingService, 'logError');

      await expect(authService.generateRefreshToken()).rejects.toThrow(error);
      expect(loggingService.logError).toHaveBeenCalledWith(`Failed to generate refresh token: ${error.message}`);
    });
  });
});
