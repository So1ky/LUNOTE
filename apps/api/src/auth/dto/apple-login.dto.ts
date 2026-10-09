import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

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
}
