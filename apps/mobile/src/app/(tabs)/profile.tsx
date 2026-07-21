import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Brand, BottomTabInset, Spacing } from '@/constants/theme';

export default function ProfileScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <ThemedText type="subtitle">My Profile</ThemedText>
        {/* TODO: 프로필(국적, 언어, 연락 수단) 화면 — 와이어프레임 확정 후 구현 */}
        <ThemedText type="small" themeColor="textSecondary">
          프로필 화면은 준비 중입니다.
        </ThemedText>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Brand.navy,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
    paddingBottom: BottomTabInset,
  },
});
