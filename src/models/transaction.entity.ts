import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';

// 거래 타입 열거형 정의
export enum TransactionType {
  DEPOSIT = 'DEPOSIT',
  WITHDRAWAL = 'WITHDRAWAL',
  PAYMENT = 'PAYMENT',
  RECEIPT = 'RECEIPT',
}
@Entity('elk_transactions')
export class Transaction {
  @PrimaryGeneratedColumn()
  transactionId: number;

  @ManyToOne(() => User, (user) => user.transactions)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column('decimal', { precision: 15, scale: 2 })
  amount: number;

  @Column({ type: 'enum', enum: TransactionType })
  type: TransactionType;

  @Column({ type: 'date' })
  date: string;
}
