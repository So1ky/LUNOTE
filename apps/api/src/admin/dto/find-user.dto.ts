import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class FindUserDto {
  @ApiProperty({ example: 'someone@example.com' })
  @IsEmail()
  email: string;
}
