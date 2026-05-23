-- ============================================================
-- SMOS DEMO SEED DATA
-- ============================================================

-- Tenant
INSERT INTO tenants (id, name, slug, country, currency, address, phone, email)
VALUES (
  'aaaaaaaa-0000-0000-0000-000000000001',
  'Kilimo MicroFinance Uganda',
  'kilimo-mf',
  'Uganda', 'UGX',
  'Plot 45, Kampala Road, Kampala',
  '+256700000001',
  'admin@kilimomf.co.ug'
);

-- Branches
INSERT INTO branches (id, tenant_id, name, code, district, region, latitude, longitude, phone)
VALUES
  ('bbbbbbbb-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001',
   'Kampala Head Office', 'KMP-HQ', 'Kampala', 'Central', 0.3476, 32.5825, '+256700000002'),
  ('bbbbbbbb-0000-0000-0000-000000000002', 'aaaaaaaa-0000-0000-0000-000000000001',
   'Jinja Branch', 'JNJ-01', 'Jinja', 'Eastern', 0.4244, 33.2041, '+256700000003'),
  ('bbbbbbbb-0000-0000-0000-000000000003', 'aaaaaaaa-0000-0000-0000-000000000001',
   'Mbarara Branch', 'MBR-01', 'Mbarara', 'Western', -0.6072, 30.6545, '+256700000004');

-- Super Admin
INSERT INTO users (
  id, tenant_id, branch_id, role,
  first_name, last_name, email, phone_primary,
  password_hash,
  village_name, village_latitude, village_longitude,
  urban_address, urban_latitude, urban_longitude,
  employment_date
) VALUES (
  'cccccccc-0000-0000-0000-000000000001',
  'aaaaaaaa-0000-0000-0000-000000000001',
  'bbbbbbbb-0000-0000-0000-000000000001',
  'super_admin',
  'System', 'Administrator',
  'admin@kilimomf.co.ug',
  '+256700000001',
  '$2b$10$YqFakeHashForDemoOnly.adminpass',
  'Kampala Central', 0.3476, 32.5825,
  'Kampala Road, Kampala', 0.3476, 32.5825,
  '2024-01-01'
);

-- Branch Manager - Kampala
INSERT INTO users (
  id, tenant_id, branch_id, role,
  first_name, last_name, national_id, gender,
  email, phone_primary,
  password_hash,
  village_name, village_latitude, village_longitude, village_district,
  urban_address, urban_latitude, urban_longitude, urban_district,
  employment_date, lc1_name, lc1_phone
) VALUES (
  'cccccccc-0000-0000-0000-000000000002',
  'aaaaaaaa-0000-0000-0000-000000000001',
  'bbbbbbbb-0000-0000-0000-000000000001',
  'branch_manager',
  'Grace', 'Namukasa', 'CM90123456', 'female',
  'grace.namukasa@kilimomf.co.ug', '+256701234567',
  '$2b$10$YqFakeHashForDemoOnly.manager1',
  'Mukono Village', 0.3530, 32.7552, 'Mukono',
  'Ntinda, Kampala', 0.3476, 32.6258, 'Kampala',
  '2024-01-15',
  'Mr. Ssemakula John', '+256772345678'
);

