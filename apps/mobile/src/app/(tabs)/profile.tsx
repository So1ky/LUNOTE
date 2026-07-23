import * as ImagePicker from 'expo-image-picker';
import { useRouter, type Href } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, View } from 'react-native';
import { SymbolView } from 'expo-symbols';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Screen } from '@/components/ui/screen';
import { Brand, Radius, Spacing } from '@/constants/theme';
import { uploadAttachment } from '@/lib/attachments';
import { useAuth } from '@/lib/auth-context';
import { languageLabel } from '@/lib/languages';

export default function ProfileScreen() {
  const router = useRouter();
  const { token, profile, signOut, updateProfile } = useAuth();
  const [confirmingLogout, setConfirmingLogout] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  if (!token) {
    return (
      <Screen center narrow tabInset>
        <View style={styles.guest}>
          <ThemedText type="title">Welcome to LUNOTE</ThemedText>
          <ThemedText type="small" themeColor="textSecondary" style={styles.guestText}>
            Log in to manage your requests, quotes and payments.
          </ThemedText>
          <Button label="Log in" size="lg" onPress={() => router.push('/login')} />
          <Button
            label="Create account"
            variant="outline"
            onPress={() => router.push('/signup')}
          />
        </View>
      </Screen>
    );
  }

  const displayName = profile?.name || profile?.email.split('@')[0] || 'Guest';
  const initial = displayName.charAt(0).toUpperCase();

  const menu: { key: string; label: string; value?: string; href: Href }[] = [
    { key: 'account', label: 'Account details', href: '/account' },
    {
      key: 'language',
      label: 'Language',
      value: languageLabel(profile?.language ?? null),
      href: '/language',
    },
    {
      key: 'notifications',
      label: 'Notifications',
      value: profile?.quoteEmailEnabled ? 'On' : 'Off',
      href: '/notification-settings',
    },
    { key: 'support', label: 'Support', href: '/support' },
  ];

  const onChangeAvatar = async () => {
    if (!token) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (result.canceled) return;

    setUploadingAvatar(true);
    try {
      const asset = result.assets[0];
      const uploaded = await uploadAttachment(token, {
        uri: asset.uri,
        fileName: asset.fileName ?? 'avatar.jpg',
        mimeType: asset.mimeType ?? 'image/jpeg',
      });
      await updateProfile({ avatarS3Key: uploaded.s3Key });
    } catch {
      // 업로드 실패는 치명적이지 않다 — 기존 아바타 유지
    } finally {
      setUploadingAvatar(false);
    }
  };

  const onLogout = async () => {
    setLoggingOut(true);
    await signOut();
    router.replace('/login');
  };

  return (
    <Screen tabInset>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Change profile photo"
          onPress={() => void onChangeAvatar()}
          style={styles.avatarWrap}>
          {profile?.avatarUrl ? (
            <Image source={{ uri: profile.avatarUrl }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatar}>
              <ThemedText type="heading">{initial}</ThemedText>
            </View>
          )}
          <View style={styles.avatarBadge}>
            {uploadingAvatar ? (
              <ActivityIndicator size="small" color={Brand.text} />
            ) : (
              <SymbolView
                name="camera.fill"
                size={12}
                tintColor={Brand.text}
                fallback={<ThemedText style={styles.avatarBadgeFallback}>+</ThemedText>}
              />
            )}
          </View>
        </Pressable>
        <View style={styles.headerText}>
          <ThemedText type="bodyStrong">{displayName}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {profile?.email ?? ''}
          </ThemedText>
        </View>
      </View>

      <Card style={styles.menuCard}>
        {menu.map((item, i) => (
          <View key={item.key}>
            {i > 0 && <View style={styles.menuDivider} />}
            <Pressable
              accessibilityRole="button"
              style={({ pressed }) => [styles.menuRow, pressed && styles.menuRowPressed]}
              onPress={() => router.push(item.href)}>
              <ThemedText type="body">{item.label}</ThemedText>
              <View style={styles.menuRight}>
                {item.value && (
                  <ThemedText type="small" themeColor="textSecondary">
                    {item.value}
                  </ThemedText>
                )}
                <ThemedText type="body" themeColor="textSecondary">
                  ›
                </ThemedText>
              </View>
            </Pressable>
          </View>
        ))}
      </Card>

      <Button
        label="Log out"
        variant="danger"
        onPress={() => setConfirmingLogout(true)}
      />

      <ConfirmDialog
        visible={confirmingLogout}
        title="Log out of LUNOTE?"
        message="You can log back in anytime with your email and password."
        confirmLabel="Log out"
        dismissLabel="Stay"
        destructive
        loading={loggingOut}
        onConfirm={() => void onLogout()}
        onDismiss={() => setConfirmingLogout(false)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  guest: {
    gap: Spacing.sm,
  },
  guestText: {
    marginBottom: Spacing.xs,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  avatarWrap: {
    position: 'relative',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: Radius.full,
    backgroundColor: Brand.surfaceAlt,
    borderWidth: 1,
    borderColor: Brand.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: 56,
    height: 56,
    borderRadius: Radius.full,
    backgroundColor: Brand.surfaceAlt,
  },
  avatarBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 22,
    height: 22,
    borderRadius: Radius.full,
    backgroundColor: Brand.purple,
    borderWidth: 2,
    borderColor: Brand.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarBadgeFallback: {
    fontSize: 12,
    lineHeight: 14,
    fontWeight: '700',
  },
  headerText: {
    gap: 2,
  },
  menuCard: {
    paddingVertical: Spacing.xxs,
    paddingHorizontal: Spacing.lg,
  },
  menuDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Brand.border,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
  },
  menuRowPressed: {
    opacity: 0.6,
  },
  menuRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
});
