import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, View } from 'react-native';

import { LegalText } from '@/components/legal-text';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { EmptyState } from '@/components/ui/empty-state';
import { Screen } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { Brand, Layout, Spacing } from '@/constants/theme';
import { useTranslation } from '@/i18n';
import { ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import {
  confirmPayment,
  createPaymentIntent,
  type PaymentIntent,
} from '@/lib/payments';
import { formatAmount, getQuoteRequest, type Quote } from '@/lib/quote-requests';

type PaymentUIComponent = typeof import('@portone/react-native-sdk').PaymentUI;

/**
 * PortOne SDK는 react-native-webview(네이티브 모듈)를 쓴다. 이 모듈이 링크되지 않은 옛 개발 빌드나
 * 웹에서는 import 자체가 죽을 수 있어 지연 require + try/catch로 폴백한다 (CLAUDE.md 로컬 개발 환경).
 */
function loadPaymentUI(): PaymentUIComponent | null {
  if (Platform.OS === 'web') return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return (require('@portone/react-native-sdk') as typeof import('@portone/react-native-sdk')).PaymentUI;
  } catch (e) {
    // 폴백 원인 추적용 — 프로덕션에서도 원인 파악에 필요해 유지
    console.warn('[pay] PortOne SDK load failed:', e);
    return null;
  }
}

// 모듈 로드 시 1회 — 렌더 중 컴포넌트를 만들지 않는다 (react-hooks/static-components)
const PaymentUI = loadPaymentUI();

// consent: 견적 확인 + 청약철회 제한 동의 — 체크 후에야 결제 시도(intent)를 만든다
type Phase = 'loading' | 'consent' | 'ready' | 'confirming' | 'done' | 'error';

/** 결제 UI 콜백 직후 웹훅/조회가 아직 반영되지 않았을 수 있어 짧게 재확인한다 */
const CONFIRM_RETRIES = 4;
const CONFIRM_DELAY_MS = 1500;

