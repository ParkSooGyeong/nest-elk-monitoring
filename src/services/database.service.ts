import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../models/user.entity';
import { Auth } from '../models/auth.entity';
import { LoggingService } from './logging.service';

@Injectable()
export class DatabaseService {
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
    @InjectRepository(Auth) private authRepository: Repository<Auth>,
    private readonly loggingService: LoggingService,
  ) {}

  async createUser(user: Partial<User>): Promise<User> {
    try {
      return await this.userRepository.save(user);
    } catch (error) {
      await this.loggingService.logError(`Failed to create user: ${error.message}`);
      throw error;
    }
  }

  async createAuth(auth: Partial<Auth>): Promise<Auth> {
    try {
      return await this.authRepository.save(auth);
    } catch (error) {
      await this.loggingService.logError(`Failed to create auth: ${error.message}`);
      throw error;
    }
  }
}
