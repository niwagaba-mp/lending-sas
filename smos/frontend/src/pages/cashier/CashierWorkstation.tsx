import { useState, useEffect, useRef } from 'react';
import { Navigate } from 'react-router-dom';
import { useApp, fmt } from '../../store/AppContext';
import api from '../../services/api';
import ClientModal from '../clients/ClientModal';
import LoanModal from '../loans/LoanModal';
import RepaymentModal from '../loans/RepaymentModal';
import GenericTransactionModal from './GenericTransactionModal';
import CashierReportModal from './CashierReportModal';
import CashierTransactionModal from './CashierTransactionModal';
import CashierClientManager from './CashierClientManager';

type ActiveModal =
  | 'payment' | 'new_loan' | 'new_client'
  | 'shortage' | 'excess' | 'unknown_funds' | 'loan_fine' | 'loan_return' | 'banking' | 'expense'
  | 'reports' | 'audit' | 'client_mgr' | null;

export default function CashierWorkstation() {
  const { state, logout } = useApp();

  if (state.loading) return null;
  if (!state.user) return <Navigate to="/login" replace />;
  if (state.user.role === 'loan_officer') {
    return <Navigate to="/notebook" replace />;
  }

  const curr = state.user?.currency || 'UGX';
  const today = new Date().toISOString().split('T')[0];

  const [loans, setLoans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<ActiveModal>(null);
  const [selectedLoan, setSelectedLoan] = useState<any>(null);
  const [dayLocked, setDayLocked] = useState(false);
  const [todayStats, setTodayStats] = useState({ collected: 0, pending: 0, disbursed: 0 });
  const searchRef = useRef<HTMLInputElement>(null);

  const [paidInfo, setPaidInfo] = useState<Record<string, { amount: number; ref: string }>>({});

  const load = async () => {
    setLoading(true);
    try {
      const [loansRes, lockRes, repaymentsRes] = await Promise.all([
        api.getLoans(),
        api.getDailyReportStatus(today),
        api.getRepayments(`date=${today}`)
      ]);

      const loanList = (loansRes.data || []).filter((l: any) =>
        !['draft', 'pending_approval', 'approved', 'closed', 'written_off'].includes(l.status)
      );
      const repaymentList = repaymentsRes.data || [];
      
      setLoans(loanList);
      setDayLocked(lockRes.data?.status === 'locked');

      const infoMap: Record<string, { amount: number; ref: string }> = {};
      repaymentList.forEach((r: any) => {
        infoMap[r.loan_number] = { amount: r.amount, ref: r.id };
      });
      setPaidInfo(infoMap);

      setTodayStats({
        collected: Object.keys(infoMap).length,
        pending: Math.max(0, loanList.length - Object.keys(infoMap).length),
        disbursed: 0,
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = loans.filter(l =>
    !search ||
    l.client_name?.toLowerCase().includes(search.toLowerCase()) ||
    l.loan_number?.toLowerCase().includes(search.toLowerCase()) ||
    l.client_phone?.includes(search)
  );

  const openPayment = (loan: any) => {
    const todayPay = paidInfo[loan.loan_number];
    if (todayPay) {
      const confirmDouble = window.confirm(
        `⚠️ WARNING: A payment of ${fmt.currency(todayPay.amount, curr)} (Ref: ${todayPay.ref}) has already been recorded for this loan (${loan.loan_number}) today.\n\nAre you sure you want to record another payment?`
      );
      if (!confirmDouble) return;
    }
    setSelectedLoan(loan);
    setModal('payment');
  };

  const closeModal = () => { setModal(null); setSelectedLoan(null); };
  const closeAndRefresh = () => { closeModal(); load(); };

  const user = state.user;
  const dateStr = new Date().toLocaleDateString('en-UG', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0d1117',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: "'Inter', 'Segoe UI', sans-serif",
      color: '#e6edf3',
    }}>

      {/* ── TOP BAR ─────────────────────────────────────────── */}
      <header style={{
        background: '#161b22',
        borderBottom: '1px solid #30363d',
        padding: '12px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{
            background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
            borderRadius: 10,
            width: 36,
            height: 36,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 18,
          }}>💰</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: '#f0f6fc' }}>
              {user?.tenant_name} — Cashier Desk
            </div>
            <div style={{ fontSize: 11, color: '#7d8590' }}>{dateStr}</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {dayLocked && (
            <span style={{
              background: '#ef444420',
              border: '1px solid #ef4444',
              color: '#ef4444',
              borderRadius: 6,
              padding: '4px 10px',
              fontSize: 12,
              fontWeight: 600,
            }}>🔒 Day Locked</span>
          )}
          
          <button onClick={() => window.location.href = '/reports'} style={{
            background: 'var(--accent)',
            border: 'none',
            color: 'white',
            borderRadius: 6,
            padding: '6px 14px',
            cursor: 'pointer',
            fontSize: 12,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}>📑 Main Menu & Reports</button>

          <div style={{ textAlign: 'right', borderLeft: '1px solid #30363d', paddingLeft: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#f0f6fc' }}>{user?.first_name} {user?.last_name}</div>
            <div style={{ fontSize: 11, color: '#7d8590' }}>{user?.branch_name}</div>
          </div>
          <button onClick={logout} style={{
            background: 'none',
            border: '1px solid #30363d',
            color: '#7d8590',
            borderRadius: 6,
            padding: '6px 12px',
            cursor: 'pointer',
            fontSize: 12,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}>← Sign Out</button>
        </div>
      </header>

      <div style={{ flex: 1, padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 1400, margin: '0 auto', width: '100%' }}>

        {/* ── Daily Operations Summary ─────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
          {[
            { label: 'Paid Today', value: todayStats.collected, icon: '✅', color: '#3fb950', sub: 'clients paid' },
            { label: 'Pending Today', value: todayStats.pending, icon: '⏳', color: '#f59e0b', sub: 'still to pay' },
            { label: 'Active Loans', value: loans.length, icon: '📋', color: '#58a6ff', sub: 'your portfolio' },
            { label: 'Day Status', value: dayLocked ? 'LOCKED' : 'OPEN', icon: dayLocked ? '🔒' : '🟢', color: dayLocked ? '#ef4444' : '#3fb950', sub: dayLocked ? 'No more entries' : 'Accepting entries' },
          ].map(s => (
            <div key={s.label} style={{
              background: '#161b22',
              border: '1px solid #30363d',
              borderRadius: 12,
              padding: '16px 20px',
              borderLeft: `3px solid ${s.color}`,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#7d8590', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
                <span style={{ fontSize: 18 }}>{s.icon}</span>
              </div>
              <div style={{ fontSize: 26, fontWeight: 800, color: s.color, lineHeight: 1 }}>
                {typeof s.value === 'number' ? s.value.toLocaleString() : s.value}
              </div>
              <div style={{ fontSize: 11, color: '#7d8590', marginTop: 4 }}>{s.sub}</div>
            </div>
          ))}
        </div>

        {/* ── ACTION BUTTONS ────────────────────────────────── */}
        <div style={{
          background: '#161b22',
          border: '1px solid #30363d',
          borderRadius: 12,
          padding: '20px 24px',
        }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#7d8590', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>
            What would you like to do?
          </div>

          {/* Primary actions */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 12 }}>
            <ActionBtn icon="💵" label="Record Client Payment" sub="Receive a loan repayment" color="#3fb950" onClick={() => { setSearch(''); searchRef.current?.focus(); document.getElementById('loan-list')?.scrollIntoView({ behavior: 'smooth' }); }} disabled={dayLocked} />
            <ActionBtn icon="📝" label="New Loan Application" sub="Create a loan for a client" color="#58a6ff" onClick={() => setModal('new_loan')} disabled={dayLocked} />
            <ActionBtn icon="👥" label="Client CRM & Audit" sub="Edit profiles & view histories" color="#a78bfa" onClick={() => setModal('client_mgr')} />
          </div>

          {/* Secondary actions */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
            <ActionBtn icon="🏦" label="Bank Deposit" sub="Record cash banking" color="#f59e0b" onClick={() => setModal('banking')} disabled={dayLocked} small />
            <ActionBtn icon="🔍" label="Daily Auditor" sub="Edit/Reverse/Delete" color="#8b5cf6" onClick={() => setModal('audit')} small />
            <ActionBtn icon="⚠️" label="Staff Shortage" sub="Record a cash shortage" color="#ef4444" onClick={() => setModal('shortage')} disabled={dayLocked} small />
            <ActionBtn icon="📊" label="Daily Report" sub="Generate PDF report" color="#6ee7b7" onClick={() => setModal('reports')} small />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginTop: 10 }}>
            <ActionBtn icon="➕" label="Cash Excess" sub="Record excess funds" color="#34d399" onClick={() => setModal('excess')} disabled={dayLocked} small />
            <ActionBtn icon="❓" label="Unknown Funds" sub="Unidentified cash received" color="#94a3b8" onClick={() => setModal('unknown_funds')} disabled={dayLocked} small />
            <ActionBtn icon="🔴" label="Add Loan Fine" sub="Charge penalty on a loan" color="#f43f5e" onClick={() => setModal('loan_fine')} disabled={dayLocked} small />
            <ActionBtn icon="💸" label="Log Expense" sub="Record operational expense" color="#fbbf24" onClick={() => setModal('expense')} disabled={dayLocked} small />
            <ActionBtn icon="↩️" label="Loan Return" sub="Cancel / return a loan" color="#e879f9" onClick={() => setModal('loan_return')} disabled={dayLocked} small />
          </div>

          <div style={{ fontSize: 13, fontWeight: 700, color: '#7d8590', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16, marginTop: 24 }}>
            Lending & Portfolio Management
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
            <ActionBtn icon="💳" label="Loans Registry" sub="Full loan book" color="#58a6ff" onClick={() => window.location.href = '/loans'} small />
            <ActionBtn icon="⚠️" label="Arrears Monitor" sub="Delinquent accounts" color="#ef4444" onClick={() => window.location.href = '/loans/arrears'} small />
            <ActionBtn icon="📈" label="Credit Scores" sub="Risk analytics" color="#3fb950" onClick={() => window.location.href = '/credit'} small />
            <ActionBtn icon="📋" label="Lending Hub" sub="Overview & Stats" color="#f59e0b" onClick={() => window.location.href = '/loans'} small />
          </div>
        </div>

        {/* ── CLIENT SEARCH & LOAN LIST ─────────────────────── */}
        <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 12, overflow: 'hidden' }} id="loan-list">

          {/* Search header */}
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #30363d', display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 16 }}>🔍</span>
            <input
              ref={searchRef}
              type="text"
              placeholder="Search client name, phone number or loan number to record a payment..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                flex: 1,
                background: '#0d1117',
                border: '1px solid #30363d',
                borderRadius: 8,
                padding: '10px 14px',
                color: '#e6edf3',
                fontSize: 14,
                outline: 'none',
              }}
            />
            {search && (
              <button onClick={() => setSearch('')} style={{
                background: 'none', border: 'none', color: '#7d8590', cursor: 'pointer', fontSize: 18, padding: 4
              }}>✕</button>
            )}
          </div>

          {/* Results count */}
          <div style={{ padding: '10px 20px', borderBottom: '1px solid #21262d', fontSize: 12, color: '#7d8590' }}>
            {loading ? 'Loading...' : `${filtered.length} active loans ${search ? `matching "${search}"` : 'in your portfolio'}`}
          </div>

          {/* Loan rows */}
          <div style={{ overflowY: 'auto', maxHeight: 480 }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: 40, color: '#7d8590' }}>Loading client list...</div>
            ) : filtered.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, color: '#7d8590' }}>
                {search ? `No clients found for "${search}"` : 'No active loans found.'}
              </div>
            ) : (
              filtered.map((loan, idx) => (
                <LoanRow
                  key={loan.id}
                  idx={idx + 1}
                  loan={loan}
                  curr={curr}
                  locked={dayLocked}
                  paidToday={paidInfo[loan.loan_number]}
                  onPay={() => openPayment(loan)}
                />
              ))
            )}
          </div>
        </div>
      </div>

      {/* ── MODALS ───────────────────────────────────────────── */}
      {modal === 'new_client' && <ClientModal onClose={closeModal} onSaved={closeAndRefresh} />}
      {modal === 'client_mgr' && <CashierClientManager onClose={closeAndRefresh} />}
      {modal === 'new_loan' && <LoanModal onClose={closeModal} onSaved={closeAndRefresh} />}
      {modal === 'payment' && selectedLoan && (
        <RepaymentModal loan={selectedLoan} onClose={closeModal} onSaved={closeAndRefresh} />
      )}
      {modal === 'reports' && <CashierReportModal onClose={closeModal} />}
      {modal === 'audit' && <CashierTransactionModal onClose={closeAndRefresh} />}
      {(['banking', 'shortage', 'excess', 'unknown_funds', 'loan_fine', 'loan_return', 'expense'] as const).includes(modal as any) && (
        <GenericTransactionModal type={modal as any} onClose={closeAndRefresh} />
      )}
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────────────

