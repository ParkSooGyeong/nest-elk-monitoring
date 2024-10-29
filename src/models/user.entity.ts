import { Entity, PrimaryGeneratedColumn, Column, OneToMany, OneToOne, JoinColumn } from 'typeorm';
import { Deposit } from './deposit.entity';
import { Withdrawal } from './withdrawal.entity';
import { Balance } from './balance.entity';
import { Transaction } from './transaction.entity';
import { Store } from './store.entity';

// 고객
@Entity('elk_users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  name: string;

  @Column()
  birthdate: Date;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @OneToMany(() => Deposit, (deposit) => deposit.user)
  deposits: Deposit[];

  @OneToMany(() => Withdrawal, (withdrawal) => withdrawal.user)
  withdrawals: Withdrawal[];

  @OneToOne(() => Balance, (balance) => balance.user)
  @JoinColumn() // `balanceId`를 사용자 테이블에 외래 키로 추가
  balance: Balance;

  @OneToMany(() => Transaction, (transaction) => transaction.user)
  transactions: Transaction[];

  @OneToOne(() => Store, (store) => store.user, { nullable: true })
  store: Store; // 사용자가 소유한 상점 (하나의 상점만 소유 가능)
}
