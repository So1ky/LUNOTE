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
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { isValidPassword, PASSWORD_POLICY_MESSAGE } from '@/lib/password';

export default function ChangePasswordScreen() {
  const router = useRouter();
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
      setError(PASSWORD_POLICY_MESSAGE);
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
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
      setError(e instanceof ApiError ? e.message : 'Something went wrong');
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
          <ThemedText type="title">Password changed</ThemedText>
          <ThemedText type="small" themeColor="textSecondary" style={styles.centered}>
            Use your new password the next time you log in.
          </ThemedText>
        </View>
        <Button label="Done" size="lg" onPress={() => router.back()} />
      </Screen>
    );
  }

  return (
    <Screen keyboard>
      <ScreenHeader back title="Change password" />

      <View style={styles.form}>
        <TextField
          label="Current password"
          placeholder="••••••••"
          secureTextEntry
          value={currentPassword}
          onChangeText={setCurrentPassword}
        />
        <TextField
          label="New password"
          placeholder="8+ chars with a number & symbol"
          secureTextEntry
          value={newPassword}
          onChangeText={setNewPassword}
        />
        <TextField
          label="Confirm new password"
          placeholder="Re-enter new password"
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
          label="Change password"
          size="lg"
          loading={saving}
          disabled={!currentPassword || !newPassword || !confirmPassword}
          onPress={onRequestChange}
        />
      </View>

      <ConfirmDialog
        visible={confirming}
        title="Change your password?"
        message="You'll use the new password from your next login."
        confirmLabel="Change password"
        dismissLabel="Go back"
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
