import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Badge, STATUS_TONE } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Brand, BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth-context';
import {
  CATEGORY_META,
  formatAmount,
  formatDate,
  listQuoteRequests,
  type QuoteRequest,
} from '@/lib/quote-requests';

/** 결제 탭에 보여줄 상태: 견적 도착(결제 대기) + 결제 이후 단계들 */
const PAYMENT_STATUSES = new Set(['QUOTED', 'PAID', 'IN_PROGRESS', 'COMPLETED', 'REFUNDED']);

export default function PaymentScreen() {
  const router = useRouter();
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
    <SafeAreaView style={styles.container}>
      <FlatList
        data={items ?? []}
        keyExtractor={(item) => String(item.id)}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        refreshing={refreshing}
        onRefresh={() => void onRefresh()}
        ListHeaderComponent={
          <View style={styles.header}>
            <ThemedText type="subtitle">Payments</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Review quotes and complete payments
            </ThemedText>
          </View>
        }
        ListEmptyComponent={
          items === null ? (
            <ActivityIndicator color={Brand.purple} style={styles.empty} />
          ) : (
            <View style={styles.empty}>
              <ThemedText type="default" themeColor="textSecondary">
                Nothing to pay yet — quotes will appear here.
              </ThemedText>
            </View>
          )
        }
        renderItem={({ item }) => (
          <Card style={styles.row} onPress={() => router.push(`/request/${item.id}`)}>
            <View style={styles.rowTop}>
              <View style={styles.rowText}>
                <ThemedText type="default">
                  #{item.id} · {CATEGORY_META[item.category].label}
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {formatDate(item.quote!.createdAt)}
                </ThemedText>
              </View>
              <ThemedText type="subtitle" style={styles.amount}>
                {formatAmount(item.quote!.amount, item.quote!.currency)}
              </ThemedText>
            </View>
            <View style={styles.rowBottom}>
              <Badge tone={STATUS_TONE[item.status] ?? 'completed'} />
              {item.status === 'QUOTED' && (
                // TODO: PortOne 결제 연동 — 현재는 상세 화면으로 이동
                <Button label="Pay now" onPress={() => router.push(`/request/${item.id}`)} />
              )}
            </View>
          </Card>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Brand.bg,
    alignItems: 'center',
  },
  list: {
    width: '100%',
  },
  listContent: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    padding: Spacing.four,
    paddingTop: Spacing.five,
    gap: Spacing.three,
    paddingBottom: BottomTabInset + Spacing.four,
  },
  header: {
    gap: Spacing.one,
    marginBottom: Spacing.two,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: Spacing.six,
  },
  row: {
    gap: Spacing.three,
  },
  rowTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  rowText: {
    gap: 2,
  },
  amount: {
    fontSize: 22,
    lineHeight: 30,
  },
  rowBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
});
