import {
  DEMO_USER, DEMO_TOKEN, DEMO_BRANCHES, DEMO_STAFF,
  DEMO_CLIENTS, DEMO_LOANS, DEMO_EXPENSES,
  DEMO_LEGAL, DEMO_DASHBOARD, DEMO_TRANSACTIONS, DEMO_DAILY_REPORTS,
  DEMO_SUPER_ADMIN, DEMO_BUSINESS_OWNER, DEMO_DOCUMENTS, DEMO_TENANTS, syncGet, syncSet,
} from './mockData';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// ─── Demo Mode ──────────────────────────────────────────────────────────────
export function isDemoMode() {
  return localStorage.getItem('smos_demo') === 'true';
}
function setDemoMode(val: boolean) {
  val ? localStorage.setItem('smos_demo', 'true') : localStorage.removeItem('smos_demo');
}

function alignDemoDates() {
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  
  const d3 = new Date(today); d3.setDate(today.getDate() - 3); const d3Str = d3.toISOString().split('T')[0];
  const d95 = new Date(today); d95.setDate(today.getDate() - 95); const d95Str = d95.toISOString().split('T')[0];
  const d130 = new Date(today); d130.setDate(today.getDate() - 130); const d130Str = d130.toISOString().split('T')[0];

  DEMO_LOANS.forEach((l: any) => {
    if (l.id === 'l006') {
      l.disbursed_at = d3Str;
      l.disbursement_date = d3Str;
      l.last_payment_date = d3Str;
      l.created_at = d3Str;
      const closure = new Date(d3); closure.setDate(d3.getDate() + 30);
      l.expected_closure_date = closure.toISOString().split('T')[0];
    } else if (l.id === 'l002') {
      l.disbursed_at = d130Str;
      l.disbursement_date = d130Str;
      const lastPay = new Date(d130); lastPay.setDate(d130.getDate() + 90);
      l.last_payment_date = lastPay.toISOString().split('T')[0];
      const closure = new Date(d130); closure.setDate(d130.getDate() + 180);
      l.expected_closure_date = closure.toISOString().split('T')[0];
      const created = new Date(d130); created.setDate(d130.getDate() - 5);
      l.created_at = created.toISOString().split('T')[0];
    } else if (l.id === 'l001') {
      l.disbursed_at = d95Str;
      l.disbursement_date = d95Str;
      const lastPay = new Date(d95); lastPay.setDate(d95.getDate() + 80);
      l.last_payment_date = lastPay.toISOString().split('T')[0];
      const closure = new Date(d95); closure.setDate(d95.getDate() + 180);
      l.expected_closure_date = closure.toISOString().split('T')[0];
      const created = new Date(d95); created.setDate(d95.getDate() - 5);
      l.created_at = created.toISOString().split('T')[0];
    }
  });

  DEMO_TRANSACTIONS.forEach((t: any) => {
    if (t.id === 'tx-001' || t.id === 'tx-004') {
      t.date = todayStr;
      t.timestamp = new Date().toISOString();
    }
    if (t.reference === 'LN-2024-001') t.reference = 'LN-2026-001';
    if (t.reference === 'LN-2024-002') t.reference = 'LN-2026-002';
  });
}

function initDemoSync() {
  if (!isDemoMode()) return;
  
  if (localStorage.getItem('smos_sync_initialized') !== 'true') {
    alignDemoDates();
    syncSet('staff', DEMO_STAFF);
    syncSet('clients', DEMO_CLIENTS);
    syncSet('loans', DEMO_LOANS);
    syncSet('expenses', DEMO_EXPENSES);
    syncSet('tx', DEMO_TRANSACTIONS);
    syncSet('legal', DEMO_LEGAL);
    syncSet('branches', DEMO_BRANCHES);
    syncSet('documents', DEMO_DOCUMENTS);
    syncSet('tenants', DEMO_TENANTS);
    localStorage.setItem('smos_sync_initialized', 'true');
  }

  const st = syncGet('staff', []);
  if (st) {
    DEMO_STAFF.length = 0;
    DEMO_STAFF.push(...st);
  }
  
  const cl = syncGet('clients', []);
  if (cl) {
    DEMO_CLIENTS.length = 0;
    DEMO_CLIENTS.push(...cl);
  }
  
  const lo = syncGet('loans', []);
  if (lo) {
    DEMO_LOANS.length = 0;
    DEMO_LOANS.push(...lo);
  }
  
  const ex = syncGet('expenses', []);
  if (ex) {
    DEMO_EXPENSES.length = 0;
    DEMO_EXPENSES.push(...ex);
  }
  
  const tx = syncGet('tx', []);
  if (tx) {
    DEMO_TRANSACTIONS.length = 0;
    DEMO_TRANSACTIONS.push(...tx);
  }
  
  const le = syncGet('legal', []);
  if (le) {
    DEMO_LEGAL.length = 0;
    DEMO_LEGAL.push(...le);
  }
  
  const br = syncGet('branches', []);
  if (br) {
    DEMO_BRANCHES.length = 0;
    DEMO_BRANCHES.push(...br);
  }
  
  const docs = syncGet('documents', []);
  if (docs) {
    DEMO_DOCUMENTS.length = 0;
    DEMO_DOCUMENTS.push(...docs);
  }

  const tn = syncGet('tenants', []);
  if (tn) {
    DEMO_TENANTS.length = 0;
    DEMO_TENANTS.push(...tn);
  }

  alignDemoDates();
}

function saveDemoSync() {
  if (!isDemoMode()) return;
  syncSet('staff', DEMO_STAFF);
  syncSet('clients', DEMO_CLIENTS);
  syncSet('loans', DEMO_LOANS);
  syncSet('expenses', DEMO_EXPENSES);
  syncSet('tx', DEMO_TRANSACTIONS);
  syncSet('legal', DEMO_LEGAL);
  syncSet('branches', DEMO_BRANCHES);
  syncSet('documents', DEMO_DOCUMENTS);
  syncSet('tenants', DEMO_TENANTS);
}

function calculateLoanPerformance(loan: any) {
  if (['draft', 'pending_approval'].includes(loan.status)) return loan.status;
  if (Number(loan.outstanding_balance) <= 0) return 'closed';
  if (loan.is_manual_default) return 'defaulted';
  
  const now = new Date();
  const disbursed = new Date(loan.disbursed_at);
  const term = loan.term_months || 6;
  const isAnnual = loan.loan_type === 'annual';
  
  // 1. Check for Default (Double maturity)
  const doubleMaturity = new Date(disbursed);
  doubleMaturity.setMonth(doubleMaturity.getMonth() + (term * 2));
  
  if (now > doubleMaturity) return 'defaulted';

  // 2. Check for Dormant (15 consecutive missed)
  if ((loan.consecutive_missed || 0) >= 15) {
    const lastPay = loan.last_payment_date ? new Date(loan.last_payment_date) : disbursed;
    const monthsSinceLast = (now.getFullYear() - lastPay.getFullYear()) * 12 + (now.getMonth() - lastPay.getMonth());
    const dormantMonths = monthsSinceLast - 15; // Months since becoming dormant

    // 3. Check for Written Off
    if (isAnnual && dormantMonths >= 24) return 'written_off';
    if (!isAnnual && dormantMonths >= 12) return 'written_off';
    
    return 'dormant';
  }

  return 'active';
}

function calculateLoanAdvance(loan: any) {
  if (['draft', 'pending_approval', 'closed', 'written_off'].includes(loan.status)) return 0;
  if (!loan.disbursed_at) return 0;
  const disbursed = new Date(loan.disbursed_at);
  const today = new Date();
  today.setHours(0,0,0,0);
  disbursed.setHours(0,0,0,0);
  
  if (today < disbursed) return 0;

  const freq = loan.loan_type || loan.repayment_frequency || 'monthly';
  const term = loan.term_months || 6;
  const instCount = loan.installment_count || 6;
  const instAmt = loan.installment_amount || (loan.total_repayable / instCount);

  let expectedCount = 0;
  if (freq === 'daily') {
    const diffTime = Math.abs(today.getTime() - disbursed.getTime());
    expectedCount = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  } else if (freq === 'weekly') {
    const diffTime = Math.abs(today.getTime() - disbursed.getTime());
    expectedCount = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 7));
  } else {
    // monthly
    expectedCount = (today.getFullYear() - disbursed.getFullYear()) * 12 + (today.getMonth() - disbursed.getMonth());
  }
  
  expectedCount = Math.min(instCount, expectedCount);
  const expectedToDate = expectedCount * instAmt;
  const totalPaid = Number(loan.total_paid || 0);
  
  return Math.max(0, totalPaid - expectedToDate);
}

