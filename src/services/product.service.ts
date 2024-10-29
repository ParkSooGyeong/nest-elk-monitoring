import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../models/products.entity';
import { Store } from '../models/store.entity';
import { LoggingService } from './logging.service';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(Store)
    private readonly loggingService: LoggingService,
  ) {}

  async createProducts(products: Array<Partial<Product>>): Promise<Product[]> {
    try {
      const productEntities = products.map((product) => this.productRepository.create(product));
      const savedProducts = await this.productRepository.save(productEntities);
      this.loggingService.logInfo(`Created ${savedProducts.length} products successfully`);
      return savedProducts;
    } catch (error) {
      this.loggingService.logError(`Failed to create products, Error: ${error.message}`);
      throw error;
    }
  }
}
