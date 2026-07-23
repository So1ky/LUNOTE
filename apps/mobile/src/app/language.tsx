import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { Brand, Spacing } from '@/constants/theme';
import { useTranslation } from '@/i18n';
import { useAuth } from '@/lib/auth-context';
import { LANGUAGES } from '@/lib/languages';

export default function LanguageScreen() {
  const { t } = useTranslation();
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
        title={t('language.title')}
        subtitle={t('language.subtitle')}
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
        {t('language.note')}
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
