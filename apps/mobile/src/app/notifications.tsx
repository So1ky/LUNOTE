import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { Brand, MaxContentWidth, Spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth-context';
import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type AppNotification,
} from '@/lib/notifications';
import { formatDate } from '@/lib/quote-requests';

export default function NotificationsScreen() {
  const router = useRouter();
  const { token } = useAuth();
  const [items, setItems] = useState<AppNotification[] | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      const data = await listNotifications(token);
      setItems(data.items);
      setUnreadCount(data.unreadCount);
    } catch {
      setItems([]);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const onPressItem = async (n: AppNotification) => {
    if (!token) return;
    if (!n.readAt) {
      void markNotificationRead(token, n.id).then(() => void load());
    }
    if (n.requestId) {
      router.push(`/request/${n.requestId}`);
    }
  };

  const onReadAll = async () => {
    if (!token) return;
    await markAllNotificationsRead(token);
    await load();
  };

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={items ?? []}
        keyExtractor={(item) => item.id}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.headerTop}>
              <Pressable onPress={() => router.back()} hitSlop={12}>
                <ThemedText type="subtitle">‹</ThemedText>
              </Pressable>
              <ThemedText type="subtitle">Notifications</ThemedText>
            </View>
            {unreadCount > 0 && (
              <Pressable onPress={() => void onReadAll()}>
                <ThemedText type="small" style={{ color: Brand.purple }}>
                  Mark all as read ({unreadCount})
                </ThemedText>
              </Pressable>
            )}
          </View>
        }
        ListEmptyComponent={
          items === null ? (
            <ActivityIndicator color={Brand.purple} style={styles.empty} />
          ) : (
            <View style={styles.empty}>
              <ThemedText type="default" themeColor="textSecondary">
                No notifications yet.
              </ThemedText>
            </View>
          )
        }
        renderItem={({ item }) => (
          <Card
            style={{
              ...styles.row,
              ...(item.readAt ? {} : styles.unread),
            }}
            onPress={() => void onPressItem(item)}>
            <View style={styles.rowText}>
              <ThemedText type="default">{item.title}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {item.body}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {formatDate(item.createdAt)}
              </ThemedText>
            </View>
            {!item.readAt && <View style={styles.dot} />}
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
    gap: Spacing.three,
  },
  header: {
    gap: Spacing.two,
    marginBottom: Spacing.two,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: Spacing.six,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  unread: {
    borderColor: Brand.purple,
  },
  rowText: {
    gap: 2,
    flex: 1,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Brand.purple,
  },
});
