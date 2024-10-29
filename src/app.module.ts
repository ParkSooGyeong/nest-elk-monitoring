import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { LoggingController } from './controllers/logging.controller';
import { LoggingModule } from './module/logging.module';
import { EmailAlertService } from './services/email-alert.service';
import { MetricsService } from './services/metrics.service';
import { RequestLoggingMiddleware } from './middlewares/request-logging.middleware';
import { UserController } from './controllers/user.controller';
import { UserService } from './services/user.service';
import { AuthService } from './services/auth.service';
import { JwtService } from '@nestjs/jwt';
import { User } from './models/user.entity';
import { Auth } from './models/auth.entity';
import { Deposit } from './models/deposit.entity';
import { Withdrawal } from './models/withdrawal.entity';
import { Balance } from './models/balance.entity';
import { Transaction } from './models/transaction.entity';
import { Store } from './models/store.entity';
import { Product } from './models/products.entity';
import { AuthModule } from './module/auth.module';
import { DepositService } from './services/deposit.service';
import { WithdrawalService } from './services/withdrawal.service';
import { TransactionsController } from './controllers/transactions.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT, 10) || 3306,
      username: process.env.DB_USERNAME || 'root',
      password: process.env.DB_PASSWORD || 'password',
      database: process.env.DB_NAME || 'elk',
      entities: [User, Auth, Deposit, Withdrawal, Balance, Transaction, Store, Product],
      synchronize: false,
    }),

    TypeOrmModule.forFeature([User, Auth, Deposit, Withdrawal, Balance, Transaction, Store, Product]),
    AuthModule,
    LoggingModule, // 전역 모듈로 추가
  ],
  controllers: [LoggingController, UserController, TransactionsController],
  providers: [
    EmailAlertService,
    MetricsService,
    UserService,
    AuthService,
    JwtService,
    DepositService,
    WithdrawalService,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestLoggingMiddleware).forRoutes('*');
  }
}
