import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const TOKEN_KEY = 'lunote.pushToken';
const PROMPT_KEY = 'lunote.pushPromptShown';
const OPTED_OUT_KEY = 'lunote.pushOptedOut';

// 웹은 SecureStore가 없다 — 푸시 자체가 없으니 항상 빈 값
const read = (key: string) =>
  Platform.OS === 'web' ? Promise.resolve(null) : SecureStore.getItemAsync(key);
const write = (key: string, value: string) =>
  Platform.OS === 'web' ? Promise.resolve() : SecureStore.setItemAsync(key, value);
const remove = (key: string) =>
  Platform.OS === 'web' ? Promise.resolve() : SecureStore.deleteItemAsync(key);

/**
 * 서버에 등록한 Expo 토큰(로그아웃 때 해제용), "권한 안내를 이미 보여줬다" 플래그,
 * "설정에서 푸시를 껐다" 플래그(로그인·앱 시작의 조용한 재등록 차단 — 계정이 아니라 기기 기준)
 */
export const pushStorage = {
  getToken: () => read(TOKEN_KEY),
  setToken: (token: string) => write(TOKEN_KEY, token),
  clearToken: () => remove(TOKEN_KEY),
  getPromptShown: async () => (await read(PROMPT_KEY)) === '1',
  setPromptShown: () => write(PROMPT_KEY, '1'),
  getOptedOut: async (): Promise<boolean> => (await read(OPTED_OUT_KEY)) === '1',
  setOptedOut: () => write(OPTED_OUT_KEY, '1'),
  clearOptedOut: () => remove(OPTED_OUT_KEY),
};
