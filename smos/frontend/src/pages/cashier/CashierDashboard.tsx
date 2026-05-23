import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, Landmark, Banknote, FileWarning, ArrowLeftRight, CreditCard, 
  TrendingUp, Download, CheckCircle, Search, AlertCircle, Lock 
} from 'lucide-react';
import { useApp, fmt } from '../../store/AppContext';
import api from '../../services/api';
import ClientModal from '../clients/ClientModal';
import LoanModal from '../loans/LoanModal';
import RepaymentModal from '../loans/RepaymentModal';
import TransactionsLedger from './TransactionsLedger';
import ReportingCenter from './ReportingCenter';
import GenericTransactionModal from './GenericTransactionModal';

export default function CashierDashboard() {
  const { state } = useApp();
  const navigate = useNavigate();
  const curr = state.user?.currency || 'UGX';
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [loans, setLoans] = useState<any[]>([]);
  const [repayments, setRepayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal States
  const [showClientModal, setShowClientModal] = useState(false);
  const [showLoanModal, setShowLoanModal] = useState(false);
  const [showReporting, setShowReporting] = useState(false);
  const [showLedger, setShowLedger] = useState(false);
  const [activeLoanForPayment, setActiveLoanForPayment] = useState<any>(null);
  const [activeForm, setActiveForm] = useState<any>(null);
  const [dayLocked, setDayLocked] = useState(false);

  // Load Data
  const loadData = async () => {
    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const [lockRes, loansRes, repsRes]: any[] = await Promise.all([
        api.getDailyReportStatus(today),
        api.getLoans('status=active'),
        api.getRepayments(`date=${today}`),
      ]);
      setDayLocked(lockRes.data?.status === 'locked');
      setLoans(loansRes.data || []);
      setRepayments(repsRes.data || []);
    } catch (err) {
      console.error('Failed to load loans', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const filteredLoans = loans.filter(l => 
    l.client_name?.toLowerCase().includes(search.toLowerCase()) || 
    l.loan_number?.toLowerCase().includes(search.toLowerCase())
  );

  const handleRecordPayment = () => {
    const table = document.getElementById('active-loans-section');
    if (table) {
      table.scrollIntoView({ behavior: 'smooth' });
      setTimeout(() => searchInputRef.current?.focus(), 500);
    }
  };

  return (
    <div>
      {/* Header & Daily Metrics */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
          <h2 className="page-title">Cashier Hub</h2>
          {dayLocked && (
            <span className="badge badge-danger" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', fontSize: 13 }}>
              <Lock size={14} /> Today's Ledger is Locked
            </span>
          )}
        </div>

        {/* Live KPI Cards */}
        <div className="grid-4" style={{ gap: 16 }}>
          {/* Collected today */}
          <div className="card" style={{ borderTop: '4px solid var(--accent)', padding: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
              COLLECTED TODAY <CheckCircle size={14} color="var(--accent)" />
            </div>
            <div style={{ fontSize: 26, fontWeight: 800 }}>{loading ? '…' : repayments.length}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Amount: <strong>{fmt.currency(repayments.reduce((s,r) => s + Number(r.amount || 0), 0), curr)}</strong></div>
          </div>

          {/* Due today = unpaid active loans */}
          <div className="card" style={{ borderTop: '4px solid var(--orange)', padding: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
              DUE TODAY <AlertCircle size={14} color="var(--orange)" />
            </div>
            <div style={{ fontSize: 26, fontWeight: 800 }}>{loading ? '…' : loans.filter(l => Number(l.arrears_days || 0) >= 0).length}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Active borrowers in portfolio</div>
          </div>

          {/* Active loans (live) */}
          <div className="card" style={{ borderTop: '4px solid var(--blue)', padding: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
              ACTIVE LOANS <Banknote size={14} color="var(--blue)" />
            </div>
            <div style={{ fontSize: 26, fontWeight: 800 }}>{loading ? '…' : loans.length}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Portfolio: <strong>{fmt.currency(loans.reduce((s,l) => s + Number(l.outstanding_balance || 0), 0), curr)}</strong></div>
          </div>

          {/* In arrears */}
          <div className="card" style={{ borderTop: '4px solid #a855f7', padding: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
              IN ARREARS <TrendingUp size={14} color="#a855f7" />
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, color: '#a855f7' }}>{loading ? '…' : loans.filter(l => Number(l.arrears_days || 0) > 0).length}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Overdue: <strong style={{ color: 'var(--orange)' }}>{fmt.currency(loans.reduce((s,l) => s + Number(l.arrears_amount || 0), 0), curr)}</strong></div>
          </div>
        </div>

      {/* Operational Attention Section */}
      <div className="grid-2" style={{ gap: 24 }}>
        <div className="card" style={{ padding: 24, borderLeft: '4px solid var(--danger)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertCircle size={18} style={{ color: 'var(--danger)' }} /> Unpaid Installments Today
            </h3>
            <button className="btn btn-sm btn-secondary" onClick={() => setShowReporting(true)}>Download</button>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
            <span style={{ fontSize: 32, fontWeight: 800, color: 'var(--danger)' }}>{loading ? '…' : loans.filter(l => Number(l.arrears_days || 0) > 0).length}</span>
            <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>clients have not yet paid their dues today.</span>
          </div>
        </div>

        <div className="card" style={{ padding: 24, borderLeft: '4px solid var(--orange)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
              <TrendingUp size={18} style={{ color: 'var(--orange)' }} /> Portfolio Arrears
            </h3>
            <button className="btn btn-sm btn-secondary" onClick={() => setShowReporting(true)}>View Arrears</button>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
            <span style={{ fontSize: 32, fontWeight: 800, color: 'var(--orange)' }}>{loading ? '…' : loans.filter(l => Number(l.arrears_amount || 0) > 0).length}</span>
            <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>loans currently in various stages of arrears.</span>
          </div>
        </div>
      </div>

      {/* POS Action Grid */}
      <div className="card" style={{ padding: 24, background: 'linear-gradient(to right bottom, #ffffff, #f8fafc)' }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Quick Operations</h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
          {/* Core Flows */}
          <button className="btn" disabled={dayLocked} style={{ height: 60, justifyContent: 'flex-start', background: 'var(--accent)', color: 'white', border: 'none' }} onClick={handleRecordPayment}>
            <CreditCard size={18} /> Record Payment
          </button>
          <button className="btn" style={{ height: 60, justifyContent: 'flex-start', background: 'var(--green)', color: 'white', border: 'none' }} onClick={() => setShowLoanModal(true)}>
            <Banknote size={18} /> New Loan
          </button>
          <button className="btn" style={{ height: 60, justifyContent: 'flex-start', background: 'var(--blue)', color: 'white', border: 'none' }} onClick={() => setShowClientModal(true)}>
            <Users size={18} /> Add Client
          </button>
          
          {/* Cash Outflows */}
          <button className="btn btn-secondary" disabled={dayLocked} style={{ height: 60, justifyContent: 'flex-start' }} onClick={() => navigate('/expenses')}>
            <ArrowLeftRight size={18} className="text-orange" /> Add Expense
          </button>
          <button className="btn btn-secondary" disabled={dayLocked} style={{ height: 60, justifyContent: 'flex-start' }} onClick={() => setActiveForm('shortage')}>
            <FileWarning size={18} className="text-danger" /> Record Shortage
          </button>
          <button className="btn btn-secondary" disabled={dayLocked} style={{ height: 60, justifyContent: 'flex-start' }} onClick={() => setActiveForm('banking')}>
            <Landmark size={18} color="#a855f7" /> Bank Deposit
          </button>

          {/* Reporting & History */}
          <button className="btn btn-secondary" style={{ height: 60, justifyContent: 'flex-start' }} onClick={() => setShowLedger(true)}>
            <ArrowLeftRight size={18} color="var(--accent)" /> Transactions History
          </button>
          
          <button className="btn btn-secondary" disabled={dayLocked} style={{ height: 60, justifyContent: 'flex-start' }} onClick={() => setActiveForm('excess')}>
            <TrendingUp size={18} color="var(--green)" /> Record Excess
          </button>
          <button className="btn btn-secondary" disabled={dayLocked} style={{ height: 60, justifyContent: 'flex-start' }} onClick={() => setActiveForm('unknown_funds')}>
            <Search size={18} color="var(--blue)" /> Unknown Funds
          </button>
          <button className="btn btn-secondary" disabled={dayLocked} style={{ height: 60, justifyContent: 'flex-start' }} onClick={() => setActiveForm('loan_fine')}>
            <AlertCircle size={18} color="var(--orange)" /> Add Loan Fine
          </button>
          <button className="btn btn-secondary" disabled={dayLocked} style={{ height: 60, justifyContent: 'flex-start' }} onClick={() => setActiveForm('loan_return')}>
            <ArrowLeftRight size={18} color="var(--danger)" /> Return/Cancel Loan
          </button>

          <button className="btn btn-secondary" style={{ height: 60, justifyContent: 'flex-start' }} onClick={() => setShowReporting(true)}>
            <Download size={18} /> Generate Reports
          </button>
        </div>
      </div>

      {/* Warning for Pending Forms */}
      {['payment'].includes(activeForm || '') && (
        <div className="card" style={{ padding: 20, borderLeft: '4px solid var(--orange)', background: '#fffbeb' }}>
          <div className="flex items-center gap-2" style={{ color: '#b45309', fontWeight: 600 }}>
            <AlertCircle size={18} /> Action Pending Universal Ledger
          </div>
          <p style={{ marginTop: 8, fontSize: 13, color: '#92400e' }}>
            The <b>{activeForm?.toUpperCase()}</b> action will be fully functional once the universal `cashier_transactions` ledger is deployed. Please use the Active Loans table below for processing standard repayments.
          </p>
          <button className="btn btn-sm mt-4" style={{ background: '#b45309', color: 'white' }} onClick={() => setActiveForm(null)}>Close</button>
        </div>
      )}

      {/* Active Loans Data Table */}
      <div className="card" id="active-loans-section">
        <div className="flex justify-between items-center" style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
          <h3 style={{ fontSize: 16, fontWeight: 600 }}>Clients with Active Loans</h3>
          <div className="search-bar" style={{ width: 300 }}>
            <Search size={16} />
            <input 
              ref={searchInputRef}
              type="text" 
              placeholder="Search client or loan number..." 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
            />
          </div>
        </div>
        
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>No</th>
                <th>Name</th>
                <th>Phone</th>
                <th>Loan Number</th>
                <th>Amount Given</th>
                <th>Balance</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{ textAlign:'center', padding:40, color:'var(--text-muted)' }}>Loading active loans...</td></tr>
              ) : filteredLoans.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign:'center', padding:40, color:'var(--text-muted)' }}>No active loans found.</td></tr>
              ) : (
                filteredLoans.map((l, idx) => (
                  <tr key={l.id}>
                    <td>{idx + 1}</td>
                    <td className="font-bold">{l.client_name}</td>
                    <td>{l.client_phone || '—'}</td>
                    <td><span className="badge badge-draft">{l.loan_number}</span></td>
                    <td>{fmt.currency(l.principal_amount || l.principal, curr)}</td>
                    <td className="font-bold text-warning">{fmt.currency(l.outstanding_balance, curr)}</td>
                    <td style={{ textAlign: 'right' }}>
                      <button 
                        className="btn btn-sm" 
                        disabled={dayLocked}
                        style={{ background: dayLocked ? '#ccc' : 'var(--accent)', color: 'white', border: 'none', cursor: dayLocked ? 'not-allowed' : 'pointer' }}
                        onClick={() => !dayLocked && setActiveLoanForPayment(l)}
                      >
                        {dayLocked ? 'Locked' : 'Pay Loan'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      {showClientModal && <ClientModal onClose={() => setShowClientModal(false)} onSaved={() => { setShowClientModal(false); loadData(); }} />}
      {showLoanModal && <LoanModal onClose={() => setShowLoanModal(false)} onSaved={() => { setShowLoanModal(false); loadData(); }} />}
      {activeLoanForPayment && (
        <RepaymentModal 
          loan={activeLoanForPayment} 
          onClose={() => setActiveLoanForPayment(null)} 
          onSaved={() => { setActiveLoanForPayment(null); loadData(); }} 
        />
      )}
      {showLedger && <TransactionsLedger onClose={() => setShowLedger(false)} />}
      {showReporting && <ReportingCenter onClose={() => { setShowReporting(false); loadData(); }} />}
      {['banking', 'shortage', 'excess', 'unknown_funds', 'loan_fine', 'loan_return'].includes(activeForm || '') && (
        <GenericTransactionModal type={activeForm} onClose={() => setActiveForm(null)} />
      )}
    </div>
  );
}
