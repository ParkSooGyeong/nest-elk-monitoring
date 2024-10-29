import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';
//출금 내역
@Entity('elk_withdrawals')
export class Withdrawal {
  @PrimaryGeneratedColumn()
  withdrawalId: number;

  @ManyToOne(() => User, user => user.withdrawals)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  amount: number;

  @Column({ type: 'date' })
  date: string;
}
