import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import { LANGUAGES, type LanguageCode } from './languages';

const KEY = 'lunote.language';

/**
 * 기기 로컬 언어 저장소 — 게스트(비로그인)와 로그아웃 직후의 언어 폴백.
 * 로그인 사용자의 언어는 서버 프로필이 원천이고, 이 값은 프로필이 없을 때만 쓰인다.
 * 키-값 저장 하나 때문에 AsyncStorage를 새 네이티브 의존성으로 들이지 않고
 * 이미 링크된 expo-secure-store를 재사용한다 (웹은 localStorage).
 */
export const languageStorage = {
  async get(): Promise<LanguageCode | null> {
    const raw =
      Platform.OS === 'web'
        ? window.localStorage.getItem(KEY)
        : await SecureStore.getItemAsync(KEY);
    // 지원 목록에 없는 값(구버전 잔재 등)은 미설정으로 취급
    return LANGUAGES.some((l) => l.code === raw) ? (raw as LanguageCode) : null;
  },

  async set(code: LanguageCode): Promise<void> {
    if (Platform.OS === 'web') {
      window.localStorage.setItem(KEY, code);
      return;
    }
    await SecureStore.setItemAsync(KEY, code);
  },
};
