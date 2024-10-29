import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';
import csurf from 'csurf'; // 기본 import로 변경

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());

  // CSRF 미들웨어 추가
  app.use(
    csurf({
      cookie: {
        httpOnly: true, // JavaScript로 접근할 수 없도록 설정
        secure: process.env.NODE_ENV === 'production', // 프로덕션 환경에서는 secure 설정
        sameSite: 'strict', // 동일 출처에서만 쿠키 전송 가능
        maxAge: 7 * 24 * 60 * 60 * 1000, // CSRF 토큰 쿠키의 만료시간 (7일)
      },
    }),
  );

  await app.listen(3001);
}
bootstrap();
