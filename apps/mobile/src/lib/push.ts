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
  return 'registered';
}

/** 서버 등록 해제 — 로그아웃·설정 끔. 서버 실패는 삼키고 로컬은 지운다 */
export async function unregisterPush(authToken: string | null): Promise<void> {
  const token = await pushStorage.getToken();
  if (!token) return;
  if (authToken) {
    await api('/users/me/push-token', {
      method: 'DELETE',
      body: { token },
      token: authToken,
    }).catch(() => {});
  }
  await pushStorage.clearToken();
}
