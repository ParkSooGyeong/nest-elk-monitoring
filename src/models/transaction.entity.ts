import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';

// 거래 내역
@Entity('elk_transactions')
export class Transaction {
  @PrimaryGeneratedColumn()
  transactionId: number;

  @ManyToOne(() => User, (user) => user.transactions)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  amount: number;

  @Column({ type: 'enum', enum: ['DEPOSIT', 'WITHDRAWAL', 'PAYMENT'] })
  type: 'DEPOSIT' | 'WITHDRAWAL' | 'PAYMENT'; // 입금, 출금, 거래

  @Column({ type: 'date' })
  date: string;
}
