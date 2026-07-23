import { StyleSheet, Switch, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { Brand, Spacing } from '@/constants/theme';

/**
 * 알림 채널 정책: 자동 알림은 인앱(+추후 OS 푸시)뿐이다.
 * 문의에 남긴 연락수단(email/phone/WhatsApp)은 상담을 위해 관리자가 직접 연락하는 채널.
 */
export default function NotificationSettingsScreen() {
  return (
    <Screen>
      <ScreenHeader
        back
        title="Notifications"
        subtitle="How we keep you updated"
      />

      <Card style={styles.card}>
        <View style={styles.row}>
          <View style={styles.rowText}>
            <ThemedText type="bodyStrong">In-app notifications</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Quote and request updates in your notification inbox.
            </ThemedText>
          </View>
          <ThemedText type="smallStrong" style={styles.alwaysOn}>
            Always on
          </ThemedText>
        </View>

        <View style={styles.divider} />

        <View style={[styles.row, styles.rowDisabled]}>
          <View style={styles.rowText}>
            <ThemedText type="bodyStrong">Push notifications</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Coming soon — get updates even when the app is closed.
            </ThemedText>
          </View>
          <Switch value={false} disabled />
        </View>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: Spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  rowDisabled: {
    opacity: 0.5,
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Brand.border,
  },
  alwaysOn: {
    color: Brand.success,
  },
});
