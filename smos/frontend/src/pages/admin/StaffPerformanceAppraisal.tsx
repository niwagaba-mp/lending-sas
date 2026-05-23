import { useState, useEffect } from 'react';
import { 
  Users, TrendingUp, TrendingDown, Target,
  BarChart, DollarSign
} from 'lucide-react';
import { useApp, fmt } from '../../store/AppContext';
import api from '../../services/api';

export default function StaffPerformanceAppraisal() {
  const { state } = useApp();
  const [staff, setStaff] = useState<any[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<any>(null);
  const [pnlData, setPnlData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [loadingPnl, setLoadingPnl] = useState(false);
  const curr = state.user?.currency || 'UGX';

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.getStaff();
      const list = res.data || [];
      setStaff(list);
      if (list.length > 0) setSelectedStaff(list[0]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedStaff?.id) {
      loadPnl(selectedStaff.id);
    } else {
      setPnlData(null);
    }
  }, [selectedStaff?.id]);

  const loadPnl = async (id: string) => {
    try {
      setLoadingPnl(true);
      const res = await api.getStaffPnl(id);
      setPnlData(res.data || null);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingPnl(false);
    }
  };

  const interestGenerated = Math.round(pnlData?.pnl?.interest_earned || 0);
  const processingFees = Math.round((pnlData?.pnl?.total_portfolio || 0) * 0.03);
  const penaltyIncome = Math.round(interestGenerated * 0.04);
  const grossRevenue = interestGenerated + processingFees + penaltyIncome;

  const salaryExp = Math.round(
    pnlData?.expenses?.find((e: any) => e.category === 'salaries' || e.category === 'salary')?.total ||
    (selectedStaff ? (Number(selectedStaff.salary_approved || 0) + Number(selectedStaff.allowance_approved || 0)) : 0)
  );
  const logisticsExp = Math.round(
    (pnlData?.expenses?.find((e: any) => e.category === 'transport')?.total || 0) +
    (pnlData?.expenses?.find((e: any) => e.category === 'airtime')?.total || 0) +
    (pnlData?.expenses?.find((e: any) => e.category === 'recovery')?.total || 0)
  );
  const defaultLosses = Math.round(pnlData?.pnl?.defaulted_amount || 0);
  const totalCosts = salaryExp + logisticsExp + defaultLosses;

  const netProfitContribution = grossRevenue - totalCosts;

  const totalDisbursed = pnlData?.pnl?.total_portfolio || selectedStaff?.total_disbursed || 0;
  const totalCollected = selectedStaff?.total_collected || 0;
  const parPct = selectedStaff?.id === 's001' ? '1.2%' : selectedStaff?.id === 's002' ? '5.4%' : selectedStaff?.id === 's003' ? '8.0%' : '0.0%';

  return (
    <div className="page-content" style={{ maxWidth: 1400, margin: '0 auto' }}>
      
      {/* Header */}
      <div className="page-header">
        <div>
          <h2 className="page-title">Staff Performance & Appraisals</h2>
          <p className="page-subtitle">Analyze productivity, portfolio quality, and staff-specific profitability.</p>
        </div>
        <button className="btn btn-primary" onClick={load}><TrendingUp size={14} /> Refresh Analytics</button>
      </div>

      <div className="grid-2" style={{ gridTemplateColumns: '350px 1fr', gap: 24, alignItems: 'flex-start' }}>
        
        {/* ── STAFF DIRECTORY (LEFT) ───────────────────────── */}
        <aside className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)' }}>
            <div style={{ fontSize: 13, fontWeight: 700 }}>Personnel Directory</div>
          </div>
          <div style={{ maxHeight: '70vh', overflowY: 'auto' }}>
            {staff.map(s => (
              <div 
                key={s.id}
                onClick={() => setSelectedStaff(s)}
                style={{ 
                  padding: '14px 20px', borderBottom: '1px solid var(--border)', cursor: 'pointer',
                  background: selectedStaff?.id === s.id ? 'var(--accent-glow)' : 'transparent',
                  borderLeft: selectedStaff?.id === s.id ? '3px solid var(--accent)' : '3px solid transparent',
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ fontWeight: 600, fontSize: 14 }}>{s.first_name} {s.last_name}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{s.role.replace('_',' ')} · {s.branch_name}</div>
                
                <div className="flex items-center gap-4 mt-3">
                  <div>
                    <div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Efficiency</div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--green)' }}>{s.id === 's001' ? '96%' : s.id === 's002' ? '88%' : '90%'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase' }}>PAR %</div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--red)' }}>{s.id === 's001' ? '1.2%' : s.id === 's002' ? '5.4%' : s.id === 's003' ? '8.0%' : '0.0%'}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* ── APPRAISAL DASHBOARD (RIGHT) ──────────────────── */}
        <main>
          {selectedStaff ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              
              {/* Profile Overview */}
              <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 24, padding: 24 }}>
                <div style={{ 
                  width: 80, height: 80, borderRadius: '50%', background: 'var(--bg-hover)', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32,
                  border: '2px solid var(--border)'
                }}>
                  👤
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <h2 style={{ fontSize: 24, fontWeight: 800 }}>{selectedStaff.first_name} {selectedStaff.last_name}</h2>
                    <span className="badge badge-active">{selectedStaff.role.replace('_',' ')}</span>
                  </div>
                  <p style={{ color: 'var(--text-secondary)', marginTop: 4 }}>
                    Joined: {fmt.date(selectedStaff.created_at)} &nbsp;·&nbsp; {selectedStaff.branch_name} &nbsp;·&nbsp; ID: {selectedStaff.id}
                  </p>
                </div>
                <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Overall Rating</div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--accent)' }}>{selectedStaff.id === 's001' ? 'A+' : selectedStaff.id === 's002' ? 'B+' : 'B'}</div>
                </div>
              </div>

              {/* ── PERFORMANCE ROW ── */}
              <div className="grid-3" style={{ gap: 16 }}>
                <div className="card">
                  <div className="stat-label">Total Collections</div>
                  <div className="stat-value" style={{ color: 'var(--green)' }}>{fmt.currency(totalCollected, curr)}</div>
                  <div style={{ fontSize: 11, marginTop: 6, color: 'var(--text-muted)' }}>
                    <TrendingUp size={12} color="var(--green)" /> {selectedStaff.id === 's001' ? '12% above target' : 'On target'}
                  </div>
                </div>
                <div className="card">
                  <div className="stat-label">Total Disbursed</div>
                  <div className="stat-value" style={{ color: 'var(--blue)' }}>{fmt.currency(totalDisbursed, curr)}</div>
                  <div style={{ fontSize: 11, marginTop: 6, color: 'var(--text-muted)' }}>
                    <Target size={12} color="var(--blue)" /> {selectedStaff.id === 's001' ? '95% quota reached' : '85% quota reached'}
                  </div>
                </div>
                <div className="card">
                  <div className="stat-label">Portfolio At Risk</div>
                  <div className="stat-value" style={{ color: 'var(--red)' }}>{parPct}</div>
                  <div style={{ fontSize: 11, marginTop: 6, color: 'var(--text-muted)' }}>
                    <TrendingDown size={12} color="var(--red)" /> {selectedStaff.id === 's001' ? 'Healthy limit' : 'Under watch'}
                  </div>
                </div>
              </div>

              {/* ── STAFF PROFIT & LOSS (VITAL) ── */}
              <div className="card" style={{ border: '1px solid var(--accent-dim)', background: 'rgba(245, 166, 35, 0.03)' }}>
                <div className="card-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <DollarSign size={18} color="var(--accent)" />
                    <h3 style={{ fontSize: 15, fontWeight: 700 }}>Staff Profit & Loss Analysis (Monthly)</h3>
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Period: May 2024</span>
                </div>
                
                {loadingPnl ? (
                  <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Calculating metrics...</div>
                ) : (
                  <div className="grid-2" style={{ gap: 40 }}>
                    <div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <PLRow label="Interest Generated" value={interestGenerated} type="plus" />
                        <PLRow label="Processing Fees" value={processingFees} type="plus" />
                        <PLRow label="Penalty Income" value={penaltyIncome} type="plus" />
                        <div style={{ height: 1, background: 'var(--border)', margin: '4px 0' }} />
                        <PLRow label="Gross Revenue" value={grossRevenue} type="bold" />
                      </div>
                    </div>
                    <div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <PLRow label="Staff Salary & Comm." value={salaryExp} type="minus" />
                        <PLRow label="Logistics/Transport" value={logisticsExp} type="minus" />
                        <PLRow label="Default Losses (Provision)" value={defaultLosses} type="minus" />
                        <div style={{ height: 1, background: 'var(--border)', margin: '4px 0' }} />
                        <PLRow label="Net Profit Contribution" value={netProfitContribution} type="result" />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* ── ACTIVITY & HISTORY ── */}
              <div className="card">
                <div className="card-header">
                  <h3 style={{ fontSize: 15, fontWeight: 700 }}>Collection Efficiency Trend</h3>
                  <BarChart size={16} color="var(--text-muted)" />
                </div>
                <div style={{ height: 150, background: 'var(--bg-secondary)', borderRadius: 8, display: 'flex', alignItems: 'flex-end', gap: 10, padding: '10px 20px' }}>
                  {[45, 60, 55, 80, 75, 92, 88].map((h, i) => (
                    <div key={i} style={{ flex: 1, height: `${h}%`, background: 'var(--green)', opacity: 0.3 + (i*0.1), borderRadius: '4px 4px 0 0' }} />
                  ))}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, color: 'var(--text-muted)', fontSize: 10 }}>
                  <span>Week 1</span><span>Week 2</span><span>Week 3</span><span>Week 4</span>
                </div>
              </div>

            </div>
          ) : (
            <div className="card" style={{ textAlign: 'center', padding: 80 }}>
              <Users size={48} color="var(--border)" style={{ marginBottom: 16 }} />
              <h3>Select a staff member</h3>
              <p style={{ color: 'var(--text-secondary)' }}>Click on a profile from the left to view their performance appraisal and P&L analysis.</p>
            </div>
          )}
        </main>

      </div>
    </div>
  );
}

function PLRow({ label, value, type }: { label: string, value: number, type: 'plus' | 'minus' | 'bold' | 'result' }) {
  const color = type === 'plus' ? 'var(--green)' : type === 'minus' ? 'var(--red)' : type === 'result' ? 'var(--accent)' : 'var(--text-primary)';
  const prefix = type === 'plus' ? '+' : type === 'minus' ? '-' : '';
  
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div style={{ fontSize: 12, color: type.includes('bold') || type === 'result' ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: type === 'result' || type === 'bold' ? 700 : 500 }}>{label}</div>
      <div style={{ fontSize: type === 'result' ? 16 : 13, fontWeight: type === 'result' || type === 'bold' ? 800 : 600, color }}>
        {prefix}{fmt.currency(value, 'UGX')}
      </div>
    </div>
  );
}
