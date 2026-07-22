import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Brand, Radius, Spacing } from '@/constants/theme';

export type SelectOption<T extends string> = {
  value: T;
  label: string;
};

type SelectFieldProps<T extends string> = {
  label?: string;
  placeholder: string;
  value: T | null;
  options: SelectOption<T>[];
  onChange: (value: T) => void;
};

/**
 * 리스트박스 선택 필드. TextField와 같은 외형의 트리거를 누르면
 * 바로 아래에 옵션 목록이 펼쳐진다 (네이티브/웹 공통 동작).
 */
export function SelectField<T extends string>({
  label,
  placeholder,
  value,
  options,
  onChange,
}: SelectFieldProps<T>) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);

  return (
    <View style={styles.wrapper}>
      {label ? (
        <ThemedText type="smallStrong" themeColor="textSecondary">
          {label}
        </ThemedText>
      ) : null}

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
          {selected?.label ?? placeholder}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {open ? '▴' : '▾'}
        </ThemedText>
      </Pressable>

      {open && (
        <View style={styles.menu}>
          {options.map((o, i) => {
            const isSelected = o.value === value;
            return (
              <Pressable
                key={o.value}
                accessibilityRole="menuitem"
                onPress={() => {
                  onChange(o.value);
                  setOpen(false);
                }}
                style={({ pressed }) => [
                  styles.option,
                  i > 0 && styles.optionDivider,
                  pressed && styles.optionPressed,
                ]}>
                <ThemedText type={isSelected ? 'bodyStrong' : 'body'}>
                  {o.label}
                </ThemedText>
                {isSelected && <ThemedText style={styles.check}>✓</ThemedText>}
              </Pressable>
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
    minHeight: 48,
  },
  optionDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Brand.border,
  },
  optionPressed: {
    backgroundColor: Brand.surfaceAlt,
  },
  check: {
    color: Brand.purple,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '700',
  },
});
