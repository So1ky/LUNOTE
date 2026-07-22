import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Badge, STATUS_TONE } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Brand, BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import {
  CATEGORY_META,
  formatDate,
  listQuoteRequests,
  type QuoteRequest,
} from '@/lib/quote-requests';

export default function QuoteScreen() {
  const router = useRouter();
  const { token } = useAuth();
  const [requests, setRequests] = useState<QuoteRequest[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      setError(null);
      setRequests(await listQuoteRequests(token));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Something went wrong');
    }
  }, [token]);

  // 탭에 들어올 때마다 새로고침 (문의 등록/취소 직후 반영)
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
        data={requests ?? []}
        keyExtractor={(item) => String(item.id)}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        refreshing={refreshing}
        onRefresh={() => void onRefresh()}
        ListHeaderComponent={
          <View style={styles.header}>
            <ThemedText type="subtitle">My Requests</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Track the status of your requests
            </ThemedText>
            {error && (
              <ThemedText type="small" style={styles.error}>
                {error}
              </ThemedText>
            )}
          </View>
        }
        ListEmptyComponent={
          !token ? (
            <View style={styles.empty}>
              <ThemedText type="default" themeColor="textSecondary">
                Log in to create and track your requests.
              </ThemedText>
              <Button label="Log in" onPress={() => router.push('/login')} />
            </View>
          ) : requests === null ? (
            <ActivityIndicator color={Brand.purple} style={styles.empty} />
          ) : (
            <View style={styles.empty}>
              <ThemedText type="default" themeColor="textSecondary">
                No requests yet.
              </ThemedText>
              <Button
                label="Request a Quote"
                onPress={() => router.push('/quote-request')}
              />
            </View>
          )
        }
        renderItem={({ item }) => (
          <Card
            style={styles.row}
            onPress={() => router.push(`/request/${item.id}`)}>
            <View style={styles.rowText}>
              <ThemedText type="default">
                #{item.id} · {CATEGORY_META[item.category].label}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {formatDate(item.createdAt)}
              </ThemedText>
            </View>
            <Badge tone={STATUS_TONE[item.status] ?? 'completed'} />
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
  error: {
    color: Brand.danger,
  },
  empty: {
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.six,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  rowText: {
    gap: 2,
  },
});
