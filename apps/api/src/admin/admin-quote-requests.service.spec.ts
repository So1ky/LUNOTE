import { ConflictException, NotFoundException } from '@nestjs/common';
import { RequestStatus } from '@prisma/client';
import { AdminQuoteRequestsService } from './admin-quote-requests.service';

/** updateStatus 전용 — prisma는 상태 조회·조건부 갱신·감사 로그만 흉내 낸다 */
const setup = (
  current: { status: RequestStatus; userId: string } | null,
  updatedCount = 1,
) => {
  const tx = {
    quoteRequest: {
      updateMany: jest.fn().mockResolvedValue({ count: updatedCount }),
    },
    adminAuditLog: { create: jest.fn().mockResolvedValue(undefined) },
  };
  const prisma = {
    quoteRequest: {
      // 1번째: 전이 사전 검사, 2번째: findOne(반환용) — 첨부 없는 최소 형태
      findFirst: jest
        .fn()
        .mockResolvedValueOnce(current)
        .mockResolvedValue({ id: 7, status: 'IN_PROGRESS', attachments: [] }),
    },
    $transaction: jest.fn((fn: (t: typeof tx) => unknown) => fn(tx)),
  };
  const storage = { presignDownload: jest.fn() };
  const notice = { title: 'Work has started', body: '' };
  const notifications = {
    notifyUserWorkStatus: jest.fn().mockResolvedValue(notice),
    enqueueUserPush: jest.fn(),
  };
  const config = { getOrThrow: jest.fn().mockReturnValue('7') };
  const service = new AdminQuoteRequestsService(
    prisma as never,
    storage as never,
    notifications as never,
    config as never,
  );
  return { service, prisma, tx, notifications, notice };
};

describe('AdminQuoteRequestsService.updateStatus', () => {
  it('PAID → IN_PROGRESS: 조건부 갱신 + 감사 로그 + 사용자 알림 + 푸시', async () => {
    const s = setup({ status: RequestStatus.PAID, userId: 'u1' });
    await s.service.updateStatus(7, RequestStatus.IN_PROGRESS, 'admin1');

    expect(s.tx.quoteRequest.updateMany).toHaveBeenCalledWith({
      where: { id: 7, status: RequestStatus.PAID },
      data: { status: RequestStatus.IN_PROGRESS },
    });
    expect(s.tx.adminAuditLog.create).toHaveBeenCalledWith({
      data: {
        adminId: 'admin1',
        action: 'REQUEST_STATUS_CHANGED',
        targetType: 'QUOTE_REQUEST',
        targetId: '7',
        detail: { from: RequestStatus.PAID, to: RequestStatus.IN_PROGRESS },
      },
    });
    expect(s.notifications.notifyUserWorkStatus).toHaveBeenCalledWith(s.tx, {
      requestId: 7,
      ownerId: 'u1',
      status: RequestStatus.IN_PROGRESS,
    });
    expect(s.notifications.enqueueUserPush).toHaveBeenCalledWith({
      type: 'USER_PUSH',
      userId: 'u1',
      requestId: 7,
      ...s.notice,
    });
  });

  it('IN_PROGRESS → COMPLETED 허용', async () => {
    const s = setup({ status: RequestStatus.IN_PROGRESS, userId: 'u1' });
    await s.service.updateStatus(7, RequestStatus.COMPLETED, 'admin1');
    expect(s.tx.quoteRequest.updateMany).toHaveBeenCalledWith({
      where: { id: 7, status: RequestStatus.IN_PROGRESS },
      data: { status: RequestStatus.COMPLETED },
    });
  });

  it('PAYMENT_RECEIVED → PAID 허용 (PayPal 결제의 관리자 확인) + 사용자 알림', async () => {
    const s = setup({ status: RequestStatus.PAYMENT_RECEIVED, userId: 'u1' });
    await s.service.updateStatus(7, RequestStatus.PAID, 'admin1');
    expect(s.tx.quoteRequest.updateMany).toHaveBeenCalledWith({
      where: { id: 7, status: RequestStatus.PAYMENT_RECEIVED },
      data: { status: RequestStatus.PAID },
    });
    expect(s.notifications.notifyUserWorkStatus).toHaveBeenCalledWith(s.tx, {
      requestId: 7,
      ownerId: 'u1',
      status: RequestStatus.PAID,
    });
  });

  it('QUOTED에서 PAID는 409 — 결제 검증 없이 PAID로 올릴 수 없다', async () => {
    const s = setup({ status: RequestStatus.QUOTED, userId: 'u1' });
    await expect(
      s.service.updateStatus(7, RequestStatus.PAID, 'admin1'),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(s.prisma.$transaction).not.toHaveBeenCalled();
  });

  it('현재 상태가 전이 조건과 다르면 409, 아무것도 쓰지 않는다', async () => {
    const s = setup({ status: RequestStatus.QUOTED, userId: 'u1' });
    await expect(
      s.service.updateStatus(7, RequestStatus.IN_PROGRESS, 'admin1'),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(s.prisma.$transaction).not.toHaveBeenCalled();
    expect(s.notifications.enqueueUserPush).not.toHaveBeenCalled();
  });

  it('PAID에서 바로 COMPLETED는 불가(409)', async () => {
    const s = setup({ status: RequestStatus.PAID, userId: 'u1' });
    await expect(
      s.service.updateStatus(7, RequestStatus.COMPLETED, 'admin1'),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('동시 갱신으로 updateMany가 0건이면 409, 푸시 없음', async () => {
    const s = setup({ status: RequestStatus.PAID, userId: 'u1' }, 0);
    await expect(
      s.service.updateStatus(7, RequestStatus.IN_PROGRESS, 'admin1'),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(s.notifications.enqueueUserPush).not.toHaveBeenCalled();
  });

  it('문의가 없으면 404', async () => {
    const s = setup(null);
    await expect(
      s.service.updateStatus(7, RequestStatus.IN_PROGRESS, 'admin1'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
