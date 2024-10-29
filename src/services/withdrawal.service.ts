import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Withdrawal } from '../models/withdrawal.entity';
import { Balance } from '../models/balance.entity';
import { User } from '../models/user.entity';
import { LoggingService } from './logging.service';

@Injectable()
export class WithdrawalService {
  constructor(
    @InjectRepository(Withdrawal)
    private readonly withdrawalRepository: Repository<Withdrawal>,

    @InjectRepository(Balance)
    private readonly balanceRepository: Repository<Balance>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    private readonly loggingService: LoggingService,
  ) {}

  async createWithdrawal(userId: number, amount: number, date: string): Promise<Withdrawal> {
    try {
      // 사용자 정보 가져오기
      const user = await this.userRepository.findOne({ where: { id: userId }, relations: ['balance'] });
      if (!user) {
        const errorMessage = '사용자를 찾을 수 없습니다.';
        await this.loggingService.logWarning(`Withdrawal attempt failed for userId ${userId}: ${errorMessage}`);
        throw new Error(errorMessage);
      }

      // 잔액 확인
      if (!user.balance || user.balance.balance < amount) {
        const errorMessage = '잔액이 부족합니다. 출금할 수 없습니다.';
        await this.loggingService.logWarning(`Withdrawal attempt failed for userId ${userId}: ${errorMessage}`);
        throw new Error(errorMessage);
      }

      // 출금 정보를 저장
      const withdrawal = this.withdrawalRepository.create({ user, amount, date });
      await this.withdrawalRepository.save(withdrawal);

      // 사용자의 잔액 업데이트
      user.balance.balance -= amount;
      await this.balanceRepository.save(user.balance);

      await this.loggingService.logInfo(`Withdrawal successful for userId ${userId}: Amount ${amount} on ${date}`);
      return withdrawal;
    } catch (error) {
      await this.loggingService.logError(`Withdrawal failed for userId ${userId}: ${error.message}`);
      throw error; // 오류를 다시 던져 호출자에게 알림
    }
  }
}