-- Loan Officers
INSERT INTO users (
  id, tenant_id, branch_id, role,
  first_name, last_name, national_id, gender,
  email, phone_primary,
  password_hash,
  village_name, village_latitude, village_longitude, village_district,
  urban_address, urban_latitude, urban_longitude, urban_district,
  employment_date, recommender_name, recommender_phone
) VALUES
  (
    'cccccccc-0000-0000-0000-000000000003',
    'aaaaaaaa-0000-0000-0000-000000000001',
    'bbbbbbbb-0000-0000-0000-000000000001',
    'loan_officer',
    'David', 'Ochieng', 'CM82345678', 'male',
    'david.ochieng@kilimomf.co.ug', '+256702345678',
    '$2b$10$YqFakeHashForDemoOnly.officer1',
    'Lira Town', 2.2499, 32.8998, 'Lira',
    'Naalya, Kampala', 0.3555, 32.6444, 'Kampala',
    '2024-02-01',
    'Grace Namukasa', '+256701234567'
  ),
  (
    'cccccccc-0000-0000-0000-000000000004',
    'aaaaaaaa-0000-0000-0000-000000000001',
    'bbbbbbbb-0000-0000-0000-000000000001',
    'cashier',
    'Sarah', 'Nabirye', 'CM75678901', 'female',
    'sarah.nabirye@kilimomf.co.ug', '+256703456789',
    '$2b$10$YqFakeHashForDemoOnly.officer2',
    'Mbale Town', 1.0669, 34.1750, 'Mbale',
    'Kisaasi, Kampala', 0.3600, 32.6300, 'Kampala',
    '2024-02-15',
    'Grace Namukasa', '+256701234567'
  ),
  (
    'cccccccc-0000-0000-0000-000000000005',
    'aaaaaaaa-0000-0000-0000-000000000001',
    'bbbbbbbb-0000-0000-0000-000000000002',
    'loan_officer',
    'Robert', 'Waiswa', 'CM68901234', 'male',
    'robert.waiswa@kilimomf.co.ug', '+256704567890',
    '$2b$10$YqFakeHashForDemoOnly.officer3',
    'Jinja Town', 0.4244, 33.2041, 'Jinja',
    'Main Street, Jinja', 0.4244, 33.2041, 'Jinja',
    '2024-03-01',
    'System Administrator', '+256700000001'
  );

-- Update branch managers
UPDATE branches SET manager_id = 'cccccccc-0000-0000-0000-000000000002'
  WHERE id = 'bbbbbbbb-0000-0000-0000-000000000001';

-- User Guarantors (for loan officers)
INSERT INTO user_guarantors (user_id, full_name, national_id, phone, relationship, address, latitude, longitude)
VALUES
  ('cccccccc-0000-0000-0000-000000000003', 'Peter Odhiambo', 'CM11111111', '+256711111111', 'Brother', 'Lira', 2.2499, 32.8998),
  ('cccccccc-0000-0000-0000-000000000003', 'Mary Akello', 'CM22222222', '+256722222222', 'Aunt', 'Gulu', 2.7748, 32.2990),
  ('cccccccc-0000-0000-0000-000000000004', 'James Mukasa', 'CM33333333', '+256733333333', 'Husband', 'Mbale', 1.0669, 34.1750),
  ('cccccccc-0000-0000-0000-000000000004', 'Rose Nansubuga', 'CM44444444', '+256744444444', 'Sister', 'Kampala', 0.3476, 32.5825);

