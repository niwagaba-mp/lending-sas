import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Search, ShieldCheck, ShieldAlert, Award } from 'lucide-react';
import api from '../../services/api';

export default function CreditScorePage() {
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.getClients();
      setClients(res.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const getGrade = (score: number) => {
    if (score >= 90) return { label: 'A+', color: '#3fb950', bg: '#3fb95020', desc: 'Elite Payor' };
    if (score >= 80) return { label: 'A',  color: '#3fb950', bg: '#3fb95015', desc: 'Low Risk' };
    if (score >= 70) return { label: 'B',  color: '#58a6ff', bg: '#58a6ff15', desc: 'Standard' };
    if (score >= 50) return { label: 'C',  color: '#f59e0b', bg: '#f59e0b15', desc: 'Watchlist' };
    return { label: 'F', color: '#ef4444', bg: '#ef444415', desc: 'High Default Risk' };
  };

  const filtered = clients.filter(c => {
    const matchesSearch = !search || 
      c.first_name?.toLowerCase().includes(search.toLowerCase()) ||
      c.last_name?.toLowerCase().includes(search.toLowerCase()) ||
      c.phone?.includes(search);
    
    if (filter === 'all') return matchesSearch;
    const grade = getGrade(c.credit_score || 0).label[0];
    return matchesSearch && grade === filter;
  });

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h2 className="page-title">Behavioral Credit Scoring</h2>
          <p className="page-subtitle">AI-driven risk assessment based on historical repayment patterns</p>
        </div>
        <div className="flex gap-3">
          <div className="stat-badge" style={{ background: '#3fb95015', border: '1px solid #3fb95044' }}>
            <span style={{ color: '#3fb950' }}>●</span> Avg Score: 74%
          </div>
        </div>
      </div>

      {/* ── RISK OVERVIEW CARDS ──────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        <RiskCard 
          icon={<ShieldCheck color="#3fb950" />} 
          title="Safe Portfolio" 
          value={clients.filter(c => (c.credit_score || 0) >= 70).length} 
          sub="Grade A & B clients"
          color="#3fb950"
        />
        <RiskCard 
          icon={<ShieldAlert color="#f59e0b" />} 
          title="Under Observation" 
          value={clients.filter(c => (c.credit_score || 0) >= 50 && (c.credit_score || 0) < 70).length} 
          sub="Grade C clients"
          color="#f59e0b"
        />
        <RiskCard 
          icon={<AlertTriangle color="#ef4444" />} 
          title="High Risk" 
          value={clients.filter(c => (c.credit_score || 0) < 50).length} 
          sub="Grade F / Default prone"
          color="#ef4444"
        />
        <RiskCard 
          icon={<Award color="#a78bfa" />} 
          title="Top Performers" 
          value={clients.filter(c => (c.credit_score || 0) >= 90).length} 
          sub="Qualify for limit increase"
          color="#a78bfa"
        />
      </div>

      {/* ── FILTERS ────────────────────────────────────────── */}
      <div className="flex justify-between items-center mb-6 gap-4">
        <div className="search-box flex-1">
          <Search size={16} className="search-icon" />
          <input 
            type="text" 
            className="search-input" 
            placeholder="Search clients by name or phone..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          {['all', 'A', 'B', 'C', 'F'].map(f => (
            <button 
              key={f}
              onClick={() => setFilter(f)}
              className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-secondary'}`}
              style={{ textTransform: 'uppercase' }}
            >
              {f === 'all' ? 'All Grades' : `Grade ${f}`}
            </button>
          ))}
        </div>
      </div>

      {/* ── SCORING TABLE ──────────────────────────────────── */}
      <div className="card no-padding">
        <table className="data-table">
          <thead>
            <tr>
              <th>Client Profile</th>
              <th>Current Score</th>
              <th>Risk Grade</th>
              <th>Payment Behavior</th>
              <th>Trend</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="text-center py-8">Analyzing credit history...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-8">No records found matching filters.</td></tr>
            ) : filtered.map(client => {
              const grade = getGrade(client.credit_score || 0);
              const scoreColor = grade.color;
              
              return (
                <tr key={client.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div style={{ 
                        width: 32, height: 32, borderRadius: '50%', background: '#30363d', 
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700 
                      }}>
                        {client.first_name?.[0]}{client.last_name?.[0]}
                      </div>
                      <div>
                        <div className="font-bold">{client.first_name} {client.last_name}</div>
                        <div className="text-xs text-muted">{client.national_id || client.phone}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <div style={{ flex: 1, height: 6, background: '#30363d', borderRadius: 3, maxWidth: 80, overflow: 'hidden' }}>
                        <div style={{ width: `${client.credit_score || 0}%`, height: '100%', background: scoreColor }} />
                      </div>
                      <span className="font-bold" style={{ color: scoreColor }}>{client.credit_score || 0}%</span>
                    </div>
                  </td>
                  <td>
                    <span style={{ 
                      padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 800,
                      background: grade.bg, color: grade.color, border: `1px solid ${grade.color}33`
                    }}>
                      GRADE {grade.label}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontSize: 12 }}>{grade.desc}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{client.loan_count || 0} loans processed</div>
                  </td>
                  <td>
                    {(client.credit_score || 0) >= 70 ? (
                      <div className="flex items-center gap-1 text-success text-xs">
                        <TrendingUp size={12} /> Improving
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-danger text-xs">
                        <TrendingDown size={12} /> Declining
                      </div>
                    )}
                  </td>
                  <td className="text-right">
                    <button className="btn btn-secondary btn-sm">Audit Details</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function RiskCard({ icon, title, value, sub, color }: any) {
  return (
    <div className="card" style={{ borderLeft: `4px solid ${color}` }}>
      <div className="flex justify-between items-start mb-3">
        <div style={{ background: `${color}15`, padding: 8, borderRadius: 8 }}>{icon}</div>
        <div style={{ fontSize: 24, fontWeight: 800, color: color }}>{value}</div>
      </div>
      <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 2 }}>{title}</div>
      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{sub}</div>
    </div>
  );
}

function AlertTriangle(props: any) {
  return (
    <svg 
      {...props}
      xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" 
    >
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/>
    </svg>
  );
}
