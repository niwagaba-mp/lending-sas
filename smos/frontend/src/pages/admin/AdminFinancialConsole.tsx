import { useState, useEffect } from 'react';
import { 
  RotateCcw, Edit2, Trash2, Search, 
  Calendar, Lock, Unlock, Landmark, AlertTriangle
} from 'lucide-react';
import api from '../../services/api';
import { useApp, fmt } from '../../store/AppContext';

export default function AdminFinancialConsole() {
  const { state } = useApp();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [search, setSearch] = useState('');
  const [dayStatus, setDayStatus] = useState<any>(null);
  const [openingBalance, setOpeningBalance] = useState(450000); // Mock
  
  const curr = state.user?.currency || 'UGX';

  useEffect(() => {
    load();
  }, [date]);

  const load = async () => {
    setLoading(true);
    try {
      const [txRes, lockRes] = await Promise.all([
        api.getTransactions(`date=${date}`),
        api.getDailyReportStatus(date)
      ]);
      setTransactions(txRes.data || []);
      setDayStatus(lockRes.data || { status: 'open', opening_balance: 450000 });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleHardDelete = async (id: string) => {
    if (!confirm('CRITICAL: Permanent Delete?\nThis removes the transaction entirely from the ledger. This action is immutable.')) return;
    try {
      await api.deleteTransaction(id);
      load();
    } catch (e: any) { alert(e.message); }
  };

  const toggleDayLock = async () => {
    const newStatus = dayStatus?.status === 'locked' ? 'open' : 'locked';
    if (!confirm(`Are you sure you want to ${newStatus.toUpperCase()} transactions for ${date}?`)) return;
    
    try {
      // In a real app, this would be api.updateDayStatus(date, newStatus)
      setDayStatus({ ...dayStatus, status: newStatus });
      alert(`Day ${newStatus} successfully.`);
    } catch (e) { console.error(e); }
  };

  const filtered = transactions.filter(t => 
    !search || 
    t.client_name?.toLowerCase().includes(search.toLowerCase()) || 
    t.reference?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="page-content" style={{ maxWidth: 1400, margin: '0 auto' }}>
      
      {/* ── HEADER & DATE SELECT ────────────────────────── */}
      <div className="page-header">
        <div>
          <h2 className="page-title">Advanced Financial Auditor</h2>
          <p className="page-subtitle">Supervisor console for historical corrections, day-locking, and balance adjustments.</p>
        </div>
        <div className="flex gap-2 items-center">
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: '4px 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <Calendar size={14} color="var(--text-muted)" />
            <input 
              type="date" 
              value={date} 
              onChange={e => setDate(e.target.value)}
              style={{ background: 'none', border: 'none', color: 'var(--text-primary)', fontSize: 13, outline: 'none', padding: '6px 0' }} 
            />
          </div>
          <button className="btn btn-secondary" onClick={load}><RotateCcw size={14} /></button>
        </div>
      </div>

      <div className="grid-2" style={{ gridTemplateColumns: '1fr 340px', gap: 24 }}>
        
        <main>
          {/* ── RECONCILIATION TABLE ───────────────────────── */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 12, alignItems: 'center' }}>
              <div className="search-bar" style={{ flex: 1 }}>
                <Search size={14} />
                <input placeholder="Search transaction ID, client, or reference..." value={search} onChange={e => setSearch(e.target.value)} />
              </div>
            </div>

            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Ref / Time</th><th>Category</th><th>Details</th><th>Amount</th><th>Status</th><th>Hard Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40 }}>Loading audit logs...</td></tr>
                  ) : filtered.length === 0 ? (
                    <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No records found for this date.</td></tr>
                  ) : filtered.map(t => (
                    <tr key={t.id} style={{ opacity: t.status === 'reversed' ? 0.6 : 1 }}>
                      <td className="font-mono" style={{ fontSize: 11 }}>
                        {t.reference}<br />
                        <span style={{ color: 'var(--text-muted)' }}>{new Date(t.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </td>
                      <td>
                        <span style={{ 
                          fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4,
                          background: t.category === 'cash_in' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                          color: t.category === 'cash_in' ? 'var(--green)' : 'var(--red)'
                        }}>
                          {t.type.toUpperCase()}
                        </span>
                      </td>
                      <td>
                        <div className="font-bold">{t.client_name || 'System Entry'}</div>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Entry by: {t.staff_name}</div>
                      </td>
                      <td className="font-bold" style={{ textAlign: 'right' }}>
                        {t.category === 'cash_in' ? '+' : '-'}{fmt.currency(t.amount, curr)}
                      </td>
                      <td>
                        <span className={`badge ${t.status === 'valid' ? 'badge-active' : 'badge-delinquent'}`}>{t.status}</span>
                      </td>
                      <td>
                        <div className="flex gap-2 justify-end">
                          <button className="btn btn-secondary btn-icon btn-sm" title="Edit Amount"><Edit2 size={12} /></button>
                          <button className="btn btn-secondary btn-icon btn-sm" style={{ color: 'var(--red)' }} title="Hard Delete" onClick={() => handleHardDelete(t.id)}><Trash2 size={12} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>

        <aside style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          
          {/* ── DAY LOCKING CONSOLE ── */}
          <div className="card" style={{ borderTop: `4px solid ${dayStatus?.status === 'locked' ? 'var(--red)' : 'var(--green)'}` }}>
            <div className="card-header">
              <h3 className="card-title">Day Status: {date}</h3>
              {dayStatus?.status === 'locked' ? <Lock size={16} color="var(--red)" /> : <Unlock size={16} color="var(--green)" />}
            </div>
            
            <div style={{ padding: '10px 0' }}>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>Current Status</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: dayStatus?.status === 'locked' ? 'var(--red)' : 'var(--green)' }}>
                {dayStatus?.status === 'locked' ? 'CLOSED & LOCKED' : 'OPEN FOR ENTRIES'}
              </div>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8, lineHeight: 1.5 }}>
                {dayStatus?.status === 'locked' 
                  ? 'Cashiers cannot add or edit any transactions for this date. Reports are finalized.' 
                  : 'Cashiers can still record payments and expenses for this date.'}
              </p>
            </div>

            <button 
              className={`btn w-full mt-4 ${dayStatus?.status === 'locked' ? 'btn-secondary' : 'btn-danger'}`}
              onClick={toggleDayLock}
              style={{ background: dayStatus?.status === 'locked' ? 'var(--green)' : 'var(--red)', color: 'white', border: 'none' }}
            >
              {dayStatus?.status === 'locked' ? <Unlock size={14} /> : <Lock size={14} />}
              {dayStatus?.status === 'locked' ? 'Unlock Day' : 'Close & Lock Day (EOD)'}
            </button>
          </div>

          {/* ── OPENING BALANCE ADJUSTER ── */}
          <div className="card">
            <h3 className="card-title" style={{ marginBottom: 12 }}><Landmark size={14} /> Branch Cash Balance</h3>
            
            <div className="form-group">
              <label className="form-label">Opening Balance (UGX)</label>
              <div className="flex gap-2">
                <input 
                  className="form-control" 
                  type="number" 
                  value={openingBalance} 
                  onChange={e => setOpeningBalance(Number(e.target.value))} 
                />
                <button className="btn btn-primary btn-sm" onClick={() => alert('Balance Updated')}>Update</button>
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 6 }}>
                Adjusting this will affect all subsequent closing balance calculations.
              </div>
            </div>

            <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Total Cash In:</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--green)' }}>+13,724,000</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Total Cash Out:</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--red)' }}>-664,000</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderTop: '2px solid var(--border)' }}>
                <span style={{ fontSize: 13, fontWeight: 700 }}>Projected Closing:</span>
                <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--accent)' }}>{fmt.currency(openingBalance + 13724000 - 664000, curr)}</span>
              </div>
            </div>
          </div>

          <div className="alert alert-warning">
            <AlertTriangle size={14} /> <strong>Caution:</strong> Actions taken here affect the final institutional ledger and financial audits.
          </div>

        </aside>

      </div>
    </div>
  );
}
