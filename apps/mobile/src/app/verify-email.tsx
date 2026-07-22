import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { TextField } from '@/components/ui/text-field';
import { Brand, Spacing, Type } from '@/constants/theme';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

export default function VerifyEmailScreen() {
  const router = useRouter();
  const { token, profile, refreshProfile, signOut } = useAuth();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onVerify = async () => {
    if (!token) return;
    setError(null);
    setSubmitting(true);
    try {
      await api('/auth/verify-email', {
        method: 'POST',
        body: { code: code.trim() },
        token,
      });
      await refreshProfile();
      router.replace('/home');
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  const onResend = async () => {
    if (!token) return;
    setError(null);
    setInfo(null);
    try {
      await api('/auth/resend-verification', { method: 'POST', token });
      setInfo('A new code has been sent to your email.');
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Something went wrong');
    }
  };

  return (
    <Screen keyboard center narrow>
      <View style={styles.hero}>
        <ThemedText style={styles.emoji}>📬</ThemedText>
        <ThemedText type="title">Check your email</ThemedText>
        <ThemedText type="small" themeColor="textSecondary" style={styles.centered}>
          We sent a 6-digit code to{'\n'}
          {profile?.email ?? 'your email'}
        </ThemedText>
      </View>

      <TextField
        placeholder="123456"
        keyboardType="number-pad"
        maxLength={6}
        value={code}
        onChangeText={setCode}
        style={styles.codeInput}
      />

      {error && (
        <ThemedText type="small" style={styles.error}>
          {error}
        </ThemedText>
      )}
      {info && (
        <ThemedText type="small" style={styles.info}>
          {info}
        </ThemedText>
      )}

      <Button
        label="Verify"
        size="lg"
        loading={submitting}
        disabled={code.trim().length !== 6}
        onPress={() => void onVerify()}
      />

      <View style={styles.secondary}>
        <Button label="Resend code" variant="ghost" onPress={() => void onResend()} />

        {/* 인증 완료 전에는 앱 진입 불가 (강제 잠금) — 탈출구는 로그아웃뿐 */}
        <Button
          label="Log out"
          variant="ghost"
          onPress={() => {
            void signOut().then(() => router.replace('/login'));
          }}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    alignItems: 'center',
    gap: Spacing.xs,
  },
  emoji: {
    fontSize: 40,
    lineHeight: 48,
  },
  centered: {
    textAlign: 'center',
  },
  codeInput: {
    textAlign: 'center',
    fontSize: Type.heading.fontSize,
    letterSpacing: 8,
  },
  error: {
    color: Brand.danger,
  },
  info: {
    color: Brand.success,
  },
  secondary: {
    gap: Spacing.xxs,
  },
});
