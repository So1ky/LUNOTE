import { FlatList, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Badge, type BadgeTone } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Brand, BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';

// TODO: 결제 대기/완료 견적 API 연동 후 교체
const MOCK_PAYMENTS: {
  id: string;
  category: string;
  date: string;
  amount: string;
  tone: BadgeTone;
  payable: boolean;
}[] = [
  { id: '2', category: 'Visa', date: 'Jul 1, 2026', amount: '$300', tone: 'quoted', payable: true },
  { id: '1', category: 'Hospital', date: 'Jun 28, 2026', amount: '$120', tone: 'paid', payable: false },
];

export default function PaymentScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={MOCK_PAYMENTS}
        keyExtractor={(item) => item.id}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.header}>
            <ThemedText type="subtitle">Payments</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Review quotes and complete payments
            </ThemedText>
          </View>
        }
        renderItem={({ item }) => (
          <Card style={styles.row}>
            <View style={styles.rowTop}>
              <View style={styles.rowText}>
                <ThemedText type="default">
                  #{item.id} · {item.category}
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {item.date}
                </ThemedText>
              </View>
              <ThemedText type="subtitle" style={styles.amount}>
                {item.amount}
              </ThemedText>
            </View>
            <View style={styles.rowBottom}>
              <Badge tone={item.tone} />
              {/* TODO: PortOne 결제 화면 연동 */}
              {item.payable && <Button label="Pay now" onPress={() => {}} />}
            </View>
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
    gap: Spacing.three,
  },
  rowTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  rowText: {
    gap: 2,
  },
  amount: {
    fontSize: 22,
    lineHeight: 30,
  },
  rowBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
});
