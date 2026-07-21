import { FlatList, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Brand, BottomTabInset, Spacing } from '@/constants/theme';

// TODO: GET /quotes API 연동 후 교체
const MOCK_QUOTES = [
  { id: '3', date: '2026.7.4' },
  { id: '2', date: '2026.7.1' },
  { id: '1', date: '2026.6.28' },
];

export default function QuoteScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ThemedText type="subtitle" style={styles.heading}>
        Quote
      </ThemedText>
      <FlatList
        data={MOCK_QUOTES}
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
