import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsString, Length } from 'class-validator';

/** 고객 이의제기 — 사유 필수, 관리자에게 그대로 전달된다 (약관 제6조) */
export class DisputeRequestDto {
  @ApiProperty({
    maxLength: 500,
    example: 'The translated contract is missing page 3.',
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @Length(1, 500)
  reason: string;
}
