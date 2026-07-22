import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { EmptyState } from '@/components/ui/empty-state';
import { RequestRow } from '@/components/ui/request-row';
import { listStyles, Screen } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { Brand, Spacing } from '@/constants/theme';
import { ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { listQuoteRequests, type QuoteRequest } from '@/lib/quote-requests';

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
    <Screen scroll={false}>
      <FlatList
        data={requests ?? []}
        keyExtractor={(item) => String(item.id)}
        style={listStyles.list}
        contentContainerStyle={listStyles.content}
        refreshing={refreshing}
        onRefresh={() => void onRefresh()}
        ListHeaderComponent={
          <View style={styles.header}>
            <ScreenHeader
              title="My Requests"
              subtitle="Track the status of your requests"
            />
            {error && (
              <ThemedText type="small" style={styles.error}>
                {error}
              </ThemedText>
            )}
          </View>
        }
        ListEmptyComponent={
          !token ? (
            <EmptyState
              emoji="🔐"
              message="Log in to create and track your requests."
              action={{ label: 'Log in', onPress: () => router.push('/login') }}
            />
          ) : requests === null ? (
            <ActivityIndicator color={Brand.purple} style={styles.loading} />
          ) : (
            <EmptyState
              emoji="📋"
              message="No requests yet — tell us what you need."
              action={{
                label: 'Request a Quote',
                onPress: () => router.push('/quote-request'),
              }}
            />
          )
        }
        renderItem={({ item }) => (
          <RequestRow
            request={item}
            onPress={() => router.push(`/request/${item.id}`)}
          />
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  error: {
    color: Brand.danger,
  },
  loading: {
    paddingVertical: Spacing.xxxl,
  },
});
