import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../models/user.entity';
import { Auth } from '../models/auth.entity';
import { Balance } from '../models/balance.entity';
import { LoggingService } from './logging.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(Auth)
    private readonly authRepository: Repository<Auth>,

    @InjectRepository(Balance)
    private readonly balanceRepository: Repository<Balance>,

    private readonly loggingService: LoggingService,
  ) {}

  async signUp(
    name: string,
    birthdate: Date,
    email: string,
    password: string,
    refreshToken: string,
  ): Promise<{ user: User; auth: Auth }> {
    try {
      // 비밀번호 암호화
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // 사용자 생성
      const user = this.userRepository.create({ name, birthdate, email, password: hashedPassword });
      await this.userRepository.save(user);

      // 잔액 생성 및 연결 (user를 직접 연결)
      const balance = this.balanceRepository.create({ user, balance: 0 }); // 초기 잔액 0으로 설정
      await this.balanceRepository.save(balance);

      // 인증 정보 생성
      const auth = this.authRepository.create({ userid: user.id, refreshToken });
      await this.authRepository.save(auth);

      await this.loggingService.logInfo(`User signed up successfully: ${user.id}`);
      return { user, auth };
    } catch (error) {
      await this.loggingService.logError(`User sign-up failed for email ${email}: ${error.message}`);
      throw error; // 오류를 다시 던져 호출자에게 알림
    }
  }

  // 사용자 ID로 사용자 정보를 조회하는 메서드 추가
  async findById(userId: number): Promise<User | undefined> {
    try {
      const user = await this.userRepository.findOne({
        where: { id: userId },
        relations: ['balance'], // 사용자와 연결된 잔액 정보도 조회
      });
      if (user) {
        await this.loggingService.logInfo(`User found by ID: ${userId}`);
      } else {
        await this.loggingService.logWarning(`User not found by ID: ${userId}`);
      }
      return user;
    } catch (error) {
      await this.loggingService.logError(`Failed to find user by ID ${userId}: ${error.message}`);
      throw error;
    }
  }

  // 사용자 이메일로 사용자 정보를 조회하는 메서드 추가
  async findByEmail(email: string): Promise<User | undefined> {
    try {
      const user = await this.userRepository.findOne({
        where: { email },
        relations: ['balance'], // 사용자와 연결된 잔액 정보도 조회
      });
      if (user) {
        await this.loggingService.logInfo(`User found by email: ${email}`);
      } else {
        await this.loggingService.logWarning(`User not found by email: ${email}`);
      }
      return user;
    } catch (error) {
      await this.loggingService.logError(`Failed to find user by email ${email}: ${error.message}`);
      throw error;
    }
  }

  async deleteRefreshToken(userId: number): Promise<void> {
    try {
      await this.authRepository.delete({ userid: userId });
      await this.loggingService.logInfo(`Refresh token deleted for userId: ${userId}`);
    } catch (error) {
      await this.loggingService.logError(`Failed to delete refresh token for userId ${userId}: ${error.message}`);
      throw new Error('리프레시 토큰 삭제에 실패했습니다.');
    }
  }
}
