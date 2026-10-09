import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { AppIcon } from '@/components/ui/app-icon';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Screen } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { TextField } from '@/components/ui/text-field';
import { Brand, Radius, Spacing } from '@/constants/theme';
import { useTranslation } from '@/i18n';
import { ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

export default function DeleteAccountScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { deleteAccount } = useAuth();

  const [password, setPassword] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [blocked, setBlocked] = useState(false);
  const [done, setDone] = useState(false);

  const onDelete = async () => {
    setError(null);
    setBlocked(false);
    setDeleting(true);
    try {
      await deleteAccount(password);
      setDone(true);
    } catch (e) {
      // 서버 계약: 400 비밀번호 불일치, 403 앱에서 삭제 불가(소셜·관리자), 409 진행 중 결제
      if (e instanceof ApiError && e.status === 400) setError(t('deleteAccount.wrongPassword'));
      else if (e instanceof ApiError && e.status === 403) setError(t('deleteAccount.noPassword'));
      else if (e instanceof ApiError && e.status === 409) setBlocked(true);
      else setError(e instanceof ApiError ? e.message : t('common.somethingWrong'));
    } finally {
      setDeleting(false);
      setConfirming(false);
    }
  };

  // Apple 5.1.1(v): 삭제 완료를 사용자에게 확인시킨다
  if (done) {
    return (
      <Screen center narrow>
        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <AppIcon name="checkCircle" size={26} color={Brand.purpleSoft} />
          </View>
          <ThemedText type="title">{t('deleteAccount.doneTitle')}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary" style={styles.centered}>
            {t('deleteAccount.doneSubtitle')}
          </ThemedText>
        </View>
        <Button
          label={t('deleteAccount.done')}
          size="lg"
          onPress={() => {
            // 스택을 비우고 게스트 홈으로 — 가입 직후용 /welcome으로 보내지 않는다
            if (router.canDismiss()) router.dismissAll();
            router.replace('/home');
          }}
        />
      </Screen>
    );
  }

  return (
    <Screen keyboard>
      <ScreenHeader back title={t('deleteAccount.title')} />

      <View style={styles.form}>
        <ThemedText type="body">{t('deleteAccount.intro')}</ThemedText>

        {/* Apple 5.1.1(v)·Google Play: 삭제되는 것과 법정 보존되는 것, 소요 시간을 고지 */}
        <Card style={styles.infoCard}>
          <ThemedText type="caption" themeColor="textSecondary">
            {t('deleteAccount.deletedLabel')}
          </ThemedText>
          <ThemedText type="small">{t('deleteAccount.deletedItems')}</ThemedText>
          <ThemedText type="caption" themeColor="textSecondary">
            {t('deleteAccount.keptLabel')}
          </ThemedText>
          <ThemedText type="small">{t('deleteAccount.keptItems')}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {t('deleteAccount.timing')}
          </ThemedText>
        </Card>

        <TextField
          label={t('deleteAccount.password')}
          placeholder="••••••••"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        {error && (
          <ThemedText type="small" style={styles.error}>
            {error}
          </ThemedText>
        )}
        {blocked && (
          <View style={styles.blocked}>
            <ThemedText type="small" style={styles.error}>
              {t('deleteAccount.activeOrders')}
            </ThemedText>
            <Button
              label={t('deleteAccount.contactSupport')}
              variant="outline"
              onPress={() => router.push('/support')}
            />
          </View>
        )}

        <Button
          label={t('deleteAccount.submit')}
          variant="danger"
          size="lg"
          loading={deleting}
          disabled={!password}
          onPress={() => setConfirming(true)}
        />
      </View>

      <ConfirmDialog
        visible={confirming}
        title={t('deleteAccount.confirmTitle')}
        message={t('deleteAccount.confirmMessage')}
        confirmLabel={t('deleteAccount.confirm')}
        dismissLabel={t('deleteAccount.goBack')}
        destructive
        loading={deleting}
        onConfirm={() => void onDelete()}
        onDismiss={() => setConfirming(false)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: Spacing.md,
  },
  infoCard: {
    gap: Spacing.xs,
  },
  blocked: {
    gap: Spacing.sm,
  },
  hero: {
    alignItems: 'center',
    gap: Spacing.xs,
  },
  heroIcon: {
    width: 64,
    height: 64,
    borderRadius: Radius.lg,
    backgroundColor: Brand.purpleTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centered: {
    textAlign: 'center',
  },
  error: {
    color: Brand.danger,
  },
});
