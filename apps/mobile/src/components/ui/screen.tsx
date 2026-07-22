import type { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BottomTabInset, Brand, Layout, Spacing } from '@/constants/theme';

type ScreenProps = {
  children: ReactNode;
  /** false면 자식(FlatList 등)이 스크롤을 담당한다 */
  scroll?: boolean;
  /** 키보드가 입력 폼을 가리는 화면(로그인 등)에서 켠다 */
  keyboard?: boolean;
  /** 콘텐츠 세로 중앙 정렬 (인증 화면) */
  center?: boolean;
  /** 좁은 단일 폼 폭 (인증 화면) */
  narrow?: boolean;
  /** 탭 바 위 화면이면 하단 여백 확보 */
  tabInset?: boolean;
};

/**
 * 모든 화면의 공통 스캐폴드: SafeArea + (스크롤) + 중앙 정렬 max-width 콘텐츠.
 * 화면별 레이아웃 보일러플레이트를 없애고 여백 리듬을 한곳에서 통제한다.
 */
export function Screen({
  children,
  scroll = true,
  keyboard = false,
  center = false,
  narrow = false,
  tabInset = false,
}: ScreenProps) {
  const body = scroll ? (
    <ScrollView
      contentContainerStyle={[
        styles.scroll,
        center && styles.center,
        tabInset && styles.tabInset,
      ]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}>
      <View style={[styles.content, narrow && styles.narrow]}>{children}</View>
    </ScrollView>
  ) : (
    children
  );

  return (
    <SafeAreaView style={styles.container}>
      {keyboard ? (
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          {body}
        </KeyboardAvoidingView>
      ) : (
        body
      )}
    </SafeAreaView>
  );
}

/** FlatList 화면(scroll=false)이 리스트에 그대로 넘겨 쓰는 공통 스타일 */
export const listStyles = StyleSheet.create({
  list: {
    width: '100%',
  },
  content: {
    width: '100%',
    maxWidth: Layout.maxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Layout.screenPaddingX,
    paddingTop: Layout.screenPaddingTop,
    paddingBottom: BottomTabInset + Spacing.xl,
    gap: Spacing.sm,
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Brand.bg,
  },
  flex: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    alignItems: 'center',
    paddingTop: Layout.screenPaddingTop,
    paddingBottom: Spacing.xxl,
  },
  center: {
    justifyContent: 'center',
    paddingVertical: Spacing.xxxl,
  },
  tabInset: {
    paddingBottom: BottomTabInset + Spacing.xl,
  },
  content: {
    width: '100%',
    maxWidth: Layout.maxContentWidth,
    paddingHorizontal: Layout.screenPaddingX,
    gap: Layout.sectionGap,
  },
  narrow: {
    maxWidth: Layout.maxContentWidth / 2,
    gap: Spacing.xl,
  },
});
