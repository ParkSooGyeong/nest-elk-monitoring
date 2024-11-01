import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../models/products.entity';
import { LoggingService } from './logging.service';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    
    private readonly loggingService: LoggingService,
  ) {}

  async createProducts(products: Array<Partial<Product>>): Promise<Product[]> {
    try {
      const productEntities = products.map((product) =>
        this.productRepository.create(product)
      );
      return await this.productRepository.save(productEntities);
    } catch (error) {
      this.loggingService.logError(`Failed to create products: ${error.message}`);
      throw new Error(`Product creation failed: ${error.message}`);
    }
  }
}
