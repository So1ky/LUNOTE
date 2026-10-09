import * as AppleAuthentication from 'expo-apple-authentication';
import { Image } from 'expo-image';
import { Link, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { TextField } from '@/components/ui/text-field';
import { Brand, Radius, Spacing } from '@/constants/theme';
import { useTranslation, type TFunction } from '@/i18n';
import { ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { isAppleSignInSupported } from '@/lib/social-auth';

/** 409 EMAIL_REGISTERED는 기존 가입 방식 안내, 그 외 서버 에러는 메시지, SDK 에러는 공통 문구 */
function socialErrorMessage(e: unknown, t: TFunction) {
  if (e instanceof ApiError && e.status === 409 && e.body?.code === 'EMAIL_REGISTERED') {
    return t('login.emailRegistered', { method: t(`login.method${String(e.body.provider)}`) });
  }
  return e instanceof ApiError ? e.message : t('login.socialFailed');
}

export default function LoginScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { signIn, signInWithGoogle, signInWithApple } = useAuth();
  const [appleAvailable, setAppleAvailable] = useState(false);
  const [socialBusy, setSocialBusy] = useState<'google' | 'apple' | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onLogin = async () => {
    setError(null);
    setSubmitting(true);
    try {
      await signIn(email.trim(), password);
      router.replace('/home');
    } catch (e) {
      setError(e instanceof ApiError ? e.message : t('common.somethingWrong'));
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    void isAppleSignInSupported().then(setAppleAvailable);
  }, []);

  const onSocial = async (kind: 'google' | 'apple') => {
    setError(null);
    setSocialBusy(kind);
    try {
      const signedIn = kind === 'google' ? await signInWithGoogle() : await signInWithApple();
      // 진입 분기(index)를 탄다 — 신규 소셜 가입자는 언어 선택으로
      if (signedIn) router.replace('/');
    } catch (e) {
      setError(socialErrorMessage(e, t));
    } finally {
      setSocialBusy(null);
    }
  };

  return (
    <Screen keyboard center narrow>
      <View style={styles.hero}>
        <ThemedText type="display">LUNOTE</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {t('brand.tagline')}
        </ThemedText>
      </View>

      <View style={styles.form}>
        <TextField
          label={t('login.emailLabel')}
          placeholder="you@example.com"
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <TextField
          label={t('login.passwordLabel')}
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

        <Pressable
          style={styles.forgot}
          hitSlop={8}
          onPress={() => router.push('/forgot-password')}>
          <ThemedText type="small" themeColor="textSecondary">
            {t('login.forgotPassword')}
          </ThemedText>
        </Pressable>

        <Button
          label={t('login.submit')}
          size="lg"
          loading={submitting}
          disabled={!email.trim() || !password}
          onPress={() => void onLogin()}
        />
      </View>

      <View style={styles.dividerRow}>
        <View style={styles.divider} />
        <ThemedText type="small" themeColor="textSecondary">
          {t('login.orContinueWith')}
        </ThemedText>
        <View style={styles.divider} />
      </View>

      <View style={styles.form}>
        <Button
          label={t('login.continueGoogle')}
          variant="outline"
          loading={socialBusy === 'google'}
          disabled={socialBusy !== null}
          icon={<Image source={require('@/assets/images/google-g.png')} style={styles.googleIcon} />}
          onPress={() => void onSocial('google')}
        />
        {/* Apple HIG: 공식 버튼 사용 (심사 확인 대상). iOS에서만 노출 */}
        {appleAvailable && (
          <AppleAuthentication.AppleAuthenticationButton
            buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
            buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE}
            cornerRadius={Radius.md}
            style={styles.appleButton}
            onPress={() => {
              if (socialBusy === null) void onSocial('apple');
            }}
          />
        )}
      </View>

      <View style={styles.footer}>
        <Pressable onPress={() => router.replace('/home')} hitSlop={8}>
          <ThemedText type="small" themeColor="textSecondary">
            {t('login.continueGuest')}
          </ThemedText>
        </Pressable>
        <ThemedText type="small" themeColor="textSecondary">
          {t('login.newToLunote')}
          <Link href="/signup">
            <ThemedText type="link">{t('login.createAccount')}</ThemedText>
          </Link>
        </ThemedText>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    alignItems: 'center',
    gap: Spacing.xxs,
    marginBottom: Spacing.md,
  },
  form: {
    gap: Spacing.md,
  },
  error: {
    color: Brand.danger,
  },
  forgot: {
    alignSelf: 'flex-end',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  divider: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: Brand.border,
  },
  googleIcon: {
    width: Spacing.xl,
    height: Spacing.xl,
  },
  appleButton: {
    height: Spacing.xxxl,
  },
  footer: {
    alignItems: 'center',
    gap: Spacing.md,
  },
});
