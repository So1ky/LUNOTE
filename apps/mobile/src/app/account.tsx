import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Screen } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { TextField } from '@/components/ui/text-field';
import { Brand, Spacing } from '@/constants/theme';
import { ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

export default function AccountScreen() {
  const router = useRouter();
  const { profile, updateProfile } = useAuth();

  const [firstName, setFirstName] = useState(profile?.firstName ?? '');
  const [lastName, setLastName] = useState(profile?.lastName ?? '');
  const [nameSaving, setNameSaving] = useState(false);
  const [nameMessage, setNameMessage] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  const [confirmingName, setConfirmingName] = useState(false);

  const nameChanged =
    firstName.trim() !== (profile?.firstName ?? '') ||
    lastName.trim() !== (profile?.lastName ?? '');

  const onSaveName = async () => {
    setNameError(null);
    setNameMessage(null);
    setNameSaving(true);
    try {
      await updateProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      });
      setNameMessage('Saved.');
    } catch (e) {
      setNameError(e instanceof ApiError ? e.message : 'Something went wrong');
    } finally {
      setNameSaving(false);
      setConfirmingName(false);
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
        <ThemedText type="small" themeColor="textSecondary">
          Use your real name — it’s how our team identifies you for quotes and
          payments.
        </ThemedText>
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
          disabled={!firstName.trim() || !lastName.trim() || !nameChanged}
          onPress={() => setConfirmingName(true)}
        />
      </View>

      <View style={styles.section}>
        <ThemedText type="caption" themeColor="textSecondary">
          SECURITY
        </ThemedText>
        <Card style={styles.linkCard}>
          <Pressable
            accessibilityRole="button"
            style={({ pressed }) => [styles.linkRow, pressed && styles.linkPressed]}
            onPress={() => router.push('/change-password')}>
            <ThemedText type="body">Change password</ThemedText>
            <ThemedText type="body" themeColor="textSecondary">
              ›
            </ThemedText>
          </Pressable>
        </Card>
      </View>

      <ConfirmDialog
        visible={confirmingName}
        title="Update your name?"
        message={`Your name will change to "${firstName.trim()} ${lastName.trim()}". Our team uses it to identify you.`}
        confirmLabel="Save"
        dismissLabel="Go back"
        loading={nameSaving}
        onConfirm={() => void onSaveName()}
        onDismiss={() => setConfirmingName(false)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: Spacing.sm,
  },
  nameRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  nameField: {
    flex: 1,
  },
  linkCard: {
    paddingVertical: Spacing.xxs,
    paddingHorizontal: Spacing.lg,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
  },
  linkPressed: {
    opacity: 0.6,
  },
  error: {
    color: Brand.danger,
  },
  success: {
    color: Brand.success,
  },
});
