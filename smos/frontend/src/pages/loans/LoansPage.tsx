import { useEffect, useState, useCallback } from 'react';
import { Plus, Eye, Search, CheckCircle, XCircle, Send, Banknote, Filter, RotateCcw, Download, Trash2 } from 'lucide-react';
import api from '../../services/api';
import { useApp, fmt } from '../../store/AppContext';
import LoanModal from './LoanModal';
import RepaymentModal from './RepaymentModal';

const STATUS_BADGE: Record<string, string> = {
  draft:             'badge-draft',
  pending_approval:  'badge-warning',
  approved:          'badge-info',
  disbursed:         'badge-B',
  active:            'badge-active',
  at_risk:           'badge-at_risk',
  delinquent:        'badge-delinquent',
  defaulted:         'badge-defaulted',
  non_performing:    'badge-defaulted',
  written_off:       'badge-written_off',
  dormant:           'badge-draft',
  closed:            'badge-closed',
};

const ALL_STATUSES = [
  'draft','pending_approval','approved','active','at_risk','delinquent',
  'defaulted','non_performing','written_off','dormant','closed',
];

export default function LoansPage() {
  const { state } = useApp();
  const curr = state.user?.currency || 'UGX';
  const role = state.user?.role || 'admin';
  const canApprove  = ['admin','branch_manager','tenant_admin','super_admin','supervisor','cashier'].includes(role);
  const canDisburse = canApprove || role === 'cashier';
  const canPay      = canApprove || role === 'cashier';
  const isOfficer   = role === 'loan_officer';

  const [loans,   setLoans]   = useState<any[]>([]);
  const [officers, setOfficers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [officerFilter, setOfficerFilter] = useState('');
  const [showLoanModal, setShowLoanModal] = useState(false);
  const [showPayModal,  setShowPayModal]  = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [actionLoading, setActionLoading] = useState<string>('');
  const [toast, setToast] = useState('');

  // Advanced filters
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [filterGender, setFilterGender] = useState('');
  const [filterDistrict, setFilterDistrict] = useState('');
  const [filterBusinessType, setFilterBusinessType] = useState('');
  const [filterAgeRange, setFilterAgeRange] = useState('');

  useEffect(() => {
    api.getStaff().then((r: any) => setOfficers(r.data || [])).catch(console.error);
  }, []);

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (statusFilter)  params.set('status',  statusFilter);
    if (officerFilter) params.set('officer', officerFilter);
    if (search)        params.set('search',  search);
    if (filterGender)  params.set('gender',  filterGender);
    if (filterDistrict) params.set('district', filterDistrict);
    if (filterBusinessType) params.set('business_type', filterBusinessType);
    if (filterAgeRange) params.set('age_range', filterAgeRange);
    
    api.getLoans(params.toString())
      .then((r: any) => setLoans(r.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [statusFilter, officerFilter, search, filterGender, filterDistrict, filterBusinessType, filterAgeRange]);

  useEffect(() => { load(); }, [load]);

  const handleDeleteLoan = async (id: string, number: string) => {
    if (!confirm(`Are you sure you want to withdraw and delete loan application ${number}?`)) return;
    setActionLoading(id + '_delete');
    try {
      await api.deleteLoan(id);
      showToast(`✓ Loan application ${number} deleted`);
      load();
    } catch (e: any) {
      showToast('Error: ' + e.message);
    } finally { setActionLoading(''); }
  };

  const handleExportCSV = () => {
    const headers = 'Loan #,Client Name,Client Phone,Guarantor Name,Guarantor Phone,Agent,Principal,Balance,Arrears,Status,Frequency,Taken Date\n';
    const rows = loans.map(l => {
      const takenDate = l.disbursement_date || l.disbursed_at || '—';
      return `"${l.loan_number}","${l.client_name}","${l.client_phone || ''}","${l.guarantor_name || ''}","${l.guarantor_phone || ''}","${l.staff_owner || l.officer_name || ''}",${l.principal_amount || 0},${l.outstanding_balance || 0},${l.arrears_amount || 0},"${l.status}","${l.loan_type || l.repayment_frequency || 'monthly'}","${takenDate}"`;
    }).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Loans_Export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const showToast = (msg: string) => {
    setToast(msg); setTimeout(() => setToast(''), 3000);
  };

  // ── Loan Approval Workflow ────────────────────────────────────────────────
  const handleSubmitForApproval = async (loan: any) => {
    if (!confirm(`Submit loan ${loan.loan_number} for approval?`)) return;
    setActionLoading(loan.id + '_submit');
    try {
      // In demo mode, we update to pending_approval status
      await api.approveLoan(loan.id); // reuses approve flow; normally would be submit endpoint
      showToast(`✓ Loan ${loan.loan_number} submitted for approval`);
      load();
    } catch (e: any) {
      showToast('Error: ' + e.message);
    } finally { setActionLoading(''); }
  };

  const handleApproveLoan = async (loan: any) => {
    if (!confirm(`Approve loan ${loan.loan_number} for ${loan.client_name}?`)) return;
    setActionLoading(loan.id + '_approve');
    try {
      await api.approveLoan(loan.id);
      showToast(`✓ Loan ${loan.loan_number} approved`);
      load();
    } catch (e: any) {
      showToast('Error: ' + e.message);
    } finally { setActionLoading(''); }
  };

  const handleDisburseLoan = async (loan: any) => {
    if (!confirm(`Disburse UGX ${fmt.currency(loan.principal_amount, curr)} to ${loan.client_name}? This cannot be undone.`)) return;
    setActionLoading(loan.id + '_disburse');
    try {
      await api.disburseLoan(loan.id, { disbursed_at: new Date().toISOString() });
      showToast(`✓ Loan ${loan.loan_number} disbursed to ${loan.client_name}`);
      load();
    } catch (e: any) {
      showToast('Error: ' + e.message);
    } finally { setActionLoading(''); }
  };

  const isWithinMaturity = (loan: any) => {
    if (!loan.disbursed_at) return false;
    const maturity = new Date(loan.disbursed_at);
    maturity.setMonth(maturity.getMonth() + (loan.term_months || 6));
    return new Date() <= maturity;
  };

  // Counts for tab pills
  const pendingCount  = loans.filter(l => l.status === 'pending_approval' || l.status === 'draft').length;
  const approvedCount = loans.filter(l => l.status === 'approved').length;

  return (
    <div style={{ paddingBottom: 40 }}>
      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 24, right: 24, zIndex: 9999,
          background: '#22c55e', color: '#fff', padding: '12px 20px',
          borderRadius: 10, fontWeight: 700, fontSize: 13, boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
        }}>
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="page-header">
        <div>
          <h2 className="page-title">Loan Management</h2>
          <p className="page-subtitle">
            {loans.length} loans &nbsp;·&nbsp;
            {pendingCount > 0 && <span style={{ color: 'var(--orange)' }}>{pendingCount} pending approval&nbsp;·&nbsp;</span>}
            {approvedCount > 0 && <span style={{ color: 'var(--blue)' }}>{approvedCount} ready to disburse</span>}
          </p>
        </div>
        <div className="flex gap-2 items-center" style={{ flexWrap: 'wrap' }}>
          <div className="search-bar">
            <Search size={14} color="var(--text-muted)" />
            <input placeholder="Search loans…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          {!isOfficer && (
            <select className="form-control" style={{ width: 150 }} value={officerFilter} onChange={e => setOfficerFilter(e.target.value)}>
              <option value="">All Officers</option>
              {officers.map(o => (
                <option key={o.id} value={o.first_name + ' ' + o.last_name}>{o.first_name} {o.last_name}</option>
              ))}
            </select>
          )}
          <select className="form-control" style={{ width: 170 }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="">All Statuses / Filters</option>
            <optgroup label="Repayment Tracking">
              <option value="paid_today">Paid Today</option>
              <option value="did_not_pay_today">Did Not Pay Today</option>
              <option value="paid_in_advance">Paid in Advance</option>
            </optgroup>
            <optgroup label="Core Statuses">
              {ALL_STATUSES.map(s => (
                <option key={s} value={s}>{s === 'closed' ? 'Paid' : s.replace(/_/g, ' ')}</option>
              )) }
            </optgroup>
          </select>
          <button className="btn btn-secondary btn-sm" onClick={() => setShowAdvancedFilters(!showAdvancedFilters)} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Filter size={13} /> {showAdvancedFilters ? 'Hide Filters' : 'Filters'}
          </button>
          <button className="btn btn-secondary btn-sm" onClick={handleExportCSV} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Download size={13} /> Export CSV
          </button>
          <button className="btn btn-secondary btn-sm" onClick={load} title="Refresh">
            <RotateCcw size={13} />
          </button>
          <button className="btn btn-primary" onClick={() => { setSelected(null); setShowLoanModal(true); }}>
            <Plus size={14} /> New Loan
          </button>
        </div>
      </div>

      {showAdvancedFilters && (
        <div className="card" style={{ padding: 16, marginBottom: 16, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          <div className="form-group mb-0">
            <label className="form-label" style={{ fontSize: 11 }}>Client Gender</label>
            <select className="form-control" value={filterGender} onChange={e => setFilterGender(e.target.value)}>
              <option value="">All Genders</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div className="form-group mb-0">
            <label className="form-label" style={{ fontSize: 11 }}>District / Location</label>
            <select className="form-control" value={filterDistrict} onChange={e => setFilterDistrict(e.target.value)}>
              <option value="">All Locations</option>
              <option value="Kampala">Kampala</option>
              <option value="Gulu">Gulu</option>
              <option value="Mbarara">Mbarara</option>
              <option value="Jinja">Jinja</option>
            </select>
          </div>
          <div className="form-group mb-0">
            <label className="form-label" style={{ fontSize: 11 }}>Business Type</label>
            <select className="form-control" value={filterBusinessType} onChange={e => setFilterBusinessType(e.target.value)}>
              <option value="">All Businesses</option>
              <option value="Retail Trading">Retail Trading</option>
              <option value="Bodaboda Transport">Bodaboda Transport</option>
              <option value="Tailoring">Tailoring</option>
              <option value="Fish Mongering">Fish Mongering</option>
              <option value="Salon">Salon</option>
            </select>
          </div>
          <div className="form-group mb-0">
            <label className="form-label" style={{ fontSize: 11 }}>Age Range</label>
            <select className="form-control" value={filterAgeRange} onChange={e => setFilterAgeRange(e.target.value)}>
              <option value="">All Ages</option>
              <option value="under_25">Under 25</option>
              <option value="25_40">25 to 40</option>
              <option value="over_40">Over 40</option>
            </select>
          </div>
        </div>
      )}

      {/* Approval Workflow Banner (pending approval exists) */}
      {canApprove && pendingCount > 0 && (
        <div className="alert alert-warning" style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
          <Send size={16} />
          <span><strong>{pendingCount} loan{pendingCount > 1 ? 's' : ''}</strong> pending your approval. Review and approve below.</span>
        </div>
      )}
      {canDisburse && approvedCount > 0 && (
        <div className="alert alert-info" style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
          <Banknote size={16} />
          <span><strong>{approvedCount} loan{approvedCount > 1 ? 's' : ''}</strong> approved and ready for disbursement.</span>
        </div>
      )}

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Loan #</th>
                <th>Client</th>
                <th>Taken Date</th>
                <th>Guarantor</th>
                <th>Account Owner</th>
                <th>Principal</th>
                <th>Balance</th>
                <th>Arrears</th>
                <th>Status</th>
                <th>Frequency</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={11} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Loading loans…</td></tr>
              ) : loans.length === 0 ? (
                <tr><td colSpan={11} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No loans found.</td></tr>
              ) : loans.map(l => (
                <tr key={l.id} style={{ borderLeft: (l.status === 'pending_approval' || l.status === 'draft') ? '3px solid var(--orange)' : l.status === 'approved' ? '3px solid var(--blue)' : '3px solid transparent' }}>
                  <td className="font-mono" style={{ fontSize: 11 }}>{l.loan_number}</td>
                  <td>
                    <div className="font-bold">{l.client_name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{l.client_phone}</div>
                  </td>
                  <td>
                    {l.disbursement_date || l.disbursed_at ? fmt.date(l.disbursement_date || l.disbursed_at) : '—'}
                  </td>
                  <td>
                    <div className="font-bold">{l.guarantor_name || '—'}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{l.guarantor_phone || ''}</div>
                  </td>
                  <td>
                    <div className="font-bold" style={{ color: 'var(--accent)' }}>{l.staff_owner || l.officer_name || l.staff_name || '—'}</div>
                  </td>
                  <td>{fmt.currency(l.principal_amount, curr)}</td>
                  <td className={l.outstanding_balance > 0 ? 'text-warning' : 'text-success'}>
                    {fmt.currency(l.outstanding_balance, curr)}
                  </td>
                  <td>
                    {isWithinMaturity(l) && l.arrears_amount > 0 ? (
                      <div className="text-danger font-bold">
                        {fmt.currency(l.arrears_amount, curr)}
                        <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 'normal', marginTop: 2 }}>
                          {l.arrears_days}d · {l.consecutive_missed || 0} missed
                        </div>
                      </div>
                    ) : <span className="text-success">—</span>}
                  </td>
                  <td><span className={`badge ${STATUS_BADGE[l.status] || 'badge-draft'}`}>{l.status === 'closed' ? 'Paid' : l.status?.replace(/_/g, ' ')}</span></td>
                  <td><span className="badge badge-draft">{l.loan_type || l.repayment_frequency || 'monthly'}</span></td>
                  <td>
                    <div className="flex gap-1" style={{ flexWrap: 'wrap' }}>
                      {/* View */}
                      <button className="btn btn-secondary btn-sm" onClick={() => { setSelected(l); setShowLoanModal(true); }} title="View Details">
                        <Eye size={11} />
                      </button>

                      {/* Loan Officer: Submit draft for approval */}
                      {isOfficer && l.status === 'draft' && (
                        <button
                          className="btn btn-sm"
                          style={{ background: 'var(--orange)', color: '#fff', border: 'none', fontSize: 10 }}
                          disabled={actionLoading === l.id + '_submit'}
                          onClick={() => handleSubmitForApproval(l)}
                        >
                          <Send size={10} /> {actionLoading === l.id + '_submit' ? '…' : 'Submit'}
                        </button>
                      )}

                      {/* Manager: Approve pending */}
                      {canApprove && (l.status === 'pending_approval' || l.status === 'draft') && (
                        <button
                          className="btn btn-sm"
                          style={{ background: 'var(--green)', color: '#fff', border: 'none', fontSize: 10 }}
                          disabled={actionLoading === l.id + '_approve'}
                          onClick={() => handleApproveLoan(l)}
                          title="Approve loan"
                        >
                          <CheckCircle size={10} /> {actionLoading === l.id + '_approve' ? '…' : 'Approve'}
                        </button>
                      )}

                      {/* Manager/Cashier: Disburse approved */}
                      {canDisburse && l.status === 'approved' && (
                        <button
                          className="btn btn-sm"
                          style={{ background: 'var(--blue)', color: '#fff', border: 'none', fontSize: 10 }}
                          disabled={actionLoading === l.id + '_disburse'}
                          onClick={() => handleDisburseLoan(l)}
                          title="Disburse funds"
                        >
                          <Banknote size={10} /> {actionLoading === l.id + '_disburse' ? '…' : 'Disburse'}
                        </button>
                      )}

                      {/* Pay (active loans) */}
                      {canPay && ['active', 'at_risk', 'delinquent'].includes(l.status) && (
                        <button className="btn btn-success btn-sm" onClick={() => { setSelected(l); setShowPayModal(true); }}>
                          Pay
                        </button>
                      )}

                      {/* Delete / Withdraw for draft/pending */}
                      {['draft', 'pending_approval'].includes(l.status) && (
                        <button
                          className="btn btn-danger btn-sm"
                          style={{ padding: '4px 6px', display: 'flex', alignItems: 'center' }}
                          disabled={actionLoading === l.id + '_delete'}
                          onClick={() => handleDeleteLoan(l.id, l.loan_number)}
                          title="Delete / Withdraw"
                        >
                          <Trash2 size={11} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ borderTop: '2px solid var(--border)', fontWeight: 'bold', background: 'var(--bg-secondary)' }}>
                <td colSpan={5} style={{ padding: '12px 20px', textAlign: 'left' }}>TOTALS</td>
                <td style={{ padding: '12px 20px' }}>{fmt.currency(loans.reduce((sum, l) => sum + Number(l.principal_amount || 0), 0), curr)}</td>
                <td style={{ padding: '12px 20px', color: 'var(--orange)' }}>{fmt.currency(loans.reduce((sum, l) => sum + Number(l.outstanding_balance || 0), 0), curr)}</td>
                <td style={{ padding: '12px 20px', color: 'var(--red)' }}>{fmt.currency(loans.reduce((sum, l) => sum + Number(l.arrears_amount || 0), 0), curr)}</td>
                <td colSpan={3}></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {showLoanModal && (
        <LoanModal loan={selected} onClose={() => setShowLoanModal(false)} onSaved={() => { setShowLoanModal(false); load(); }} />
      )}
      {showPayModal && selected && (
        <RepaymentModal loan={selected} onClose={() => setShowPayModal(false)} onSaved={() => { setShowPayModal(false); load(); }} />
      )}
    </div>
  );
}
