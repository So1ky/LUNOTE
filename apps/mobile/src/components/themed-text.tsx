import { Platform, StyleSheet, Text, type TextProps, type TextStyle } from 'react-native';

import { Brand, Fonts, Type, ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type TextType = keyof typeof Type | 'link' | 'code';

export type ThemedTextProps = TextProps & {
  type?: TextType;
  themeColor?: ThemeColor;
};

export function ThemedText({ style, type = 'body', themeColor, ...rest }: ThemedTextProps) {
  const theme = useTheme();

  return (
    <Text
      style={[
        { color: theme[themeColor ?? 'text'] },
        type === 'link' ? styles.link : type === 'code' ? styles.code : (Type[type] as TextStyle),
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  link: {
    ...(Type.smallStrong as TextStyle),
    color: Brand.purple,
  },
  code: {
    fontFamily: Fonts.mono,
    fontWeight: Platform.select({ android: '700' }) ?? '500',
    fontSize: 12,
    lineHeight: 16,
  },
});
