import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { AppIcon } from '@/components/ui/app-icon';
import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { Brand, Spacing } from '@/constants/theme';
import { useTranslation } from '@/i18n';
import { useAuth } from '@/lib/auth-context';
import { registerPush } from '@/lib/push';
import { pushStorage } from '@/lib/push-storage';

/** 첫 문의 제출 직후 1회 — 맥락이 있을 때 OS 권한을 묻는다 (스펙 §4-3) */
export default function PushPromptScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { token } = useAuth();
  const [busy, setBusy] = useState(false);

  const finish = async () => {
    await pushStorage.setPromptShown();
    router.replace('/quote');
  };

  const onTurnOn = async () => {
    if (!token) return finish();
    setBusy(true);
    try {
      await registerPush(token); // 거절·실패해도 다시 묻지 않는다 — 설정 화면에서 켤 수 있다
    } catch {
      // 네트워크 실패 등 — 조용히 넘어간다
    } finally {
      setBusy(false);
      await finish();
    }
  };

  return (
    <Screen center narrow>
      <View style={styles.hero}>
        <AppIcon name="bell" size={40} color={Brand.purple} />
        <ThemedText type="title" style={styles.center}>
          {t('pushPrompt.title')}
        </ThemedText>
        <ThemedText type="body" themeColor="textSecondary" style={styles.center}>
          {t('pushPrompt.body')}
        </ThemedText>
      </View>
      <View style={styles.actions}>
        <Button label={t('pushPrompt.turnOn')} size="lg" loading={busy} onPress={() => void onTurnOn()} />
        <Pressable onPress={() => void finish()} hitSlop={8} style={styles.notNow}>
          <ThemedText type="small" themeColor="textSecondary">
            {t('pushPrompt.notNow')}
          </ThemedText>
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', gap: Spacing.md },
  center: { textAlign: 'center' },
  actions: { gap: Spacing.md, marginTop: Spacing.xl },
  notNow: { alignItems: 'center' },
});
