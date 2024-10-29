import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,  // ConfigService를 주입하여 환경 변수에서 시크릿 키 사용
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const token = request.headers['authorization']?.split(' ')[1]; // Bearer 토큰 형식에서 토큰만 추출

    if (!token) {
      throw new UnauthorizedException('액세스 토큰이 없습니다.');
    }

    try {
      // 환경 변수에서 시크릿 키 가져오기
      const secret = this.configService.get<string>('JWT_SECRET');
      const decoded = this.jwtService.verify(token, { secret });
      request['user'] = decoded;  // 디코딩된 사용자 정보를 request에 추가
      return true;
    } catch (error) {
      throw new UnauthorizedException('유효하지 않은 토큰입니다.');
    }
  }
}
