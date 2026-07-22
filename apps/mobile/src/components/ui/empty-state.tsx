import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Spacing } from '@/constants/theme';

type EmptyStateProps = {
  emoji?: string;
  title?: string;
  message: string;
  action?: { label: string; onPress: () => void };
};

/** 목록 비어 있음 / 게스트 안내 등 화면 중앙의 빈 상태 뷰 */
export function EmptyState({ emoji, title, message, action }: EmptyStateProps) {
  return (
    <View style={styles.wrap}>
      {emoji && <ThemedText style={styles.emoji}>{emoji}</ThemedText>}
      {title && <ThemedText type="heading">{title}</ThemedText>}
      <ThemedText type="small" themeColor="textSecondary" style={styles.message}>
        {message}
      </ThemedText>
      {action && (
        <Button label={action.label} onPress={action.onPress} style={styles.action} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    paddingVertical: Spacing.xxxl,
    paddingHorizontal: Spacing.xl,
    gap: Spacing.xs,
  },
  emoji: {
    fontSize: 40,
    lineHeight: 48,
  },
  message: {
    textAlign: 'center',
    maxWidth: 280,
  },
  action: {
    marginTop: Spacing.md,
    minWidth: 200,
  },
});
