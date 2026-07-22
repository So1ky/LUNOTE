import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';
import { Brand, MaxContentWidth, Spacing } from '@/constants/theme';
import { ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

export default function SignupScreen() {
  const router = useRouter();
  const { signUp } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSignup = async () => {
    setError(null);
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    setSubmitting(true);
    try {
      await signUp(email.trim(), password, name.trim() || undefined);
      router.replace('/verify-email'); // 가입 성공 = 자동 로그인 → 인증 코드 입력으로
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

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
              <ThemedText type="subtitle">Create account</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                Start your life in Korea with LUNOTE
              </ThemedText>
            </View>

            <View style={styles.form}>
              <TextField
                label="Name (optional)"
                placeholder="Your name"
                value={name}
                onChangeText={setName}
              />
              <TextField
                label="Email"
                placeholder="you@example.com"
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
              />
              <TextField
                label="Password"
                placeholder="At least 8 characters"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />

              {error && (
                <ThemedText type="small" style={styles.error}>
                  {error}
                </ThemedText>
              )}

              <Button
                label="Create account"
                size="lg"
                loading={submitting}
                disabled={!email.trim() || !password}
                onPress={() => void onSignup()}
              />
            </View>

            <Pressable style={styles.footer} onPress={() => router.back()}>
              <ThemedText type="small" themeColor="textSecondary">
                Already have an account?{' '}
                <ThemedText type="smallBold" style={{ color: Brand.purple }}>
                  Log in
                </ThemedText>
              </ThemedText>
            </Pressable>
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
    marginBottom: Spacing.two,
  },
  form: {
    gap: Spacing.three,
  },
  error: {
    color: Brand.danger,
  },
  footer: {
    alignItems: 'center',
    marginTop: Spacing.two,
  },
});
