import { Redirect } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { Brand } from '@/constants/theme';
import { useAuth } from '@/lib/auth-context';

export default function Index() {
  const { loading, token } = useAuth();

  // SecureStore에서 토큰을 복원하는 동안 스플래시 역할
  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator color={Brand.purple} />
      </View>
    );
  }

  return <Redirect href={token ? '/home' : '/login'} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Brand.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
