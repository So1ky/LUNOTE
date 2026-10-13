import { userNoticeTitle } from './user-notice-copy';

describe('userNoticeTitle', () => {
  it('지원 언어면 그 언어의 제목', () => {
    expect(userNoticeTitle('QUOTE_SENT', 'ko')).toBe('견적이 도착했어요');
    expect(userNoticeTitle('PAYMENT_PAID', 'ja')).toBe(
      'お支払いを確認しました',
    );
  });

  it('언어가 없거나(null) 지원 목록에 없으면 영어', () => {
    expect(userNoticeTitle('QUOTE_SENT', null)).toBe('Your quote is ready');
    expect(userNoticeTitle('PAYMENT_PAID', 'fr')).toBe('Payment received');
  });

  it('6개 언어 모두 모든 알림의 제목이 비어 있지 않다', () => {
    for (const lang of ['ko', 'en', 'ja', 'zh', 'de', 'es']) {
      expect(userNoticeTitle('QUOTE_SENT', lang)).not.toBe('');
      expect(userNoticeTitle('PAYMENT_PAID', lang)).not.toBe('');
      expect(userNoticeTitle('WORK_STARTED', lang)).not.toBe('');
      expect(userNoticeTitle('WORK_COMPLETED', lang)).not.toBe('');
    }
  });
});
