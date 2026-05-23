import { useState, useEffect } from 'react';
import { Filter, Phone, AlertTriangle, ArrowRight } from 'lucide-react';
import api from '../../services/api';
import { useApp, fmt } from '../../store/AppContext';

export default function ArrearsModule() {
  const { state } = useApp();
  const [loans, setLoans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [staff, setStaff] = useState<any[]>([]);
  
  // Filters
  const [filterStaff, setFilterStaff] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [neverPaid, setNeverPaid] = useState(false);

  useEffect(() => {
    loadStaff();
    loadLoans();
  }, [filterStaff, filterDateFrom, filterDateTo, neverPaid]);

  const loadStaff = async () => {
    try {
      const res = await api.getStaff();
      setStaff(res.data || []);
    } catch (e) { console.error(e); }
  };

  const loadLoans = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterStaff) params.append('staff_id', filterStaff);
      if (filterDateFrom) params.append('from_date', filterDateFrom);
      if (filterDateTo) params.append('to_date', filterDateTo);
      if (neverPaid) params.append('never_paid', 'true');

      const res = await api.getPortfolioAtRisk(params.toString());
      const allLoans = res.data || [];
      
      setLoans(allLoans);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const curr = state.user?.currency || 'UGX';

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Arrears Management</h1>
          <p className="page-subtitle">Track and manage delinquent loans and "Never Paid" cases.</p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
            <div className="form-group mb-0">
              <label className="form-label">Loan Officer</label>
              <select className="form-control" value={filterStaff} onChange={e => setFilterStaff(e.target.value)}>
                <option value="">All Officers</option>
                {staff.map(s => (
                  <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>
                ))}
              </select>
            </div>
            <div className="form-group mb-0">
              <label className="form-label">Disbursed From</label>
              <input type="date" className="form-control" value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)} />
            </div>
            <div className="form-group mb-0">
              <label className="form-label">Disbursed To</label>
              <input type="date" className="form-control" value={filterDateTo} onChange={e => setFilterDateTo(e.target.value)} />
            </div>
            <div className="form-group mb-0">
              <label className="checkbox-container">
                <input type="checkbox" checked={neverPaid} onChange={e => setNeverPaid(e.target.checked)} />
                <span className="checkmark"></span>
                <strong>Never Paid</strong>
              </label>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Loans with zero collections</p>
            </div>
            <div className="flex gap-2">
              <button className="btn btn-primary w-full" onClick={loadLoans}>
                <Filter size={16} /> Filter
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── PERFORMANCE SUMMARY ────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16, marginBottom: 24 }}>
        <PerfCard title="Active Performance" 
          value={`${((loans.filter(l => l.status === 'active').length / Math.max(1, loans.length)) * 100).toFixed(1)}%`}
          sub={`${loans.filter(l => l.status === 'active').length} active loans`} color="var(--green)" />
        <PerfCard title="Default (Double Maturity)" value={loans.filter(l => l.status === 'defaulted').length} sub="Exceeded 2x term" color="var(--red)" />
        <PerfCard title="Dormant" value={loans.filter(l => l.status === 'dormant').length} sub="Missed 15+ installments" color="var(--orange)" />
        <PerfCard title="Written Off" value={loans.filter(l => l.status === 'written_off').length} sub="1yr+ dormant (monthly)" color="var(--text-muted)" />
        <PerfCard title="Advance Collections" 
          value={fmt.currency(loans.reduce((sum, l) => sum + Number(l.advance_amount || 0), 0), curr)} 
          sub="Total payments ahead of schedule" color="var(--blue)" />
      </div>

      {/* ── ARREARS AGING PORTFOLIO ─────────────────────────────── */}
      <div style={{ marginBottom: 12 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12 }}>Arrears Aging Portfolio (PAR)</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
          <PerfCard title="1–30 Days Overdue" 
            value={`${loans.filter(l => l.arrears_days >= 1 && l.arrears_days <= 30).length} loans`}
            sub={`Bal: ${fmt.currency(loans.filter(l => l.arrears_days >= 1 && l.arrears_days <= 30).reduce((sum, l) => sum + Number(l.outstanding_balance || 0), 0), curr)} | Arr: ${fmt.currency(loans.filter(l => l.arrears_days >= 1 && l.arrears_days <= 30).reduce((sum, l) => sum + Number(l.arrears_amount || 0), 0), curr)}`} color="var(--orange)" />
          <PerfCard title="31–60 Days Overdue" 
            value={`${loans.filter(l => l.arrears_days >= 31 && l.arrears_days <= 60).length} loans`}
            sub={`Bal: ${fmt.currency(loans.filter(l => l.arrears_days >= 31 && l.arrears_days <= 60).reduce((sum, l) => sum + Number(l.outstanding_balance || 0), 0), curr)} | Arr: ${fmt.currency(loans.filter(l => l.arrears_days >= 31 && l.arrears_days <= 60).reduce((sum, l) => sum + Number(l.arrears_amount || 0), 0), curr)}`} color="var(--red)" />
          <PerfCard title="60+ Days Overdue" 
            value={`${loans.filter(l => l.arrears_days > 60).length} loans`}
            sub={`Bal: ${fmt.currency(loans.filter(l => l.arrears_days > 60).reduce((sum, l) => sum + Number(l.outstanding_balance || 0), 0), curr)} | Arr: ${fmt.currency(loans.filter(l => l.arrears_days > 60).reduce((sum, l) => sum + Number(l.arrears_amount || 0), 0), curr)}`} color="#b91c1c" />
        </div>
      </div>

      {neverPaid && loans.length > 0 && (
        <div className="alert alert-danger" style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
          <AlertTriangle size={24} />
          <div>
            <h4 style={{ margin: 0 }}>Critical Alert: {loans.length} Loans with ZERO Payments</h4>
            <p style={{ margin: 0, fontSize: 13 }}>These loans were disbursed but have never recorded a single repayment. Immediate field follow-up required.</p>
          </div>
        </div>
      )}

      <div className="card">
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>Client</th>
                <th>Guarantor</th>
                <th>Loan Info</th>
                <th>Disbursed</th>
                <th>Officer</th>
                <th style={{ textAlign: 'right' }}>Outstanding</th>
                <th style={{ textAlign: 'right' }}>Arrears</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} className="text-center py-8">Loading arrears data...</td></tr>
              ) : loans.length === 0 ? (
                <tr><td colSpan={9} className="text-center py-8 text-muted">No loans found matching the criteria.</td></tr>
              ) : (
                loans.map(l => (
                  <tr key={l.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{l.client_name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Phone size={10} /> {l.phone_primary}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{l.guarantor_name || '—'}</div>
                      {l.guarantor_phone && (
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Phone size={10} /> {l.guarantor_phone}
                        </div>
                      )}
                    </td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{l.loan_number}</div>
                      <div style={{ fontSize: 11, color: 'var(--primary)' }}>{fmt.currency(l.principal_amount || 0, curr)} Principal</div>
                    </td>
                    <td>{l.disbursement_date}</td>
                    <td>{l.staff_name}</td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>{fmt.currency(l.outstanding_balance, curr)}</td>
                    <td style={{ textAlign: 'right' }}>
                      {Number(l.arrears_amount) > 0 && (
                        <>
                          <div className="text-danger" style={{ fontWeight: 'bold' }}>{fmt.currency(l.arrears_amount, curr)}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{l.arrears_days} days overdue</div>
                        </>
                      )}
                      {Number(l.advance_amount) > 0 && (
                        <div style={{ 
                          display: 'inline-block', background: 'var(--blue-dim)', color: 'white', 
                          padding: '2px 8px', borderRadius: 12, fontSize: 10, fontWeight: 700 
                        }}>
                          🔵 ADVANCE: {fmt.currency(l.advance_amount, curr)}
                        </div>
                      )}
                      {Number(l.arrears_amount) <= 0 && Number(l.advance_amount) <= 0 && (
                        <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>—</div>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${
                        l.status === 'active' ? 'badge-active' : 
                        l.status === 'defaulted' ? 'badge-danger' :
                        l.status === 'dormant' ? 'badge-warning' : 
                        l.status === 'written_off' ? 'badge-written_off' : 'badge-draft'
                      }`}>
                        {l.status === 'closed' ? 'Paid' : l.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                       <a href={`/loans/${l.id}`} className="btn btn-icon-sm" title="View Details">
                         <ArrowRight size={14} />
                       </a>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot>
              <tr style={{ borderTop: '2px solid var(--border)', fontWeight: 'bold', background: 'var(--bg-secondary)' }}>
                <td colSpan={5} style={{ padding: '12px 20px', textAlign: 'left' }}>TOTALS</td>
                <td style={{ padding: '12px 20px', textAlign: 'right', color: 'var(--orange)' }}>
                  {fmt.currency(loans.reduce((sum, l) => sum + Number(l.outstanding_balance || 0), 0), curr)}
                </td>
                <td style={{ padding: '12px 20px', textAlign: 'right', color: 'var(--red)' }}>
                  {fmt.currency(loans.reduce((sum, l) => sum + Number(l.arrears_amount || 0), 0), curr)}
                </td>
                <td colSpan={2}></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}

function PerfCard({ title, value, sub, color }: any) {
  return (
    <div className="card" style={{ borderTop: `4px solid ${color}`, padding: '16px 20px' }}>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>{title}</div>
      <div style={{ fontSize: 24, fontWeight: 800, color: color, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>{sub}</div>
    </div>
  );
}
