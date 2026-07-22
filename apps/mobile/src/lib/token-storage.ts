import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const TOKEN_KEY = 'lunote.accessToken';

/**
 * 토큰 저장소.
 * - 네이티브: expo-secure-store (iOS Keychain / Android Keystore)
 * - 웹: localStorage — SecureStore가 웹을 지원하지 않아서 개발 확인용으로만 사용.
 *   ⚠️ localStorage는 XSS에 노출되므로 웹을 정식 배포하게 되면 재설계 필요.
 */
export const tokenStorage = {
  get(): Promise<string | null> {
    if (Platform.OS === 'web') {
      return Promise.resolve(window.localStorage.getItem(TOKEN_KEY));
    }
    return SecureStore.getItemAsync(TOKEN_KEY);
  },
  set(value: string): Promise<void> {
    if (Platform.OS === 'web') {
      window.localStorage.setItem(TOKEN_KEY, value);
      return Promise.resolve();
    }
    return SecureStore.setItemAsync(TOKEN_KEY, value);
  },
  delete(): Promise<void> {
    if (Platform.OS === 'web') {
      window.localStorage.removeItem(TOKEN_KEY);
      return Promise.resolve();
    }
    return SecureStore.deleteItemAsync(TOKEN_KEY);
  },
};
