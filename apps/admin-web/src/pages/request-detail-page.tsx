import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';

import { ConfirmDialog } from '../components/confirm-dialog';
import { StatusBadge } from '../components/status-badge';
import { api, ApiError } from '../lib/api';
import {
  CATEGORY_META,
  customerName,
  formatAmount,
  formatDate,
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
  // 견적 발송은 REVIEWING, 수정은 QUOTED에서만 (서버 상태 머신과 동일)
  const canCreate = request.status === 'REVIEWING' && !request.quote;
  const canUpdate = request.status === 'QUOTED' && !!request.quote;

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
    setConfirming(true);
  };

  const onConfirmSend = async () => {
    const creating = canCreate;
    setSubmitting(true);
    try {
      const updated = await api<AdminQuoteRequestDetail>(
        `/admin/quote-requests/${request.id}/quote`,
        {
          method: creating ? 'POST' : 'PATCH',
          body: { amount: Number(amount), explanation: explanation.trim() },
        },
      );
      setRequest(updated);
      setSentMessage(
        creating ? 'Quote sent — customer notified.' : 'Quote updated.',
      );
    } catch (err) {
      setFormError(
        err instanceof ApiError ? err.message : 'Something went wrong',
      );
    } finally {
      setSubmitting(false);
      setConfirming(false);
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
                Sent {formatDate(request.quote.createdAt)}
              </div>
            </div>
          )}

          {canCreate || canUpdate ? (
            <form
              onSubmit={(e) => void onSubmit(e)}
              style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label htmlFor="amount">Amount (USD)</label>
                <input
                  id="amount"
                  type="number"
                  min="1"
                  step="0.01"
                  placeholder="340"
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
                {submitting
                  ? 'Sending…'
                  : canCreate
                    ? 'Send quote'
                    : 'Update quote'}
              </button>

              <ConfirmDialog
                open={confirming}
                title={canCreate ? 'Send this quote?' : 'Update this quote?'}
                message={
                  canCreate ? (
                    <>
                      <strong style={{ color: 'var(--text)' }}>
                        {formatAmount(Number(amount) || 0, 'USD')}
                      </strong>{' '}
                      will be quoted to{' '}
                      {customerName(request.user)} and they will be
                      notified immediately.
                    </>
                  ) : (
                    <>
                      The quote will change to{' '}
                      <strong style={{ color: 'var(--text)' }}>
                        {formatAmount(Number(amount) || 0, 'USD')}
                      </strong>
                      . The customer sees the new amount right away.
                    </>
                  )
                }
                confirmLabel={canCreate ? 'Send quote' : 'Update quote'}
                dismissLabel="Go back"
                loading={submitting}
                onConfirm={() => void onConfirmSend()}
                onDismiss={() => setConfirming(false)}
              />
            </form>
          ) : (
            <p className="muted" style={{ margin: 0, fontSize: 14 }}>
              {request.quote
                ? `Quote is locked in ${request.status} status.`
                : `No quote can be sent in ${request.status} status.`}
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
