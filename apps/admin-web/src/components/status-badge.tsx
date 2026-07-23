import { STATUS_META, type RequestStatus } from '../lib/types';

/** 주문 상태 배지 — 모바일 Badge와 동일한 톤 매핑 */
export function StatusBadge({ status }: { status: RequestStatus }) {
  const meta = STATUS_META[status];
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        border: `1px solid ${meta.color}`,
        color: meta.color,
        borderRadius: 999,
        padding: '2px 10px',
        fontSize: 12,
        fontWeight: 600,
        whiteSpace: 'nowrap',
      }}>
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: 3,
          background: meta.color,
        }}
      />
      {meta.label}
    </span>
  );
}
