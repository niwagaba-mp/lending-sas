import { useState, useEffect } from 'react';
import { X, RotateCcw, Edit2, Trash2, Check, ArrowUpCircle, ArrowDownCircle, Search, Users, DollarSign } from 'lucide-react';
import api from '../../services/api';
import { useApp, fmt } from '../../store/AppContext';

export default function CashierTransactionModal({ onClose }: { onClose: () => void }) {
  const { state } = useApp();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStaff, setFilterStaff] = useState('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<any>({});
  
  const curr = state.user?.currency || 'UGX';
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => { 
    load();
    loadStaff();
  }, [filterType]);

  const loadStaff = async () => {
    try {
      const res = await api.getStaff();
      setStaffList(res.data || []);
    } catch (e) { console.error(e); }
  };

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('from_date', today);
      if (filterType !== 'all') params.append('type', filterType);
      
      const res = await api.getTransactions(params.toString());
      setTransactions(res.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const filtered = transactions.filter(t => {
    const matchesSearch = !search || 
      t.client_name?.toLowerCase().includes(search.toLowerCase()) || 
      t.reference?.toLowerCase().includes(search.toLowerCase()) ||
      t.staff_name?.toLowerCase().includes(search.toLowerCase());
    
    const matchesStaff = filterStaff === 'all' || t.staff_name === filterStaff;
    
    return matchesSearch && matchesStaff;
  });

  // Calculate summaries from filtered valid transactions
  const validFiltered = filtered.filter(t => t.status === 'valid');
  const inTx = validFiltered.filter(t => t.category === 'cash_in');
  const outTx = validFiltered.filter(t => t.category === 'cash_out');
  
  const totalIn = inTx.reduce((sum, t) => sum + parseFloat(t.amount), 0);
  const totalOut = outTx.reduce((sum, t) => sum + parseFloat(t.amount), 0);
  const netCash = totalIn - totalOut;

  // Counts
  const uniqueClientsIn = new Set(inTx.map(t => t.client_id).filter(id => !!id)).size;
  const inCount = inTx.length;
  const outCount = outTx.length;

  const handleReverse = async (tx: any) => {
    if (!confirm(`Are you sure you want to reverse this ${tx.type}? This will void the entry in the daily report.`)) return;
    const reason = prompt("Enter reason for reversal:");
    if (!reason) return;

    try {
      await api.reverseTransaction(tx.id, reason, tx.type);
      load();
    } catch (e: any) { alert(e.message); }
  };

  const handleDelete = async (tx: any) => {
    if (!confirm(`CRITICAL: Permanent Delete?\n\nThis will completely remove transaction ${tx.reference} from the records. Use this only to correct accidental double-entries.`)) return;
    try {
      await api.deleteTransaction(tx.id);
      load();
    } catch (e: any) { alert(e.message); }
  };

  const startEdit = (tx: any) => {
    setEditingId(tx.id);
    setEditData({ amount: tx.amount, reference: tx.reference });
  };

  const saveEdit = async () => {
    try {
      await api.editTransaction(editingId!, editData);
      setEditingId(null);
      load();
    } catch (e: any) { alert(e.message); }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
    }}>
      <div style={{
        background: '#161b22', border: '1px solid #30363d', borderRadius: 16,
        width: 1100, height: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>
        
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #30363d', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#1c2128' }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#f0f6fc', display: 'flex', alignItems: 'center', gap: 10 }}>
              <RotateCcw size={20} className="text-accent" /> 
              Daily Reconciliation & Audit
            </div>
            <div style={{ fontSize: 12, color: '#7d8590', marginTop: 4 }}>
              Reviewing entries for <strong>{new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</strong>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#7d8590', fontSize: 24, cursor: 'pointer' }}>✕</button>
        </div>

        {/* ── SUMMARY BAR ────────────────────────────────────── */}
        <div style={{ 
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1, 
          background: '#30363d', borderBottom: '1px solid #30363d' 
        }}>
          {[
            { label: 'Total Cash In', value: totalIn, color: '#3fb950', icon: <ArrowUpCircle size={18} />, sub: `${inCount} transactions (${uniqueClientsIn} clients)` },
            { label: 'Total Cash Out', value: totalOut, color: '#ef4444', icon: <ArrowDownCircle size={18} />, sub: `${outCount} transactions` },
            { label: 'Net Position', value: netCash, color: netCash >= 0 ? '#58a6ff' : '#f59e0b', icon: <DollarSign size={18} />, sub: `${inCount + outCount} total entries` },
          ].map(s => (
            <div key={s.label} style={{ background: '#0d1117', padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ color: s.color, background: s.color + '15', padding: 10, borderRadius: 10 }}>{s.icon}</div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#7d8590', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: s.color }}>{fmt.currency(s.value, curr)}</div>
                <div style={{ fontSize: 11, color: '#7d8590', marginTop: 2, fontWeight: 500 }}>{s.sub}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Toolbar */}
        <div style={{ padding: '12px 24px', background: '#161b22', borderBottom: '1px solid #30363d', display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#7d8590' }} />
            <input 
              type="text" 
              placeholder="Search client, reference or notes..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: '100%', background: '#0d1117', border: '1px solid #30363d', borderRadius: 8,
                padding: '8px 12px 8px 36px', color: '#e6edf3', fontSize: 13, outline: 'none'
              }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#0d1117', border: '1px solid #30363d', borderRadius: 8, padding: '0 12px' }}>
            <Users size={14} style={{ color: '#7d8590' }} />
            <select 
              value={filterStaff} 
              onChange={e => setFilterStaff(e.target.value)}
              style={{
                background: 'none', border: 'none', padding: '8px 0', color: '#e6edf3', fontSize: 13, outline: 'none', minWidth: 140
              }}
            >
              <option value="all">All Staff Members</option>
              {staffList.map(s => (
                <option key={s.id} value={`${s.first_name} ${s.last_name}`}>{s.first_name} {s.last_name}</option>
              ))}
            </select>
          </div>

          <select 
            value={filterType} 
            onChange={e => setFilterType(e.target.value)}
            style={{
              background: '#0d1117', border: '1px solid #30363d', borderRadius: 8,
              padding: '8px 12px', color: '#e6edf3', fontSize: 13, outline: 'none'
            }}
          >
            <option value="all">All Transaction Types</option>
            <option value="repayment">Repayments</option>
            <option value="expense">Expenses</option>
            <option value="misc">Misc Funds</option>
          </select>

          <button onClick={load} style={{
             background: '#21262d', border: '1px solid #30363d', borderRadius: 8,
             padding: '8px 16px', color: '#c9d1d9', fontSize: 13, cursor: 'pointer', fontWeight: 600
          }}>Refresh</button>
        </div>

        {/* Table Content */}
        <div style={{ flex: 1, overflowY: 'auto', background: '#0d1117' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead style={{ position: 'sticky', top: 0, background: '#161b22', zIndex: 1, borderBottom: '2px solid #30363d' }}>
              <tr>
                <th style={{ padding: '12px 24px', textAlign: 'left', color: '#7d8590', fontWeight: 600 }}>TIME / REF</th>
                <th style={{ padding: '12px 24px', textAlign: 'left', color: '#7d8590', fontWeight: 600 }}>TYPE</th>
                <th style={{ padding: '12px 24px', textAlign: 'left', color: '#7d8590', fontWeight: 600 }}>CLIENT / DESCRIPTION</th>
                <th style={{ padding: '12px 24px', textAlign: 'right', color: '#7d8590', fontWeight: 600 }}>AMOUNT</th>
                <th style={{ padding: '12px 24px', textAlign: 'center', color: '#7d8590', fontWeight: 600 }}>STATUS</th>
                <th style={{ padding: '12px 24px', textAlign: 'right', color: '#7d8590', fontWeight: 600 }}>AUDIT ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} style={{ padding: 40, textAlign: 'center', color: '#7d8590' }}>Fetching transaction logs...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} style={{ padding: 40, textAlign: 'center', color: '#7d8590' }}>No transactions found for the selected criteria.</td></tr>
              ) : (
                filtered.map(t => (
                  <tr key={t.id} style={{ 
                    borderBottom: '1px solid #21262d', 
                    background: t.status === 'reversed' ? '#ef444405' : 'transparent',
                    opacity: t.status === 'reversed' ? 0.7 : 1
                  }}>
                    <td style={{ padding: '14px 24px' }}>
                      <div style={{ fontWeight: 600 }}>{new Date(t.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                      <div style={{ fontSize: 11, color: '#7d8590', marginTop: 2 }}>{t.reference}</div>
                    </td>
                    <td style={{ padding: '14px 24px' }}>
                      <div style={{ 
                        display: 'inline-flex', alignItems: 'center', gap: 6, 
                        background: t.category === 'cash_in' ? '#3fb95015' : '#ef444415',
                        color: t.category === 'cash_in' ? '#3fb950' : '#ef4444',
                        padding: '4px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700, textTransform: 'uppercase'
                      }}>
                        {t.category === 'cash_in' ? <ArrowUpCircle size={12} /> : <ArrowDownCircle size={12} />}
                        {t.type.replace('_', ' ')}
                      </div>
                    </td>
                    <td style={{ padding: '14px 24px' }}>
                      <div style={{ fontWeight: 600, color: '#f0f6fc' }}>{t.client_name || '—'}</div>
                      <div style={{ fontSize: 11, color: '#7d8590', marginTop: 2 }}>Recorded by: {t.staff_name}</div>
                    </td>
                    <td style={{ padding: '14px 24px', textAlign: 'right' }}>
                      {editingId === t.id ? (
                        <input 
                          type="number" 
                          value={editData.amount} 
                          onChange={e => setEditData({...editData, amount: e.target.value})}
                          style={{ width: 120, background: '#0d1117', border: '1px solid #3fb950', color: 'white', padding: '4px 8px', borderRadius: 4, textAlign: 'right' }}
                        />
                      ) : (
                        <div style={{ fontWeight: 700, color: t.status === 'reversed' ? '#7d8590' : (t.category === 'cash_in' ? '#3fb950' : '#ef4444'), textDecoration: t.status === 'reversed' ? 'line-through' : 'none' }}>
                          {t.category === 'cash_in' ? '+' : '-'}{fmt.currency(t.amount, curr)}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '14px 24px', textAlign: 'center' }}>
                       <span style={{ 
                         fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 10,
                         background: t.status === 'valid' ? '#3fb95020' : '#ef444420',
                         color: t.status === 'valid' ? '#3fb950' : '#ef4444',
                         border: `1px solid ${t.status === 'valid' ? '#3fb95044' : '#ef444444'}`
                       }}>
                         {t.status.toUpperCase()}
                       </span>
                    </td>
                    <td style={{ padding: '14px 24px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                        {(() => {
                          const isAdmin = state.user?.role === 'admin';
                          const isSup = state.user?.role === 'branch_manager' || isAdmin;
                          const isPastDate = t.date !== today;

                          if (editingId === t.id) {
                            return (
                              <>
                                <button onClick={saveEdit} style={{ background: '#238636', border: 'none', color: 'white', padding: '6px', borderRadius: 6, cursor: 'pointer' }}><Check size={14} /></button>
                                <button onClick={() => setEditingId(null)} style={{ background: '#30363d', border: 'none', color: '#7d8590', padding: '6px', borderRadius: 6, cursor: 'pointer' }}><X size={14} /></button>
                              </>
                            );
                          }

                          if (t.status === 'valid') {
                            const canEditOrReverse = isAdmin || isSup || (!isPastDate); // Allowed for today
                            
                            return (
                              <>
                                <button 
                                  onClick={() => startEdit(t)} 
                                  disabled={!canEditOrReverse}
                                  title={isPastDate && !isAdmin ? "Only Admin can edit past dates" : "Edit Amount (allowed before EOD)"} 
                                  style={{ background: 'none', border: '1px solid #30363d', color: canEditOrReverse ? '#7d8590' : '#30363d', padding: '6px', borderRadius: 6, cursor: canEditOrReverse ? 'pointer' : 'not-allowed' }}
                                >
                                  <Edit2 size={14} />
                                </button>
                                <button 
                                  onClick={() => handleReverse(t)} 
                                  disabled={!canEditOrReverse}
                                  title={isPastDate && !isAdmin ? "Only Admin can reverse past dates" : "Reverse Transaction"} 
                                  style={{ background: 'none', border: '1px solid #30363d', color: canEditOrReverse ? '#ef4444' : '#30363d', padding: '6px', borderRadius: 6, cursor: canEditOrReverse ? 'pointer' : 'not-allowed' }}
                                >
                                  <RotateCcw size={14} />
                                </button>
                                <button 
                                  onClick={() => handleDelete(t)} 
                                  disabled={!isAdmin}
                                  title={!isAdmin ? "Only Admin can permanently delete" : "Delete (Hard)"} 
                                  style={{ background: 'none', border: '1px solid #30363d', color: isAdmin ? '#f43f5e' : '#30363d', padding: '6px', borderRadius: 6, cursor: isAdmin ? 'pointer' : 'not-allowed' }}
                                >
                                  <Trash2 size={14} />
                                </button>
                              </>
                            );
                          }
                          return null;
                        })()}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info */}
        <div style={{ padding: '12px 24px', background: '#1c2128', borderTop: '1px solid #30363d', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 12, color: '#7d8590' }}>
             Total Records: <strong>{filtered.length}</strong> | Valid: <strong>{filtered.filter(t => t.status === 'valid').length}</strong> | Reversed: <strong>{filtered.filter(t => t.status === 'reversed').length}</strong>
          </div>
          <button onClick={onClose} style={{ background: '#21262d', border: '1px solid #30363d', color: '#c9d1d9', padding: '8px 24px', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>Close Auditor</button>
        </div>
      </div>
    </div>
  );
}
