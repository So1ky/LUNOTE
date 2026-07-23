import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { TextField } from '@/components/ui/text-field';
import { Brand, Spacing, Type } from '@/constants/theme';
import { useTranslation } from '@/i18n';
import { api, ApiError } from '@/lib/api';
import { isValidPassword } from '@/lib/password';

type Step = 'request' | 'reset' | 'done';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { t } = useTranslation();
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
      setError(e instanceof ApiError ? e.message : t('common.somethingWrong'));
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
      setInfo(t('forgotPassword.codeResent'));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : t('common.somethingWrong'));
    }
  };

  const onReset = async () => {
    setError(null);
    if (!isValidPassword(newPassword)) {
      setError(t('password.policy'));
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
      setError(e instanceof ApiError ? e.message : t('common.somethingWrong'));
    } finally {
      setSubmitting(false);
    }
  };

  if (step === 'done') {
    return (
      <Screen center narrow>
        <View style={styles.hero}>
          <ThemedText style={styles.emoji}>✅</ThemedText>
          <ThemedText type="title">{t('forgotPassword.doneTitle')}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary" style={styles.centered}>
            {t('forgotPassword.doneSubtitle')}
          </ThemedText>
        </View>
        <Button
          label={t('forgotPassword.doneButton')}
          size="lg"
          onPress={() => router.replace('/login')}
        />
      </Screen>
    );
  }

  return (
    <Screen keyboard center narrow>
      <View style={styles.hero}>
        <ThemedText style={styles.emoji}>🔑</ThemedText>
        <ThemedText type="title">{t('forgotPassword.resetTitle')}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary" style={styles.centered}>
          {step === 'request'
            ? t('forgotPassword.requestSubtitle')
            : `${t('forgotPassword.resetSubtitle')}\n${email.trim()}`}
        </ThemedText>
      </View>

      {step === 'request' ? (
        <View style={styles.form}>
          <TextField
            label={t('forgotPassword.email')}
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
            label={t('forgotPassword.sendCode')}
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
            label={t('forgotPassword.newPassword')}
            placeholder={t('forgotPassword.newPasswordPlaceholder')}
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
            label={t('forgotPassword.setNewPassword')}
            size="lg"
            loading={submitting}
            disabled={code.trim().length !== 6 || !newPassword}
            onPress={() => void onReset()}
          />
          <Button
            label={t('forgotPassword.resendCode')}
            variant="ghost"
            onPress={() => void onResend()}
          />
        </View>
      )}

      <Pressable style={styles.footer} onPress={() => router.back()} hitSlop={8}>
        <ThemedText type="small" themeColor="textSecondary">
          {t('forgotPassword.backToLogin')}
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
