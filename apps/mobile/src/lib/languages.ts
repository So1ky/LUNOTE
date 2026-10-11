/** 앱이 지원하는 언어 — 서버 UpdateMeDto의 SUPPORTED_LANGUAGES와 일치해야 한다 */
export const LANGUAGES = [
  { code: 'ko', label: '한국어' },
  { code: 'en', label: 'English' },
  { code: 'ja', label: '日本語' },
  { code: 'zh', label: '中文' },
  { code: 'es', label: 'Español' },
  { code: 'de', label: 'Deutsch' },
] as const;

export type LanguageCode = (typeof LANGUAGES)[number]['code'];

export const languageLabel = (code: string | null) =>
  LANGUAGES.find((l) => l.code === code)?.label ?? 'English';
