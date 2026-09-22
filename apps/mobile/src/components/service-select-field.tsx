import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Brand, Radius, Spacing } from '@/constants/theme';
import { useTranslation } from '@/i18n';
import type { Category } from '@/lib/quote-requests';
import {
  SERVICE_CATALOG,
  formatStartingPrice,
  type ServiceItemId,
} from '@/lib/service-catalog';

type ServiceSelectFieldProps = {
  label: string;
  placeholder: string;
  category: Category;
  value: ServiceItemId | null;
  onChange: (value: ServiceItemId) => void;
};

/**
 * 견적요청 전용 서비스 항목 선택 필드. SelectField와 같은 외형의 트리거를
 * 누르면 카테고리의 5개 항목(제목 + 시작가)이 펼쳐지고, 항목을 탭하면
 * 선택되면서 바로 아래에 서비스 설명이 열린 채 유지된다.
 */
export function ServiceSelectField({
  label,
  placeholder,
  category,
  value,
  onChange,
}: ServiceSelectFieldProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const items = SERVICE_CATALOG[category];
  const selected = items.find((item) => item.id === value);

  const priceLabel = (priceUsd: number | null) =>
    formatStartingPrice(priceUsd) ?? t('services.customQuote');

  return (
    <View style={styles.wrapper}>
      <ThemedText type="smallStrong" themeColor="textSecondary">
        {label}
      </ThemedText>

      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        style={({ pressed }) => [
          styles.trigger,
          (open || pressed) && styles.triggerActive,
        ]}
        onPress={() => setOpen((v) => !v)}>
        <ThemedText
          type="body"
          style={!selected && styles.placeholder}
          numberOfLines={1}>
          {selected
            ? `${t(`services.${selected.id}.title`)} · ${priceLabel(selected.startingPriceUsd)}`
            : placeholder}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {open ? '▴' : '▾'}
        </ThemedText>
      </Pressable>

      {open && (
        <View style={styles.menu}>
          {items.map((item, i) => {
            const isSelected = item.id === value;
            return (
              <View key={item.id} style={i > 0 && styles.optionDivider}>
                <Pressable
                  accessibilityRole="menuitem"
                  accessibilityState={{ selected: isSelected }}
                  onPress={() => onChange(item.id)}
                  style={({ pressed }) => [
                    styles.option,
                    pressed && styles.optionPressed,
                  ]}>
                  <ThemedText
                    type={isSelected ? 'bodyStrong' : 'body'}
                    style={styles.optionTitle}>
                    {`${i + 1}. ${t(`services.${item.id}.title`)}`}
                  </ThemedText>
                  <ThemedText
                    type="smallStrong"
                    style={isSelected ? styles.priceSelected : undefined}
                    themeColor={isSelected ? undefined : 'textSecondary'}>
                    {priceLabel(item.startingPriceUsd)}
                  </ThemedText>
                </Pressable>
                {isSelected && (
                  <ThemedText
                    type="small"
                    themeColor="textSecondary"
                    style={styles.description}>
                    {t(`services.${item.id}.desc`)}
                  </ThemedText>
                )}
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: Spacing.xs,
  },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
    backgroundColor: Brand.surface,
    borderWidth: 1,
    borderColor: Brand.border,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    minHeight: 48,
  },
  triggerActive: {
    borderColor: Brand.purple,
  },
  placeholder: {
    color: Brand.textMuted,
  },
  menu: {
    backgroundColor: Brand.surface,
    borderWidth: 1,
    borderColor: Brand.border,
    borderRadius: Radius.md,
    overflow: 'hidden',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    minHeight: 48,
  },
  optionTitle: {
    flexShrink: 1,
  },
  optionDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Brand.border,
  },
  optionPressed: {
    backgroundColor: Brand.surfaceAlt,
  },
  priceSelected: {
    color: Brand.purple,
  },
  description: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
  },
});
