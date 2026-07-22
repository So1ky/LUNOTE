import { Redirect } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { Brand } from '@/constants/theme';
import { useAuth } from '@/lib/auth-context';

export default function Index() {
  const { loading, token, profile } = useAuth();

  // SecureStore에서 토큰을 복원하는 동안 스플래시 역할
  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator color={Brand.purple} />
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
  },
});
