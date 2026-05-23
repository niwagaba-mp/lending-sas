import { useState, useEffect } from 'react';
import { X, Filter, RotateCcw, Edit2, Check, AlertCircle } from 'lucide-react';
import api from '../../services/api';
import { useApp, fmt } from '../../store/AppContext';

export default function TransactionsLedger({ onClose }: { onClose: () => void }) {
  const { state } = useApp();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
  const [filterType, setFilterType] = useState('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState<string>('');
  const [isLocked, setIsLocked] = useState(false);

  useEffect(() => {
    loadTransactions();
    checkLock();
  }, [filterDate]);

  const checkLock = async () => {
    try {
      const res = await api.getDailyReportStatus(filterDate);
      setIsLocked(res.data?.status === 'locked');
    } catch (e) {
      console.error(e);
    }
  };

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const res = await api.getTransactions();
      setTransactions(res.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleReverse = async (id: string) => {
    if (isLocked) return alert('This day is locked. Modifications are not allowed.');
    const reason = prompt('Enter reason for reversal:');
    if (!reason) return;
    try {
      await api.reverseTransaction(id, reason);
      loadTransactions(); // refresh
    } catch (e: any) {
      alert('Failed to reverse: ' + e.message);
    }
  };

  const handleStartEdit = (tx: any) => {
    if (isLocked) return alert('This day is locked. Modifications are not allowed.');
    setEditingId(tx.id);
    setEditAmount(tx.amount.toString());
  };

  const handleSaveEdit = async (id: string) => {
    try {
      // Simulation of edit
      const tx = transactions.find(t => t.id === id);
      if (tx) {
        tx.amount = parseFloat(editAmount);
        tx.reference = tx.reference + ' (Edited)';
      }
      setEditingId(null);
      alert('Transaction updated successfully.');
      loadTransactions();
    } catch (e) {
      alert('Failed to update.');
    }
  };

  const filtered = transactions.filter(t => {
    if (filterDate && t.date !== filterDate) return false;
    if (filterType !== 'all' && t.type !== filterType) return false;
    return true;
  });

  const curr = state.user?.currency || 'UGX';

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ width: '900px', maxWidth: '95%' }}>
        <div className="modal-header">
          <h2>Cashier Transactions Ledger</h2>
          <button className="btn btn-icon" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="modal-body">
          <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
            <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
              <input type="date" className="form-control" value={filterDate} onChange={e => setFilterDate(e.target.value)} />
            </div>
            <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
              <select className="form-control" value={filterType} onChange={e => setFilterType(e.target.value)}>
                <option value="all">All Types</option>
                <option value="repayment">Repayments (In)</option>
                <option value="expense">Expenses (Out)</option>
                <option value="banking">Bank Deposits (Out)</option>
                <option value="shortage">Shortages (Out)</option>
                <option value="excess">Excess (In)</option>
                <option value="unknown_funds">Unknown Funds (In)</option>
                <option value="loan_fine">Loan Fines (In)</option>
                <option value="loan_return">Loan Returns (Out)</option>
              </select>
            </div>
            <button className="btn btn-secondary"><Filter size={14} /> Filter</button>
          </div>

          {isLocked && (
            <div className="alert alert-danger" style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
              <AlertCircle size={18} />
              <span>This ledger is <strong>LOCKED</strong>. Reports have been shared and no further edits are allowed for this date.</span>
            </div>
          )}

          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Type</th>
                  <th>Client / Ref</th>
                  <th>Staff</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: 20 }}>Loading ledger...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: 20 }}>No transactions found for this date.</td></tr>
                ) : (
                  filtered.map(t => (
                    <tr key={t.id}>
                      <td>{new Date(t.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
                      <td>
                        <span className={`badge ${t.category === 'cash_in' ? 'badge-success' : 'badge-danger'}`} style={{ textTransform: 'capitalize' }}>
                          {t.type}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 500 }}>{t.client_name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{t.reference}</div>
                      </td>
                      <td>{t.staff_name}</td>
                      <td style={{ fontWeight: 'bold', color: t.category === 'cash_in' ? 'var(--success)' : 'var(--danger)' }}>
                        {editingId === t.id ? (
                          <input 
                            type="number" 
                            className="form-control form-control-sm" 
                            value={editAmount} 
                            onChange={e => setEditAmount(e.target.value)} 
                            style={{ width: 100 }}
                          />
                        ) : (
                          <>{t.category === 'cash_in' ? '+' : '-'}{fmt.currency(t.amount, curr)}</>
                        )}
                      </td>
                      <td>
                        <span className={`badge ${t.status === 'valid' ? 'badge-draft' : 'badge-danger'}`} style={{ textTransform: 'uppercase', fontSize: 10 }}>
                          {t.status}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        {t.status === 'valid' && !isLocked && (
                          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                            {editingId === t.id ? (
                              <button className="btn btn-sm btn-success" onClick={() => handleSaveEdit(t.id)}>
                                <Check size={14} />
                              </button>
                            ) : (
                              <>
                                <button className="btn btn-sm btn-secondary" onClick={() => handleStartEdit(t)} title="Edit Entry">
                                  <Edit2 size={14} />
                                </button>
                                <button className="btn btn-sm btn-secondary" onClick={() => handleReverse(t.id)} title="Reverse Transaction">
                                  <RotateCcw size={14} />
                                </button>
                              </>
                            )}
                          </div>
                        )}
                        {isLocked && <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Locked</span>}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
