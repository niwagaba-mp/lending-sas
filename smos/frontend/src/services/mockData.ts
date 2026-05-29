// ─── SMOS Demo/Mock Data ────────────────────────────────────────────────────
// Used when backend is offline. Enables full UI exploration without PostgreSQL.

export function syncGet(key: string, fallback: any[]) {
  try {
    const stored = localStorage.getItem(`smos_sync_${key}`);
    if (stored) return JSON.parse(stored);
  } catch {}
  return fallback;
}

export function syncSet(key: string, data: any[]) {
  try {
    localStorage.setItem(`smos_sync_${key}`, JSON.stringify(data));
  } catch {}
}

export const DEMO_USER = {
  id: 'demo-001',
  first_name: 'Admin',
  last_name: 'Demo',
  email: 'admin@kilimomf.co.ug',
  role: 'admin',
  tenant_id: 'tenant-001',
  branch_id: 'branch-001',
  branch_name: 'Head Office',
  tenant_name: 'Kilimo MF',
  currency: 'UGX',
};

export const DEMO_TOKEN = 'demo-mode-token';

export const DEMO_CASHIER_USER = {
  id: 'demo-cashier-001',
  first_name: 'Sarah',
  last_name: 'Nambi',
  email: 'sarah@kilimomf.co.ug',
  role: 'cashier',
  tenant_id: 'tenant-001',
  branch_id: 'branch-001',
  branch_name: 'Head Office',
  tenant_name: 'Kilimo MF',
  currency: 'UGX',
};

export const DEMO_SUPER_ADMIN = {
  id: 'demo-super-001',
  first_name: 'System',
  last_name: 'Administrator',
  email: 'superadmin@kilimomf.co.ug',
  role: 'super_admin',
  tenant_id: 'tenant-001',
  branch_id: 'branch-001',
  branch_name: 'Global Node',
  tenant_name: 'SMOS Cloud',
  currency: 'UGX',
};

export const DEMO_BUSINESS_OWNER = {
  id: 'demo-owner-001',
  first_name: 'Benjamin',
  last_name: 'Owner',
  email: 'owner@kilimomf.co.ug',
  role: 'tenant_admin',
  tenant_id: 'tenant-001',
  branch_id: 'branch-001',
  branch_name: 'Head Office',
  tenant_name: 'Kilimo MF',
  currency: 'UGX',
};

export const DEMO_BRANCHES = [
  { id: 'branch-001', name: 'Head Office', code: 'KMP-HQ', district: 'Kampala', region: 'Central', manager_name: 'John Mukasa', manager_id: 's001', active_loans: 120, total_portfolio: 45000000, client_count: 210, phone: '+256700000002', email: 'ho@kilimomf.co.ug', created_at: '2023-01-01' },
  { id: 'branch-002', name: 'Gulu Branch', code: 'GLU-01', district: 'Gulu', region: 'Northern', manager_name: 'Agnes Akello', manager_id: 's002', active_loans: 78, total_portfolio: 28000000, client_count: 145, phone: '+256700000003', email: 'gulu@kilimomf.co.ug', created_at: '2023-03-15' },
  { id: 'branch-003', name: 'Mbarara Branch', code: 'MBR-01', district: 'Mbarara', region: 'Western', manager_name: 'Peter Tusiime', manager_id: 's003', active_loans: 55, total_portfolio: 18000000, client_count: 98, phone: '+256700000004', email: 'mbarara@kilimomf.co.ug', created_at: '2023-06-01' },
];

