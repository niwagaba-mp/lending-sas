import React, { useState } from 'react';
import { 
  Users, TrendingUp, AlertTriangle, FileText, Settings, Shield, 
  BarChart3, Calendar, DollarSign, UserCheck, Briefcase, Lock, 
  History, PieChart, Landmark
} from 'lucide-react';
import { useApp, fmt } from '../../store/AppContext';
import api from '../../services/api';

export default function AdminHub() {
  const { state } = useApp();
  const curr = state.user?.currency || 'UGX';
  const user = state.user;

  const [stats, setStats] = useState<any[]>([]);
  const [, setLoading] = useState(true);

  React.useEffect(() => {
    const loadStats = async () => {
      try {
        setLoading(true);
        const res = await api.getCompanyReport();
        const d = res.data;
        setStats([
          { label: 'Active Portfolio', value: d.active_portfolio || 0, icon: <Briefcase size={20} />, color: '#3b82f6', sub: `${d.active_loans_count || 0} active loans` },
          { label: 'Collections Today', value: d.collections_today || 0, icon: <TrendingUp size={20} />, color: '#10b981', sub: `${d.collection_efficiency || 0}% efficiency` },
          { label: 'At Risk (PAR)', value: d.portfolio_at_risk || 0, icon: <AlertTriangle size={20} />, color: '#ef4444', sub: `${d.par_ratio || 0}% ratio` },
          { label: 'Net Profit (MTD)', value: d.net_profit_mtd || 0, icon: <DollarSign size={20} />, color: '#f59e0b', sub: 'After expenses' },
        ]);
      } catch (err) {
        console.error("Admin Hub Sync Error:", err);
      } finally {
        setLoading(false);
      }
    };
    loadStats();
  }, []);

  return (
    <div className="page-content" style={{ maxWidth: 1600, margin: '0 auto' }}>
      
      {/* ── HEADER ────────────────────────────────────────── */}
      <div className="page-header" style={{ marginBottom: 24 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <div style={{ 
              background: 'linear-gradient(135deg, #6366f1, #a855f7)', 
              borderRadius: 8, padding: 6, display: 'flex' 
            }}>
              <Shield size={20} color="white" />
            </div>
            <h2 className="page-title" style={{ margin: 0 }}>Supervisor Command Center</h2>
          </div>
          <p className="page-subtitle">Welcome, {user?.first_name}. You have full operational and financial oversight.</p>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-secondary"><Calendar size={14} /> Month-to-Date</button>
          <button className="btn btn-primary" style={{ background: '#6366f1' }}>
             <Lock size={14} color="white" /> SOD: Open New Day
          </button>
        </div>
      </div>

      {/* ── SNAPSHOT GRID ─────────────────────────────────── */}
      <div className="stats-grid" style={{ marginBottom: 24 }}>
        {stats.map(s => (
          <div key={s.label} className="stat-card" style={{ borderLeft: `4px solid ${s.color}` }}>
            <div className="stat-icon" style={{ color: s.color }}>{s.icon}</div>
            <div className="stat-label">{s.label}</div>
            <div className="stat-value" style={{ fontSize: 22 }}>{fmt.currency(s.value, curr)}</div>
            <div className="stat-sub">{s.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        
        {/* ── MAIN ACTION CONSOLE ──────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          
          {/* Section: Operational Authority */}
          <section>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Settings size={14} /> Operational Authority & Control
            </div>
            <div className="grid-3" style={{ gap: 12 }}>
              <AdminActionBtn icon={<History />} label="Advanced Auditor" sub="Edit/Delete/Reverse past dates" color="#6366f1" onClick={() => window.location.href='/admin/auditor'} />
              <AdminActionBtn icon={<Lock />} label="EOD / Day Locking" sub="Close current business day" color="#ef4444" onClick={() => window.location.href='/admin/auditor'} />
              <AdminActionBtn icon={<Landmark />} label="Balance Manager" sub="Adjust opening/branch cash" color="#f59e0b" onClick={() => window.location.href='/admin/auditor'} />
            </div>
          </section>

          {/* Section: HR & Performance */}
          <section>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <UserCheck size={14} /> HR & Staff Performance
            </div>
            <div className="grid-3" style={{ gap: 12 }}>
              <AdminActionBtn icon={<BarChart3 />} label="Staff Appraisals" sub="Collection vs targets" color="#10b981" onClick={() => window.location.href='/admin/appraisals'} />
              <AdminActionBtn icon={<PieChart />} label="Staff P&L Report" sub="Net profit per officer" color="#a855f7" onClick={() => window.location.href='/admin/appraisals'} />
              <AdminActionBtn icon={<Users />} label="Payroll & Incentive" sub="Commission & salary prep" color="#3b82f6" onClick={() => {}} />
            </div>
          </section>

          {/* Section: Portfolio & Lifecycle */}
          <section>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertTriangle size={14} /> Portfolio Lifecycle Overrides
            </div>
            <div className="grid-3" style={{ gap: 12 }}>
              <AdminActionBtn icon={<FileText />} label="Lifecycle Override" sub="Force Status / Write-offs" color="#ef4444" onClick={() => window.location.href='/admin/portfolio'} />
              <AdminActionBtn icon={<TrendingUp />} label="Loan Renewals" sub="Renew / Restructure loans" color="#f59e0b" onClick={() => window.location.href='/admin/portfolio'} />
              <AdminActionBtn icon={<DollarSign />} label="Balance Correction" sub="Manual balance adjustments" color="#6366f1" onClick={() => window.location.href='/admin/portfolio'} />
            </div>
          </section>

          {/* Section: Reports & Data Export */}
          <section>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <FileText size={14} /> Reports & Data Export
            </div>
            <div className="grid-3" style={{ gap: 12 }}>
              <AdminActionBtn icon={<FileText />} label="Data Export Console" sub="Export clients, loans, transactions, expenses" color="#10b981" onClick={() => window.location.href='/admin/export'} />
            </div>
          </section>
        </div>

      </div>
    </div>
  );
}

function AdminActionBtn({ icon, label, sub, color, onClick }: { icon: any, label: string, sub: string, color: string, onClick?: () => void }) {
  return (
    <button className="card" onClick={onClick} style={{ 
      textAlign: 'left', cursor: 'pointer', transition: 'all 0.2s', 
      display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px',
      borderLeft: `3px solid ${color}`
    }}
    onMouseEnter={e => {
      e.currentTarget.style.transform = 'translateY(-2px)';
      e.currentTarget.style.background = 'var(--bg-hover)';
    }}
    onMouseLeave={e => {
      e.currentTarget.style.transform = 'none';
      e.currentTarget.style.background = 'var(--bg-card)';
    }}
    >
      <div style={{ color, background: color + '15', padding: 10, borderRadius: 10 }}>{icon}</div>
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#f0f6fc' }}>{label}</div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{sub}</div>
      </div>
    </button>
  );
}


