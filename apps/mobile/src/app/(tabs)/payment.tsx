import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Badge, STATUS_TONE } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { listStyles, Screen } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { Brand, Spacing } from '@/constants/theme';
import { useTranslation } from '@/i18n';
import { useAuth } from '@/lib/auth-context';
import {
  formatAmount,
  formatDate,
  listQuoteRequests,
  type QuoteRequest,
} from '@/lib/quote-requests';

/** 결제 탭에 보여줄 상태: 견적 도착(결제 대기) + 결제 이후 단계들 */
const PAYMENT_STATUSES = new Set(['QUOTED', 'PAID', 'IN_PROGRESS', 'COMPLETED', 'REFUNDED']);

export default function PaymentScreen() {
  const router = useRouter();
  const { t, locale } = useTranslation();
  const { token } = useAuth();
  const [items, setItems] = useState<QuoteRequest[] | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      const all = await listQuoteRequests(token);
      setItems(all.filter((r) => r.quote && PAYMENT_STATUSES.has(r.status)));
    } catch {
      setItems([]);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  return (
    <Screen scroll={false}>
      <FlatList
        data={items ?? []}
        keyExtractor={(item) => String(item.id)}
        style={listStyles.list}
        contentContainerStyle={listStyles.content}
        refreshing={refreshing}
        onRefresh={() => void onRefresh()}
        ListHeaderComponent={
          <View style={styles.header}>
            <ScreenHeader
              title={t('payment.title')}
              subtitle={t('payment.subtitle')}
            />
          </View>
        }
        ListEmptyComponent={
          !token ? (
            <EmptyState
              emoji="🔐"
              message={t('payment.emptyGuest')}
              action={{ label: t('payment.login'), onPress: () => router.push('/login') }}
            />
          ) : items === null ? (
            <ActivityIndicator color={Brand.purple} style={styles.loading} />
          ) : (
            <EmptyState
              emoji="💳"
              message={t('payment.emptyNone')}
            />
          )
        }
        renderItem={({ item }) => (
          <Card style={styles.row} onPress={() => router.push(`/request/${item.id}`)}>
            <View style={styles.rowTop}>
              <View style={styles.rowText}>
                <ThemedText type="bodyStrong">
                  {t(`categories.${item.category}`)}
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  #{item.id} · {formatDate(item.quote!.createdAt, locale)}
                </ThemedText>
              </View>
              <ThemedText type="heading" style={styles.amount}>
                {formatAmount(item.quote!.amount, item.quote!.currency, locale)}
              </ThemedText>
            </View>
            <View style={styles.rowBottom}>
              <Badge tone={STATUS_TONE[item.status] ?? 'completed'} />
              {item.status === 'QUOTED' && (
                // TODO: PortOne 결제 연동 — 현재는 상세 화면으로 이동
                <Button label={t('payment.payNow')} onPress={() => router.push(`/request/${item.id}`)} />
              )}
            </View>
          </Card>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: Spacing.md,
  },
  loading: {
    paddingVertical: Spacing.xxxl,
  },
  row: {
    gap: Spacing.md,
  },
  rowTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  amount: {
    fontVariant: ['tabular-nums'],
  },
  rowBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
});
