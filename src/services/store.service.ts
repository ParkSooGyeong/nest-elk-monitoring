import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Store } from '../models/store.entity';

@Injectable()
export class StoreService {
  constructor(
    @InjectRepository(Store)
    private readonly storeRepository: Repository<Store>,
  ) {}

  async findByUserId(userId: number): Promise<Store | undefined> {
    return this.storeRepository.findOne({ where: { user: { id: userId } } });
  }

  async findByName(name: string): Promise<Store | undefined> {
    return this.storeRepository.findOne({ where: { name } });
  }

  async findById(storeId: number): Promise<Store | undefined> {
    return this.storeRepository.findOne({ where: { id: storeId }, relations: ['user'] });
  }

  async createStore(storeData: Partial<Store>): Promise<Store> {
    const store = this.storeRepository.create(storeData);
    return this.storeRepository.save(store);
  }
}
