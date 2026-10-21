import { ApiProperty } from '@nestjs/swagger';
import { RequestStatus } from '@prisma/client';
import { IsIn } from 'class-validator';

/**
 * 관리자가 수동으로 옮길 수 있는 상태.
 * PAID는 PAYMENT_RECEIVED(PortOne이 검증한 PayPal 결제)에서만 — 결제 검증 없이 PAID로 올리는 길은 없다.
 * AWAITING_CONFIRMATION은 "완료 통지" (약관 제6조). COMPLETED는 그 상태에서만 — 관리자 강제 완료(자동 완료가 안 될 때의 비상용,
 * 2026-10-21 기획 요청). 통지 없이 IN_PROGRESS에서 바로 COMPLETED는 불가.
 * 나머지(PAYMENT_RECEIVED·CANCELLED·REFUNDED)는 결제·사용자 흐름이, REJECTED는 거절 API가 정한다
 */
export const ADMIN_SETTABLE_STATUSES = [
  RequestStatus.PAID,
  RequestStatus.IN_PROGRESS,
  RequestStatus.AWAITING_CONFIRMATION,
  RequestStatus.COMPLETED,
] as const;
export type AdminSettableStatus = (typeof ADMIN_SETTABLE_STATUSES)[number];

export class UpdateRequestStatusDto {
  @ApiProperty({ enum: ADMIN_SETTABLE_STATUSES, example: 'IN_PROGRESS' })
  @IsIn(ADMIN_SETTABLE_STATUSES)
  status: AdminSettableStatus;
}
