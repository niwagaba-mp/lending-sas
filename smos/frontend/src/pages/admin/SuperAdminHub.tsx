import { useState, useEffect } from 'react';
import { 
  Shield, Users, Globe, Lock, Unlock, DollarSign, TrendingUp, 
  Map as MapIcon, Activity, ExternalLink, Plus, Search, 
  BarChart3, Clock, Smartphone, Laptop, CheckSquare, Square, Trash2, Calendar, UserCheck, X, Server, Cpu, Database, Settings, Check
} from 'lucide-react';
import { fmt } from '../../store/AppContext';

export default function SuperAdminHub() {
  const [tenants, setTenants] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [financials, setFinancials] = useState<any>(null);
  const [, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'tenants' | 'billing' | 'geo' | 'finance' | 'tasks'>('tenants');
  const [search, setSearch] = useState('');

  // Modals State
  const [showHealthModal, setShowHealthModal] = useState(false);
  const [showOnboardModal, setShowOnboardModal] = useState(false);
  const [editingBillingTenant, setEditingBillingTenant] = useState<any>(null);

  // Billing & Add-ons Editor State
  const [editBaseBilling, setEditBaseBilling] = useState<number>(0);
  const [editAddons, setEditAddons] = useState<string[]>([]);
  const [customAddonName, setCustomAddonName] = useState('');
  const [customAddonPrice, setCustomAddonPrice] = useState('');

  // New Tenant Onboarding Form State
  const [newTenantName, setNewTenantName] = useState('');
  const [newTenantSlug, setNewTenantSlug] = useState('');
  const [newTenantEmail, setNewTenantEmail] = useState('');
  const [newTenantPassword, setNewTenantPassword] = useState('');
  const [newTenantRecoveryEmail, setNewTenantRecoveryEmail] = useState('');
  const [newTenantPlan, setNewTenantPlan] = useState('Enterprise');
  const [newTenantBilling, setNewTenantBilling] = useState('500000');

  // Task Manager State with Staff Assigned
  const [tasks, setTasks] = useState([
    { id: '1', title: 'Deploy High-Availability DB Replica for Nairobi Node', priority: 'High', status: 'Pending', dueDate: '2026-06-01', assignee: 'Alex K. (DevOps Lead)' },
    { id: '2', title: 'Quarterly Cloud Infrastructure Penetration Audit', priority: 'High', status: 'In Progress', dueDate: '2026-05-25', assignee: 'Sarah M. (SecOps)' },
    { id: '3', title: 'Upgrade Kubernetes Cluster to v1.31', priority: 'Medium', status: 'Completed', dueDate: '2026-05-15', assignee: 'David W. (Infra)' },
    { id: '4', title: 'Renew Enterprise Wildcard SSL Certificates', priority: 'Urgent', status: 'Pending', dueDate: '2026-05-30', assignee: 'Alex K. (DevOps Lead)' },
  ]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskAssignee, setNewTaskAssignee] = useState('Alex K. (DevOps Lead)');

  // Expenses Log State
  const [expenses, setExpenses] = useState([
    { id: '1', category: 'AWS Cloud Hosting (EC2, RDS, S3)', amount: 1200000, date: '2026-05-12', status: 'Paid' },
    { id: '2', category: 'Global SMS Gateway OTP Credits', amount: 450000, date: '2026-05-14', status: 'Paid' },
    { id: '3', category: 'Site Reliability Engineering Retainer', amount: 2500000, date: '2026-05-01', status: 'Paid' },
    { id: '4', category: 'SOC2 Security Audit Compliance', amount: 800000, date: '2026-05-18', status: 'Pending' },
  ]);
  const [newExpCategory, setNewExpCategory] = useState('');
  const [newExpAmount, setNewExpAmount] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [tenantsRes, logsRes, finRes] = await Promise.all([
        { data: [
          { id: 't1', name: 'Kilimo Microfinance', slug: 'kilimo-mf', email: 'admin@kilimo.co.ug', plan_name: 'Enterprise', base_billing: 500000, billing_amount: 750000, sub_status: 'active', user_count: 12, loan_count: 433, country: 'Uganda', created_at: '2024-01-15', addons: ['Dedicated DB Replica (+150k)', 'Premium SMS Integration (+100k)'] },
          { id: 't2', name: 'Bukoto SACCO', slug: 'bukoto-sacco', email: 'info@bukoto.ug', plan_name: 'Premium', base_billing: 300000, billing_amount: 300000, sub_status: 'overdue', user_count: 8, loan_count: 156, country: 'Uganda', created_at: '2024-02-10', addons: [] },
          { id: 't3', name: 'Nairobi Credit', slug: 'nairobi-cr', email: 'billing@nairobi.ke', plan_name: 'Basic', base_billing: 150000, billing_amount: 150000, sub_status: 'locked', user_count: 4, loan_count: 89, country: 'Kenya', created_at: '2024-03-05', addons: [] }
        ]},
        { data: [
          { id: 'l1', user_name: 'Sarah Nambi', tenant_name: 'Kilimo Microfinance', login_time: new Date().toISOString(), ip_address: '197.232.44.12', city: 'Kampala', country: 'Uganda', device_type: 'desktop', browser_name: 'Chrome' },
          { id: 'l2', user_name: 'John Okello', tenant_name: 'Bukoto SACCO', login_time: new Date(Date.now() - 3600000).toISOString(), ip_address: '41.210.155.67', city: 'Masaka', country: 'Uganda', device_type: 'mobile', browser_name: 'Safari' },
          { id: 'l3', user_name: 'Alice Wambui', tenant_name: 'Nairobi Credit', login_time: new Date(Date.now() - 7200000).toISOString(), ip_address: '102.68.12.9', city: 'Nairobi', country: 'Kenya', device_type: 'desktop', browser_name: 'Firefox' }
        ]},
        { data: { 
          total_revenue: 16400000, 
          mrr: 950000, 
          expenses: 4950000, 
          projections: [
            { month: 'Jun', value: 18500000 }, { month: 'Jul', value: 22000000 }, { month: 'Aug', value: 26500000 }
          ]
        }}
      ]);

      setTenants(tenantsRes.data);
      setLogs(logsRes.data);
      setFinancials(finRes.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const toggleLock = async (tenant: any) => {
    const action = tenant.sub_status === 'locked' ? 'Unlock' : 'Lock';
    if (window.confirm(`Are you sure you want to ${action} ${tenant.name}?`)) {
      loadData();
    }
  };

  const handleOnboardTenant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTenantName || !newTenantSlug) return;
    setTenants([{
      id: String(Date.now()),
      name: newTenantName,
      slug: newTenantSlug,
      email: newTenantEmail || 'admin@' + newTenantSlug + '.co.ug',
      plan_name: newTenantPlan,
      base_billing: Number(newTenantBilling),
      billing_amount: Number(newTenantBilling),
      addons: [],
      sub_status: 'active',
      user_count: 1,
      loan_count: 0,
      country: 'Uganda',
      created_at: new Date().toISOString().split('T')[0]
    }, ...tenants]);
    setNewTenantName('');
    setNewTenantSlug('');
    setNewTenantEmail('');
    setNewTenantPassword('');
    setNewTenantRecoveryEmail('');
    setShowOnboardModal(false);
  };

  const openBillingEditor = (t: any) => {
    setEditingBillingTenant(t);
    setEditBaseBilling(t.base_billing || t.billing_amount);
    setEditAddons(t.addons || []);
    setCustomAddonName('');
    setCustomAddonPrice('');
  };

  const handleAddCustomService = () => {
    if (!customAddonName || !customAddonPrice) return;
    const item = `${customAddonName} (+${(Number(customAddonPrice)/1000).toLocaleString()}k)`;
    setEditAddons([...editAddons, item]);
    setCustomAddonName('');
    setCustomAddonPrice('');
  };

  const handleRemoveAddon = (index: number) => {
    setEditAddons(editAddons.filter((_, i) => i !== index));
  };

  const saveBillingChanges = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBillingTenant) return;

    let totalAddonPrice = 0;
    editAddons.forEach(a => {
      const match = a.match(/\(\+([0-9,.]+)k\)/);
      if (match) {
        const valClean = match[1].replace(/,/g, '');
        totalAddonPrice += Number(valClean) * 1000;
      }
    });

    const newTotalBilling = Number(editBaseBilling) + totalAddonPrice;

    setTenants(tenants.map(t => t.id === editingBillingTenant.id ? {
      ...t,
      base_billing: Number(editBaseBilling),
      billing_amount: newTotalBilling,
      addons: editAddons
    } : t));

    setEditingBillingTenant(null);
  };

  const addTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    setTasks([...tasks, {
      id: String(Date.now()),
      title: newTaskTitle.trim(),
      priority: 'Medium',
      status: 'Pending',
      dueDate: new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0],
      assignee: newTaskAssignee
    }]);
    setNewTaskTitle('');
  };

  const toggleTaskStatus = (id: string) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, status: t.status === 'Completed' ? 'Pending' : 'Completed' } : t));
  };

  const deleteTask = (id: string) => {
    setTasks(tasks.filter(t => t.id !== id));
  };

  const addExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExpCategory || !newExpAmount) return;
    setExpenses([...expenses, {
      id: String(Date.now()),
      category: newExpCategory,
      amount: Number(newExpAmount),
      date: new Date().toISOString().split('T')[0],
      status: 'Paid'
    }]);
    setNewExpCategory('');
    setNewExpAmount('');
  };

  const totalExp = expenses.reduce((sum, e) => sum + e.amount, 0);
  const grossEarnings = financials?.total_revenue || 16400000;
  const netProfit = grossEarnings - totalExp;
  const liveMRR = tenants.reduce((sum, t) => sum + (t.billing_amount || 0), 0);

  return (
    <div className="page-container" style={{ background: 'var(--bg-card)', minHeight: '100vh', padding: '24px 40px' }}>
      
      {/* ── SUPER HEADER ───────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <div style={{ background: 'var(--accent)', padding: 8, borderRadius: 10 }}>
              <Shield size={24} color="#000" />
            </div>
            <h1 style={{ fontSize: 28, fontWeight: 900, margin: 0, letterSpacing: '-0.02em' }}>SYSTEM OWNER CONTROL PLANE</h1>
          </div>
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>Global Governance, Multi-Tenant Oversight & Infrastructure Billing</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="btn btn-secondary" onClick={() => setShowHealthModal(true)}>
            <Activity size={18} /> System Health
          </button>
          <button className="btn btn-primary" style={{ background: 'var(--accent)', color: '#000' }} onClick={() => setShowOnboardModal(true)}>
            <Plus size={18} /> Onboard New Tenant
          </button>
        </div>
      </div>

      {/* ── GLOBAL KPI GRID ────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 32 }}>
        <StatCard label="Live Tenants" value={tenants.length} icon={<Globe size={20} />} color="var(--accent)" sub="Across 2 Countries" />
        <StatCard label="Monthly Recurring Revenue" value={fmt.currency(liveMRR, 'UGX')} icon={<TrendingUp size={20} />} color="var(--green)" sub="Real-time calculated MRR" />
        <StatCard label="Net Operating Profit" value={fmt.currency(netProfit, 'UGX')} icon={<DollarSign size={20} />} color="var(--accent)" sub={`${((netProfit / grossEarnings) * 100).toFixed(1)}% profit margin`} />
        <StatCard label="Total Platform Users" value="1,240" icon={<Users size={20} />} color="#a855f7" sub="24 currently online" />
      </div>

      {/* ── NAVIGATION TABS ────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 32, borderBottom: '1px solid var(--border)', marginBottom: 24 }}>
        <TabBtn active={activeTab === 'tenants'} onClick={() => setActiveTab('tenants')} icon={<Globe size={16} />} label="Tenant Management" />
        <TabBtn active={activeTab === 'billing'} onClick={() => setActiveTab('billing')} icon={<DollarSign size={16} />} label="Billing & Subscriptions" />
        <TabBtn active={activeTab === 'geo'} onClick={() => setActiveTab('geo')} icon={<MapIcon size={16} />} label="Geo-Security Tracking" />
        <TabBtn active={activeTab === 'finance'} onClick={() => setActiveTab('finance')} icon={<BarChart3 size={16} />} label="System P&L & Projections" />
        <TabBtn active={activeTab === 'tasks'} onClick={() => setActiveTab('tasks')} icon={<CheckSquare size={16} />} label="Infrastructure Tasks & Expenses" />
      </div>

      {/* ── TAB CONTENT: TENANTS ───────────────────────────── */}
      {activeTab === 'tenants' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}>
            <div className="search-bar" style={{ width: 400 }}>
              <Search size={18} />
              <input type="text" placeholder="Search tenants by name, slug or email..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>
          <table className="table">
            <thead>
              <tr>
                <th>Institution Name</th>
                <th>Access Slug</th>
                <th>Plan</th>
                <th>Users / Loans</th>
                <th>Billing Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tenants.map(t => (
                <tr key={t.id}>
                  <td>
                    <div style={{ fontWeight: 700 }}>{t.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{t.email}</div>
                  </td>
                  <td><code style={{ background: 'var(--bg-secondary)', padding: '2px 6px', borderRadius: 4 }}>{t.slug}</code></td>
                  <td>{t.plan_name}</td>
                  <td>
                    <div style={{ fontSize: 12 }}>{t.user_count} Staff</div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{t.loan_count} Loans</div>
                  </td>
                  <td>
                    <span className={`badge badge-${t.sub_status === 'active' ? 'success' : t.sub_status === 'overdue' ? 'warning' : 'danger'}`}>
                      {t.sub_status.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                      <button className="btn btn-icon-sm" title="View Console"><ExternalLink size={14} /></button>
                      <button 
                        className={`btn btn-icon-sm ${t.sub_status === 'locked' ? 'text-success' : 'text-danger'}`} 
                        onClick={() => toggleLock(t)}
                        title={t.sub_status === 'locked' ? 'Unlock Tenant' : 'Lock Tenant'}
                      >
                        {t.sub_status === 'locked' ? <Unlock size={14} /> : <Lock size={14} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── TAB CONTENT: BILLING & SUBSCRIPTIONS ────────────── */}
      {activeTab === 'billing' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>SaaS Subscription & Add-On Services Billing</h3>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>Adjust base recurring charges and provision customized microfinance add-on modules.</p>
            </div>
            <div className="badge badge-success" style={{ fontSize: 13, padding: '6px 12px' }}>
              Total MRR: {fmt.currency(liveMRR, 'UGX')} / mo
            </div>
          </div>
          <table className="table">
            <thead>
              <tr>
                <th>Institution Name</th>
                <th>Current Plan</th>
                <th>Base Billing</th>
                <th>Active Add-on Services</th>
                <th>Total Monthly Billing</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tenants.map(t => (
                <tr key={t.id}>
                  <td>
                    <div style={{ fontWeight: 700 }}>{t.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Slug: {t.slug}</div>
                  </td>
                  <td><span className="badge badge-active">{t.plan_name}</span></td>
                  <td><strong style={{ color: 'var(--text-primary)' }}>{fmt.currency(t.base_billing || t.billing_amount, 'UGX')}</strong></td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {(!t.addons || t.addons.length === 0) ? (
                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>No additional services</span>
                      ) : (
                        t.addons.map((addon: string, i: number) => (
                          <div key={i} style={{ fontSize: 11, background: 'var(--bg-secondary)', padding: '4px 8px', borderRadius: 4, display: 'inline-flex', width: 'fit-content', border: '1px solid var(--border)' }}>
                            {addon}
                          </div>
                        ))
                      )}
                    </div>
                  </td>
                  <td><strong style={{ fontSize: 15, color: 'var(--green)', fontWeight: 900 }}>{fmt.currency(t.billing_amount, 'UGX')}</strong></td>
                  <td>
                    <span className={`badge badge-${t.sub_status === 'active' ? 'success' : t.sub_status === 'overdue' ? 'warning' : 'danger'}`}>
                      {t.sub_status.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button className="btn btn-secondary" style={{ fontSize: 12, padding: '6px 12px' }} onClick={() => openBillingEditor(t)}>
                      <Settings size={14} /> Adjust Billing & Services
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── TAB CONTENT: GEO-TRACKING ──────────────────────── */}
      {activeTab === 'geo' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: 24 }}>
          <div className="card" style={{ padding: 24, height: 500, background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
              <MapIcon size={48} style={{ marginBottom: 16, opacity: 0.5 }} />
              <h3>Interactive Global Access Map</h3>
              <p>Visualizing real-time login origins across SMOS nodes.</p>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 24 }}>
                <span className="badge badge-success">UGANDA (12)</span>
                <span className="badge badge-active">KENYA (4)</span>
                <span className="badge badge-draft">TANZANIA (1)</span>
              </div>
            </div>
          </div>
          <div className="card" style={{ padding: 0 }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', fontWeight: 800, fontSize: 12, textTransform: 'uppercase' }}>
              <Clock size={14} style={{ display: 'inline', marginRight: 8 }} /> Real-time Access Logs
            </div>
            <div style={{ maxHeight: 440, overflowY: 'auto' }}>
              {logs.map(l => (
                <div key={l.id} style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontWeight: 700, fontSize: 13 }}>{l.user_name}</span>
                    <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{l.browser_name}</span>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 600, marginBottom: 8 }}>{l.tenant_name}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: 'var(--text-muted)' }}>
                    {l.device_type === 'desktop' ? <Laptop size={12} /> : <Smartphone size={12} />}
                    {l.city}, {l.country} · {l.ip_address}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB CONTENT: FINANCE / P&L ─────────────────────── */}
      {activeTab === 'finance' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 24 }}>
          <div className="card" style={{ padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>SaaS Profit & Loss Statement</h3>
              <span className="badge badge-active" style={{ fontSize: 11 }}>MONTH TO DATE</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Revenue Streams</div>
              <FinRow label="SaaS Tenant Subscriptions" value={12500000} />
              <FinRow label="SMS Gateway & API Surcharges" value={2100000} />
              <FinRow label="Node Setup & Custom Onboarding" value={1800000} />
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12, marginTop: 4 }}>
                <FinRow label="TOTAL GROSS REVENUE" value={grossEarnings} highlight />
              </div>

              <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: 16 }}>Operational Expenses</div>
              {expenses.map(exp => (
                <FinRow key={exp.id} label={exp.category} value={exp.amount} isExpense />
              ))}
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12, marginTop: 4 }}>
                <FinRow label="TOTAL OPERATING EXPENSES" value={totalExp} isExpense highlight />
              </div>

              <div style={{ borderTop: '2px solid var(--accent)', paddingTop: 16, marginTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 16, fontWeight: 900, color: 'var(--text-primary)' }}>NET SYSTEM OPERATING PROFIT</span>
                <span style={{ fontSize: 22, fontWeight: 900, color: 'var(--green)' }}>{fmt.currency(netProfit, 'UGX')}</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div className="card" style={{ padding: 24 }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 20 }}>Sales & Revenue Growth Projections</h3>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 24, height: 220, paddingBottom: 20 }}>
                {financials?.projections.map((p: any) => (
                  <div key={p.month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                    <div style={{ 
                      width: '100%', 
                      height: (p.value / 30000000) * 100 + '%', 
                      background: 'linear-gradient(180deg, var(--accent) 0%, var(--green) 100%)', 
                      borderRadius: '6px 6px 0 0',
                      boxShadow: '0 0 15px rgba(168, 85, 247, 0.3)'
                    }}></div>
                    <span style={{ fontSize: 13, fontWeight: 800 }}>{p.month} Projection</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)' }}>{fmt.currency(p.value, 'UGX')}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB CONTENT: TASKS & EXPENSES ──────────────────── */}
      {activeTab === 'tasks' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 24 }}>
          {/* System Task Manager */}
          <div className="card" style={{ padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>System Operations Task Manager</h3>
              <span className="badge badge-warning" style={{ fontSize: 11 }}>INFRASTRUCTURE DEPLOYMENT</span>
            </div>

            <form onSubmit={addTask} style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
              <input
                className="form-control"
                style={{ flex: 2 }}
                placeholder="Enter new infrastructure task..."
                value={newTaskTitle}
                onChange={e => setNewTaskTitle(e.target.value)}
              />
              <select
                className="form-control"
                style={{ flex: 1 }}
                value={newTaskAssignee}
                onChange={e => setNewTaskAssignee(e.target.value)}
              >
                <option value="Alex K. (DevOps Lead)">Alex K. (DevOps)</option>
                <option value="Sarah M. (SecOps)">Sarah M. (SecOps)</option>
                <option value="David W. (Infra)">David W. (Infra)</option>
                <option value="Elena R. (DBA)">Elena R. (DBA)</option>
              </select>
              <button className="btn btn-primary" type="submit"><Plus size={16} /> Add Task</button>
            </form>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {tasks.map(t => (
                <div key={t.id} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px',
                  background: 'var(--bg-secondary)', borderRadius: 10, borderLeft: t.status === 'Completed' ? '4px solid var(--green)' : '4px solid #a855f7'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <button type="button" onClick={() => toggleTaskStatus(t.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: t.status === 'Completed' ? 'var(--green)' : 'var(--text-muted)' }}>
                      {t.status === 'Completed' ? <CheckSquare size={20} /> : <Square size={20} />}
                    </button>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: t.status === 'Completed' ? 'var(--text-muted)' : 'var(--text-primary)', textDecoration: t.status === 'Completed' ? 'line-through' : 'none' }}>
                        {t.title}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                        <UserCheck size={12} color="var(--accent)" /> Assigned Staff: <strong style={{ color: 'var(--text-secondary)' }}>{t.assignee}</strong>
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span className={`badge badge-${t.status === 'Completed' ? 'success' : 'warning'}`}>{t.status}</span>
                    <button type="button" onClick={() => deleteTask(t.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--red)', opacity: 0.7 }} title="Delete Task">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Infrastructure Expenses Log */}
          <div className="card" style={{ padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>System Infrastructure Expenses Log</h3>
              <span className="badge badge-danger" style={{ fontSize: 11 }}>OPEX LOG</span>
            </div>

            <form onSubmit={addExpense} style={{ display: 'grid', gridTemplateColumns: '1fr 140px auto', gap: 10, marginBottom: 24 }}>
              <input
                className="form-control"
                placeholder="Expense description (e.g. AWS S3 Storage)..."
                value={newExpCategory}
                onChange={e => setNewExpCategory(e.target.value)}
              />
              <input
                className="form-control"
                type="number"
                placeholder="Amount (UGX)"
                value={newExpAmount}
                onChange={e => setNewExpAmount(e.target.value)}
              />
              <button className="btn btn-primary" type="submit" style={{ background: 'var(--red)', color: 'white', border: 'none' }}><Plus size={16} /> Log</button>
            </form>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {expenses.map(e => (
                <div key={e.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'var(--bg-secondary)', borderRadius: 10 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>{e.category}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                      <Calendar size={12} /> {e.date}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--red)' }}>-{fmt.currency(e.amount, 'UGX')}</div>
                    <span className="badge badge-active" style={{ fontSize: 10, marginTop: 2 }}>{e.status.toUpperCase()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: SYSTEM HEALTH DIAGNOSTICS ─────────────────── */}
      {showHealthModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0, 0, 0, 0.75)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }} onClick={() => setShowHealthModal(false)}>
          <div style={{ width: '100%', maxWidth: 700, background: 'var(--bg-card)', border: '1px solid var(--border)', padding: 32, borderRadius: 16, boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, borderBottom: '1px solid var(--border)', paddingBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Activity size={24} color="var(--green)" />
                <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>Global Node Telemetry & Health</h2>
              </div>
              <button onClick={() => setShowHealthModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={20} /></button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 28 }}>
              <div style={{ background: 'var(--bg-secondary)', padding: 16, borderRadius: 12, border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}><Cpu size={14} /> CPU Utilization</div>
                <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--green)' }}>28.4%</div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>Normal load across 16 vCPUs</div>
              </div>

              <div style={{ background: 'var(--bg-secondary)', padding: 16, borderRadius: 12, border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}><Database size={14} /> Replica Lag</div>
                <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--green)' }}>0.012s</div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>Fully synchronized DB cluster</div>
              </div>

              <div style={{ background: 'var(--bg-secondary)', padding: 16, borderRadius: 12, border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}><Server size={14} /> WebSocket Nodes</div>
                <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--accent)' }}>1,240 / 5,000</div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>Concurrent persistent conns</div>
              </div>
            </div>

            <h3 style={{ fontSize: 14, fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 12 }}>Regional Node Status</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'var(--bg-secondary)', borderRadius: 8 }}>
                <div style={{ fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--green)' }}></span> Kampala Primary Node (UG)</div>
                <span style={{ fontSize: 12, fontFamily: 'monospace', color: 'var(--text-muted)' }}>Latency: 14ms · 99.99% uptime</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'var(--bg-secondary)', borderRadius: 8 }}>
                <div style={{ fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--green)' }}></span> Nairobi Secondary Node (KE)</div>
                <span style={{ fontSize: 12, fontFamily: 'monospace', color: 'var(--text-muted)' }}>Latency: 28ms · 99.98% uptime</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'var(--bg-secondary)', borderRadius: 8 }}>
                <div style={{ fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--green)' }}></span> Dar es Salaam Edge Node (TZ)</div>
                <span style={{ fontSize: 12, fontFamily: 'monospace', color: 'var(--text-muted)' }}>Latency: 42ms · 99.95% uptime</span>
              </div>
            </div>

            <div style={{ marginTop: 24, textAlign: 'right' }}>
              <button className="btn btn-primary" onClick={() => setShowHealthModal(false)}>Close Diagnostics</button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: ONBOARD NEW TENANT ────────────────────────── */}
      {showOnboardModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0, 0, 0, 0.75)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }} onClick={() => setShowOnboardModal(false)}>
          <div style={{ width: '100%', maxWidth: 600, background: 'var(--bg-card)', border: '1px solid var(--border)', padding: 32, borderRadius: 16, boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, borderBottom: '1px solid var(--border)', paddingBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Plus size={24} color="var(--accent)" />
                <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>Onboard New SaaS Tenant</h2>
              </div>
              <button onClick={() => setShowOnboardModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={20} /></button>
            </div>

            <form onSubmit={handleOnboardTenant} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Institution Name</label>
                <input className="form-control" placeholder="e.g. Victoria SACCO Ltd" value={newTenantName} onChange={e => setNewTenantName(e.target.value)} required />
              </div>

              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Access URL Slug</label>
                <input className="form-control" placeholder="e.g. victoria-sacco" value={newTenantSlug} onChange={e => setNewTenantSlug(e.target.value)} required />
              </div>

              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>System Administrator Email</label>
                <input className="form-control" type="email" placeholder="admin@victoriasacco.ug" value={newTenantEmail} onChange={e => setNewTenantEmail(e.target.value)} required />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Initial Admin Password</label>
                  <input className="form-control" type="password" placeholder="••••••••" value={newTenantPassword} onChange={e => setNewTenantPassword(e.target.value)} required />
                </div>

                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Security Recovery Email</label>
                  <input className="form-control" type="email" placeholder="backup@victoriasacco.ug" value={newTenantRecoveryEmail} onChange={e => setNewTenantRecoveryEmail(e.target.value)} required />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Subscription Tier</label>
                  <select className="form-control" value={newTenantPlan} onChange={e => setNewTenantPlan(e.target.value)}>
                    <option value="Enterprise">Enterprise</option>
                    <option value="Premium">Premium</option>
                    <option value="Basic">Basic</option>
                  </select>
                </div>

                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Monthly Billing (UGX)</label>
                  <input className="form-control" type="number" value={newTenantBilling} onChange={e => setNewTenantBilling(e.target.value)} required />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 20 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowOnboardModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ background: 'var(--accent)', color: 'black' }}>Deploy Tenant Instance</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: MANAGE BILLING & ADD-ONS ────────────────── */}
      {editingBillingTenant && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0, 0, 0, 0.75)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }} onClick={() => setEditingBillingTenant(null)}>
          <div style={{ width: '100%', maxWidth: 650, background: 'var(--bg-card)', border: '1px solid var(--border)', padding: 32, borderRadius: 16, boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, borderBottom: '1px solid var(--border)', paddingBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <DollarSign size={24} color="var(--green)" />
                <div>
                  <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>Manage Billing & Add-On Services</h2>
                  <div style={{ fontSize: 12, color: 'var(--accent)', marginTop: 2 }}>{editingBillingTenant.name} ({editingBillingTenant.plan_name})</div>
                </div>
              </div>
              <button onClick={() => setEditingBillingTenant(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={20} /></button>
            </div>

            <form onSubmit={saveBillingChanges} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <div style={{ background: 'var(--bg-secondary)', padding: 20, borderRadius: 12, border: '1px solid var(--border)' }}>
                <label style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', marginBottom: 8, display: 'block' }}>Base Recurring Subscription Amount (UGX)</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <input 
                    className="form-control" 
                    type="number" 
                    style={{ fontSize: 18, fontWeight: 800, color: 'var(--green)', width: '100%' }} 
                    value={editBaseBilling} 
                    onChange={e => setEditBaseBilling(Number(e.target.value))} 
                    required 
                  />
                  <span style={{ fontSize: 14, color: 'var(--text-muted)', fontWeight: 700 }}>/ month</span>
                </div>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8, marginBottom: 0 }}>Adjusting this value modifies the base monthly rate before custom add-on services.</p>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <label style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase' }}>Provisioned Add-On Modules & Services</label>
                  <span className="badge badge-active" style={{ fontSize: 11 }}>{editAddons.length} Active Services</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                  {editAddons.length === 0 ? (
                    <div style={{ padding: 16, background: 'var(--bg-secondary)', borderRadius: 8, textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>
                      No additional services provisioned for this tenant.
                    </div>
                  ) : (
                    editAddons.map((addon, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'var(--bg-secondary)', borderRadius: 8, border: '1px solid var(--border)' }}>
                        <div style={{ fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                          <Check size={16} color="var(--green)" /> {addon}
                        </div>
                        <button type="button" onClick={() => handleRemoveAddon(idx)} style={{ background: 'none', border: 'none', color: 'var(--red)', cursor: 'pointer', opacity: 0.8 }} title="Remove Service">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px auto', gap: 10, background: 'var(--bg-secondary)', padding: 16, borderRadius: 12, border: '1px dashed var(--border)' }}>
                  <input 
                    className="form-control" 
                    placeholder="New service name (e.g. Priority Support)..." 
                    value={customAddonName} 
                    onChange={e => setCustomAddonName(e.target.value)} 
                  />
                  <input 
                    className="form-control" 
                    type="number" 
                    placeholder="Monthly Fee (UGX)" 
                    value={customAddonPrice} 
                    onChange={e => setCustomAddonPrice(e.target.value)} 
                  />
                  <button type="button" className="btn btn-secondary" style={{ background: 'var(--accent)', color: 'black', border: 'none' }} onClick={handleAddCustomService}>
                    <Plus size={16} /> Add Service
                  </button>
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Calculated Total Monthly Billing</div>
                  <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--green)' }}>
                    {fmt.currency(Number(editBaseBilling) + editAddons.reduce((sum, a) => {
                      const m = a.match(/\(\+([0-9,.]+)k\)/);
                      return sum + (m ? Number(m[1]) * 1000 : 0);
                    }, 0), 'UGX')} / mo
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 12 }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setEditingBillingTenant(null)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" style={{ background: 'var(--green)', color: 'black', fontWeight: 800 }}>Save Billing Configuration</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

function StatCard({ label, value, icon, color, sub }: any) {
  return (
    <div className="card" style={{ padding: 24, borderLeft: `4px solid ${color}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{label}</span>
        <div style={{ color }}>{icon}</div>
      </div>
      <div style={{ fontSize: 26, fontWeight: 900, marginBottom: 4 }}>{value}</div>
      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{sub}</div>
    </div>
  );
}

function TabBtn({ active, onClick, icon, label }: any) {
  return (
    <button 
      onClick={onClick}
      style={{ 
        padding: '16px 0', background: 'none', border: 'none', 
        borderBottom: active ? '2px solid var(--accent)' : 'none',
        color: active ? 'var(--accent)' : 'var(--text-muted)',
        fontWeight: active ? 800 : 500, cursor: 'pointer',
        display: 'flex', alignItems: 'center', gap: 10, fontSize: 14,
        transition: 'all 0.2s'
      }}
    >
      {icon} {label}
    </button>
  );
}

function FinRow({ label, value, highlight, isExpense }: any) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: 13, color: highlight ? 'var(--text-primary)' : 'var(--text-muted)', fontWeight: highlight ? 800 : 400 }}>{label}</span>
      <span style={{ fontSize: 14, fontWeight: 900, color: isExpense ? 'var(--red)' : highlight ? 'var(--accent)' : 'var(--text-primary)' }}>
        {isExpense ? '-' : ''}{fmt.currency(value, 'UGX')}
      </span>
    </div>
  );
}