export const DEMO_STAFF = [
  { 
    id: 's001', first_name: 'John', last_name: 'Mukasa', email: 'john@kilimomf.co.ug', role: 'branch_manager', branch_name: 'Head Office', phone: '+256700111222', status: 'active', 
    total_disbursed: 12000000, total_collected: 10500000, commission_earned: 315000, created_at: '2023-01-05',
    recommender_name: 'Dr. William Bwogi', recommender_workplace: 'Bank of Uganda / BOU', recommender_phone: '+256772900800',
    salary_approved: 2500000, allowance_approved: 60000, payroll_status: 'Unpaid'
  },
  { 
    id: 's002', first_name: 'Agnes', last_name: 'Akello', email: 'agnes@kilimomf.co.ug', role: 'loan_officer', branch_name: 'Gulu Branch', phone: '+256700333444', status: 'active', 
    total_disbursed: 8000000, total_collected: 7200000, commission_earned: 216000, created_at: '2023-03-20',
    recommender_name: 'Chief Magistrate Apio', recommender_workplace: 'Gulu Municipal Council', recommender_phone: '+256772400500',
    salary_approved: 1500000, allowance_approved: 45000, payroll_status: 'Unpaid'
  },
  { 
    id: 's003', first_name: 'Peter', last_name: 'Tusiime', email: 'peter@kilimomf.co.ug', role: 'loan_officer', branch_name: 'Mbarara Branch', phone: '+256700555666', status: 'active', 
    total_disbursed: 5500000, total_collected: 4900000, commission_earned: 147000, created_at: '2023-06-10',
    recommender_name: 'Hon. Grace Tusiime', recommender_workplace: 'Mbarara District Headquarters', recommender_phone: '+256772600700',
    salary_approved: 1400000, allowance_approved: 40000, payroll_status: 'Unpaid'
  },
  { 
    id: 's004', first_name: 'Sarah', last_name: 'Nambi', email: 'sarah@kilimomf.co.ug', role: 'cashier', branch_name: 'Head Office', phone: '+256700777888', status: 'active', 
    total_disbursed: 0, total_collected: 9800000, commission_earned: 0, created_at: '2023-02-01',
    recommender_name: 'Prof. Ssemwogerere', recommender_workplace: 'Makerere University Kampala', recommender_phone: '+256772100200',
    salary_approved: 1200000, allowance_approved: 35000, payroll_status: 'Unpaid'
  },
];

