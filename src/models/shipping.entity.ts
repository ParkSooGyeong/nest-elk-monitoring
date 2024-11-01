import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Product } from './products.entity';
import { User } from './user.entity';

@Entity('elk_shippings')
export class Shipping {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 50, nullable: true })
  courierName: string; // 택배회사명

  @Column({ length: 100, nullable: true })
  trackingNumber: string; // 운송장 번호

  @Column({ length: 20, default: 'PENDING' })
  status: string; // 배송 상태 (예: 'PENDING', 'READY', 'SHIPPED' 등)

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'productId' })
  product: Product; // 물품 ID와의 관계

  @ManyToOne(() => User)
  @JoinColumn({ name: 'buyerId' })
  buyer: User; // 구매자 ID와의 관계
}
