import { BadRequestException, ConflictException } from '@nestjs/common';
import { AppleNotificationsService } from './apple-notifications.service';

const setup = (user: { id: string } | null) => {
  const prisma = { user: { findFirst: jest.fn().mockResolvedValue(user) } };
  const apple = { verifyNotification: jest.fn() };
  const auth = {
    revokeAllRefreshTokens: jest.fn().mockResolvedValue(undefined),
  };
  const accountDeletion = {
    deleteAccount: jest.fn().mockResolvedValue(undefined),
  };
  const notifications = {
    notifyAdminsAppleAccountDeleted: jest.fn().mockResolvedValue(undefined),
  };
  const service = new AppleNotificationsService(
    prisma as never,
    apple as never,
    auth as never,
    accountDeletion as never,
    notifications as never,
  );
  const event = (type: string) =>
    apple.verifyNotification.mockResolvedValue({ type, sub: 'apple-sub' });
  return {
    service,
    prisma,
    apple,
    auth,
    accountDeletion,
    notifications,
    event,
  };
};

describe('AppleNotificationsService', () => {
  it('consent-revoked → 전 세션 폐기, 계정 유지', async () => {
    const s = setup({ id: 'u1' });
    s.event('consent-revoked');
    await expect(s.service.handle('jwt')).resolves.toEqual({ ok: true });
    expect(s.prisma.user.findFirst).toHaveBeenCalledWith({
      where: { provider: 'APPLE', providerId: 'apple-sub' },
      select: { id: true },
    });
    expect(s.auth.revokeAllRefreshTokens).toHaveBeenCalledWith('u1');
    expect(s.accountDeletion.deleteAccount).not.toHaveBeenCalled();
  });

  it('account-delete → 자동 탈퇴', async () => {
    const s = setup({ id: 'u2' });
    s.event('account-delete');
    await s.service.handle('jwt');
    expect(s.accountDeletion.deleteAccount).toHaveBeenCalledWith('u2');
    expect(
      s.notifications.notifyAdminsAppleAccountDeleted,
    ).not.toHaveBeenCalled();
  });

  it('account-delete인데 결제 진행 중(409) → 세션 폐기 + 관리자 알림, 200', async () => {
    const s = setup({ id: 'u3' });
    s.event('account-delete');
    s.accountDeletion.deleteAccount.mockRejectedValue(new ConflictException());
    await expect(s.service.handle('jwt')).resolves.toEqual({ ok: true });
    expect(s.auth.revokeAllRefreshTokens).toHaveBeenCalledWith('u3');
    expect(
      s.notifications.notifyAdminsAppleAccountDeleted,
    ).toHaveBeenCalledWith(expect.anything(), 'u3');
  });

  it('account-delete 처리 중 다른 에러는 그대로 던진다 (Apple이 재전송)', async () => {
    const s = setup({ id: 'u4' });
    s.event('account-delete');
    s.accountDeletion.deleteAccount.mockRejectedValue(new Error('db down'));
    await expect(s.service.handle('jwt')).rejects.toThrow('db down');
  });

  it.each(['email-disabled', 'email-enabled'])(
    '%s → 조치 없음',
    async (type) => {
      const s = setup({ id: 'u5' });
      s.event(type);
      await s.service.handle('jwt');
      expect(s.auth.revokeAllRefreshTokens).not.toHaveBeenCalled();
      expect(s.accountDeletion.deleteAccount).not.toHaveBeenCalled();
    },
  );

  it('사용자가 없으면(이미 탈퇴) 200 무시', async () => {
    const s = setup(null);
    s.event('account-delete');
    await expect(s.service.handle('jwt')).resolves.toEqual({ ok: true });
    expect(s.accountDeletion.deleteAccount).not.toHaveBeenCalled();
  });

  it('검증 실패는 그대로 400', async () => {
    const s = setup({ id: 'u6' });
    s.apple.verifyNotification.mockRejectedValue(new BadRequestException());
    await expect(s.service.handle('forged')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});
