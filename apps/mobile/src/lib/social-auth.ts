import * as AppleAuthentication from 'expo-apple-authentication';
import {
  GoogleSignin,
  isErrorWithCode,
  isSuccessResponse,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import { Platform } from 'react-native';

/**
 * 소셜 SDK 래퍼 — 화면은 토큰만 받는다. 사용자가 취소하면 null(에러 아님).
 * 네이티브 모듈이라 개발 빌드에서만 동작한다 (Expo Go 불가).
 */

let googleConfigured = false;

function configureGoogle() {
  if (googleConfigured) return;
  GoogleSignin.configure({
    // ID 토큰의 aud — 서버 GOOGLE_WEB_CLIENT_ID와 같아야 한다
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
  });
  googleConfigured = true;
}

/** Google ID 토큰. 매번 계정 선택창을 띄우도록 받은 직후 SDK 세션을 지운다 (재인증 시 다른 계정 선택 가능) */
export async function getGoogleIdToken(): Promise<string | null> {
  configureGoogle();
  await GoogleSignin.hasPlayServices(); // Android: Play 서비스 없으면 throw
  try {
    const res = await GoogleSignin.signIn();
    if (!isSuccessResponse(res)) return null; // 사용자가 취소
    if (!res.data.idToken) throw new Error('Google sign-in returned no ID token');
    return res.data.idToken;
  } catch (e) {
    if (isErrorWithCode(e) && e.code === statusCodes.IN_PROGRESS) return null;
    throw e;
  } finally {
    void GoogleSignin.signOut().catch(() => {});
  }
}

/** Apple 로그인은 iOS에서만 노출한다 (ARCHITECTURE §11 소셜 로그인) */
export function isAppleSignInSupported(): Promise<boolean> {
  return Platform.OS === 'ios'
    ? AppleAuthentication.isAvailableAsync()
    : Promise.resolve(false);
}

export type AppleCredential = {
  identityToken: string;
  /** 탈퇴 시 서버가 Apple 연결 해제(revoke)에 쓴다 — 5분·1회용 */
  authorizationCode: string;
  /** 최초 로그인 때만 온다 */
  firstName?: string;
  lastName?: string;
};

export async function getAppleCredential(): Promise<AppleCredential | null> {
  try {
    const c = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });
    if (!c.identityToken || !c.authorizationCode) {
      throw new Error('Apple sign-in returned no token');
    }
    return {
      identityToken: c.identityToken,
      authorizationCode: c.authorizationCode,
      firstName: c.fullName?.givenName ?? undefined,
      lastName: c.fullName?.familyName ?? undefined,
    };
  } catch (e) {
    if ((e as { code?: string }).code === 'ERR_REQUEST_CANCELED') return null;
    throw e;
  }
}
