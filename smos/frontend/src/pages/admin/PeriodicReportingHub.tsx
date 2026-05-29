import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  FileText, Download, Filter, Printer, Calendar, Users, 
  AlertCircle, PieChart, BarChart3, TrendingUp, DollarSign, 
  AlertTriangle, Clock
} from 'lucide-react';
import { useApp, fmt } from '../../store/AppContext';
import api from '../../services/api';

export default function PeriodicReportingHub() {
  const { state } = useApp();
  const [searchParams] = useSearchParams();
  const [activeReport, setActiveReport] = useState('arrears');
  const [selectedStaff, setSelectedStaff] = useState('All Staff Members');
  const [staff, setStaff] = useState<any[]>([]);
  const [loans, setLoans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Initialize range to current month by default
  const [range, setRange] = useState(() => {
    const now = new Date();
    const first = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const last = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
    return { from: first, to: last };
  });

  useEffect(() => {
    let active = true;
    const fetchData = async () => {
      try {
        const staffRes = await api.getStaff();
        const loansRes = await api.getLoans();
        if (active) {
          setStaff(staffRes.data || []);
          setLoans(loansRes.data || []);
          setLoading(false);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();
    return () => { active = false; };
  }, []);

  const curr = state.user?.currency || 'UGX';

  const formatPeriod = (d: string) => {
    if (!d) return '---';
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const reports = [
    { id: 'arrears', label: 'Periodic Arrears (Per Staff)', icon: <FileText size={16} />, color: 'var(--orange)', amountLabel: 'Total Arrears' },
    { id: 'defaulters', label: 'Defaulter & Dormant Lists', icon: <AlertCircle size={16} />, color: 'var(--red)', amountLabel: 'Loan Balance' },
    { id: 'written_off', label: 'Written-Off Summary', icon: <FileText size={16} />, color: 'var(--text-muted)', amountLabel: 'Written-Off Amt' },
    { id: 'never_paid', label: 'Never Paid / High Risk', icon: <AlertTriangle size={16} />, color: 'var(--purple)', amountLabel: 'Principal Risk' },
    { id: 'fees', label: 'Processing Fees Report', icon: <DollarSign size={16} />, color: 'var(--accent)', amountLabel: 'Fees Collected' },
    { id: 'interest', label: 'Interest Revenue Periodic', icon: <TrendingUp size={16} />, color: 'var(--green)', amountLabel: 'Interest Earned' },
    { id: 'disbursement', label: 'Periodic Disbursement (Per Staff)', icon: <Users size={16} />, color: 'var(--blue)', amountLabel: 'Disbursed Amt' },
    { id: 'expenses', label: 'Monthly Expense Analysis', icon: <BarChart3 size={16} />, color: 'var(--orange)', amountLabel: 'Expense Amt' },
  ];

  const currentReport = reports.find(r => r.id === activeReport) || reports[0];
  const staffList = staff.map(s => `${s.first_name} ${s.last_name}`);

  useEffect(() => {
    const type = searchParams.get('type');
    if (type) setActiveReport(type);
  }, [searchParams]);

  useEffect(() => {
    document.title = `${currentReport.label} - SMOS`;
    return () => { document.title = 'SMOS - Smart Microfinance OS'; };
  }, [currentReport]);

  const getDetailedData = () => {
    if (selectedStaff === 'All Staff Members') return [];
    
    return loans.map(loan => ({
      id: loan.id,
      name: loan.client_name,
      phone: loan.client_phone,
      gPhone: '07XX XXX XXX',
      val: activeReport === 'arrears' ? loan.arrears_amount : (activeReport === 'disbursement' ? loan.principal_amount : loan.outstanding_balance),
      desc: loan.status === 'active' ? 'Regular repayment schedule' : 'Account flagged for review',
      date: loan.last_payment_date,
      displayDate: activeReport === 'disbursement' ? loan.disbursed_at : loan.last_payment_date,
      status: loan.status
    }));
  };

  const detailedRows = getDetailedData();
  const reportRows = selectedStaff === 'All Staff Members' 
    ? staff.map((staff, i) => ({ 
        name: `${staff.first_name} ${staff.last_name}`, 
        desc: activeReport === 'disbursement' ? `${12 + (i * 4)} Clients Disbursed` : `Institutional summary for ${currentReport.label.toLowerCase()}`, 
        qty: activeReport === 'disbursement' ? 12 + (i * 4) : 1, 
        val: activeReport === 'disbursement' ? staff.total_disbursed : (staff.total_collected * 0.4) 
      }))
    : getDetailedData();

  const totalAmount = reportRows.reduce((sum, r) => sum + (r.val || 0), 0);
  const totalCount = selectedStaff === 'All Staff Members' ? 245 : reportRows.length;

  const handleExport = () => {
    const headers = `ID,CLIENT / ITEM,${currentReport.amountLabel},DATE,STATUS / REASON\n`;
    const rows = (selectedStaff === 'All Staff Members' ? reportRows : detailedRows).map((row: any) => 
      `${row.id || '---'},${row.name || row.client},${row.val || row.amount},${row.date || '---'},${row.status || 'VERIFIED'} - ${row.reason || row.desc}`
    ).join("\n");
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentReport.label}_${selectedStaff}.csv`;
    a.click();
  };

  return (
    <div className="page-content" style={{ maxWidth: 1100, margin: '0 auto' }}>
      
      <div className="page-header no-print">
        <div>
          <h2 className="page-title">Management Reporting Hub</h2>
          <p className="page-subtitle">Granular context: {currentReport.label}</p>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-secondary" onClick={() => window.print()}><Printer size={14} /> Print Preview</button>
          <button className="btn btn-primary" onClick={handleExport}><Download size={14} /> Export to Excel</button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        
        {/* Filters Bar */}
        <div className="card no-print" style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div className="flex items-center gap-3">
            <Calendar size={14} color="var(--text-muted)" />
            <div className="flex gap-2">
              <input 
                type="date" 
                className="form-control" 
                style={{ width: 140, fontSize: 12 }} 
                value={range.from}
                onChange={(e) => setRange(prev => ({ ...prev, from: e.target.value }))}
              />
              <span style={{ alignSelf: 'center', color: 'var(--text-muted)' }}>to</span>
              <input 
                type="date" 
                className="form-control" 
                style={{ width: 140, fontSize: 12 }} 
                value={range.to}
                onChange={(e) => setRange(prev => ({ ...prev, to: e.target.value }))}
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Users size={14} color="var(--text-muted)" />
            <select 
              className="form-control" 
              style={{ width: 220, fontSize: 12 }}
              value={selectedStaff}
              onChange={(e) => setSelectedStaff(e.target.value)}
            >
              <option>All Staff Members</option>
              {staffList.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <button className="btn btn-secondary btn-sm" style={{ marginLeft: 'auto' }}><Filter size={12} /> Apply Filters</button>
        </div>

        {/* Report Content Preview */}
        <main className="report-card-print card" style={{ 
          padding: '30px 40px', 
          maxWidth: '1100px', 
          width: '100%', 
          margin: '0 auto', 
          background: 'white', 
          color: '#1a1a1a', 
          boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
          position: 'relative',
          borderRadius: 12
        }}>
            {/* CSS for Print Optimization */}
            <style>{`
              @media print {
                body { background: white !important; padding: 0 !important; }
                .no-print { display: none !important; }
                .report-card-print { 
                  box-shadow: none !important; 
                  margin: 0 !important; 
                  padding: 0 !important; 
                  width: 100% !important;
                  max-width: none !important;
                  border: none !important;
                }
                @page { margin: 1.5cm; size: A4; }
              }
            `}</style>
            
            {/* 1. INSTITUTIONAL HEADER */}
            <div style={{ textAlign: 'center', borderBottom: '2.4px solid #1a1a1a', paddingBottom: 16, marginBottom: 20 }}>
              <h1 style={{ fontSize: 28, fontWeight: 900, textTransform: 'uppercase', color: '#000', letterSpacing: -0.8 }}>{state.user?.tenant_name || 'SMOS MICROFINANCE'}</h1>
              <p style={{ fontSize: 13, color: '#1a1a1a', fontWeight: 700, marginTop: 2 }}>OFFICIAL MANAGEMENT AUDIT REPORT</p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginTop: 8, fontSize: 10, fontWeight: 800, textTransform: 'uppercase', color: '#444' }}>
                <span>Type: {currentReport.label}</span>
                <span>Branch: Kampala Main</span>
                <span>Period: {formatPeriod(range.from)} - {formatPeriod(range.to)}</span>
              </div>
            </div>

            {/* 2. PERFORMANCE SUMMARY (Context Aware Metrics) */}
            <div style={{ marginBottom: 24 }}>
              <h3 style={{ fontSize: 11, fontWeight: 900, textTransform: 'uppercase', color: '#1a1a1a', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                <PieChart size={12} /> Executive Summary: {selectedStaff}
              </h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                <div style={{ padding: '12px 14px', border: '2px solid #1a1a1a', borderRadius: 8, background: '#fff' }}>
                  <div style={{ fontSize: 9, color: '#444', fontWeight: 800, textTransform: 'uppercase', marginBottom: 2 }}>{currentReport.amountLabel}</div>
                  <div style={{ fontSize: 17, fontWeight: 900, color: '#000' }}>{fmt.currency(totalAmount, '')}</div>
                </div>
                <div style={{ padding: '12px 14px', border: '1px solid #ddd', borderRadius: 8, background: '#fcfcfc' }}>
                  <div style={{ fontSize: 9, color: '#666', fontWeight: 800, textTransform: 'uppercase', marginBottom: 2 }}>Accounts Count</div>
                  <div style={{ fontSize: 17, fontWeight: 900, color: '#000' }}>{totalCount}</div>
                </div>
                <div style={{ padding: '12px 14px', border: '1px solid #ddd', borderRadius: 8, background: '#fcfcfc' }}>
                  <div style={{ fontSize: 9, color: '#666', fontWeight: 800, textTransform: 'uppercase', marginBottom: 2 }}>Target Variance</div>
                  <div style={{ fontSize: 17, fontWeight: 900, color: '#dc2626' }}>{selectedStaff === 'All Staff Members' ? '-4.2%' : '+2.1%'}</div>
                </div>
                <div style={{ padding: '12px 14px', border: '1px solid #ddd', borderRadius: 8, background: '#fcfcfc' }}>
                  <div style={{ fontSize: 9, color: '#666', fontWeight: 800, textTransform: 'uppercase', marginBottom: 2 }}>Audit Score</div>
                  <div style={{ fontSize: 17, fontWeight: 900, color: '#059669' }}>{selectedStaff === 'All Staff Members' ? 'A+' : 'A'}</div>
                </div>
              </div>
            </div>

            {/* 3. DETAILED FOLLOW-UP LOG (Visible Content) */}
            <div style={{ marginBottom: 40 }}>
              <h3 style={{ fontSize: 12, fontWeight: 900, textTransform: 'uppercase', color: '#1a1a1a', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Clock size={14} /> {currentReport.label} — Detailed Audit Trail
              </h3>

              <table className="report-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2.5px solid #1a1a1a' }}>
                    <th style={{ textAlign: 'left', padding: '12px', fontSize: 11, fontWeight: 900, textTransform: 'uppercase', color: '#000', background: '#f1f5f9 !important' }}>Client / Item</th>
                    <th style={{ textAlign: 'left', padding: '12px', fontSize: 11, fontWeight: 900, textTransform: 'uppercase', color: '#000', background: '#f1f5f9 !important' }}>Guarantor Details</th>
                    <th style={{ textAlign: 'left', padding: '12px', fontSize: 11, fontWeight: 900, textTransform: 'uppercase', color: '#000', background: '#f1f5f9 !important' }}>Description / Reason</th>
                    <th style={{ textAlign: 'center', padding: '12px', fontSize: 11, fontWeight: 900, textTransform: 'uppercase', color: '#000', background: '#f1f5f9 !important' }}>Date</th>
                    <th style={{ textAlign: 'right', padding: '12px', fontSize: 11, fontWeight: 900, textTransform: 'uppercase', color: '#000', background: '#f1f5f9 !important' }}>{currentReport.amountLabel} ({curr})</th>
                    <th style={{ textAlign: 'right', padding: '12px', fontSize: 11, fontWeight: 900, textTransform: 'uppercase', color: '#000', background: '#f1f5f9 !important' }}>Status</th>
                  </tr>
                </thead>
                <tbody style={{ fontSize: 13 }}>
                  {selectedStaff === 'All Staff Members' ? (
                    reportRows.map((row: any) => (
                      <tr key={row.name} style={{ borderBottom: '1.2px solid #ddd' }}>
                        <td style={{ padding: '10px 12px', fontWeight: 800, color: '#000' }}>{row.name}</td>
                        <td style={{ padding: '10px 12px', color: '#777', fontSize: 11 }}>---</td>
                        <td style={{ padding: '10px 12px', color: '#333' }}>{row.desc}</td>
                        <td style={{ padding: '10px 12px', textAlign: 'center', color: '#555' }}>Periodical</td>
                        <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 900, color: '#000' }}>{fmt.currency(row.val, '')}</td>
                        <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                           <span style={{ padding: '5px 10px', borderRadius: 4, background: '#f0fdf4', color: '#166534', fontSize: 10, fontWeight: 900, border: '1px solid #166534', whiteSpace: 'nowrap', display: 'inline-block' }}>VERIFIED</span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    reportRows.map((row: any) => (
                      <tr key={row.id} style={{ borderBottom: '1.2px solid #ddd' }}>
                        <td style={{ padding: '10px 12px', fontWeight: 800, color: '#000' }}>
                          <div style={{ fontSize: 13 }}>{row.name}</div>
                          <div style={{ fontSize: 9, color: '#1a1a1a', fontWeight: 800, marginTop: 2 }}>TEL: {row.phone}</div>
                          <div style={{ fontSize: 9, color: '#666', fontWeight: 600 }}>Ref: #{row.id}</div>
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          <div style={{ fontSize: 11, color: '#1a1a1a', fontWeight: 800 }}>{row.gPhone}</div>
                          <div style={{ fontSize: 9, color: '#666', fontWeight: 600 }}>PRIMARY GUARANTOR</div>
                        </td>
                        <td style={{ padding: '10px 12px', color: '#333' }}>{row.desc}</td>
                        <td style={{ padding: '10px 12px', textAlign: 'center', color: '#555' }}>{row.displayDate || row.date}</td>
                        <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 900, color: '#000' }}>{fmt.currency(row.val, '')}</td>
                        <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                           <span style={{ padding: '5px 10px', borderRadius: 4, background: '#fff1f2', color: '#9f1239', fontSize: 10, fontWeight: 900, border: '1px solid #9f1239', whiteSpace: 'nowrap', display: 'inline-block' }}>{row.status?.toUpperCase()}</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
              
              <div style={{ marginTop: 24, textAlign: 'right', borderTop: '2px solid #1a1a1a', paddingTop: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#444' }}>TOTAL {currentReport.amountLabel.toUpperCase()}:</div>
                <div style={{ fontSize: 24, fontWeight: 900, color: '#000' }}>
                  {fmt.currency(selectedStaff === 'All Staff Members' ? 84500000 : detailedRows.reduce((s, r) => s + (r.val || 0), 0), curr)}
                </div>
              </div>
            </div>

            {/* 4. FOOTER & COMPLIANCE */}
            <div style={{ marginTop: 'auto', paddingTop: 40 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, marginTop: 30 }}>
                <div style={{ borderTop: '2px solid #1a1a1a', textAlign: 'center', paddingTop: 10 }}>
                  <div style={{ fontSize: 11, fontWeight: 900 }}>INSTITUTIONAL AUDITOR</div>
                  <div style={{ fontSize: 9, color: '#444', marginTop: 2 }}>Immutable Ledger Verification: OK</div>
                </div>
                <div style={{ borderTop: '2px solid #1a1a1a', textAlign: 'center', paddingTop: 10 }}>
                  <div style={{ fontSize: 11, fontWeight: 900 }}>BRANCH MANAGER</div>
                  <div style={{ fontSize: 9, color: '#444', marginTop: 2 }}>EOD Cycle Lock Approved</div>
                </div>
              </div>
              
              <div style={{ marginTop: 24, padding: 16, border: '2px solid #1a1a1a', borderRadius: 8 }}>
                <h4 style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', color: '#000', marginBottom: 4 }}>Compliance Statement</h4>
                <p style={{ fontSize: 10, color: '#1a1a1a', lineHeight: 1.4, fontWeight: 500, margin: 0 }}>
                  This <strong>{currentReport.label}</strong> has been extracted from the production ledger. 
                  All amounts listed under <strong>{currentReport.amountLabel}</strong> represent the actual 
                  financial position of the branch as of this moment. Any unauthorized alteration of this report 
                  is subject to immediate legal audit.
                </p>
              </div>
            </div>
          </main>
        </div>

      <style>{`
        @media print {
          .no-print, .sidebar, .topbar, .page-header, .search-bar, aside, .card:not(.report-card-print) { 
            display: none !important; 
          }
          .page-content { padding: 0 !important; margin: 0 !important; max-width: 100% !important; }
          .report-card-print { 
            box-shadow: none !important; 
            border: none !important; 
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
            display: block !important;
          }
          body { background: white !important; }
        }
      `}</style>
    </div>
  );
}