function paginate(data: unknown[], params = '') {
  initDemoSync();
  const p = new URLSearchParams(params);
  const search = (p.get('search') || '').toLowerCase();
  const status = p.get('status');
  const officer = p.get('officer');
  const filter = p.get('filter'); // Client segmentation filter
  let rows = data as Record<string, any>[];
  
  // Apply performance logic and advance payments to all loans
  rows = rows.map(r => {
    if (r.loan_number) {
       r.status = calculateLoanPerformance(r);
       r.advance_amount = calculateLoanAdvance(r);
    }
    return r;
  });

  // Role-based restrictions: Loan Officer should only see their own assigned individual portfolio
  const userStr = localStorage.getItem('smos_user');
  let loggedInUser: any = null;
  if (userStr) {
    try {
      loggedInUser = JSON.parse(userStr);
    } catch (e) {}
  }

  if (loggedInUser && loggedInUser.role === 'loan_officer') {
    const fullName = `${loggedInUser.first_name} ${loggedInUser.last_name}`.toLowerCase();
    if (rows.length > 0) {
      if ('loan_number' in rows[0] && 'principal_amount' in rows[0]) {
        // Loan list: filter to their own loans
        rows = rows.filter(l => 
          l.staff_id === loggedInUser.id ||
          (l.officer_name || '').toLowerCase().includes(fullName) || 
          (l.staff_name || '').toLowerCase().includes(fullName) ||
          (l.staff_owner || '').toLowerCase().includes(fullName)
        );
      } else if (!('loan_number' in rows[0]) && ('phone_primary' in rows[0] || 'national_id' in rows[0] || 'dob' in rows[0])) {
        // Client list: filter strictly to their assigned clients
        rows = rows.filter(c => 
          c.assigned_staff_id === loggedInUser.id ||
          (c.staff_name || '').toLowerCase().includes(fullName)
        );
      }
    }
  }

  // Apply client segmentation filters in demo mode
  if (filter && rows.length > 0 && !('loan_number' in rows[0])) {
    const todayStr = new Date().toISOString().split('T')[0];
    const isDueToday = (loan: any) => {
      if (!loan.disbursed_at || ['draft', 'pending_approval', 'approved', 'closed', 'written_off'].includes(loan.status)) return false;
      const today = new Date();
      today.setHours(0,0,0,0);
      const start = new Date(loan.disbursed_at);
      start.setHours(0,0,0,0);
      const diffTime = Math.abs(today.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const freq = loan.loan_type || loan.repayment_frequency || 'daily';
      if (freq === 'daily') return true;
      if (freq === 'weekly') return diffDays % 7 === 0;
      if (freq === 'monthly') return today.getDate() === start.getDate();
      return false;
    };

    rows = rows.filter(c => {
      const clientLoans = DEMO_LOANS.filter(l => l.client_id === c.id).map(l => {
        l.status = calculateLoanPerformance(l);
        l.advance_amount = calculateLoanAdvance(l);
        return l;
      });

      if (filter === 'did_not_pay') {
        return clientLoans.some(l => 
          ['active', 'at_risk', 'delinquent', 'defaulted', 'dormant'].includes(l.status) && 
          Number(l.arrears_amount) > 0
        );
      }
      if (filter === 'paid') {
        const hasClosed = clientLoans.some(l => l.status === 'closed');
        const hasActive = clientLoans.some(l => ['active', 'at_risk', 'delinquent', 'defaulted', 'dormant'].includes(l.status));
        return hasClosed && !hasActive;
      }
      if (filter === 'no_loans') {
        return clientLoans.length === 0;
      }
      if (filter === 'paid_today') {
        return clientLoans.some(l => 
          DEMO_TRANSACTIONS.some((t: any) => 
            t.type === 'repayment' && 
            t.status === 'valid' && 
            (t.reference === l.loan_number || t.loan_id === l.id) &&
            (t.date || t.timestamp || '').split('T')[0] === todayStr
          )
        );
      }
      if (filter === 'did_not_pay_today') {
        return clientLoans.some(l => {
          if (!isDueToday(l)) return false;
          const hasPaidToday = DEMO_TRANSACTIONS.some((t: any) => 
            t.type === 'repayment' && 
            t.status === 'valid' && 
            (t.reference === l.loan_number || t.loan_id === l.id) &&
            (t.date || t.timestamp || '').split('T')[0] === todayStr
          );
          return !hasPaidToday;
        });
      }
      if (filter === 'paid_in_advance') {
        return clientLoans.some(l => Number(l.advance_amount || 0) > 0);
      }
      return true;
    });
  }

  if (status) {
    if (status === 'paid_today') {
      const todayStr = new Date().toISOString().split('T')[0];
      rows = rows.filter(l => 
        DEMO_TRANSACTIONS.some((t: any) => 
          t.type === 'repayment' && 
          t.status === 'valid' && 
          (t.reference === l.loan_number || t.loan_id === l.id) &&
          (t.date || t.timestamp || '').split('T')[0] === todayStr
        )
      );
    } else if (status === 'did_not_pay_today') {
      const todayStr = new Date().toISOString().split('T')[0];
      const isDueToday = (loan: any) => {
        if (!loan.disbursed_at || ['draft', 'pending_approval', 'approved', 'closed', 'written_off'].includes(loan.status)) return false;
        const today = new Date();
        today.setHours(0,0,0,0);
        const start = new Date(loan.disbursed_at);
        start.setHours(0,0,0,0);
        const diffTime = Math.abs(today.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const freq = loan.loan_type || loan.repayment_frequency || 'daily';
        if (freq === 'daily') return true;
        if (freq === 'weekly') return diffDays % 7 === 0;
        if (freq === 'monthly') return today.getDate() === start.getDate();
        return false;
      };
      rows = rows.filter(l => {
        if (!isDueToday(l)) return false;
        const hasPaidToday = DEMO_TRANSACTIONS.some((t: any) => 
          t.type === 'repayment' && 
          t.status === 'valid' && 
          (t.reference === l.loan_number || t.loan_id === l.id) &&
          (t.date || t.timestamp || '').split('T')[0] === todayStr
        );
        return !hasPaidToday;
      });
    } else if (status === 'paid_in_advance') {
      rows = rows.filter(l => Number(l.advance_amount || 0) > 0);
    } else {
      rows = rows.filter(r => r.status === status);
    }
  }
  if (officer) {
    rows = rows.filter(r => (r.officer_name || r.staff_name) === officer);
  }

  if (search) {
    rows = rows.filter(r =>
      Object.values(r).some(v => String(v).toLowerCase().includes(search))
    );
  }
  return { data: rows, total: rows.length, page: 1, limit: rows.length };
}


// ─── Real API ────────────────────────────────────────────────────────────────
async function request(endpoint: string, options: RequestInit = {}) {
  const token = localStorage.getItem('smos_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const response = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
  if (response.status === 401) {
    localStorage.removeItem('smos_token');
    localStorage.removeItem('smos_user');
    window.location.href = '/login';
    throw new Error('Session expired');
  }

  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'API Error');
  return data;
}

const api = {
  get: (endpoint: string) => request(endpoint),
  post: (endpoint: string, data: unknown) => request(endpoint, { method: 'POST', body: JSON.stringify(data) }),
  put: (endpoint: string, data: unknown) => request(endpoint, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (endpoint: string) => request(endpoint, { method: 'DELETE' }),
};

export default {
  // ── Auth ──────────────────────────────────────────────────────────────────
  login: async (credentialsOrEmail: any, possiblePassword?: string) => {
    const credentials = typeof credentialsOrEmail === 'string'
      ? { email: credentialsOrEmail, password: possiblePassword || '' }
      : credentialsOrEmail;
    const { email, password } = credentials;
    const demoAccounts: Record<string, string> = {
      'superadmin@kilimomf.co.ug': 'Superadmin@2024',
      'owner@kilimomf.co.ug': 'Owner@2024',
      'admin@kilimomf.co.ug': 'Smos@2024',
      'sarah@kilimomf.co.ug': 'Cashier@2024',
      'officer@kilimomf.co.ug': 'password123'
    };
    const normalizedEmail = email.toLowerCase().trim();
    
    // Check if it's a dynamic tenant login
    let matchedTenant = DEMO_TENANTS.find((t: any) => t.email && t.email.toLowerCase() === normalizedEmail);
    const isTenantLogin = matchedTenant && matchedTenant.admin_password === password;
    
    const forceLive = localStorage.getItem('smos_force_live') === 'true';
    const isDemo = !forceLive && ((normalizedEmail in demoAccounts && demoAccounts[normalizedEmail] === password) || isTenantLogin);

    if (isDemo) {
      setDemoMode(true);
      initDemoSync();

      // Subscription Status Enforcements
      if (normalizedEmail !== 'superadmin@kilimomf.co.ug') {
        const tenantId = isTenantLogin ? matchedTenant.id : 'tenant-001';
        const tenant = DEMO_TENANTS.find((t: any) => t.id === tenantId);
        if (tenant) {
          if (tenant.sub_status === 'locked') {
            throw new Error('Access Locked: Subscription is currently suspended by system administration. Please contact support.');
          }
          if (tenant.sub_status === 'pending_approval') {
            throw new Error('Onboarding Pending: Your subscription registration is currently undergoing system administration review.');
          }
          if (tenant.sub_status === 'rejected') {
            throw new Error('Registration Rejected: Your onboarding application was declined.');
          }
        }
      }

      const normalized = normalizedEmail;
      let mappedStaffId = '';
      if (normalized === 'admin@kilimomf.co.ug') mappedStaffId = 's001';
      else if (normalized === 'sarah@kilimomf.co.ug') mappedStaffId = 's004';
      else if (normalized === 'officer@kilimomf.co.ug') mappedStaffId = 's002';

      const staffMember = DEMO_STAFF.find((s: any) => 
        (s.email && s.email.toLowerCase() === normalized) || 
        (mappedStaffId && s.id === mappedStaffId)
      );

      if (staffMember && staffMember.status === 'suspended') {
        throw new Error('Account Suspended: Access denied by system administration.');
      }

      let user = DEMO_USER;
      if (normalized === DEMO_SUPER_ADMIN.email.toLowerCase()) {
        user = DEMO_SUPER_ADMIN as any;
      } else if (normalized === DEMO_BUSINESS_OWNER.email.toLowerCase()) {
        user = DEMO_BUSINESS_OWNER as any;
      } else if (isTenantLogin) {
        user = {
          ...DEMO_USER,
          id: `owner-${matchedTenant.id}`,
          first_name: matchedTenant.name.split(' ')[0],
          last_name: 'Owner',
          email: normalized,
          role: 'tenant_admin',
          tenant_id: matchedTenant.id,
          tenant_name: matchedTenant.name,
          branch_name: 'Head Office'
        };
      } else if (staffMember) {
        user = {
          ...DEMO_USER,
          id: staffMember.id,
          first_name: staffMember.first_name,
          last_name: staffMember.last_name,
          email: normalized, // keep login email for session matching
          role: staffMember.role || (normalized === 'admin@kilimomf.co.ug' ? 'branch_manager' : normalized === 'sarah@kilimomf.co.ug' ? 'cashier' : 'loan_officer'),
          branch_name: staffMember.branch_name || 'Head Office'
        };
      } else {
        if (normalized === 'sarah@kilimomf.co.ug') user = { ...DEMO_USER, id: 'demo-cashier', first_name: 'Sarah', last_name: 'Nambi', email: normalized, role: 'cashier' };
        else if (normalized === 'admin@kilimomf.co.ug') user = { ...DEMO_USER, id: 'demo-manager', first_name: 'Branch', last_name: 'Manager', email: normalized, role: 'branch_manager' };
        else if (normalized === 'officer@kilimomf.co.ug') user = { ...DEMO_USER, id: 's002', first_name: 'Agnes', last_name: 'Akello', email: normalized, role: 'loan_officer', branch_id: 'branch-002', branch_name: 'Gulu Branch' };
      }

      localStorage.setItem('smos_token', DEMO_TOKEN);
      localStorage.setItem('smos_user', JSON.stringify(user));
      return { data: { token: DEMO_TOKEN, accessToken: DEMO_TOKEN, refreshToken: DEMO_TOKEN, user } };
    } else {
      setDemoMode(false);
      const res = await api.post('/auth/login', credentials);
      localStorage.setItem('smos_token', res.data.token || res.data.accessToken);
      localStorage.setItem('smos_user', JSON.stringify(res.data.user));
      return res;
    }
  },

  me: async () => {
    if (isDemoMode()) {
      const stored = localStorage.getItem('smos_user');
      if (stored) return { data: JSON.parse(stored) };
      return { data: DEMO_USER };
    }
    return request('/auth/me');
  },

  logout: async (refreshToken: string) => {
    setDemoMode(false);
    if (!isDemoMode()) {
      try { await request('/auth/logout', { method: 'POST', body: JSON.stringify({ refreshToken }) }); } catch {}
    }
  },

  // ── Tenants ──────────────────────────────────────────────────────────────
  getTenants: async () => {
    initDemoSync();
    return isDemoMode() ? { data: DEMO_TENANTS } : api.get('/tenants');
  },
  createTenant: async (data: any) => {
    initDemoSync();
    if (isDemoMode()) {
      const newTenant = {
        id: `t${Date.now()}`,
        user_count: 1,
        loan_count: 0,
        country: data.country || 'Uganda',
        created_at: new Date().toISOString().split('T')[0],
        addons: [],
        payment_status: data.payment_status || 'unpaid',
        payment_link: data.payment_link || `https://pay.smos.io/${data.slug}/invoice-${Date.now().toString().slice(-4)}`,
        sub_status: data.sub_status || 'pending_approval',
        ...data
      };
      DEMO_TENANTS.unshift(newTenant);
      saveDemoSync();
      return { data: newTenant };
    }
    return api.post('/tenants', data);
  },
  updateTenant: async (id: string, data: any) => {
    initDemoSync();
    if (isDemoMode()) {
      const idx = DEMO_TENANTS.findIndex(t => t.id === id);
      if (idx !== -1) {
        DEMO_TENANTS[idx] = { ...DEMO_TENANTS[idx], ...data };
        saveDemoSync();
        return { data: DEMO_TENANTS[idx] };
      }
      return { data: null };
    }
    return api.put(`/tenants/${id}`, data);
  },

  // ── Branches ──────────────────────────────────────────────────────────────
  getBranches:  async () => { initDemoSync(); return isDemoMode() ? { data: DEMO_BRANCHES } : api.get('/branches'); },
  getBranch:    async (id: string) => {
    initDemoSync();
    if (isDemoMode()) {
      const branch = DEMO_BRANCHES.find(b => b.id === id);
      if (branch) {
        const clientCount = DEMO_CLIENTS.filter(c => (c as any).branch_name === branch.name || (c as any).branch_id === id).length;
        return { data: { ...branch, client_count: clientCount } };
      }
      return { data: null };
    }
    return api.get(`/branches/${id}`);
  },
  createBranch: async (data: any) => {
    initDemoSync();
    if (isDemoMode()) {
      const newB = { ...data, id: `branch-${Date.now()}` };
      DEMO_BRANCHES.push(newB);
      saveDemoSync();
      return { data: newB };
    }
    return api.post('/branches', data);
  },
  updateBranch: async (id: string, data: any) => {
    initDemoSync();
    if (isDemoMode()) {
      const idx = DEMO_BRANCHES.findIndex(b => b.id === id);
      if (idx !== -1) {
        DEMO_BRANCHES[idx] = { ...DEMO_BRANCHES[idx], ...data };
        saveDemoSync();
      }
      return { data: DEMO_BRANCHES[idx] };
    }
    return api.put(`/branches/${id}`, data);
  },

  // ── Staff ─────────────────────────────────────────────────────────────────
  getStaff:       async (params = '') => { initDemoSync(); return isDemoMode() ? paginate(DEMO_STAFF, params) : api.get(`/staff?${params}`); },
  getStaffById:   async (id: string) => { initDemoSync(); return isDemoMode() ? { data: DEMO_STAFF.find(s => s.id === id) } : api.get(`/staff/${id}`); },
  createStaff:    async (data: any) => {
    if (isDemoMode()) {
      const newStaff = {
        id: `s${Date.now()}`,
        status: 'active',
        created_at: new Date().toISOString().split('T')[0],
        total_disbursed: 0,
        total_collected: 0,
        commission_earned: 0,
        salary_approved: Number(data.salary_approved) || 1500000,
        allowance_approved: Number(data.allowance_approved) || 50000,
        payroll_status: 'Unpaid',
        ...data,
      };
      DEMO_STAFF.push(newStaff);
      saveDemoSync();
      return { data: newStaff };
    }
    return api.post('/staff', data);
  },
  updateStaff:    async (id: string, data: any) => {
    initDemoSync();
    if (isDemoMode()) {
      const idx = DEMO_STAFF.findIndex(s => s.id === id);
      if (idx !== -1) {
        DEMO_STAFF[idx] = { ...DEMO_STAFF[idx], ...data };
        saveDemoSync();
        return { data: DEMO_STAFF[idx] };
      }
      return { data: { ...data, id } };
    }
    return api.put(`/staff/${id}`, data);
  },
  deleteStaff:    async (id: string) => {
    initDemoSync();
    if (isDemoMode()) {
      const idx = DEMO_STAFF.findIndex(s => s.id === id);
      if (idx !== -1) {
        const deleted = DEMO_STAFF.splice(idx, 1)[0];
        saveDemoSync();
        return { data: deleted };
      }
      return { data: null };
    }
    return api.delete(`/staff/${id}`);
  },
  markStaffSalaryPaid: async (id: string) => {
    if (isDemoMode()) {
      const s = DEMO_STAFF.find(st => st.id === id);
      if (s) { s.payroll_status = 'Paid'; saveDemoSync(); }
      return { data: s };
    }
    return api.post(`/staff/${id}/salary-paid`, {});
  },
  getStaffPnl:    async (id: string) => {
    initDemoSync();
    if (isDemoMode()) {
      const staffMember = DEMO_STAFF.find(s => s.id === id);
      if (!staffMember) return { data: { pnl: {}, expenses: [], loans: [] } };

      const staffLoans = DEMO_LOANS.filter(l => l.staff_id === id);
      const staffExpenses = DEMO_EXPENSES.filter(e => (e as any).staff_id === id || e.submitted_by === staffMember.first_name + ' ' + staffMember.last_name || e.staff_name === staffMember.first_name + ' ' + staffMember.last_name);

      const total_loans = staffLoans.length;
      const total_portfolio = staffLoans.reduce((sum, l) => sum + Number(l.principal_amount || 0), 0);
      const total_interest_expected = staffLoans.reduce((sum, l) => sum + Number(l.interest_amount || 0), 0);

      const interest_earned = staffLoans.reduce((sum, l) => {
        if (['active', 'closed', 'at_risk', 'delinquent', 'dormant'].includes(l.status)) {
          const ratio = Number(l.total_repayable) > 0 ? (Number(l.total_paid) / Number(l.total_repayable)) : 0;
          return sum + (Number(l.interest_amount) * ratio);
        }
        return sum;
      }, 0);

      const defaulted_amount = staffLoans.reduce((sum, l) => {
        if (['defaulted', 'written_off'].includes(l.status)) {
          return sum + Number(l.outstanding_balance || 0);
        }
        return sum;
      }, 0);

      const nonAdminExpenses = staffExpenses.filter(e => !['operational', 'other'].includes(e.category));
      const total_expenses = nonAdminExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);

      const net_profit = interest_earned - defaulted_amount - total_expenses;

      const pnl = {
        staff_id: id,
        staff_name: `${staffMember.first_name} ${staffMember.last_name}`,
        total_loans,
        total_portfolio,
        total_interest_expected,
        interest_earned,
        defaulted_amount,
        total_expenses,
        net_profit
      };

      const expGroup: Record<string, number> = {};
      staffExpenses.forEach(e => {
        expGroup[e.category] = (expGroup[e.category] || 0) + Number(e.amount || 0);
      });
      const expenses = Object.entries(expGroup).map(([category, total]) => ({ category, total }));

      const loanGroup: Record<string, { count: number, total: number }> = {};
      staffLoans.forEach(l => {
        if (!loanGroup[l.status]) loanGroup[l.status] = { count: 0, total: 0 };
        loanGroup[l.status].count++;
        loanGroup[l.status].total += Number(l.principal_amount || 0);
      });
      const loans = Object.entries(loanGroup).map(([status, item]) => ({ status, count: item.count, total: item.total }));

      return { data: { pnl, expenses, loans } };
    }
    return api.get(`/staff/${id}/pnl`);
  },
  getLeaderboard: async () => { initDemoSync(); return isDemoMode() ? { data: DEMO_STAFF } : api.get('/staff/meta/leaderboard'); },

  // ── Clients ───────────────────────────────────────────────────────────────
  getClients:    async (params = '') => { initDemoSync(); return isDemoMode() ? paginate(DEMO_CLIENTS, params) : api.get(`/clients?${params}`); },
  getClientById: async (id: string) => { initDemoSync(); return isDemoMode() ? { data: DEMO_CLIENTS.find(c => c.id === id) } : api.get(`/clients/${id}`); },
  createClient:  async (data: any) => {
    initDemoSync();
    if (isDemoMode()) {
      const userStr = localStorage.getItem('smos_user');
      let loggedInUser: any = null;
      if (userStr) {
        try { loggedInUser = JSON.parse(userStr); } catch (e) {}
      }
      const officerEmail = loggedInUser?.email || 'admin@kilimomf.co.ug';
      
      const gps_history = [];
      if (data.home_latitude && data.home_longitude) {
        gps_history.push({
          timestamp: new Date().toISOString(),
          user: officerEmail,
          type: 'home',
          latitude: data.home_latitude,
          longitude: data.home_longitude,
          action: 'Initial Home GPS Capture'
        });
      }
      if (data.business_latitude && data.business_longitude) {
        gps_history.push({
          timestamp: new Date().toISOString(),
          user: officerEmail,
          type: 'business',
          latitude: data.business_latitude,
          longitude: data.business_longitude,
          action: 'Initial Business GPS Capture'
        });
      }

      const newC = { 
        ...data, 
        id: `c${Date.now()}`, 
        status: 'pending', 
        created_at: new Date().toISOString(),
        gps_history,
        guarantors: data.guarantors || [],
        lat: data.home_latitude ? parseFloat(data.home_latitude) : 0.3476,
        lng: data.home_longitude ? parseFloat(data.home_longitude) : 32.5825,
      };
      DEMO_CLIENTS.push(newC);
      saveDemoSync();
      return { data: newC };
    }
    return api.post('/clients', data);
  },
  updateClient:  async (id: string, data: any) => {
    initDemoSync();
    if (isDemoMode()) {
      const userStr = localStorage.getItem('smos_user');
      let loggedInUser: any = null;
      if (userStr) {
        try { loggedInUser = JSON.parse(userStr); } catch (e) {}
      }
      const isOfficer = loggedInUser?.role === 'loan_officer';
      const officerEmail = loggedInUser?.email || 'officer@kilimomf.co.ug';

      const existing: any = DEMO_CLIENTS.find((c: any) => c.id === id);
      if (!existing) return { data: { ...data, id } };

      // Compute profile field changes
      const fieldsToCheck = [
        { key: 'first_name', label: 'First Name' },
        { key: 'last_name', label: 'Last Name' },
        { key: 'middle_name', label: 'Middle Name' },
        { key: 'phone_primary', label: 'Primary Phone' },
        { key: 'phone_secondary', label: 'Secondary Phone' },
        { key: 'business_type', label: 'Business Type' },
        { key: 'business_name', label: 'Business Name' },
        { key: 'monthly_income_estimate', label: 'Monthly Income' },
        { key: 'home_address', label: 'Home Address' },
        { key: 'home_district', label: 'Home District' },
        { key: 'business_address', label: 'Business Address' },
        { key: 'business_district', label: 'Business District' },
        { key: 'assigned_staff_id', label: 'Assigned Staff' }
      ];

      const changes: any[] = [];
      fieldsToCheck.forEach(f => {
        const oldVal = existing[f.key] !== undefined && existing[f.key] !== null ? String(existing[f.key]).trim() : '';
        const newVal = data[f.key] !== undefined && data[f.key] !== null ? String(data[f.key]).trim() : '';
        if (oldVal !== newVal) {
          changes.push({
            field: f.label,
            old_value: oldVal,
            new_value: newVal
          });
        }
      });

      let profileHistory = existing.profile_history ? [...existing.profile_history] : [];
      if (changes.length > 0) {
        const userName = `${loggedInUser?.first_name || ''} ${loggedInUser?.last_name || ''}`.trim() || officerEmail;
        const userRole = loggedInUser?.role || 'cashier';
        profileHistory.push({
          timestamp: new Date().toISOString(),
          user: `${userName} (${userRole})`,
          changes
        });
      }

      let finalHomeLat = data.home_latitude;
      let finalHomeLng = data.home_longitude;
      let finalBusLat = data.business_latitude;
      let finalBusLng = data.business_longitude;
      let history = existing.gps_history ? [...existing.gps_history] : [];

      if (isOfficer) {
        // Check Home GPS lock
        if (existing.home_latitude && Number(existing.home_latitude) !== 0) {
          if (data.home_latitude && (String(data.home_latitude) !== String(existing.home_latitude) || String(data.home_longitude) !== String(existing.home_longitude))) {
            throw new Error('Permission denied: Loan officers cannot replace existing Home GPS coordinates.');
          }
          if (!data.home_latitude || !data.home_longitude) {
            throw new Error('Permission denied: Loan officers cannot clear existing Home GPS coordinates.');
          }
          finalHomeLat = existing.home_latitude;
          finalHomeLng = existing.home_longitude;
        } else if (data.home_latitude && data.home_longitude) {
          history.push({
            timestamp: new Date().toISOString(),
            user: officerEmail,
            type: 'home',
            latitude: data.home_latitude,
            longitude: data.home_longitude,
            action: 'Home GPS Updated'
          });
        }

        // Check Business GPS lock
        if (existing.business_latitude && Number(existing.business_latitude) !== 0) {
          if (data.business_latitude && (String(data.business_latitude) !== String(existing.business_latitude) || String(data.business_longitude) !== String(existing.business_longitude))) {
            throw new Error('Permission denied: Loan officers cannot replace existing Business GPS coordinates.');
          }
          if (!data.business_latitude || !data.business_longitude) {
            throw new Error('Permission denied: Loan officers cannot clear existing Business GPS coordinates.');
          }
          finalBusLat = existing.business_latitude;
          finalBusLng = existing.business_longitude;
        } else if (data.business_latitude && data.business_longitude) {
          history.push({
            timestamp: new Date().toISOString(),
            user: officerEmail,
            type: 'business',
            latitude: data.business_latitude,
            longitude: data.business_longitude,
            action: 'Business GPS Updated'
          });
        }
      } else {
        // General user history log
        if ((data.home_latitude && String(data.home_latitude) !== String(existing.home_latitude)) || (data.home_longitude && String(data.home_longitude) !== String(existing.home_longitude))) {
          history.push({
            timestamp: new Date().toISOString(),
            user: officerEmail,
            type: 'home',
            latitude: data.home_latitude,
            longitude: data.home_longitude,
            action: `Home GPS Modified by ${loggedInUser?.role || 'admin'}`
          });
        }
        if ((data.business_latitude && String(data.business_latitude) !== String(existing.business_latitude)) || (data.business_longitude && String(data.business_longitude) !== String(existing.business_longitude))) {
          history.push({
            timestamp: new Date().toISOString(),
            user: officerEmail,
            type: 'business',
            latitude: data.business_latitude,
            longitude: data.business_longitude,
            action: `Business GPS Modified by ${loggedInUser?.role || 'admin'}`
          });
        }
      }

      const updatedClient = {
        ...existing,
        ...data,
        home_latitude: finalHomeLat,
        home_longitude: finalHomeLng,
        business_latitude: finalBusLat,
        business_longitude: finalBusLng,
        gps_history: history,
        profile_history: profileHistory,
        guarantors: data.guarantors || [],
        lat: finalHomeLat ? parseFloat(finalHomeLat) : existing.lat,
        lng: finalHomeLng ? parseFloat(finalHomeLng) : existing.lng,
      };

      const idx = DEMO_CLIENTS.findIndex(c => c.id === id);
      DEMO_CLIENTS[idx] = updatedClient;
      saveDemoSync();
      return { data: updatedClient };
    }
    return api.put(`/clients/${id}`, data);
  },
  approveClient: async (id: string) => {
    if (isDemoMode()) {
      const c = DEMO_CLIENTS.find(cl => cl.id === id);
      if (c) { c.status = 'approved'; saveDemoSync(); }
      return { data: c || { id, status: 'approved' } };
    }
    return api.post(`/clients/${id}/approve`, {});
  },
  getClientMap:  async (branchId?: string) => {
    initDemoSync();
    return isDemoMode()
      ? { data: DEMO_CLIENTS.filter(c => !branchId || c.branch_name === DEMO_BRANCHES.find(b => b.id === branchId)?.name) }
      : api.get(`/clients/meta/map${branchId ? `?branch_id=${branchId}` : ''}`);
  },

  // ── Loans ─────────────────────────────────────────────────────────────────
  getLoans:     async (params = '') => {
    if (isDemoMode()) {
      initDemoSync();
      DEMO_LOANS.forEach((loan: any) => {
        const principal = Number(loan.principal_amount || loan.principal || 0);
        const interestRate = Number(loan.interest_rate || 20);
        const interestAmount = loan.interest_amount !== undefined ? Number(loan.interest_amount) : (principal * interestRate / 100);
        const totalRepayable = loan.total_repayable !== undefined ? Number(loan.total_repayable) : (principal + interestAmount);

        // Find payments from transactions
        const payments = DEMO_TRANSACTIONS.filter((t: any) => t.type === 'repayment' && t.status === 'valid' && (t.reference === loan.loan_number || t.loan_id === loan.id));
        const total_paid = payments.reduce((sum, p: any) => sum + (Number(p.amount) || 0), 0);
        const outstanding_balance = Math.max(0, totalRepayable - total_paid);

        loan.interest_amount = interestAmount;
        loan.total_repayable = totalRepayable;
        loan.total_paid = total_paid;
        loan.outstanding_balance = outstanding_balance;

        // Resolve client, staff, branch details if not already present
        const client: any = DEMO_CLIENTS.find((c: any) => c.id === loan.client_id);
        if (client) {
          loan.client_name = loan.client_name || `${client.first_name} ${client.last_name}`;
          loan.client_phone = loan.client_phone || client.phone_primary;
          const staff: any = DEMO_STAFF.find((s: any) => s.id === client.assigned_staff_id);
          if (staff) {
            const fullName = `${staff.first_name} ${staff.last_name}`;
            loan.staff_name = loan.staff_name || fullName;
            loan.officer_name = loan.officer_name || fullName;
            loan.staff_owner = loan.staff_owner || fullName;
          } else {
            loan.staff_name = loan.staff_name || 'Sarah Nambi';
            loan.officer_name = loan.officer_name || 'Sarah Nambi';
            loan.staff_owner = loan.staff_owner || 'Sarah Nambi';
          }
          loan.branch_name = loan.branch_name || client.branch_name || 'Gulu Branch';
        } else {
          loan.client_name = loan.client_name || 'Demo Client';
          loan.staff_name = loan.staff_name || 'Sarah Nambi';
          loan.officer_name = loan.officer_name || 'Sarah Nambi';
          loan.staff_owner = loan.staff_owner || 'Sarah Nambi';
          loan.branch_name = loan.branch_name || 'Gulu Branch';
        }
      });

      let list = [...DEMO_LOANS];
      const parsed = new URLSearchParams(params);
      const clientId = parsed.get('client_id');
      const staffId = parsed.get('staff_id');
      const officer = parsed.get('officer');
      const status = parsed.get('status');
      const search = parsed.get('search');
      
      if (clientId) list = list.filter(l => l.client_id === clientId);
      if (staffId)  list = list.filter(l => l.staff_id === staffId);
      if (officer) list = list.filter(l => l.officer_name === officer || l.staff_owner?.includes(officer));
      if (status)  list = list.filter(l => l.status === status);
      if (search) {
        const s = search.toLowerCase();
        list = list.filter(l => 
          l.loan_number.toLowerCase().includes(s) || 
          l.client_name.toLowerCase().includes(s) || 
          (l.client_phone && l.client_phone.includes(s))
        );
      }

      // Advanced filters
      const gender = parsed.get('gender');
      const district = parsed.get('district');
      const businessType = parsed.get('business_type');
      const ageRange = parsed.get('age_range');

      const getAge = (dobString: string) => {
        if (!dobString) return 0;
        const today = new Date();
        const birthDate = new Date(dobString);
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }
        return age;
      };

      if (gender || district || businessType || ageRange) {
        list = list.filter(l => {
          const c: any = DEMO_CLIENTS.find(cl => cl.id === l.client_id);
          if (!c) return false;
          if (gender && c.gender !== gender) return false;
          if (district && c.district !== district) return false;
          if (businessType && c.business_type !== businessType) return false;
          if (ageRange) {
            const age = getAge(c.dob);
            if (ageRange === 'under_25' && age >= 25) return false;
            if (ageRange === '25_40' && (age < 25 || age > 40)) return false;
            if (ageRange === 'over_40' && age <= 40) return false;
          }
          return true;
        });
      }

      return paginate(list, params);
    }
    return api.get(`/loans?${params}`);
  },
  getLoanById:  async (id: string) => {
    initDemoSync();
    if (isDemoMode()) {
      const loan: any = DEMO_LOANS.find(l => l.id === id);
      if (!loan) return { data: null };

      // Ensure calculations exist
      const principal = Number(loan.principal_amount || loan.principal || 0);
      const interestRate = Number(loan.interest_rate || 20);
      const interestAmount = loan.interest_amount !== undefined ? Number(loan.interest_amount) : (principal * interestRate / 100);
      const totalRepayable = loan.total_repayable !== undefined ? Number(loan.total_repayable) : (principal + interestAmount);

      // Resolve client, staff, branch details if not already present
      const client: any = DEMO_CLIENTS.find((c: any) => c.id === loan.client_id);
      let client_name = loan.client_name || 'Demo Client';
      let client_phone = loan.client_phone || '';
      let staff_name = loan.staff_name || 'Sarah Nambi';
      let branch_name = loan.branch_name || 'Gulu Branch';

      if (client) {
        client_name = `${client.first_name} ${client.last_name}`;
        client_phone = client.phone_primary;
        const staff: any = DEMO_STAFF.find((s: any) => s.id === client.assigned_staff_id);
        if (staff) {
          staff_name = `${staff.first_name} ${staff.last_name}`;
        }
        branch_name = client.branch_name || 'Gulu Branch';
      }

      // Find payments from transactions
      const payments = DEMO_TRANSACTIONS.filter((t: any) => t.type === 'repayment' && t.status === 'valid' && (t.reference === loan.loan_number || t.loan_id === loan.id))
        .map((t: any) => ({
          id: t.id,
          payment_date: t.timestamp || t.date,
          amount_paid: t.amount,
          payment_method: t.payment_method || 'cash',
          collected_by_name: t.staff_name || 'Sarah Nambi'
        }));

      const total_paid = payments.reduce((sum, p: any) => sum + p.amount_paid, 0);
      const outstanding_balance = Math.max(0, totalRepayable - total_paid);

      // Update basic fields on cached loan in array as well
      loan.total_paid = total_paid;
      loan.outstanding_balance = outstanding_balance;
      loan.staff_name = staff_name;
      loan.officer_name = staff_name;
      loan.staff_owner = staff_name;

      // Generate dynamic schedule if disbursed (i.e. status is not draft or pending_approval)
      const schedule = [];
      const hasDisbursed = !['draft', 'pending_approval'].includes(loan.status);
      if (hasDisbursed) {
        const duration = Number(loan.duration_days || 30);
        const freq = loan.repayment_frequency || 'daily';
        let numInstallments = 1;
        let daysPerInstallment = 1;

        if (freq === 'daily') {
          numInstallments = duration;
          daysPerInstallment = 1;
        } else if (freq === 'weekly') {
          numInstallments = Math.max(1, Math.ceil(duration / 7));
          daysPerInstallment = 7;
        } else if (freq === 'monthly') {
          numInstallments = Math.max(1, Math.ceil(duration / 30));
          daysPerInstallment = 30;
        }

        const installmentAmountBase = Math.floor(totalRepayable / numInstallments);
        let remainingRepayable = totalRepayable;
        let tempPaid = total_paid;

        const startDate = new Date(loan.disbursed_at || loan.disbursement_date || loan.created_at);

        for (let i = 1; i <= numInstallments; i++) {
          const installmentDue = (i === numInstallments) ? remainingRepayable : installmentAmountBase;
          remainingRepayable -= installmentDue;

          const dueDate = new Date(startDate);
          dueDate.setDate(startDate.getDate() + (i * daysPerInstallment));

          const paidForThisInstallment = Math.min(tempPaid, installmentDue);
          tempPaid -= paidForThisInstallment;

          const balance = Math.max(0, installmentDue - paidForThisInstallment);
          const is_paid = balance <= 0;

          schedule.push({
            id: `sched-${loan.id}-${i}`,
            installment_number: i,
            due_date: dueDate.toISOString(),
            total_due: installmentDue,
            total_paid: paidForThisInstallment,
            balance: balance,
            is_paid: is_paid
          });
        }
      }

      // Guarantors
      const guarantors = loan.guarantors || [];

      const detailedLoan = {
        ...loan,
        client_name,
        client_phone,
        staff_name,
        branch_name,
        interest_amount: interestAmount,
        total_repayable: totalRepayable,
        total_paid,
        outstanding_balance,
        schedule,
        payments,
        guarantors
      };

      return { data: detailedLoan };
    }
    return api.get(`/loans/${id}`);
  },
  createLoan:   async (data: any) => {
    initDemoSync();
    if (isDemoMode()) {
      const principal = Number(data.principal_amount || 0);
      const interestRate = Number(data.interest_rate || 20);
      const interestAmount = principal * interestRate / 100;
      const totalRepayable = principal + interestAmount;

      const client: any = DEMO_CLIENTS.find(c => c.id === data.client_id);
      let client_name = data.client_name || 'Demo Client';
      let client_phone = '';
      let staff_name = 'Sarah Nambi';
      let branch_name = 'Gulu Branch';

      if (client) {
        client_name = `${client.first_name} ${client.last_name}`;
        client_phone = client.phone_primary;
        const staff: any = DEMO_STAFF.find(s => s.id === client.assigned_staff_id);
        if (staff) {
          staff_name = `${staff.first_name} ${staff.last_name}`;
        }
        branch_name = client.branch_name || 'Gulu Branch';
      }

      const userStr = localStorage.getItem('smos_user');
      let loggedInUser: any = null;
      if (userStr) {
        try { loggedInUser = JSON.parse(userStr); } catch (e) {}
      }
      if (loggedInUser) {
        const loggedInName = `${loggedInUser.first_name} ${loggedInUser.last_name}`;
        if (!client || !client.assigned_staff_id) {
          staff_name = loggedInName;
        }
        branch_name = client?.branch_name || loggedInUser.branch_name || 'Gulu Branch';
      }

      let guarantor_name = '';
      let guarantor_phone = '';
      if (data.guarantors && data.guarantors.length > 0) {
        guarantor_name = data.guarantors[0].full_name;
        guarantor_phone = data.guarantors[0].phone;
      }

      const newL = {
        ...data,
        id: `l${Date.now()}`,
        loan_number: `LN-${Math.floor(1000 + Math.random() * 9000)}`,
        principal_amount: principal,
        interest_rate: interestRate,
        interest_amount: interestAmount,
        total_repayable: totalRepayable,
        outstanding_balance: totalRepayable,
        total_paid: 0,
        client_name,
        client_phone,
        staff_name,
        officer_name: staff_name,
        staff_owner: staff_name,
        branch_name,
        guarantor_name,
        guarantor_phone,
        status: loggedInUser?.role === 'loan_officer' ? 'pending_approval' : 'draft',
        staff_id: loggedInUser?.role === 'loan_officer' ? loggedInUser.id : (client?.assigned_staff_id || 's001'),
        created_at: new Date().toISOString()
      };
      DEMO_LOANS.unshift(newL);
      saveDemoSync();
      return { data: newL };
    }
    return api.post('/loans', data);
  },
  approveLoan:  async (id: string) => {
    initDemoSync();
    if (isDemoMode()) {
      const l = DEMO_LOANS.find(ln => ln.id === id);
      if (l) { l.status = 'approved'; saveDemoSync(); }
      return { data: l || { id, status: 'approved' } };
    }
    return api.post(`/loans/${id}/approve`, {});
  },
  disburseLoan: async (id: string, data: any) => {
    initDemoSync();
    if (isDemoMode()) {
      const l: any = DEMO_LOANS.find(ln => ln.id === id);
      if (l) {
        l.status = 'active';
        l.disbursed_at = new Date().toISOString();
        l.disbursement_date = l.disbursed_at;

        // Compute expected closure date
        const durationDays = Number(l.duration_days || 30);
        const closureDate = new Date(l.disbursed_at);
        closureDate.setDate(closureDate.getDate() + durationDays);
        l.expected_closure_date = closureDate.toISOString();

        Object.assign(l, data);

        // Automatically clean up other pending/draft applications for this client
        for (let i = DEMO_LOANS.length - 1; i >= 0; i--) {
          const ln = DEMO_LOANS[i];
          if (ln.client_id === l.client_id && ln.id !== id && ['draft', 'pending_approval'].includes(ln.status)) {
            DEMO_LOANS.splice(i, 1);
          }
        }

        saveDemoSync();
      }
      return { data: l || { id, status: 'active', ...data } };
    }
    return api.post(`/loans/${id}/disburse`, data);
  },
  deleteLoan: async (id: string) => {
    initDemoSync();
    if (isDemoMode()) {
      const idx = DEMO_LOANS.findIndex(l => l.id === id);
      if (idx !== -1) {
        DEMO_LOANS.splice(idx, 1);
        saveDemoSync();
      }
      return { success: true };
    }
    return api.delete(`/loans/${id}`);
  },
  writeoffLoan: async (id: string) => {
    initDemoSync();
    if (isDemoMode()) {
      const l = DEMO_LOANS.find(ln => ln.id === id);
      if (l) { l.status = 'written_off'; saveDemoSync(); }
      return { data: l || { id, status: 'written_off' } };
    }
    return api.post(`/loans/${id}/writeoff`, {});
  },

  // ── Repayments ────────────────────────────────────────────────────────────
  recordPayment: async (data: any) => {
    initDemoSync();
    if (isDemoMode()) {
      const loan = DEMO_LOANS.find(l => l.id === data.loan_id || l.loan_number === data.loan_number || l.loan_number === data.reference_number);
      const amt = parseFloat(data.amount_paid || data.amount || 0);

      const userStr = localStorage.getItem('smos_user');
      let loggedInUser: any = null;
      if (userStr) {
        try { loggedInUser = JSON.parse(userStr); } catch (e) {}
      }
      const collectorName = loggedInUser ? `${loggedInUser.first_name} ${loggedInUser.last_name}` : 'Sarah Nambi';

      const newTx = {
        id: `tx-${Date.now()}`,
        type: 'repayment',
        category: 'cash_in',
        amount: amt,
        client_name: (loan ? loan.client_name : '') || data.client_name || 'Demo Client',
        reference: loan ? loan.loan_number : (data.reference_number || data.loan_number || 'N/A'),
        loan_id: loan ? loan.id : data.loan_id,
        staff_name: collectorName,
        status: 'valid',
        date: new Date().toISOString().split('T')[0],
        timestamp: new Date().toISOString(),
        payment_method: data.payment_method || 'cash'
      };
      DEMO_TRANSACTIONS.unshift(newTx);

      // Sync Loan Balance & Performance
      if (loan) {
        loan.total_paid = (loan.total_paid || 0) + amt;
        loan.outstanding_balance = Math.max(0, (loan.total_repayable || loan.outstanding_balance || 0) - loan.total_paid);
        loan.last_payment_date = new Date().toISOString().split('T')[0];
        loan.consecutive_missed = 0; // Reset missed count

        // Custom transition for Written Off -> Defaulters
        const oldStatus = calculateLoanPerformance({ ...loan, outstanding_balance: loan.outstanding_balance + amt });
        if (oldStatus === 'written_off') {
           loan.is_manual_default = true; // Mark to stay in default even if within maturity
        }
      }
      saveDemoSync();
      return { data: newTx };
    }
    return api.post('/repayments', data);
  },
  getRepayments: async (params = '') => {
    if (isDemoMode()) {
      initDemoSync();
      const p = new URLSearchParams(params);
      const date = p.get('date');
      let rows = DEMO_TRANSACTIONS.filter(t => t.type === 'repayment' && t.status === 'valid');
      if (date) rows = rows.filter(r => r.date === date);
      // Map to expected repayment structure for compatibility
      const mapped = rows.map(r => ({
        id: r.id,
        loan_number: r.reference,
        client_name: r.client_name,
        amount: r.amount,
        created_at: r.timestamp,
        staff_name: r.staff_name
      }));
      return paginate(mapped, params);
    }
    return api.get(`/repayments?${params}`);
  },
  getSchedule:   async (loanId: string) => isDemoMode() ? { data: [] } : api.get(`/repayments/schedule/${loanId}`),

  // ── Credit ────────────────────────────────────────────────────────────────
  getCreditScore: async (clientId: string) => { initDemoSync(); return isDemoMode()
    ? { data: { client_id: clientId, score: DEMO_CLIENTS.find(c => c.id === clientId)?.credit_score || 60, grade: 'B', computed_at: new Date().toISOString() } }
    : api.get(`/credit/${clientId}`); },
  computeScore: async (clientId: string) => isDemoMode()
    ? { data: { client_id: clientId, score: Math.floor(Math.random() * 30) + 60, grade: 'B' } }
    : api.post(`/credit/${clientId}/compute`, {}),

  // ── Expenses ──────────────────────────────────────────────────────────────
  getExpenses:    async (params = '') => { initDemoSync(); return isDemoMode() ? paginate(DEMO_EXPENSES, params) : api.get(`/expenses?${params}`); },
  createExpense:  async (data: any) => {
    initDemoSync();
    if (isDemoMode()) {
      let staffName = 'General Staff';
      if (data.staff_id) {
        const s = DEMO_STAFF.find(st => st.id === data.staff_id);
        if (s) staffName = `${s.first_name} ${s.last_name}`;
      } else if (data.staff_name) {
        staffName = data.staff_name;
      }
      const newExp = {
        ...data,
        id: `e${Date.now()}`,
        staff_name: staffName,
        status: 'approved',
        is_approved: true,
        created_at: new Date().toISOString()
      };
      DEMO_EXPENSES.unshift(newExp);
      if (data.category === 'salary' && data.staff_id) {
        const s = DEMO_STAFF.find(st => st.id === data.staff_id);
        if (s) s.payroll_status = 'Paid';
      }
      saveDemoSync();
      return { data: newExp };
    }
    return api.post('/expenses', data);
  },
  approveExpense: async (id: string) => {
    if (isDemoMode()) {
      const e = DEMO_EXPENSES.find(ex => ex.id === id);
      if (e) { e.status = 'approved'; (e as any).is_approved = true; saveDemoSync(); }
      return { data: e || { id, status: 'approved' } };
    }
    return api.post(`/expenses/${id}/approve`, {});
  },

  // ── Legal ─────────────────────────────────────────────────────────────────
  getLegalCases:   async (params = '') => isDemoMode() ? paginate(DEMO_LEGAL, params) : api.get(`/legal?${params}`),
  getLegalCase:    async (id: string) => { initDemoSync(); return isDemoMode() ? { data: DEMO_LEGAL.find(l => l.id === id) } : api.get(`/legal/${id}`); },
  openLegalCase:   async (data: any) => {
    if (isDemoMode()) {
      const newCase = { ...data, id: `leg${Date.now()}`, status: data.status || 'open', created_at: new Date().toISOString() };
      DEMO_LEGAL.unshift(newCase);
      saveDemoSync();
      return { data: newCase };
    }
    return api.post('/legal', data);
  },
  updateLegalCase: async (id: string, data: any) => {
    if (isDemoMode()) {
      const idx = DEMO_LEGAL.findIndex(lg => lg.id === id);
      if (idx !== -1) {
        DEMO_LEGAL[idx] = { ...DEMO_LEGAL[idx], ...data };
        saveDemoSync();
        return { data: DEMO_LEGAL[idx] };
      }
      return { data: { ...data, id } };
    }
    return api.put(`/legal/${id}`, data);
  },

  // ── Notifications ─────────────────────────────────────────────────────────
  sendReminders: async () => isDemoMode() ? { data: { sent: 12, message: 'Demo: 12 reminders queued' } } : api.post('/notifications/send-reminders', {}),

  // ── Reports ───────────────────────────────────────────────────────────────
  getCompanyReport:    async () => isDemoMode() ? { data: DEMO_DASHBOARD } : api.get('/reports/company'),
  getBranchReport:     async (id: string) => isDemoMode() ? { data: { ...DEMO_DASHBOARD, branch_id: id } } : api.get(`/reports/branch/${id}`),
  getAuditLog:         async (params = '') => isDemoMode() ? paginate([], params) : api.get(`/reports/audit?${params}`),
  getPortfolioAtRisk:  async (params = '') => {
    if (isDemoMode()) {
      initDemoSync();
      const p = new URLSearchParams(params);
      const staffId = p.get('staff_id');
      const neverPaid = p.get('never_paid');
      
      let rows = DEMO_LOANS.map(l => {
        l.status = calculateLoanPerformance(l);
        l.advance_amount = calculateLoanAdvance(l);
        return l;
      });

      // Filter by role-based restrictions
      const userStr = localStorage.getItem('smos_user');
      let loggedInUser: any = null;
      if (userStr) {
        try { loggedInUser = JSON.parse(userStr); } catch (e) {}
      }
      if (loggedInUser && loggedInUser.role === 'loan_officer') {
        const fullName = `${loggedInUser.first_name} ${loggedInUser.last_name}`.toLowerCase();
        rows = rows.filter((l: any) => 
          l.staff_id === loggedInUser.id ||
          (l.officer_name || '').toLowerCase().includes(fullName) || 
          (l.staff_name || '').toLowerCase().includes(fullName) ||
          (l.staff_owner || '').toLowerCase().includes(fullName)
        );
      }

      if (staffId) {
        rows = rows.filter(l => l.staff_id === staffId);
      }
      if (neverPaid === 'true') {
        rows = rows.filter(l => Number(l.total_paid || 0) === 0);
      } else {
        rows = rows.filter(l => Number(l.arrears_amount || 0) > 0 || Number(l.advance_amount || 0) > 0);
      }
      return { data: rows };
    }
    return api.get(`/reports/portfolio-at-risk?${params}`);
  },
  getStaffPeriodicPerformance: async (params = '') => isDemoMode()
    ? { data: [] }
    : api.get(`/reports/staff-periodic-performance?${params}`),
  getCollectionEfficiency: async (params = '') => isDemoMode()
    ? { data: [] }
    : api.get(`/reports/collection-efficiency?${params}`),
  getMissedInstallmentsReport: async (minCount = 4) => isDemoMode() ? { data: [
    { client_name: 'Paul Kato', phone_primary: '+256701111111', loan_number: 'LN-2026-004', missed_count: 5, outstanding_balance: 1200000 }
  ] } : api.get(`/reports/missed-installments?min_count=${minCount}`),
  getDormantLoans: async (days = 30) => isDemoMode() ? { data: [
    { client_name: 'Sarah Akello', phone_primary: '+256772222222', loan_number: 'LN-2026-009', last_payment_date: '2026-03-15', outstanding_balance: 850000 }
  ] } : api.get(`/reports/dormant?days=${days}`),
  getMaturingLoans: async (date = '') => isDemoMode() ? { data: [
    { loan_number: 'LN-2026-003', client_name: 'Grace Namubiru', phone_primary: '+256773333333', outstanding_balance: 500000, expected_closure_date: '2026-05-18' }
  ] } : api.get(`/reports/maturing?date=${date}`),

  getLoanRequestsReport: async (params = '') => {
    if (isDemoMode()) {
      initDemoSync();
      const userStr = localStorage.getItem('smos_user');
      let loggedInUser: any = null;
      if (userStr) {
        try { loggedInUser = JSON.parse(userStr); } catch (e) {}
      }
      let rows = DEMO_LOANS.filter(l => l.status === 'pending_approval');
      if (loggedInUser && loggedInUser.role === 'loan_officer') {
        const fullName = `${loggedInUser.first_name} ${loggedInUser.last_name}`.toLowerCase();
        rows = rows.filter(l => 
          l.staff_id === loggedInUser.id || 
          ((l as any).officer_name || '').toLowerCase().includes(fullName) ||
          ((l as any).staff_name || '').toLowerCase().includes(fullName)
        );
      }
      return { data: rows };
    }
    return api.get(`/reports/loan-requests?${params}`);
  },

  getDemandReport: async (params = '') => {
    if (isDemoMode()) {
      initDemoSync();
      const p = new URLSearchParams(params);
      const toDateStr = p.get('to_date') || new Date().toISOString().split('T')[0];
      
      const userStr = localStorage.getItem('smos_user');
      let loggedInUser: any = null;
      if (userStr) {
        try { loggedInUser = JSON.parse(userStr); } catch (e) {}
      }

      const demandRows: any[] = [];
      const relevantLoans = DEMO_LOANS.filter(l => ['active', 'dormant', 'at_risk', 'delinquent'].includes(l.status));
      
      relevantLoans.forEach(loan => {
        if (loggedInUser && loggedInUser.role === 'loan_officer') {
          const fullName = `${loggedInUser.first_name} ${loggedInUser.last_name}`.toLowerCase();
          const matchesOfficer = loan.staff_id === loggedInUser.id || 
            ((loan as any).officer_name || '').toLowerCase().includes(fullName) || 
            ((loan as any).staff_name || '').toLowerCase().includes(fullName) ||
            ((loan as any).staff_owner || '').toLowerCase().includes(fullName);
          if (!matchesOfficer) return;
        }

        if (Number(loan.arrears_amount) > 0) {
          demandRows.push({
            loan_number: loan.loan_number,
            client_name: loan.client_name,
            client_phone: loan.client_phone,
            officer_name: loan.officer_name,
            due_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            amount_due: loan.arrears_amount,
            outstanding_balance: loan.outstanding_balance
          });
        }
      });
      return { data: demandRows };
    }
    return api.get(`/reports/demand?${params}`);
  },

  // ── Ledger & Transactions ──────────────────────────────────────────────────
  getTransactions: async (params = '') => { initDemoSync(); return isDemoMode() ? paginate(DEMO_TRANSACTIONS, params) : api.get(`/transactions?${params}`); },
  reverseTransaction: async (id: string, reason: string, type: string = 'repayment') => {
    initDemoSync();
    if (isDemoMode()) {
      const tx: any = DEMO_TRANSACTIONS.find(t => t.id === id);
      if (tx && tx.status !== 'reversed') {
        tx.status = 'reversed';
        
        // Restore Loan Balance if it was a repayment
        if (tx.type === 'repayment') {
          const loan: any = DEMO_LOANS.find((l: any) => l.loan_number === tx.reference || l.id === tx.loan_id);
          if (loan) {
            loan.total_paid = Math.max(0, (loan.total_paid || 0) - (tx.amount || 0));
            loan.outstanding_balance = Math.max(0, (loan.total_repayable || 0) - loan.total_paid);
          }
        }
      }
      saveDemoSync();
      return { data: tx, message: 'Transaction reversed successfully.' };
    }
    return api.post(`/transactions/${id}/reverse`, { reason, type });
  },
  editTransaction: async (id: string, data: any) => {
    if (isDemoMode()) {
      const tx = DEMO_TRANSACTIONS.find(t => t.id === id);
      if (tx) {
        Object.assign(tx, data);
        if (data.amount) tx.amount = parseFloat(data.amount);
        saveDemoSync();
      }
      return { success: true };
    }
    return request(`/transactions/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
  },
  deleteTransaction: async (id: string) => {
    if (isDemoMode()) {
      const idx = DEMO_TRANSACTIONS.findIndex(t => t.id === id);
      if (idx !== -1) { DEMO_TRANSACTIONS.splice(idx, 1); saveDemoSync(); }
      return { success: true };
    }
    return request(`/transactions/${id}`, { method: 'DELETE' });
  },
  getDailyReportStatus: async (date: string) => {
    if (isDemoMode()) {
      initDemoSync();
      const rep = DEMO_DAILY_REPORTS.find(r => r.date === date);
      return { data: rep || { status: 'open' } };
    }
    return api.get(`/reports/daily/status?date=${date}`);
  },
  lockDay: async (date: string) => {
    if (isDemoMode()) {
      DEMO_DAILY_REPORTS.push({
        date,
        branch_id: 'branch-001',
        status: 'locked',
        opening_balance: 0,
        processing_fees: 0,
        loan_collections: 0,
        total_disbursed: 0,
        total_in: 0,
        total_out: 0,
        banking: 0,
        closing_balance: 0,
        locked_by: 'Current User'
      });
      saveDemoSync();
      return { message: 'Day locked successfully.' };
    }
    return api.post('/reports/daily/lock', { date });
  },
  recordMiscTransaction: async (data: unknown) => isDemoMode() ? { data: { ...data as object, id: `m${Date.now()}`, created_at: new Date().toISOString() } } : api.post('/misc', data),

  // PDF Report Data Endpoints
  getDailyLedger: async (date: string, branchId?: string) =>
    isDemoMode() ? { data: { 
      opening_balance: 444100, 
      rows: [
        { no: 1, name: 'Opening Balance', cash_in: 444100, cash_out: 0, balance: 444100 },
        { no: 2, name: 'Repayment: John Doe', cash_in: 50000, cash_out: 0, balance: 494100 },
        { no: 3, name: 'Expense: Transport', cash_in: 0, cash_out: 10000, balance: 484100 },
      ], 
      total_cash_in: 494100, total_cash_out: 10000, closing_balance: 484100, 
      loans_given: 1, total_loans_given: 500000, processing_fees: 25000, 
      clients_paid: 1, total_collections: 50000 
    } }
    : api.get(`/reports/daily/ledger?date=${date}${branchId ? `&branch_id=${branchId}` : ''}`),

  getStaffArrearsRanking: async () => isDemoMode() ? { data: [
    { name: 'John Mukasa', portfolio_size: 45000000, arrears_amount: 800000, par_rate: 1.8 },
    { name: 'Agnes Akello', portfolio_size: 28000000, arrears_amount: 620000, par_rate: 2.2 }
  ] } : api.get('/reports/staff-ranking'),

  getUnpaidPerOfficer: async (params = '') =>
    isDemoMode() ? { data: [
      { no: 1, names: 'James Okello', phone: '+256702222222', location: 'Kampala', loan_given: 1000000, date_given: '2024-01-01', last_date_paid: '2024-02-01', last_amount_paid: 50000, debt: 800000 }
    ], total: 1 }
    : api.get(`/reports/unpaid-per-officer?${params}`),

  getLoanAging: async (params = '') =>
    isDemoMode() ? { data: [
      { no: 1, client_name: 'Alice Namu', client_phone: '+256701111111', guarantor_name: 'Bob G', guarantor_phone: '+256701111112', date_given: '2024-01-01', due_date: '2024-06-01', amount_given: 2000000, interest: 400000, balance: 1200000, total_arrears: 300000, days_missed: 15, loan_year: 2024 }
    ], year_summary: [{ year: 2024, count: 1, total_balance: 1200000, total_arrears: 300000 }], total_loans: 1 }
    : api.get(`/reports/loan-aging?${params}`),

  getLoansIssued: async (params = '') =>
    isDemoMode() ? { data: [
      { no: 1, date: '2024-05-13', client_name: 'Ritah Akech', amount_given: 500000, interest: 100000, total_amount: 600000, status: 'active' }
    ], totals: { total_amount_given: 500000, total_interest: 100000, total_repayable: 600000 }, count: 1 }
    : api.get(`/reports/loans-issued?${params}`),

  getIncomeStatement: async (params = '') =>
    isDemoMode() ? { data: { 
      gross_interest_income: 70865000, processing_fees: 9365000, total_income: 80230000, 
      expense_rows: [{ description: 'Salaries', amount: 5600000 }], total_expenses: 5600000, 
      net_profit: 74630000, money_in_circulation: 370507000, cash_at_hand: 2189700 
    } }
    : api.get(`/reports/income-statement?${params}`),

  getDailyFinancialSummary: async (date: string, branchId?: string) =>
    isDemoMode() ? { data: {
      opening_balance: 444100, collections: 13724000, expenses: 664000, disbursements: 12300000, processing_fees: 263000,
      loan_details: [{ loan_number: 'LN001', client_name: 'Test Client', principal_amount: 1000000, processing_fee: 50000 }],
      staff_performance: [{ staff_name: 'Agent A', total_clients: 100, paid_clients: 80, expected_today: 1000000, collected_today: 800000 }]
    } } : api.get(`/reports/daily/financial-summary?date=${date}${branchId ? `&branch_id=${branchId}` : ''}`),

  // ── Document Vault ────────────────────────────────────────────────────────
  getDocuments: async (params = '') => {
    initDemoSync();
    if (isDemoMode()) {
      const p = new URLSearchParams(params);
      const category = p.get('category');
      const search = (p.get('search') || '').toLowerCase();
      let docs = [...DEMO_DOCUMENTS];
      if (category) docs = docs.filter(d => d.category === category);
      if (search) docs = docs.filter(d =>
        d.name.toLowerCase().includes(search) ||
        d.entity_name.toLowerCase().includes(search) ||
        (d.notes || '').toLowerCase().includes(search)
      );
      docs.sort((a, b) => new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime());
      return { data: docs };
    }
    return api.get(`/documents?${params}`);
  },
  uploadDocument: async (data: any) => {
    if (isDemoMode()) {
      initDemoSync();
      const newDoc = {
        ...data,
        id: `doc-${Date.now()}`,
        uploaded_at: new Date().toISOString(),
        uploaded_by: (() => {
          try { const u = JSON.parse(localStorage.getItem('smos_user') || '{}'); return `${u.first_name} ${u.last_name}`; } catch { return 'Unknown'; }
        })(),
      };
      DEMO_DOCUMENTS.push(newDoc);
      saveDemoSync();
      return { data: newDoc };
    }
    return api.post('/documents', data);
  },
  deleteDocument: async (id: string) => {
    if (isDemoMode()) {
      initDemoSync();
      const idx = DEMO_DOCUMENTS.findIndex(d => d.id === id);
      if (idx !== -1) DEMO_DOCUMENTS.splice(idx, 1);
      saveDemoSync();
      return { data: { success: true } };
    }
    return api.delete(`/documents/${id}`);
  },
};
