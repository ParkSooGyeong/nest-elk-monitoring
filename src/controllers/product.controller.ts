import {
  Controller,
  Post,
  Body,
  Res,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ProductService } from '../services/product.service';
import { LoggingService } from '../services/logging.service';
import { Response, Request } from 'express';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { StoreService } from '../services/store.service';

@Controller('product')
export class ProductController {
  constructor(
    private readonly productService: ProductService,
    private readonly loggingService: LoggingService,
    private readonly storeService: StoreService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post('create')
  async createProducts(
    @Body()
    products: Array<{
      name: string;
      category: string;
      subCategory: string;
      price: number;
      imageUrl?: string;
      description?: string;
    }>,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    try {
      console.log('Received products:', products);

      // 체크 1: products의 길이 확인
      if (products.length > 5) {
        console.warn('Too many products. Limiting to 5.');
        await this.loggingService.logWarning(
          `Product creation failed: More than 5 products attempted`,
        );
        return res
          .status(400)
          .json({ message: '한 번에 최대 5개의 물품만 등록 가능합니다.' });
      }

      // 체크 2: 사용자 ID 확인
      const userId = req['user']?.userId;
      console.log('User ID from request:', userId);
      if (!userId) {
        console.error('User ID not found in request');
        return res
          .status(401)
          .json({ message: '사용자 인증 정보가 필요합니다.' });
      }

      // 체크 3: 스토어 확인
      const store = await this.storeService.findByUserId(userId);
      console.log('Store found for user ID:', store);
      if (!store) {
        console.warn(`No store found for userId: ${userId}`);
        await this.loggingService.logWarning(
          `Product creation failed: Store not found for userId: ${userId}`,
        );
        return res
          .status(404)
          .json({ message: `스토어를 찾을 수 없습니다. (userId: ${userId})` });
      }

      // 체크 4: store 객체 추가한 product 리스트 생성
      const productsWithStore = products.map((product) => ({
        ...product,
        store,
      }));
      console.log('Products with store information:', productsWithStore);

      // 체크 5: ProductService를 사용해 물품 생성
      const createdProducts = await this.productService.createProducts(productsWithStore);
      console.log('Created products:', createdProducts);

      // 체크 6: 성공 로그 기록 및 응답
      await this.loggingService.logInfo(
        `Products created successfully for userId: ${userId}`,
      );
      return res.status(201).json({
        message: '물품 생성이 완료되었습니다.',
        products: createdProducts,
      });
    } catch (error) {
      console.error('Error occurred during product creation:', error);
      await this.loggingService.logError(
        `Product creation failed: ${error.message}`,
      );
      return res
        .status(500)
        .json({ message: '물품 생성 중 오류가 발생했습니다.' });
    }
  }
}
