import Constants from 'expo-constants';
import { useState } from 'react';
import { Linking, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { Brand, Spacing } from '@/constants/theme';

const SUPPORT_EMAIL = 'support@lunote.app';

const FAQ: { q: string; a: string }[] = [
  {
    q: 'How fast will I get my quote?',
    a: 'We review every request and send a quote within 24 hours. You will get a notification (and an email, if enabled) the moment it arrives.',
  },
  {
    q: 'Can I cancel a request?',
    a: 'Yes — open the request and tap "Cancel request" any time before payment. After payment, contact support and we will help you.',
  },
  {
    q: 'How do I pay?',
    a: 'Once your quote is ready, you can pay in the app with international cards. Payment support is being finalized and will be available soon.',
  },
  {
    q: 'What languages do you support?',
    a: 'Our concierge team can assist you in English and Korean. App translations for more languages are on the way.',
  },
];

export default function SupportScreen() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const version = Constants.expoConfig?.version ?? '1.0.0';

  return (
    <Screen>
      <ScreenHeader back title="Support" subtitle="We're here to help" />

      <View style={styles.section}>
        <ThemedText type="caption" themeColor="textSecondary">
          FAQ
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
          CONTACT
        </ThemedText>
        <Card style={styles.contactCard}>
          <ThemedText type="small" themeColor="textSecondary">
            Can’t find your answer? Email us and we’ll get back to you within one
            business day.
          </ThemedText>
          <Button
            label="Email support"
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
        LUNOTE v{version}
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
