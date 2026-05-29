import { useState, useEffect } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, UserCheck, CreditCard, DollarSign,
  BarChart3, AlertTriangle, Scale, Bell, FileText,
  Building2, TrendingUp, Clock, ChevronRight, LogOut, Shield, AlertCircle, MapPin, Database, FileArchive
} from 'lucide-react';
import { useApp } from '../../store/AppContext';
import api from '../../services/api';

const nav = [
  { section: 'Core Operations', items: [
    { to: '/dashboard',     icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/cashier',       icon: DollarSign,      label: 'Cashier Desk' },
    { to: '/loans',         icon: CreditCard,      label: 'Loans & Arrears' },
    { to: '/repayments',    icon: Clock,           label: 'Repayments & Ledger' },
    { to: '/expenses',      icon: BarChart3,       label: 'Expenses' },
    { to: '/notebook',      icon: FileText,        label: 'My Notebook & Performance' },
    { to: '/reports',       icon: FileText,        label: 'Reports Hub' },
  ]},
  { section: 'Command Center', items: [
    { to: '/admin',         icon: Shield,         label: 'Supervisor Desk' },
    { to: '/admin/reports?type=arrears', icon: FileText,       label: 'Periodic Arrears (Per Staff)', indented: true },
    { to: '/admin/reports?type=defaulters', icon: AlertCircle,    label: 'Defaulter & Dormant Lists', indented: true },
    { to: '/admin/reports?type=written_off', icon: FileText,       label: 'Written-Off Summary', indented: true },
    { to: '/admin/reports?type=fees', icon: DollarSign,     label: 'Processing Fees Report', indented: true },
    { to: '/admin/reports?type=interest', icon: TrendingUp,     label: 'Interest Revenue Periodic', indented: true },
    { to: '/admin/reports?type=never_paid', icon: AlertTriangle,  label: 'Never Paid / High Risk', indented: true },
    { to: '/admin/reports?type=disbursement', icon: Users,          label: 'Periodic Disbursement (Per Staff)', indented: true },
    { to: '/admin/reports?type=expenses', icon: BarChart3,      label: 'Monthly Expense Analysis', indented: true },
    { to: '/vault',     icon: FileArchive,    label: 'Document Vault' },
  ]},
  { section: 'Infrastructure', items: [
    { to: '/superadmin',    icon: Shield,         label: 'System Owner Hub' },
    { to: '/branches',      icon: Building2,      label: 'Manage Branches' },
  ]},
  { section: 'Executive Oversight', items: [
    { to: '/executive/console', icon: Building2,      label: 'Multi-Branch Analytics' },
    { to: '/branches',          icon: Building2,      label: 'Manage Branches' },
    { to: '/reports',           icon: FileText,       label: 'Executive Reports' },
    { to: '/vault',     icon: FileArchive,    label: 'Document Vault' },
  ]},
  { section: 'People', items: [
    { to: '/branches',     icon: Building2,  label: 'Branches' },
    { to: '/staff',        icon: Users,      label: 'Staff' },
    { to: '/clients',      icon: UserCheck,  label: 'Clients' },
    { to: '/clients/map',  icon: MapPin,     label: 'GPS Client Map' },
  ]},
  { section: 'Legal & Recovery', items: [
    { to: '/legal',         icon: Scale,          label: 'Legal Cases' },
    { to: '/notifications', icon: Bell,           label: 'Notifications' },
  ]},
  { section: 'System', items: [
    { to: '/audit',         icon: FileText,   label: 'Audit Trail' },
  ]},
];

interface SidebarProps {
  mobileOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ mobileOpen = false, onClose }: SidebarProps) {
  const { state, logout } = useApp();
  const location = useLocation();
  const [isReportsExpanded, setIsReportsExpanded] = useState(false);
  const [branchInfo, setBranchInfo] = useState<{ name: string; client_count: number } | null>(null);

  useEffect(() => {
    const fetchBranchInfo = async () => {
      if (state.user?.branch_id) {
        try {
          const res = await api.getBranch(state.user.branch_id);
          if (res.data) {
            setBranchInfo({
              name: res.data.name || res.data.branch_name,
              client_count: res.data.client_count || 0
            });
          }
        } catch (err) {
          console.error('Failed to fetch branch info in sidebar:', err);
        }
      }
    };
    fetchBranchInfo();
  }, [state.user?.branch_id]);

  const isItemActive = (to: string) => {
    const [path, query] = to.split('?');
    if (location.pathname !== path) return false;
    if (!query) return true;
    const currentParams = new URLSearchParams(location.search);
    const targetParams = new URLSearchParams(query);
    for (const [key, val] of targetParams.entries()) {
      if (currentParams.get(key) !== val) return false;
    }
    return true;
  };

  const handleNavClick = () => {
    if (onClose) onClose();
  };

  return (
    <aside className={`sidebar${mobileOpen ? ' mobile-open' : ''}`}>
      <Link to="/" style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
        <div className="sidebar-logo" style={{ cursor: 'pointer' }}>
          <h1>⚡ SMOS</h1>
          <p>Smart Microfinance OS</p>
        </div>
      </Link>

      {nav.map((section, si) => {
        const role = state.user?.role || 'admin';
        let visibleItems = section.items;

        if (role === 'super_admin') {
          if (section.section !== 'Infrastructure') return null;
        } else if (role === 'tenant_admin') {
          if (['Infrastructure', 'Command Center', 'Core Operations', 'People', 'Legal & Recovery', 'System'].includes(section.section)) return null;
        } else if (role === 'admin' || role === 'branch_manager') {
          if (['Infrastructure', 'Executive Oversight', 'Core Operations'].includes(section.section)) return null;
        } else if (role === 'cashier') {
          if (['Infrastructure', 'Executive Oversight', 'Command Center', 'Legal & Recovery', 'System'].includes(section.section)) return null;
          const cashierAllowed = ['/dashboard', '/cashier', '/loans', '/repayments', '/expenses', '/reports', '/clients', '/clients/crm', '/credit'];
          visibleItems = section.items.filter(i => cashierAllowed.includes(i.to));
        } else if (role === 'loan_officer') {
          if (['Infrastructure', 'Executive Oversight', 'Command Center', 'Legal & Recovery', 'System', 'Core Operations'].includes(section.section) && section.section !== 'Core Operations') return null;
          const officerAllowed = ['/loans', '/clients', '/notebook', '/reports'];
          visibleItems = section.items.filter(i => officerAllowed.includes(i.to));
        }

        if (visibleItems.length === 0) return null;

        return (
          <div className="sidebar-section" key={section.section}>
            <div className="sidebar-label">{section.section}</div>
            
            {section.section === 'Command Center' && (
              <>
                <NavLink to="/admin" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
                  <Shield size={15} /> Supervisor Desk
                </NavLink>

                <NavLink to="/admin/export" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
                  <Database size={15} /> Data Export Console
                </NavLink>

                <NavLink to="/notebook" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
                  <FileText size={15} /> My Notebook & Performance
                </NavLink>
                
                <div 
                  className={`nav-item ${isReportsExpanded ? 'active' : ''}`} 
                  onClick={() => setIsReportsExpanded(!isReportsExpanded)}
                  style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between' }}
                >
                  <div className="flex items-center gap-3">
                    <FileText size={15} /> Reports Hub
                  </div>
                  <ChevronRight size={14} style={{ transform: isReportsExpanded ? 'rotate(90deg)' : 'none', transition: 'all 0.2s' }} />
                </div>

                {isReportsExpanded && section.items.filter(i => i.indented).map(item => (
                  <Link
                    key={item.to + item.label}
                    to={item.to}
                    className={`nav-item${isItemActive(item.to) ? ' active' : ''}`}
                    style={{ 
                      marginLeft: 12, fontSize: '0.92em', opacity: 0.85,
                      borderLeft: '1px solid var(--border)', borderRadius: 0, paddingLeft: 16
                    }}
                  >
                    <item.icon size={13} />
                    {item.label}
                  </Link>
                ))}
              </>
            )}

            {section.section !== 'Command Center' && visibleItems.map(item => (
              <NavLink
                key={item.to + item.label}
                to={item.to}
                end={item.to === '/loans'}
                onClick={handleNavClick}
                className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
                style={item.indented ? { 
                  marginLeft: 12, fontSize: '0.92em', opacity: 0.85,
                  borderLeft: '1px solid var(--border)', borderRadius: 0, paddingLeft: 16
                } : {}}
              >
                <item.icon size={item.indented ? 13 : 15} />
                {item.label}
              </NavLink>
            ))}
          </div>
        );
      })}

      {/* User info */}
      <div style={{ marginTop: 'auto', padding: '16px 20px', borderTop: '1px solid var(--border)' }}>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>{state.user?.role?.replace('_',' ').toUpperCase()}</div>
        <div style={{ fontSize: 13, fontWeight: 600 }}>{state.user?.first_name} {state.user?.last_name}</div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 10 }}>
          {branchInfo ? `${branchInfo.name} (${branchInfo.client_count} clients)` : (state.user?.branch_name || 'Loading branch...')}
        </div>
        <button className="btn btn-secondary btn-sm w-full" onClick={logout}>
          <LogOut size={13} /> Logout
        </button>
      </div>
    </aside>
  );
}
