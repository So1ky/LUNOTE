import { FlatList, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Badge, type BadgeTone } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Brand, BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';

// TODO: GET /quotes API 연동 후 교체
const MOCK_QUOTES: { id: string; category: string; date: string; tone: BadgeTone }[] = [
  { id: '3', category: 'Housing', date: 'Jul 4, 2026', tone: 'reviewing' },
  { id: '2', category: 'Visa', date: 'Jul 1, 2026', tone: 'quoted' },
  { id: '1', category: 'Hospital', date: 'Jun 28, 2026', tone: 'completed' },
];

export default function QuoteScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={MOCK_QUOTES}
        keyExtractor={(item) => item.id}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.header}>
            <ThemedText type="subtitle">My Requests</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Track the status of your requests
            </ThemedText>
          </View>
        }
        renderItem={({ item }) => (
          <Card style={styles.row} onPress={() => {}}>
            <View style={styles.rowText}>
              <ThemedText type="default">
                #{item.id} · {item.category}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {item.date}
              </ThemedText>
            </View>
            <Badge tone={item.tone} />
          </Card>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Brand.bg,
    alignItems: 'center',
  },
  list: {
    width: '100%',
  },
  listContent: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    padding: Spacing.four,
    paddingTop: Spacing.five,
    gap: Spacing.three,
    paddingBottom: BottomTabInset + Spacing.four,
  },
  header: {
    gap: Spacing.one,
    marginBottom: Spacing.two,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  rowText: {
    gap: 2,
  },
});
