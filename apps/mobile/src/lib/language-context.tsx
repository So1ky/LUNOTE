import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { languageStorage } from './language-storage';
import type { LanguageCode } from './languages';

type LanguageState = {
  /** 저장된 로컬 언어 복원이 끝나면 true — 그 전엔 스플래시를 유지한다 */
  ready: boolean;
  /** 기기에 저장된 언어 — 프로필 언어가 없을 때(게스트)의 소스 */
  localLanguage: LanguageCode | null;
  /** 로컬 언어 변경 + 영속화. 저장 실패해도 메모리 상태는 유지된다. */
  setLocalLanguage: (code: LanguageCode) => Promise<void>;
};

const LanguageContext = createContext<LanguageState | null>(null);

/**
 * 앱 표시 언어의 로컬(기기) 절반을 담당하는 프로바이더.
 * 서버 프로필 언어와의 병합은 i18n의 useTranslation이 한다:
 * profile.language → localLanguage → 'en'.
 */
export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [localLanguage, setLocal] = useState<LanguageCode | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        setLocal(await languageStorage.get());
      } finally {
        setReady(true); // 저장소 오류여도 앱은 영어 폴백으로 계속 진행
      }
    })();
  }, []);

  const setLocalLanguage = useCallback(async (code: LanguageCode) => {
    setLocal(code); // 낙관적 반영 — 화면 언어가 즉시 바뀐다
    try {
      await languageStorage.set(code);
    } catch {
      // 영속화 실패는 다음 실행에서 다시 물어보는 것으로 수렴 — 세션 내 표시는 유지
    }
  }, []);

  const value = useMemo(
    () => ({ ready, localLanguage, setLocalLanguage }),
    [ready, localLanguage, setLocalLanguage],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}
