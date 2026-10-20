import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsString, Length } from 'class-validator';

/** 관리자 거절 — 사유는 필수이고 고객에게 그대로 전달된다 (ARCHITECTURE §7 REJECTED) */
export class RejectRequestDto {
  @ApiProperty({
    maxLength: 500,
    example: 'This request is outside the services we offer.',
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @Length(1, 500)
  reason: string;
}
