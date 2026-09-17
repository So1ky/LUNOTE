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
  arrowRight: { sf: 'arrow.right', ion: 'arrow-forward' },
  // 문의 카테고리 (CATEGORY_META가 참조)
  housing: { sf: 'house', ion: 'home-outline' },
  visa: { sf: 'person.text.rectangle', ion: 'id-card-outline' },
  hospital: { sf: 'cross.case', ion: 'medkit-outline' },
  bank: { sf: 'building.columns', ion: 'business-outline' },
  telecom: { sf: 'iphone', ion: 'phone-portrait-outline' },
  other: { sf: 'sparkles', ion: 'sparkles-outline' },
  // 첨부
  photo: { sf: 'photo', ion: 'image-outline' },
  document: { sf: 'doc.text', ion: 'document-text-outline' },
  // 연락수단
  email: { sf: 'envelope', ion: 'mail-outline' },
  phone: { sf: 'phone', ion: 'call-outline' },
  chat: { sf: 'message', ion: 'chatbubble-ellipses-outline' },
  // 빈 상태·인증 히어로
  clipboard: { sf: 'list.clipboard', ion: 'clipboard-outline' },
  card: { sf: 'creditcard', ion: 'card-outline' },
  bellOff: { sf: 'bell.slash', ion: 'notifications-off-outline' },
  lock: { sf: 'lock', ion: 'lock-closed-outline' },
  key: { sf: 'key', ion: 'key-outline' },
  checkCircle: { sf: 'checkmark.circle', ion: 'checkmark-circle-outline' },
  mailUnread: { sf: 'envelope.badge', ion: 'mail-unread-outline' },
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
