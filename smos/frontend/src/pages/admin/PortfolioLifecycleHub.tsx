import { useState, useEffect } from 'react';
import { 
  Search, TrendingUp, RefreshCcw, AlertCircle, X
} from 'lucide-react';
import api from '../../services/api';
import { useApp, fmt } from '../../store/AppContext';

export default function PortfolioLifecycleHub() {
  const { state } = useApp();
  const [loans, setLoans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedLoan, setSelectedLoan] = useState<any>(null);
  const [overrideForm, setOverrideForm] = useState({
    status: '',
    balance_adjustment: '',
    reason: ''
  });

  const curr = state.user?.currency || 'UGX';

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.getLoans();
      setLoans(res.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleOverride = async () => {
    if (!selectedLoan || !overrideForm.reason) return alert('Please provide a reason for the override.');
    if (!confirm(`CRITICAL OVERRIDE: Are you sure you want to manually modify loan ${selectedLoan.loan_number}?`)) return;
    
    try {
      // Mock API call
      alert(`Loan ${selectedLoan.loan_number} updated: Status -> ${overrideForm.status}, Balance -> ${overrideForm.balance_adjustment}`);
      setSelectedLoan(null);
      load();
    } catch (e) { console.error(e); }
  };

  const filtered = loans.filter(l => 
    !search || 
    l.loan_number?.toLowerCase().includes(search.toLowerCase()) || 
    l.client_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="page-content" style={{ maxWidth: 1400, margin: '0 auto' }}>
      
      <div className="page-header">
        <div>
          <h2 className="page-title">Portfolio Lifecycle Overrides</h2>
          <p className="page-subtitle">Manual authority tools for status forcing, balance corrections, and renewals.</p>
        </div>
        <div className="search-bar" style={{ minWidth: 350 }}>
          <Search size={14} />
          <input placeholder="Search loan number or client name..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="grid-2" style={{ gridTemplateColumns: '1fr 420px', gap: 24 }}>
        
        <main className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Loan Ref</th><th>Client</th><th>Maturity</th><th>Balance</th><th>Status</th><th>Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40 }}>Searching portfolio...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No matching loans found.</td></tr>
                ) : filtered.map(l => (
                  <tr key={l.id}>
                    <td className="font-bold">{l.loan_number}</td>
                    <td>{l.client_name}</td>
                    <td style={{ fontSize: 11 }}>{fmt.date(l.maturity_date)}</td>
                    <td className="font-bold">{fmt.currency(l.outstanding_balance, curr)}</td>
                    <td><span className={`badge badge-${l.performance_category?.toLowerCase() || 'active'}`}>{l.performance_category || 'ACTIVE'}</span></td>
                    <td>
                      <button className="btn btn-secondary btn-sm" onClick={() => {
                        setSelectedLoan(l);
                        setOverrideForm({ status: l.performance_category, balance_adjustment: l.outstanding_balance, reason: '' });
                      }}>
                        Override
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </main>

        <aside>
          {selectedLoan ? (
            <div className="card" style={{ borderTop: '4px solid var(--accent)' }}>
              <div className="card-header">
                <h3 className="card-title">Manual Override: {selectedLoan.loan_number}</h3>
                <button className="btn btn-icon btn-secondary btn-sm" onClick={() => setSelectedLoan(null)}><X size={14} /></button>
              </div>

              <div style={{ background: 'var(--bg-secondary)', padding: 12, borderRadius: 8, marginBottom: 20 }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Current Portfolio State</div>
                <div style={{ display: 'flex', gap: 16 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>{selectedLoan.performance_category || 'ACTIVE'}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>STATUS</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>{fmt.currency(selectedLoan.outstanding_balance, curr)}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>BALANCE</div>
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Force Performance Category</label>
                <select className="form-control" value={overrideForm.status} onChange={e => setOverrideForm({...overrideForm, status: e.target.value})}>
                  <option value="ACTIVE">ACTIVE (In Maturity)</option>
                  <option value="DEFAULTED">DEFAULTED (Arrears &gt; 2x Maturity)</option>
                  <option value="DORMANT">DORMANT (15+ Missed Installments)</option>
                  <option value="WRITTEN_OFF">WRITTEN_OFF (Unrecoverable)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Manual Balance Correction</label>
                <div className="flex gap-2">
                  <span style={{ alignSelf: 'center', fontWeight: 700 }}>{curr}</span>
                  <input 
                    className="form-control" 
                    type="number" 
                    value={overrideForm.balance_adjustment} 
                    onChange={e => setOverrideForm({...overrideForm, balance_adjustment: e.target.value})} 
                  />
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>
                  Adjusting balance will skip payment rules and hard-set the debt.
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Authority Reason (Audit Log) *</label>
                <textarea 
                  className="form-control" 
                  rows={3} 
                  placeholder="Explain why this manual override is necessary..."
                  value={overrideForm.reason}
                  onChange={e => setOverrideForm({...overrideForm, reason: e.target.value})}
                  required
                />
              </div>

              <div style={{ background: 'rgba(239, 68, 68, 0.05)', padding: 12, borderRadius: 8, marginBottom: 20, border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', color: 'var(--red)', marginBottom: 6 }}>
                  <AlertCircle size={16} />
                  <span style={{ fontSize: 12, fontWeight: 700 }}>Authority Confirmation</span>
                </div>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  This action will be logged under your supervisor ID. It affects institutional P&L and credit history.
                </p>
              </div>

              <button className="btn btn-primary w-full" style={{ background: 'var(--accent)', color: 'black' }} onClick={handleOverride}>
                 Apply Lifecycle Override
              </button>
            </div>
          ) : (
            <div className="card" style={{ textAlign: 'center', padding: '60px 20px', borderStyle: 'dashed' }}>
              <RefreshCcw size={32} color="var(--border)" style={{ marginBottom: 12 }} />
              <h4 style={{ color: 'var(--text-secondary)' }}>Select a loan to override</h4>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>
                Use the list on the left to select a loan for manual status reclassification or balance correction.
              </p>
            </div>
          )}

          <div className="card mt-4" style={{ padding: 16 }}>
            <h4 style={{ fontSize: 12, fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <TrendingUp size={14} color="var(--accent)" /> Renewal & Restructuring
            </h4>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 12 }}>
              Expired loans can be renewed into new contracts with updated terms and interest.
            </p>
            <button className="btn btn-secondary btn-sm w-full">Open Renewal Console</button>
          </div>
        </aside>

      </div>
    </div>
  );
}
