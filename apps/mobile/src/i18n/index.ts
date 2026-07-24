import { I18n, type TranslateOptions } from 'i18n-js';
import { useCallback } from 'react';

import { useAuth } from '@/lib/auth-context';
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
 * 기기 기본 언어 — 로그인 전(게스트)·언어 미설정 사용자의 폴백.
 * expo-localization은 네이티브 모듈이고, ExpoLocalization.native.js가 import 시점에
 * requireNativeModule('ExpoLocalization')을 즉시 실행한다. 그래서 이 모듈이 아직
 * 링크되지 않은 dev 빌드(설치 전 컴파일된 바이너리)에서는 정적 import만으로도 throw한다.
 * → 지연 require를 try/catch로 감싸 앱을 죽이지 않고 en으로 폴백한다.
 *   네이티브를 재빌드하면 자동으로 실제 기기 로케일을 읽는다.
 */
function detectDeviceLanguage(): string {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getLocales } = require('expo-localization') as typeof import('expo-localization');
    return getLocales()[0]?.languageCode ?? 'en';
  } catch {
    return 'en';
  }
}

const deviceLanguage = detectDeviceLanguage();

/**
 * 활성 로케일을 결정한다: 프로필 언어 → 기기 언어 → en.
 * 프로필이 React 상태라 언어 변경 시 이 훅을 쓴 화면들이 자동 리렌더된다.
 */
export function useTranslation() {
  const { profile } = useAuth();
  const locale = profile?.language ?? deviceLanguage ?? 'en';
  // locale에만 의존하는 안정 참조 — effect 의존성으로 쓸 수 있다
  const t = useCallback(
    (key: string, options?: TranslateOptions) => i18n.t(key, { locale, ...options }),
    [locale],
  );
  return { t, locale: locale as LanguageCode };
}

export type TFunction = ReturnType<typeof useTranslation>['t'];