-- CLIENTS
INSERT INTO clients (
  id, tenant_id, branch_id, assigned_staff_id, registered_by_id,
  first_name, last_name, national_id, gender, date_of_birth,
  phone_primary, business_type, business_name, monthly_income_estimate,
  home_latitude, home_longitude, home_address, home_district,
  business_latitude, business_longitude, business_address, business_district,
  gps_captured, photo_verified, supervisor_approved, supervisor_approved_by
) VALUES
  (
    'dddddddd-0000-0000-0000-000000000001',
    'aaaaaaaa-0000-0000-0000-000000000001',
    'bbbbbbbb-0000-0000-0000-000000000001',
    'cccccccc-0000-0000-0000-000000000003',
    'cccccccc-0000-0000-0000-000000000003',
    'Fatuma', 'Nakigozi', 'CM55555555', 'female', '1988-03-12',
    '+256755555555', 'Retail Trading', 'Fatuma General Store', 1500000,
    0.3200, 32.5700, 'Kisenyi, Kampala', 'Kampala',
    0.3250, 32.5750, 'Owino Market, Kampala', 'Kampala',
    TRUE, TRUE, TRUE, 'cccccccc-0000-0000-0000-000000000002'
  ),
  (
    'dddddddd-0000-0000-0000-000000000002',
    'aaaaaaaa-0000-0000-0000-000000000001',
    'bbbbbbbb-0000-0000-0000-000000000001',
    'cccccccc-0000-0000-0000-000000000003',
    'cccccccc-0000-0000-0000-000000000003',
    'John', 'Ssekabira', 'CM66666666', 'male', '1985-07-22',
    '+256766666666', 'Bodaboda Transport', 'Sseka Riders', 900000,
    0.3300, 32.5800, 'Bwaise, Kampala', 'Kampala',
    0.3280, 32.5820, 'Kawempe Stage, Kampala', 'Kampala',
    TRUE, TRUE, TRUE, 'cccccccc-0000-0000-0000-000000000002'
  ),
  (
    'dddddddd-0000-0000-0000-000000000003',
    'aaaaaaaa-0000-0000-0000-000000000001',
    'bbbbbbbb-0000-0000-0000-000000000001',
    'cccccccc-0000-0000-0000-000000000004',
    'cccccccc-0000-0000-0000-000000000004',
    'Agnes', 'Nambozo', 'CM77777777', 'female', '1991-11-05',
    '+256777777777', 'Tailoring', 'Agnes Fashion House', 1200000,
    0.3150, 32.5650, 'Makerere, Kampala', 'Kampala',
    0.3180, 32.5680, 'Makerere Market, Kampala', 'Kampala',
    TRUE, TRUE, TRUE, 'cccccccc-0000-0000-0000-000000000002'
  ),
  (
    'dddddddd-0000-0000-0000-000000000004',
    'aaaaaaaa-0000-0000-0000-000000000001',
    'bbbbbbbb-0000-0000-0000-000000000002',
    'cccccccc-0000-0000-0000-000000000005',
    'cccccccc-0000-0000-0000-000000000005',
    'Michael', 'Oluoch', 'CM88888888', 'male', '1980-01-30',
    '+256788888888', 'Fish Mongering', 'Oluoch Fish Market', 2000000,
    0.4150, 33.2000, 'Jinja Town', 'Jinja',
    0.4200, 33.2050, 'Jinja Fish Market', 'Jinja',
    TRUE, TRUE, TRUE, 'cccccccc-0000-0000-0000-000000000002'
  ),
  (
    'dddddddd-0000-0000-0000-000000000005',
    'aaaaaaaa-0000-0000-0000-000000000001',
    'bbbbbbbb-0000-0000-0000-000000000001',
    'cccccccc-0000-0000-0000-000000000003',
    'cccccccc-0000-0000-0000-000000000003',
    'Christine', 'Apio', 'CM99999999', 'female', '1993-06-18',
    '+256799999999', 'Salon', 'Chris Beauty Parlour', 800000,
    0.3400, 32.5900, 'Ntinda, Kampala', 'Kampala',
    0.3420, 32.5920, 'Ntinda Shopping Centre', 'Kampala',
    TRUE, TRUE, TRUE, 'cccccccc-0000-0000-0000-000000000002'
  );

-- Next of Kin
INSERT INTO client_next_of_kin (client_id, full_name, relationship, phone, address)
VALUES
  ('dddddddd-0000-0000-0000-000000000001', 'Hassan Nakigozi', 'Husband', '+256755500001', 'Kisenyi, Kampala'),
  ('dddddddd-0000-0000-0000-000000000002', 'Mary Ssekabira', 'Wife', '+256766600002', 'Bwaise, Kampala'),
  ('dddddddd-0000-0000-0000-000000000003', 'Paul Nambozo', 'Husband', '+256777700003', 'Makerere, Kampala'),
  ('dddddddd-0000-0000-0000-000000000004', 'Grace Oluoch', 'Wife', '+256788800004', 'Jinja'),
  ('dddddddd-0000-0000-0000-000000000005', 'Tom Apio', 'Father', '+256799900005', 'Ntinda, Kampala');

