import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Badge, STATUS_TONE } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Brand, Radius, Spacing } from '@/constants/theme';
import { CATEGORY_META, formatDate, type QuoteRequest } from '@/lib/quote-requests';

type RequestRowProps = {
  request: QuoteRequest;
  onPress: () => void;
};

/** 요청 목록 한 행 — 홈 최근 요청과 Quote 탭 목록이 공유한다 */
export function RequestRow({ request, onPress }: RequestRowProps) {
  const meta = CATEGORY_META[request.category];

  return (
    <Card style={styles.row} onPress={onPress}>
      <View style={styles.iconTile}>
        <ThemedText style={styles.iconEmoji}>{meta.emoji}</ThemedText>
      </View>
      <View style={styles.text}>
        <ThemedText type="bodyStrong" numberOfLines={1}>
          {meta.label}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          #{request.id} · {formatDate(request.createdAt)}
        </ThemedText>
      </View>
      <Badge tone={STATUS_TONE[request.status] ?? 'completed'} />
    </Card>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
  },
  iconTile: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    backgroundColor: Brand.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconEmoji: {
    fontSize: 18,
    lineHeight: 24,
  },
  text: {
    flex: 1,
    gap: 2,
  },
});
