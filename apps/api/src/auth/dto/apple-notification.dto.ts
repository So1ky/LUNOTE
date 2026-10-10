import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class AppleNotificationDto {
  @ApiProperty({
    description: 'Apple이 서명한 JWT (events 클레임에 이벤트 JSON 문자열)',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(8192)
  payload: string;
}
