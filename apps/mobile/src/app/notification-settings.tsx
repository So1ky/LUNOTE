import { StyleSheet, Switch, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { Brand, Spacing } from '@/constants/theme';
import { useTranslation } from '@/i18n';

/**
 * 알림 채널 정책: 자동 알림은 인앱(+추후 OS 푸시)뿐이다.
 * 문의에 남긴 연락수단(email/phone/WhatsApp)은 상담을 위해 관리자가 직접 연락하는 채널.
 */
export default function NotificationSettingsScreen() {
  const { t } = useTranslation();
  return (
    <Screen>
      <ScreenHeader
        back
        title={t('notificationSettings.title')}
        subtitle={t('notificationSettings.subtitle')}
      />

      <Card style={styles.card}>
        <View style={styles.row}>
          <View style={styles.rowText}>
            <ThemedText type="bodyStrong">
              {t('notificationSettings.inAppTitle')}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {t('notificationSettings.inAppDesc')}
            </ThemedText>
          </View>
          <ThemedText type="smallStrong" style={styles.alwaysOn}>
            {t('notificationSettings.alwaysOn')}
          </ThemedText>
        </View>

        <View style={styles.divider} />

        <View style={[styles.row, styles.rowDisabled]}>
          <View style={styles.rowText}>
            <ThemedText type="bodyStrong">
              {t('notificationSettings.pushTitle')}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {t('notificationSettings.pushDesc')}
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
