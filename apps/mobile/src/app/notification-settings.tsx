import { useState } from 'react';
import { StyleSheet, Switch, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { Brand, Spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth-context';

export default function NotificationSettingsScreen() {
  const { profile, updateProfile } = useAuth();
  const [saving, setSaving] = useState(false);

  const onToggleQuoteEmail = async (value: boolean) => {
    setSaving(true);
    try {
      await updateProfile({ quoteEmailEnabled: value });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen>
      <ScreenHeader
        back
        title="Notifications"
        subtitle="Choose how we reach you"
      />

      <Card style={styles.card}>
        <View style={styles.row}>
          <View style={styles.rowText}>
            <ThemedText type="bodyStrong">Quote arrived — email</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Get an email the moment your quote is ready.
            </ThemedText>
          </View>
          <Switch
            value={profile?.quoteEmailEnabled ?? true}
            disabled={saving}
            onValueChange={(v) => void onToggleQuoteEmail(v)}
            trackColor={{ true: Brand.purple, false: Brand.surfaceAlt }}
            thumbColor={Brand.text}
          />
        </View>

        <View style={styles.divider} />

        <View style={styles.row}>
          <View style={styles.rowText}>
            <ThemedText type="bodyStrong">In-app notifications</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Quote and request updates in your notification inbox.
            </ThemedText>
          </View>
          <ThemedText type="smallStrong" style={styles.alwaysOn}>
            Always on
          </ThemedText>
        </View>

        <View style={styles.divider} />

        <View style={[styles.row, styles.rowDisabled]}>
          <View style={styles.rowText}>
            <ThemedText type="bodyStrong">Push notifications</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Coming soon.
            </ThemedText>
          </View>
          <Switch value={false} disabled />
        </View>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: Spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  rowDisabled: {
    opacity: 0.5,
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Brand.border,
  },
  alwaysOn: {
    color: Brand.success,
  },
});
