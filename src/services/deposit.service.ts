import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Deposit } from '../models/deposit.entity';
import { Balance } from '../models/balance.entity';
import { User } from '../models/user.entity';
import { LoggingService } from './logging.service';

@Injectable()
export class DepositService {
  constructor(
    @InjectRepository(Deposit)
    private readonly depositRepository: Repository<Deposit>,

    @InjectRepository(Balance)
    private readonly balanceRepository: Repository<Balance>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    private readonly loggingService: LoggingService,
  ) {}

  async createDeposit(userId: number, amount: number, date: string): Promise<Deposit> {
    try {
      // 사용자 정보 가져오기
      const user = await this.userRepository.findOne({ where: { id: userId } });
      if (!user) {
        throw new Error('사용자를 찾을 수 없습니다.');
      }
      // 입금 정보를 저장
      const deposit = this.depositRepository.create({ user, amount, date });
      await this.depositRepository.save(deposit);

      // 사용자의 잔액 업데이트
      if (user.balance) {
        user.balance.balance += amount;
        await this.balanceRepository.save(user.balance);
      } else {
        throw new Error('사용자의 잔액을 찾을 수 없습니다.');
      }

      return deposit;
    } catch (error) {
      await this.loggingService.logError(`Deposit creation failed for userId ${userId}: ${error.message}`);
      throw error; // 오류를 다시 던져 호출자에게 알림
    }
  }
}