-- LOANS
INSERT INTO loans (
  id, loan_number, tenant_id, branch_id, client_id, staff_id,
  approved_by, disbursed_by,
  principal_amount, interest_rate, interest_amount, total_repayable,
  repayment_frequency, duration_days, installment_count, installment_amount,
  application_date, approval_date, disbursement_date, expected_closure_date,
  status, total_paid, outstanding_balance, arrears_amount, arrears_days,
  gps_verified, photo_verified, supervisor_approved, loan_purpose
) VALUES
  (
    'eeeeeeee-0000-0000-0000-000000000001',
    'LN-2024-0001',
    'aaaaaaaa-0000-0000-0000-000000000001',
    'bbbbbbbb-0000-0000-0000-000000000001',
    'dddddddd-0000-0000-0000-000000000001',
    'cccccccc-0000-0000-0000-000000000003',
    'cccccccc-0000-0000-0000-000000000002',
    'cccccccc-0000-0000-0000-000000000002',
    1000000, 20.0, 200000, 1200000,
    'daily', 60, 60, 20000,
    '2024-03-01', '2024-03-02', '2024-03-03',
    (CURRENT_DATE - INTERVAL '10 days')::DATE,
    'active', 800000, 400000, 80000, 4,
    TRUE, TRUE, TRUE, 'Stock purchasing for general store'
  ),
  (
    'eeeeeeee-0000-0000-0000-000000000002',
    'LN-2024-0002',
    'aaaaaaaa-0000-0000-0000-000000000001',
    'bbbbbbbb-0000-0000-0000-000000000001',
    'dddddddd-0000-0000-0000-000000000002',
    'cccccccc-0000-0000-0000-000000000003',
    'cccccccc-0000-0000-0000-000000000002',
    'cccccccc-0000-0000-0000-000000000002',
    500000, 20.0, 100000, 600000,
    'weekly', 28, 4, 150000,
    '2024-03-05', '2024-03-06', '2024-03-07',
    (CURRENT_DATE - INTERVAL '5 days')::DATE,
    'at_risk', 300000, 300000, 150000, 14,
    TRUE, TRUE, TRUE, 'Bodaboda spare parts'
  ),
  (
    'eeeeeeee-0000-0000-0000-000000000003',
    'LN-2024-0003',
    'aaaaaaaa-0000-0000-0000-000000000001',
    'bbbbbbbb-0000-0000-0000-000000000001',
    'dddddddd-0000-0000-0000-000000000003',
    'cccccccc-0000-0000-0000-000000000004',
    'cccccccc-0000-0000-0000-000000000002',
    'cccccccc-0000-0000-0000-000000000002',
    800000, 20.0, 160000, 960000,
    'weekly', 28, 4, 240000,
    '2024-03-10', '2024-03-11', '2024-03-12',
    (CURRENT_DATE + INTERVAL '7 days')::DATE,
    'active', 480000, 480000, 0, 0,
    TRUE, TRUE, TRUE, 'Sewing machine purchase'
  ),
  (
    'eeeeeeee-0000-0000-0000-000000000004',
    'LN-2024-0004',
    'aaaaaaaa-0000-0000-0000-000000000001',
    'bbbbbbbb-0000-0000-0000-000000000002',
    'dddddddd-0000-0000-0000-000000000004',
    'cccccccc-0000-0000-0000-000000000005',
    'cccccccc-0000-0000-0000-000000000002',
    'cccccccc-0000-0000-0000-000000000002',
    2000000, 20.0, 400000, 2400000,
    'daily', 60, 60, 40000,
    '2024-02-01', '2024-02-02', '2024-02-03',
    (CURRENT_DATE - INTERVAL '30 days')::DATE,
    'defaulted', 400000, 2000000, 1600000, 30,
    TRUE, TRUE, TRUE, 'Fish stock capital'
  ),
  (
    'eeeeeeee-0000-0000-0000-000000000005',
    'LN-2024-0005',
    'aaaaaaaa-0000-0000-0000-000000000001',
    'bbbbbbbb-0000-0000-0000-000000000001',
    'dddddddd-0000-0000-0000-000000000005',
    'cccccccc-0000-0000-0000-000000000003',
    'cccccccc-0000-0000-0000-000000000002',
    'cccccccc-0000-0000-0000-000000000002',
    600000, 20.0, 120000, 720000,
    'daily', 30, 30, 24000,
    '2024-03-20', '2024-03-21', '2024-03-22',
    (CURRENT_DATE + INTERVAL '3 days')::DATE,
    'active', 600000, 120000, 0, 0,
    TRUE, TRUE, TRUE, 'Salon equipment'
  );

