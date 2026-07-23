import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { StatusBadge } from '../components/status-badge';
import { api, ApiError } from '../lib/api';
import {
  CATEGORY_META,
  formatAmount,
  formatDate,
  type AdminQuoteRequest,
  type RequestStatus,
} from '../lib/types';

const FILTERS: { key: RequestStatus | 'ALL'; label: string }[] = [
  { key: 'ALL', label: 'All' },
  { key: 'REVIEWING', label: 'Reviewing' },
  { key: 'QUOTED', label: 'Quote sent' },
  { key: 'PAID', label: 'Paid' },
  { key: 'IN_PROGRESS', label: 'In progress' },
  { key: 'COMPLETED', label: 'Completed' },
  { key: 'CANCELLED', label: 'Cancelled' },
];

export function RequestsPage() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const filter = (params.get('status') ?? 'ALL') as RequestStatus | 'ALL';

  const [requests, setRequests] = useState<AdminQuoteRequest[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setRequests(null);
    setError(null);
    const query = filter === 'ALL' ? '' : `?status=${filter}`;
    api<AdminQuoteRequest[]>(`/admin/quote-requests${query}`)
      .then(setRequests)
      .catch((e) =>
        setError(e instanceof ApiError ? e.message : 'Something went wrong'),
      );
  }, [filter]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
        }}>
        <h1>Quote requests</h1>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {FILTERS.map((f) => (
            <button
              key={f.key}
              className={filter === f.key ? undefined : 'ghost'}
              style={{ padding: '6px 14px', fontSize: 13 }}
              onClick={() =>
                setParams(f.key === 'ALL' ? {} : { status: f.key })
              }>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {error && <div className="error">{error}</div>}
      {requests === null && !error && <div className="muted">Loading…</div>}

      {requests && requests.length === 0 && (
        <div className="card muted" style={{ textAlign: 'center' }}>
          No requests in this status.
        </div>
      )}

      {requests && requests.length > 0 && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Category</th>
                <th>Customer</th>
                <th>Description</th>
                <th>Quote</th>
                <th>Status</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => (
                <tr
                  key={r.id}
                  className="row-link"
                  onClick={() => navigate(`/requests/${r.id}`)}>
                  <td className="muted">#{r.id}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    {CATEGORY_META[r.category].emoji}{' '}
                    {CATEGORY_META[r.category].label}
                  </td>
                  <td>{r.user.name || r.user.email}</td>
                  <td
                    className="muted"
                    style={{
                      maxWidth: 280,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                    {r.description}
                  </td>
                  <td style={{ whiteSpace: 'nowrap', fontWeight: 600 }}>
                    {r.quote ? formatAmount(r.quote.amount, r.quote.currency) : '—'}
                  </td>
                  <td>
                    <StatusBadge status={r.status} />
                  </td>
                  <td className="muted" style={{ whiteSpace: 'nowrap' }}>
                    {formatDate(r.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
