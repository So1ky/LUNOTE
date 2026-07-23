import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { TextField } from '@/components/ui/text-field';
import { Brand, Spacing } from '@/constants/theme';
import { ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { isValidPassword, PASSWORD_POLICY_MESSAGE } from '@/lib/password';

export default function SignupScreen() {
  const router = useRouter();
  const { signUp } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSignup = async () => {
    setError(null);
    if (!isValidPassword(password)) {
      setError(PASSWORD_POLICY_MESSAGE);
      return;
    }
    setSubmitting(true);
    try {
      await signUp(
        email.trim(),
        password,
        firstName.trim() || undefined,
        lastName.trim() || undefined,
      );
      router.replace('/verify-email'); // 가입 성공 = 자동 로그인 → 인증 코드 입력으로
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen keyboard center narrow>
      <View style={styles.hero}>
        <ThemedText type="title">Create account</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Start your life in Korea with LUNOTE
        </ThemedText>
      </View>

      <View style={styles.form}>
        {/* 실명 — 견적·결제 시 관리자가 고객을 식별하는 기준 */}
        <View style={styles.nameRow}>
          <View style={styles.nameField}>
            <TextField
              label="First name"
              placeholder="Mina"
              autoComplete="given-name"
              value={firstName}
              onChangeText={setFirstName}
            />
          </View>
          <View style={styles.nameField}>
            <TextField
              label="Last name"
              placeholder="Kim"
              autoComplete="family-name"
              value={lastName}
              onChangeText={setLastName}
            />
          </View>
        </View>
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
          placeholder="8+ chars with a number & symbol"
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
          Already have an account? <ThemedText type="link">Log in</ThemedText>
        </ThemedText>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    alignItems: 'center',
    gap: Spacing.xxs,
  },
  form: {
    gap: Spacing.md,
  },
  nameRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  nameField: {
    flex: 1,
  },
  error: {
    color: Brand.danger,
  },
  footer: {
    alignItems: 'center',
  },
});
