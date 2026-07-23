import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { TextField } from '@/components/ui/text-field';
import { Brand, Spacing, Type } from '@/constants/theme';
import { api, ApiError } from '@/lib/api';
import { isValidPassword, PASSWORD_POLICY_MESSAGE } from '@/lib/password';

type Step = 'request' | 'reset' | 'done';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('request');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSendCode = async () => {
    setError(null);
    setInfo(null);
    setSubmitting(true);
    try {
      await api('/auth/forgot-password', {
        method: 'POST',
        body: { email: email.trim() },
      });
      setStep('reset');
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  const onResend = async () => {
    setError(null);
    setInfo(null);
    try {
      await api('/auth/forgot-password', {
        method: 'POST',
        body: { email: email.trim() },
      });
      setInfo('If the email exists, a new code has been sent.');
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Something went wrong');
    }
  };

  const onReset = async () => {
    setError(null);
    if (!isValidPassword(newPassword)) {
      setError(PASSWORD_POLICY_MESSAGE);
      return;
    }
    setSubmitting(true);
    try {
      await api('/auth/reset-password', {
        method: 'POST',
        body: { email: email.trim(), code: code.trim(), newPassword },
      });
      setStep('done');
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  if (step === 'done') {
    return (
      <Screen center narrow>
        <View style={styles.hero}>
          <ThemedText style={styles.emoji}>✅</ThemedText>
          <ThemedText type="title">Password updated</ThemedText>
          <ThemedText type="small" themeColor="textSecondary" style={styles.centered}>
            Log in with your new password.
          </ThemedText>
        </View>
        <Button label="Back to log in" size="lg" onPress={() => router.replace('/login')} />
      </Screen>
    );
  }

  return (
    <Screen keyboard center narrow>
      <View style={styles.hero}>
        <ThemedText style={styles.emoji}>🔑</ThemedText>
        <ThemedText type="title">Reset password</ThemedText>
        <ThemedText type="small" themeColor="textSecondary" style={styles.centered}>
          {step === 'request'
            ? 'Enter your account email and we’ll send a 6-digit code.'
            : `Enter the code sent to\n${email.trim()}`}
        </ThemedText>
      </View>

      {step === 'request' ? (
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

          {error && (
            <ThemedText type="small" style={styles.error}>
              {error}
            </ThemedText>
          )}

          <Button
            label="Send reset code"
            size="lg"
            loading={submitting}
            disabled={!email.trim()}
            onPress={() => void onSendCode()}
          />
        </View>
      ) : (
        <View style={styles.form}>
          <TextField
            placeholder="123456"
            keyboardType="number-pad"
            maxLength={6}
            value={code}
            onChangeText={setCode}
            style={styles.codeInput}
          />
          <TextField
            label="New password"
            placeholder="At least 8 characters"
            secureTextEntry
            value={newPassword}
            onChangeText={setNewPassword}
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
            label="Set new password"
            size="lg"
            loading={submitting}
            disabled={code.trim().length !== 6 || !newPassword}
            onPress={() => void onReset()}
          />
          <Button label="Resend code" variant="ghost" onPress={() => void onResend()} />
        </View>
      )}

      <Pressable style={styles.footer} onPress={() => router.back()} hitSlop={8}>
        <ThemedText type="small" themeColor="textSecondary">
          ← Back to log in
        </ThemedText>
      </Pressable>
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
  form: {
    gap: Spacing.md,
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
  footer: {
    alignItems: 'center',
  },
});
