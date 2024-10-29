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
      if (products.length > 5) {
        await this.loggingService.logWarning(
          `Product creation failed: More than 5 products attempted`,
        );
        return res
          .status(400)
          .json({ message: '한 번에 최대 5개의 물품만 등록 가능합니다.' });
      }

      const userId = req['user'].userId;
      const store = await this.storeService.findByUserId(userId);

      if (!store) {
        await this.loggingService.logWarning(
          `Product creation failed: Store not found for userId: ${userId}`,
        );
        return res
          .status(404)
          .json({ message: `스토어를 찾을 수 없습니다. (userId: ${userId})` });
      }

      // storeId를 각 product에 추가
      const productsWithStore = products.map((product) => ({
        ...product,
        storeId: store.id,
      }));

      const createdProducts = await this.productService.createProducts(productsWithStore);

      await this.loggingService.logInfo(
        `Products created successfully for userId: ${userId}`,
      );
      return res.status(201).json({
        message: '물품 생성이 완료되었습니다.',
        products: createdProducts,
      });
    } catch (error) {
      await this.loggingService.logError(
        `Product creation failed: ${error.message}`,
      );
      return res
        .status(500)
        .json({ message: '물품 생성 중 오류가 발생했습니다.' });
    }
  }
}
