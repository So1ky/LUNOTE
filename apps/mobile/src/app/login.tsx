import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { TextField } from '@/components/ui/text-field';
import { Brand, Spacing } from '@/constants/theme';
import { useTranslation } from '@/i18n';
import { ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

export default function LoginScreen() {
  const router = useRouter();
  const { t } = useTranslation();
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
      setError(e instanceof ApiError ? e.message : t('common.somethingWrong'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen keyboard center narrow>
      <View style={styles.hero}>
        <ThemedText type="display">LUNOTE</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {t('brand.tagline')}
        </ThemedText>
      </View>

      <View style={styles.form}>
        <TextField
          label={t('login.emailLabel')}
          placeholder="you@example.com"
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <TextField
          label={t('login.passwordLabel')}
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

        <Pressable
          style={styles.forgot}
          hitSlop={8}
          onPress={() => router.push('/forgot-password')}>
          <ThemedText type="small" themeColor="textSecondary">
            {t('login.forgotPassword')}
          </ThemedText>
        </Pressable>

        <Button
          label={t('login.submit')}
          size="lg"
          loading={submitting}
          disabled={!email.trim() || !password}
          onPress={() => void onLogin()}
        />
      </View>

      <View style={styles.dividerRow}>
        <View style={styles.divider} />
        <ThemedText type="small" themeColor="textSecondary">
          {t('login.orContinueWith')}
        </ThemedText>
        <View style={styles.divider} />
      </View>

      <View style={styles.form}>
        {/* TODO: Google OAuth (B2 후반), Apple 로그인 (Apple Developer 가입 후) */}
        <Button label={t('login.continueGoogle')} variant="outline" disabled />
        <Button label={t('login.continueApple')} variant="outline" disabled />
      </View>

      <View style={styles.footer}>
        <Pressable onPress={() => router.replace('/home')} hitSlop={8}>
          <ThemedText type="small" themeColor="textSecondary">
            {t('login.continueGuest')}
          </ThemedText>
        </Pressable>
        <ThemedText type="small" themeColor="textSecondary">
          {t('login.newToLunote')}
          <Link href="/signup">
            <ThemedText type="link">{t('login.createAccount')}</ThemedText>
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
