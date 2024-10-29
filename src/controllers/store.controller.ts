import { Controller, Post, Body, Res, Req, UseGuards } from '@nestjs/common';
import { StoreService } from '../services/store.service';
import { LoggingService } from '../services/logging.service';
import { Response, Request } from 'express';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { UserService } from '../services/user.service';

@Controller('store')
export class StoreController {
  constructor(
    private readonly storeService: StoreService,
    private readonly loggingService: LoggingService,
    private readonly userService: UserService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post('create')
  async createStore(
    @Body('name') name: string,
    @Body('description') description: string,
    @Body('businessNumber') businessNumber: string,
    @Body('ownerName') ownerName: string,
    @Body('phoneNumber') phoneNumber: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    try {
      const userId = req['user'].userId;
      const user = await this.userService.findById(userId);

      if (!user) {
        await this.loggingService.logWarning(`Store creation failed: User not found (userId: ${userId})`);
        return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
      }

      const existingStore = await this.storeService.findByUserId(userId);
      if (existingStore) {
        await this.loggingService.logWarning(`Store creation failed: User already has a store (userId: ${userId})`);
        return res.status(400).json({ message: '이미 샵을 소유하고 있습니다.' });
      }

      const existingStoreByName = await this.storeService.findByName(name);
      if (existingStoreByName) {
        await this.loggingService.logWarning(`Store creation failed: Store name already in use (name: ${name})`);
        return res.status(400).json({ message: '이미 존재하는 샵 이름입니다.' });
      }

      const store = await this.storeService.createStore({
        name,
        description,
        businessNumber,
        ownerName,
        phoneNumber,
        user,
      });

      await this.loggingService.logInfo(`Store created successfully: ${store.id}`);
      return res.status(201).json({
        message: '스토어 생성이 완료되었습니다.',
        storeId: store.id,
      });
    } catch (error) {
      await this.loggingService.logError(`Store creation failed: ${error.message}`);
      return res.status(500).json({ message: '스토어 생성 중 오류가 발생했습니다.' });
    }
  }
}
