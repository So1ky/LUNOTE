import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Matches,
  Max,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateQuoteDto {
  // 결제 금액의 유일한 원천 — 앱/사용자가 보내는 금액은 절대 신뢰하지 않는다 (ARCHITECTURE §7)
  @ApiProperty({ example: 340 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @Max(1_000_000)
  amount: number;

  @ApiPropertyOptional({ example: 'USD', default: 'USD' })
  @IsOptional()
  @Matches(/^[A-Z]{3}$/, { message: 'currency must be a 3-letter ISO code' })
  currency?: string;

  @ApiProperty({
    example:
      'Includes 3 apartment viewings, contract translation, and move-in support.',
    description: '가격 책정 근거 — 사용자에게 그대로 노출된다',
  })
  @IsString()
  @MinLength(5)
  @MaxLength(2000)
  explanation: string;
}

export class UpdateQuoteDto extends PartialType(CreateQuoteDto) {}
