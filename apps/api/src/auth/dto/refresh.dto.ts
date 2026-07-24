import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class RefreshDto {
  @ApiProperty({ description: '로그인/이전 갱신에서 받은 refresh token' })
  @IsString()
  @Length(96, 96) // randomBytes(48).toString('hex')
  refreshToken: string;
}
