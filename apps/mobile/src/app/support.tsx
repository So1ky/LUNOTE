import Constants from 'expo-constants';
import { useState } from 'react';
import { Linking, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { AppIcon } from '@/components/ui/app-icon';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { Brand, Spacing } from '@/constants/theme';
import { useTranslation } from '@/i18n';
import { type LegalDoc, openLegal } from '@/lib/legal';

const SUPPORT_EMAIL = 'contact@lunoteapp.com';
const LEGAL_DOCS: LegalDoc[] = ['terms', 'privacy', 'refund'];

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

      {/* 약관·처리방침·환불 규정 — 가입 화면 외에도 앱 안에서 항상 접근 가능해야 한다 (App Store 5.1.1) */}
      <View style={styles.section}>
        <ThemedText type="caption" themeColor="textSecondary">
          {t('support.legalLabel')}
        </ThemedText>
        <Card style={styles.faqCard}>
          {LEGAL_DOCS.map((doc, i) => (
            <View key={doc}>
              {i > 0 && <View style={styles.divider} />}
              <Pressable
                accessibilityRole="link"
                style={({ pressed }) => [styles.legalRow, pressed && styles.pressed]}
                onPress={() => openLegal(doc)}>
                <ThemedText type="body">{t(`legal.${doc}`)}</ThemedText>
                <AppIcon name="externalLink" size={16} color={Brand.textSecondary} />
              </Pressable>
            </View>
          ))}
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
  legalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
  },
  email: {
    textAlign: 'center',
  },
  version: {
    textAlign: 'center',
    letterSpacing: 0,
  },
});
