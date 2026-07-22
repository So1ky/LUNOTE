/**
 * LUNOTE 디자인 토큰의 단일 출처.
 * 화면/컴포넌트는 여기 정의된 스케일만 쓰고, fontSize·간격을 인라인으로 만들지 않는다.
 */

import '@/global.css';

import { Platform, type TextStyle } from 'react-native';

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
  info: '#60A5FA',
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

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

/**
 * 타이포 램프. 역할 기반 8단계 — 화면에서 fontSize를 직접 지정할 일이 없도록
 * 필요한 크기는 전부 여기서 나온다.
 */
export const Type = {
  /** 견적 금액, 로고 등 화면의 단 하나뿐인 큰 숫자/워드마크 */
  display: { fontSize: 40, lineHeight: 46, fontWeight: '800', letterSpacing: -0.5 },
  /** 화면 제목 (My Requests, Payments …) */
  title: { fontSize: 28, lineHeight: 34, fontWeight: '700', letterSpacing: -0.3 },
  /** 카드/CTA 제목 */
  heading: { fontSize: 20, lineHeight: 26, fontWeight: '600' },
  /** 본문 */
  body: { fontSize: 16, lineHeight: 24, fontWeight: '400' },
  /** 본문 강조 — 목록 행 제목 등 */
  bodyStrong: { fontSize: 16, lineHeight: 24, fontWeight: '600' },
  /** 보조 텍스트 */
  small: { fontSize: 14, lineHeight: 20, fontWeight: '400' },
  /** 보조 텍스트 강조 */
  smallStrong: { fontSize: 14, lineHeight: 20, fontWeight: '600' },
  /** 섹션 라벨 (대문자 + letterSpacing), 배지 텍스트 */
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '600', letterSpacing: 1 },
} as const satisfies Record<string, TextStyle>;

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 999,
} as const;

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

/** 4pt 그리드 간격 스케일. 보정(±2) 없이 이 단계만 조합한다. */
export const Spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

/** 화면 공통 레이아웃 상수 — Screen 컴포넌트가 소비한다 */
export const Layout = {
  /** 콘텐츠 좌우 여백 */
  screenPaddingX: Spacing.lg,
  /** 화면 상단(헤더 위) 여백 */
  screenPaddingTop: Spacing.xl,
  /** 섹션 사이 세로 리듬 */
  sectionGap: Spacing.xxl,
  maxContentWidth: 800,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = Layout.maxContentWidth;
