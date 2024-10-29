import { Entity, PrimaryColumn, Column, OneToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';

@Entity('elk_auths')
export class Auth {
  @PrimaryColumn()
  userid: number;

  @OneToOne(() => User)
  @JoinColumn({ name: 'userid' })
  user: User;

  @Column()
  refreshToken: string;
}
