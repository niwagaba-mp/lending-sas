import { useState, useEffect } from 'react';
import { X, Search, RotateCcw, Edit2, Check, ArrowUpCircle, ArrowDownCircle, Info, History } from 'lucide-react';
import api from '../../services/api';
import { useApp, fmt } from '../../store/AppContext';

export default function TransactionsHistory() {
  const { state } = useApp();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<any>({});
  const [showAudit, setShowAudit] = useState<string | null>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [filterStaff, setFilterStaff] = useState('all');

  useEffect(() => {
    loadTransactions();
    api.getStaff().then(res => setStaffList(res.data || []));
  }, [filterDateFrom, filterDateTo, filterType, filterStaff]);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterDateFrom) params.append('from_date', filterDateFrom);
      if (filterDateTo) params.append('to_date', filterDateTo);
      if (filterType !== 'all') params.append('type', filterType);
      if (filterStaff !== 'all') params.append('staff_id', filterStaff);
      if (search) params.append('search', search);

      const res = await api.getTransactions(params.toString());
      setTransactions(res.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleReverse = async (tx: any) => {
    const reason = prompt(`Reason for reversing ${tx.type} (${tx.reference})?`);
    if (!reason) return;

    try {
      await api.reverseTransaction(tx.id, reason, tx.type);
      alert('Transaction reversed successfully.');
      loadTransactions();
    } catch (e: any) {
      alert('Failed to reverse: ' + e.message);
    }
  };

  const handleStartEdit = (tx: any) => {
    setEditingId(tx.id);
    setEditData({ amount: tx.amount, date: tx.date, notes: tx.notes, type: tx.type });
  };

  const handleSaveEdit = async () => {
    try {
      await api.editTransaction(editingId!, editData);
      setEditingId(null);
      alert('Transaction updated successfully.');
      loadTransactions();
    } catch (e: any) {
      alert('Failed to update: ' + e.message);
    }
  };

  const fetchAudit = async (tx: any) => {
    try {
      const res = await api.getAuditLog(`entity_type=${tx.type}&entity_id=${tx.id}`);
      setAuditLogs(res.data || []);
      setShowAudit(tx.id);
    } catch (e) {
      console.error(e);
    }
  };

  const curr = state.user?.currency || 'UGX';

  const validTx = transactions.filter(t => t.status === 'valid');
  const totalIn = validTx.filter(t => t.category === 'cash_in').reduce((s, t) => s + parseFloat(t.amount), 0);
  const totalOut = validTx.filter(t => t.category === 'cash_out').reduce((s, t) => s + parseFloat(t.amount), 0);
  const netCash = totalIn - totalOut;

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Transactions History</h1>
          <p className="page-subtitle">Unified financial audit trail for all inflows and outflows.</p>
        </div>
        <div className="header-actions">
           <button className="btn btn-secondary" onClick={loadTransactions}>
             <History size={16} /> Refresh
           </button>
        </div>
      </div>
      
      {/* ── SUMMARY STATS ─────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Total Inflows', value: totalIn, color: '#3fb950', icon: <ArrowUpCircle size={20} /> },
          { label: 'Total Outflows', value: totalOut, color: '#f85149', icon: <ArrowDownCircle size={20} /> },
          { label: 'Net Position', value: netCash, color: netCash >= 0 ? '#58a6ff' : '#f59e0b', icon: <History size={20} /> },
          { label: 'Entries Found', value: transactions.length, color: '#7d8590', icon: <History size={20} />, raw: true },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding: '16px 20px', borderLeft: `4px solid ${s.color}` }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#7d8590', textTransform: 'uppercase' }}>{s.label}</div>
                <div style={{ color: s.color }}>{s.icon}</div>
             </div>
             <div style={{ fontSize: 22, fontWeight: 800, color: s.color, marginTop: 4 }}>
               {s.raw ? s.value : fmt.currency(s.value, curr)}
             </div>
          </div>
        ))}
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="form-group mb-0">
              <label className="form-label">Type</label>
              <select className="form-control" value={filterType} onChange={e => setFilterType(e.target.value)}>
                <option value="all">All Transactions</option>
                <option value="repayment">Repayments (Inflow)</option>
                <option value="expense">Expenses (Outflow)</option>
                <option value="disbursement">Disbursements (Outflow)</option>
                <option value="misc">Misc Adjustments</option>
              </select>
            </div>
            <div className="form-group mb-0">
              <label className="form-label">Staff Member</label>
              <select className="form-control" value={filterStaff} onChange={e => setFilterStaff(e.target.value)}>
                <option value="all">All Employees</option>
                {staffList.map(s => (
                  <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>
                ))}
              </select>
            </div>
            <div className="form-group mb-0">
              <label className="form-label">From Date</label>
              <input type="date" className="form-control" value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)} />
            </div>
            <div className="form-group mb-0">
              <label className="form-label">To Date</label>
              <input type="date" className="form-control" value={filterDateTo} onChange={e => setFilterDateTo(e.target.value)} />
            </div>
          </div>
          <div className="form-group mb-0 mt-4">
            <label className="form-label">Search Reference / Client</label>
            <div style={{ position: 'relative' }}>
              <input 
                type="text" 
                className="form-control" 
                placeholder="Reference, Notes, Client Name..." 
                value={search}
                onChange={e => setSearch(e.target.value)}
                onKeyPress={e => e.key === 'Enter' && loadTransactions()}
              />
              <Search size={16} style={{ position: 'absolute', right: 12, top: 12, color: 'var(--text-muted)' }} />
            </div>
          </div>
        </div>
      </div>
      <div className="card">
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>Date / Time</th>
                <th>Type</th>
                <th>Reference / Client</th>
                <th>Staff / Branch</th>
                <th style={{ textAlign: 'right' }}>Amount</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-8">Loading transactions...</td></tr>
              ) : transactions.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-8 text-muted">No transactions found matching filters.</td></tr>
              ) : (
                transactions.map(t => (
                  <tr key={t.id} className={t.status === 'reversed' ? 'bg-muted/30' : ''}>
                    <td>
                      <div style={{ fontWeight: 500 }}>{t.date}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        {new Date(t.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td>
                      <div className={`badge ${t.category === 'cash_in' ? 'badge-success' : 'badge-danger'}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        {t.category === 'cash_in' ? <ArrowUpCircle size={12} /> : <ArrowDownCircle size={12} />}
                        {t.type}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{t.reference}</div>
                      <div style={{ fontSize: 12, color: 'var(--primary)' }}>{t.client_name}</div>
                    </td>
                    <td>
                      <div>{t.staff_name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{t.branch_name}</div>
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 'bold' }}>
                      {editingId === t.id ? (
                        <input 
                          type="number" 
                          className="form-control form-control-sm" 
                          value={editData.amount} 
                          onChange={e => setEditData({...editData, amount: e.target.value})}
                          style={{ width: 120, marginLeft: 'auto' }}
                        />
                      ) : (
                        <span className={t.status === 'reversed' ? 'text-line-through text-muted' : (t.category === 'cash_in' ? 'text-success' : 'text-danger')}>
                          {t.category === 'cash_in' ? '+' : '-'}{fmt.currency(t.amount, curr)}
                        </span>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${
                        t.status === 'reversed' ? 'badge-danger' : 
                        t.status === 'valid' ? 'badge-success' : 'badge-draft'
                      }`}>
                        {t.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                        {editingId === t.id ? (
                          <>
                            <button className="btn btn-sm btn-success" onClick={handleSaveEdit}><Check size={14} /></button>
                            <button className="btn btn-sm btn-secondary" onClick={() => setEditingId(null)}><X size={14} /></button>
                          </>
                        ) : (
                          <>
                            <button className="btn btn-icon-sm" onClick={() => fetchAudit(t)} title="View Audit Trail"><Info size={14} /></button>
                            {t.status === 'valid' && (
                              <>
                                <button className="btn btn-icon-sm" onClick={() => handleStartEdit(t)} title="Edit"><Edit2 size={14} /></button>
                                <button className="btn btn-icon-sm text-danger" onClick={() => handleReverse(t)} title="Reverse"><RotateCcw size={14} /></button>
                              </>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showAudit && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: 600 }}>
            <div className="modal-header">
              <h3>Audit Trail</h3>
              <button className="btn btn-icon" onClick={() => setShowAudit(null)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              {auditLogs.length === 0 ? (
                <p className="text-center py-4 text-muted">No audit history for this transaction.</p>
              ) : (
                <div className="audit-timeline">
                  {auditLogs.map((log) => (
                    <div key={log.id} className="audit-item" style={{ padding: '12px 0', borderBottom: '1px solid var(--border)', position: 'relative' }}>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{log.action.replace('.', ' ')}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        By {log.user_name} on {new Date(log.created_at).toLocaleString()}
                      </div>
                      {log.new_values?.reversal_reason && (
                        <div style={{ marginTop: 8, padding: 8, background: 'var(--danger-light)', borderRadius: 4, fontSize: 13 }}>
                          <strong>Reason:</strong> {log.new_values.reversal_reason}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
