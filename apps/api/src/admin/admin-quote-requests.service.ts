import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma, RequestStatus } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { CreateQuoteDto } from './dto/create-quote.dto';

/** 관리자 화면용 — 사용자 요약 정보를 포함해 노출한다 */
const ADMIN_REQUEST_SELECT = {
  id: true,
  category: true,
  desiredAmount: true,
  currency: true,
  description: true,
  contactMethod: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  user: {
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      nationality: true,
      language: true,
    },
  },
  quote: {
    select: {
      id: true,
      amount: true,
      currency: true,
      explanation: true,
      expiresAt: true,
      createdAt: true,
      updatedAt: true,
    },
  },
} satisfies Prisma.QuoteRequestSelect;

/** 상세 전용 — 첨부파일 포함 */
const ADMIN_DETAIL_SELECT = {
  ...ADMIN_REQUEST_SELECT,
  attachments: {
    select: {
      id: true,
      s3Key: true,
      fileName: true,
      mimeType: true,
      sizeBytes: true,
    },
  },
} satisfies Prisma.QuoteRequestSelect;

@Injectable()
export class AdminQuoteRequestsService {
  private readonly QUOTE_VALIDITY_DAYS: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly notifications: NotificationsService,
    config: ConfigService,
  ) {
    this.QUOTE_VALIDITY_DAYS = Number(config.getOrThrow('QUOTE_VALIDITY_DAYS'));
  }

  findAll(status?: RequestStatus) {
    return this.prisma.quoteRequest.findMany({
      where: status ? { status } : undefined,
      orderBy: { createdAt: 'desc' },
      select: ADMIN_REQUEST_SELECT,
    });
  }

  async findOne(id: number) {
    const request = await this.prisma.quoteRequest.findUnique({
      where: { id },
      select: ADMIN_DETAIL_SELECT,
    });
    if (!request) {
      throw new NotFoundException('Quote request not found');
    }
    const attachments = await Promise.all(
      request.attachments.map(async (a) => ({
        ...a,
        downloadUrl: await this.storage.presignDownload(a.s3Key),
      })),
    );
    return { ...request, attachments };
  }

  /** 견적 발송: Quote 생성 + REVIEWING → QUOTED 전이 + 감사 로그를 한 트랜잭션으로 */
  async createQuote(requestId: number, dto: CreateQuoteDto, adminId: string) {
    const request = await this.findOne(requestId);

    if (request.quote) {
      // 견적은 발행 후 불변 — 수정/재발행 불가 (제품 결정 2026-07-24)
      throw new ConflictException('Quote already exists — quotes are immutable');
    }
    if (request.status !== RequestStatus.REVIEWING) {
      throw new ConflictException(
        `Cannot quote a request in ${request.status} status`,
      );
    }

    // 발행 후 불변 + 유효기간 — 만료 시 결제 불가 (ARCHITECTURE §7)
    const expiresAt = new Date(
      Date.now() + this.QUOTE_VALIDITY_DAYS * 24 * 60 * 60 * 1000,
    );

    await this.prisma.$transaction(async (tx) => {
      await tx.quote.create({
        data: {
          requestId,
          amount: dto.amount,
          currency: dto.currency ?? 'USD',
          explanation: dto.explanation,
          expiresAt,
        },
      });
      // 상태 조건을 다시 걸어 동시 견적 발송 경쟁을 차단
      const { count } = await tx.quoteRequest.updateMany({
        where: { id: requestId, status: RequestStatus.REVIEWING },
        data: { status: RequestStatus.QUOTED },
      });
      if (count === 0) {
        throw new ConflictException('Request status changed concurrently');
      }
      // 감사 로그 — 견적 발행과 같은 트랜잭션 (기록 없는 발행이 존재할 수 없게)
      await tx.adminAuditLog.create({
        data: {
          adminId,
          action: 'QUOTE_CREATED',
          targetType: 'QUOTE_REQUEST',
          targetId: String(requestId),
          detail: {
            amount: dto.amount,
            currency: dto.currency ?? 'USD',
            expiresAt: expiresAt.toISOString(),
          },
        },
      });
      // 사용자 인앱 알림도 같은 트랜잭션 — 발행됐는데 알림이 없는 상태가 불가능 (DB-first)
      await this.notifications.notifyUserQuoteSent(tx, {
        requestId,
        ownerId: request.user.id,
        amount: String(dto.amount),
        currency: dto.currency ?? 'USD',
      });
    });

    return this.findOne(requestId);
  }

  // 견적 수정 API는 두지 않는다 — 발행 후 불변 (제품 결정 2026-07-24, ARCHITECTURE §7)
}
