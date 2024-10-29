import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';

@Entity('elk_stores')
export class Store {
  @PrimaryGeneratedColumn()
  id: number; // 샵 ID

  @Column({ length: 100 })
  name: string; // 샵 이름

  @Column({ length: 500, nullable: true })
  description: string; // 샵 설명

  @Column({ unique: true })
  businessNumber: string; // 사업자 번호 (유니크)

  @Column({ length: 50 })
  ownerName: string; // 대표 이름

  @Column()
  phoneNumber: string; // 샵 전화번호

  @OneToOne(() => User, (user) => user.store)
  @JoinColumn({ name: 'userId' })
  user: User; // 샵을 소유한 사용자
}
