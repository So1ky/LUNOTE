import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Brand, Spacing } from '@/constants/theme';
import { useTranslation } from '@/i18n';
import { useAuth } from '@/lib/auth-context';

/** 토큰 복원이 순식간에 끝나도 브랜드 스플래시가 인지될 최소 노출 시간 */
const MIN_SPLASH_MS = 900;

export default function Index() {
  const { t } = useTranslation();
  const { loading, token, profile } = useAuth();
  const [minElapsed, setMinElapsed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMinElapsed(true), MIN_SPLASH_MS);
    return () => clearTimeout(timer);
  }, []);

  // 스플래시 — 와이어프레임 첫 프레임(네이비 + LUNOTE 워드마크).
  // SecureStore 토큰 복원(loading)과 최소 노출 시간이 모두 끝나야 넘어간다.
  if (loading || !minElapsed) {
    return (
      <View style={styles.container}>
        <ThemedText type="display">LUNOTE</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {t('brand.tagline')}
        </ThemedText>
      </View>
    );
  }

  // 로그인한 미인증 사용자만 잠금 — 비회원(게스트)은 홈에서 서비스 구경 가능
  if (token && profile && !profile.emailVerifiedAt) {
    return <Redirect href="/verify-email" />;
  }
  return <Redirect href="/home" />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Brand.bg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
  },
});
