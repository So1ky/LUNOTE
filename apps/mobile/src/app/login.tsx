import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Brand, MaxContentWidth, Spacing } from '@/constants/theme';

export default function LoginScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <ThemedText type="title" style={styles.logo}>
          LUNOTE
        </ThemedText>

        <TextInput
          style={styles.input}
          placeholder="Email address"
          placeholderTextColor={Brand.fieldText}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor={Brand.fieldText}
          secureTextEntry
        />

        {/* TODO: 백엔드 인증 API 연동. 현재는 화면 플로우 확인용 */}
        <Pressable
          style={({ pressed }) => [styles.loginButton, pressed && styles.pressed]}
          onPress={() => router.replace('/home')}>
          <ThemedText type="smallBold">Login</ThemedText>
        </Pressable>

        <ThemedText type="small" themeColor="textSecondary" style={styles.socialHint}>
          Google / Apple 로그인은 추후 연동
        </ThemedText>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Brand.navy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    width: '100%',
    maxWidth: MaxContentWidth / 2,
    paddingHorizontal: Spacing.five,
    gap: Spacing.three,
  },
  logo: {
    textAlign: 'center',
    marginBottom: Spacing.five,
  },
  input: {
    backgroundColor: Brand.field,
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    fontSize: 16,
    color: Brand.fieldText,
  },
  loginButton: {
    backgroundColor: Brand.purple,
    borderRadius: Spacing.two,
    paddingVertical: Spacing.three,
    alignItems: 'center',
    marginTop: Spacing.two,
  },
  pressed: {
    opacity: 0.8,
  },
  socialHint: {
    textAlign: 'center',
    marginTop: Spacing.three,
  },
});
