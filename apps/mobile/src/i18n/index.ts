import { I18n, type TranslateOptions } from 'i18n-js';
import { useCallback } from 'react';

import { useAuth } from '@/lib/auth-context';
import { useLanguage } from '@/lib/language-context';
import type { LanguageCode } from '@/lib/languages';

import de from './locales/de';
import en from './locales/en';
import es from './locales/es';
import ja from './locales/ja';
import ko from './locales/ko';
import zh from './locales/zh';

/**
 * en을 원본 구조로 삼아 값 타입만 string으로 넓힌 타입.
 * 각 로케일 파일이 이 타입을 만족해야 하므로 키 누락/오타가 컴파일에서 잡힌다.
 */
type Widen<T> = { [K in keyof T]: T[K] extends string ? string : Widen<T[K]> };
export type Resources = Widen<typeof en>;

const i18n = new I18n(
  { en, ko, ja, zh, es, de },
  { defaultLocale: 'en', enableFallback: true },
);

/**
 * 활성 로케일을 결정한다: 프로필 언어 → 기기 저장 언어(첫 실행 온보딩 선택) → en.
 * 기기 로케일 자동감지는 쓰지 않는다 — 기획 결정: 디폴트는 영어, 언어는 첫 실행
 * 온보딩(choose-language)에서 사용자가 명시적으로 고른다.
 * 두 소스 모두 React 상태라 언어 변경 시 이 훅을 쓴 화면들이 자동 리렌더된다.
 */
export function useTranslation() {
  const { profile } = useAuth();
  const { localLanguage } = useLanguage();
  const locale = profile?.language ?? localLanguage ?? 'en';
  // locale에만 의존하는 안정 참조 — effect 의존성으로 쓸 수 있다
  const t = useCallback(
    (key: string, options?: TranslateOptions) => i18n.t(key, { locale, ...options }),
    [locale],
  );
  return { t, locale: locale as LanguageCode };
}

export type TFunction = ReturnType<typeof useTranslation>['t'];
