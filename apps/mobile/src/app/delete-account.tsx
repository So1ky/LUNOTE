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
import { useAuth, type DeleteProof } from '@/lib/auth-context';
import { getAppleCredential, getGoogleIdToken } from '@/lib/social-auth';

export default function DeleteAccountScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { deleteAccount, profile } = useAuth();
  const provider = profile?.provider ?? 'EMAIL';

  const [password, setPassword] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [blocked, setBlocked] = useState(false);
  const [done, setDone] = useState(false);

  /** 가입 방식별 증명 — 소셜은 이 시점에 재로그인한다. 사용자가 취소하면 null */
  const getProof = async (): Promise<DeleteProof | null> => {
    if (provider === 'GOOGLE') {
      const idToken = await getGoogleIdToken();
      return idToken ? { idToken } : null;
    }
    if (provider === 'APPLE') {
      const c = await getAppleCredential();
      return c ? { identityToken: c.identityToken, authorizationCode: c.authorizationCode } : null;
    }
    return { password };
  };

  const onDelete = async () => {
    setError(null);
    setBlocked(false);
    setDeleting(true);
    try {
      const proof = await getProof();
      if (!proof) return; // 재로그인 취소
      await deleteAccount(proof);
      setDone(true);
    } catch (e) {
      // 서버 계약: 400 재인증 실패, 403 관리자, 409 진행 중 결제, 503 제공자 확인 불가
      if (e instanceof ApiError && e.status === 400) {
        setError(t(provider === 'EMAIL' ? 'deleteAccount.wrongPassword' : 'deleteAccount.reauthFailed'));
      } else if (e instanceof ApiError && e.status === 403) setError(t('deleteAccount.noPassword'));
      else if (e instanceof ApiError && e.status === 409) setBlocked(true);
      else if (e instanceof ApiError && e.status === 503) setError(t('deleteAccount.tryLater'));
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

        {provider === 'EMAIL' ? (
          <TextField
            label={t('deleteAccount.password')}
            placeholder="••••••••"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
        ) : (
          <ThemedText type="small" themeColor="textSecondary">
            {t('deleteAccount.reauthIntro')}
          </ThemedText>
        )}

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
          disabled={provider === 'EMAIL' && !password}
          onPress={() => setConfirming(true)}
        />
      </View>

      <ConfirmDialog
        visible={confirming}
        title={t('deleteAccount.confirmTitle')}
        message={t('deleteAccount.confirmMessage')}
        confirmLabel={
          provider === 'GOOGLE'
            ? t('deleteAccount.confirmWithGoogle')
            : provider === 'APPLE'
              ? t('deleteAccount.confirmWithApple')
              : t('deleteAccount.confirm')
        }
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
