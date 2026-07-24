import Constants from 'expo-constants';
import { useState } from 'react';
import { Linking, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { Brand, Spacing } from '@/constants/theme';
import { useTranslation } from '@/i18n';

const SUPPORT_EMAIL = 'support@lunote.app';

export default function SupportScreen() {
  const { t } = useTranslation();
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const version = Constants.expoConfig?.version ?? '1.0.0';

  const FAQ: { q: string; a: string }[] = [
    { q: t('support.faq1q'), a: t('support.faq1a') },
    { q: t('support.faq2q'), a: t('support.faq2a') },
    { q: t('support.faq3q'), a: t('support.faq3a') },
    { q: t('support.faq4q'), a: t('support.faq4a') },
  ];

  return (
    <Screen>
      <ScreenHeader back title={t('support.title')} subtitle={t('support.subtitle')} />

      <View style={styles.section}>
        <ThemedText type="caption" themeColor="textSecondary">
          {t('support.faqLabel')}
        </ThemedText>
        <Card style={styles.faqCard}>
          {FAQ.map((item, i) => (
            <View key={item.q}>
              {i > 0 && <View style={styles.divider} />}
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ expanded: openIndex === i }}
                style={({ pressed }) => [styles.faqRow, pressed && styles.pressed]}
                onPress={() => setOpenIndex(openIndex === i ? null : i)}>
                <View style={styles.faqQuestion}>
                  <ThemedText type="bodyStrong" style={styles.faqQuestionText}>
                    {item.q}
                  </ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    {openIndex === i ? '▴' : '▾'}
                  </ThemedText>
                </View>
                {openIndex === i && (
                  <ThemedText type="small" themeColor="textSecondary">
                    {item.a}
                  </ThemedText>
                )}
              </Pressable>
            </View>
          ))}
        </Card>
      </View>

      <View style={styles.section}>
        <ThemedText type="caption" themeColor="textSecondary">
          {t('support.contactLabel')}
        </ThemedText>
        <Card style={styles.contactCard}>
          <ThemedText type="small" themeColor="textSecondary">
            {t('support.contactNote')}
          </ThemedText>
          <Button
            label={t('support.emailSupport')}
            onPress={() =>
              void Linking.openURL(
                `mailto:${SUPPORT_EMAIL}?subject=LUNOTE support request`,
              )
            }
          />
          <ThemedText type="small" themeColor="textSecondary" style={styles.email}>
            {SUPPORT_EMAIL}
          </ThemedText>
        </Card>
      </View>

      <ThemedText type="caption" themeColor="textSecondary" style={styles.version}>
        {t('support.version', { version })}
      </ThemedText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: Spacing.sm,
  },
  faqCard: {
    paddingVertical: Spacing.xxs,
    paddingHorizontal: Spacing.lg,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Brand.border,
  },
  faqRow: {
    paddingVertical: Spacing.md,
    gap: Spacing.xs,
  },
  pressed: {
    opacity: 0.7,
  },
  faqQuestion: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  faqQuestionText: {
    flex: 1,
  },
  contactCard: {
    gap: Spacing.md,
  },
  email: {
    textAlign: 'center',
  },
  version: {
    textAlign: 'center',
    letterSpacing: 0,
  },
});
