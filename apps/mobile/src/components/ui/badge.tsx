import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Brand, Radius, Spacing } from '@/constants/theme';
import { useTranslation } from '@/i18n';

/** 주문 상태 머신(docs/ARCHITECTURE.md §7)의 사용자 노출 상태 */
export type BadgeTone =
  | 'reviewing'
  | 'quoted'
  | 'paymentReceived'
  | 'paid'
  | 'inProgress'
  | 'completed'
  | 'cancelled'
  | 'rejected'
  | 'refunded';

/** 톤별 색 — 라벨은 i18n(status.<tone>)에서 온다 */
const TONE_COLOR: Record<BadgeTone, string> = {
  reviewing: Brand.warning,
  quoted: Brand.purple,
  paymentReceived: Brand.warning, // PayPal 결제 검증됨, 관리자 확인 대기
  paid: Brand.success,
  inProgress: Brand.info,
  completed: Brand.textMuted,
  cancelled: Brand.danger,
  rejected: Brand.danger,
  refunded: Brand.textMuted,
};

/** 서버 RequestStatus → 배지 톤 */
export const STATUS_TONE: Record<string, BadgeTone> = {
  REVIEWING: 'reviewing',
  QUOTED: 'quoted',
  PAYMENT_RECEIVED: 'paymentReceived',
  PAID: 'paid',
  IN_PROGRESS: 'inProgress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  REJECTED: 'rejected',
  REFUNDED: 'refunded',
};

export function Badge({ tone }: { tone: BadgeTone }) {
  const { t } = useTranslation();
  const color = TONE_COLOR[tone];
  return (
    <View style={[styles.badge, { borderColor: color }]}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <ThemedText type="caption" style={{ color, letterSpacing: 0 }}>
        {t(`status.${tone}`)}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xxs,
    borderWidth: 1,
    borderRadius: Radius.full,
    paddingVertical: Spacing.xxs,
    paddingHorizontal: Spacing.xs + 2,
    alignSelf: 'flex-start',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});
