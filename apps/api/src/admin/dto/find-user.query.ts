import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class FindUserQuery {
  @ApiProperty({ example: 'someone@example.com' })
  @IsEmail()
  email: string;
}