-- Loan Guarantors
INSERT INTO loan_guarantors (loan_id, full_name, national_id, phone, relationship, address, latitude, longitude)
VALUES
  ('eeeeeeee-0000-0000-0000-000000000001', 'Hassan Nakigozi', 'CM10001111', '+256755500001', 'Husband', 'Kisenyi', 0.3200, 32.5700),
  ('eeeeeeee-0000-0000-0000-000000000001', 'Amina Nakirya', 'CM10002222', '+256755500002', 'Sister', 'Kawempe', 0.3400, 32.5600),
  ('eeeeeeee-0000-0000-0000-000000000002', 'Mary Ssekabira', 'CM10003333', '+256766600002', 'Wife', 'Bwaise', 0.3300, 32.5800),
  ('eeeeeeee-0000-0000-0000-000000000004', 'Grace Oluoch', 'CM10004444', '+256788800004', 'Wife', 'Jinja', 0.4150, 33.2000);

-- Staff Expenses
INSERT INTO staff_expenses (staff_id, branch_id, tenant_id, category, amount, description, expense_date, is_approved, approved_by)
VALUES
  ('cccccccc-0000-0000-0000-000000000003', 'bbbbbbbb-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001',
   'transport', 20000, 'Field visits - Kisenyi area', CURRENT_DATE - 1, TRUE, 'cccccccc-0000-0000-0000-000000000002'),
  ('cccccccc-0000-0000-0000-000000000003', 'bbbbbbbb-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001',
   'airtime', 10000, 'Client follow-up calls', CURRENT_DATE - 2, TRUE, 'cccccccc-0000-0000-0000-000000000002'),
  ('cccccccc-0000-0000-0000-000000000004', 'bbbbbbbb-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001',
   'transport', 15000, 'Field visits - Makerere area', CURRENT_DATE - 1, TRUE, 'cccccccc-0000-0000-0000-000000000002'),
  ('cccccccc-0000-0000-0000-000000000005', 'bbbbbbbb-0000-0000-0000-000000000002', 'aaaaaaaa-0000-0000-0000-000000000001',
   'recovery', 50000, 'Recovery attempt - Oluoch Michael', CURRENT_DATE, FALSE, NULL);