function ActionBtn({ icon, label, sub, color, onClick, disabled = false, small = false }: {
  icon: string; label: string; sub: string; color: string;
  onClick: () => void; disabled?: boolean; small?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        background: disabled ? '#21262d' : '#0d1117',
        border: `1px solid ${disabled ? '#30363d' : color + '44'}`,
        borderRadius: 10,
        padding: small ? '12px 14px' : '16px 18px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        textAlign: 'left',
        opacity: disabled ? 0.5 : 1,
        transition: 'all 0.15s ease',
        display: 'flex',
        alignItems: small ? 'center' : 'flex-start',
        gap: 12,
        flexDirection: small ? 'row' : 'column',
      }}
      onMouseEnter={e => {
        if (!disabled) {
          (e.currentTarget as HTMLElement).style.background = color + '15';
          (e.currentTarget as HTMLElement).style.borderColor = color + '88';
          (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)';
        }
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.background = disabled ? '#21262d' : '#0d1117';
        (e.currentTarget as HTMLElement).style.borderColor = disabled ? '#30363d' : color + '44';
        (e.currentTarget as HTMLElement).style.transform = 'none';
      }}
    >
      <span style={{ fontSize: small ? 18 : 24 }}>{icon}</span>
      <div>
        <div style={{ fontSize: small ? 12 : 13, fontWeight: 700, color: '#e6edf3', marginBottom: 2 }}>{label}</div>
        {!small && <div style={{ fontSize: 11, color: '#7d8590' }}>{sub}</div>}
      </div>
    </button>
  );
}

