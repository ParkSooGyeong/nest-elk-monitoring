import { JwtAuthGuard } from './jwt-auth.guard';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';

describe('JwtAuthGuard', () => {
  let jwtAuthGuard: JwtAuthGuard;
  let mockJwtService: JwtService;
  let mockConfigService: ConfigService;

  beforeEach(() => {
    mockJwtService = new JwtService({});
    mockConfigService = new ConfigService();

    jwtAuthGuard = new JwtAuthGuard(mockJwtService, mockConfigService);
  });

  it('액세스 토큰이 없는 경우 예외를 던져야 합니다.', () => {
    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => ({ headers: {} }),
      }),
    } as ExecutionContext;

    expect(() => jwtAuthGuard.canActivate(mockContext)).toThrow(UnauthorizedException);
  });

  it('유효하지 않은 토큰인 경우 예외를 던져야 합니다.', () => {
    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => ({
          headers: {
            authorization: 'Bearer invalidtoken',
          },
        }),
      }),
    } as ExecutionContext;

    jest.spyOn(mockConfigService, 'get').mockReturnValue('mysecret');
    jest.spyOn(mockJwtService, 'verify').mockImplementation(() => {
      throw new Error('Invalid token');
    });

    expect(() => jwtAuthGuard.canActivate(mockContext)).toThrow(UnauthorizedException);
  });

  it('유효한 토큰인 경우 접근을 허용해야 합니다.', () => {
    const mockRequest = {
      headers: {
        authorization: 'Bearer validtoken',
      },
    } as Request;

    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
      }),
    } as ExecutionContext;

    jest.spyOn(mockConfigService, 'get').mockReturnValue('mysecret');
    jest.spyOn(mockJwtService, 'verify').mockReturnValue({ userId: 1 });

    const result = jwtAuthGuard.canActivate(mockContext);

    expect(result).toBe(true);
    expect(mockRequest['user']).toEqual({ userId: 1 });
  });
});
