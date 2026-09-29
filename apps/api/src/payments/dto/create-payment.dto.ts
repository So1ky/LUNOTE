import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class CreatePaymentDto {
  // 금액/통화는 받지 않는다 — 결제 금액의 유일한 원천은 서버의 Quote (ARCHITECTURE §7)
  @ApiProperty({ description: '결제할 견적 ID' })
  @IsUUID()
  quoteId: string;
}
