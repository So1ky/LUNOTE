import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { TextField } from '@/components/ui/text-field';
import { Brand, Spacing } from '@/constants/theme';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

export default function AccountScreen() {
  const { token, profile, updateProfile } = useAuth();

  const [name, setName] = useState(profile?.name ?? '');
  const [nameSaving, setNameSaving] = useState(false);
  const [nameMessage, setNameMessage] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMessage, setPwMessage] = useState<string | null>(null);
  const [pwError, setPwError] = useState<string | null>(null);

  const onSaveName = async () => {
    setNameError(null);
    setNameMessage(null);
    setNameSaving(true);
    try {
      await updateProfile({ name: name.trim() });
      setNameMessage('Saved.');
    } catch (e) {
      setNameError(e instanceof ApiError ? e.message : 'Something went wrong');
    } finally {
      setNameSaving(false);
    }
  };

  const onChangePassword = async () => {
    setPwError(null);
    setPwMessage(null);
    if (newPassword.length < 8) {
      setPwError('New password must be at least 8 characters');
      return;
    }
    setPwSaving(true);
    try {
      await api('/auth/change-password', {
        method: 'POST',
        body: { currentPassword, newPassword },
        token: token ?? undefined,
      });
      setPwMessage('Password changed.');
      setCurrentPassword('');
      setNewPassword('');
    } catch (e) {
      setPwError(e instanceof ApiError ? e.message : 'Something went wrong');
    } finally {
      setPwSaving(false);
    }
  };

  return (
    <Screen keyboard>
      <ScreenHeader back title="Account details" />

      <View style={styles.section}>
        <ThemedText type="caption" themeColor="textSecondary">
          PROFILE
        </ThemedText>
        <TextField label="Email" value={profile?.email ?? ''} editable={false} />
        <TextField
          label="Name"
          placeholder="Your name"
          value={name}
          onChangeText={setName}
        />
        {nameError && (
          <ThemedText type="small" style={styles.error}>
            {nameError}
          </ThemedText>
        )}
        {nameMessage && (
          <ThemedText type="small" style={styles.success}>
            {nameMessage}
          </ThemedText>
        )}
        <Button
          label="Save name"
          loading={nameSaving}
          disabled={!name.trim() || name.trim() === (profile?.name ?? '')}
          onPress={() => void onSaveName()}
        />
      </View>

      <View style={styles.section}>
        <ThemedText type="caption" themeColor="textSecondary">
          CHANGE PASSWORD
        </ThemedText>
        <TextField
          label="Current password"
          placeholder="••••••••"
          secureTextEntry
          value={currentPassword}
          onChangeText={setCurrentPassword}
        />
        <TextField
          label="New password"
          placeholder="At least 8 characters"
          secureTextEntry
          value={newPassword}
          onChangeText={setNewPassword}
        />
        {pwError && (
          <ThemedText type="small" style={styles.error}>
            {pwError}
          </ThemedText>
        )}
        {pwMessage && (
          <ThemedText type="small" style={styles.success}>
            {pwMessage}
          </ThemedText>
        )}
        <Button
          label="Change password"
          variant="outline"
          loading={pwSaving}
          disabled={!currentPassword || !newPassword}
          onPress={() => void onChangePassword()}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: Spacing.sm,
  },
  error: {
    color: Brand.danger,
  },
  success: {
    color: Brand.success,
  },
});
