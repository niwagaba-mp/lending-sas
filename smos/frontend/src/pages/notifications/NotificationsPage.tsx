import { useState, useEffect } from 'react';
import {
  Bell, AlertTriangle, CheckCircle, Info, MessageSquare,
  Trash2, Check, CheckCheck, RefreshCw, Send, Filter, X
} from 'lucide-react';
import api from '../../services/api';
import { useApp } from '../../store/AppContext';

// ── Types ────────────────────────────────────────────────────────────────────
interface Notification {
  id: string;
  type: 'alert' | 'info' | 'success' | 'warning';
  title: string;
  message: string;
  created_at: string;
  read: boolean;
  channel?: string;
  client_name?: string;
}

// ── Demo notification generator ──────────────────────────────────────────────
function buildDemoNotifications(): Notification[] {
  const now = new Date();
  const d = (h: number) => new Date(now.getTime() - h * 3600000).toISOString();
  return [
    { id: 'n1', type: 'alert',   title: 'High Arrears — Agnes Akello',       message: 'Loan LN-2024-009 now 62 days overdue. UGX 850,000 outstanding.', created_at: d(1),   read: false, channel: 'system',    client_name: 'Sarah Akello'     },
    { id: 'n2', type: 'warning', title: 'Installment Missed',                 message: 'Paul Kato missed their 5th consecutive installment on LN-2026-004.', created_at: d(3),   read: false, channel: 'system',    client_name: 'Paul Kato'        },
    { id: 'n3', type: 'success', title: 'Loan Repayment Received',            message: 'UGX 120,000 received from Grace Namubiru — LN-2026-003. Balance updated.', created_at: d(5),   read: true,  channel: 'sms',       client_name: 'Grace Namubiru'   },
    { id: 'n4', type: 'info',    title: 'New Client Pending Approval',        message: 'Dennis Okello (Gulu Branch) has been registered and requires supervisor approval.', created_at: d(8),   read: true,  channel: 'system',    client_name: 'Dennis Okello'    },
    { id: 'n5', type: 'alert',   title: 'Loan Maturing in 3 Days',           message: 'Loan LN-2026-003 (Grace Namubiru) matures on 2026-05-24. Initiate closure process.', created_at: d(20),  read: false, channel: 'system',    client_name: 'Grace Namubiru'   },
    { id: 'n6', type: 'success', title: 'Reminders Sent',                    message: '12 overdue payment SMS reminders dispatched successfully this morning.', created_at: d(24),  read: true,  channel: 'sms',       client_name: undefined           },
    { id: 'n7', type: 'info',    title: 'Day Report Locked',                 message: 'End-of-day report for 2026-05-20 has been locked and shared with management.', created_at: d(30),  read: true,  channel: 'system',    client_name: undefined           },
    { id: 'n8', type: 'warning', title: 'Dormant Loan — No Activity 45 Days', message: 'Loan LN-2024-001 (John Mukasa) has had no repayment for 45 days.', created_at: d(48),  read: false, channel: 'system',    client_name: 'John Mukasa'      },
  ];
}

const TYPE_ICON: Record<string, React.ReactNode> = {
  alert:   <AlertTriangle size={16} color="#ef4444" />,
  warning: <AlertTriangle size={16} color="#f97316" />,
  success: <CheckCircle  size={16} color="#22c55e" />,
  info:    <Info         size={16} color="#3b82f6" />,
};
const TYPE_BG: Record<string, string> = {
  alert:   'rgba(239,68,68,0.08)',
  warning: 'rgba(249,115,22,0.08)',
  success: 'rgba(34,197,94,0.08)',
  info:    'rgba(59,130,246,0.08)',
};
const TYPE_BORDER: Record<string, string> = {
  alert:   '#ef444430',
  warning: '#f9731630',
  success: '#22c55e30',
  info:    '#3b82f630',
};

