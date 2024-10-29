import { Controller, Post, Body, HttpException, HttpStatus, Req, UseGuards } from '@nestjs/common';
import { DepositService } from '../services/deposit.service';
import { LoggingService } from '../services/logging.service';
import { Request } from 'express';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

interface CustomRequest extends Request {
  user: {
    userId: number;
    name: string;
  };
}

@Controller('deposit')
@UseGuards(JwtAuthGuard) // JWT 인증을 위해 가드 사용
export class DepositController {
  constructor(
    private readonly depositService: DepositService,
    private readonly loggingService: LoggingService,
  ) {}

  @Post()
  async depositAmount(
    @Body('amount') amount: number,
    @Req() req: CustomRequest,
  ) {
    const userId = req.user.userId;
    const userName = req.user.name;

    try {
      if (!userId) {
        throw new HttpException('요청에서 사용자 ID를 찾을 수 없습니다', HttpStatus.UNAUTHORIZED);
      }

      // 로그 기록 (요청 정보)
      this.loggingService.logInfo(`사용자 ID ${userId}로부터 입금 시도, 금액: ${amount}`);

      const deposit = await this.depositService.createDeposit(
        userId,
        amount,
        new Date().toISOString().slice(0, 10),
      );

      // 로그 기록 (성공 정보)
      this.loggingService.logInfo(`사용자 ID ${userId}로 ${amount} 입금 성공`);

      return {
        status: 'success',
        message: `(ID: ${userId})로 ${amount} 입금 성공`,
      };
    } catch (error) {
      // 로그 기록 (에러 발생 시)
      this.loggingService.logError(`사용자 ID ${userId}로 입금 실패, 오류: ${error.message}`);
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }
}
