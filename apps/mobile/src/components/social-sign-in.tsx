import * as AppleAuthentication from 'expo-apple-authentication';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Brand, Radius, Spacing } from '@/constants/theme';
import { useTranslation, type TFunction } from '@/i18n';
import { ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { isAppleSignInSupported } from '@/lib/social-auth';

// 로그인·가입 화면이 공유하는 소셜 로그인 블록 (구분선 + Google/Apple 버튼 + 에러 문구)

/** 409 EMAIL_REGISTERED는 기존 가입 방식 안내, 그 외 서버 에러는 메시지, SDK 에러는 공통 문구 */
function socialErrorMessage(e: unknown, t: TFunction) {
  if (e instanceof ApiError && e.status === 409 && e.body?.code === 'EMAIL_REGISTERED') {
    return t('login.emailRegistered', { method: t(`login.method${String(e.body.provider)}`) });
  }
  return e instanceof ApiError ? e.message : t('login.socialFailed');
}

export function SocialSignIn() {
  const router = useRouter();
  const { t } = useTranslation();
  const { signInWithGoogle, signInWithApple } = useAuth();
  const [appleAvailable, setAppleAvailable] = useState(false);
  const [socialBusy, setSocialBusy] = useState<'google' | 'apple' | null>(null);
  const [error, setError] = useState<string | null>(null);

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
    <View style={styles.container}>
      <View style={styles.dividerRow}>
        <View style={styles.divider} />
        <ThemedText type="small" themeColor="textSecondary">
          {t('login.orContinueWith')}
        </ThemedText>
        <View style={styles.divider} />
      </View>

      <View style={styles.buttons}>
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
        {error && (
          <ThemedText type="small" style={styles.error}>
            {error}
          </ThemedText>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.md,
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
  buttons: {
    gap: Spacing.md,
  },
  googleIcon: {
    width: Spacing.xl,
    height: Spacing.xl,
  },
  appleButton: {
    height: Spacing.xxxl,
  },
  error: {
    color: Brand.danger,
  },
});
