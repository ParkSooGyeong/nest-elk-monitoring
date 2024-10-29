import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UserService } from '../services/user.service';
import { AuthService } from '../services/auth.service';
import { LoggingService } from '../services/logging.service';
import { User } from '../models/user.entity';
import { Auth } from '../models/auth.entity';
import { Balance } from '../models/balance.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forFeature([User, Auth, Balance]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '1h' },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [UserService, AuthService, LoggingService],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