export default function PayScreen() {
  const router = useRouter();
  const { t, locale } = useTranslation();
  const { token, profile } = useAuth();
  const params = useLocalSearchParams<{ requestId: string }>();
  const requestId = Number(params.requestId);

  const [quote, setQuote] = useState<Quote | null>(null);
  const [consented, setConsented] = useState(false);
  const [intent, setIntent] = useState<PaymentIntent | null>(null);
  const [phase, setPhase] = useState<Phase>('loading');
  const [error, setError] = useState<string | null>(null);
  // 버튼 연타 가드 — setPhase('loading')는 다음 렌더에야 버튼을 숨긴다
  const continuingRef = useRef(false);

  // 견적은 한 번만 가져온다 — 토큰 갱신(30분)으로 effect가 다시 돌아도 결제 중 화면을 동의 단계로 되돌리지 않는다
  useEffect(() => {
    if (!token || Number.isNaN(requestId) || quote) return;
    let cancelled = false;
    (async () => {
      try {
        const request = await getQuoteRequest(token, requestId);
        if (!request.quote) throw new ApiError(409, t('pay.notPayable'));
        if (cancelled) return;
        setQuote(request.quote);
        setPhase('consent');
      } catch (e) {
        if (cancelled) return;
        setError(describeError(e, t));
        setPhase('error');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, requestId, t, quote]);

  // 동의 후에만 서버에 결제 시도를 만든다 — 서버가 이 시점을 withdrawalConsentAt으로 기록
  const onContinue = async () => {
    if (!token || !quote || continuingRef.current) return;
    continuingRef.current = true;
    setPhase('loading');
    try {
      setIntent(await createPaymentIntent(token, quote.id));
      setPhase('ready');
    } catch (e) {
      setError(describeError(e, t));
      setPhase('error');
    } finally {
      continuingRef.current = false;
    }
  };

  const onPaymentComplete = async (response: { code?: string; message?: string }) => {
    if (!token || !intent) return;
    if (response.code) {
      // PG/사용자 취소 등 — 서버 상태는 웹훅이 정리하므로 여기서는 표시만
      setError(response.message ?? t('pay.failed'));
      setPhase('error');
      return;
    }
    setPhase('confirming');
    try {
      for (let i = 0; i < CONFIRM_RETRIES; i++) {
        const payment = await confirmPayment(token, intent.paymentId);
        if (payment.status === 'PAID') {
          setPhase('done');
          return;
        }
        if (payment.status !== 'PENDING') break;
        await new Promise((r) => setTimeout(r, CONFIRM_DELAY_MS));
      }
      setError(t('pay.pendingConfirm'));
      setPhase('error');
    } catch (e) {
      setError(describeError(e, t));
      setPhase('error');
    }
  };

  const goToRequest = () => router.replace(`/request/${requestId}`);

  return (
    <Screen scroll={false}>
      <View style={styles.body}>
        <ScreenHeader back title={t('pay.title')} />

        {quote && (
          <Card style={styles.summary}>
            <ThemedText type="caption" themeColor="textSecondary">
              {t('pay.summary', { id: requestId })}
            </ThemedText>
            <ThemedText type="display" style={styles.amount}>
              {formatAmount(quote.amount, quote.currency, locale)}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {t('pay.secure')}
            </ThemedText>
          </Card>
        )}

        {phase === 'loading' && <ActivityIndicator color={Brand.purple} style={styles.loading} />}

        {phase === 'consent' && (
          <View style={styles.consent}>
            <Checkbox
              checked={consented}
              onChange={setConsented}
              accessibilityLabel={t('pay.consent', { refund: t('legal.refund') })}>
              <LegalText k="pay.consent" />
            </Checkbox>
            <Button
              label={t('pay.continueToPayment')}
              size="lg"
              disabled={!consented}
              onPress={() => void onContinue()}
            />
          </View>
        )}

        {phase === 'error' && (
          <EmptyState
            icon="warning"
            message={error ?? t('common.somethingWrong')}
            action={{ label: t('pay.backToRequest'), onPress: goToRequest }}
          />
        )}

        {phase === 'confirming' && (
          <EmptyState icon="clock" message={t('pay.confirming')} />
        )}

        {phase === 'done' && (
          <EmptyState
            icon="checkCircle"
            title={t('pay.success')}
            message={t('pay.successBody')}
            action={{ label: t('pay.backToRequest'), onPress: goToRequest }}
          />
        )}

        {phase === 'ready' && intent && !PaymentUI && (
          <EmptyState
            icon="card"
            message={Platform.OS === 'web' ? t('pay.webUnsupported') : t('pay.sdkUnavailable')}
            action={{ label: t('pay.backToRequest'), onPress: goToRequest }}
          />
        )}

        {phase === 'ready' && intent && PaymentUI && (
          <View style={styles.checkout}>
            <ThemedText type="small" themeColor="textSecondary">
              {t('pay.payWithPaypal')}
            </ThemedText>
            <PaymentUI
              style={styles.webview}
              request={{
                uiType: 'PAYPAL_SPB',
                storeId: intent.storeId,
                channelKey: intent.channelKey,
                paymentId: intent.paymentId,
                orderName: intent.orderName,
                totalAmount: intent.totalAmount,
                currency: intent.currency as 'USD',
                customer: profile
                  ? {
                      customerId: profile.id,
                      email: profile.email,
                      firstName: profile.firstName ?? undefined,
                      lastName: profile.lastName ?? undefined,
                    }
                  : undefined,
              }}
              onComplete={(res) => void onPaymentComplete(res)}
              onError={(e) => {
                setError(e.message);
                setPhase('error');
              }}
            />
          </View>
        )}
      </View>
    </Screen>
  );
}

function describeError(e: unknown, t: (k: string) => string) {
  if (e instanceof ApiError) {
    switch (e.message) {
      case 'QUOTE_EXPIRED':
        return t('requestDetail.quoteExpired');
      case 'QUOTE_NOT_PAYABLE':
        return t('pay.notPayable');
      case 'UNSUPPORTED_CURRENCY':
        return t('pay.unsupportedCurrency');
      case 'PAYMENTS_NOT_CONFIGURED':
        return t('pay.notConfigured');
      default:
        return e.message;
    }
  }
  return t('common.somethingWrong');
}

const styles = StyleSheet.create({
  body: {
    flex: 1,
    width: '100%',
    maxWidth: Layout.maxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Layout.screenPaddingX,
    paddingTop: Layout.screenPaddingTop,
    gap: Spacing.md,
  },
  summary: {
    gap: Spacing.xs,
    borderColor: Brand.purple,
  },
  amount: {
    fontVariant: ['tabular-nums'],
  },
  loading: {
    paddingVertical: Spacing.xxxl,
  },
  consent: {
    gap: Spacing.lg,
  },
  checkout: {
    flex: 1,
    gap: Spacing.xs,
  },
  webview: {
    flex: 1,
    backgroundColor: Brand.bg,
  },
});
