import { useState, useEffect } from 'react';
import { X, Download, Lock } from 'lucide-react';
import api from '../../services/api';
import { useApp, fmt } from '../../store/AppContext';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function ReportingCenter({ onClose }: { onClose: () => void }) {
  const { state } = useApp();
  const [reportType, setReportType] = useState('daily_financial');
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
  const [filterStaff, setFilterStaff] = useState('all');
  const [staffList, setStaffList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [locked, setLocked] = useState(false);

  useEffect(() => {
    loadStaff();
  }, []);

  const loadStaff = async () => {
    try {
      const res = await api.getStaff();
      setStaffList(res.data || []);
    } catch (e) {
      console.error('Failed to load staff list');
    }
  };

  const generatePDF = async () => {
    setLoading(true);
    try {
      const doc = new jsPDF();
      const companyName = state.user?.tenant_name || 'LENDSUP FINANCIAL SERVICES';
      const branchName = 'MAIN BRANCH';
      
      // Header
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text(`${companyName} ${branchName}`, 105, 15, { align: 'center' });
      doc.setFontSize(12);
      doc.text('DAILY CASHFLOW REPORT', 105, 22, { align: 'center' });
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`DATED ${filterDate}`, 105, 28, { align: 'center' });
      doc.text(`GENERATED ON ${new Date().toLocaleString()}`, 105, 33, { align: 'center' });

      // Top Metrics Row
      autoTable(doc, {
        startY: 40,
        head: [['ACTIVE CLIENTS', 'CLIENTS PAID', 'NEW CLIENTS', 'COMPLETED LOANS']],
        body: [['908', '619', '11', '0']],
        theme: 'plain',
        headStyles: { fillColor: [245, 245, 245], textColor: [100, 100, 100], fontSize: 8 },
        bodyStyles: { fontSize: 14, fontStyle: 'bold' },
      });

      // --- DATA FETCHING ---
      let head: string[][] = [];
      let body: any[][] = [];

      if (reportType === 'daily_financial') {
        const res = await api.getDailyFinancialSummary(filterDate);
        const { 
          opening_balance, collections, expenses, disbursements, processing_fees, misc,
          staff_performance, expense_details, loan_details
        } = res.data;

        const totalIn = collections + processing_fees + misc.filter((m: any) => m.category === 'cash_in').reduce((a: any, b: any) => a + parseFloat(b.total), 0);
        const closingBal = opening_balance + totalIn - (expenses + disbursements + misc.filter((m: any) => m.category === 'cash_out').reduce((a: any, b: any) => a + parseFloat(b.total), 0));
        
        doc.setFontSize(10); doc.setFont('helvetica', 'bold');
        doc.text('1. FINANCIAL SUMMARY (CASHFLOW)', 14, 45);
        
        autoTable(doc, {
          startY: 48,
          head: [['DESCRIPTION', 'AMOUNT', 'DESCRIPTION', 'AMOUNT']],
          body: [
            ['Opening Balance', fmt.currency(opening_balance, 'UGX'), 'Total Inflows', fmt.currency(totalIn, 'UGX')],
            ['Loan Repayments', fmt.currency(collections, 'UGX'), 'Total Expenses', fmt.currency(expenses, 'UGX')],
            ['Processing Fees', fmt.currency(processing_fees, 'UGX'), 'Total Loans Given', fmt.currency(disbursements, 'UGX')],
            ['Other Collections', fmt.currency(totalIn - collections - processing_fees, 'UGX'), 'Closing Balance', fmt.currency(closingBal, 'UGX')],
          ],
          theme: 'grid',
          styles: { fontSize: 8 },
          headStyles: { fillColor: [245, 245, 245], textColor: [0, 0, 0] }
        });

        const nextY = (doc as any).lastAutoTable.finalY + 10;
        doc.text('2. EXPENSE DETAILS', 14, nextY);
        autoTable(doc, {
          startY: nextY + 3,
          head: [['DESCRIPTION', 'AMOUNT']],
          body: expense_details.map((e: any) => [e.description, fmt.currency(e.amount, 'UGX')]),
          theme: 'grid',
          styles: { fontSize: 8 }
        });

        const nextY2 = (doc as any).lastAutoTable.finalY + 10;
        doc.text('3. LOANS GIVEN OUT TODAY', 14, nextY2);
        autoTable(doc, {
          startY: nextY2 + 3,
          head: [['LOAN #', 'CLIENT', 'PRINCIPAL', 'FEE']],
          body: loan_details.map((l: any) => [l.loan_number, l.client_name, fmt.currency(l.principal_amount, 'UGX'), fmt.currency(l.processing_fee, 'UGX')]),
          theme: 'grid',
          styles: { fontSize: 8 }
        });

        doc.addPage();
        doc.setFontSize(10); doc.setFont('helvetica', 'bold');
        doc.text('4. STAFF PERFORMANCE SUMMARY', 14, 20);
        autoTable(doc, {
          startY: 23,
          head: [['STAFF', 'CLIENTS', 'PAID', 'UNPAID', 'DEFAULTERS', 'EXPECTED', 'COLLECTED', 'PERF %']],
          body: staff_performance.map((s: any) => {
            const unpaid = s.total_clients - s.paid_clients;
            const perf = s.expected_today > 0 ? (s.collected_today / s.expected_today * 100).toFixed(1) : '100.0';
            return [
              s.staff_name, s.total_clients, s.paid_clients, unpaid, s.defaulters,
              fmt.currency(s.expected_today, 'UGX'), fmt.currency(s.collected_today, 'UGX'), perf + '%'
            ];
          }),
          theme: 'grid',
          headStyles: { fillColor: [41, 128, 185] },
          styles: { fontSize: 7 }
        });
      } 
      else if (reportType === 'maturing_today') {
        const res = await api.getMaturingLoans(filterDate);
        head = [['Loan #', 'Client', 'Phone', 'Balance', 'Due Date']];
        body = res.data.map((l: any) => [l.loan_number, l.client_name, l.phone_primary, fmt.currency(l.outstanding_balance, 'UGX'), fmt.date(l.expected_closure_date)]);
      }
      else if (reportType === 'overdue_today') {
        const res = await api.getLoans(`status=delinquent&branch_id=${state.user?.branch_id}`);
        head = [['Loan #', 'Client', 'Arrears Days', 'Arrears Amt', 'Outstanding']];
        body = res.data.map((l: any) => [l.loan_number, l.client_name, l.arrears_days, fmt.currency(l.arrears_amount, 'UGX'), fmt.currency(l.outstanding_balance, 'UGX')]);
      }
      else if (reportType === 'missed_4_plus') {
        const res = await api.getMissedInstallmentsReport(4);
        head = [['Client', 'Phone', 'Loan #', 'Missed Count', 'Balance']];
        body = res.data.map((l: any) => [l.client_name, l.phone_primary, l.loan_number, l.missed_count, fmt.currency(l.outstanding_balance, 'UGX')]);
      }
      else if (reportType === 'dormant') {
        const res = await api.getDormantLoans(30);
        head = [['Client', 'Phone', 'Loan #', 'Last Payment', 'Balance']];
        body = res.data.map((l: any) => [l.client_name, l.phone_primary, l.loan_number, l.last_payment_date ? fmt.date(l.last_payment_date) : 'NEVER', fmt.currency(l.outstanding_balance, 'UGX')]);
      }
      else if (reportType === 'never_paid') {
        const res = await api.getPortfolioAtRisk(`never_paid=true`);
        head = [['Client', 'Phone', 'Loan #', 'Disbursed', 'Principal']];
        body = res.data.map((l: any) => [l.client_name, l.phone_primary, l.loan_number, fmt.date(l.disbursement_date), fmt.currency(l.outstanding_balance, 'UGX')]);
      }
      else if (reportType === 'defaulters') {
        const res = await api.getLoans(`status=defaulted`);
        head = [['Client', 'Phone', 'Loan #', 'Days Overdue', 'Balance']];
        body = res.data.map((l: any) => [l.client_name, l.phone_primary, l.loan_number, l.arrears_days, fmt.currency(l.outstanding_balance, 'UGX')]);
      }
      else if (reportType === 'staff_performance') {
        const res = await api.getStaffArrearsRanking();
        head = [['Staff', 'Loans', 'In Arrears', 'Arrears Rate %', 'Arrears Amt']];
        body = res.data.map((s: any) => [s.staff_name, s.total_loans, s.loans_in_arrears, s.arrears_rate_pct.toFixed(2) + '%', fmt.currency(s.total_arrears_amount, 'UGX')]);
      }
      else if (reportType === 'detailed_ledger') {
        const res = await api.getTransactions(`date=${filterDate}`);
        head = [['Time', 'Type', 'Client/Ref', 'Staff', 'Amount']];
        body = res.data.map((t: any) => [
          new Date(t.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}),
          t.type.toUpperCase(),
          t.client_name || t.reference,
          t.staff_name,
          fmt.currency(t.amount, 'UGX')
        ]);
      }

      if (head.length > 0) {
        autoTable(doc, {
          startY: 45,
          head: head,
          body: body,
          theme: 'grid',
          headStyles: { fillColor: [41, 128, 185], textColor: [255, 255, 255] },
          styles: { fontSize: 8 }
        });
      }

      doc.save(`Daily_Report_${filterDate}.pdf`);
    } catch (e) {
      console.error(e);
      alert('Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const handleShareAndLock = async () => {
    if (!confirm('WARNING: Sharing this report will LOCK the ledger for this date. No further transactions can be recorded today. Proceed?')) return;
    
    setLoading(true);
    try {
      await generatePDF(); // Generate the report first
      await api.lockDay(filterDate); // Lock the day in the DB
      setLocked(true);
      alert('Day Locked and Report Shared with Management.');
    } catch (e: any) {
      alert('Error: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ width: '500px' }}>
        <div className="modal-header">
          <h2>Reporting Center</h2>
          <button className="btn btn-icon" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">Report Type</label>
            <select className="form-control" value={reportType} onChange={e => setReportType(e.target.value)}>
              <option value="daily_financial">Daily Financial Report</option>
              <option value="detailed_ledger">Detailed Transactions Ledger (PDF)</option>
              <option value="maturing_today">Loans Maturing Today</option>
              <option value="overdue_today">Loans Overdue Today</option>
              <option value="arrears">Portfolio Arrears Report</option>
              <option value="missed_4_plus">Clients Missed &gt;4 Payments</option>
              <option value="defaulters">Defaulters Report (&gt;90 Days)</option>
              <option value="dormant">Dormant Loans (&gt;30 Days)</option>
              <option value="never_paid">Loans Never Paid Report</option>
              <option value="staff_performance">Staff Performance & Arrears Ranking</option>
              <option value="income_statement">Income Statement (P&L)</option>
            </select>
          </div>

          {['unpaid_per_officer', 'portfolio_arrears_per_officer', 'staff_performance'].includes(reportType) && (
            <div className="form-group">
              <label className="form-label">Field Officer</label>
              <select className="form-control" value={filterStaff} onChange={e => setFilterStaff(e.target.value)}>
                <option value="all">All Field Officers</option>
                {staffList.map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.role})</option>
                ))}
              </select>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Target Date</label>
            <input type="date" className="form-control" value={filterDate} onChange={e => setFilterDate(e.target.value)} />
          </div>

          <div style={{ display: 'flex', gap: 12, marginTop: 30 }}>
            <button className="btn btn-secondary" style={{ flex: 1 }} onClick={generatePDF} disabled={loading}>
              <Download size={16} style={{ marginRight: 6 }} /> Export PDF
            </button>
            {reportType === 'daily_financial' && (
              <button className="btn btn-primary" style={{ flex: 1, background: 'var(--danger)', border: 'none' }} onClick={handleShareAndLock} disabled={loading || locked}>
                <Lock size={16} style={{ marginRight: 6 }} /> {locked ? 'Day Locked' : 'Share & Close Day'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