export const DEMO_CLIENTS = [
  { 
    id: 'c001', first_name: 'Mary', last_name: 'Nakato', national_id: 'CM12345678', 
    phone: '+256701111111', phone_primary: '+256701111111', gender: 'female', dob: '1985-04-12', 
    village: 'Bwaise', sub_county: 'Kawempe', district: 'Kampala', branch_name: 'Head Office', 
    status: 'approved', credit_score: 820, credit_grade: 'A', loan_count: 3, active_loan_balance: 2500000, 
    home_latitude: '0.3476', home_longitude: '32.5825', lat: 0.3476, lng: 32.5825, 
    business_latitude: '0.3520', business_longitude: '32.5860',
    created_at: '2023-02-10', gps_history: [
      { timestamp: '2023-02-10T10:00:00Z', user: 'admin@kilimomf.co.ug', type: 'home', latitude: '0.3476', longitude: '32.5825', action: 'Initial Home GPS Capture' }
    ], guarantors: [
      { full_name: 'Peter Odhiambo', phone: '+256711111111', relationship: 'Brother', national_id: 'CM11111111', address: 'Lira' }
    ],
    assigned_staff_id: 's001'
  },
  { 
    id: 'c002', first_name: 'James', last_name: 'Okello', national_id: 'CM87654321', 
    phone: '+256702222222', phone_primary: '+256702222222', gender: 'male', dob: '1979-08-22', 
    village: 'Gulu Town', sub_county: 'Laroo', district: 'Gulu', branch_name: 'Gulu Branch', 
    status: 'approved', credit_score: 710, credit_grade: 'B', loan_count: 2, active_loan_balance: 1800000, 
    home_latitude: '2.7748', home_longitude: '32.2989', lat: 2.7748, lng: 32.2989, 
    business_latitude: '2.7800', business_longitude: '32.3020',
    created_at: '2023-04-05', gps_history: [
      { timestamp: '2023-04-05T11:00:00Z', user: 'officer@kilimomf.co.ug', type: 'home', latitude: '2.7748', longitude: '32.2989', action: 'Initial Home GPS Capture' }
    ], guarantors: [
      { full_name: 'Mary Akello', phone: '+256722222222', relationship: 'Aunt', national_id: 'CM22222222', address: 'Gulu' }
    ],
    assigned_staff_id: 's002'
  },
  { 
    id: 'c003', first_name: 'Grace', last_name: 'Tusiime', national_id: 'CM11223344', 
    phone: '+256703333333', phone_primary: '+256703333333', gender: 'female', dob: '1990-01-30', 
    village: 'Ruharo', sub_county: 'Kakoba', district: 'Mbarara', branch_name: 'Mbarara Branch', 
    status: 'approved', credit_score: 650, credit_grade: 'C', loan_count: 1, active_loan_balance: 900000, 
    home_latitude: '-0.6017', home_longitude: '30.6545', lat: -0.6017, lng: 30.6545, 
    business_latitude: '-0.5980', business_longitude: '30.6600',
    created_at: '2023-07-15', gps_history: [
      { timestamp: '2023-07-15T09:00:00Z', user: 'peter@kilimomf.co.ug', type: 'home', latitude: '-0.6017', longitude: '30.6545', action: 'Initial Home GPS Capture' }
    ], guarantors: [
      { full_name: 'James Mukasa', phone: '+256733333333', relationship: 'Husband', national_id: 'CM33333333', address: 'Mbale' }
    ],
    assigned_staff_id: 's003'
  },
  { 
    id: 'c004', first_name: 'David', last_name: 'Ssemwogerere', national_id: 'CM55667788', 
    phone: '+256704444444', phone_primary: '+256704444444', gender: 'male', dob: '1982-11-05', 
    village: 'Nansana', sub_county: 'Nansana', district: 'Wakiso', branch_name: 'Head Office', 
    status: 'pending', credit_score: 580, credit_grade: 'D', loan_count: 0, active_loan_balance: 0, 
    home_latitude: '0.3780', home_longitude: '32.5220', lat: 0.3780, lng: 32.5220, 
    business_latitude: '', business_longitude: '',
    created_at: '2024-01-20', gps_history: [
      { timestamp: '2024-01-20T14:30:00Z', user: 'admin@kilimomf.co.ug', type: 'home', latitude: '0.3780', longitude: '32.5220', action: 'Initial Home GPS Capture' }
    ], guarantors: [],
    assigned_staff_id: 's001'
  },
  { 
    id: 'c005', first_name: 'Sarah', last_name: 'Nakimbugwe', national_id: 'CM44556677', 
    phone: '+256705555555', phone_primary: '+256705555555', gender: 'female', dob: '1988-06-18', 
    village: 'Gulu Town', sub_county: 'Laroo', district: 'Gulu', branch_name: 'Gulu Branch', 
    status: 'approved', credit_score: 750, credit_grade: 'B', loan_count: 1, active_loan_balance: 0, 
    home_latitude: '2.7750', home_longitude: '32.2990', lat: 2.7750, lng: 32.2990, 
    business_latitude: '2.7810', business_longitude: '32.3030',
    created_at: '2023-08-10', gps_history: [
      { timestamp: '2023-08-10T10:00:00Z', user: 'officer@kilimomf.co.ug', type: 'home', latitude: '2.7750', longitude: '32.2990', action: 'Initial Home GPS Capture' }
    ], guarantors: [],
    assigned_staff_id: 's002'
  },
  { 
    id: 'c006', first_name: 'John Bosco', last_name: 'Ocen', national_id: 'CM99887766', 
    phone: '+256706666666', phone_primary: '+256706666666', gender: 'male', dob: '1992-12-05', 
    village: 'Pece', sub_county: 'Pece', district: 'Gulu', branch_name: 'Gulu Branch', 
    status: 'approved', credit_score: 680, credit_grade: 'C', loan_count: 0, active_loan_balance: 0, 
    home_latitude: '2.7680', home_longitude: '32.3120', lat: 2.7680, lng: 32.3120, 
    business_latitude: '', business_longitude: '',
    created_at: '2024-02-15', gps_history: [
      { timestamp: '2024-02-15T15:00:00Z', user: 'officer@kilimomf.co.ug', type: 'home', latitude: '2.7680', longitude: '32.3120', action: 'Initial Home GPS Capture' }
    ], guarantors: [],
    assigned_staff_id: 's002'
  },
  { 
    id: 'c007', first_name: 'Charles', last_name: 'Okello', national_id: 'CM44332211', 
    phone: '+256707777777', phone_primary: '+256707777777', gender: 'male', dob: '1987-10-15', 
    village: 'Gulu Town', sub_county: 'Layibi', district: 'Gulu', branch_name: 'Gulu Branch', 
    status: 'approved', credit_score: 720, credit_grade: 'B', loan_count: 0, active_loan_balance: 0, 
    home_latitude: '2.7710', home_longitude: '32.3015', lat: 2.7710, lng: 32.3015, 
    business_latitude: '', business_longitude: '',
    created_at: '2024-03-20', gps_history: [
      { timestamp: '2024-03-20T10:00:00Z', user: 'officer@kilimomf.co.ug', type: 'home', latitude: '2.7710', longitude: '32.3015', action: 'Initial Home GPS Capture' }
    ], guarantors: [],
    assigned_staff_id: 's002'
  }
];

