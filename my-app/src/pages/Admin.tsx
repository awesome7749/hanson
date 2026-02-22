import React, { useState, useEffect } from 'react';
import './Admin.css';

interface LeadSummary {
  id: string;
  createdAt: string;
  status: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  addressRaw: string;
  formattedAddress?: string;
  _count: { predictions: number; photos: number };
}

interface Prediction {
  id: string;
  variant: string;
  numberOfODU: number;
  typeOfODU: string;
  oduSize: string;
  numberOfIDU: number;
  typeOfIDU: string;
  iduSize: string;
  electricalWorkEstimate?: number;
  hvacWorkEstimate?: number;
  confidence?: string;
}

interface Photo {
  id: string;
  photoKey: string;
  gcsUrl: string;
  signedUrl?: string;
  fileSize: number;
  mimeType: string;
  createdAt: string;
}

interface LeadDetail {
  id: string;
  createdAt: string;
  status: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  addressRaw: string;
  formattedAddress?: string;
  propertyData?: any;
  hasAttic?: string;
  basementType?: string;
  hasDuctwork?: string;
  numberOfFloors?: string;
  corrections?: string;
  ownershipStatus?: string;
  currentHeating?: string;
  installationTimeline?: string;
  electricityProvider?: string;
  gasProvider?: string;
  adminNotes?: string;
  predictions: Prediction[];
  photos: Photo[];
}

const STATUS_LABELS: Record<string, string> = {
  new: 'New',
  property_loaded: 'Property Loaded',
  survey_done: 'Survey Done',
  quoted: 'Quoted',
  photos_submitted: 'Photos Submitted',
  contacted: 'Contacted',
  followed_up: 'Followed Up',
  scheduled: 'Scheduled',
  completed: 'Completed',
  lost: 'Lost',
};

const STATUS_OPTIONS = [
  'new', 'property_loaded', 'survey_done', 'quoted',
  'photos_submitted', 'contacted', 'followed_up',
  'scheduled', 'completed', 'lost',
];