-- Credit Scores
INSERT INTO credit_scores (client_id, tenant_id, score, grade, repayment_consistency_score, arrears_frequency_score, loan_history_score, repayment_speed_score, guarantor_strength_score, staff_portfolio_risk_score)
VALUES
  ('dddddddd-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 740, 'A', 85, 80, 75, 78, 82, 70),
  ('dddddddd-0000-0000-0000-000000000002', 'aaaaaaaa-0000-0000-0000-000000000001', 520, 'C', 55, 50, 60, 45, 70, 55),
  ('dddddddd-0000-0000-0000-000000000003', 'aaaaaaaa-0000-0000-0000-000000000001', 680, 'B', 75, 70, 70, 72, 65, 68),
  ('dddddddd-0000-0000-0000-000000000004', 'aaaaaaaa-0000-0000-0000-000000000001', 280, 'E', 25, 20, 35, 22, 40, 30),
  ('dddddddd-0000-0000-0000-000000000005', 'aaaaaaaa-0000-0000-0000-000000000001', 820, 'A', 90, 88, 82, 85, 80, 78);

-- Legal Case
INSERT INTO legal_cases (
  id, case_number, loan_id, client_id, staff_id, branch_id, tenant_id,
  status, filed_date, filed_by, total_outstanding, total_arrears, case_notes
) VALUES (
  'ffffffff-0000-0000-0000-000000000001',
  'LC-2024-0001',
  'eeeeeeee-0000-0000-0000-000000000004',
  'dddddddd-0000-0000-0000-000000000004',
  'cccccccc-0000-0000-0000-000000000005',
  'bbbbbbbb-0000-0000-0000-000000000002',
  'aaaaaaaa-0000-0000-0000-000000000001',
  'open',
  CURRENT_DATE - 25,
  'cccccccc-0000-0000-0000-000000000002',
  2000000, 1600000,
  'Client has not responded to repeated calls. Recovery team dispatched twice. Guarantor contacted.'
);

-- Repayment Schedules for Loan 1 (daily, 60 installments)
INSERT INTO repayment_schedules (loan_id, installment_number, due_date, principal_due, interest_due, total_due, total_paid, is_paid, paid_date)
SELECT
  'eeeeeeee-0000-0000-0000-000000000001',
  gs.n,
  ('2024-03-03'::DATE + ((gs.n - 1) || ' days')::INTERVAL)::DATE,
  16667,
  3333,
  20000,
  CASE WHEN gs.n <= 40 THEN 20000 ELSE 0 END,
  gs.n <= 40,
  CASE WHEN gs.n <= 40 THEN ('2024-03-03'::DATE + ((gs.n - 1) || ' days')::INTERVAL)::DATE ELSE NULL END
FROM generate_series(1, 60) AS gs(n);

-- Some repayments
INSERT INTO repayments (loan_id, collected_by, branch_id, amount_paid, payment_date, payment_method)
VALUES
  ('eeeeeeee-0000-0000-0000-000000000001', 'cccccccc-0000-0000-0000-000000000003', 'bbbbbbbb-0000-0000-0000-000000000001', 200000, CURRENT_DATE - 10, 'cash'),
  ('eeeeeeee-0000-0000-0000-000000000001', 'cccccccc-0000-0000-0000-000000000003', 'bbbbbbbb-0000-0000-0000-000000000001', 200000, CURRENT_DATE - 5, 'cash'),
  ('eeeeeeee-0000-0000-0000-000000000002', 'cccccccc-0000-0000-0000-000000000003', 'bbbbbbbb-0000-0000-0000-000000000001', 150000, CURRENT_DATE - 20, 'mobile_money'),
  ('eeeeeeee-0000-0000-0000-000000000002', 'cccccccc-0000-0000-0000-000000000003', 'bbbbbbbb-0000-0000-0000-000000000001', 150000, CURRENT_DATE - 12, 'cash'),
  ('eeeeeeee-0000-0000-0000-000000000003', 'cccccccc-0000-0000-0000-000000000004', 'bbbbbbbb-0000-0000-0000-000000000001', 240000, CURRENT_DATE - 7, 'cash'),
  ('eeeeeeee-0000-0000-0000-000000000003', 'cccccccc-0000-0000-0000-000000000004', 'bbbbbbbb-0000-0000-0000-000000000001', 240000, CURRENT_DATE - 0, 'cash'),
  ('eeeeeeee-0000-0000-0000-000000000005', 'cccccccc-0000-0000-0000-000000000003', 'bbbbbbbb-0000-0000-0000-000000000001', 600000, CURRENT_DATE - 2, 'mobile_money');
