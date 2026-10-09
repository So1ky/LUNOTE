import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class GoogleLoginDto {
  @ApiProperty({
    description: 'Google Sign-In SDK가 준 ID 토큰 (aud = Web 클라이언트 ID)',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(4096)
  idToken: string;
}
