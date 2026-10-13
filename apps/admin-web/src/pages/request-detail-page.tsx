import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';

import { ConfirmDialog } from '../components/confirm-dialog';
import { StatusBadge } from '../components/status-badge';
import { api, ApiError } from '../lib/api';
import {
  CATEGORY_META,
  CURRENCY_BY_METHOD,
  customerName,
  formatAmount,
  formatDate,
  PAYMENT_METHOD_LABELS,
  SERVICE_LABELS,
  STATUS_META,
  WORK_TRANSITIONS,
  type AdminQuoteRequestDetail,
} from '../lib/types';

export function RequestDetailPage() {
  const { id } = useParams<{ id: string }>();

  const [request, setRequest] = useState<AdminQuoteRequestDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 견적 폼 상태
  const [amount, setAmount] = useState('');
  const [explanation, setExplanation] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  /** 직전 제출 결과 메시지 — 제출 시점의 모드로 결정한다 (성공 후 상태가 바뀌므로) */
  const [sentMessage, setSentMessage] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  // 계좌이체 입금 확인 상태
  const [confirmingTransfer, setConfirmingTransfer] = useState(false);
  const [transferBusy, setTransferBusy] = useState(false);
  const [transferMessage, setTransferMessage] = useState<string | null>(null);
  const [transferError, setTransferError] = useState<string | null>(null);
  /** 확인 성공 후 재조회 전까지 확인 블록을 숨겨 중복 클릭을 막는다 */
  const [transferDone, setTransferDone] = useState(false);
  // 작업 상태 수동 전이(PAID → IN_PROGRESS → COMPLETED)
  const [confirmingStatus, setConfirmingStatus] = useState(false);
  const [statusBusy, setStatusBusy] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);
  // 계좌이체 환불 기록 — 실제 송금은 은행에서 먼저, 여기서는 결과만 기록
  const [confirmingRefund, setConfirmingRefund] = useState(false);
  const [refundBusy, setRefundBusy] = useState(false);
  const [refundMessage, setRefundMessage] = useState<string | null>(null);
  const [refundError, setRefundError] = useState<string | null>(null);
  /** 기록 성공 후 재조회 전까지 블록을 숨겨 중복 클릭을 막는다 */
  const [refundDone, setRefundDone] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await api<AdminQuoteRequestDetail>(
        `/admin/quote-requests/${id}`,
      );
      setRequest(data);
      // 기존 견적이 있으면 수정 폼에 미리 채운다
      if (data.quote) {
        setAmount(String(Number(data.quote.amount)));
        setExplanation(data.quote.explanation);
      }
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Something went wrong');
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  if (error) {
    return (
      <div>
        <Link to="/" className="muted">
          ← Back to list
        </Link>
        <p className="error">{error}</p>
      </div>
    );
  }
  if (!request) return <div className="muted">Loading…</div>;

  const category = CATEGORY_META[request.category];
  // 견적은 발행 후 불변 — REVIEWING에서 한 번만 발송 가능 (제품 결정 2026-07-24)
  const canCreate = request.status === 'REVIEWING' && !request.quote;
  const currency = CURRENCY_BY_METHOD[request.paymentMethod];
  const pendingTransfer =
    request.paymentMethod === 'BANK_TRANSFER'
      ? request.quote?.payments?.find(
          (p) => p.provider === 'BANK_TRANSFER' && p.status === 'PENDING',
        )
      : undefined;

  // 환불 기록 대상 — PAID 상태의 계좌이체 결제 (PayPal 환불은 PortOne 콘솔 → 웹훅이 자동 반영)
  const paidTransfer =
    request.paymentMethod === 'BANK_TRANSFER'
      ? request.quote?.payments?.find(
          (p) => p.provider === 'BANK_TRANSFER' && p.status === 'PAID',
        )
      : undefined;

  // 관리자가 누를 수 있는 다음 전이 — 서버 규칙(REQUIRED_CURRENT)과 동일
  const nextTransition = WORK_TRANSITIONS[request.status];

  // 폼 제출은 확인 모달만 연다 — 실제 발송은 confirm에서
  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSentMessage(null);

    const parsed = Number(amount);
    if (Number.isNaN(parsed) || parsed <= 0) {
      setFormError('Amount must be a positive number');
      return;
    }
    if (currency === 'KRW' && !Number.isInteger(parsed)) {
      setFormError('KRW amounts must be whole numbers');
      return;
    }
    setConfirming(true);
  };

  const onConfirmSend = async () => {
    setSubmitting(true);
    try {
      const updated = await api<AdminQuoteRequestDetail>(
        `/admin/quote-requests/${request.id}/quote`,
        {
          method: 'POST',
          body: { amount: Number(amount), explanation: explanation.trim() },
        },
      );
      setRequest(updated);
      setSentMessage('Quote sent — customer notified.');
    } catch (err) {
      setFormError(
        err instanceof ApiError ? err.message : 'Something went wrong',
      );
    } finally {
      setSubmitting(false);
      setConfirming(false);
    }
  };

  const onConfirmTransfer = async () => {
    if (!pendingTransfer) return;
    setTransferBusy(true);
    setTransferError(null);
    setTransferMessage(null);
    try {
      await api(`/admin/payments/${pendingTransfer.id}/confirm-transfer`, {
        method: 'POST',
      });
    } catch (err) {
      setTransferError(
        err instanceof ApiError ? err.message : 'Something went wrong',
      );
      setTransferBusy(false);
      setConfirmingTransfer(false);
      return;
    }
    // 입금 확인은 성공 — 이후 재조회 실패는 확인 실패와 구분한다
    setTransferDone(true);
    setTransferMessage('Transfer confirmed — customer notified.');
    setTransferBusy(false);
    setConfirmingTransfer(false);
    try {
      const refreshed = await api<AdminQuoteRequestDetail>(
        `/admin/quote-requests/${request.id}`,
      );
      setRequest(refreshed);
    } catch {
      setTransferMessage(null);
      setTransferError(
        'Transfer confirmed — reload the page to see the updated status.',
      );
    }
  };

  const onConfirmStatus = async () => {
    if (!nextTransition) return;
    setStatusBusy(true);
    setStatusError(null);
    setStatusMessage(null);
    try {
      const updated = await api<AdminQuoteRequestDetail>(
        `/admin/quote-requests/${request.id}/status`,
        { method: 'PATCH', body: { status: nextTransition.to } },
      );
      setRequest(updated);
      setStatusMessage(`${nextTransition.doneMessage} — customer notified.`);
    } catch (err) {
      setStatusError(
        err instanceof ApiError ? err.message : 'Something went wrong',
      );
    } finally {
      setStatusBusy(false);
      setConfirmingStatus(false);
    }
  };

  const onConfirmRefund = async () => {
    if (!paidTransfer) return;
    setRefundBusy(true);
    setRefundError(null);
    setRefundMessage(null);
    try {
      await api(`/admin/payments/${paidTransfer.id}/refund-transfer`, {
        method: 'POST',
      });
    } catch (err) {
      setRefundError(
        err instanceof ApiError ? err.message : 'Something went wrong',
      );
      setRefundBusy(false);
      setConfirmingRefund(false);
      return;
    }
    // 기록은 성공 — 이후 재조회 실패는 기록 실패와 구분한다 (입금 확인과 동일)
    setRefundDone(true);
    setRefundMessage('Refund recorded — customer notified.');
    setRefundBusy(false);
    setConfirmingRefund(false);
    try {
      const refreshed = await api<AdminQuoteRequestDetail>(
        `/admin/quote-requests/${request.id}`,
      );
      setRequest(refreshed);
    } catch {
      setRefundMessage(null);
      setRefundError(
        'Refund recorded — reload the page to see the updated status.',
      );
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <Link to="/" className="muted">
          ← Back
        </Link>
        <h1>
          Request #{request.id} · {category.emoji} {category.label}
        </h1>
        <StatusBadge status={request.status} />
        <span className="muted" style={{ fontSize: 13 }}>
          {PAYMENT_METHOD_LABELS[request.paymentMethod]}
        </span>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) 360px',
          gap: 20,
          alignItems: 'start',
        }}>
        {/* 좌측: 문의 내용 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <section className="card">
            <h2>Request</h2>
            <p style={{ margin: '0 0 12px', whiteSpace: 'pre-wrap' }}>
              {request.description}
            </p>
            <div className="muted" style={{ fontSize: 13 }}>
              Requested {formatDate(request.createdAt)}
              {request.serviceItem &&
                ` · Service: ${SERVICE_LABELS[request.serviceItem] ?? request.serviceItem}`}
              {request.desiredAmount &&
                ` · Customer budget ${formatAmount(request.desiredAmount, request.currency)}`}
            </div>
          </section>

          <section className="card">
            <h2>Customer</h2>
            <dl
              style={{
                display: 'grid',
                gridTemplateColumns: 'auto 1fr',
                gap: '6px 16px',
                margin: 0,
                fontSize: 14,
              }}>
              <dt className="muted">Name</dt>
              <dd style={{ margin: 0 }}>{[request.user.firstName, request.user.lastName].filter(Boolean).join(' ') || '—'}</dd>
              <dt className="muted">Email</dt>
              <dd style={{ margin: 0 }}>{request.user.email}</dd>
              <dt className="muted">Contact</dt>
              <dd style={{ margin: 0 }}>{request.contactMethod}</dd>
            </dl>
          </section>

          {request.attachments.length > 0 && (
            <section className="card">
              <h2>Attachments ({request.attachments.length})</h2>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                {request.attachments.map((a) =>
                  a.mimeType.startsWith('image/') ? (
                    <a
                      key={a.id}
                      href={a.downloadUrl}
                      target="_blank"
                      rel="noreferrer">
                      <img
                        src={a.downloadUrl}
                        alt={a.fileName}
                        style={{
                          width: 96,
                          height: 96,
                          objectFit: 'cover',
                          borderRadius: 10,
                          border: '1px solid var(--border)',
                        }}
                      />
                    </a>
                  ) : (
                    <a
                      key={a.id}
                      href={a.downloadUrl}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 8,
                        background: 'var(--surface-alt)',
                        borderRadius: 10,
                        padding: '10px 14px',
                        fontSize: 14,
                      }}>
                      📄 {a.fileName}
                      <span className="muted" style={{ fontSize: 12 }}>
                        {(a.sizeBytes / 1024).toFixed(0)} KB
                      </span>
                    </a>
                  ),
                )}
              </div>
            </section>
          )}
        </div>

        {/* 우측: 견적 패널 */}
        <section
          className="card"
          style={{ borderColor: request.quote ? 'var(--purple)' : undefined }}>
          <h2>{request.quote ? 'Quote' : 'Send a quote'}</h2>

          {request.quote && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 32, fontWeight: 800 }}>
                {formatAmount(request.quote.amount, request.quote.currency)}
              </div>
              <div className="muted" style={{ fontSize: 13 }}>
                Sent {formatDate(request.quote.createdAt)} · Valid until{' '}
                {formatDate(request.quote.expiresAt)}
              </div>
              <p style={{ marginTop: 12, marginBottom: 0, fontSize: 14 }}>
                {request.quote.explanation}
              </p>
            </div>
          )}

          {pendingTransfer && !transferDone && (
            <div
              style={{
                margin: '0 0 16px',
                padding: 12,
                borderRadius: 10,
                background: 'var(--surface-alt)',
                fontSize: 14,
              }}>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>Awaiting bank transfer</div>
              <div className="muted" style={{ marginBottom: 10 }}>
                Expected sender name <strong style={{ color: 'var(--text)' }}>LUNOTE{request.id}</strong> ·{' '}
                {formatAmount(pendingTransfer.amount, pendingTransfer.currency)} · requested{' '}
                {formatDate(pendingTransfer.createdAt)}
              </div>
              <button type="button" disabled={transferBusy} onClick={() => setConfirmingTransfer(true)}>
                {transferBusy ? 'Confirming…' : 'Confirm transfer received'}
              </button>
              <ConfirmDialog
                open={confirmingTransfer}
                title="Confirm this transfer?"
                message={
                  <>
                    Mark{' '}
                    <strong style={{ color: 'var(--text)' }}>
                      {formatAmount(pendingTransfer.amount, pendingTransfer.currency)}
                    </strong>{' '}
                    from sender <strong style={{ color: 'var(--text)' }}>LUNOTE{request.id}</strong> as received.
                    The request becomes PAID and the customer is notified.
                  </>
                }
                confirmLabel="Confirm received"
                dismissLabel="Go back"
                loading={transferBusy}
                onConfirm={() => void onConfirmTransfer()}
                onDismiss={() => setConfirmingTransfer(false)}
              />
            </div>
          )}
          {transferMessage && (
            <div style={{ color: 'var(--success)', fontSize: 14, marginBottom: 12 }}>{transferMessage}</div>
          )}
          {transferError && (
            <div className="error" style={{ marginBottom: 12 }}>{transferError}</div>
          )}

          {nextTransition && (
            <div
              style={{
                margin: '0 0 16px',
                padding: 12,
                borderRadius: 10,
                background: 'var(--surface-alt)',
                fontSize: 14,
              }}>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>Work status</div>
              <div className="muted" style={{ marginBottom: 10 }}>
                {nextTransition.hint}
              </div>
              <button type="button" disabled={statusBusy} onClick={() => setConfirmingStatus(true)}>
                {statusBusy ? 'Updating…' : nextTransition.buttonLabel}
              </button>
              <ConfirmDialog
                open={confirmingStatus}
                title={nextTransition.confirmTitle}
                message={
                  <>
                    Request #{request.id} becomes{' '}
                    <strong style={{ color: 'var(--text)' }}>{STATUS_META[nextTransition.to].label}</strong>{' '}
                    and {customerName(request.user)} is notified. This cannot be undone here.
                  </>
                }
                confirmLabel={nextTransition.buttonLabel}
                dismissLabel="Go back"
                loading={statusBusy}
                onConfirm={() => void onConfirmStatus()}
                onDismiss={() => setConfirmingStatus(false)}
              />
            </div>
          )}
          {statusMessage && (
            <div style={{ color: 'var(--success)', fontSize: 14, marginBottom: 12 }}>{statusMessage}</div>
          )}
          {statusError && (
            <div className="error" style={{ marginBottom: 12 }}>{statusError}</div>
          )}

          {paidTransfer && !refundDone && (
            <div
              style={{
                margin: '0 0 16px',
                padding: 12,
                borderRadius: 10,
                background: 'var(--surface-alt)',
                fontSize: 14,
              }}>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>Bank transfer refund</div>
              <div className="muted" style={{ marginBottom: 10 }}>
                Send the money back from the bank first, then record it here.{' '}
                {formatAmount(paidTransfer.amount, paidTransfer.currency)} paid{' '}
                {formatDate(paidTransfer.paidAt ?? paidTransfer.createdAt)}
              </div>
              <button
                type="button"
                className="ghost"
                style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }}
                disabled={refundBusy}
                onClick={() => setConfirmingRefund(true)}>
                {refundBusy ? 'Recording…' : 'Mark refunded'}
              </button>
              <ConfirmDialog
                open={confirmingRefund}
                title="Record this refund?"
                message={
                  <>
                    Mark{' '}
                    <strong style={{ color: 'var(--text)' }}>
                      {formatAmount(paidTransfer.amount, paidTransfer.currency)}
                    </strong>{' '}
                    as refunded to {customerName(request.user)}. The payment becomes REFUNDED, the request
                    becomes REFUNDED unless it is already completed, and the customer is notified.{' '}
                    <strong style={{ color: 'var(--text)' }}>
                      Only do this after the money has actually been sent back.
                    </strong>
                  </>
                }
                confirmLabel="Mark refunded"
                dismissLabel="Go back"
                loading={refundBusy}
                onConfirm={() => void onConfirmRefund()}
                onDismiss={() => setConfirmingRefund(false)}
              />
            </div>
          )}
          {refundMessage && (
            <div style={{ color: 'var(--success)', fontSize: 14, marginBottom: 12 }}>{refundMessage}</div>
          )}
          {refundError && (
            <div className="error" style={{ marginBottom: 12 }}>{refundError}</div>
          )}

          {canCreate ? (
            <form
              onSubmit={(e) => void onSubmit(e)}
              style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label htmlFor="amount">Amount ({currency})</label>
                <input
                  id="amount"
                  type="number"
                  min="1"
                  step={currency === 'KRW' ? '1' : '0.01'}
                  placeholder={currency === 'KRW' ? '150000' : '340'}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="explanation">
                  Explanation (shown to the customer)
                </label>
                <textarea
                  id="explanation"
                  rows={5}
                  placeholder="What's included in this price…"
                  value={explanation}
                  onChange={(e) => setExplanation(e.target.value)}
                />
              </div>

              {formError && <div className="error">{formError}</div>}
              {sentMessage && (
                <div style={{ color: 'var(--success)', fontSize: 14 }}>
                  {sentMessage}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting || !amount || explanation.trim().length < 5}>
                {submitting ? 'Sending…' : 'Send quote'}
              </button>

              <ConfirmDialog
                open={confirming}
                title="Send this quote?"
                message={
                  <>
                    <strong style={{ color: 'var(--text)' }}>
                      {formatAmount(Number(amount) || 0, currency)}
                    </strong>{' '}
                    will be quoted to {customerName(request.user)} and they
                    will be notified immediately.{' '}
                    <strong style={{ color: 'var(--text)' }}>
                      Quotes cannot be changed after sending.
                    </strong>
                  </>
                }
                confirmLabel="Send quote"
                dismissLabel="Go back"
                loading={submitting}
                onConfirm={() => void onConfirmSend()}
                onDismiss={() => setConfirming(false)}
              />
            </form>
          ) : (
            <p className="muted" style={{ margin: 0, fontSize: 14 }}>
              {request.quote
                ? 'Quotes are immutable once sent. To change the price, the customer cancels and submits a new request.'
                : `No quote can be sent in ${request.status} status.`}
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
