import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Linking,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Badge, STATUS_TONE } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { Brand, Radius, Spacing } from '@/constants/theme';
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
    <Screen>
      <ScreenHeader back title={`Request #${params.id}`} />

      {!request && !error && <ActivityIndicator color={Brand.purple} />}

      {error && (
        <ThemedText type="small" style={styles.error}>
          {error}
        </ThemedText>
      )}

      {request && (
        <View style={styles.body}>
          <Card style={styles.summary}>
            <View style={styles.summaryTop}>
              <ThemedText type="bodyStrong">
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
            <ThemedText type="body" style={styles.description}>
              {request.description}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Contact: {request.contactMethod}
            </ThemedText>

            {request.attachments && request.attachments.length > 0 && (
              <View style={styles.attachments}>
                {request.attachments.map((a) =>
                  a.mimeType.startsWith('image/') ? (
                    <Pressable
                      key={a.id}
                      onPress={() => void Linking.openURL(a.downloadUrl)}>
                      <Image
                        source={{ uri: a.downloadUrl }}
                        style={styles.attachImage}
                      />
                    </Pressable>
                  ) : (
                    <Pressable
                      key={a.id}
                      style={styles.attachFile}
                      onPress={() => void Linking.openURL(a.downloadUrl)}>
                      <ThemedText type="small">📄 {a.fileName}</ThemedText>
                    </Pressable>
                  ),
                )}
              </View>
            )}
          </Card>

          {request.quote ? (
            <Card style={styles.quoteCard}>
              <ThemedText type="caption" themeColor="textSecondary">
                YOUR QUOTE
              </ThemedText>
              <ThemedText type="display" style={styles.amount}>
                {formatAmount(request.quote.amount, request.quote.currency)}
              </ThemedText>
              <ThemedText type="body" themeColor="textSecondary">
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
                  We are reviewing your request. A quote will arrive within 24
                  hours.
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
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: {
    gap: Spacing.md,
  },
  error: {
    color: Brand.danger,
  },
  summary: {
    gap: Spacing.xs,
  },
  summaryTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  description: {
    marginTop: Spacing.xxs,
  },
  quoteCard: {
    gap: Spacing.xs,
    borderColor: Brand.purple,
  },
  attachments: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginTop: Spacing.xxs,
  },
  attachImage: {
    width: 84,
    height: 84,
    borderRadius: Radius.md,
    backgroundColor: Brand.surfaceAlt,
  },
  attachFile: {
    backgroundColor: Brand.surfaceAlt,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    justifyContent: 'center',
  },
  amount: {
    fontVariant: ['tabular-nums'],
  },
});
