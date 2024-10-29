import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Store } from './store.entity';

@Entity('elk_products')
export class Product {
  @PrimaryGeneratedColumn()
  id: number; // 물품 ID

  @Column({ length: 100 })
  name: string; // 물품명

  @Column({ length: 100 })
  category: string; // 대분류 (예: 식품, 전자기기)

  @Column({ length: 100 })
  subCategory: string; // 소분류 (예: 냉동식품, 신선식품)

  @Column('decimal', { precision: 10, scale: 2 })
  price: number; // 물품 가격

  @Column({ nullable: true })
  imageUrl: string; // 물품 이미지 URL (이미지 파일 경로)

  @Column({ length: 1000, nullable: true })
  description: string; // 물품 소개글 (물품에 대한 설명)

  @ManyToOne(() => Store)
  @JoinColumn({ name: 'storeId' })
  store: Store; // 상점과의 관계 (다대일)
}
