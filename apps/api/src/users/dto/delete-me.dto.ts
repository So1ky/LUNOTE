import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class DeleteMeDto {
  @ApiProperty({ example: 'my-current-password' })
  @IsString()
  @IsNotEmpty()
  password: string;
}
