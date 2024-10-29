import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { LoggingService } from './logging.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly loggingService: LoggingService,
  ) {}

  async generateAccessToken(userId: number): Promise<string> {
    try {
      const secret = this.configService.get<string>('JWT_SECRET'); // 환경 변수에서 JWT_SECRET 가져오기
      console.log('Generating access token with userId:', userId);
      return this.jwtService.sign({ userId }, { secret, expiresIn: '1h' });
    } catch (error) {
      await this.loggingService.logError(`Failed to generate access token for userId ${userId}: ${error.message}`);
      throw error;
    }
  }

  async generateRefreshToken(): Promise<string> {
    try {
      const secret = this.configService.get<string>('JWT_SECRET'); // 환경 변수에서 JWT_SECRET 가져오기
      console.log('Generating refresh token');
      return this.jwtService.sign({}, { secret, expiresIn: '7d' });
    } catch (error) {
      await this.loggingService.logError(`Failed to generate refresh token: ${error.message}`);
      throw error;
    }
  }
}
