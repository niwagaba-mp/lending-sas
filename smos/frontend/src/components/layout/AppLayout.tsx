import { useState, useCallback } from 'react';
import { Outlet, Navigate, useLocation, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useApp } from '../../store/AppContext';
import { Bell, Search, WifiOff, Menu, X } from 'lucide-react';

export default function AppLayout() {
  const { state } = useApp();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  if (state.loading) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)' }}>
        <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>⚡</div>
          <div style={{ fontSize: 14, fontWeight: 600 }}>Loading SMOS...</div>
        </div>
      </div>
    );
  }

  if (!state.user) return <Navigate to="/login" replace />;

  const role = state.user.role;
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const location = useLocation();
  const path = location.pathname;

  if (role === 'cashier') {
    const cashierAllowed = [
      '/dashboard', '/cashier', '/clients', '/clients/crm', '/loans', '/loans/arrears', '/credit',
      '/repayments', '/expenses', '/reports', '/notifications',
    ];
    if (!cashierAllowed.includes(path)) return <Navigate to="/cashier" replace />;
  } else if (role === 'loan_officer') {
    const officerAllowed = ['/clients', '/loans', '/loans/arrears', '/notebook', '/notifications', '/clients/map'];
    if (!officerAllowed.includes(path)) return <Navigate to="/notebook" replace />;
  } else if (role === 'super_admin') {
    if (!['/superadmin'].includes(path)) return <Navigate to="/superadmin" replace />;
  } else if (role === 'tenant_admin') {
    const execDisallowed = ['/superadmin', '/cashier', '/admin', '/admin/appraisals', '/admin/auditor', '/admin/portfolio', '/admin/reports'];
    if (execDisallowed.includes(path)) return <Navigate to="/executive/console" replace />;
  } else if (role === 'admin' || role === 'branch_manager') {
    const supervisorDisallowed = ['/superadmin', '/executive/console'];
    if (supervisorDisallowed.includes(path)) return <Navigate to="/admin" replace />;
  }

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && search.trim()) {
      const q = search.trim().toLowerCase();
      // Route to best match
      if (q.includes('client')) navigate('/clients');
      else if (q.includes('loan')) navigate('/loans');
      else if (q.includes('report')) navigate('/reports');
      else if (q.includes('expense')) navigate('/expenses');
      else if (q.includes('staff')) navigate('/staff');
      else if (q.includes('notif')) navigate('/notifications');
      else navigate(`/clients?search=${encodeURIComponent(search.trim())}`);
      setSearch('');
    }
  };

  return (
    <div className="app-layout">
      {/* Mobile Sidebar Overlay */}
      <div
        className={`sidebar-overlay${sidebarOpen ? '' : ' hidden'}`}
        onClick={closeSidebar}
      />

      {/* Sidebar — passes mobile state */}
      <Sidebar mobileOpen={sidebarOpen} onClose={closeSidebar} />

      <div className="main-area">
        {/* Demo Mode Banner */}
        {state.demoMode && (
          <div style={{
            background: 'linear-gradient(90deg, #f59e0b22, #f59e0b11)',
            borderBottom: '1px solid #f59e0b55',
            padding: '5px 20px',
            display: 'flex', alignItems: 'center', gap: 8,
            fontSize: 11, color: '#f59e0b', fontWeight: 600, letterSpacing: '0.02em',
          }}>
            <WifiOff size={12} />
            DEMO MODE — Backend offline. Showing sample data. Start the backend server for live data.
          </div>
        )}

        {/* Top Bar */}
        <header className="topbar">
          <div className="flex items-center gap-3">
            {/* Hamburger (mobile only) */}
            <button
              className="hamburger-btn"
              onClick={() => setSidebarOpen(o => !o)}
              aria-label="Toggle navigation"
            >
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            {/* Search */}
            <div className="search-bar">
              <Search size={14} color="var(--text-muted)" />
              <input
                placeholder="Search clients, loans, reports…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                onKeyDown={handleSearch}
              />
            </div>
          </div>

          <div className="topbar-right">
            <div style={{
              background: 'var(--accent-glow)', border: '1px solid var(--accent-dim)',
              borderRadius: 8, padding: '4px 10px', fontSize: 11, color: 'var(--accent)', fontWeight: 600,
            }}>
              {state.user.tenant_name}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{state.user.currency}</div>
            {/* Bell → Notifications */}
            <div style={{ position: 'relative', cursor: 'pointer' }} onClick={() => navigate('/notifications')}>
              <Bell size={18} color="var(--text-secondary)" />
              <span className="notif-dot" />
            </div>
          </div>
        </header>

        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
