import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createTransport, Transporter } from 'nodemailer';

/** 로그용 이메일 마스킹 — 개인정보를 로그에 남기지 않는다 */
const maskEmail = (email: string) => email.replace(/^(.).*?(@.*)$/, '$1***$2');

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: Transporter | null;
  private readonly from: string;

  constructor(config: ConfigService) {
    const host = config.get<string>('SMTP_HOST');
    this.from = config.getOrThrow<string>('MAIL_FROM');
    // SMTP 미설정 시 로그 폴백 (로컬은 Mailpit이라 항상 설정되어 있음)
    this.transporter = host
      ? createTransport({
          host,
          port: Number(config.getOrThrow('SMTP_PORT')),
          secure: false,
          // 프로덕션(SES)은 SMTP_USER/PASS 추가 — Secrets Manager에서 주입
          ...(config.get('SMTP_USER')
            ? {
                auth: {
                  user: config.get<string>('SMTP_USER'),
                  pass: config.get<string>('SMTP_PASS'),
                },
              }
            : {}),
        })
      : null;
  }

  async send(to: string, subject: string, text: string) {
    if (!this.transporter) {
      // 제목·본문은 기록하지 않는다 — 인증 코드 등 민감정보 포함 가능 (로그 규칙)
      this.logger.log(`[메일 폴백] to=${maskEmail(to)} (SMTP 미설정, 발송 생략)`);
      return;
    }
    await this.transporter.sendMail({ from: this.from, to, subject, text });
  }
}
