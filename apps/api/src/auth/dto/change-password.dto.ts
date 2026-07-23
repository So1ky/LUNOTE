import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches } from 'class-validator';
import { PASSWORD_PATTERN, PASSWORD_POLICY_MESSAGE } from '../password.policy';

export class ChangePasswordDto {
  @ApiProperty({ example: 'my-current-password' })
  @IsString()
  currentPassword: string;

  @ApiProperty({ example: 'my-new-password1!', minLength: 8, maxLength: 72 })
  @Matches(PASSWORD_PATTERN, { message: PASSWORD_POLICY_MESSAGE })
  newPassword: string;
}
