import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class GoogleLoginDto {
  @ApiProperty({
    description: 'Google Sign-In SDK가 준 ID 토큰 (aud = Web 클라이언트 ID)',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(4096)
  idToken: string;

  // 신규 가입이 되는 경우에만 필수 — 기존 사용자 로그인에서는 무시한다 (서비스에서 검사)
  @ApiPropertyOptional({
    example: true,
    description: '약관·개인정보처리방침 동의 (신규 가입 시 true 필수)',
  })
  @IsOptional()
  @IsBoolean()
  termsAccepted?: boolean;
}
