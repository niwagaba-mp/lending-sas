import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import api from '../../services/api';
import { useApp, fmt } from '../../store/AppContext';

export default function LoanModal({ loan, onClose, onSaved }: any) {
  const { state } = useApp();
  const isNew = !loan;
  const [clients, setClients] = useState<any[]>([]);
  const [detail, setDetail] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
  const [form, setForm] = useState({
    client_id: '', principal_amount: '', processing_fee: '', interest_rate: '20',
    repayment_frequency: 'daily', duration_days: '30', loan_purpose: '',
    guarantors: [] as any[],
  });

  useEffect(() => {
    if (isNew) api.getClients('').then((r: any) => setClients(r.data));
    else api.getLoanById(loan.id).then((r: any) => setDetail(r.data));
  }, []);

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.guarantors.length < 1) {
      return alert('At least 1 guarantor is required to create a loan.');
    }
    setLoading(true);
    try {
      await api.createLoan(form);
      onSaved();
    } catch (err: any) { alert(err.message); }
    finally { setLoading(false); }
  };

  const handleApprove = async () => {
    if (!confirm('Approve this loan?')) return;
    await api.approveLoan(loan.id);
    onSaved();
  };

  const handleDisburse = async () => {
    if (!confirm('Disburse loan? This will generate the repayment schedule.')) return;
    await api.disburseLoan(loan.id, { gps_verified: true, photo_verified: true });
    onSaved();
  };

  const l = detail || loan;

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-lg">
        <div className="modal-header">
          <h3 className="modal-title">{isNew ? 'New Loan Application' : `Loan: ${l?.loan_number}`}</h3>
          <button className="btn btn-icon btn-secondary" onClick={onClose}><X size={16} /></button>
        </div>

        {isNew ? (
          <form onSubmit={handleCreate}>
            <div className="form-group"><label className="form-label">Client *</label>
              <select className="form-control" value={form.client_id} onChange={e=>set('client_id',e.target.value)} required>
                <option value="">Select client...</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.first_name} {c.last_name} — {c.phone_primary}</option>)}
              </select></div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Principal Amount *</label>
                <input className="form-control" type="number" value={form.principal_amount} onChange={e=>set('principal_amount',e.target.value)} required /></div>
              <div className="form-group"><label className="form-label">Processing Fee (UGX)</label>
                <input className="form-control" type="number" value={form.processing_fee} onChange={e=>set('processing_fee',e.target.value)} /></div>
              <div className="form-group"><label className="form-label">Interest Rate (%)</label>
                <input className="form-control" type="number" value={form.interest_rate} onChange={e=>set('interest_rate',e.target.value)} /></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Frequency *</label>
                <select className="form-control" value={form.repayment_frequency} onChange={e=>set('repayment_frequency',e.target.value)}>
                  <option value="daily">Daily</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option>
                </select></div>
              <div className="form-group"><label className="form-label">Duration (Days) *</label>
                <input className="form-control" type="number" value={form.duration_days} onChange={e=>set('duration_days',e.target.value)} required /></div>
            </div>
            {form.principal_amount && (
              <div className="alert alert-success mb-4">
                💰 Interest: UGX {(Number(form.principal_amount) * Number(form.interest_rate) / 100).toLocaleString()} &nbsp;|&nbsp;
                Total Repayable: UGX {(Number(form.principal_amount) * (1 + Number(form.interest_rate)/100)).toLocaleString()}
              </div>
            )}
            <div className="form-group"><label className="form-label">Loan Purpose</label>
              <input className="form-control" value={form.loan_purpose} onChange={e=>set('loan_purpose',e.target.value)} /></div>
            <div style={{ borderTop:'1px solid var(--border)', margin:'16px 0', paddingTop:16 }}>
              <div style={{ fontSize:14, fontWeight:600, color:'var(--text-primary)', marginBottom:12 }}>
                Guarantors (At least 1 required) *
              </div>
              
              {form.guarantors.map((g, i) => (
                <div key={i} style={{ background:'var(--bg-secondary)', padding:12, borderRadius:8, marginBottom:8, position:'relative' }}>
                  <button type="button" className="btn btn-icon" style={{ position:'absolute', top:8, right:8, color:'var(--red)' }}
                    onClick={() => setForm(f => ({ ...f, guarantors: f.guarantors.filter((_, idx) => idx !== i) }))}><X size={14}/></button>
                  <div className="form-row" style={{ marginBottom:8 }}>
                    <div className="form-group mb-0"><label className="form-label" style={{ fontSize:10 }}>Full Name *</label>
                      <input className="form-control" style={{ padding:'4px 8px', fontSize:12 }} value={g.full_name} onChange={e => {
                        const newG = [...form.guarantors]; newG[i].full_name = e.target.value; setForm(f => ({ ...f, guarantors: newG }));
                      }} required /></div>
                    <div className="form-group mb-0"><label className="form-label" style={{ fontSize:10 }}>Phone *</label>
                      <input className="form-control" style={{ padding:'4px 8px', fontSize:12 }} value={g.phone} onChange={e => {
                        const newG = [...form.guarantors]; newG[i].phone = e.target.value; setForm(f => ({ ...f, guarantors: newG }));
                      }} required /></div>
                  </div>
                  <div className="form-row">
                    <div className="form-group mb-0"><label className="form-label" style={{ fontSize:10 }}>National ID *</label>
                      <input className="form-control" style={{ padding:'4px 8px', fontSize:12 }} value={g.national_id} onChange={e => {
                        const newG = [...form.guarantors]; newG[i].national_id = e.target.value; setForm(f => ({ ...f, guarantors: newG }));
                      }} required /></div>
                    <div className="form-group mb-0"><label className="form-label" style={{ fontSize:10 }}>Relationship *</label>
                      <input className="form-control" style={{ padding:'4px 8px', fontSize:12 }} value={g.relationship} onChange={e => {
                        const newG = [...form.guarantors]; newG[i].relationship = e.target.value; setForm(f => ({ ...f, guarantors: newG }));
                      }} required /></div>
                  </div>
                </div>
              ))}
              
              <button type="button" className="btn btn-secondary btn-sm"
                onClick={() => setForm(f => ({ ...f, guarantors: [...f.guarantors, { full_name: '', phone: '', national_id: '', relationship: '', address: '' }] }))}>
                + Add Guarantor
              </button>
            </div>

            <div style={{ display:'flex', gap:8, justifyContent:'flex-end', marginTop:16 }}>
              <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={loading}>{loading?'Saving...':'Create Loan'}</button>
            </div>
          </form>
        ) : (
          <div>
            <div className="tabs">
              {['details','schedule','payments','guarantors'].map(t => (
                <div key={t} className={`tab${activeTab===t?' active':''}`} onClick={()=>setActiveTab(t)}>
                  {t.charAt(0).toUpperCase()+t.slice(1)}
                </div>
              ))}
            </div>

            {activeTab === 'details' && l && (
              <div>
                <div className="grid-2 mb-4">
                  {[
                    ['Client', l.client_name], ['Officer', l.staff_name], ['Branch', l.branch_name],
                    ['Principal', fmt.currency(l.principal_amount, 'UGX')],
                    ['Interest', fmt.currency(l.interest_amount, 'UGX')],
                    ['Total Repayable', fmt.currency(l.total_repayable, 'UGX')],
                    ['Total Paid', fmt.currency(l.total_paid, 'UGX')],
                    ['Outstanding', fmt.currency(l.outstanding_balance, 'UGX')],
                    ['Arrears', fmt.currency(l.arrears_amount, 'UGX')],
                    ['Arrears Days', l.arrears_days || 0],
                    ['Disbursed', fmt.date(l.disbursement_date)],
                    ['Closes', fmt.date(l.expected_closure_date)],
                  ].map(([k,v]) => (
                    <div key={k as string} style={{ background:'var(--bg-secondary)',padding:'10px 14px',borderRadius:8 }}>
                      <div style={{ fontSize:10,color:'var(--text-muted)',marginBottom:3 }}>{k}</div>
                      <div style={{ fontWeight:600 }}>{v as string}</div>
                    </div>
                  ))}
                </div>
                <div className="progress mb-4">
                  <div className="progress-bar" style={{
                    width:`${Math.min(100, (l.total_paid/l.total_repayable)*100)}%`,
                    background: 'var(--green)',
                  }} />
                </div>
                <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
                  {state.user?.role !== 'loan_officer' && (
                    <>
                      {(l.status === 'draft' || l.status === 'pending_approval') && <button className="btn btn-primary" onClick={handleApprove}>✓ Approve Loan</button>}
                      {l.status === 'approved' && <button className="btn btn-success" onClick={handleDisburse}>💸 Disburse Loan</button>}
                      {['active', 'at_risk', 'delinquent'].includes(l.status) && (
                        <>
                          <button className="btn btn-secondary" style={{ background: '#f59e0b', color: 'white' }} onClick={() => alert('Fine Action: Use Quick Operations on Dashboard')}>⚠️ Add Fine</button>
                          <button className="btn btn-secondary" style={{ background: '#ef4444', color: 'white' }} onClick={() => alert('Return Action: Use Quick Operations on Dashboard')}>↩️ Return / Cancel</button>
                          <button className="btn btn-secondary" style={{ background: '#6366f1', color: 'white' }} onClick={() => alert('Renew Action: Use Quick Operations on Dashboard')}>🔄 Renew Loan</button>
                        </>
                      )}
                    </>
                  )}
                  {state.user?.role === 'loan_officer' && l.status === 'pending_approval' && (
                    <div style={{ color: 'var(--text-muted)', fontSize: 13, fontStyle: 'italic' }}>
                      Pending review/approval by Cashier
                    </div>
                  )}
                  {state.user?.role === 'loan_officer' && l.status === 'draft' && (
                    <div style={{ color: 'var(--text-muted)', fontSize: 13, fontStyle: 'italic' }}>
                      Draft Loan - Submit for approval from the loans table.
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'schedule' && (
              <div className="table-wrap" style={{ maxHeight:400, overflowY:'auto' }}>
                <table>
                  <thead><tr><th>#</th><th>Due Date</th><th>Total Due</th><th>Paid</th><th>Balance</th><th>Status</th></tr></thead>
                  <tbody>
                    {(detail?.schedule || []).map((s: any) => (
                      <tr key={s.id}>
                        <td>{s.installment_number}</td>
                        <td>{fmt.date(s.due_date)}</td>
                        <td>{fmt.currency(s.total_due,'UGX')}</td>
                        <td>{fmt.currency(s.total_paid,'UGX')}</td>
                        <td>{fmt.currency(s.balance,'UGX')}</td>
                        <td>
                          {s.is_paid
                            ? <span className="badge badge-active">Paid</span>
                            : new Date(s.due_date) < new Date()
                              ? <span className="badge badge-delinquent">Overdue</span>
                              : <span className="badge badge-draft">Pending</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'payments' && (
              <div className="table-wrap" style={{ maxHeight:400, overflowY:'auto' }}>
                <table>
                  <thead><tr><th>Date</th><th>Amount</th><th>Method</th><th>Collected By</th></tr></thead>
                  <tbody>
                    {(detail?.payments || []).map((p: any) => (
                      <tr key={p.id}>
                        <td>{fmt.date(p.payment_date)}</td>
                        <td className="text-success font-bold">{fmt.currency(p.amount_paid,'UGX')}</td>
                        <td><span className="badge badge-B">{p.payment_method}</span></td>
                        <td>{p.collected_by_name}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'guarantors' && (
              <div>
                {(detail?.guarantors || []).map((g: any) => (
                  <div key={g.id} style={{ background:'var(--bg-secondary)',padding:12,borderRadius:8,marginBottom:8 }}>
                    <div className="font-bold">{g.full_name}</div>
                    <div style={{ fontSize:12,color:'var(--text-muted)' }}>{g.national_id} · {g.phone} · {g.relationship}</div>
                    <div style={{ fontSize:11,color:'var(--text-muted)' }}>{g.address}</div>
                  </div>
                ))}
                {(detail?.guarantors||[]).length === 0 && <p style={{ color:'var(--text-muted)' }}>No guarantors on record.</p>}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
