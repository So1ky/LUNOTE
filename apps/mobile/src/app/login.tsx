import { useRouter } from 'expo-router';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';
import { Brand, MaxContentWidth, Spacing } from '@/constants/theme';

export default function LoginScreen() {
  const router = useRouter();

  // TODO: 백엔드 인증 API 연동 (이메일/비밀번호 + Google/Apple OAuth). 현재는 화면 플로우 확인용.
  const enterApp = () => router.replace('/home');

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            <View style={styles.hero}>
              <ThemedText type="title">LUNOTE</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                Life in Korea, made easy
              </ThemedText>
            </View>

            <View style={styles.form}>
              <TextField
                label="Email"
                placeholder="you@example.com"
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
              />
              <TextField label="Password" placeholder="••••••••" secureTextEntry />

              <Pressable style={styles.forgot}>
                <ThemedText type="small" themeColor="textSecondary">
                  Forgot password?
                </ThemedText>
              </Pressable>

              <Button label="Log in" size="lg" onPress={enterApp} />
            </View>

            <View style={styles.dividerRow}>
              <View style={styles.divider} />
              <ThemedText type="small" themeColor="textSecondary">
                or continue with
              </ThemedText>
              <View style={styles.divider} />
            </View>

            <View style={styles.form}>
              <Button label="Continue with Google" variant="outline" onPress={enterApp} />
              <Button label="Continue with Apple" variant="outline" onPress={enterApp} />
            </View>

            <View style={styles.footer}>
              <ThemedText type="small" themeColor="textSecondary">
                New to LUNOTE?{' '}
                <ThemedText type="smallBold" style={{ color: Brand.purple }}>
                  Create account
                </ThemedText>
              </ThemedText>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Brand.bg,
  },
  flex: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.six,
  },
  content: {
    width: '100%',
    maxWidth: MaxContentWidth / 2,
    paddingHorizontal: Spacing.five,
    gap: Spacing.four,
  },
  hero: {
    alignItems: 'center',
    gap: Spacing.one,
    marginBottom: Spacing.four,
  },
  form: {
    gap: Spacing.three,
  },
  forgot: {
    alignSelf: 'flex-end',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  divider: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: Brand.border,
  },
  footer: {
    alignItems: 'center',
    marginTop: Spacing.two,
  },
});