export const DEMO_LOANS = [
  { 
    id: 'l001', client_name: 'Mary Nakato', client_phone: '+256701111111', client_id: 'c001', loan_number: 'LN-2026-001', 
    principal_amount: 2000000, interest_rate: 20, interest_amount: 400000, total_repayable: 2400000,
    term_months: 6, status: 'active', 
    outstanding_balance: 1800000, total_paid: 600000, arrears_amount: 0, arrears_days: 0, advance_amount: 150000, 
    branch_name: 'Head Office', officer_name: 'John Mukasa', disbursed_at: '2026-02-15', 
    last_payment_date: '2026-05-10', consecutive_missed: 0, loan_type: 'monthly',
    expected_closure_date: '2026-08-15', created_at: '2026-02-10', is_manual_default: false,
    guarantor_name: 'Peter Tusiime', guarantor_phone: '+256752000111', staff_owner: 'John Mukasa (Senior LO)',
    staff_id: 's001'
  },
  { 
    id: 'l002', client_name: 'James Okello', client_phone: '+256702222222', client_id: 'c002', loan_number: 'LN-2026-002', 
    principal_amount: 1500000, interest_rate: 20, interest_amount: 300000, total_repayable: 1800000,
    term_months: 6, status: 'active', 
    outstanding_balance: 1200000, total_paid: 600000, arrears_amount: 150000, arrears_days: 35, advance_amount: 0, 
    branch_name: 'Gulu Branch', officer_name: 'Agnes Akello', disbursed_at: '2026-01-10', 
    last_payment_date: '2026-04-10', consecutive_missed: 3, loan_type: 'monthly',
    expected_closure_date: '2026-07-10', created_at: '2026-01-05',
    guarantor_name: 'David Kato', guarantor_phone: '+256703999888', staff_owner: 'Agnes Akello (Loan Officer)',
    staff_id: 's002'
  },
  { 
    id: 'l003', client_name: 'Grace Tusiime', client_phone: '+256703333333', client_id: 'c003', loan_number: 'LN-2024-003', 
    principal_amount: 800000, interest_rate: 15, interest_amount: 120000, total_repayable: 920000,
    term_months: 3, status: 'active', 
    outstanding_balance: 440000, total_paid: 480000, arrears_amount: 0, arrears_days: 0, advance_amount: 0, 
    branch_name: 'Mbarara Branch', officer_name: 'Peter Tusiime', disbursed_at: '2023-01-01', 
    last_payment_date: '2023-03-01', consecutive_missed: 16, loan_type: 'monthly',
    expected_closure_date: '2023-04-01', created_at: '2022-12-25',
    guarantor_name: 'Sarah Nambi', guarantor_phone: '+256701234567', staff_owner: 'Peter Tusiime (Branch Lead)',
    staff_id: 's003'
  },
  { 
    id: 'l004', client_name: 'Dormant Monthly', client_phone: '+256704444444', client_id: 'c004', loan_number: 'LN-2023-999', 
    principal_amount: 1000000, interest_rate: 20, interest_amount: 200000, total_repayable: 1200000,
    term_months: 6, status: 'dormant', 
    outstanding_balance: 700000, total_paid: 500000, arrears_amount: 500000, arrears_days: 365, advance_amount: 0, 
    branch_name: 'Head Office', officer_name: 'John Mukasa', disbursed_at: '2022-01-01', 
    last_payment_date: '2022-06-01', consecutive_missed: 24, loan_type: 'monthly',
    expected_closure_date: '2022-07-01', created_at: '2021-12-28',
    guarantor_name: 'Unverified Guarantor', guarantor_phone: '—', staff_owner: 'John Mukasa (Senior LO)',
    staff_id: 's001'
  },
  { 
    id: 'l005', client_name: 'Sarah Nakimbugwe', client_phone: '+256705555555', client_id: 'c005', loan_number: 'LN-2025-005', 
    principal_amount: 1000000, interest_rate: 20, interest_amount: 200000, total_repayable: 1200000,
    term_months: 6, status: 'closed', 
    outstanding_balance: 0, total_paid: 1200000, arrears_amount: 0, arrears_days: 0, advance_amount: 0, 
    branch_name: 'Gulu Branch', officer_name: 'Agnes Akello', disbursed_at: '2025-01-10', 
    last_payment_date: '2025-07-10', consecutive_missed: 0, loan_type: 'monthly',
    expected_closure_date: '2025-07-10', created_at: '2025-01-05',
    guarantor_name: 'James Okello', guarantor_phone: '+256702222222', staff_owner: 'Agnes Akello (Loan Officer)',
    staff_id: 's002'
  },
  {
    id: 'l006', client_name: 'John Bosco Ocen', client_phone: '+256706666666', client_id: 'c006', loan_number: 'LN-2026-006',
    principal_amount: 500000, interest_rate: 20, interest_amount: 100000, total_repayable: 600000,
    term_months: 1, status: 'active',
    outstanding_balance: 550000, total_paid: 50000, arrears_amount: 0, arrears_days: 0, advance_amount: 0,
    branch_name: 'Gulu Branch', officer_name: 'Agnes Akello', disbursed_at: '2026-05-20',
    last_payment_date: '2026-05-20', consecutive_missed: 0, loan_type: 'daily',
    expected_closure_date: '2026-06-20', created_at: '2026-05-20',
    guarantor_name: 'Sarah Nakimbugwe', guarantor_phone: '+256705555555', staff_owner: 'Agnes Akello (Loan Officer)',
    staff_id: 's002'
  }
];

