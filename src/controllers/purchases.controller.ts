import { Controller, Post, Body, HttpException, HttpStatus, Req, UseGuards } from '@nestjs/common';
import { PurchaseService } from '../services/purchase.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { Request } from 'express';

@Controller('purchases')
export class PurchasesController {
  constructor(private readonly purchaseService: PurchaseService) {}

  @UseGuards(JwtAuthGuard)
  @Post('buy')
  async buyProduct(
    @Req() req: Request,
    @Body('productId') productId: number,
    @Body('quantity') quantity: number,
  ) {
    try {
      const userEmail = req['user'].email;
      return await this.purchaseService.purchaseProduct(userEmail, productId, quantity);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }
}
