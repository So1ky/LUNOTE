import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, Matches, MaxLength } from 'class-validator';
import { PASSWORD_PATTERN, PASSWORD_POLICY_MESSAGE } from '../password.policy';

export class SignupDto {
  @ApiProperty({ example: 'you@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'my-password1!', minLength: 8, maxLength: 72 })
  @Matches(PASSWORD_PATTERN, { message: PASSWORD_POLICY_MESSAGE })
  password: string;

  // 실명 — 관리자 식별용. 가입 시엔 선택, 이후 Account details에서 입력 가능
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