export const DEMO_REPAYMENTS = [
  { id: 'r001', loan_number: 'LN-2026-001', client_name: 'Mary Nakato', amount: 200000, payment_method: 'mobile_money', reference: 'MM240115001', collected_by: 'John Mukasa', created_at: '2024-02-15' },
  { id: 'r002', loan_number: 'LN-2026-001', client_name: 'Mary Nakato', amount: 200000, payment_method: 'cash', reference: 'CSH240315001', collected_by: 'Sarah Nambi', created_at: '2024-03-15' },
  { id: 'r003', loan_number: 'LN-2026-002', client_name: 'James Okello', amount: 300000, payment_method: 'bank', reference: 'BNK240201001', collected_by: 'Agnes Akello', created_at: '2024-03-01' },
  { id: 'r004', loan_number: 'LN-2024-003', client_name: 'Grace Tusiime', amount: 160000, payment_method: 'mobile_money', reference: 'MM240401001', collected_by: 'Peter Tusiime', created_at: '2024-04-01' },
];

export const DEMO_EXPENSES = [
  { id: 'e001', category: 'office_supplies', description: 'Printer cartridges and paper', amount: 150000, branch_name: 'Head Office', staff_name: 'Sarah Nambi', submitted_by: 'Sarah Nambi', status: 'approved', created_at: '2024-04-01' },
  { id: 'e002', category: 'transport', description: 'Field collection fuel reimbursement', amount: 80000, branch_name: 'Gulu Branch', staff_name: 'Agnes Akello', submitted_by: 'Agnes Akello', status: 'pending', created_at: '2024-04-10' },
  { id: 'e003', category: 'utilities', description: 'March electricity bill', amount: 120000, branch_name: 'Mbarara Branch', staff_name: 'Peter Tusiime', submitted_by: 'Peter Tusiime', status: 'approved', created_at: '2024-04-05' },
  { id: 'e004', category: 'salaries', description: 'Casual staff wages', amount: 500000, branch_name: 'Head Office', staff_name: 'John Mukasa', submitted_by: 'John Mukasa', status: 'approved', created_at: '2024-04-02' },
];

