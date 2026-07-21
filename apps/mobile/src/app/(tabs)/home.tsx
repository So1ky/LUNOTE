import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Brand, BottomTabInset, Spacing } from '@/constants/theme';

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* TODO: 문의 등록 폼 화면(/quote-request) 연결 */}
        <Pressable style={({ pressed }) => [styles.requestButton, pressed && styles.pressed]}>
          <ThemedText type="subtitle">Request a Quote</ThemedText>
        </Pressable>
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
    paddingBottom: BottomTabInset,
    paddingHorizontal: Spacing.five,
  },
  requestButton: {
    backgroundColor: Brand.purple,
    borderRadius: Spacing.two,
    paddingVertical: Spacing.six,
    paddingHorizontal: Spacing.five,
    alignItems: 'center',
    alignSelf: 'stretch',
  },
  pressed: {
    opacity: 0.8,
  },
});
