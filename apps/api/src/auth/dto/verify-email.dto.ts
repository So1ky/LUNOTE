import { ApiProperty } from '@nestjs/swagger';
import { Matches } from 'class-validator';

export class VerifyEmailDto {
  @ApiProperty({ example: '123456', description: '6자리 인증 코드' })
  @Matches(/^\d{6}$/, { message: 'code must be 6 digits' })
  code: string;
}
