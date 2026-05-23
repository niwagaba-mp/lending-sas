import { useEffect, useState } from 'react';
import { Search, Plus, Eye, MapPin } from 'lucide-react';
import api from '../../services/api';
import ClientModal from './ClientModal';

export default function ClientsPage() {
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState<any>(null);

  const [activeTab, setActiveTab] = useState('all');

  const load = () => {
    setLoading(true);
    const params = [];
    if (search) params.push(`search=${search}`);
    if (activeTab !== 'all') params.push(`filter=${activeTab}`);

    api.getClients(params.join('&'))
      .then((r: any) => setClients(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [search, activeTab]);

  const gradeColor: Record<string, string> = { A:'badge-A', B:'badge-B', C:'badge-C', D:'badge-D', E:'badge-E' };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">Client Management</h2>
          <p className="page-subtitle">{clients.length} clients matching criteria</p>
        </div>
        <div className="flex gap-2">
          <div className="search-bar">
            <Search size={14} color="var(--text-muted)" />
            <input placeholder="Search clients..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <button className="btn btn-primary" onClick={() => { setSelected(null); setShowModal(true); }}>
            <Plus size={14} /> Add Client
          </button>
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', padding: '0 24px', gap: 24, background: 'rgba(255,255,255,0.02)', flexWrap: 'wrap' }}>
          {[
            { id: 'all', label: 'All Clients' },
            { id: 'paid_today', label: 'Who Paid Today' },
            { id: 'did_not_pay_today', label: 'Who Did Not Pay Today' },
            { id: 'paid_in_advance', label: 'Paid in Advance' },
            { id: 'did_not_pay', label: 'Who Did Not Pay' },
            { id: 'paid', label: 'Who Paid' },
            { id: 'no_loans', label: 'Without Loans' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                background: 'none',
                border: 'none',
                padding: '16px 4px',
                color: activeTab === tab.id ? 'var(--accent)' : 'var(--text-muted)',
                fontWeight: activeTab === tab.id ? 700 : 500,
                fontSize: 14,
                cursor: 'pointer',
                borderBottom: activeTab === tab.id ? '2px solid var(--accent)' : '2px solid transparent',
                transition: 'all 0.2s',
                outline: 'none'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="table-wrap" style={{ padding: '0 24px 24px 24px' }}>
          <table>
            <thead>
              <tr>
                <th>Client</th><th>Phone</th><th>Business</th><th>Staff</th>
                <th>Credit</th><th>Active Loans</th><th>GPS</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? <tr><td colSpan={8} style={{ textAlign:'center', padding:40, color:'var(--text-muted)' }}>Loading...</td></tr>
                : clients.map(c => (
                <tr key={c.id}>
                  <td>
                    <div className="font-bold">{c.first_name} {c.last_name}</div>
                    <div style={{ fontSize:11, color:'var(--text-muted)' }}>{c.national_id || '—'}</div>
                  </td>
                  <td className="font-mono">{c.phone_primary}</td>
                  <td>
                    <div>{c.business_name || '—'}</div>
                    <div style={{ fontSize:11, color:'var(--text-muted)' }}>{c.business_type}</div>
                  </td>
                  <td>{c.staff_name}</td>
                  <td>
                    {c.credit_score ? (
                      <div className="flex items-center gap-2">
                        <span style={{ fontWeight:700 }}>{c.credit_score}</span>
                        <span className={`badge ${gradeColor[c.credit_grade] || ''}`}>{c.credit_grade}</span>
                      </div>
                    ) : <span style={{ color:'var(--text-muted)' }}>—</span>}
                  </td>
                  <td>{c.active_loans || 0}</td>
                  <td>
                    {c.home_latitude
                      ? <span className="badge badge-active"><MapPin size={10} /> GPS</span>
                      : <span className="badge badge-delinquent">No GPS</span>}
                  </td>
                  <td>
                    <button className="btn btn-secondary btn-sm" onClick={() => { setSelected(c); setShowModal(true); }}>
                      <Eye size={12} /> View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <ClientModal
          client={selected}
          onClose={() => setShowModal(false)}
          onSaved={() => { setShowModal(false); load(); }}
        />
      )}
    </div>
  );
}