const Admin: React.FC = () => {
  const [token, setToken] = useState<string | null>(
    () => sessionStorage.getItem('admin_token')
  );
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  const [leads, setLeads] = useState<LeadSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [detailCache, setDetailCache] = useState<Record<string, LeadDetail>>({});
  const [savingStatus, setSavingStatus] = useState<Record<string, boolean>>({});
  const [notesEdits, setNotesEdits] = useState<Record<string, string>>({});
  const [savingNotes, setSavingNotes] = useState<Record<string, boolean>>({});

  const authHeaders = (): HeadersInit => ({
    Authorization: `Bearer ${token}`,
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setLoginError(data.error || 'Login failed');
        return;
      }
      sessionStorage.setItem('admin_token', data.token);
      setToken(data.token);
      setPassword('');
    } catch {
      setLoginError('Network error — is the server running?');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('admin_token');
    setToken(null);
    setLeads([]);
    setDetailCache({});
    setExpandedId(null);
  };

  // Fetch leads once authenticated
  useEffect(() => {
    if (!token) return;
    setLoading(true);
    fetch('/api/admin/leads', { headers: authHeaders() })
      .then((res) => {
        if (res.status === 401) {
          handleLogout();
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data) setLeads(data.leads || []);
      })
      .catch((err) => console.error('Failed to fetch leads:', err))
      .finally(() => setLoading(false));
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleExpand = async (id: string) => {
    if (expandedId === id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(id);

    if (!detailCache[id]) {
      try {
        const res = await fetch(`/api/admin/leads/${id}`, { headers: authHeaders() });
        if (res.status === 401) {
          handleLogout();
          return;
        }
        const data = await res.json();
        setDetailCache((prev) => ({ ...prev, [id]: data.lead }));
      } catch (err) {
        console.error('Failed to fetch lead detail:', err);
      }
    }
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const handleStatusChange = async (leadId: string, newStatus: string) => {
    setSavingStatus((prev) => ({ ...prev, [leadId]: true }));
    try {
      const res = await fetch(`/api/leads/${leadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setLeads((prev) =>
          prev.map((l) => (l.id === leadId ? { ...l, status: newStatus } : l))
        );
        setDetailCache((prev) =>
          prev[leadId] ? { ...prev, [leadId]: { ...prev[leadId], status: newStatus } } : prev
        );
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    } finally {
      setSavingStatus((prev) => ({ ...prev, [leadId]: false }));
    }
  };

  const handleNotesSave = async (leadId: string) => {
    const notes = notesEdits[leadId] ?? '';
    setSavingNotes((prev) => ({ ...prev, [leadId]: true }));
    try {
      const res = await fetch(`/api/leads/${leadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminNotes: notes }),
      });
      if (res.ok) {
        setDetailCache((prev) =>
          prev[leadId] ? { ...prev, [leadId]: { ...prev[leadId], adminNotes: notes } } : prev
        );
      }
    } catch (err) {
      console.error('Failed to save notes:', err);
    } finally {
      setSavingNotes((prev) => ({ ...prev, [leadId]: false }));
    }
  };

  const renderDetail = (detail: LeadDetail) => (
    <tr key={`${detail.id}-detail`}>
      <td colSpan={7} className="admin__detail">
        {/* Status */}
        <div className="admin__detail-section admin__detail-actions">
          <h4>Status</h4>
          <div className="admin__status-change">
            <select
              className="admin__status-select"
              value={detail.status}
              onChange={(e) => handleStatusChange(detail.id, e.target.value)}
              disabled={savingStatus[detail.id]}
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABELS[s] || s}
                </option>
              ))}
            </select>
            {savingStatus[detail.id] && (
              <span className="admin__saving-indicator">Saving...</span>
            )}
          </div>
        </div>

        {/* Admin Notes */}
        <div className="admin__detail-section">
          <h4>Admin Notes</h4>
          <textarea
            className="admin__notes-textarea"
            placeholder="Add notes about this lead..."
            value={notesEdits[detail.id] ?? detail.adminNotes ?? ''}
            onChange={(e) =>
              setNotesEdits((prev) => ({ ...prev, [detail.id]: e.target.value }))
            }
            rows={3}
          />
          <button
            className="admin__notes-save-btn"
            onClick={() => handleNotesSave(detail.id)}
            disabled={
              savingNotes[detail.id] ||
              (notesEdits[detail.id] === undefined) ||
              notesEdits[detail.id] === (detail.adminNotes ?? '')
            }
          >
            {savingNotes[detail.id] ? 'Saving...' : 'Save Notes'}
          </button>
        </div>

        {/* Survey */}
        <div className="admin__detail-section">
          <h4>Survey Answers</h4>
          <div className="admin__detail-grid">
            <div className="admin__detail-field">
              <span className="admin__detail-label">Attic</span>
              <span className="admin__detail-value">{detail.hasAttic || '—'}</span>
            </div>
            <div className="admin__detail-field">
              <span className="admin__detail-label">Basement</span>
              <span className="admin__detail-value">{detail.basementType || '—'}</span>
            </div>
            <div className="admin__detail-field">
              <span className="admin__detail-label">Ductwork</span>
              <span className="admin__detail-value">{detail.hasDuctwork || '—'}</span>
            </div>
            <div className="admin__detail-field">
              <span className="admin__detail-label">Floors</span>
              <span className="admin__detail-value">{detail.numberOfFloors || '—'}</span>
            </div>
            <div className="admin__detail-field">
              <span className="admin__detail-label">Ownership</span>
              <span className="admin__detail-value">{detail.ownershipStatus || '—'}</span>
            </div>
            <div className="admin__detail-field">
              <span className="admin__detail-label">Heating</span>
              <span className="admin__detail-value">{detail.currentHeating || '—'}</span>
            </div>
            <div className="admin__detail-field">
              <span className="admin__detail-label">Timeline</span>
              <span className="admin__detail-value">{detail.installationTimeline || '—'}</span>
            </div>
            <div className="admin__detail-field">
              <span className="admin__detail-label">Electric Provider</span>
              <span className="admin__detail-value">{detail.electricityProvider || '—'}</span>
            </div>
            <div className="admin__detail-field">
              <span className="admin__detail-label">Gas Provider</span>
              <span className="admin__detail-value">{detail.gasProvider || '—'}</span>
            </div>
          </div>
          {detail.corrections && (
            <div className="admin__detail-corrections">
              <span className="admin__detail-label">Corrections</span>
              <p className="admin__detail-value">{detail.corrections}</p>
            </div>
          )}
        </div>

        {/* Predictions */}
        {detail.predictions.length > 0 && (
          <div className="admin__detail-section">
            <h4>Predictions</h4>
            {detail.predictions.map((p) => (
              <div key={p.id} className="admin__detail-grid admin__detail-grid--spaced">
                <div className="admin__detail-field">
                  <span className="admin__detail-label">Variant</span>
                  <span className="admin__detail-value">{p.variant}</span>
                </div>
                <div className="admin__detail-field">
                  <span className="admin__detail-label">ODU</span>
                  <span className="admin__detail-value">{p.numberOfODU}x {p.typeOfODU} ({p.oduSize}k)</span>
                </div>
                <div className="admin__detail-field">
                  <span className="admin__detail-label">IDU</span>
                  <span className="admin__detail-value">{p.numberOfIDU}x {p.typeOfIDU} ({p.iduSize}k)</span>
                </div>
                <div className="admin__detail-field">
                  <span className="admin__detail-label">Electrical Est.</span>
                  <span className="admin__detail-value">${p.electricalWorkEstimate?.toLocaleString() || '—'}</span>
                </div>
                <div className="admin__detail-field">
                  <span className="admin__detail-label">HVAC Est.</span>
                  <span className="admin__detail-value">${p.hvacWorkEstimate?.toLocaleString() || '—'}</span>
                </div>
                <div className="admin__detail-field">
                  <span className="admin__detail-label">Confidence</span>
                  <span className="admin__detail-value">{p.confidence || '—'}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Photos */}
        {detail.photos.length > 0 && (
          <div className="admin__detail-section">
            <h4>Photos ({detail.photos.length})</h4>
            <div className="admin__photos">
              {detail.photos.map((photo) => {
                const proxyUrl = `/api/admin/photos/${photo.id}?token=${token}`;
                return (
                  <a key={photo.id} href={proxyUrl} target="_blank" rel="noopener noreferrer">
                    <img
                      src={proxyUrl}
                      alt={photo.photoKey}
                      className="admin__photo-thumb"
                    />
                  </a>
                );
              })}
            </div>
          </div>
        )}
      </td>
    </tr>
  );

  // ─── Login gate ───
  if (!token) {
    return (
      <div className="admin">
        <div className="admin__login">
          <h1 className="admin__title">Admin Login</h1>
          <form className="admin__login-form" onSubmit={handleLogin}>
            <input
              type="password"
              className="admin__login-input"
              placeholder="Enter admin password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
            />
            <button type="submit" className="admin__login-btn" disabled={loginLoading || !password}>
              {loginLoading ? 'Signing in...' : 'Sign In'}
            </button>
            {loginError && <p className="admin__login-error">{loginError}</p>}
          </form>
        </div>
      </div>
    );
  }

  // ─── Dashboard ───
  return (
    <div className="admin">
      <div className="admin__header">
        <div>
          <h1 className="admin__title">Lead Dashboard</h1>
          <p className="admin__subtitle">
            {leads.length} lead{leads.length !== 1 ? 's' : ''} total
          </p>
        </div>
        <button type="button" className="admin__logout-btn" onClick={handleLogout}>
          Log Out
        </button>
      </div>

      {loading ? (
        <div className="admin__loading">Loading leads...</div>
      ) : leads.length === 0 ? (
        <div className="admin__empty">No leads yet. They'll appear here once someone starts the quote wizard.</div>
      ) : (
        <div className="admin__table-wrap">
          <table className="admin__table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Name</th>
                <th>Email</th>
                <th>Address</th>
                <th>Status</th>
                <th>Quotes</th>
                <th>Photos</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <React.Fragment key={lead.id}>
                  <tr>
                    <td>{formatDate(lead.createdAt)}</td>
                    <td>
                      <button type="button" className="admin__expand-btn" onClick={() => toggleExpand(lead.id)}>
                        {lead.firstName || ''} {lead.lastName || '—'}
                      </button>
                    </td>
                    <td>{lead.email || '—'}</td>
                    <td>{lead.formattedAddress || lead.addressRaw}</td>
                    <td>
                      <span className={`admin__status admin__status--${lead.status}`}>
                        {STATUS_LABELS[lead.status] || lead.status}
                      </span>
                    </td>
                    <td>{lead._count.predictions}</td>
                    <td>{lead._count.photos}</td>
                  </tr>
                  {expandedId === lead.id && detailCache[lead.id] && renderDetail(detailCache[lead.id])}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Admin;
