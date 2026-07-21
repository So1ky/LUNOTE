import { Pressable, StyleSheet, View, type PressableProps, type ViewStyle } from 'react-native';

import { Brand, Radius, Spacing } from '@/constants/theme';

type CardProps = Omit<PressableProps, 'style'> & {
  children: React.ReactNode;
  style?: ViewStyle;
};

/** 서피스 카드. onPress가 있으면 눌림 피드백이 있는 Pressable로 동작한다. */
export function Card({ children, style, onPress, ...rest }: CardProps) {
  if (!onPress) {
    return <View style={[styles.card, style]}>{children}</View>;
  }
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed, style]}
      {...rest}>
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Brand.surface,
    borderWidth: 1,
    borderColor: Brand.border,
    borderRadius: Radius.lg,
    padding: Spacing.four,
  },
  pressed: {
    backgroundColor: Brand.surfaceAlt,
  },
});