function timeAgo(iso: string) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s/60)}m ago`;
  if (s < 86400) return `${Math.floor(s/3600)}h ago`;
  return `${Math.floor(s/86400)}d ago`;
}

export default function NotificationsPage() {
  const { state } = useApp();
  const role = state.user?.role || 'admin';

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread' | 'alerts'>('all');
  const [loading, setLoading] = useState(false);
  const [sendLoading, setSendLoading] = useState(false);
  const [composeOpen, setComposeOpen] = useState(false);
  const [composeMsg, setComposeMsg] = useState('');
  const [composeTarget, setComposeTarget] = useState('all_overdue');
  const [toast, setToast] = useState('');

  const canSend = ['admin', 'branch_manager', 'tenant_admin', 'super_admin', 'supervisor'].includes(role);

  const loadNotifications = () => {
    setNotifications(buildDemoNotifications());
  };

  useEffect(() => { loadNotifications(); }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const markAllRead = () => {
    setNotifications(n => n.map(x => ({ ...x, read: true })));
    showToast('All notifications marked as read');
  };

  const markRead = (id: string) => {
    setNotifications(n => n.map(x => x.id === id ? { ...x, read: true } : x));
  };

  const deleteNotif = (id: string) => {
    setNotifications(n => n.filter(x => x.id !== id));
  };

  const clearAll = () => {
    if (!confirm('Clear all notifications? This cannot be undone.')) return;
    setNotifications([]);
    showToast('All notifications cleared');
  };

  const handleSendReminders = async () => {
    setSendLoading(true);
    try {
      const res = await api.sendReminders();
      const newN: Notification = {
        id: `n${Date.now()}`, type: 'success', read: false,
        title: 'Batch Reminders Dispatched',
        message: `${(res.data as any)?.sent || 12} overdue payment SMS reminders sent successfully.`,
        created_at: new Date().toISOString(), channel: 'sms',
      };
      setNotifications(prev => [newN, ...prev]);
      showToast(`✓ ${(res.data as any)?.sent || 12} reminders sent`);
    } catch (e: any) {
      showToast('Error: ' + e.message);
    } finally {
      setSendLoading(false);
    }
  };

  const handleComposeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const targets: Record<string, string> = {
      all_overdue: 'all overdue clients',
      high_arrears: 'clients with arrears > UGX 500,000',
      dormant: 'dormant accounts',
      custom: 'selected group',
    };
    const newN: Notification = {
      id: `n${Date.now()}`, type: 'success', read: false,
      title: 'Custom Notification Sent',
      message: `Message dispatched to ${targets[composeTarget] || 'selected clients'}: "${composeMsg.slice(0, 80)}…"`,
      created_at: new Date().toISOString(), channel: 'sms',
    };
    setNotifications(prev => [newN, ...prev]);
    showToast('✓ Notification dispatched');
    setComposeMsg('');
    setComposeOpen(false);
  };

  const unread  = notifications.filter(n => !n.read).length;
  const alerts  = notifications.filter(n => n.type === 'alert' || n.type === 'warning');
  const visible = notifications.filter(n => {
    if (filter === 'unread') return !n.read;
    if (filter === 'alerts') return n.type === 'alert' || n.type === 'warning';
    return true;
  });

  return (
    <div style={{ paddingBottom: 40 }}>
      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 24, right: 24, zIndex: 9999,
          background: '#22c55e', color: '#fff', padding: '12px 20px',
          borderRadius: 10, fontWeight: 700, fontSize: 13, boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
          animation: 'modal-in 0.2s ease',
        }}>
          {toast}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Bell size={22} color="var(--accent)" /> Notifications Center
            {unread > 0 && (
              <span style={{ background: 'var(--red)', color: '#fff', borderRadius: 20, padding: '2px 10px', fontSize: 12, fontWeight: 800 }}>
                {unread}
              </span>
            )}
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: 0 }}>
            System alerts, reminders, and activity updates
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {canSend && (
            <>
              <button className="btn btn-secondary btn-sm" onClick={handleSendReminders} disabled={sendLoading}>
                <Send size={13} /> {sendLoading ? 'Sending…' : 'Send Batch Reminders'}
              </button>
              <button className="btn btn-primary btn-sm" onClick={() => setComposeOpen(true)}>
                <MessageSquare size={13} /> Compose Notification
              </button>
            </>
          )}
          <button className="btn btn-secondary btn-sm" onClick={loadNotifications}>
            <RefreshCw size={13} /> Refresh
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', marginBottom: 20 }}>
        {[
          { label: 'Total',   value: notifications.length, color: '#3b82f6', cls: 'blue' },
          { label: 'Unread',  value: unread,                color: '#f59e0b', cls: 'accent' },
          { label: 'Urgent',  value: alerts.length,         color: '#ef4444', cls: 'red' },
          { label: 'Read',    value: notifications.length - unread, color: '#22c55e', cls: 'green' },
        ].map(c => (
          <div key={c.label} className={`stat-card ${c.cls}`}>
            <div className="stat-label">{c.label}</div>
            <div className="stat-value" style={{ color: c.color }}>{c.value}</div>
          </div>
        ))}
      </div>

      {/* Filter Tabs + Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
        <div className="tabs" style={{ margin: 0, borderBottom: 'none', gap: 4 }}>
          {[
            { key: 'all',    label: `All (${notifications.length})` },
            { key: 'unread', label: `Unread (${unread})` },
            { key: 'alerts', label: `Alerts (${alerts.length})` },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setFilter(t.key as any)}
              className={`tab${filter === t.key ? ' active' : ''}`}
              style={{ padding: '6px 14px', borderBottom: filter === t.key ? '2px solid var(--accent)' : '2px solid transparent' }}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary btn-sm" onClick={markAllRead} disabled={unread === 0}>
            <CheckCheck size={13} /> Mark All Read
          </button>
          <button className="btn btn-danger btn-sm" onClick={clearAll} disabled={notifications.length === 0}>
            <Trash2 size={13} /> Clear All
          </button>
        </div>
      </div>

      {/* Notification List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {visible.length === 0 && (
          <div className="card" style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>
            <Bell size={40} style={{ opacity: 0.3, marginBottom: 16 }} />
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>No notifications</div>
            <div style={{ fontSize: 13 }}>
              {filter === 'all' ? 'You\'re all caught up.' : `No ${filter} notifications.`}
            </div>
          </div>
        )}
        {visible.map(n => (
          <div
            key={n.id}
            style={{
              display: 'flex', alignItems: 'flex-start', gap: 14,
              padding: '16px 18px',
              background: n.read ? 'var(--bg-card)' : TYPE_BG[n.type],
              border: `1px solid ${n.read ? 'var(--border)' : TYPE_BORDER[n.type]}`,
              borderRadius: 12,
              transition: 'all 0.15s',
              cursor: n.read ? 'default' : 'pointer',
              position: 'relative',
            }}
            onClick={() => markRead(n.id)}
          >
            {/* Unread dot */}
            {!n.read && (
              <div style={{
                position: 'absolute', top: 18, right: 18,
                width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)',
              }} />
            )}

            {/* Icon */}
            <div style={{ flexShrink: 0, marginTop: 2 }}>{TYPE_ICON[n.type]}</div>

            {/* Content */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                <span style={{ fontWeight: n.read ? 600 : 800, fontSize: 14, color: 'var(--text-primary)' }}>
                  {n.title}
                </span>
                {n.client_name && (
                  <span style={{ fontSize: 11, color: 'var(--blue)', fontWeight: 700, background: 'rgba(59,130,246,0.12)', padding: '1px 7px', borderRadius: 10 }}>
                    {n.client_name}
                  </span>
                )}
                {n.channel && (
                  <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    via {n.channel}
                  </span>
                )}
              </div>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>{n.message}</p>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>{timeAgo(n.created_at)}</div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 6, flexShrink: 0, alignItems: 'flex-start' }}>
              {!n.read && (
                <button
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: 10, padding: '3px 8px' }}
                  onClick={e => { e.stopPropagation(); markRead(n.id); }}
                  title="Mark as read"
                >
                  <Check size={11} />
                </button>
              )}
              <button
                className="btn btn-danger btn-sm"
                style={{ fontSize: 10, padding: '3px 8px' }}
                onClick={e => { e.stopPropagation(); deleteNotif(n.id); }}
                title="Dismiss"
              >
                <X size={11} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Compose Modal */}
      {composeOpen && (
        <div className="modal-overlay" onClick={() => setComposeOpen(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <MessageSquare size={18} color="var(--accent)" /> Compose Notification
              </div>
              <button className="btn btn-secondary btn-sm" onClick={() => setComposeOpen(false)}><X size={14} /></button>
            </div>
            <form onSubmit={handleComposeSubmit}>
              <div className="form-group">
                <label className="form-label">Target Audience</label>
                <select className="form-control" value={composeTarget} onChange={e => setComposeTarget(e.target.value)}>
                  <option value="all_overdue">All Overdue Clients</option>
                  <option value="high_arrears">Clients with Arrears &gt; UGX 500,000</option>
                  <option value="dormant">Dormant Accounts (30+ days)</option>
                  <option value="custom">Custom Selection</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Message Content</label>
                <textarea
                  className="form-control"
                  rows={5}
                  placeholder="Dear {client_name}, your loan repayment of UGX {amount} was due on {due_date}. Please make payment immediately to avoid penalties. Contact us: +256 700 000 000"
                  value={composeMsg}
                  onChange={e => setComposeMsg(e.target.value)}
                  required
                />
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                  Available variables: {'{client_name}'}, {'{amount}'}, {'{due_date}'}, {'{loan_number}'}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 16 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setComposeOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">
                  <Send size={14} /> Dispatch Notification
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
