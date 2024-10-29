import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../models/user.entity';
import { Balance } from '../models/balance.entity';
import { Transaction } from '../models/transaction.entity';
import { LoggingService } from './logging.service';
@Injectable()
export class PurchaseService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(Balance)
    private readonly balanceRepository: Repository<Balance>,

    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,

    private readonly loggingService: LoggingService,
  ) {}

  async purchaseProduct(email: string, amount: number): Promise<{ message: string }> {
    try {
      // 사용자 정보 가져오기
      const user = await this.userRepository.findOne({ where: { email }, relations: ['balance'] });
      if (!user) {
        const errorMessage = '사용자를 찾을 수 없습니다.';
        await this.loggingService.logError(`Purchase failed for email ${email}: ${errorMessage}`);
        throw new Error(errorMessage);
      }

      // 잔액 확인 및 차감
      if (!user.balance || user.balance.balance < amount) {
        const errorMessage = '잔액이 부족합니다. 구매할 수 없습니다.';
        await this.loggingService.logError(`Purchase failed for email ${email}: ${errorMessage}`);
        throw new Error(errorMessage);
      }

      // 잔액 차감
      user.balance.balance -= amount;
      await this.balanceRepository.save(user.balance);

      // 거래 내역 추가 (구매로 인한 차감)
      const transaction = this.transactionRepository.create({
        user,
        amount,
        type: 'PAYMENT',
        date: new Date().toISOString().slice(0, 10),
      });
      await this.transactionRepository.save(transaction);

      return { message: '상품 구매가 완료되었습니다.' };
    } catch (error) {
      if (!(error instanceof Error)) {
        await this.loggingService.logError(`Unexpected error during purchase for email ${email}: ${error}`);
      }
      throw error; // 오류를 다시 던져 호출자에게 알림
    }
  }
}
