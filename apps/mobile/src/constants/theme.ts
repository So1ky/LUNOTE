/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

/**
 * LUNOTE 브랜드 팔레트 — design/LUNOTE.png 와이어프레임의 네이비/퍼플 톤 기반.
 * 서피스는 bg → surface → surfaceAlt 3단계로 깊이를 표현한다.
 */
export const Brand = {
  bg: '#0F1430',
  surface: '#1A2148',
  surfaceAlt: '#242C5E',
  border: '#2A3468',
  purple: '#6C3DF4',
  purplePressed: '#5A2FD8',
  text: '#F4F5FB',
  textSecondary: '#A0A7C4',
  textMuted: '#6B7299',
  success: '#34D399',
  warning: '#FBBF24',
  danger: '#F87171',
} as const;

export const Colors = {
  light: {
    text: '#000000',
    background: '#ffffff',
    backgroundElement: '#F0F0F3',
    backgroundSelected: '#E0E1E6',
    textSecondary: '#60646C',
  },
  dark: {
    text: Brand.text,
    background: Brand.bg,
    backgroundElement: Brand.surface,
    backgroundSelected: Brand.surfaceAlt,
    textSecondary: Brand.textSecondary,
  },
} as const;

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
