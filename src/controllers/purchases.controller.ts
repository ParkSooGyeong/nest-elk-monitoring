import { Controller, Post, Body, HttpException, HttpStatus } from '@nestjs/common';
import { PurchaseService } from '../services/purchase.service';

@Controller('purchases')
export class PurchasesController {
  constructor(private readonly purchaseService: PurchaseService) {}

  @Post('buy')
  async buyProduct(@Body('email') email: string, @Body('amount') amount: number) {
    try {
      return await this.purchaseService.purchaseProduct(email, amount);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }
}
