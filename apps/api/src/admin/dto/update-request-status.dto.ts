import { ApiProperty } from '@nestjs/swagger';
import { RequestStatus } from '@prisma/client';
import { IsIn } from 'class-validator';

/** 관리자가 수동으로 옮길 수 있는 상태 — 나머지(PAID·CANCELLED·REFUNDED)는 결제·사용자 흐름이 자동으로 정한다 */
export const ADMIN_SETTABLE_STATUSES = [
  RequestStatus.IN_PROGRESS,
  RequestStatus.COMPLETED,
] as const;
export type AdminSettableStatus = (typeof ADMIN_SETTABLE_STATUSES)[number];

export class UpdateRequestStatusDto {
  @ApiProperty({ enum: ADMIN_SETTABLE_STATUSES, example: 'IN_PROGRESS' })
  @IsIn(ADMIN_SETTABLE_STATUSES)
  status: AdminSettableStatus;
}
