import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { listStyles, Screen } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { Brand, Radius, Spacing } from '@/constants/theme';
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
    <Screen scroll={false}>
      <FlatList
        data={items ?? []}
        keyExtractor={(item) => item.id}
        style={listStyles.list}
        contentContainerStyle={listStyles.content}
        ListHeaderComponent={
          <View style={styles.header}>
            <ScreenHeader back title="Notifications" />
            {unreadCount > 0 && (
              <Pressable onPress={() => void onReadAll()} style={styles.readAll}>
                <ThemedText type="link">Mark all as read ({unreadCount})</ThemedText>
              </Pressable>
            )}
          </View>
        }
        ListEmptyComponent={
          items === null ? (
            <ActivityIndicator color={Brand.purple} style={styles.loading} />
          ) : (
            <EmptyState emoji="🔕" message="No notifications yet." />
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
              <ThemedText type="bodyStrong">{item.title}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {item.body}
              </ThemedText>
              <ThemedText type="caption" themeColor="textSecondary" style={styles.date}>
                {formatDate(item.createdAt)}
              </ThemedText>
            </View>
            {!item.readAt && <View style={styles.dot} />}
          </Card>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  readAll: {
    alignSelf: 'flex-start',
  },
  loading: {
    paddingVertical: Spacing.xxxl,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  unread: {
    borderColor: Brand.purple,
  },
  rowText: {
    gap: 2,
    flex: 1,
  },
  date: {
    letterSpacing: 0,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: Radius.full,
    backgroundColor: Brand.purple,
  },
});
