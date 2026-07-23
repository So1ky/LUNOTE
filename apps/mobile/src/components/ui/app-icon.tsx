import Ionicons from '@expo/vector-icons/Ionicons';
import { SymbolView } from 'expo-symbols';
import { Platform } from 'react-native';

/**
 * 크로스플랫폼 아이콘 — iOS는 SF Symbol, Android/웹은 Ionicons.
 * iOS/Android 동시 배포를 위해 두 매핑을 항상 쌍으로 등록한다.
 */
const ICONS = {
  bell: { sf: 'bell', ion: 'notifications-outline' },
  bellBadge: { sf: 'bell.badge', ion: 'notifications' },
  camera: { sf: 'camera.fill', ion: 'camera' },
} as const;

export type AppIconName = keyof typeof ICONS;

type AppIconProps = {
  name: AppIconName;
  size: number;
  color: string;
};

export function AppIcon({ name, size, color }: AppIconProps) {
  const icon = ICONS[name];
  const ionicon = <Ionicons name={icon.ion} size={size} color={color} />;

  if (Platform.OS === 'ios') {
    return (
      <SymbolView name={icon.sf} size={size} tintColor={color} fallback={ionicon} />
    );
  }
  return ionicon;
}
