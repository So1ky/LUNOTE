import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const ACCESS_KEY = 'lunote.accessToken';
const REFRESH_KEY = 'lunote.refreshToken';

/**
 * 토큰 저장소 — 액세스(30분) + 리프레시(30일) 쌍.
 * - 네이티브: expo-secure-store (iOS Keychain / Android Keystore)
 * - 웹: localStorage — SecureStore가 웹을 지원하지 않아서 개발 확인용으로만 사용.
 *   ⚠️ localStorage는 XSS에 노출되므로 웹을 정식 배포하게 되면 재설계 필요.
 */
const read = (key: string): Promise<string | null> => {
  if (Platform.OS === 'web') {
    return Promise.resolve(window.localStorage.getItem(key));
  }
  return SecureStore.getItemAsync(key);
};

const write = (key: string, value: string): Promise<void> => {
  if (Platform.OS === 'web') {
    window.localStorage.setItem(key, value);
    return Promise.resolve();
  }
  return SecureStore.setItemAsync(key, value);
};

const remove = (key: string): Promise<void> => {
  if (Platform.OS === 'web') {
    window.localStorage.removeItem(key);
    return Promise.resolve();
  }
  return SecureStore.deleteItemAsync(key);
};

export const tokenStorage = {
  get: () => read(ACCESS_KEY),
  getRefresh: () => read(REFRESH_KEY),
  async setPair(accessToken: string, refreshToken: string) {
    await write(ACCESS_KEY, accessToken);
    await write(REFRESH_KEY, refreshToken);
  },
  async clear() {
    await remove(ACCESS_KEY);
    await remove(REFRESH_KEY);
  },
};
