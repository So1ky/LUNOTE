import { FlatList, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Brand, BottomTabInset, Spacing } from '@/constants/theme';

// TODO: GET /payments(결제 대기 견적) API 연동 후 교체
const MOCK_PAYMENTS = [
  { id: '2', date: '2026.7.1' },
  { id: '1', date: '2026.6.28' },
];

export default function PaymentScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ThemedText type="subtitle" style={styles.heading}>
        Payment
      </ThemedText>
      <FlatList
        data={MOCK_PAYMENTS}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <Pressable style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
            <ThemedText type="default" style={styles.rowText}>
              #{item.id} {item.date}
            </ThemedText>
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Brand.navy,
  },
  heading: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
  },
  list: {
    padding: Spacing.four,
    gap: Spacing.three,
    paddingBottom: BottomTabInset + Spacing.three,
  },
  row: {
    backgroundColor: Brand.field,
    borderRadius: Spacing.two,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.three,
  },
  rowText: {
    color: Brand.fieldText,
  },
  pressed: {
    opacity: 0.8,
  },
});
