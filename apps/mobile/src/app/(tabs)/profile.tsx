import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Screen } from '@/components/ui/screen';
import { Brand, Radius, Spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth-context';

const MENU = [
  { key: 'account', label: 'Account details' },
  { key: 'language', label: 'Language', value: 'English' },
  { key: 'notifications', label: 'Notifications' },
  { key: 'support', label: 'Support' },
];

export default function ProfileScreen() {
  const router = useRouter();
  const { token, profile, signOut } = useAuth();
  const [confirmingLogout, setConfirmingLogout] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  if (!token) {
    return (
      <Screen center narrow tabInset>
        <View style={styles.guest}>
          <ThemedText type="title">Welcome to LUNOTE</ThemedText>
          <ThemedText type="small" themeColor="textSecondary" style={styles.guestText}>
            Log in to manage your requests, quotes and payments.
          </ThemedText>
          <Button label="Log in" size="lg" onPress={() => router.push('/login')} />
          <Button
            label="Create account"
            variant="outline"
            onPress={() => router.push('/signup')}
          />
        </View>
      </Screen>
    );
  }

  const displayName = profile?.name || profile?.email.split('@')[0] || 'Guest';
  const initial = displayName.charAt(0).toUpperCase();

  const onLogout = async () => {
    setLoggingOut(true);
    await signOut();
    router.replace('/login');
  };

  return (
    <Screen tabInset>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <ThemedText type="heading">{initial}</ThemedText>
        </View>
        <View style={styles.headerText}>
          <ThemedText type="bodyStrong">{displayName}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {profile?.email ?? ''}
          </ThemedText>
        </View>
      </View>

      <Card style={styles.menuCard}>
        {MENU.map((item, i) => (
          <View key={item.key}>
            {i > 0 && <View style={styles.menuDivider} />}
            <View style={styles.menuRow}>
              <ThemedText type="body">{item.label}</ThemedText>
              <View style={styles.menuRight}>
                {item.value && (
                  <ThemedText type="small" themeColor="textSecondary">
                    {item.value}
                  </ThemedText>
                )}
                <ThemedText type="body" themeColor="textSecondary">
                  ›
                </ThemedText>
              </View>
            </View>
          </View>
        ))}
      </Card>

      <Button
        label="Log out"
        variant="danger"
        onPress={() => setConfirmingLogout(true)}
      />

      <ConfirmDialog
        visible={confirmingLogout}
        title="Log out of LUNOTE?"
        message="You can log back in anytime with your email and password."
        confirmLabel="Log out"
        dismissLabel="Stay"
        destructive
        loading={loggingOut}
        onConfirm={() => void onLogout()}
        onDismiss={() => setConfirmingLogout(false)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  guest: {
    gap: Spacing.sm,
  },
  guestText: {
    marginBottom: Spacing.xs,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: Radius.full,
    backgroundColor: Brand.surfaceAlt,
    borderWidth: 1,
    borderColor: Brand.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    gap: 2,
  },
  menuCard: {
    paddingVertical: Spacing.xxs,
    paddingHorizontal: Spacing.lg,
  },
  menuDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Brand.border,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
  },
  menuRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
});
