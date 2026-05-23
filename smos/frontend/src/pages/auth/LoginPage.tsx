import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useApp } from '../../store/AppContext';
import { Lock, Mail, Eye, EyeOff, Loader } from 'lucide-react';

export default function LoginPage() {
  const { state, login } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (state.user) {
    if (state.user.role === 'super_admin') return <Navigate to="/superadmin" replace />;
    if (state.user.role === 'tenant_admin') return <Navigate to="/executive/console" replace />;
    if (state.user.role === 'cashier') return <Navigate to="/cashier" replace />;
    if (state.user.role === 'loan_officer') return <Navigate to="/notebook" replace />;
    if (state.user.role === 'admin' || state.user.role === 'branch_manager') return <Navigate to="/admin" replace />;
    return <Navigate to="/dashboard" replace />;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const fillAndLogin = (m: string, p: string) => {
    setEmail(m);
    setPassword(p);
  };

  return (
    <div className="auth-page">
      <div className="auth-box">
        <div className="auth-logo">
          <div style={{ fontSize: 36, marginBottom: 8 }}>⚡</div>
          <h1>SMART MICROFINANCE OS</h1>
          <p>Decentralized Lending Intelligence Platform</p>
        </div>

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                className="form-control"
                style={{ paddingLeft: 36 }}
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                className="form-control"
                style={{ paddingLeft: 36, paddingRight: 36 }}
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
              <button type="button" onClick={() => setShowPw(!showPw)}
                style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="alert mb-4" style={{
              background: error.includes('Backend offline') ? '#f59e0b18' : '#ef444418',
              border: `1px solid ${error.includes('Backend offline') ? '#f59e0b55' : '#ef444455'}`,
              color: error.includes('Backend offline') ? '#f59e0b' : '#ef4444',
              borderRadius: 8, padding: '10px 14px', fontSize: 13,
            }}>
              {error}
            </div>
          )}

          <button className="btn btn-primary w-full" type="submit" disabled={loading} style={{ justifyContent: 'center', marginTop: 8, height: 44 }}>
            {loading ? <Loader size={14} className="spin" /> : null}
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 12, textAlign: 'center' }}>
            Quick Demo Accounts (Click to Fill)
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <button type="button" onClick={() => fillAndLogin('superadmin@kilimomf.co.ug', 'Superadmin@2024')} style={{
              padding: '10px 12px', background: 'var(--bg-secondary)', border: email === 'superadmin@kilimomf.co.ug' ? '1px solid #a855f7' : '1px solid var(--border)',
              borderRadius: 8, textAlign: 'left', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', flexDirection: 'column'
            }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#a855f7' }}>Super Admin (SaaS)</span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>System Owner</span>
            </button>

            <button type="button" onClick={() => fillAndLogin('owner@kilimomf.co.ug', 'Owner@2024')} style={{
              padding: '10px 12px', background: 'var(--bg-secondary)', border: email === 'owner@kilimomf.co.ug' ? '1px solid #3fb950' : '1px solid var(--border)',
              borderRadius: 8, textAlign: 'left', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', flexDirection: 'column'
            }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#3fb950' }}>Business Owner</span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Multi-Branch Exec</span>
            </button>

            <button type="button" onClick={() => fillAndLogin('admin@kilimomf.co.ug', 'Smos@2024')} style={{
              padding: '10px 12px', background: 'var(--bg-secondary)', border: email === 'admin@kilimomf.co.ug' ? '1px solid var(--accent)' : '1px solid var(--border)',
              borderRadius: 8, textAlign: 'left', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', flexDirection: 'column'
            }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)' }}>Branch Manager</span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Supervisor Desk</span>
            </button>

            <button type="button" onClick={() => fillAndLogin('sarah@kilimomf.co.ug', 'Cashier@2024')} style={{
              padding: '10px 12px', background: 'var(--bg-secondary)', border: email === 'sarah@kilimomf.co.ug' ? '1px solid #58a6ff' : '1px solid var(--border)',
              borderRadius: 8, textAlign: 'left', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', flexDirection: 'column'
            }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#58a6ff' }}>Cashier POS</span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Workstation Desk</span>
            </button>

            <button type="button" onClick={() => fillAndLogin('officer@kilimomf.co.ug', 'password123')} style={{
              padding: '10px 12px', background: 'var(--bg-secondary)', border: email === 'officer@kilimomf.co.ug' ? '1px solid #f59e0b' : '1px solid var(--border)',
              borderRadius: 8, textAlign: 'left', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', flexDirection: 'column',
              gridColumn: 'span 2'
            }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#f59e0b' }}>Loan Officer</span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Field & Recovery Desk</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
