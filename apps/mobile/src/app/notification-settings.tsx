import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Linking, Pressable, StyleSheet, Switch, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { Brand, Spacing } from '@/constants/theme';
import { useTranslation } from '@/i18n';
import { useAuth } from '@/lib/auth-context';
import { getPushPermission, isPushRegistered, optOutPush, registerPush, type PushPermission } from '@/lib/push';

/**
 * 알림 채널 정책: 자동 알림은 인앱 + OS 푸시. 푸시는 서버에 토큰이 있으면 켜진 것.
 * 문의에 남긴 연락수단(email/phone/WhatsApp)은 상담을 위해 관리자가 직접 연락하는 채널.
 */
export default function NotificationSettingsScreen() {
  const { t } = useTranslation();
  const { token } = useAuth();
  const [permission, setPermission] = useState<PushPermission>('undetermined');
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(false);

  // OS 설정에서 돌아올 때마다 다시 읽는다
  useFocusEffect(
    useCallback(() => {
      void (async () => {
        const [perm, registered] = await Promise.all([getPushPermission(), isPushRegistered()]);
        setPermission(perm);
        setEnabled(perm === 'granted' && registered);
      })();
    }, []),
  );

  const onToggle = async (next: boolean) => {
    if (!token || busy) return;
    if (next && permission === 'denied') {
      await Linking.openSettings();
      return;
    }
    setBusy(true);
    try {
      if (next) {
        const result = await registerPush(token);
        setEnabled(result === 'registered');
        if (result === 'denied') setPermission('denied');
      } else {
        // 서버 해제가 실패하면 throw → 아래 catch가 스위치를 되돌린다 (끈 줄 알았는데 계속 오는 상황 방지)
        await optOutPush(token);
        setEnabled(false);
      }
    } catch {
      setEnabled(!next); // 실패하면 원래대로
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <ScreenHeader back title={t('notificationSettings.title')} subtitle={t('notificationSettings.subtitle')} />

      <Card style={styles.card}>
        <View style={styles.row}>
          <View style={styles.rowText}>
            <ThemedText type="bodyStrong">{t('notificationSettings.inAppTitle')}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {t('notificationSettings.inAppDesc')}
            </ThemedText>
          </View>
          <ThemedText type="smallStrong" style={styles.alwaysOn}>
            {t('notificationSettings.alwaysOn')}
          </ThemedText>
        </View>

        <View style={styles.divider} />

        <View style={styles.row}>
          <View style={styles.rowText}>
            <ThemedText type="bodyStrong">{t('notificationSettings.pushTitle')}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {t('notificationSettings.pushDesc')}
            </ThemedText>
            {permission === 'denied' && (
              <Pressable onPress={() => void Linking.openSettings()} hitSlop={8}>
                <ThemedText type="link">{t('notificationSettings.pushDenied')}</ThemedText>
              </Pressable>
            )}
          </View>
          <Switch
            value={enabled}
            disabled={busy || !token}
            onValueChange={(v) => void onToggle(v)}
            trackColor={{ true: Brand.purple }}
          />
        </View>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { gap: Spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.md },
  rowText: { flex: 1, gap: Spacing.xxs },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: Brand.border },
  alwaysOn: { color: Brand.success },
});
