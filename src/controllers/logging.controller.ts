import { Controller, Post, Get, Body, Query } from '@nestjs/common';
import { LoggingService } from '../services/logging.service';

@Controller('log')
export class LoggingController {
  constructor(private readonly loggingService: LoggingService) {}

  // POST 요청으로 로그 메시지 기록
  @Post()
  logMessage(@Body() body: { message: string }) {
    this.loggingService.logInfo(body.message);
    return { status: 'success', message: `Logged message: ${body.message}` };
  }

  // GET 요청으로 쿼리 파라미터를 받아 로그 메시지 기록 (일반 로그)
  @Get('info')
  logMessageGet(@Query('message') message: string) {
    if (message) {
      this.loggingService.logInfo(message);
      return { status: 'success', message: `Logged message: ${message}` };
    } else {
      return { status: 'error', message: 'No message provided' };
    }
  }

  // GET 요청으로 쿼리 파라미터를 받아 로그 메시지 기록 (오류 로그)
  @Get('error')
  logErrorGet(@Query('message') message: string) {
    if (message) {
      this.loggingService.logError(message);
      return { status: 'success', message: `Logged error message: ${message}` };
    } else {
      return { status: 'error', message: 'No error message provided' };
    }
  }

  // GET 요청으로 쿼리 파라미터를 받아 로그 메시지 기록 (경고 로그)
  @Get('warning')
  logWarningGet(@Query('message') message: string) {
    if (message) {
      this.loggingService.logWarning(message);
      return { status: 'success', message: `Logged warning message: ${message}` };
    } else {
      return { status: 'error', message: 'No warning message provided' };
    }
  }

  // GET 요청으로 쿼리 파라미터를 받아 로그 메시지 기록 (디버그 로그)
  @Get('debug')
  logDebugGet(@Query('message') message: string) {
    if (message) {
      this.loggingService.logDebug(message);
      return { status: 'success', message: `Logged debug message: ${message}` };
    } else {
      return { status: 'error', message: 'No debug message provided' };
    }
  }
}
