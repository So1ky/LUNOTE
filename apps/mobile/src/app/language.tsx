import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { Brand, Spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth-context';
import { LANGUAGES } from '@/lib/languages';

export default function LanguageScreen() {
  const { profile, updateProfile } = useAuth();
  const [saving, setSaving] = useState<string | null>(null);
  const selected = profile?.language ?? 'en';

  const onSelect = async (code: string) => {
    if (code === selected || saving) return;
    setSaving(code);
    try {
      await updateProfile({ language: code });
    } finally {
      setSaving(null);
    }
  };

  return (
    <Screen>
      <ScreenHeader
        back
        title="Language"
        subtitle="Choose your preferred language"
      />

      <Card style={styles.listCard}>
        {LANGUAGES.map((lang, i) => (
          <View key={lang.code}>
            {i > 0 && <View style={styles.divider} />}
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected: lang.code === selected }}
              style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
              onPress={() => void onSelect(lang.code)}>
              <ThemedText type={lang.code === selected ? 'bodyStrong' : 'body'}>
                {lang.label}
              </ThemedText>
              {lang.code === selected && (
                <ThemedText type="bodyStrong" style={styles.check}>
                  ✓
                </ThemedText>
              )}
              {saving === lang.code && (
                <ThemedText type="small" themeColor="textSecondary">
                  …
                </ThemedText>
              )}
            </Pressable>
          </View>
        ))}
      </Card>

      <ThemedText type="small" themeColor="textSecondary">
        Full translations are on the way — your choice is saved and will apply
        automatically once available.
      </ThemedText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  listCard: {
    paddingVertical: Spacing.xxs,
    paddingHorizontal: Spacing.lg,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Brand.border,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
  },
  rowPressed: {
    opacity: 0.6,
  },
  check: {
    color: Brand.purple,
  },
});
