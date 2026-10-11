import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * 수동 계좌이체 — 법인 계좌 정보. 비밀이 아니라 ConfigMap(오버레이 literals)으로 들어온다.
 * 로컬·미설정이면 isConfigured=false → PaymentsService가 503(BANK_TRANSFER_NOT_CONFIGURED). PortOneGateway와 같은 방식.
 */
@Injectable()
export class BankTransferConfig {
  readonly bank: { name: string; accountNumber: string; holder: string } | null;

  constructor(config: ConfigService) {
    const name = config.get<string>('BANK_TRANSFER_BANK_NAME') || null;
    const accountNumber =
      config.get<string>('BANK_TRANSFER_ACCOUNT_NUMBER') || null;
    const holder = config.get<string>('BANK_TRANSFER_ACCOUNT_HOLDER') || null;
    this.bank =
      name && accountNumber && holder ? { name, accountNumber, holder } : null;
  }

  get isConfigured(): boolean {
    return this.bank !== null;
  }
}
