import { Test, TestingModule } from '@nestjs/testing';
import { DepositController } from './deposit.controller';
import { DepositService } from '../services/deposit.service';
import { LoggingService } from '../services/logging.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { HttpException, HttpStatus } from '@nestjs/common';

describe('DepositController', () => {
  let depositController: DepositController;
  let depositService: DepositService;
  let loggingService: LoggingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DepositController],
      providers: [
        {
          provide: DepositService,
          useValue: {
            createDeposit: jest.fn(),
          },
        },
        {
          provide: LoggingService,
          useValue: {
            logInfo: jest.fn(),
            logError: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard) // JwtAuthGuard 모의 처리
      .useValue({
        canActivate: jest.fn(() => true), // 항상 true로 반환하여 인증을 통과하도록 설정
      })
      .compile();

    depositController = module.get<DepositController>(DepositController);
    depositService = module.get<DepositService>(DepositService);
    loggingService = module.get<LoggingService>(LoggingService);
  });

  describe('depositAmount', () => {
    it('입금이 성공하면 성공 메시지를 반환해야 합니다.', async () => {
      const mockRequest = {
        user: { userId: 1, name: '테스트 사용자' },
      };
      const mockDeposit = { id: 1, amount: 1000, date: '2023-10-10' };

      (depositService.createDeposit as jest.Mock).mockResolvedValue(mockDeposit);

      const result = await depositController.depositAmount(1000, mockRequest as any);

      expect(loggingService.logInfo).toHaveBeenCalledWith('사용자 ID 1로부터 입금 시도, 금액: 1000');
      expect(depositService.createDeposit).toHaveBeenCalledWith(1, 1000, expect.any(String));
      expect(loggingService.logInfo).toHaveBeenCalledWith('사용자 ID 1로 1000 입금 성공');
      expect(result).toEqual({
        status: 'success',
        message: '(ID: 1)로 1000 입금 성공',
      });
    });

    it('사용자 ID가 없는 경우 UNAUTHORIZED 오류를 발생시켜야 합니다.', async () => {
      const mockRequest = {
        user: { userId: null, name: '테스트 사용자' },
      };

      await expect(depositController.depositAmount(1000, mockRequest as any)).rejects.toThrow(
        new HttpException('요청에서 사용자 ID를 찾을 수 없습니다', HttpStatus.UNAUTHORIZED),
      );
    });

    it('입금 중 오류가 발생하면 BAD_REQUEST 오류를 반환해야 합니다.', async () => {
      const mockRequest = {
        user: { userId: 1, name: '테스트 사용자' },
      };
      const errorMessage = '입금 중 오류 발생';

      (depositService.createDeposit as jest.Mock).mockRejectedValue(new Error(errorMessage));

      await expect(depositController.depositAmount(1000, mockRequest as any)).rejects.toThrow(
        new HttpException(errorMessage, HttpStatus.BAD_REQUEST),
      );

      expect(loggingService.logError).toHaveBeenCalledWith(
        '사용자 ID 1로 입금 실패, 오류: 입금 중 오류 발생',
      );
    });
  });
});
