import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import api from '../../services/api';

type TxType = 'banking' | 'shortage' | 'excess' | 'unknown_funds' | 'loan_fine' | 'loan_return' | 'expense';

export default function GenericTransactionModal({ type, onClose }: { type: TxType, onClose: () => void }) {
  const [amount, setAmount] = useState('');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  
  const [staffList, setStaffList] = useState<any[]>([]);
  const [clientList, setClientList] = useState<any[]>([]);
  const [loanList, setLoanList] = useState<any[]>([]);
  
  const [selectedStaff, setSelectedStaff] = useState('');
  const [selectedClient, setSelectedClient] = useState('');
  const [selectedLoan, setSelectedLoan] = useState('');
  const [expenseCategory, setExpenseCategory] = useState('operational');

  useEffect(() => {
    api.getStaff().then(res => setStaffList(res.data));
    if (['excess', 'loan_fine', 'loan_return', 'shortage'].includes(type)) {
      api.getClients().then(res => setClientList(res.data));
    }
  }, [type]);

  useEffect(() => {
    if (selectedClient) {
      api.getLoans(`client_id=${selectedClient}`).then(res => {
        const allLoans = res.data || [];
        const filteredLoans = allLoans.filter((l: any) =>
          Number(l.outstanding_balance) > 0 &&
          !['closed', 'written_off', 'draft', 'pending_approval', 'approved'].includes(l.status)
        );
        setLoanList(filteredLoans);
      });
    }
  }, [selectedClient, type]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (type === 'expense') {
        await api.createExpense({
          category: expenseCategory,
          amount: Number(amount),
          description: notes,
          staff_id: selectedStaff,
          expense_date: new Date().toISOString().split('T')[0]
        });
      } else {
        await api.recordMiscTransaction({
          type,
          amount: Number(amount),
          reference,
          notes,
          staff_id: selectedStaff,
          client_id: selectedClient,
          loan_id: selectedLoan,
        });
      }
      alert(`Successfully recorded ${type.replace('_', ' ')} of ${amount}`);
      onClose();
    } catch (err: any) {
      alert('Failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const getTitle = () => {
    const titles: Record<TxType, string> = {
      banking: 'Bank Deposit / Banking',
      shortage: 'Staff Shortage',
      excess: 'Cash Excess (Staff/Client)',
      unknown_funds: 'Unknown Funds Received',
      loan_fine: 'Add Loan Fine / Penalty',
      loan_return: 'Loan Return / Cancellation',
      expense: 'Log Operational Expense'
    };
    return titles[type] || 'Transaction';
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ width: '450px' }}>
        <div className="modal-header">
          <h2>{getTitle()}</h2>
          <button className="btn btn-icon" onClick={onClose}><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          <div className="form-group">
            <label className="form-label">Amount (UGX) *</label>
            <input 
              type="number" 
              className="form-control" 
              value={amount} 
              onChange={e => setAmount(e.target.value.replace(/^0+(?=\d)/, ''))} 
              onFocus={e => e.target.select()}
              required 
            />
          </div>

          {type === 'expense' && (
            <div className="form-group">
              <label className="form-label">Expense Category *</label>
              <select className="form-control" value={expenseCategory} onChange={e => setExpenseCategory(e.target.value)} required>
                {['transport','airtime','recovery','operational','other'].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          )}

          {['shortage', 'excess', 'unknown_funds', 'expense'].includes(type) && (
            <div className="form-group">
              <label className="form-label">Related Staff *</label>
              <select className="form-control" value={selectedStaff} onChange={e => setSelectedStaff(e.target.value)} required>
                <option value="">Select Staff Member...</option>
                {staffList.map(s => <option key={s.id} value={s.id}>{s.first_name} {s.last_name} ({s.role})</option>)}
              </select>
            </div>
          )}

          {['excess', 'loan_fine', 'loan_return', 'shortage'].includes(type) && (
            <div className="form-group">
              <label className="form-label">Related Client</label>
              <select className="form-control" value={selectedClient} onChange={e => setSelectedClient(e.target.value)}>
                <option value="">Select Client...</option>
                {clientList.map(c => <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>)}
              </select>
            </div>
          )}

          {['loan_fine', 'loan_return', 'shortage'].includes(type) && selectedClient && (
            <div className="form-group">
              <label className="form-label">Select Loan *</label>
              <select className="form-control" value={selectedLoan} onChange={e => setSelectedLoan(e.target.value)} required>
                <option value="">Select Loan...</option>
                {loanList.map(l => <option key={l.id} value={l.id}>{l.loan_number} - Bal: {l.outstanding_balance}</option>)}
              </select>
            </div>
          )}

          {type !== 'expense' && (
            <div className="form-group">
              <label className="form-label">Reference / Slip Number</label>
              <input 
                type="text" 
                className="form-control" 
                value={reference} 
                onChange={e => setReference(e.target.value)} 
                placeholder="e.g. SLIP-12345"
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Notes / Reason</label>
            <textarea 
              className="form-control" 
              rows={3} 
              value={notes} 
              onChange={e => setNotes(e.target.value)} 
              placeholder="Provide details for accountability..."
            />
          </div>

          <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} style={{ flex: 1 }}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ flex: 1 }}>
              {loading ? 'Processing...' : 'Confirm Entry'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
