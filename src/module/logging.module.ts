import { Global, Module } from '@nestjs/common';
import { LoggingService } from '../services/logging.service';

@Global() // 전역 모듈로 설정
@Module({
  providers: [LoggingService],
  exports: [LoggingService],
})
export class LoggingModule {}
