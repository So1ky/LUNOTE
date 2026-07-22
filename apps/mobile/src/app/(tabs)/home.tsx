import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { RequestRow } from '@/components/ui/request-row';
import { Screen } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { Brand, Radius, Spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth-context';
import { listNotifications } from '@/lib/notifications';
import {
  CATEGORY_META,
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
    <Screen tabInset>
      <ScreenHeader
        title={`Hello${firstName ? ` ${firstName}` : ''} 👋`}
        subtitle="How can we help you settle in Korea?"
        right={
          token ? (
            <Pressable
              style={styles.bell}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Notifications"
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
          ) : undefined
        }
      />

      <Card style={styles.cta} onPress={() => goRequest()}>
        <View style={styles.ctaText}>
          <ThemedText type="heading">Request a Quote</ThemedText>
          <ThemedText type="small" style={styles.ctaSub}>
            Tell us what you need — we’ll handle the rest
          </ThemedText>
        </View>
        <ThemedText type="heading" style={styles.ctaArrow}>
          →
        </ThemedText>
      </Card>

      <View style={styles.section}>
        <ThemedText type="caption" themeColor="textSecondary">
          CATEGORIES
        </ThemedText>
        <View style={styles.grid}>
          {CATEGORIES.map((c) => (
            <Card key={c} style={styles.categoryCard} onPress={() => goRequest(c)}>
              <ThemedText style={styles.categoryEmoji}>
                {CATEGORY_META[c].emoji}
              </ThemedText>
              <ThemedText type="smallStrong">{CATEGORY_META[c].label}</ThemedText>
            </Card>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <ThemedText type="caption" themeColor="textSecondary">
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
          <RequestRow
            key={r.id}
            request={r}
            onPress={() => router.push(`/request/${r.id}`)}
          />
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  bell: {
    position: 'relative',
    padding: Spacing.xxs,
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
    borderRadius: Radius.full,
    backgroundColor: Brand.danger,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xxs,
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
    gap: Spacing.md,
    padding: Spacing.xl,
  },
  ctaText: {
    flex: 1,
    gap: Spacing.xxs,
  },
  ctaSub: {
    color: 'rgba(244, 245, 251, 0.8)',
  },
  ctaArrow: {
    color: Brand.text,
  },
  section: {
    gap: Spacing.sm,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  categoryCard: {
    flexBasis: '30%',
    flexGrow: 1,
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xs,
  },
  categoryEmoji: {
    fontSize: 24,
    lineHeight: 32,
  },
});
