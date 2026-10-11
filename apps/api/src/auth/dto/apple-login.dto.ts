import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class AppleLoginDto {
  @ApiProperty({
    description: 'Sign in with Apple identity token (aud = 번들 ID)',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(4096)
  identityToken: string;

  // Apple은 이름을 토큰에 넣지 않고 최초 로그인 때만 앱에 준다 — 신규 가입에만 사용
  @ApiPropertyOptional({ example: 'Mina' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  firstName?: string;

  @ApiPropertyOptional({ example: 'Kim' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  lastName?: string;

  // 신규 가입이 되는 경우에만 필수 — 기존 사용자 로그인에서는 무시한다 (서비스에서 검사)
  @ApiPropertyOptional({
    example: true,
    description: '약관·개인정보처리방침 동의 (신규 가입 시 true 필수)',
  })
  @IsOptional()
  @IsBoolean()
  termsAccepted?: boolean;
}
