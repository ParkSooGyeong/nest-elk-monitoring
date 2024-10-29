import { Controller, Post, Body } from '@nestjs/common';
import { DepositService } from '../services/deposit.service';
import { WithdrawalService } from '../services/withdrawal.service';

@Controller('transactions')
export class TransactionsController {
  constructor(
    private readonly depositService: DepositService,
    private readonly withdrawalService: WithdrawalService,
  ) {}

  @Post('deposit')
  async deposit(
    @Body('userId') userId: number,
    @Body('amount') amount: number,
    @Body('date') date: string,
  ) {
    return await this.depositService.createDeposit(userId, amount, date);
  }

  @Post('withdrawal')
  async withdrawal(
    @Body('userId') userId: number,
    @Body('amount') amount: number,
    @Body('date') date: string,
  ) {
    return await this.withdrawalService.createWithdrawal(userId, amount, date);
  }
}