export const DEMO_LEGAL = [
  { id: 'leg001', loan_number: 'LN-2026-002', client_name: 'James Okello', case_number: 'SMOS-LEGAL-001', case_type: 'demand_notice', status: 'open', outstanding_balance: 900000, arrears_days: 35, assigned_to: 'Agnes Akello', description: 'Client has missed 3 consecutive payments. Demand notice issued.', created_at: '2024-04-15' },
];

export const DEMO_DASHBOARD = {
  // Portfolio summary
  portfolio: {
    total_disbursed: 91000000,
    outstanding_portfolio: 29800000,
    total_collected: 61200000,
    total_arrears: 1750000,
    total_loans: 456,
    active_loans: 253,
  },
  npl_ratio: 4.2,
  // Loan status pie
  by_status: [
    { status: 'Active', count: 253 },
    { status: 'In Arrears', count: 89 },
    { status: 'Closed', count: 421 },
    { status: 'Written Off', count: 12 },
  ],
  // Monthly bar chart
  monthly_disbursements: [
    { month: 'Nov', amount: 7200000 },
    { month: 'Dec', amount: 8100000 },
    { month: 'Jan', amount: 9200000 },
    { month: 'Feb', amount: 7800000 },
    { month: 'Mar', amount: 8900000 },
    { month: 'Apr', amount: 8500000 },
  ],
  // Arrears aging
  arrears_breakdown: {
    days_1_7: 18, amount_1_7: 420000,
    days_8_30: 34, amount_8_30: 780000,
    days_31_90: 27, amount_31_90: 420000,
    days_over_90: 10, amount_over_90: 130000,
  },
  // Branch table
  branch_performance: [
    { id: 'branch-001', name: 'Head Office',    portfolio: 45000000, collected: 31000000, arrears: 800000,  active_loans: 120 },
    { id: 'branch-002', name: 'Gulu Branch',    portfolio: 28000000, collected: 19500000, arrears: 620000,  active_loans: 78 },
    { id: 'branch-003', name: 'Mbarara Branch', portfolio: 18000000, collected: 10700000, arrears: 330000,  active_loans: 55 },
  ],
};

export const DEMO_TRANSACTIONS = [
  { id: 'tx-001', type: 'repayment', category: 'cash_in', amount: 200000, client_name: 'Mary Nakato', reference: 'LN-2026-001', staff_name: 'Sarah Nambi', status: 'valid', date: new Date().toISOString().split('T')[0], timestamp: new Date().toISOString() },
  { id: 'tx-002', type: 'expense', category: 'cash_out', amount: 50000, client_name: '—', reference: 'Transport', staff_name: 'Sarah Nambi', status: 'valid', date: new Date().toISOString().split('T')[0], timestamp: new Date().toISOString() },
  { id: 'tx-003', type: 'repayment', category: 'cash_in', amount: 150000, client_name: 'James Okello', reference: 'LN-2026-002', staff_name: 'John Mukasa', status: 'reversed', date: new Date().toISOString().split('T')[0], timestamp: new Date().toISOString() },
  { id: 'tx-004', type: 'repayment', category: 'cash_in', amount: 100000, client_name: 'James Okello', reference: 'LN-2026-002', staff_name: 'Agnes Akello', status: 'valid', date: new Date().toISOString().split('T')[0], timestamp: new Date().toISOString() }
];

export const DEMO_DAILY_REPORTS = [
  // Tracks whether a day is locked
  { 
    date: '2024-01-01', 
    branch_id: 'branch-001', 
    status: 'locked', 
    opening_balance: 444100,
    processing_fees: 263000,
    loan_collections: 13724000,
    total_disbursed: 12300000,
    total_in: 13987000, 
    total_out: 664000, 
    banking: 916000,
    closing_balance: 551100,
    locked_by: 'Sarah Nambi' 
  }
];

