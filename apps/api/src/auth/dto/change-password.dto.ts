import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({ example: 'my-current-password' })
  @IsString()
  currentPassword: string;

  // 정책은 SignupDto.password와 동일하게 유지한다
  @ApiProperty({ example: 'my-new-password1', minLength: 8, maxLength: 72 })
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  newPassword: string;
}
