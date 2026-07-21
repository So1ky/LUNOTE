import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Brand, Radius, Spacing } from '@/constants/theme';

/** 주문 상태 머신(docs/ARCHITECTURE.md §7)의 사용자 노출 상태 */
export type BadgeTone = 'reviewing' | 'quoted' | 'paid' | 'inProgress' | 'completed';

const TONES: Record<BadgeTone, { label: string; color: string }> = {
  reviewing: { label: 'Reviewing', color: Brand.warning },
  quoted: { label: 'Quote ready', color: Brand.purple },
  paid: { label: 'Paid', color: Brand.success },
  inProgress: { label: 'In progress', color: '#60A5FA' },
  completed: { label: 'Completed', color: Brand.textMuted },
};

export function Badge({ tone }: { tone: BadgeTone }) {
  const { label, color } = TONES[tone];
  return (
    <View style={[styles.badge, { borderColor: color }]}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <ThemedText type="small" style={{ color, fontSize: 12, lineHeight: 16 }}>
        {label}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one + 2,
    borderWidth: 1,
    borderRadius: Radius.xl,
    paddingVertical: 3,
    paddingHorizontal: Spacing.two + 2,
    alignSelf: 'flex-start',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});
