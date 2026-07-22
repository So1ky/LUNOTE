import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, RequestStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
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
      createdAt: true,
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
  constructor(private readonly prisma: PrismaService) {}

  create(userId: string, dto: CreateQuoteRequestDto) {
    return this.prisma.quoteRequest.create({
      data: {
        userId,
        category: dto.category,
        desiredAmount: dto.desiredAmount,
        currency: dto.currency ?? 'USD',
        description: dto.description,
        contactMethod: dto.contactMethod,
      },
      select: REQUEST_SELECT,
    });
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
      select: REQUEST_SELECT,
    });
    if (!request) {
      throw new NotFoundException('Quote request not found');
    }
    return request;
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
