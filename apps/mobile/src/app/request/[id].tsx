import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Linking,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { AppIcon } from '@/components/ui/app-icon';
import { Badge, STATUS_TONE } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Screen } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { TextField } from '@/components/ui/text-field';
import { Brand, Radius, Spacing } from '@/constants/theme';
import { useTranslation } from '@/i18n';
import { ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import {
  CATEGORY_META,
  cancelQuoteRequest,
  confirmCompletion,
  disputeCompletion,
  formatAmount,
  formatDate,
  getQuoteRequest,
  type QuoteRequest,
} from '@/lib/quote-requests';

export default function RequestDetailScreen() {
  const router = useRouter();
  const { t, locale } = useTranslation();
  const { token } = useAuth();
  const params = useLocalSearchParams<{ id: string }>();
  const id = Number(params.id);

  const [request, setRequest] = useState<QuoteRequest | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [confirmingCancel, setConfirmingCancel] = useState(false);
  // 완료 확인 절차 (AWAITING_CONFIRMATION) — 확인은 다이얼로그, 이의제기는 인라인 입력
  const [confirmingDone, setConfirmingDone] = useState(false);
  const [disputing, setDisputing] = useState(false);
  const [disputeText, setDisputeText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // effect 내 직접 fetch — cancelled 플래그로 언마운트/stale 응답을 가드한다
  useEffect(() => {
    if (!token || Number.isNaN(id)) return;
    let cancelled = false;
    getQuoteRequest(token, id)
      .then((data) => {
        if (!cancelled) setRequest(data);
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          setError(e instanceof ApiError ? e.message : t('common.somethingWrong'));
        }
      });
    return () => {
      cancelled = true;
    };
  }, [token, id, t]);

  const onCancel = async () => {
    if (!token) return;
    setCancelling(true);
    setError(null);
    try {
      setRequest(await cancelQuoteRequest(token, id));
      setConfirmingCancel(false);
    } catch (e) {
      setConfirmingCancel(false);
      setError(e instanceof ApiError ? e.message : t('common.somethingWrong'));
    } finally {
      setCancelling(false);
    }
  };

  const onConfirmCompletion = async () => {
    if (!token) return;
    setSubmitting(true);
    setError(null);
    try {
      setRequest(await confirmCompletion(token, id));
      setConfirmingDone(false);
    } catch (e) {
      setConfirmingDone(false);
      setError(e instanceof ApiError ? e.message : t('common.somethingWrong'));
    } finally {
      setSubmitting(false);
    }
  };

  const onDispute = async () => {
    if (!token || disputeText.trim().length === 0) return;
    setSubmitting(true);
    setError(null);
    try {
      setRequest(await disputeCompletion(token, id, disputeText.trim()));
      setDisputing(false);
      setDisputeText('');
    } catch (e) {
      setError(e instanceof ApiError ? e.message : t('common.somethingWrong'));
    } finally {
      setSubmitting(false);
    }
  };

  const cancellable =
    request?.status === 'REVIEWING' || request?.status === 'QUOTED';
  // 만료 판정은 서버가 강제한다 — UI는 표시·버튼 숨김만 담당 (기준 시각은 마운트 시점 고정)
  const [now] = useState(() => Date.now());
  const quoteExpired = request?.quote
    ? new Date(request.quote.expiresAt).getTime() < now
    : false;

  return (
    <Screen>
      <ScreenHeader back title={t('requestDetail.title')} />

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
              <View style={styles.summaryTitle}>
                <AppIcon
                  name={CATEGORY_META[request.category].icon}
                  size={18}
                  color={Brand.purpleSoft}
                />
                <ThemedText type="bodyStrong">
                  {t(`categories.${request.category}`)}
                </ThemedText>
              </View>
              <Badge tone={STATUS_TONE[request.status] ?? 'completed'} />
            </View>
            {request.serviceItem && (
              <ThemedText type="smallStrong">
                {t(`services.${request.serviceItem}.title`)}
              </ThemedText>
            )}
            <ThemedText type="small" themeColor="textSecondary">
              {t('requestDetail.requested', {
                date: formatDate(request.createdAt, locale),
              })}
              {request.desiredAmount
                ? t('requestDetail.budgetSuffix', {
                    amount: formatAmount(
                      request.desiredAmount,
                      request.currency,
                      locale,
                    ),
                  })
                : ''}
            </ThemedText>
            <ThemedText type="body" style={styles.description}>
              {request.description}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {t('requestDetail.contact', { method: request.contactMethod })}
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
                {t('requestDetail.yourQuote')}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {t('requestDetail.paymentMethod', { method: t(`paymentMethods.${request.paymentMethod}`) })}
              </ThemedText>
              <ThemedText type="display" style={styles.amount}>
                {formatAmount(request.quote.amount, request.quote.currency, locale)}
              </ThemedText>
              <ThemedText type="body" themeColor="textSecondary">
                {request.quote.explanation}
              </ThemedText>
              <ThemedText
                type="small"
                themeColor="textSecondary"
                style={quoteExpired && styles.expiredText}>
                {quoteExpired
                  ? t('requestDetail.quoteExpired')
                  : t('requestDetail.validUntil', {
                      date: formatDate(request.quote.expiresAt, locale),
                    })}
              </ThemedText>
              {request.status === 'QUOTED' && !quoteExpired && (
                <Button
                  label={t('requestDetail.proceedPayment')}
                  size="lg"
                  onPress={() => router.push(`/pay/${request.id}`)}
                />
              )}
            </Card>
          ) : request.status === 'REVIEWING' ? (
            <Card>
              <ThemedText type="small" themeColor="textSecondary">
                {t('requestDetail.reviewing')}
              </ThemedText>
            </Card>
          ) : (
            request.status === 'REJECTED' && (
              <Card>
                <ThemedText type="small" themeColor="textSecondary">
                  {t('requestDetail.rejectedReason', {
                    reason: request.rejectionReason ?? '',
                  })}
                </ThemedText>
              </Card>
            )
          )}

          {request.status === 'AWAITING_CONFIRMATION' && (
            <Card style={styles.actions}>
              {/* 기한은 서버가 항상 함께 저장하지만, 없더라도 확인·이의제기 버튼은 남긴다 */}
              {request.confirmationDeadlineAt && (
                <ThemedText type="small" themeColor="textSecondary">
                  {t('requestDetail.awaitingConfirmation', {
                    date: formatDate(request.confirmationDeadlineAt, locale),
                  })}
                </ThemedText>
              )}
              <Button
                label={t('requestDetail.confirmCompletion')}
                size="lg"
                disabled={submitting}
                onPress={() => setConfirmingDone(true)}
              />
              {disputing ? (
                <>
                  <TextField
                    placeholder={t('requestDetail.disputePlaceholder')}
                    value={disputeText}
                    onChangeText={setDisputeText}
                    multiline
                    maxLength={500}
                    style={styles.disputeInput}
                  />
                  {error && (
                    <ThemedText type="small" style={styles.error}>
                      {error}
                    </ThemedText>
                  )}
                  <Button
                    label={t('requestDetail.disputeSubmit')}
                    variant="outline"
                    disabled={submitting || disputeText.trim().length === 0}
                    onPress={() => void onDispute()}
                  />
                  <Button
                    label={t('requestDetail.disputeCancel')}
                    variant="ghost"
                    disabled={submitting}
                    onPress={() => setDisputing(false)}
                  />
                </>
              ) : (
                <Button
                  label={t('requestDetail.dispute')}
                  variant="outline"
                  disabled={submitting}
                  onPress={() => setDisputing(true)}
                />
              )}
            </Card>
          )}

          {request.status === 'IN_PROGRESS' && request.disputedAt && (
            <Card>
              <ThemedText type="small" themeColor="textSecondary">
                {t('requestDetail.disputed', {
                  date: formatDate(request.disputedAt, locale),
                })}
              </ThemedText>
            </Card>
          )}

          <ConfirmDialog
            visible={confirmingDone}
            title={t('requestDetail.confirmCompletionTitle')}
            message={t('requestDetail.confirmCompletionMessage')}
            confirmLabel={t('requestDetail.confirmCompletionYes')}
            dismissLabel={t('requestDetail.confirmCompletionNo')}
            loading={submitting}
            onConfirm={() => void onConfirmCompletion()}
            onDismiss={() => setConfirmingDone(false)}
          />

          {cancellable && (
            <Button
              label={t('requestDetail.cancel')}
              variant="danger"
              onPress={() => setConfirmingCancel(true)}
            />
          )}

          <ConfirmDialog
            visible={confirmingCancel}
            title={t('requestDetail.cancelTitle')}
            message={
              request.quote
                ? t('requestDetail.cancelMessageQuoted')
                : t('requestDetail.cancelMessagePlain')
            }
            confirmLabel={t('requestDetail.cancelConfirm')}
            dismissLabel={t('requestDetail.cancelKeep')}
            destructive
            loading={cancelling}
            onConfirm={() => void onCancel()}
            onDismiss={() => setConfirmingCancel(false)}
          />
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: {
    gap: Spacing.md,
  },
  actions: {
    gap: Spacing.sm,
  },
  disputeInput: {
    minHeight: 96,
    textAlignVertical: 'top',
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
  summaryTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    flexShrink: 1,
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
  expiredText: {
    color: Brand.danger,
  },
});
