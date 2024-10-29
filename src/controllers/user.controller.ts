import { Controller, Post, Get, Body, Res, Req, UseGuards, Query } from '@nestjs/common';
import { UserService } from '../services/user.service';
import { AuthService } from '../services/auth.service';
import { LoggingService } from '../services/logging.service'; // LoggingService 가져오기
import { Response, Request } from 'express';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import * as bcrypt from 'bcrypt';
import { User } from '../models/user.entity';

@Controller('user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly authService: AuthService,
    private readonly loggingService: LoggingService,
  ) {}

  @Post('signup')
  async signUp(
    @Body('name') name: string,
    @Body('birthdate') birthdate: Date,
    @Body('email') email: string,
    @Body('password') password: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    try {
      const refreshToken = await this.authService.generateRefreshToken();
      const { user } = await this.userService.signUp(name, birthdate, email, password, refreshToken);
      const accessToken = await this.authService.generateAccessToken(user.id);

      // CSRF 토큰 생성
      const csrfToken = req.csrfToken();

      res.cookie('accessToken', accessToken, {
        httpOnly: true,
        maxAge: 60 * 60 * 1000,
      });
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
      res.cookie('XSRF-TOKEN', csrfToken, {
        httpOnly: false,
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      await this.loggingService.logInfo(`User signed up successfully: ${user.id}`);
      return res.json({
        message: '회원가입이 완료되었습니다.',
        userId: user.id,
        accessToken,
        refreshToken,
        csrfToken,
      });
    } catch (error) {
      await this.loggingService.logError(`User sign-up failed for email ${email}: ${error.message}`);
      return res.status(500).json({ message: '회원가입 중 오류가 발생했습니다.' });
    }
  }

  @Post('login')
  async login(
    @Body('email') email: string,
    @Body('password') password: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    try {
      const user = await this.userService.findByEmail(email);
      if (!user) {
        await this.loggingService.logWarning(`Login attempt failed: User not found for email ${email}`);
        return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
      }

      const isPasswordMatching = await bcrypt.compare(password, user.password);
      if (!isPasswordMatching) {
        await this.loggingService.logWarning(`Login attempt failed: Incorrect password for email ${email}`);
        return res.status(401).json({ message: '비밀번호가 일치하지 않습니다.' });
      }

      const accessToken = await this.authService.generateAccessToken(user.id);
      const refreshToken = await this.authService.generateRefreshToken();

      // CSRF 토큰 생성
      const csrfToken = req.csrfToken();

      res.cookie('accessToken', accessToken, {
        httpOnly: true,
        maxAge: 60 * 60 * 1000,
      });
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
      res.cookie('XSRF-TOKEN', csrfToken, {
        httpOnly: false,
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      await this.loggingService.logInfo(`User logged in successfully: ${user.id}`);
      return res.json({
        message: '로그인에 성공하였습니다.',
        userId: user.id,
        accessToken,
        refreshToken,
        csrfToken,
      });
    } catch (error) {
      await this.loggingService.logError(`Login failed for email ${email}: ${error.message}`);
      return res.status(500).json({ message: '로그인 중 오류가 발생했습니다.' });
    }
  }

  @Post('logout')
  async logout(
    @Body('userId') userId: number,
    @Res() res: Response,
  ) {
    try {
      // 리프레시 토큰 삭제
      await this.userService.deleteRefreshToken(userId);

      // 쿠키 삭제
      res.clearCookie('accessToken');
      res.clearCookie('refreshToken');
      res.clearCookie('XSRF-TOKEN');

      await this.loggingService.logInfo(`User logged out successfully: ${userId}`);
      return res.json({
        message: '로그아웃이 완료되었습니다.',
      });
    } catch (error) {
      await this.loggingService.logError(`Logout failed for userId ${userId}: ${error.message}`);
      return res.status(500).json({ message: '로그아웃 중 오류가 발생했습니다.' });
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(
    @Req() req: Request,
    @Res() res: Response,
    @Query('email') email?: string,
    @Query('userId') userId?: number,
  ) {
    try {
      let user: User | undefined;
      if (email) {
        user = await this.userService.findByEmail(email);
      } 
      else if (userId) {
        user = await this.userService.findById(userId);
      } 
      else {
        user = await this.userService.findById(req['user'].userId);
      }

      if (!user) {
        await this.loggingService.logWarning(`Profile retrieval failed: User not found`);
        return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
      }
      const { password, ...userWithoutPassword } = user;
      await this.loggingService.logInfo(`Profile retrieved successfully for userId: ${user.id}`);
      return res.json({ user: userWithoutPassword });
    } catch (error) {
      await this.loggingService.logError(`Failed to retrieve profile: ${error.message}`);
      return res.status(500).json({ message: '프로필 조회 중 오류가 발생했습니다.' });
    }
  }

  @Post('balance')
  async getBalance(
    @Res() res: Response,
    @Body('email') email?: string,
    @Body('userId') userId?: number,
  ) {
    try {
      let user: User | undefined;

      if (email) {
        user = await this.userService.findByEmail(email);
      } else if (userId) {
        user = await this.userService.findById(userId);
      }

      if (!user || !user.balance) {
        await this.loggingService.logWarning(`Balance retrieval failed: User or balance not found`);
        return res.status(404).json({ message: '사용자 또는 잔액 정보를 찾을 수 없습니다.' });
      }

      await this.loggingService.logInfo(`Balance retrieved successfully for userId: ${user.id}`);
      return res.json({
        message: '잔액 조회 성공',
        userId: user.id,
        email: user.email,
        balance: user.balance.balance,
      });
    } catch (error) {
      await this.loggingService.logError(`Balance retrieval failed: ${error.message}`);
      return res.status(500).json({ message: '잔액 조회 중 오류가 발생했습니다.' });
    }
  }
}
