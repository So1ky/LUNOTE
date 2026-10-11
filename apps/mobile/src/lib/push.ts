import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { api } from './api';
import { pushStorage } from './push-storage';

/**
 * OS 푸시 — Expo Push Service. 토큰을 서버에 두는 것이 곧 opt-in (ARCHITECTURE §11).
 * 시뮬레이터·웹·Expo Go에서는 모든 함수가 no-op('unsupported').
 */
export type PushPermission = 'granted' | 'denied' | 'undetermined';

const supported = () => Platform.OS !== 'web' && Device.isDevice;

// 포그라운드에서도 배너로 보여준다 (소리·뱃지는 없음)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export async function getPushPermission(): Promise<PushPermission> {
  if (!supported()) return 'denied';
  const { status, canAskAgain } = await Notifications.getPermissionsAsync();
  if (status === 'granted') return 'granted';
  // iOS는 한 번 거절하면 앱에서 다시 물을 수 없다 → 'denied'로 취급해 OS 설정으로 안내
  return status === 'denied' || !canAskAgain ? 'denied' : 'undetermined';
}

/** 서버에 토큰이 등록돼 있다고 기억하는지 (설정 토글 표시용) */
export async function isPushRegistered(): Promise<boolean> {
  return (await pushStorage.getToken()) !== null;
}

/** 권한을 묻고(필요 시) Expo 토큰을 발급해 서버에 등록한다 */
export async function registerPush(authToken: string): Promise<'registered' | 'denied' | 'unsupported'> {
  if (!supported()) return 'unsupported';
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
    });
  }
  let permission = await getPushPermission();
  if (permission === 'undetermined') {
    const { status } = await Notifications.requestPermissionsAsync();
    permission = status === 'granted' ? 'granted' : 'denied';
  }
  if (permission !== 'granted') return 'denied';

  const projectId = Constants.expoConfig?.extra?.eas?.projectId as string | undefined;
  const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
  await api('/users/me/push-token', {
    method: 'PUT',
    body: { token, platform: Platform.OS === 'ios' ? 'IOS' : 'ANDROID' },
    token: authToken,
  });
  await pushStorage.setToken(token);
  // 사용자가 다시 켰다(또는 허용했다) — 조용한 재등록 차단 해제
  await pushStorage.clearOptedOut();
  return 'registered';
}

/**
 * 서버 등록 해제.
 * - 기본(로그아웃): 서버 실패는 삼키고 로컬은 지운다 — 로그아웃은 막지 않는다
 * - strict(설정 끔): 서버 실패를 그대로 던지고 로컬 토큰을 남긴다 — 토글이 되돌아가 실패가 보이게
 */
export async function unregisterPush(
  authToken: string | null,
  opts: { strict?: boolean } = {},
): Promise<void> {
  const token = await pushStorage.getToken();
  if (!token) return;
  if (authToken) {
    const request = api('/users/me/push-token', {
      method: 'DELETE',
      body: { token },
      token: authToken,
    });
    if (opts.strict) await request;
    else await request.catch(() => {});
  }
  await pushStorage.clearToken();
}

/** 설정에서 끔 — 기기 플래그를 먼저 남겨 재시작·재로그인 때 조용히 다시 켜지지 않게 한다 */
export async function optOutPush(authToken: string | null): Promise<void> {
  await pushStorage.setOptedOut();
  await unregisterPush(authToken, { strict: true });
}
