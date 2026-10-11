import { NativeTabs } from 'expo-router/unstable-native-tabs';

import { Brand, Colors } from '@/constants/theme';
import { useTranslation } from '@/i18n';

export default function AppTabs() {
  const { t } = useTranslation();
  const colors = Colors.dark;

  return (
    <NativeTabs
      backgroundColor={colors.background}
      indicatorColor={colors.backgroundElement}
      iconColor={{ selected: Brand.purple }}
      labelStyle={{ selected: { color: Brand.purple } }}
      // Android: 선택 안 된 탭에도 라벨 상시 표시 — 아이콘만으로는 구분이 어렵다는 피드백
      labelVisibilityMode="labeled">
      <NativeTabs.Trigger name="home">
        <NativeTabs.Trigger.Label>{t('tabs.home')}</NativeTabs.Trigger.Label>
        {/* sf = iOS(SF Symbols), md = Android(Material Symbols — expo-symbols 번들 폰트) */}
        <NativeTabs.Trigger.Icon sf={{ default: 'house', selected: 'house.fill' }} md="home" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="quote">
        <NativeTabs.Trigger.Label>{t('tabs.quote')}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: 'doc.text', selected: 'doc.text.fill' }}
          md="description"
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="payment">
        <NativeTabs.Trigger.Label>{t('tabs.payment')}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: 'creditcard', selected: 'creditcard.fill' }}
          md="credit_card"
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="profile">
        <NativeTabs.Trigger.Label>{t('tabs.profile')}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: 'person', selected: 'person.fill' }}
          md="person"
        />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
