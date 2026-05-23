import { useState, useEffect } from 'react';
import { Download, Lock, FileText, CheckCircle, XCircle, Users, BarChart3 } from 'lucide-react';
import api from '../../services/api';
import { useApp, fmt } from '../../store/AppContext';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import ExecutiveReportsPage from './ExecutiveReportsPage';

export default function ReportsPage() {
  const { state } = useApp();
  const [reportType, setReportType] = useState('daily_financial');
  const [filterDateFrom, setFilterDateFrom] = useState(new Date().toISOString().split('T')[0]);
  const [filterDateTo, setFilterDateTo] = useState(new Date().toISOString().split('T')[0]);
  const [filterStaff, setFilterStaff] = useState('all');
  const [staffList, setStaffList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [locked, setLocked] = useState(false);
  const loadStaff = async () => {
    try {
      const res = await api.getStaff();
      setStaffList(res.data || []);
    } catch (e) {
      console.error('Failed to load staff list');
    }
  };

  useEffect(() => {
    if (state.user?.role !== 'tenant_admin') {
      loadStaff();
    }
  }, [state.user?.role]);

  if (state.user?.role === 'tenant_admin') {
    return <ExecutiveReportsPage />;
  }

  const generatePDF = async () => {
    setLoading(true);
    try {
      const doc = new jsPDF();
      const companyName = state.user?.tenant_name || 'LENDSUP FINANCIAL SERVICES';
      const branchName = 'MAIN BRANCH';
      const timestamp = new Date().toLocaleString();

      const header = (title: string, subtitle: string = `DATED ${filterDateTo} - ${branchName}`) => {
        const staff = staffList.find(s => s.id === filterStaff);
        const staffTag = filterStaff === 'all' ? ' (GENERAL REPORT)' : ` - ${staff?.first_name || ''} ${staff?.last_name || ''}`.toUpperCase();
        const fullTitle = `${title}${staffTag}`;

        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text(companyName, 105, 15, { align: 'center' });
        doc.setFontSize(12);
        doc.text(fullTitle, 105, 22, { align: 'center' });
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(subtitle, 105, 28, { align: 'center' });
        doc.setFontSize(8);
        doc.text(`GENERATED ON ${timestamp}`, 105, 33, { align: 'center' });
      };

      if (reportType === 'daily_financial') {
        const res = await api.getDailyFinancialSummary(filterDateTo);
        const d = res.data;
        if (!d) throw new Error('No data found for this date');

        header('DAILY CASHFLOW REPORT');

        autoTable(doc, {
          startY: 40,
          head: [['OPENING BALANCE', 'COLLECTIONS', 'EXPENSES', 'DISBURSED', 'FEES', 'CLOSING']],
          body: [[
            fmt.currency(d.opening_balance, 'UGX'),
            fmt.currency(d.collections, 'UGX'),
            fmt.currency(d.expenses, 'UGX'),
            fmt.currency(d.disbursements, 'UGX'),
            fmt.currency(d.processing_fees, 'UGX'),
            fmt.currency(d.opening_balance + d.collections + d.processing_fees - d.expenses - d.disbursements, 'UGX')
          ]],
          theme: 'grid',
          headStyles: { fillColor: [41, 128, 185] },
          bodyStyles: { fontStyle: 'bold' }
        });

        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text('DISBURSEMENT LIST', 14, (doc as any).lastAutoTable.finalY + 10);
        autoTable(doc, {
          startY: (doc as any).lastAutoTable.finalY + 15,
          head: [['Loan #', 'Client', 'Principal', 'Fee']],
          body: d.loan_details.map((l: any) => [l.loan_number, l.client_name, fmt.currency(l.principal_amount), fmt.currency(l.processing_fee)]),
          theme: 'striped'
        });

        doc.text('FIELD PERFORMANCE', 14, (doc as any).lastAutoTable.finalY + 10);
        autoTable(doc, {
          startY: (doc as any).lastAutoTable.finalY + 15,
          head: [['AGENT', 'CLIENTS', 'PAID', 'EXPECTED', 'COLLECTED', 'PERF %']],
          body: d.staff_performance.map((s: any) => [
            s.staff_name, s.total_clients, s.paid_clients, 
            fmt.currency(s.expected_today), fmt.currency(s.collected_today),
            s.expected_today > 0 ? ((s.collected_today / s.expected_today) * 100).toFixed(1) + '%' : '100%'
          ]),
          theme: 'grid'
        });

      } else if (reportType === 'detailed_ledger') {
        const res = await api.getDailyLedger(filterDateTo);
        const d = res.data;
        header(`ALL TRANSACTIONS MADE ON ${filterDateTo} MAIN BRANCH`);
        
        autoTable(doc, {
          startY: 40,
          head: [['OPENING BALANCE', 'TOTAL CASH IN', 'TOTAL CASH OUT', 'CLOSING BALANCE']],
          body: [[
            fmt.currency(d.opening_balance),
            fmt.currency(d.total_cash_in),
            fmt.currency(d.total_cash_out),
            fmt.currency(d.closing_balance)
          ]],
          theme: 'grid',
          headStyles: { fillColor: [44, 62, 80] }
        });

        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text(`STATISTICS: Clients Paid: ${d.clients_paid} | Loans Given: ${d.loans_given} | Loan Principal: ${fmt.currency(d.total_loans_given)}`, 14, (doc as any).lastAutoTable.finalY + 10);
        
        const tableStartY = (doc as any).lastAutoTable.finalY + 15;

        autoTable(doc, {
          startY: tableStartY,
          head: [['#', 'Description', 'Cash In', 'Cash Out', 'Break Down']],
          body: d.rows.map((r: any) => [
            r.no, r.name, 
            r.cash_in ? fmt.currency(r.cash_in) : '', 
            r.cash_out ? fmt.currency(r.cash_out) : '', 
            fmt.currency(r.balance)
          ]),
          theme: 'grid',
          headStyles: { fillColor: [245, 245, 245], textColor: [0, 0, 0] },
          columnStyles: { 2: { halign: 'right' }, 3: { halign: 'right' }, 4: { halign: 'right' } }
        });

        doc.setFont('helvetica', 'bold');
        doc.text(`Cash In: ${fmt.currency(d.total_cash_in)} | Cash Out: ${fmt.currency(d.total_cash_out)} | Closing Stock: ${fmt.currency(d.closing_balance)}`, 14, (doc as any).lastAutoTable.finalY + 10);

      } else if (reportType === 'unpaid_per_officer') {
        const res = await api.getUnpaidPerOfficer(`date=${filterDateTo}&staff_id=${filterStaff}`);
        header('CLIENTS WHO HAVE NOT PAID');

        const totalDebt = res.data.reduce((s: number, r: any) => s + Number(r.debt), 0);
        autoTable(doc, {
          startY: 40,
          head: [['TOTAL UNPAID CLIENTS', 'TOTAL OUTSTANDING DEBT']],
          body: [[res.total, fmt.currency(totalDebt)]],
          theme: 'grid',
          headStyles: { fillColor: [192, 57, 43] }
        });

        autoTable(doc, {
          startY: (doc as any).lastAutoTable.finalY + 10,
          head: [['#', 'Names', 'Phone', 'Location', 'Loan', 'Date Given', 'Last Paid', 'Debt']],
          body: res.data.map((r: any) => [
            r.no, r.names, r.phone, r.location, 
            fmt.currency(r.loan_given), r.date_given, r.last_date_paid || 'Never', fmt.currency(r.debt)
          ]),
          theme: 'grid',
          styles: { fontSize: 7 }
        });
        doc.text(`Total Number of Clients Not Paid: ${res.total}`, 14, (doc as any).lastAutoTable.finalY + 10);

      } else if (reportType === 'portfolio_arrears_per_officer') {
        const res = await api.getLoanAging(`staff_id=${filterStaff}`);
        header('LOAN AGING ANALYSIS STATEMENT', `OFFICER: ${staffList.find(s => s.id === filterStaff)?.first_name || 'GENERAL'} ${staffList.find(s => s.id === filterStaff)?.last_name || ''}`);

        autoTable(doc, {
          startY: 40,
          head: [['#', 'Client & Phone', 'Guarantor & Phone', 'Date', 'Due', 'Amount', 'Interest', 'Bal', 'Arrears', 'Days']],
          body: res.data.map((r: any) => [
            r.no, `${r.client_name}\n${r.client_phone}`, `${r.guarantor_name}\n${r.guarantor_phone}`,
            r.date_given, r.due_date, fmt.currency(r.amount_given), fmt.currency(r.interest),
            fmt.currency(r.balance), fmt.currency(r.total_arrears), r.days_missed
          ]),
          theme: 'grid',
          styles: { fontSize: 6 }
        });

        doc.text('SUMMARY BY YEAR', 14, (doc as any).lastAutoTable.finalY + 10);
        autoTable(doc, {
          startY: (doc as any).lastAutoTable.finalY + 15,
          head: [['Year', 'Count', 'Total Balance', 'Total Arrears']],
          body: res.year_summary.map((y: any) => [y.year, y.count, fmt.currency(y.total_balance), fmt.currency(y.total_arrears)]),
          theme: 'grid'
        });

      } else if (reportType === 'loans_issued') {
        const res = await api.getLoansIssued(`from_date=${filterDateFrom}&to_date=${filterDateTo}`);
        header(`LOANS GIVEN OUT BETWEEN ${filterDateFrom} AND ${filterDateTo}`);

        autoTable(doc, {
          startY: 40,
          head: [['LOANS DISBURSED', 'TOTAL PRINCIPAL', 'TOTAL REPAYABLE']],
          body: [[res.data.length, fmt.currency(res.totals.total_amount_given), fmt.currency(res.totals.total_repayable)]],
          theme: 'grid',
          headStyles: { fillColor: [39, 174, 96] }
        });

        autoTable(doc, {
          startY: (doc as any).lastAutoTable.finalY + 10,
          head: [['No', 'Date', "Client's Name", 'Principal', 'Interest', 'Total', 'Status']],
          body: [
            ...res.data.map((r: any) => [r.no, r.date, r.client_name, fmt.currency(r.amount_given), fmt.currency(r.interest), fmt.currency(r.total_amount), r.status]),
            [{ content: 'TOTAL', colSpan: 3, styles: { fontStyle: 'bold' } }, fmt.currency(res.totals.total_amount_given), fmt.currency(res.totals.total_interest), fmt.currency(res.totals.total_repayable), '']
          ],
          theme: 'grid',
          styles: { fontSize: 8 }
        });

      } else if (reportType === 'paid_clients') {
        const res = await api.getRepayments(`date=${filterDateTo}`);
        header('LIST OF CLIENTS WHO PAID TODAY');
        
        const totalAmount = res.data.reduce((s: number, r: any) => s + Number(r.amount), 0);
        autoTable(doc, {
          startY: 40,
          head: [['TOTAL PAID CLIENTS', 'TOTAL AMOUNT COLLECTED']],
          body: [[res.data.length, fmt.currency(totalAmount)]],
          theme: 'grid',
          headStyles: { fillColor: [41, 128, 185] }
        });

        autoTable(doc, {
          startY: (doc as any).lastAutoTable.finalY + 10,
          head: [['No', 'Client Name', 'Loan #', 'Amount Paid', 'Time', 'Officer']],
          body: res.data.map((r: any, i: number) => [i + 1, r.client_name, r.loan_number, fmt.currency(r.amount), new Date(r.created_at).toLocaleTimeString(), r.staff_name]),
          theme: 'grid'
        });

      } else if (reportType === 'unpaid_clients') {
        const res = await api.getUnpaidPerOfficer(`date=${filterDateTo}`);
        header('DAILY UNPAID CLIENTS LIST');
        
        const totalDebt = res.data.reduce((s: number, r: any) => s + Number(r.debt), 0);
        autoTable(doc, {
          startY: 40,
          head: [['TOTAL UNPAID CLIENTS', 'TOTAL DEBT DUE TODAY']],
          body: [[res.data.length, fmt.currency(totalDebt)]],
          theme: 'grid',
          headStyles: { fillColor: [192, 57, 43] }
        });

        autoTable(doc, {
          startY: (doc as any).lastAutoTable.finalY + 10,
          head: [['No', 'Names', 'Phone', 'Location', 'Debt']],
          body: res.data.map((r: any) => [r.no, r.names, r.phone, r.location, fmt.currency(r.debt)]),
          theme: 'grid'
        });

      } else if (reportType === 'staff_summary') {
        const res = await api.getStaffArrearsRanking();
        header('STAFF PERFORMANCE & ARREARS RANKING');

        const totalPortfolio = res.data.reduce((s: number, r: any) => s + Number(r.portfolio_size), 0);
        const totalArrears = res.data.reduce((s: number, r: any) => s + Number(r.arrears_amount), 0);
        autoTable(doc, {
          startY: 40,
          head: [['TOTAL EMPLOYEES', 'AGGREGATE PORTFOLIO', 'TOTAL ARREARS']],
          body: [[res.data.length, fmt.currency(totalPortfolio), fmt.currency(totalArrears)]],
          theme: 'grid',
          headStyles: { fillColor: [142, 68, 173] }
        });

        autoTable(doc, {
          startY: (doc as any).lastAutoTable.finalY + 10,
          head: [['Rank', 'Officer Name', 'Portfolio Size', 'Arrears Amount', 'PAR %']],
          body: res.data.map((s: any, i: number) => [i + 1, s.name, fmt.currency(s.portfolio_size), fmt.currency(s.arrears_amount), s.par_rate + '%']),
          theme: 'grid'
        });

      } else if (reportType === 'arrears') {
        const res = await api.getLoanAging();
        header('TOTAL PORTFOLIO ARREARS REPORT');

        const totalBal = res.data.reduce((s: number, r: any) => s + Number(r.balance), 0);
        const totalArr = res.data.reduce((s: number, r: any) => s + Number(r.total_arrears), 0);
        autoTable(doc, {
          startY: 40,
          head: [['ARREARS CASES', 'TOTAL OUTSTANDING BALANCE', 'TOTAL ARREARS VALUE']],
          body: [[res.data.length, fmt.currency(totalBal), fmt.currency(totalArr)]],
          theme: 'grid',
          headStyles: { fillColor: [211, 84, 0] }
        });

        autoTable(doc, {
          startY: (doc as any).lastAutoTable.finalY + 10,
          head: [['No', 'Client', 'Loan #', 'Balance', 'Arrears', 'Days Late']],
          body: res.data.map((r: any) => [r.no, r.client_name, r.loan_number, fmt.currency(r.balance), fmt.currency(r.total_arrears), r.days_missed]),
          theme: 'grid'
        });

      } else if (reportType === 'collection_efficiency') {
        const res = await api.getCollectionEfficiency(`staff_id=${filterStaff}&from_date=${filterDateFrom}&to_date=${filterDateTo}`);
        const data = res.data || [];
        header('COLLECTION EFFICIENCY & MISSED PAYMENTS');

        const totalExp = data.reduce((s: number, r: any) => s + Number(r.expected_amount), 0);
        const totalAct = data.reduce((s: number, r: any) => s + Number(r.actual_collected), 0);
        autoTable(doc, {
          startY: 40,
          head: [['EXPECTED REVENUE', 'ACTUAL COLLECTIONS', 'MISSED REVENUE', 'EFFICIENCY']],
          body: [[fmt.currency(totalExp), fmt.currency(totalAct), fmt.currency(totalExp - totalAct), totalExp > 0 ? ((totalAct / totalExp) * 100).toFixed(1) + '%' : '100%']],
          theme: 'grid',
          headStyles: { fillColor: [192, 57, 43] }
        });

        autoTable(doc, {
          startY: (doc as any).lastAutoTable.finalY + 10,
          head: [['OFFICER', 'EXPECTED', 'COLLECTED', 'MISSED', 'EFFICIENCY %']],
          body: data.map((s: any) => [
            s.staff_name, fmt.currency(s.expected_amount), fmt.currency(s.actual_collected),
            { content: fmt.currency(s.missed_amount), styles: { textColor: [255, 0, 0] } },
            { content: s.efficiency_rate.toFixed(1) + '%', styles: { fontStyle: 'bold' } }
          ]),
          theme: 'grid'
        });
      } else if (reportType === 'loan_requests') {
        const res = await api.getLoanRequestsReport(`staff_id=${filterStaff}&from_date=${filterDateFrom}&to_date=${filterDateTo}`);
        header('LOAN REQUESTS PENDING CASHIER APPROVAL');

        const totalAmount = res.data.reduce((s: number, r: any) => s + Number(r.amount || 0), 0);
        autoTable(doc, {
          startY: 40,
          head: [['TOTAL REQUESTS', 'TOTAL PRINCIPAL REQUESTED']],
          body: [[res.data.length, fmt.currency(totalAmount)]],
          theme: 'grid',
          headStyles: { fillColor: [41, 128, 185] }
        });

        autoTable(doc, {
          startY: (doc as any).lastAutoTable.finalY + 10,
          head: [['No', 'Loan #', 'Date Applied', 'Client', 'Phone', 'Officer', 'Principal', 'Purpose']],
          body: res.data.map((r: any, i: number) => [
            i + 1, r.loan_number, r.date || '', r.client_name, r.client_phone || '', r.officer_name, fmt.currency(r.amount), r.purpose || ''
          ]),
          theme: 'grid',
          styles: { fontSize: 8 }
        });
      } else if (reportType === 'demand_report') {
        const res = await api.getDemandReport(`staff_id=${filterStaff}&from_date=${filterDateFrom}&to_date=${filterDateTo}`);
        header('DEMAND REPORT (ACTIVE ARREARS)');

        const totalDue = res.data.reduce((s: number, r: any) => s + Number(r.amount_due || 0), 0);
        const totalOutstanding = res.data.reduce((s: number, r: any) => s + Number(r.outstanding_balance || 0), 0);
        autoTable(doc, {
          startY: 40,
          head: [['TOTAL CASES IN ARREARS', 'TOTAL AMOUNT DUE', 'TOTAL OUTSTANDING BALANCE']],
          body: [[res.data.length, fmt.currency(totalDue), fmt.currency(totalOutstanding)]],
          theme: 'grid',
          headStyles: { fillColor: [192, 57, 43] }
        });

        autoTable(doc, {
          startY: (doc as any).lastAutoTable.finalY + 10,
          head: [['No', 'Loan #', 'Client', 'Phone', 'Officer', 'Earliest Due Date', 'Amount Due', 'Outstanding Balance']],
          body: res.data.map((r: any, i: number) => [
            i + 1, r.loan_number, r.client_name, r.client_phone || '', r.officer_name, r.due_date || '', fmt.currency(r.amount_due), fmt.currency(r.outstanding_balance)
          ]),
          theme: 'grid',
          styles: { fontSize: 8 }
        });
      }

      doc.save(`SMOS_Report_${reportType}_${filterDateTo}.pdf`);
    } catch (e: any) {
      console.error(e);
      alert('Error generating report: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleShareAndLock = async () => {
    if (!confirm('WARNING: Sharing this report will LOCK the ledger for this date. No further transactions can be recorded today. Proceed?')) return;
    
    setLoading(true);
    try {
      await generatePDF(); // Generate the report first
      await api.lockDay(filterDateTo); // Lock the day in the DB
      setLocked(true);
      alert('Day Locked and Report Shared with Management.');
    } catch (e: any) {
      alert('Error: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ paddingBottom: 40 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 className="page-title">Financial & Operational Reports</h2>
      </div>

      <div className="card" style={{ padding: 30, maxWidth: 800 }}>
        <div style={{ display: 'flex', gap: 24, marginBottom: 30 }}>
          <div className="form-group" style={{ flex: 1 }}>
            <label className="form-label">Select Report Category</label>
            <select className="form-control" value={reportType} onChange={e => setReportType(e.target.value)}>
              <option value="daily_financial">Daily Financial Report (EOD)</option>
              <option value="paid_clients">Clients Who Paid</option>
              <option value="unpaid_clients">Clients Who Did Not Pay</option>
              <option value="staff_summary">All Clients per Staff</option>
              <option value="arrears">Arrears Report</option>
              <option value="detailed_ledger">Detailed Transactions Ledger (PDF)</option>
              <option value="loans_issued">Loans Issued Report</option>
              <option value="collection_efficiency">Collection Efficiency & Missed Payments</option>
              <option value="loan_requests">Loan Requests (Pending Cashier Approval)</option>
              <option value="demand_report">Demand Report (Loans with Arrears)</option>
            </select>
          </div>
          
          <div className="form-group" style={{ flex: 1 }}>
            <label className="form-label">Field Officer (Optional)</label>
            <select className="form-control" value={filterStaff} onChange={e => setFilterStaff(e.target.value)}>
              <option value="all">All Field Officers</option>
              {staffList.map(s => (
                <option key={s.id} value={s.id}>{s.first_name} {s.last_name} ({s.role})</option>
              ))}
            </select>
          </div>

          <div className="form-group" style={{ flex: 1 }}>
            <label className="form-label">From Date</label>
            <input type="date" className="form-control" value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)} />
          </div>
          <div className="form-group" style={{ flex: 1 }}>
            <label className="form-label">To Date</label>
            <input type="date" className="form-control" value={filterDateTo} onChange={e => setFilterDateTo(e.target.value)} />
          </div>
        </div>

        <div style={{ background: 'var(--bg-secondary)', padding: 24, borderRadius: 12, marginBottom: 30 }}>
          <h4 style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            {reportType === 'daily_financial' && <FileText size={18} color="var(--blue)" />}
            {reportType === 'paid_clients' && <CheckCircle size={18} color="var(--success)" />}
            {reportType === 'unpaid_clients' && <XCircle size={18} color="var(--danger)" />}
            {reportType === 'staff_summary' && <Users size={18} color="var(--accent)" />}
            {reportType === 'arrears' && <BarChart3 size={18} color="var(--orange)" />}
            {reportType === 'loan_requests' && <FileText size={18} color="var(--blue)" />}
            {reportType === 'demand_report' && <XCircle size={18} color="var(--danger)" />}
            Report Overview
          </h4>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, lineHeight: 1.6 }}>
            {reportType === 'daily_financial' && "Generates a complete breakdown of all cash inflows (repayments, deposits) and outflows (expenses, shortages) for the selected date. Used for End-of-Day reconciliation."}
            {reportType === 'paid_clients' && "A list of all clients who successfully submitted a repayment on the selected date."}
            {reportType === 'unpaid_clients' && "A list of clients who had an installment due on the selected date but failed to make a payment."}
            {reportType === 'staff_summary' && "Summarizes the total collections and portfolio handling grouped by each staff member for auditing."}
            {reportType === 'arrears' && "Generates a list of all active loans currently in arrears as of the selected date."}
            {reportType === 'detailed_ledger' && "A high-granularity ledger showing every single transaction entry for the day with running balance."}
            {reportType === 'loans_issued' && "Lists all loans disbursed during the selected period, including principal, interest, and current status."}
            {reportType === 'collection_efficiency' && "Tracks 'Missed Payments' by comparing the total amount that was due in a period against what was actually collected. Essential for weekly/monthly performance reviews."}
            {reportType === 'loan_requests' && "Lists all loan applications submitted by officers that are waiting for cashier/manager approval before they can be active or disbursed."}
            {reportType === 'demand_report' && "Generates the demand list of all active loans with outstanding arrears, indicating the earliest unpaid installment due date and amount overdue."}
          </p>
        </div>

        <div style={{ display: 'flex', gap: 16 }}>
          <button className="btn btn-primary" onClick={generatePDF} disabled={loading} style={{ flex: 1, height: 48 }}>
            <Download size={18} style={{ marginRight: 8 }} /> Export PDF Report
          </button>
          
          {reportType === 'daily_financial' && (
            <button className="btn btn-secondary" onClick={handleShareAndLock} disabled={loading || locked} style={{ flex: 1, height: 48, background: locked ? 'var(--bg-secondary)' : '#fee2e2', color: locked ? 'var(--text-muted)' : '#b91c1c', border: '1px solid #fca5a5' }}>
              <Lock size={18} style={{ marginRight: 8 }} /> 
              {locked ? 'Ledger is Locked' : 'Share Report & Lock Ledger'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
