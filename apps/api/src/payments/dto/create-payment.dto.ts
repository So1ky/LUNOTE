import { ApiProperty } from '@nestjs/swagger';
import { Equals, IsBoolean, IsUUID } from 'class-validator';

export class CreatePaymentDto {
  // 금액/통화는 받지 않는다 — 결제 금액의 유일한 원천은 서버의 Quote (ARCHITECTURE §7)
  @ApiProperty({ description: '결제할 견적 ID' })
  @IsUUID()
  quoteId: string;

  // "결제 즉시 수행 개시, 개시 후 청약철회는 미수행 부분에 한함"에 대한 명시 동의 (전자상거래법 §17②5호)
  @ApiProperty({
    example: true,
    description: '청약철회 제한 동의 (true만 허용)',
  })
  @IsBoolean()
  @Equals(true, { message: 'withdrawalConsent must be true' })
  withdrawalConsent: boolean;
}
