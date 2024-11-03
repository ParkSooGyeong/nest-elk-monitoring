import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../models/user.entity';
import { Balance } from '../models/balance.entity';
import { Transaction } from '../models/transaction.entity';
import { Product } from '../models/products.entity';
import { Shipping } from '../models/shipping.entity';
import { EmailAlertService } from './email-alert.service';
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

    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,

    @InjectRepository(Shipping)
    private readonly shippingRepository: Repository<Shipping>,

    private readonly loggingService: LoggingService,
    private readonly emailAlertService: EmailAlertService,
  ) {}

  async purchaseProduct(email: string, productId: number, quantity: number): Promise<{ message: string }> {
    try {
      // 구매자 정보 가져오기
      const user = await this.userRepository.findOne({ where: { email }, relations: ['balance'] });
      if (!user) {
        const errorMessage = '사용자를 찾을 수 없습니다.';
        await this.loggingService.logError(`Purchase failed for email ${email}: ${errorMessage}`);
        throw new Error(errorMessage);
      }

      // 상품 정보 가져오기
      const product = await this.productRepository.findOne({ 
        where: { id: productId },
        relations: ['store', 'store.user']
      });
      if (!product || !product.store || !product.store.user) {
        const errorMessage = '상품 또는 판매자를 찾을 수 없습니다.';
        await this.loggingService.logError(`Purchase failed for productId ${productId}: ${errorMessage}`);
        throw new Error(errorMessage);
      }
      const seller = product.store.user;

      // 구매자와 판매자 정보 로그에 남기기
      await this.loggingService.logInfo(`Purchase attempt by ${user.email} for product ${product.name} from seller ${seller.email}.`);

      // 총액 계산
      const amount = product.price * quantity;
      
      // 잔액 확인 및 차감
      if (!user.balance || user.balance.balance < amount) {
        const errorMessage = '잔액이 부족합니다. 구매할 수 없습니다.';
        await this.loggingService.logError(`Purchase failed for email ${email} due to insufficient balance.`);
        throw new Error(errorMessage);
      }

      // 잔액 차감
      user.balance.balance -= amount;
      await this.balanceRepository.save(user.balance);
      await this.loggingService.logInfo(`Balance updated for user ${user.email}. New balance: ${user.balance.balance}`);

      // 거래 내역 추가 (구매로 인한 차감)
      const transaction = this.transactionRepository.create({
        user,
        amount,
        type: 'PAYMENT',
        date: new Date().toISOString().slice(0, 10),
      });
      await this.transactionRepository.save(transaction);
      await this.loggingService.logInfo(`Transaction recorded for ${user.email}. Amount deducted: ${amount}`);

      // 배송 정보 생성
      const shipping = this.shippingRepository.create({
        product,
        buyer: user,
        status: 'PENDING',
      });
      await this.shippingRepository.save(shipping);
      await this.loggingService.logInfo(`Shipping record created for buyer ${user.email} and product ${product.name}. Status: PENDING`);

      // 구매자에게 구매 확인 이메일 전송
      await this.emailAlertService.sendPurchaseNotification(
        user.email,
        user.name,
        product.name,
        amount
      );
      await this.loggingService.logInfo(`Purchase confirmation email sent to buyer ${user.email} for product ${product.name}`);

      // 판매자에게 배송 준비 이메일 전송
      await this.emailAlertService.sendShippingRequestNotification(
        seller.email,
        seller.name,
        user.name,
        product.name
      );
      await this.loggingService.logInfo(`Shipping request email sent to seller ${seller.email} for product ${product.name}`);
      
      return { message: '상품 구매가 완료되었습니다.' };
    } catch (error) {
      await this.loggingService.logError(`Unexpected error during purchase for email ${email}: ${error}`);
      throw error;
    }
  }

  async updateShippingStatus(email: string, shippingId: number, courierName: string, trackingNumber: string): Promise<{ message: string }> {
    try {
      // 판매자 정보 가져오기
      const seller = await this.userRepository.findOne({ where: { email } });
      console.log(seller, '판매자 이메일')
      if (!seller) {
        const errorMessage = `판매자를 찾을 수 없습니다. (이메일: ${email || '없음'})`;
        await this.loggingService.logError(`Shipping update failed for email ${email}: ${errorMessage}`);
        throw new Error(errorMessage);
      }
  
      // 배송 정보 가져오기
      const shipping = await this.shippingRepository.findOne({
        where: { id: shippingId },
        relations: ['product', 'product.store', 'product.store.user', 'buyer'],
      });
  
      if (!shipping) {
        const errorMessage = `배송 정보를 찾을 수 없습니다. (배송 ID: ${shippingId})`;
        await this.loggingService.logError(`Shipping update failed for shippingId ${shippingId}: ${errorMessage}`);
        throw new Error(errorMessage);
      }
  
      if (!shipping.product.store || !shipping.product.store.user) {
        const errorMessage = '배송의 판매자 정보를 찾을 수 없습니다.';
        await this.loggingService.logError(`Shipping update failed for shippingId ${shippingId}: ${errorMessage}`);
        throw new Error(errorMessage);
      }
  
      // 판매자 확인 (판매자 정보가 일치하는지 체크)
      if (shipping.product.store.user.id !== seller.id) {
        const errorMessage = `판매자 권한이 없습니다. 배송 상태를 업데이트할 권한이 없습니다. (판매자 이메일: ${seller.email})`;
        await this.loggingService.logError(`Shipping update failed for shippingId ${shippingId}: ${errorMessage}`);
        throw new Error(errorMessage);
      }
  
      // 배송 상태 업데이트 및 운송장 정보 추가
      shipping.status = 'READY';
      shipping.courierName = courierName;
      shipping.trackingNumber = trackingNumber;
      await this.shippingRepository.save(shipping);
      await this.loggingService.logInfo(`Shipping status updated to IN_TRANSIT for shippingId ${shippingId}, courier: ${courierName}, trackingNumber: ${trackingNumber}`);
  
      // 구매자에게 배송 중 이메일 전송
      if (shipping.buyer && shipping.buyer.email) {
        await this.emailAlertService.sendShippingInTransitNotification(
          shipping.buyer.email,
          shipping.buyer.name,
          shipping.product.name,
          courierName,
          trackingNumber
        );
        await this.loggingService.logInfo(`Shipping in transit email sent to buyer ${shipping.buyer.email} for product ${shipping.product.name}`);
      } else {
        const errorMessage = '구매자 정보를 찾을 수 없어 이메일을 보낼 수 없습니다.';
        await this.loggingService.logWarning(`Shipping update succeeded but failed to send email for shippingId ${shippingId}: ${errorMessage}`);
      }
  
      return { message: '배송 상태가 "배송중"으로 업데이트되었습니다.' };
    } catch (error) {
      await this.loggingService.logError(`Unexpected error during shipping update for email ${email || 'undefined'}: ${error.message}`);
      throw error;
    }
  }   
}
