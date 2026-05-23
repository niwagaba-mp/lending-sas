import { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Popup, CircleMarker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
// @ts-ignore
import L from 'leaflet';
import api from '../../services/api';
import { MapPin, Filter, RefreshCw, Users, Navigation } from 'lucide-react';

// Fix leaflet default icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Leaflet components cast for TS compatibility
const MapC    = MapContainer    as any;
const TileL   = TileLayer       as any;
const CircleM = CircleMarker    as any;
const Pup     = Popup           as any;

const GRADE_COLORS: Record<string, string> = {
  A: '#22c55e', B: '#06b6d4', C: '#f5a623', D: '#f97316', E: '#ef4444',
};
const GRADE_LABELS: Record<string, string> = {
  A: 'Excellent', B: 'Good', C: 'Fair', D: 'Poor', E: 'High Risk',
};

export default function ClientMapPage() {
  const [clients, setClients]       = useState<any[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [gradeFilter, setGradeFilter] = useState('');
  const [branchFilter, setBranchFilter] = useState('');
  const [searchQ, setSearchQ]       = useState('');
  const [page, setPage]             = useState(1);
  const PAGE_SIZE = 25;

  const load = () => {
    setLoading(true); setError('');
    api.getClientMap()
      .then((r: any) => setClients(r.data || []))
      .catch((e: any) => setError(e.message || 'Failed to load client map data'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const branches = useMemo(() => [...new Set(clients.map(c => c.branch_name).filter(Boolean))], [clients]);

  const filtered = useMemo(() => {
    let rows = clients.filter(c => c.home_latitude && c.home_longitude);
    if (gradeFilter)  rows = rows.filter(c => c.grade === gradeFilter);
    if (branchFilter) rows = rows.filter(c => c.branch_name === branchFilter);
    if (searchQ)      rows = rows.filter(c =>
      `${c.first_name} ${c.last_name} ${c.phone_primary}`.toLowerCase().includes(searchQ.toLowerCase())
    );
    return rows;
  }, [clients, gradeFilter, branchFilter, searchQ]);

  const pagedRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  const center: [number, number] = [1.3733, 32.2903]; // Uganda center

  // Grade distribution
  const gradeCounts = useMemo(() => {
    const m: Record<string, number> = {};
    clients.forEach(c => { if (c.grade) m[c.grade] = (m[c.grade] || 0) + 1; });
    return m;
  }, [clients]);

  return (
    <div style={{ paddingBottom: 40 }}>
      {/* Header */}
      <div className="page-header">
        <div>
          <h2 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <MapPin size={22} color="var(--accent)" /> Client GPS Map
          </h2>
          <p className="page-subtitle">
            {filtered.length} clients plotted of {clients.length} total · Color = credit grade
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Legend */}
          {Object.entries(GRADE_COLORS).map(([g, c]) => (
            <span
              key={g}
              className="flex items-center gap-1"
              style={{ fontSize: 12, cursor: 'pointer', opacity: gradeFilter && gradeFilter !== g ? 0.4 : 1, transition: 'opacity 0.15s' }}
              onClick={() => setGradeFilter(gradeFilter === g ? '' : g)}
              title={GRADE_LABELS[g]}
            >
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: c, display: 'inline-block', border: gradeFilter === g ? '2px solid white' : 'none' }} />
              {g}
              {gradeCounts[g] ? <span style={{ color: 'var(--text-muted)' }}>({gradeCounts[g]})</span> : null}
            </span>
          ))}
          <button className="btn btn-secondary btn-sm" onClick={load} title="Refresh"><RefreshCw size={13} /></button>
        </div>
      </div>

      {/* Filters */}
      <div className="card" style={{ padding: 14, marginBottom: 16, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <Filter size={14} color="var(--text-muted)" />
        <input
          className="form-control"
          style={{ maxWidth: 220, flex: 1 }}
          placeholder="Search client name or phone…"
          value={searchQ}
          onChange={e => { setSearchQ(e.target.value); setPage(1); }}
        />
        <select className="form-control" style={{ maxWidth: 180 }} value={gradeFilter} onChange={e => { setGradeFilter(e.target.value); setPage(1); }}>
          <option value="">All Grades</option>
          {['A','B','C','D','E'].map(g => <option key={g} value={g}>Grade {g} — {GRADE_LABELS[g]}</option>)}
        </select>
        <select className="form-control" style={{ maxWidth: 200 }} value={branchFilter} onChange={e => { setBranchFilter(e.target.value); setPage(1); }}>
          <option value="">All Branches</option>
          {branches.map(b => <option key={b} value={b}>{b}</option>)}
        </select>
        {(gradeFilter || branchFilter || searchQ) && (
          <button className="btn btn-secondary btn-sm" onClick={() => { setGradeFilter(''); setBranchFilter(''); setSearchQ(''); setPage(1); }}>
            Clear Filters
          </button>
        )}
      </div>

      {/* Grade KPI Strip */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        {Object.entries(GRADE_COLORS).map(([g, c]) => (
          <div key={g} style={{ flex: '1 1 80px', background: 'var(--bg-card)', border: `1px solid ${c}44`, borderRadius: 10, padding: '10px 14px', textAlign: 'center' }}>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>Grade {g}</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: c }}>{gradeCounts[g] || 0}</div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{GRADE_LABELS[g]}</div>
          </div>
        ))}
        <div style={{ flex: '1 1 80px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 14px', textAlign: 'center' }}>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>No Grade</div>
          <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--text-muted)' }}>{clients.filter(c => !c.grade).length}</div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Unscored</div>
        </div>
      </div>

      {/* Map */}
      {loading ? (
        <div style={{ height: 480, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-card)', borderRadius: 'var(--radius)', border: '1px solid var(--border)', flexDirection: 'column', gap: 12 }}>
          <div className="spinner" />
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>Loading map data…</p>
        </div>
      ) : error ? (
        <div className="alert alert-danger" style={{ marginBottom: 16 }}>
          <strong>Map Error:</strong> {error}. Showing table below.
        </div>
      ) : (
        <div className="map-container" style={{ height: 480 }}>
          <MapC center={center} zoom={7} style={{ height: '100%', width: '100%' }}>
            <TileL
              attribution='&copy; <a href="https://osm.org">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {filtered.map(c => (
              <CircleM
                key={c.id}
                center={[parseFloat(c.home_latitude), parseFloat(c.home_longitude)]}
                radius={9}
                pathOptions={{
                  color:       GRADE_COLORS[c.grade] || '#8899bb',
                  fillColor:   GRADE_COLORS[c.grade] || '#8899bb',
                  fillOpacity: 0.85,
                  weight: 2,
                }}
              >
                <Pup>
                  <div style={{ minWidth: 200, lineHeight: 1.7, fontFamily: 'Inter, sans-serif', fontSize: 13 }}>
                    <strong style={{ fontSize: 14 }}>{c.first_name} {c.last_name}</strong>
                    <div style={{ color: '#64748b', fontSize: 11, marginBottom: 6 }}>
                      <span style={{ background: GRADE_COLORS[c.grade] + '22', color: GRADE_COLORS[c.grade], padding: '1px 6px', borderRadius: 8, fontWeight: 700, fontSize: 11 }}>
                        Grade {c.grade || '?'}
                      </span>
                    </div>
                    📞 {c.phone_primary}<br />
                    👤 {c.staff_name}<br />
                    🏢 {c.branch_name}<br />
                    📊 Credit Score: <strong>{c.credit_score || '—'}</strong><br />
                    💼 Active Loans: <strong>{c.active_loans || 0}</strong><br />
                    📍 {c.home_address || `${parseFloat(c.home_latitude).toFixed(4)}, ${parseFloat(c.home_longitude).toFixed(4)}`}
                  </div>
                </Pup>
              </CircleM>
            ))}
          </MapC>
        </div>
      )}

      {/* Client Table */}
      <div className="card mt-4" style={{ marginTop: 20 }}>
        <div className="card-header">
          <span className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Users size={14} /> Client List ({filtered.length})
          </span>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            Page {page} of {totalPages || 1}
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>#</th><th>Client</th><th>Staff</th><th>Branch</th>
                <th>Credit Grade</th><th>GPS Coordinates</th>
              </tr>
            </thead>
            <tbody>
              {pagedRows.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>No clients match the current filter.</td></tr>
              ) : pagedRows.map((c, idx) => (
                <tr key={c.id}>
                  <td style={{ color: 'var(--text-muted)', fontSize: 11 }}>{(page - 1) * PAGE_SIZE + idx + 1}</td>
                  <td>
                    <div className="font-bold">{c.first_name} {c.last_name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{c.phone_primary}</div>
                  </td>
                  <td>{c.staff_name || '—'}</td>
                  <td>{c.branch_name || '—'}</td>
                  <td>
                    {c.grade ? (
                      <span style={{ fontWeight: 800, color: GRADE_COLORS[c.grade] }}>
                        {c.credit_score} &nbsp;
                        <span style={{ background: GRADE_COLORS[c.grade] + '22', color: GRADE_COLORS[c.grade], padding: '1px 8px', borderRadius: 10, fontSize: 11 }}>
                          {c.grade}
                        </span>
                      </span>
                    ) : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                  </td>
                  <td style={{ fontSize: 11, fontFamily: 'monospace' }}>
                    {c.home_latitude
                      ? <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Navigation size={11} color="var(--text-muted)" />
                          {parseFloat(c.home_latitude).toFixed(5)}, {parseFloat(c.home_longitude).toFixed(5)}
                        </span>
                      : <span style={{ color: 'var(--text-muted)' }}>No GPS</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ padding: '12px 18px', display: 'flex', gap: 8, justifyContent: 'center', borderTop: '1px solid var(--border)' }}>
            <button className="btn btn-secondary btn-sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1).map(p => (
              <button key={p} className={`btn btn-sm ${page === p ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setPage(p)}>{p}</button>
            ))}
            <button className="btn btn-secondary btn-sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next →</button>
          </div>
        )}
      </div>
    </div>
  );
}
