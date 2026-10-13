import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { Brand, Spacing } from '@/constants/theme';
import { useTranslation } from '@/i18n';
import type { BankTransferIntent } from '@/lib/payments';
import { formatAmount, formatDate } from '@/lib/quote-requests';

type Props = { intent: BankTransferIntent };

/** 계좌이체 안내 — 표시 전용. 복사는 selectable 텍스트(새 네이티브 모듈 없음) */
export function BankTransferCard({ intent }: Props) {
  const { t, locale } = useTranslation();
  const rows: [string, string, boolean][] = [
    [t('pay.bankTransfer.bank'), intent.bank.name, false],
    [t('pay.bankTransfer.accountNumber'), intent.bank.accountNumber, true],
    [t('pay.bankTransfer.holder'), intent.bank.holder, false],
    [t('pay.bankTransfer.depositorName'), intent.depositorName, true],
  ];
  return (
    <Card style={styles.card}>
      <ThemedText type="heading">{t('pay.bankTransfer.title')}</ThemedText>
      <ThemedText type="display" style={styles.amount}>
        {formatAmount(intent.amount, intent.currency, locale)}
      </ThemedText>
      {rows.map(([label, value, strong]) => (
        <View key={label} style={styles.row}>
          <ThemedText type="small" themeColor="textSecondary">
            {label}
          </ThemedText>
          <ThemedText type={strong ? 'bodyStrong' : 'body'} selectable style={styles.value}>
            {value}
          </ThemedText>
        </View>
      ))}
      <ThemedText type="small" themeColor="textSecondary">
        {t('pay.bankTransfer.depositorNote')}
      </ThemedText>
      <ThemedText type="smallStrong">{t('pay.bankTransfer.domesticOnly')}</ThemedText>
      <ThemedText type="smallStrong">
        {t('pay.bankTransfer.deadline', { date: formatDate(intent.deadline, locale) })}
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        {t('pay.bankTransfer.afterNote')} {t('pay.bankTransfer.copyHint')}
      </ThemedText>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: Spacing.sm, borderColor: Brand.purple },
  amount: { fontVariant: ['tabular-nums'] },
  row: { gap: Spacing.xxs },
  value: { fontVariant: ['tabular-nums'] },
});
