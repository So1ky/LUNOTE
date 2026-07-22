import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { TextField } from '@/components/ui/text-field';
import { Brand, Spacing } from '@/constants/theme';
import { ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

export default function LoginScreen() {
  const router = useRouter();
  const { signIn } = useAuth();
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
      setError(e instanceof ApiError ? e.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen keyboard center narrow>
      <View style={styles.hero}>
        <ThemedText type="display">LUNOTE</ThemedText>
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
          value={email}
          onChangeText={setEmail}
        />
        <TextField
          label="Password"
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

        <Pressable style={styles.forgot}>
          <ThemedText type="small" themeColor="textSecondary">
            Forgot password?
          </ThemedText>
        </Pressable>

        <Button
          label="Log in"
          size="lg"
          loading={submitting}
          disabled={!email.trim() || !password}
          onPress={() => void onLogin()}
        />
      </View>

      <View style={styles.dividerRow}>
        <View style={styles.divider} />
        <ThemedText type="small" themeColor="textSecondary">
          or continue with
        </ThemedText>
        <View style={styles.divider} />
      </View>

      <View style={styles.form}>
        {/* TODO: Google OAuth (B2 후반), Apple 로그인 (Apple Developer 가입 후) */}
        <Button label="Continue with Google" variant="outline" disabled />
        <Button label="Continue with Apple" variant="outline" disabled />
      </View>

      <View style={styles.footer}>
        <Pressable onPress={() => router.replace('/home')} hitSlop={8}>
          <ThemedText type="small" themeColor="textSecondary">
            ← Continue browsing as guest
          </ThemedText>
        </Pressable>
        <ThemedText type="small" themeColor="textSecondary">
          New to LUNOTE?{' '}
          <Link href="/signup">
            <ThemedText type="link">Create account</ThemedText>
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
  footer: {
    alignItems: 'center',
    gap: Spacing.md,
  },
});
