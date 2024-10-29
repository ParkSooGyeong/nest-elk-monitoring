import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';
//입금 내역
@Entity('elk_deposits')
export class Deposit {
  @PrimaryGeneratedColumn()
  depositId: number;

  @ManyToOne(() => User, user => user.deposits)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  amount: number;

  @Column({ type: 'date' })
  date: string;
}
