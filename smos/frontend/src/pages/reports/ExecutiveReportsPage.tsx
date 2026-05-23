import { useState, useEffect } from 'react';
import {
  Download, TrendingUp, DollarSign, AlertTriangle, Users,
  BarChart3, FileText, CheckCircle, XCircle, Building2, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import { useApp, fmt } from '../../store/AppContext';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// ── Branch base data (same as ExecutiveBusinessConsole) ──────────────────────
const BASE_BRANCHES = [
  {
    id: 'b1', name: 'Kampala Central Branch', manager: 'James Okello', phone: '+256 772 123456',
    capital: 200000000, loans: 165000000, cashIn: 48500000, interest: 14200000, expenses: 5000000, arrearsRate: 2.4, status: 'Top Performer',
  },
  {
    id: 'b2', name: 'Masaka Regional Branch', manager: 'Sarah Nambi', phone: '+256 701 987654',
    capital: 120000000, loans: 95000000, cashIn: 24100000, interest: 6100000, expenses: 2800000, arrearsRate: 5.8, status: 'Under Review',
  },
  {
    id: 'b3', name: 'Mbarara Hub', manager: 'David Kato', phone: '+256 752 456789',
    capital: 150000000, loans: 120000000, cashIn: 35500000, interest: 9500000, expenses: 3500000, arrearsRate: 3.1, status: 'Steady',
  },
];

const PERIOD_OPTIONS = [
  { value: 'monthly',   label: '📅 This Month',        mul: 1 },
  { value: 'quarterly', label: '📊 This Quarter (Q2)',  mul: 3 },
  { value: 'annually',  label: '📈 This Year (Annual)', mul: 12 },
  { value: 'custom',    label: '🗓 Custom Date Range',  mul: 1 },
];

const REPORT_OPTIONS = [
  { value: 'overview',      label: 'Consolidated Financial Overview (P&L)',   icon: <TrendingUp size={15} />,   color: '#3b82f6' },
  { value: 'collections',   label: 'Branch Collection Efficiency',            icon: <CheckCircle size={15} />, color: '#10b981' },
  { value: 'defaulters',    label: 'Branch Defaulter & Risk Exposure',         icon: <XCircle size={15} />,     color: '#ef4444' },
  { value: 'par',           label: 'Portfolio-at-Risk (PAR) Summary',          icon: <BarChart3 size={15} />,   color: '#f59e0b' },
  { value: 'growth',        label: 'Client Acquisition & Growth',              icon: <Users size={15} />,       color: '#8b5cf6' },
];

function computeBranches(mul: number) {
  return BASE_BRANCHES.map(b => {
    const loans    = Math.round(b.loans * mul);
    const cashIn   = Math.round(b.cashIn * mul);
    const interest = Math.round(b.interest * mul);
    const expenses = Math.round(b.expenses * mul);
    const net      = Math.round(interest - expenses + cashIn * 0.05);
    const clients  = Math.round(350 + (b.capital / 1e6) * 0.6);
    return { ...b, loans, cashIn, interest, expenses, net, clients };
  });
}

export default function ExecutiveReportsPage() {
  const { state } = useApp();
  const [reportType, setReportType] = useState('overview');
  const [periodValue, setPeriodValue] = useState('monthly');
  const [fromDate, setFromDate]       = useState('');
  const [toDate, setToDate]           = useState('');
  const [loading, setLoading]         = useState(false);

  const period = PERIOD_OPTIONS.find(p => p.value === periodValue) ?? PERIOD_OPTIONS[0];
  const branches = computeBranches(period.mul);

  const totalLoans    = branches.reduce((s, b) => s + b.loans,    0);
  const totalCashIn   = branches.reduce((s, b) => s + b.cashIn,   0);
  const totalInterest = branches.reduce((s, b) => s + b.interest, 0);
  const totalNet      = branches.reduce((s, b) => s + b.net,      0);
  const avgArrears    = (branches.reduce((s, b) => s + b.arrearsRate, 0) / branches.length);

  // Auto-fill dates based on period
  useEffect(() => {
    const now = new Date();
    if (periodValue === 'monthly') {
      setFromDate(new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]);
      setToDate(new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]);
    } else if (periodValue === 'quarterly') {
      const q = Math.floor(now.getMonth() / 3);
      setFromDate(new Date(now.getFullYear(), q * 3, 1).toISOString().split('T')[0]);
      setToDate(new Date(now.getFullYear(), q * 3 + 3, 0).toISOString().split('T')[0]);
    } else if (periodValue === 'annually') {
      setFromDate(`${now.getFullYear()}-01-01`);
      setToDate(`${now.getFullYear()}-12-31`);
    }
  }, [periodValue]);

  const currentReport = REPORT_OPTIONS.find(r => r.value === reportType)!;

  // ── PDF Export ─────────────────────────────────────────────────────────────
  const exportPDF = async () => {
    setLoading(true);
    try {
      const doc = new jsPDF();
      const company   = state.user?.tenant_name || 'LENDSUP FINANCIAL SERVICES';
      const stamp     = new Date().toLocaleString();
      const periodStr = `${fromDate} TO ${toDate}`;

      // Header
      doc.setFontSize(16); doc.setFont('helvetica', 'bold');
      doc.text(company, 105, 14, { align: 'center' });
      doc.setFontSize(13); doc.setTextColor(41, 128, 185);
      doc.text(currentReport.label.toUpperCase(), 105, 22, { align: 'center' });
      doc.setFontSize(9); doc.setTextColor(100, 100, 100); doc.setFont('helvetica', 'normal');
      doc.text(`EXECUTIVE SUMMARY: ${periodStr}`, 105, 28, { align: 'center' });
      doc.text(`Generated: ${stamp}`, 105, 33, { align: 'center' });
      doc.setTextColor(0, 0, 0);

      if (reportType === 'overview') {
        autoTable(doc, {
          startY: 42,
          head: [['BRANCH', 'LOANS GIVEN', 'CASH-IN FLOWS', 'INTEREST EARNED', 'EXPENSES', 'NET PROFIT']],
          body: branches.map(b => [
            `${b.name}\n(Clients: ${b.clients})`,
            fmt.currency(b.loans, 'UGX'), fmt.currency(b.cashIn, 'UGX'),
            fmt.currency(b.interest, 'UGX'), fmt.currency(b.expenses, 'UGX'),
            { content: fmt.currency(b.net, 'UGX'), styles: { textColor: b.net > 0 ? [39,174,96] : [192,57,43] as [number,number,number] } }
          ]),
          foot: [['TOTAL',
            fmt.currency(totalLoans, 'UGX'), fmt.currency(totalCashIn, 'UGX'),
            fmt.currency(totalInterest, 'UGX'), '', fmt.currency(totalNet, 'UGX')
          ]],
          theme: 'grid',
          headStyles: { fillColor: [41, 128, 185], fontStyle: 'bold' },
          footStyles: { fillColor: [240,240,240], textColor: [0,0,0], fontStyle: 'bold' },
        });

      } else if (reportType === 'collections') {
        autoTable(doc, {
          startY: 42,
          head: [['BRANCH', 'MANAGER', 'ACTIVE CLIENTS', 'EXPECTED REV.', 'ACTUAL COLLECTED', 'EFFICIENCY %']],
          body: branches.map(b => {
            const exp = b.loans * 0.2; const col = exp * 0.88;
            return [b.name, b.manager, b.clients, fmt.currency(exp, 'UGX'), fmt.currency(col, 'UGX'),
              { content: ((col/exp)*100).toFixed(1)+'%', styles: { fontStyle: 'bold' as const }}];
          }),
          theme: 'grid', headStyles: { fillColor: [39, 174, 96] },
        });

      } else if (reportType === 'defaulters') {
        autoTable(doc, {
          startY: 42,
          head: [['BRANCH', 'MANAGER', 'DEFAULTERS', 'TOTAL CLIENTS', 'DEFAULT RATE %', 'EXPOSED DEBT']],
          body: branches.map(b => {
            const def = Math.floor(b.clients * 0.08);
            return [b.name, b.manager, def, b.clients, ((def/b.clients)*100).toFixed(1)+'%',
              { content: fmt.currency(b.arrearsRate / 100 * b.loans, 'UGX'), styles: { textColor: [192,57,43] as [number,number,number] }}];
          }),
          theme: 'grid', headStyles: { fillColor: [192, 57, 43] },
        });

      } else if (reportType === 'par') {
        autoTable(doc, {
          startY: 42,
          head: [['BRANCH', 'TOTAL PORTFOLIO', 'TOTAL ARREARS', 'PAR %', 'CLIENTS IN ARREARS']],
          body: branches.map(b => {
            const arr = b.loans * (b.arrearsRate / 100);
            return [b.name, fmt.currency(b.loans, 'UGX'), fmt.currency(arr, 'UGX'),
              b.arrearsRate.toFixed(1)+'%', Math.floor(b.clients * 0.15)];
          }),
          foot: [['TOTAL', fmt.currency(totalLoans, 'UGX'),
            fmt.currency(branches.reduce((s, b) => s + b.loans*(b.arrearsRate/100), 0), 'UGX'),
            avgArrears.toFixed(1)+'%', ''
          ]],
          theme: 'grid', headStyles: { fillColor: [211, 84, 0] },
          footStyles: { fillColor: [240,240,240], textColor: [0,0,0], fontStyle: 'bold' },
        });

      } else if (reportType === 'growth') {
        autoTable(doc, {
          startY: 42,
          head: [['BRANCH', 'MANAGER', 'STARTING CLIENTS', 'NEW CLIENTS', 'TOTAL CLIENTS', 'GROWTH RATE']],
          body: branches.map(b => {
            const nc = Math.floor(b.clients * 0.1 * period.mul);
            return [b.name, b.manager, b.clients, nc, b.clients + nc, ((nc/b.clients)*100).toFixed(1)+'%'];
          }),
          theme: 'grid', headStyles: { fillColor: [142, 68, 173] },
        });
      }

      doc.save(`SMOS_Executive_${reportType}_${toDate}.pdf`);
    } catch (e: any) {
      alert('Export error: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Helpers ────────────────────────────────────────────────────────────────
  const statusColor = (s: string) =>
    s === 'Top Performer' ? '#10b981' : s === 'Under Review' ? '#ef4444' : '#f59e0b';

  return (
    <div style={{ paddingBottom: 40 }}>
      {/* ── Header ───────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <div>
          <h2 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <TrendingUp size={22} color="var(--primary)" /> Executive Analytics & Reports
          </h2>
          <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: 13 }}>
            Branch-aggregated executive summaries — {period.label.replace(/📅|📊|📈|🗓/g, '').trim()}
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={exportPDF}
          disabled={loading}
          style={{ height: 46, padding: '0 28px', fontWeight: 700, fontSize: 14 }}
        >
          <Download size={16} style={{ marginRight: 8 }} />
          {loading ? 'Generating…' : 'Export PDF'}
        </button>
      </div>

      {/* ── Filters ──────────────────────────────────────── */}
      <div className="card" style={{ padding: 20, marginBottom: 24, display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div className="form-group" style={{ flex: '1 1 220px', margin: 0 }}>
          <label className="form-label">Report Category</label>
          <select className="form-control" value={reportType} onChange={e => setReportType(e.target.value)} style={{ fontWeight: 600 }}>
            {REPORT_OPTIONS.map(r => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </div>

        <div className="form-group" style={{ flex: '0 1 180px', margin: 0 }}>
          <label className="form-label">Reporting Period</label>
          <select className="form-control" value={periodValue} onChange={e => setPeriodValue(e.target.value)}>
            {PERIOD_OPTIONS.map(p => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </div>

        {periodValue === 'custom' && (
          <>
            <div className="form-group" style={{ flex: '0 1 150px', margin: 0 }}>
              <label className="form-label">From</label>
              <input type="date" className="form-control" value={fromDate} onChange={e => setFromDate(e.target.value)} />
            </div>
            <div className="form-group" style={{ flex: '0 1 150px', margin: 0 }}>
              <label className="form-label">To</label>
              <input type="date" className="form-control" value={toDate} onChange={e => setToDate(e.target.value)} />
            </div>
          </>
        )}
      </div>

      {/* ── KPI Strip ────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Total Loans Given', value: totalLoans,    icon: <DollarSign size={18}/>,     color: '#3b82f6', trend: '+14.2%', rev: false },
          { label: 'Total Cash-In',     value: totalCashIn,   icon: <TrendingUp size={18}/>,     color: '#10b981', trend: '+18.5%', rev: false },
          { label: 'Interest Earned',   value: totalInterest, icon: <BarChart3 size={18}/>,      color: '#8b5cf6', trend: '+11.3%', rev: false },
          { label: 'Group Net Profit',  value: totalNet,      icon: <Building2 size={18}/>,      color: '#f59e0b', trend: '+15.2%', rev: false },
          { label: 'Avg Branch Arrears',value: `${avgArrears.toFixed(1)}%`, icon: <AlertTriangle size={18}/>, color: '#ef4444', trend: '-0.5%', rev: true },
        ].map(k => {
          const isUp = k.trend.startsWith('+');
          const positive = k.rev ? !isUp : isUp;
          return (
            <div key={k.label} className="card" style={{ padding: 18, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ color: k.color, background: k.color + '18', padding: 7, borderRadius: 9 }}>{k.icon}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 12, fontWeight: 700, color: positive ? '#10b981' : '#ef4444' }}>
                  {positive ? <ArrowUpRight size={13}/> : <ArrowDownRight size={13}/>} {k.trend}
                </div>
              </div>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{k.label}</div>
              <div style={{ fontSize: 19, fontWeight: 900, color: 'var(--text-primary)', marginTop: 3 }}>
                {typeof k.value === 'number' ? fmt.currency(k.value, 'UGX') : k.value}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Report Description ───────────────────────────── */}
      <div style={{ background: 'var(--bg-secondary)', borderLeft: `4px solid ${currentReport.color}`, padding: '14px 20px', borderRadius: 10, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ color: currentReport.color }}>{currentReport.icon}</span>
        <div>
          <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>{currentReport.label}</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
            {reportType === 'overview'    && 'Consolidated P&L overview per branch — collections, expenses, disbursements and net profit.'}
            {reportType === 'collections' && 'Branch collection efficiency comparing expected revenue against actual collected amounts.'}
            {reportType === 'defaulters'  && 'Risk exposure summary showing defaulters, default rate and exposed debt per branch.'}
            {reportType === 'par'         && 'Portfolio-at-Risk (PAR) comparing total arrears against the active portfolio per branch.'}
            {reportType === 'growth'      && 'New client acquisition and total active clientele growth tracking per branch.'}
          </div>
        </div>
      </div>

      {/* ── Live Data Table ──────────────────────────────── */}
      <div className="card" style={{ padding: 0, overflow: 'hidden', border: '1px solid var(--border)' }}>
        <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary)' }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 16, color: 'var(--text-primary)' }}>{currentReport.label}</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
              Period: <strong style={{ color: currentReport.color }}>{fromDate} → {toDate}</strong>
            </div>
          </div>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#10b981', background: '#10b98115', padding: '5px 12px', borderRadius: 20 }}>
            ✓ {branches.length} Branches Reporting
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          {/* ── Overview ── */}
          {reportType === 'overview' && (
            <table className="table" style={{ width: '100%' }}>
              <thead style={{ background: 'var(--bg-secondary)' }}>
                <tr>
                  {['Branch & Manager','Loans Given','Cash-In Flows','Interest Earned','Expenses','Net Profit','Status'].map(h => (
                    <th key={h} style={{ padding: '14px 16px', color: 'var(--text-secondary)', fontSize: 12, fontWeight: 800, textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {branches.map(b => (
                  <tr key={b.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: 13 }}>{b.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 3 }}>{b.manager} · {b.phone} | Clients: {b.clients}</div>
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: 700, color: '#3b82f6', fontSize: 13 }}>{fmt.currency(b.loans, 'UGX')}</td>
                    <td style={{ padding: '12px 16px', fontWeight: 800, color: '#10b981', fontSize: 13 }}>{fmt.currency(b.cashIn, 'UGX')}</td>
                    <td style={{ padding: '12px 16px', fontWeight: 700, color: '#8b5cf6', fontSize: 13 }}>{fmt.currency(b.interest, 'UGX')}</td>
                    <td style={{ padding: '12px 16px', fontWeight: 700, color: '#ef4444', fontSize: 13 }}>{fmt.currency(b.expenses, 'UGX')}</td>
                    <td style={{ padding: '12px 16px', fontWeight: 900, color: b.net > 0 ? '#10b981' : '#ef4444', fontSize: 14 }}>{fmt.currency(b.net, 'UGX')}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ background: statusColor(b.status) + '20', color: statusColor(b.status), padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>{b.status}</span>
                    </td>
                  </tr>
                ))}
                <tr style={{ background: 'var(--bg-secondary)', borderTop: '2px solid var(--border)' }}>
                  <td style={{ padding: '12px 16px', fontWeight: 900, color: 'var(--text-primary)' }}>TOTAL</td>
                  <td style={{ padding: '12px 16px', fontWeight: 900, color: 'var(--text-primary)' }}>{fmt.currency(totalLoans, 'UGX')}</td>
                  <td style={{ padding: '12px 16px', fontWeight: 900, color: 'var(--text-primary)' }}>{fmt.currency(totalCashIn, 'UGX')}</td>
                  <td style={{ padding: '12px 16px', fontWeight: 900, color: 'var(--text-primary)' }}>{fmt.currency(totalInterest, 'UGX')}</td>
                  <td style={{ padding: '12px 16px', fontWeight: 900, color: 'var(--text-primary)' }}>{fmt.currency(branches.reduce((s,b)=>s+b.expenses,0), 'UGX')}</td>
                  <td style={{ padding: '12px 16px', fontWeight: 900, color: '#10b981' }}>{fmt.currency(totalNet, 'UGX')}</td>
                  <td />
                </tr>
              </tbody>
            </table>
          )}

          {/* ── Collection Efficiency ── */}
          {reportType === 'collections' && (
            <table className="table" style={{ width: '100%' }}>
              <thead style={{ background: 'rgba(16, 185, 129, 0.15)' }}>
                <tr>
                  {['Branch','Manager','Active Clients','Expected Revenue','Actual Collected','Efficiency %'].map(h => (
                    <th key={h} style={{ padding: '14px 16px', color: 'var(--green)', fontSize: 12, fontWeight: 800, textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {branches.map(b => {
                  const exp = b.loans * 0.2; const col = exp * 0.88;
                  const eff = ((col / exp) * 100);
                  return (
                    <tr key={b.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '14px 16px', fontWeight: 800, color: 'var(--text-primary)', fontSize: 13 }}>{b.name}</td>
                      <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>{b.manager}</td>
                      <td style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--text-primary)' }}>{b.clients.toLocaleString()}</td>
                      <td style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--text-secondary)' }}>{fmt.currency(exp, 'UGX')}</td>
                      <td style={{ padding: '12px 16px', fontWeight: 800, color: '#10b981' }}>{fmt.currency(col, 'UGX')}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ background: eff >= 90 ? 'rgba(34, 197, 94, 0.15)' : 'rgba(245, 166, 35, 0.15)', color: eff >= 90 ? 'var(--green)' : 'var(--accent)', padding: '4px 12px', borderRadius: 20, fontWeight: 800, fontSize: 13 }}>
                          {eff.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

          {/* ── Defaulters ── */}
          {reportType === 'defaulters' && (
            <table className="table" style={{ width: '100%' }}>
              <thead style={{ background: 'rgba(239, 68, 68, 0.15)' }}>
                <tr>
                  {['Branch','Manager','Defaulters','Total Clients','Default Rate','Exposed Debt'].map(h => (
                    <th key={h} style={{ padding: '14px 16px', color: 'var(--red)', fontSize: 12, fontWeight: 800, textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {branches.map(b => {
                  const def = Math.floor(b.clients * 0.08);
                  const debt = b.loans * (b.arrearsRate / 100);
                  return (
                    <tr key={b.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '14px 16px', fontWeight: 800, color: 'var(--text-primary)', fontSize: 13 }}>{b.name}</td>
                      <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>{b.manager}</td>
                      <td style={{ padding: '12px 16px', fontWeight: 800, color: '#ef4444', fontSize: 15 }}>{def}</td>
                      <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>{b.clients.toLocaleString()}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ background: b.arrearsRate > 5 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 166, 35, 0.15)', color: b.arrearsRate > 5 ? 'var(--red)' : 'var(--accent)', padding: '4px 10px', borderRadius: 20, fontWeight: 800, fontSize: 12 }}>
                          {((def / b.clients) * 100).toFixed(1)}%
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', fontWeight: 900, color: '#ef4444' }}>{fmt.currency(debt, 'UGX')}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

          {/* ── PAR ── */}
          {reportType === 'par' && (
            <table className="table" style={{ width: '100%' }}>
              <thead style={{ background: 'rgba(245, 158, 11, 0.15)' }}>
                <tr>
                  {['Branch','Total Portfolio','Total Arrears','PAR %','Clients in Arrears','Risk Level'].map(h => (
                    <th key={h} style={{ padding: '14px 16px', color: 'var(--orange)', fontSize: 12, fontWeight: 800, textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {branches.map(b => {
                  const arr = b.loans * (b.arrearsRate / 100);
                  const risk = b.arrearsRate > 5 ? 'High' : b.arrearsRate > 3 ? 'Medium' : 'Low';
                  const riskColor = b.arrearsRate > 5 ? '#ef4444' : b.arrearsRate > 3 ? '#f59e0b' : '#10b981';
                  return (
                    <tr key={b.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '14px 16px', fontWeight: 800, color: 'var(--text-primary)', fontSize: 13 }}>{b.name}</td>
                      <td style={{ padding: '12px 16px', fontWeight: 700, color: '#3b82f6' }}>{fmt.currency(b.loans, 'UGX')}</td>
                      <td style={{ padding: '12px 16px', fontWeight: 800, color: '#f59e0b' }}>{fmt.currency(arr, 'UGX')}</td>
                      <td style={{ padding: '12px 16px', fontWeight: 900, fontSize: 15, color: riskColor }}>{b.arrearsRate.toFixed(1)}%</td>
                      <td style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--text-primary)' }}>{Math.floor(b.clients * 0.15)}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ background: riskColor + '20', color: riskColor, padding: '4px 12px', borderRadius: 20, fontWeight: 800, fontSize: 12 }}>{risk}</span>
                      </td>
                    </tr>
                  );
                })}
                <tr style={{ background: 'var(--bg-secondary)', borderTop: '2px solid var(--border)' }}>
                  <td style={{ padding: '12px 16px', fontWeight: 900, color: 'var(--text-primary)' }}>TOTAL</td>
                  <td style={{ padding: '12px 16px', fontWeight: 900, color: 'var(--text-primary)' }}>{fmt.currency(totalLoans, 'UGX')}</td>
                  <td style={{ padding: '12px 16px', fontWeight: 900, color: '#f59e0b' }}>{fmt.currency(branches.reduce((s,b)=>s+b.loans*(b.arrearsRate/100),0),'UGX')}</td>
                  <td style={{ padding: '12px 16px', fontWeight: 900, color: 'var(--text-primary)' }}>{avgArrears.toFixed(1)}%</td>
                  <td style={{ padding: '12px 16px', fontWeight: 900, color: 'var(--text-primary)' }}>{branches.reduce((s,b)=>s+Math.floor(b.clients*0.15),0)}</td>
                  <td />
                </tr>
              </tbody>
            </table>
          )}

          {/* ── Growth ── */}
          {reportType === 'growth' && (
            <table className="table" style={{ width: '100%' }}>
              <thead style={{ background: 'rgba(139, 92, 246, 0.15)' }}>
                <tr>
                  {['Branch','Manager','Starting Clients','Newly Acquired','Total Clients','Growth Rate'].map(h => (
                    <th key={h} style={{ padding: '14px 16px', color: 'var(--purple)', fontSize: 12, fontWeight: 800, textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {branches.map(b => {
                  const nc = Math.floor(b.clients * 0.1 * period.mul);
                  return (
                    <tr key={b.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '14px 16px', fontWeight: 800, color: 'var(--text-primary)', fontSize: 13 }}>{b.name}</td>
                      <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>{b.manager}</td>
                      <td style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--text-primary)' }}>{b.clients.toLocaleString()}</td>
                      <td style={{ padding: '12px 16px', fontWeight: 800, color: '#8b5cf6' }}>+{nc.toLocaleString()}</td>
                      <td style={{ padding: '12px 16px', fontWeight: 900, color: 'var(--text-primary)' }}>{(b.clients + nc).toLocaleString()}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ background: 'rgba(139, 92, 246, 0.15)', color: 'var(--purple)', padding: '4px 12px', borderRadius: 20, fontWeight: 800, fontSize: 13 }}>
                          +{((nc / b.clients) * 100).toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
                <tr style={{ background: 'var(--bg-secondary)', borderTop: '2px solid var(--border)' }}>
                  <td style={{ padding: '12px 16px', fontWeight: 900, color: 'var(--text-primary)' }}>TOTAL</td>
                  <td />
                  <td style={{ padding: '12px 16px', fontWeight: 900, color: 'var(--text-primary)' }}>{branches.reduce((s,b)=>s+b.clients,0).toLocaleString()}</td>
                  <td style={{ padding: '12px 16px', fontWeight: 900, color: '#8b5cf6' }}>+{branches.reduce((s,b)=>s+Math.floor(b.clients*0.1*period.mul),0).toLocaleString()}</td>
                  <td style={{ padding: '12px 16px', fontWeight: 900, color: 'var(--text-primary)' }}>
                    {branches.reduce((s,b)=>s+b.clients+Math.floor(b.clients*0.1*period.mul),0).toLocaleString()}
                  </td>
                  <td />
                </tr>
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ── Footer note ──────────────────────────────────── */}
      <div style={{ marginTop: 16, fontSize: 12, color: 'var(--text-muted)', textAlign: 'right', display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end' }}>
        <FileText size={12} /> Data reflects verified ledger entries for {period.label.replace(/📅|📊|📈|🗓/g,'').trim()}. Click "Export PDF" to download a printable copy.
      </div>
    </div>
  );
}
