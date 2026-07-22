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

  if (!token) {
    return <Redirect href="/login" />;
  }
  // 이메일 인증 강제 잠금 — 인증 완료 전에는 앱 진입 불가
  if (profile && !profile.emailVerifiedAt) {
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
