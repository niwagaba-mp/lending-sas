import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, DollarSign, AlertTriangle, CreditCard } from 'lucide-react';
import api from '../../services/api';
import { useApp, fmt } from '../../store/AppContext';

const COLORS = ['#22c55e','#f97316','#ef4444','#a855f7','#64748b','#06b6d4'];

export default function DashboardPage() {
  const { state } = useApp();
  const curr = state.user?.currency || 'UGX';
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [loans, setLoans] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'unpaid' | 'paid'>('unpaid');

  useEffect(() => {
    api.getCompanyReport()
      .then((r: any) => setData(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));

    if (state.user?.role === 'loan_officer') {
      api.getLoans()
        .then((r: any) => setLoans(r.data || []))
        .catch(console.error);
    }
  }, [state.user?.role]);

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'60vh', flexDirection:'column', gap:12 }}>
      <div style={{ width:40,height:40,border:'3px solid var(--border)',borderTopColor:'var(--accent)',borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
      <p style={{ color:'var(--text-muted)' }}>Loading dashboard...</p>
    </div>
  );

  const p = data?.portfolio || {};
  const npl = data?.npl_ratio || 0;

  // CASHIER DASHBOARD
  if (state.user?.role === 'cashier') return (
    <div style={{ padding: 40, textAlign: 'center' }}>
      <div style={{ fontSize: 48, marginBottom: 20 }}>👋</div>
      <h2 style={{ color: 'var(--text-primary)' }}>Welcome to the SMOS Portal, {state.user.first_name}</h2>
      <p style={{ color: 'var(--text-muted)', maxWidth: 500, margin: '0 auto 24px' }}>
        You have successfully accessed the main portal. Use the sidebar on the left to navigate between operational modules and reporting tools.
      </p>
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
        <button className="btn btn-primary" onClick={() => window.location.href = '/cashier'}>Open Cashier Hub</button>
        <button className="btn btn-secondary" onClick={() => window.location.href = '/reports'}>View Reports Center</button>
      </div>
    </div>
  );

  // LOAN OFFICER DASHBOARD
  if (state.user?.role === 'loan_officer') {
    const unpaidLoans = loans.filter(l => Number(l.arrears_amount) > 0);
    const paidLoans = loans.filter(l => Number(l.arrears_amount) === 0 && l.status !== 'draft');

    return (
      <div>
        <div className="page-header">
          <div>
            <h2 className="page-title">My Portfolio Dashboard</h2>
            <p className="page-subtitle">{state.user?.first_name} {state.user?.last_name} · Personal performance & follow-ups</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-secondary btn-sm" onClick={() => window.location.href = '/clients'}>
              Register Client
            </button>
            <button className="btn btn-primary btn-sm" onClick={() => window.location.href = '/loans'}>
              Apply for Loan
            </button>
          </div>
        </div>

        {/* KPI Stats */}
        <div className="stats-grid">
          <div className="stat-card accent">
            <div className="stat-label">My Total Disbursed</div>
            <div className="stat-value" style={{ fontSize: 20 }}>{fmt.currency(p.total_disbursed, curr)}</div>
            <div className="stat-sub">{p.total_loans} total loans</div>
            <DollarSign size={40} className="stat-icon" color="var(--accent)" />
          </div>
          <div className="stat-card blue">
            <div className="stat-label">Outstanding Portfolio</div>
            <div className="stat-value" style={{ fontSize: 20 }}>{fmt.currency(p.outstanding_portfolio, curr)}</div>
            <div className="stat-sub">{p.active_loans} active loans</div>
            <CreditCard size={40} className="stat-icon" color="var(--blue)" />
          </div>
          <div className="stat-card green">
            <div className="stat-label">Total Collected</div>
            <div className="stat-value" style={{ fontSize: 20 }}>{fmt.currency(p.total_collected, curr)}</div>
            <div className="stat-sub">Principal + Interest</div>
            <TrendingUp size={40} className="stat-icon" color="var(--green)" />
          </div>
          <div className="stat-card red">
            <div className="stat-label">My Total Arrears</div>
            <div className="stat-value" style={{ fontSize: 20 }}>{fmt.currency(p.total_arrears, curr)}</div>
            <div className="stat-sub">NPL: {npl}%</div>
            <AlertTriangle size={40} className="stat-icon" color="var(--red)" />
          </div>
        </div>

        <div className="grid-2" style={{ marginBottom: 20 }}>
          {/* Loan Status Distribution */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">My Loans by Status</span>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={(data?.by_status || []).map((item: any) => ({ ...item, status: item.status === 'closed' ? 'Paid' : item.status.replace(/_/g, ' ') }))} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={80} label={({ status, count }) => `${status}: ${count}`} labelLine={false}>
                  {(data?.by_status || []).map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v: any) => [fmt.num(v), 'Count']} contentStyle={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Arrears Breakdown */}
          <div className="card">
            <div className="card-header"><span className="card-title">My Arrears Aging</span></div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, height: '220px', alignContent: 'center' }}>
              {[
                { label: '1–7 Days', count: data?.arrears_breakdown?.days_1_7, amount: data?.arrears_breakdown?.amount_1_7, color:'var(--orange)' },
                { label: '8–30 Days', count: data?.arrears_breakdown?.days_8_30, amount: data?.arrears_breakdown?.amount_8_30, color:'#f97316' },
                { label: '31–90 Days', count: data?.arrears_breakdown?.days_31_90, amount: data?.arrears_breakdown?.amount_31_90, color:'var(--red)' },
                { label: '90+ Days', count: data?.arrears_breakdown?.days_over_90, amount: data?.arrears_breakdown?.amount_over_90, color:'#b91c1c' },
              ].map(b => (
                <div key={b.label} style={{ background:'var(--bg-secondary)', borderRadius:8, padding:'10px 14px', borderLeft:`4px solid ${b.color}` }}>
                  <div style={{ fontSize:11, color:'var(--text-muted)', marginBottom:2 }}>{b.label}</div>
                  <div style={{ fontSize:16, fontWeight:800, color:b.color }}>{fmt.num(b.count || 0)} loans</div>
                  <div style={{ fontSize:11, color:'var(--text-muted)' }}>{fmt.currency(b.amount || 0, curr)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Portfolio Lists */}
        <div className="card">
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="card-title">My Client Reports</span>
            <div className="flex gap-2">
              <button className={`btn btn-sm ${activeTab === 'unpaid' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('unpaid')}>
                Unpaid / In Arrears ({unpaidLoans.length})
              </button>
              <button className={`btn btn-sm ${activeTab === 'paid' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('paid')}>
                Performing / Paid ({paidLoans.length})
              </button>
            </div>
          </div>

          <div className="table-wrap">
            {activeTab === 'unpaid' ? (
              <table>
                <thead>
                  <tr>
                    <th>Loan #</th>
                    <th>Client Name</th>
                    <th>Guarantor</th>
                    <th>Outstanding</th>
                    <th>Arrears Amount</th>
                    <th>Days Overdue</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {unpaidLoans.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px' }}>
                        No clients currently in arrears. Well done!
                      </td>
                    </tr>
                  ) : (
                    unpaidLoans.map(l => (
                      <tr key={l.id}>
                        <td className="font-mono">{l.loan_number}</td>
                        <td>
                          <div className="font-bold">{l.client_name}</div>
                          <div style={{ fontSize:11, color:'var(--text-muted)' }}>{l.client_phone}</div>
                        </td>
                        <td>{l.guarantor_name || 'Peter Tusiime'} ({l.guarantor_phone || '+256752000111'})</td>
                        <td>{fmt.currency(l.outstanding_balance, curr)}</td>
                        <td className="text-danger font-bold">{fmt.currency(l.arrears_amount, curr)}</td>
                        <td className="text-danger font-bold">{l.arrears_days} days</td>
                        <td>
                          <span className={`badge badge-delinquent`}>{l.status?.replace('_',' ')}</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Loan #</th>
                    <th>Client Name</th>
                    <th>Principal</th>
                    <th>Total Paid</th>
                    <th>Outstanding</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {paidLoans.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px' }}>
                        No performing or fully paid loans found.
                      </td>
                    </tr>
                  ) : (
                    paidLoans.map(l => (
                      <tr key={l.id}>
                        <td className="font-mono">{l.loan_number}</td>
                        <td>
                          <div className="font-bold">{l.client_name}</div>
                          <div style={{ fontSize:11, color:'var(--text-muted)' }}>{l.client_phone}</div>
                        </td>
                        <td>{fmt.currency(l.principal_amount, curr)}</td>
                        <td className="text-success">{fmt.currency(l.total_paid, curr)}</td>
                        <td>{fmt.currency(l.outstanding_balance, curr)}</td>
                        <td>
                          <span className={`badge ${l.status === 'closed' ? 'badge-active' : 'badge-draft'}`}>{l.status === 'closed' ? 'Paid' : l.status?.replace('_',' ')}</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    );
  }

  // STANDARD DASHBOARD (super_admin, branch_manager, admin, supervisor)
  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">Company Dashboard</h2>
          <p className="page-subtitle">{state.user?.tenant_name} · Real-time portfolio intelligence</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => api.sendReminders()}>
          Send Overdue Reminders
        </button>
      </div>

      {/* KPI Stats */}
      <div className="stats-grid">
        <div className="stat-card accent">
          <div className="stat-label">Total Disbursed</div>
          <div className="stat-value" style={{ fontSize: 20 }}>{fmt.currency(p.total_disbursed, curr)}</div>
          <div className="stat-sub">{p.total_loans} total loans</div>
          <DollarSign size={40} className="stat-icon" color="var(--accent)" />
        </div>
        <div className="stat-card blue">
          <div className="stat-label">Outstanding Portfolio</div>
          <div className="stat-value" style={{ fontSize: 20 }}>{fmt.currency(p.outstanding_portfolio, curr)}</div>
          <div className="stat-sub">{p.active_loans} active loans</div>
          <CreditCard size={40} className="stat-icon" color="var(--blue)" />
        </div>
        <div className="stat-card green">
          <div className="stat-label">Total Collected</div>
          <div className="stat-value" style={{ fontSize: 20 }}>{fmt.currency(p.total_collected, curr)}</div>
          <div className="stat-sub">Principal + Interest</div>
          <TrendingUp size={40} className="stat-icon" color="var(--green)" />
        </div>
        <div className="stat-card red">
          <div className="stat-label">Total Arrears</div>
          <div className="stat-value" style={{ fontSize: 20 }}>{fmt.currency(p.total_arrears, curr)}</div>
          <div className="stat-sub">NPL: {npl}%</div>
          <AlertTriangle size={40} className="stat-icon" color="var(--red)" />
        </div>
      </div>

      <div className="grid-2" style={{ marginBottom: 20 }}>
        {/* Loan Status Distribution */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Loan Portfolio by Status</span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={(data?.by_status || []).map((item: any) => ({ ...item, status: item.status === 'closed' ? 'Paid' : item.status.replace(/_/g, ' ') }))} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={80} label={({ status, count }) => `${status}: ${count}`} labelLine={false}>
                {(data?.by_status || []).map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(v: any) => [fmt.num(v), 'Count']} contentStyle={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius: 8 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Monthly Disbursements */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Monthly Disbursements (12m)</span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data?.monthly_disbursements || []}>
              <XAxis dataKey="month" tick={{ fill:'var(--text-muted)', fontSize:11 }} />
              <YAxis tick={{ fill:'var(--text-muted)', fontSize:10 }} tickFormatter={(v) => `${(v/1000000).toFixed(0)}M`} />
              <Tooltip formatter={(v: any) => [fmt.currency(v, curr)]} contentStyle={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:8 }} />
              <Bar dataKey="amount" fill="var(--accent)" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Arrears Breakdown */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header"><span className="card-title">Arrears Aging Breakdown</span></div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:16 }}>
          {[
            { label: '1–7 Days', count: data?.arrears_breakdown?.days_1_7, amount: data?.arrears_breakdown?.amount_1_7, color:'var(--orange)' },
            { label: '8–30 Days', count: data?.arrears_breakdown?.days_8_30, amount: data?.arrears_breakdown?.amount_8_30, color:'#f97316' },
            { label: '31–90 Days', count: data?.arrears_breakdown?.days_31_90, amount: data?.arrears_breakdown?.amount_31_90, color:'var(--red)' },
            { label: '90+ Days', count: data?.arrears_breakdown?.days_over_90, amount: data?.arrears_breakdown?.amount_over_90, color:'#b91c1c' },
          ].map(b => (
            <div key={b.label} style={{ background:'var(--bg-secondary)', borderRadius:8, padding:16, borderTop:`3px solid ${b.color}` }}>
              <div style={{ fontSize:11, color:'var(--text-muted)', marginBottom:4 }}>{b.label}</div>
              <div style={{ fontSize:22, fontWeight:800, color:b.color }}>{fmt.num(b.count || 0)}</div>
              <div style={{ fontSize:11, color:'var(--text-muted)' }}>{fmt.currency(b.amount || 0, curr)}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Branch Performance Table */}
      <div className="card">
        <div className="card-header"><span className="card-title">Branch Performance</span></div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Branch</th><th>Portfolio</th><th>Collected</th><th>Arrears</th><th>Active Loans</th></tr>
            </thead>
            <tbody>
              {(data?.branch_performance || []).map((b: any) => (
                <tr key={b.id}>
                  <td><div className="font-bold">{b.name}</div></td>
                  <td>{fmt.currency(b.portfolio, curr)}</td>
                  <td className="text-success">{fmt.currency(b.collected, curr)}</td>
                  <td className="text-danger">{fmt.currency(b.arrears, curr)}</td>
                  <td>{fmt.num(b.active_loans)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
