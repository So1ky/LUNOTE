import { ActivityIndicator, Pressable, StyleSheet, type PressableProps, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Brand, Radius, Spacing } from '@/constants/theme';

type ButtonProps = Omit<PressableProps, 'style'> & {
  label: string;
  variant?: 'primary' | 'outline' | 'ghost' | 'danger';
  size?: 'md' | 'lg';
  loading?: boolean;
  style?: ViewStyle;
};

export function Button({
  label,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  style,
  ...rest
}: ButtonProps) {
  const textColor =
    variant === 'primary' ? Brand.text : variant === 'danger' ? Brand.danger : Brand.text;

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        size === 'lg' && styles.lg,
        variant === 'primary' && { backgroundColor: pressed ? Brand.purplePressed : Brand.purple },
        variant === 'outline' && [styles.outline, pressed && styles.outlinePressed],
        variant === 'ghost' && pressed && styles.ghostPressed,
        variant === 'danger' && [styles.outline, pressed && styles.dangerPressed],
        (disabled || loading) && styles.disabled,
        style,
      ]}
      {...rest}>
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <ThemedText type="smallBold" style={{ color: textColor }}>
          {label}
        </ThemedText>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.md,
    paddingVertical: Spacing.three - 2,
    paddingHorizontal: Spacing.four,
    minHeight: 48,
  },
  lg: {
    minHeight: 56,
  },
  outline: {
    borderWidth: 1,
    borderColor: Brand.border,
    backgroundColor: Brand.surface,
  },
  outlinePressed: {
    backgroundColor: Brand.surfaceAlt,
  },
  ghostPressed: {
    backgroundColor: Brand.surface,
  },
  dangerPressed: {
    backgroundColor: 'rgba(248, 113, 113, 0.1)',
  },
  disabled: {
    opacity: 0.5,
  },
});