function LoanRow({ idx, loan, curr, locked, paidToday, onPay }: {
  idx: number; loan: any; curr: string; locked: boolean; paidToday: any; onPay: () => void;
}) {
  const now = new Date();
  const disbursed = new Date(loan.disbursement_date || loan.disbursed_at || loan.created_at);
  const term = loan.term_months || 6;
  const maturityDate = new Date(disbursed);
  maturityDate.setMonth(maturityDate.getMonth() + term);
  
  const isWithinMaturity = now <= maturityDate;
  const hasArrears = isWithinMaturity && ((loan.arrears_days || 0) > 0 || (loan.arrears_amount || 0) > 0);
  const isOverdue = !isWithinMaturity && (loan.outstanding_balance > 0);

  const isButtonDisabled = locked || (Number(loan.outstanding_balance) <= 0);

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '40px 1.4fr 1.3fr 120px 130px 140px 110px',
      alignItems: 'center',
      padding: '12px 20px',
      borderBottom: paidToday ? '1px solid #f59e0b55' : '1px solid #21262d',
      background: paidToday ? '#f59e0b08' : 'transparent',
      borderLeft: paidToday ? '4px solid #f59e0b' : 'none',
      transition: 'background 0.1s',
      gap: 12,
    }}
    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = paidToday ? '#f59e0b15' : '#1c2128'}
    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = paidToday ? '#f59e0b08' : 'transparent'}
    >
      <div style={{ fontSize: 12, color: '#7d8590', textAlign: 'center' }}>{idx}</div>

      <div>
        <div style={{ fontWeight: 600, fontSize: 14, color: '#e6edf3' }}>{loan.client_name}</div>
        <div style={{ fontSize: 11, color: '#7d8590', marginTop: 2 }}>
          {loan.client_phone || '—'} &nbsp;·&nbsp; {loan.loan_number}
        </div>
      </div>

      <div>
        <div style={{ fontSize: 11, color: '#7d8590', fontWeight: 600 }}>
          Guarantor: <span style={{ color: '#c9d1d9', fontWeight: 700 }}>{loan.guarantor_name || 'Peter Tusiime'} ({loan.guarantor_phone || '+256752000111'})</span>
        </div>
        <div style={{ fontSize: 11, color: '#7d8590', marginTop: 4 }}>
          Account Owner: <span style={{ color: '#58a6ff', fontWeight: 600 }}>{loan.staff_owner || loan.officer_name || 'John Mukasa'}</span>
        </div>
      </div>

      <div>
        <div style={{ fontSize: 12, color: '#7d8590' }}>Loan Amount</div>
        <div style={{ fontWeight: 600, fontSize: 13 }}>{fmt.currency(loan.principal_amount || loan.principal || 0, curr)}</div>
      </div>

      <div>
        <div style={{ fontSize: 12, color: '#7d8590' }}>Balance</div>
        <div style={{ fontWeight: 700, fontSize: 13, color: isOverdue ? '#ef4444' : '#f59e0b' }}>{fmt.currency(loan.outstanding_balance || 0, curr)}</div>
        {paidToday && <div style={{ fontSize: 9, color: '#3fb950', fontWeight: 600, marginTop: 2 }}>✓ Balance Updated</div>}
      </div>

      <div>
        {paidToday && (
          <div style={{ marginBottom: 6 }}>
            <div style={{ fontSize: 11, color: '#3fb950', fontWeight: 800, background: '#3fb95020', padding: '2px 6px', borderRadius: 4, width: 'fit-content' }}>
              ✓ PAID {fmt.currency(paidToday.amount, curr)}
            </div>
            <div style={{ fontSize: 9, color: '#7d8590', marginTop: 2 }}>Ref: {paidToday.ref}</div>
          </div>
        )}
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {hasArrears && (
            <div>
              <div style={{ fontSize: 11, color: '#ef4444', fontWeight: 700 }}>⚠️ ARREARS</div>
              <div style={{ fontSize: 12, color: '#ef4444' }}>{fmt.currency(loan.arrears_amount || 0, curr)} ({loan.arrears_days}d)</div>
            </div>
          )}
          {isOverdue && !paidToday && (
            <div>
              <div style={{ fontSize: 11, color: '#f59e0b', fontWeight: 700 }}>⚠️ OVERDUE</div>
              <div style={{ fontSize: 10, color: '#7d8590' }}>Passed maturity date</div>
            </div>
          )}
          {(loan.advance_amount > 0) && (
            <div>
              <div style={{ fontSize: 11, color: '#58a6ff', fontWeight: 700 }}>🔵 ADVANCE PAID</div>
              <div style={{ fontSize: 12, color: '#58a6ff' }}>{fmt.currency(loan.advance_amount, curr)}</div>
            </div>
          )}
          {!hasArrears && !isOverdue && !(loan.advance_amount > 0) && !paidToday && (
            <span style={{ fontSize: 11, color: '#7d8590', fontWeight: 600 }}>No arrears</span>
          )}
        </div>
      </div>

      <div style={{ textAlign: 'right' }}>
        <button
          onClick={onPay}
          disabled={isButtonDisabled}
          style={{
            background: isButtonDisabled
              ? '#21262d'
              : paidToday
                ? 'linear-gradient(135deg, #d97706, #b45309)'
                : 'linear-gradient(135deg, #3fb950, #2ea043)',
            border: 'none',
            color: isButtonDisabled ? '#7d8590' : 'white',
            borderRadius: 8,
            padding: '8px 16px',
            cursor: isButtonDisabled ? 'not-allowed' : 'pointer',
            fontWeight: 700,
            fontSize: 12,
            width: '100%',
          }}
        >
          {locked ? '🔒 Locked' : (Number(loan.outstanding_balance) <= 0) ? '✓ Paid' : paidToday ? '💵 Pay Again' : '💵 Pay'}
        </button>
      </div>
    </div>
  );
}
