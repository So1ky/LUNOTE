import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { AppIcon, type AppIconName } from '@/components/ui/app-icon';
import { Button } from '@/components/ui/button';
import { Brand, Radius, Spacing } from '@/constants/theme';

type EmptyStateProps = {
  icon?: AppIconName;
  title?: string;
  message: string;
  action?: { label: string; onPress: () => void };
};

/** 목록 비어 있음 / 게스트 안내 등 화면 중앙의 빈 상태 뷰 */
export function EmptyState({ icon, title, message, action }: EmptyStateProps) {
  return (
    <View style={styles.wrap}>
      {icon && (
        <View style={styles.iconTile}>
          <AppIcon name={icon} size={28} color={Brand.purpleSoft} />
        </View>
      )}
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
  iconTile: {
    width: 64,
    height: 64,
    borderRadius: Radius.lg,
    backgroundColor: Brand.purpleTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
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
