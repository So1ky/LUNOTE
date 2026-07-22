import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Badge, STATUS_TONE } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Brand, BottomTabInset, MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth-context';
import { listNotifications } from '@/lib/notifications';
import {
  CATEGORY_META,
  formatDate,
  listQuoteRequests,
  type Category,
  type QuoteRequest,
} from '@/lib/quote-requests';

const CATEGORIES = Object.keys(CATEGORY_META) as Category[];

export default function HomeScreen() {
  const router = useRouter();
  const { token, profile } = useAuth();
  const [recent, setRecent] = useState<QuoteRequest[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useFocusEffect(
    useCallback(() => {
      if (!token) return;
      void listQuoteRequests(token)
        .then((all) => setRecent(all.slice(0, 2)))
        .catch(() => setRecent([]));
      void listNotifications(token)
        .then((data) => setUnreadCount(data.unreadCount))
        .catch(() => setUnreadCount(0));
    }, [token]),
  );

  const firstName = profile?.name?.split(' ')[0];

  // 게스트가 실사용 진입점을 누르면 로그인으로 유도
  const goRequest = (category?: string) => {
    if (!token) {
      router.push('/login');
      return;
    }
    router.push(
      category
        ? { pathname: '/quote-request', params: { category } }
        : '/quote-request',
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <View style={styles.headerRow}>
            <View style={styles.header}>
              <ThemedText type="subtitle">
                Hello{firstName ? ` ${firstName}` : ''} 👋
              </ThemedText>
              <ThemedText type="default" themeColor="textSecondary">
                How can we help you settle in Korea?
              </ThemedText>
            </View>
            {token && (
            <Pressable
              style={styles.bell}
              hitSlop={8}
              onPress={() => router.push('/notifications')}>
              <ThemedText style={styles.bellIcon}>🔔</ThemedText>
              {unreadCount > 0 && (
                <View style={styles.bellBadge}>
                  <ThemedText style={styles.bellBadgeText}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </ThemedText>
                </View>
              )}
            </Pressable>
            )}
          </View>

          <Card style={styles.cta} onPress={() => goRequest()}>
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
                <Card
                  key={c}
                  style={styles.categoryCard}
                  onPress={() => goRequest(c)}>
                  <ThemedText style={styles.categoryEmoji}>
                    {CATEGORY_META[c].emoji}
                  </ThemedText>
                  <ThemedText type="small">{CATEGORY_META[c].label}</ThemedText>
                </Card>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionTitle}>
              RECENT REQUESTS
            </ThemedText>
            {recent.length === 0 && (
              <ThemedText type="small" themeColor="textSecondary">
                {token
                  ? 'Your requests will appear here.'
                  : 'Log in to create and track your requests.'}
              </ThemedText>
            )}
            {recent.map((r) => (
              <Card
                key={r.id}
                style={styles.recentRow}
                onPress={() => router.push(`/request/${r.id}`)}>
                <View style={styles.recentText}>
                  <ThemedText type="default">
                    #{r.id} · {CATEGORY_META[r.category].label}
                  </ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    {formatDate(r.createdAt)}
                  </ThemedText>
                </View>
                <Badge tone={STATUS_TONE[r.status] ?? 'completed'} />
              </Card>
            ))}
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  header: {
    gap: Spacing.one,
    flex: 1,
  },
  bell: {
    position: 'relative',
    padding: Spacing.one,
  },
  bellIcon: {
    fontSize: 22,
    lineHeight: 28,
  },
  bellBadge: {
    position: 'absolute',
    top: -2,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Brand.danger,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  bellBadgeText: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '700',
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
