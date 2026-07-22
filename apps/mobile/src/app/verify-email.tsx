import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';
import { Brand, MaxContentWidth, Spacing } from '@/constants/theme';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

export default function VerifyEmailScreen() {
  const router = useRouter();
  const { token, profile, refreshProfile } = useAuth();
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
              <ThemedText style={styles.emoji}>📬</ThemedText>
              <ThemedText type="subtitle">Check your email</ThemedText>
              <ThemedText
                type="small"
                themeColor="textSecondary"
                style={styles.centered}>
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

            <Button
              label="Resend code"
              variant="ghost"
              onPress={() => void onResend()}
            />

            <Button
              label="I'll do this later"
              variant="ghost"
              onPress={() => router.replace('/home')}
            />
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
    gap: Spacing.three,
  },
  hero: {
    alignItems: 'center',
    gap: Spacing.two,
    marginBottom: Spacing.three,
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
    fontSize: 24,
    letterSpacing: 8,
  },
  error: {
    color: Brand.danger,
  },
  info: {
    color: Brand.success,
  },
});
