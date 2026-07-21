import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Brand, BottomTabInset, MaxContentWidth, Radius, Spacing } from '@/constants/theme';

/** 문의 카테고리 — 아키텍처 문서의 서비스 범주 기준 */
const CATEGORIES = [
  { key: 'housing', emoji: '🏠', label: 'Housing' },
  { key: 'visa', emoji: '🛂', label: 'Visa' },
  { key: 'hospital', emoji: '🏥', label: 'Hospital' },
  { key: 'bank', emoji: '🏦', label: 'Bank' },
  { key: 'telecom', emoji: '📱', label: 'Telecom' },
  { key: 'other', emoji: '✨', label: 'Other' },
];

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <View style={styles.header}>
            <ThemedText type="subtitle">Hello 👋</ThemedText>
            <ThemedText type="default" themeColor="textSecondary">
              How can we help you settle in Korea?
            </ThemedText>
          </View>

          {/* TODO: 문의 등록 폼 화면(/quote-request) 연결 */}
          <Card style={styles.cta} onPress={() => {}}>
            <View style={styles.ctaText}>
              <ThemedText type="subtitle" style={styles.ctaTitle}>
                Request a Quote
              </ThemedText>
              <ThemedText type="small" style={styles.ctaSub}>
                Tell us what you need — we’ll handle the rest
              </ThemedText>
            </View>
            <ThemedText type="subtitle" style={styles.ctaArrow}>
              →
            </ThemedText>
          </Card>

          <View style={styles.section}>
            <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionTitle}>
              CATEGORIES
            </ThemedText>
            <View style={styles.grid}>
              {CATEGORIES.map((c) => (
                <Card key={c.key} style={styles.categoryCard} onPress={() => {}}>
                  <ThemedText style={styles.categoryEmoji}>{c.emoji}</ThemedText>
                  <ThemedText type="small">{c.label}</ThemedText>
                </Card>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionTitle}>
              RECENT REQUESTS
            </ThemedText>
            {/* TODO: GET /quotes 최근 항목 연동 */}
            <Card style={styles.recentRow} onPress={() => {}}>
              <View style={styles.recentText}>
                <ThemedText type="default">#3 · Housing</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  Jul 4, 2026
                </ThemedText>
              </View>
              <Badge tone="reviewing" />
            </Card>
            <Card style={styles.recentRow} onPress={() => {}}>
              <View style={styles.recentText}>
                <ThemedText type="default">#2 · Visa</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  Jul 1, 2026
                </ThemedText>
              </View>
              <Badge tone="quoted" />
            </Card>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Brand.bg,
  },
  scroll: {
    flexGrow: 1,
    alignItems: 'center',
    paddingBottom: BottomTabInset + Spacing.four,
  },
  content: {
    width: '100%',
    maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.five,
    gap: Spacing.five,
  },
  header: {
    gap: Spacing.one,
  },
  cta: {
    backgroundColor: Brand.purple,
    borderColor: Brand.purple,
    borderRadius: Radius.xl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  ctaText: {
    flex: 1,
    gap: Spacing.one,
  },
  ctaTitle: {
    fontSize: 24,
    lineHeight: 32,
  },
  ctaSub: {
    color: 'rgba(244, 245, 251, 0.8)',
  },
  ctaArrow: {
    color: Brand.text,
  },
  section: {
    gap: Spacing.three,
  },
  sectionTitle: {
    letterSpacing: 1,
    fontSize: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.three,
  },
  categoryCard: {
    flexBasis: '30%',
    flexGrow: 1,
    alignItems: 'center',
    gap: Spacing.one,
    paddingVertical: Spacing.three,
  },
  categoryEmoji: {
    fontSize: 24,
    lineHeight: 32,
  },
  recentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  recentText: {
    gap: 2,
  },
});
