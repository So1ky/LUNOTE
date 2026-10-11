import type { ReactNode } from 'react';

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  message: ReactNode;
  confirmLabel: string;
  dismissLabel: string;
  loading?: boolean;
  onConfirm: () => void;
  onDismiss: () => void;
};

/** 중요 동작(견적 발송/수정 등) 앞에 세우는 확인 모달 — 모바일 ConfirmDialog와 같은 규격 */
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  dismissLabel,
  loading = false,
  onConfirm,
  onDismiss,
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={loading ? undefined : onDismiss}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(4, 6, 18, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        zIndex: 100,
      }}>
      <div
        className="card"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 420,
          padding: 24,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}>
        <h2 style={{ margin: 0 }}>{title}</h2>
        <div className="muted" style={{ fontSize: 14 }}>
          {message}
        </div>
        {/* form 내부에서 쓰일 수 있으므로 반드시 type=button — 아니면 클릭이 폼을 재제출한다 */}
        <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
          <button
            type="button"
            className="ghost"
            style={{ flex: 1 }}
            disabled={loading}
            onClick={onDismiss}>
            {dismissLabel}
          </button>
          <button
            type="button"
            style={{ flex: 1 }}
            disabled={loading}
            onClick={onConfirm}>
            {loading ? 'Sending…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
