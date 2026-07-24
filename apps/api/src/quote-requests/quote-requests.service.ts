import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, RequestStatus } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { CreateQuoteRequestDto } from './dto/create-quote-request.dto';

/** 목록/상세 응답에서 노출할 필드 (내부 컬럼 전체 노출 금지) */
const REQUEST_SELECT = {
  id: true,
  category: true,
  desiredAmount: true,
  currency: true,
  description: true,
  contactMethod: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  quote: {
    select: {
      id: true,
      amount: true,
      currency: true,
      explanation: true,
      expiresAt: true,
      createdAt: true,
    },
  },
} satisfies Prisma.QuoteRequestSelect;

/** 상세 전용 — 첨부파일 포함 (목록에서는 무게를 줄이기 위해 제외) */
const REQUEST_DETAIL_SELECT = {
  ...REQUEST_SELECT,
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

/** 사용자가 직접 취소할 수 있는 상태 — 결제 이후(PAID~)는 관리자/환불 플로우로만 */
const CANCELLABLE: RequestStatus[] = [
  RequestStatus.REVIEWING,
  RequestStatus.QUOTED,
];

@Injectable()
export class QuoteRequestsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly notifications: NotificationsService,
  ) {}

  async create(userId: string, userEmail: string, dto: CreateQuoteRequestDto) {
    // 소유권 검증: presign이 발급한 키는 항상 본인 프리픽스로 시작한다.
    // 다른 사용자의 키(또는 임의 경로)를 첨부하려는 시도를 차단.
    const myPrefix = `uploads/${userId}/`;
    for (const att of dto.attachments ?? []) {
      if (!att.s3Key.startsWith(myPrefix)) {
        throw new BadRequestException('Invalid attachment key');
      }
    }

    const created = await this.prisma.quoteRequest.create({
      data: {
        userId,
        category: dto.category,
        desiredAmount: dto.desiredAmount,
        currency: dto.currency ?? 'USD',
        description: dto.description,
        contactMethod: dto.contactMethod,
        attachments: dto.attachments?.length
          ? {
              create: dto.attachments.map((a) => ({
                s3Key: a.s3Key,
                fileName: a.fileName,
                mimeType: a.mimeType,
                sizeBytes: a.sizeBytes,
              })),
            }
          : undefined,
      },
      select: REQUEST_SELECT,
    });

    // 운영자에게 접수 알림 (큐 등록 실패는 서비스 내부에서 삼킴 — 응답에 영향 없음)
    await this.notifications.enqueue({
      type: 'REQUEST_CREATED',
      requestId: created.id,
      category: created.category,
      userEmail,
    });

    return created;
  }

  findMine(userId: string) {
    return this.prisma.quoteRequest.findMany({
      where: { userId }, // IDOR 방지의 핵심: 항상 소유자 조건을 쿼리에 포함
      orderBy: { createdAt: 'desc' },
      select: REQUEST_SELECT,
    });
  }

  async findOne(userId: string, id: number) {
    // 소유자 조건을 where에 포함 — 남의 문의는 "없는 것"과 동일하게 404.
    // (403을 주면 "그 ID가 존재한다"는 정보가 새어나간다)
    const request = await this.prisma.quoteRequest.findFirst({
      where: { id, userId },
      select: REQUEST_DETAIL_SELECT,
    });
    if (!request) {
      throw new NotFoundException('Quote request not found');
    }

    // 버킷은 비공개 — 첨부마다 1시간짜리 다운로드 URL을 발급해 응답에 포함
    const attachments = await Promise.all(
      request.attachments.map(async (a) => ({
        ...a,
        downloadUrl: await this.storage.presignDownload(a.s3Key),
      })),
    );
    return { ...request, attachments };
  }

  async cancel(userId: string, id: number) {
    await this.findOne(userId, id); // 존재+소유권 확인 (없으면 404)

    // 상태 조건까지 updateMany의 where에 포함해 동시 요청에도 안전하게 처리
    const { count } = await this.prisma.quoteRequest.updateMany({
      where: { id, userId, status: { in: CANCELLABLE } },
      data: { status: RequestStatus.CANCELLED },
    });
    if (count === 0) {
      throw new ConflictException(
        'Only requests in REVIEWING or QUOTED status can be cancelled',
      );
    }
    return this.findOne(userId, id);
  }
}
