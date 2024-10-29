import { Controller, Post, Get, Body, Req, Res, UseGuards } from '@nestjs/common';
import { UserService } from '../services/user.service';
import { AuthService } from '../services/auth.service';
import { LoggingService } from '../services/logging.service'; // LoggingService 가져오기
import { Response, Request } from 'express';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import * as bcrypt from 'bcrypt';

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

      res.cookie('accessToken', accessToken, {
        httpOnly: true,
        maxAge: 60 * 60 * 1000,
      });
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      await this.loggingService.logInfo(`User signed up successfully: ${user.id}`);
      return res.json({
        message: '회원가입이 완료되었습니다.',
        userId: user.id,
        accessToken,
        refreshToken,
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

      res.cookie('accessToken', accessToken, {
        httpOnly: true,
        maxAge: 60 * 60 * 1000,
      });
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      await this.loggingService.logInfo(`User logged in successfully: ${user.id}`);
      return res.json({
        message: '로그인에 성공하였습니다.',
        userId: user.id,
        accessToken,
        refreshToken,
      });
    } catch (error) {
      await this.loggingService.logError(`Login failed for email ${email}: ${error.message}`);
      return res.status(500).json({ message: '로그인 중 오류가 발생했습니다.' });
    }
  }
}
