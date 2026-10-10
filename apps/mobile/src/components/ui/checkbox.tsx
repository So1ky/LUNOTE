import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';

import { AppIcon } from '@/components/ui/app-icon';
import { Brand, Radius, Spacing } from '@/constants/theme';

type Props = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** 라벨 — 링크가 섞인 텍스트를 넣을 수 있도록 노드로 받는다 */
  children: ReactNode;
  accessibilityLabel: string;
  style?: ViewStyle;
};

/**
 * 동의 체크박스 (가입 약관·결제 청약철회 안내).
 * 박스만 토글한다 — 라벨 안의 링크 탭이 체크로 오인되지 않게 라벨은 Pressable 밖에 둔다.
 */
export function Checkbox({ checked, onChange, children, accessibilityLabel, style }: Props) {
  return (
    <View style={[styles.row, style]}>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked }}
        accessibilityLabel={accessibilityLabel}
        hitSlop={12}
        onPress={() => onChange(!checked)}
        style={({ pressed }) => [
          styles.box,
          checked && styles.boxChecked,
          pressed && styles.boxPressed,
        ]}>
        {checked && <AppIcon name="check" size={16} color={Brand.text} />}
      </Pressable>
      <View style={styles.label}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  box: {
    width: Spacing.xl,
    height: Spacing.xl,
    borderRadius: Radius.sm,
    borderWidth: 1.5,
    borderColor: Brand.border,
    backgroundColor: Brand.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxChecked: {
    borderColor: Brand.purple,
    backgroundColor: Brand.purple,
  },
  boxPressed: {
    opacity: 0.8,
  },
  label: {
    flex: 1,
  },
});
