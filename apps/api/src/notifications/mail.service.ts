import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createTransport, Transporter } from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: Transporter | null;
  private readonly from: string;

  constructor(config: ConfigService) {
    const host = config.get<string>('SMTP_HOST');
    this.from =
      config.get<string>('MAIL_FROM') ?? 'LUNOTE <noreply@lunote.app>';
    // SMTP 미설정 시 로그 폴백 (로컬은 Mailpit이라 항상 설정되어 있음)
    this.transporter = host
      ? createTransport({
          host,
          port: Number(config.get('SMTP_PORT') ?? 587),
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
      this.logger.log(`[메일 폴백] to=${to} subject=${subject}`);
      return;
    }
    await this.transporter.sendMail({ from: this.from, to, subject, text });
  }
}
