import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { Brand, Radius, Spacing } from '@/constants/theme';

type ScreenHeaderProps = {
  title: string;
  subtitle?: string;
  /** true면 뒤로가기 버튼 표시 (router.back) */
  back?: boolean;
  /** 우측 액세서리 (알림 벨 등) */
  right?: ReactNode;
};

/** 화면 제목 헤더. 뒤로가기·부제·우측 액세서리를 한 가지 규격으로 통일한다. */
export function ScreenHeader({ title, subtitle, back = false, right }: ScreenHeaderProps) {
  const router = useRouter();

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        {back && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back"
            hitSlop={8}
            onPress={() => router.back()}
            style={({ pressed }) => [styles.back, pressed && styles.backPressed]}>
            <ThemedText type="heading" style={styles.backChevron}>
              ‹
            </ThemedText>
          </Pressable>
        )}
        <ThemedText type="title" style={styles.title} numberOfLines={1}>
          {title}
        </ThemedText>
        {right}
      </View>
      {subtitle && (
        <ThemedText type="small" themeColor="textSecondary">
          {subtitle}
        </ThemedText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: Spacing.xxs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  back: {
    width: 36,
    height: 36,
    borderRadius: Radius.full,
    backgroundColor: Brand.surface,
    borderWidth: 1,
    borderColor: Brand.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backPressed: {
    backgroundColor: Brand.surfaceAlt,
  },
  backChevron: {
    // 글리프 시각 보정 — 원 안에서 좌측으로 치우쳐 보이는 것을 막는다
    marginTop: -2,
  },
  title: {
    flex: 1,
  },
});