export const DEMO_DOCUMENTS: any[] = [
  { id: 'doc-001', name: 'National ID - Mary Nakato', category: 'client', subcategory: 'national_id', entity_id: 'c001', entity_name: 'Mary Nakato', file_type: 'image/jpeg', file_size: 245000, file_data: '', uploaded_by: 'John Mukasa', uploaded_at: '2023-02-10T10:30:00Z', notes: 'Front and back of national ID' },
  { id: 'doc-002', name: 'Passport Photo - James Okello', category: 'client', subcategory: 'passport_photo', entity_id: 'c002', entity_name: 'James Okello', file_type: 'image/jpeg', file_size: 180000, file_data: '', uploaded_by: 'Agnes Akello', uploaded_at: '2023-04-05T14:20:00Z', notes: 'Recent passport photo' },
  { id: 'doc-003', name: 'Loan Application - Grace Tusiime', category: 'client', subcategory: 'loan_application', entity_id: 'c003', entity_name: 'Grace Tusiime', file_type: 'application/pdf', file_size: 520000, file_data: '', uploaded_by: 'Peter Tusiime', uploaded_at: '2023-07-15T09:00:00Z', notes: 'Signed loan application form' },
  { id: 'doc-004', name: 'Employment Contract - John Mukasa', category: 'staff', subcategory: 'employment_contract', entity_id: 's001', entity_name: 'John Mukasa', file_type: 'application/pdf', file_size: 890000, file_data: '', uploaded_by: 'Admin Demo', uploaded_at: '2023-01-05T08:00:00Z', notes: 'Full-time employment contract' },
  { id: 'doc-005', name: 'ID Copy - Agnes Akello', category: 'staff', subcategory: 'id_copy', entity_id: 's002', entity_name: 'Agnes Akello', file_type: 'image/png', file_size: 310000, file_data: '', uploaded_by: 'Admin Demo', uploaded_at: '2023-03-20T11:00:00Z', notes: 'National ID photocopy' },
  { id: 'doc-006', name: 'Business Trading Licence 2024', category: 'business', subcategory: 'trading_licence', entity_id: 'tenant-001', entity_name: 'Kilimo MF', file_type: 'application/pdf', file_size: 1200000, file_data: '', uploaded_by: 'Benjamin Owner', uploaded_at: '2024-01-15T10:00:00Z', notes: 'Annual trading licence from KCCA' },
  { id: 'doc-007', name: 'Money Lender Permit', category: 'business', subcategory: 'regulatory_permit', entity_id: 'tenant-001', entity_name: 'Kilimo MF', file_type: 'application/pdf', file_size: 750000, file_data: '', uploaded_by: 'Benjamin Owner', uploaded_at: '2024-02-01T09:30:00Z', notes: 'Uganda Microfinance Regulatory Authority permit' },
  { id: 'doc-008', name: 'Insurance Policy 2024', category: 'business', subcategory: 'insurance', entity_id: 'tenant-001', entity_name: 'Kilimo MF', file_type: 'application/pdf', file_size: 980000, file_data: '', uploaded_by: 'Benjamin Owner', uploaded_at: '2024-03-10T14:00:00Z', notes: 'Business comprehensive insurance policy' },
];

export const DEMO_TENANTS: any[] = [
  { id: 'tenant-001', name: 'Kilimo Microfinance', slug: 'kilimo-mf', email: 'admin@kilimo.co.ug', plan_name: 'Enterprise', base_billing: 500000, billing_amount: 750000, sub_status: 'active', user_count: 12, loan_count: 433, country: 'Uganda', created_at: '2024-01-15', addons: ['Dedicated DB Replica (+150k)', 'Premium SMS Integration (+100k)'], payment_status: 'paid', payment_link: 'https://pay.smos.io/kilimo-mf/invoice-2026-05' },
  { id: 't2', name: 'Bukoto SACCO', slug: 'bukoto-sacco', email: 'info@bukoto.ug', plan_name: 'Premium', base_billing: 300000, billing_amount: 300000, sub_status: 'active', user_count: 8, loan_count: 156, country: 'Uganda', created_at: '2024-02-10', addons: [], payment_status: 'unpaid', payment_link: 'https://pay.smos.io/bukoto-sacco/invoice-2026-05' },
  { id: 't3', name: 'Nairobi Credit', slug: 'nairobi-cr', email: 'billing@nairobi.ke', plan_name: 'Basic', base_billing: 150000, billing_amount: 150000, sub_status: 'locked', user_count: 4, loan_count: 89, country: 'Kenya', created_at: '2024-03-05', addons: [], payment_status: 'paid', payment_link: 'https://pay.smos.io/nairobi-cr/invoice-2026-05' }
];
