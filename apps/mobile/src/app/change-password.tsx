import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Screen } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { TextField } from '@/components/ui/text-field';
import { Brand, Spacing } from '@/constants/theme';
import { useTranslation } from '@/i18n';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { isValidPassword } from '@/lib/password';

export default function ChangePasswordScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { token } = useAuth();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const onRequestChange = () => {
    setError(null);
    if (!isValidPassword(newPassword)) {
      setError(t('password.policy'));
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(t('changePassword.mismatch'));
      return;
    }
    setConfirming(true);
  };

  const onChangePassword = async () => {
    setSaving(true);
    try {
      await api('/auth/change-password', {
        method: 'POST',
        body: { currentPassword, newPassword },
        token: token ?? undefined,
      });
      setDone(true);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : t('common.somethingWrong'));
    } finally {
      setSaving(false);
      setConfirming(false);
    }
  };

  if (done) {
    return (
      <Screen center narrow>
        <View style={styles.hero}>
          <ThemedText style={styles.emoji}>🔒</ThemedText>
          <ThemedText type="title">{t('changePassword.doneTitle')}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary" style={styles.centered}>
            {t('changePassword.doneSubtitle')}
          </ThemedText>
        </View>
        <Button label={t('changePassword.done')} size="lg" onPress={() => router.back()} />
      </Screen>
    );
  }

  return (
    <Screen keyboard>
      <ScreenHeader back title={t('changePassword.title')} />

      <View style={styles.form}>
        <TextField
          label={t('changePassword.current')}
          placeholder="••••••••"
          secureTextEntry
          value={currentPassword}
          onChangeText={setCurrentPassword}
        />
        <TextField
          label={t('changePassword.newLabel')}
          placeholder={t('password.placeholder')}
          secureTextEntry
          value={newPassword}
          onChangeText={setNewPassword}
        />
        <TextField
          label={t('changePassword.confirm')}
          placeholder={t('changePassword.confirmPlaceholder')}
          secureTextEntry
          value={confirmPassword}
          onChangeText={setConfirmPassword}
        />

        {error && (
          <ThemedText type="small" style={styles.error}>
            {error}
          </ThemedText>
        )}

        <Button
          label={t('changePassword.submit')}
          size="lg"
          loading={saving}
          disabled={!currentPassword || !newPassword || !confirmPassword}
          onPress={onRequestChange}
        />
      </View>

      <ConfirmDialog
        visible={confirming}
        title={t('changePassword.confirmTitle')}
        message={t('changePassword.confirmMessage')}
        confirmLabel={t('changePassword.submit')}
        dismissLabel={t('changePassword.goBack')}
        destructive
        loading={saving}
        onConfirm={() => void onChangePassword()}
        onDismiss={() => setConfirming(false)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: Spacing.md,
  },
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
  error: {
    color: Brand.danger,
  },
});
