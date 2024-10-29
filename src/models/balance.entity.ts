import { Entity, PrimaryGeneratedColumn, Column, OneToOne } from 'typeorm';
import { User } from './user.entity';

@Entity('elk_balances')
export class Balance {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('decimal', { precision: 15, scale: 2 })
  balance: number;

  @OneToOne(() => User, (user) => user.balance)
  user: User;
}
