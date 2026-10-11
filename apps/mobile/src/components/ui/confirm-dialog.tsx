import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Brand, Radius, Spacing } from '@/constants/theme';

type ConfirmDialogProps = {
  visible: boolean;
  title: string;
  message: string;
  /** 확인(실행) 버튼 라벨 — 동작을 그대로 쓴다 (예: "Yes, cancel") */
  confirmLabel: string;
  /** 되돌아가기 버튼 라벨 */
  dismissLabel: string;
  /** 파괴적 동작이면 확인 버튼을 danger로 */
  destructive?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onDismiss: () => void;
};

/** 되돌릴 수 없는 동작 앞에 세우는 확인 모달 (취소/삭제/로그아웃 등 공용) */
export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel,
  dismissLabel,
  destructive = false,
  loading = false,
  onConfirm,
  onDismiss,
}: ConfirmDialogProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}>
      <Pressable style={styles.backdrop} onPress={loading ? undefined : onDismiss}>
        {/* 카드 내부 탭이 backdrop의 onPress로 전파되지 않게 막는다 */}
        <Pressable style={styles.card} onPress={() => {}}>
          <ThemedText type="heading">{title}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {message}
          </ThemedText>
          <View style={styles.actions}>
            <Button
              label={dismissLabel}
              variant="outline"
              disabled={loading}
              style={styles.action}
              onPress={onDismiss}
            />
            <Button
              label={confirmLabel}
              variant={destructive ? 'danger' : 'primary'}
              loading={loading}
              style={styles.action}
              onPress={onConfirm}
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(4, 6, 18, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: Brand.surface,
    borderWidth: 1,
    borderColor: Brand.border,
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    gap: Spacing.sm,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  action: {
    flex: 1,
  },
});
