import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({ example: 'you@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '123456', description: '6자리 재설정 코드' })
  @Matches(/^\d{6}$/, { message: 'code must be 6 digits' })
  code: string;

  // 정책은 SignupDto.password와 동일하게 유지한다
  @ApiProperty({ example: 'my-new-password1', minLength: 8, maxLength: 72 })
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  newPassword: string;
}
