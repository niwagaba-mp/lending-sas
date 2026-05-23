import { useState } from 'react';
import { X } from 'lucide-react';
import api from '../../services/api';
import { fmt } from '../../store/AppContext';

export default function RepaymentModal({ loan, onClose, onSaved }: any) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    amount_paid: String(loan.installment_amount || ''),
    payment_method: 'cash',
    reference_number: '',
    notes: '',
    collection_latitude: '',
    collection_longitude: '',
  });

  const captureGPS = () => {
    navigator.geolocation?.getCurrentPosition(pos => {
      setForm(f => ({ ...f, collection_latitude: String(pos.coords.latitude), collection_longitude: String(pos.coords.longitude) }));
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.recordPayment({ ...form, loan_id: loan.id });
      onSaved();
    } catch (err: any) { alert(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h3 className="modal-title">Record Payment — {loan.loan_number}</h3>
          <button className="btn btn-icon btn-secondary" onClick={onClose}><X size={16} /></button>
        </div>

        <div style={{ background:'var(--bg-secondary)', borderRadius:8, padding:12, marginBottom:16 }}>
          <div className="flex justify-between">
            <div><div style={{ fontSize:11,color:'var(--text-muted)' }}>Client</div><div className="font-bold">{loan.client_name}</div></div>
            <div><div style={{ fontSize:11,color:'var(--text-muted)' }}>Outstanding</div><div className="font-bold text-warning">{fmt.currency(loan.outstanding_balance,'UGX')}</div></div>
            <div><div style={{ fontSize:11,color:'var(--text-muted)' }}>Arrears</div><div className="font-bold text-danger">{fmt.currency(loan.arrears_amount,'UGX')}</div></div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Amount Paid (UGX) *</label>
            <input className="form-control" type="number" value={form.amount_paid}
              onChange={e => setForm(f=>({...f, amount_paid: e.target.value}))} required />
          </div>

          <div style={{ background: 'var(--bg-secondary)', padding: 12, borderRadius: 8, marginBottom: 16, borderLeft: '4px solid var(--primary)' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Balance After Payment</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
              {fmt.currency(Math.max(0, (Number(loan.outstanding_balance) || 0) - (Number(form.amount_paid) || 0)), 'UGX')}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Payment Method</label>
            <select className="form-control" value={form.payment_method} onChange={e=>setForm(f=>({...f,payment_method:e.target.value}))}>
              <option value="cash">Cash</option>
              <option value="mobile_money">Mobile Money</option>
              <option value="bank">Bank Transfer</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Reference Number</label>
            <input className="form-control" value={form.reference_number} onChange={e=>setForm(f=>({...f,reference_number:e.target.value}))} />
          </div>
          <div className="form-group">
            <label className="form-label">Collection GPS</label>
            <div className="flex gap-2">
              <input className="form-control" placeholder="Latitude" value={form.collection_latitude} onChange={e=>setForm(f=>({...f,collection_latitude:e.target.value}))} />
              <input className="form-control" placeholder="Longitude" value={form.collection_longitude} onChange={e=>setForm(f=>({...f,collection_longitude:e.target.value}))} />
              <button type="button" className="btn btn-secondary btn-sm" onClick={captureGPS} style={{ whiteSpace:'nowrap' }}>📡 GPS</button>
            </div>
          </div>
          <div style={{ display:'flex', gap:8, justifyContent:'flex-end', marginTop:16 }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Recording...' : 'Record Payment'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
