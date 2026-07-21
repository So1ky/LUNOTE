import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Brand, BottomTabInset, MaxContentWidth, Radius, Spacing } from '@/constants/theme';

// TODO: GET /me API 연동 후 교체
const MENU = [
  { key: 'account', label: 'Account details' },
  { key: 'language', label: 'Language', value: 'English' },
  { key: 'notifications', label: 'Notifications' },
  { key: 'support', label: 'Support' },
];

export default function ProfileScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.avatar}>
              <ThemedText type="subtitle">G</ThemedText>
            </View>
            <View style={styles.headerText}>
              <ThemedText type="default">Guest</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                guest@lunote.app
              </ThemedText>
            </View>
          </View>

          <Card style={styles.menuCard}>
            {MENU.map((item, i) => (
              <View key={item.key}>
                {i > 0 && <View style={styles.menuDivider} />}
                <View style={styles.menuRow}>
                  <ThemedText type="default">{item.label}</ThemedText>
                  <View style={styles.menuRight}>
                    {item.value && (
                      <ThemedText type="small" themeColor="textSecondary">
                        {item.value}
                      </ThemedText>
                    )}
                    <ThemedText type="default" themeColor="textSecondary">
                      ›
                    </ThemedText>
                  </View>
                </View>
              </View>
            ))}
          </Card>

          <Button label="Log out" variant="danger" onPress={() => router.replace('/login')} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Brand.bg,
  },
  scroll: {
    flexGrow: 1,
    alignItems: 'center',
    paddingBottom: BottomTabInset + Spacing.four,
  },
  content: {
    width: '100%',
    maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.five,
    gap: Spacing.four,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: Radius.xl + 4,
    backgroundColor: Brand.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    gap: 2,
  },
  menuCard: {
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.four,
  },
  menuDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Brand.border,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.three,
  },
  menuRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
});
