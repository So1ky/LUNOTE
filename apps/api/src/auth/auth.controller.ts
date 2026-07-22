import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { AuthUser } from './auth-user';
import { AuthService } from './auth.service';
import { CurrentUser } from './current-user.decorator';
import { LoginDto } from './dto/login.dto';
import { SignupDto } from './dto/signup.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { JwtAuthGuard } from './jwt-auth.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  // 가입 폭주 방지: IP당 1시간 10회
  @Post('signup')
  @Throttle({ default: { ttl: 3_600_000, limit: 10 } })
  @ApiOperation({ summary: '이메일 회원가입 (IP당 1시간 10회)' })
  @ApiResponse({ status: 201, description: 'accessToken 발급' })
  @ApiResponse({ status: 409, description: '이미 가입된 이메일' })
  signup(@Body() dto: SignupDto) {
    return this.auth.signup(dto);
  }

  // 무차별 대입 방지: IP당 1분 5회
  @Post('login')
  @HttpCode(200)
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  @ApiOperation({ summary: '이메일 로그인 (IP당 1분 5회)' })
  @ApiResponse({ status: 200, description: 'accessToken 발급' })
  @ApiResponse({
    status: 401,
    description: '자격증명 불일치 (계정 존재 여부는 노출하지 않는다)',
  })
  @ApiResponse({ status: 429, description: '요청 한도 초과' })
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '내 정보 조회 (JWT 필요)' })
  @ApiResponse({ status: 401, description: '토큰 없음/무효' })
  me(@CurrentUser() user: AuthUser) {
    return user;
  }

  @Post('verify-email')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  @ApiOperation({ summary: '이메일 인증 코드 확인' })
  @ApiResponse({ status: 400, description: '코드 불일치/만료/시도 초과' })
  verifyEmail(@CurrentUser() user: AuthUser, @Body() dto: VerifyEmailDto) {
    return this.auth.verifyEmail(user.id, dto.code);
  }

  @Post('resend-verification')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Throttle({ default: { ttl: 3_600_000, limit: 5 } })
  @ApiOperation({ summary: '인증 코드 재발송 (1분 쿨다운, 시간당 5회)' })
  resendVerification(@CurrentUser() user: AuthUser) {
    return this.auth.resendVerification(user.id);
  }
}
