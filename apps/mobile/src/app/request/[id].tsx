import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Badge, STATUS_TONE } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Brand, MaxContentWidth, Spacing } from '@/constants/theme';
import { ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import {
  CATEGORY_META,
  cancelQuoteRequest,
  formatAmount,
  formatDate,
  getQuoteRequest,
  type QuoteRequest,
} from '@/lib/quote-requests';

export default function RequestDetailScreen() {
  const router = useRouter();
  const { token } = useAuth();
  const params = useLocalSearchParams<{ id: string }>();
  const id = Number(params.id);

  const [request, setRequest] = useState<QuoteRequest | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);

  const load = useCallback(async () => {
    if (!token || Number.isNaN(id)) return;
    try {
      setRequest(await getQuoteRequest(token, id));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Something went wrong');
    }
  }, [token, id]);

  useEffect(() => {
    void load();
  }, [load]);

  const onCancel = async () => {
    if (!token) return;
    setCancelling(true);
    setError(null);
    try {
      setRequest(await cancelQuoteRequest(token, id));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Something went wrong');
    } finally {
      setCancelling(false);
    }
  };

  const cancellable =
    request?.status === 'REVIEWING' || request?.status === 'QUOTED';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} hitSlop={12}>
              <ThemedText type="subtitle">‹</ThemedText>
            </Pressable>
            <ThemedText type="subtitle">Request #{params.id}</ThemedText>
          </View>

          {!request && !error && <ActivityIndicator color={Brand.purple} />}

          {error && (
            <ThemedText type="small" style={styles.error}>
              {error}
            </ThemedText>
          )}

          {request && (
            <>
              <Card style={styles.summary}>
                <View style={styles.summaryTop}>
                  <ThemedText type="default">
                    {CATEGORY_META[request.category].emoji}{' '}
                    {CATEGORY_META[request.category].label}
                  </ThemedText>
                  <Badge tone={STATUS_TONE[request.status] ?? 'completed'} />
                </View>
                <ThemedText type="small" themeColor="textSecondary">
                  Requested {formatDate(request.createdAt)}
                  {request.desiredAmount
                    ? ` · Budget ${formatAmount(request.desiredAmount, request.currency)}`
                    : ''}
                </ThemedText>
                <ThemedText type="default" style={styles.description}>
                  {request.description}
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  Contact: {request.contactMethod}
                </ThemedText>
              </Card>

              {request.quote ? (
                <Card style={styles.quoteCard}>
                  <ThemedText type="smallBold" themeColor="textSecondary">
                    YOUR QUOTE
                  </ThemedText>
                  <ThemedText type="title" style={styles.amount}>
                    {formatAmount(request.quote.amount, request.quote.currency)}
                  </ThemedText>
                  <ThemedText type="default" themeColor="textSecondary">
                    {request.quote.explanation}
                  </ThemedText>
                  {request.status === 'QUOTED' && (
                    // TODO: PortOne 결제 연동 (A1 마지막 단계)
                    <Button label="Proceed to payment" size="lg" disabled />
                  )}
                </Card>
              ) : (
                request.status === 'REVIEWING' && (
                  <Card>
                    <ThemedText type="small" themeColor="textSecondary">
                      We are reviewing your request. A quote will arrive within
                      24 hours.
                    </ThemedText>
                  </Card>
                )
              )}

              {cancellable && (
                <Button
                  label="Cancel request"
                  variant="danger"
                  loading={cancelling}
                  onPress={() => void onCancel()}
                />
              )}
            </>
          )}
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
    paddingVertical: Spacing.four,
  },
  content: {
    width: '100%',
    maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.four,
    gap: Spacing.four,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  error: {
    color: Brand.danger,
  },
  summary: {
    gap: Spacing.two,
  },
  summaryTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  description: {
    marginTop: Spacing.one,
  },
  quoteCard: {
    gap: Spacing.two,
    borderColor: Brand.purple,
  },
  amount: {
    fontSize: 40,
    lineHeight: 48,
  },
});
