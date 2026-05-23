import React, { useState, useEffect } from 'react';
import { 
  Plus, Eye, Gavel, FileText, FilePlus, 
  Search, CheckCircle2, Clock, 
  Printer, Trash2, Calendar,
  X
} from 'lucide-react';
import api from '../../services/api';
import { fmt } from '../../store/AppContext';



const STATUS_BADGE: Record<string,string> = { 
  open: 'badge-at_risk', 
  in_progress: 'badge-B', 
  resolved: 'badge-active', 
  escalated: 'badge-delinquent', 
  closed: 'badge-closed' 
};

const AUDIT_FINDINGS_TEMPLATES = [
  'Fake Cash-Out Transactions (Client denied receiving funds)',
  'Exceeding Approved Loan Limits without authorization',
  'Failure to Remit Client Loan Repayments (Theft by Conversion)',
  'Forged client names, signatures, and telephone numbers',
  'Absconding from Duty During Audit Investigation'
];

const COMMON_ROOT_CAUSES = [
  'Weak client verification controls',
  'Poor segregation of duties',
  'Inadequate field supervision',
  'Lack of regular supervisor field checks',
  'Inadequate staff background checks'
];

const STAFF_RESPONSIBILITIES = [
  'Recruiting and onboarding clients',
  'Inspecting client businesses and assessing risk',
  'Collecting and remitting loan repayments to the office',
  'Supervising field operations and verifying loan authenticity'
];

type AffectedClient = {
  id: string;
  name: string;
  date: string;
  amount: string;
  remarks: string;
};

export default function LegalPage() {
  const [cases, setCases] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [loans, setLoans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Synchronized Data Loading
  useEffect(() => {
    const loadAllData = async () => {
      try {
        setLoading(true);
        const [casesRes, clientsRes, staffRes, loansRes] = await Promise.all([
          api.getLegalCases(),
          api.getClients(),
          api.getStaff(),
          api.getLoans()
        ]);
        setCases(casesRes.data || []);
        setClients(clientsRes.data || []);
        setStaff(staffRes.data || []);
        setLoans(loansRes.data || []);
      } catch (err) {
        console.error("Legal Hub Sync Error:", err);
      } finally {
        setLoading(false);
      }
    };
    loadAllData();
  }, []);

  const [currency, setCurrency] = React.useState<string>('UGX');
  const [selectedCase, setSelectedCase] = React.useState<any>(null);
  const [detail, setDetail] = React.useState<any>(null);
  
  // Court Report Generator State
  const [subject, setSubject] = React.useState<string>('Fraud, Theft, Ghost Loans, and Gross Misconduct Investigation');
  const [branchLocation, setBranchLocation] = React.useState<string>('Luzira Trading Centre, Nakawa - Kampala');
  const [supervisorName, setSupervisorName] = React.useState<string>('');
  const [auditPeriod, setAuditPeriod] = React.useState<string>('01 April 2026 to 12 May 2026');
  const [reportType, setReportType] = React.useState<string>('Internal Audit Investigation Report');
  const [claimantName] = React.useState<string>('Mr. Niwagaba Felex');
  const [guarantorName, setGuarantorName] = React.useState<string>('');
  
  const [executiveSummary, setExecutiveSummary] = React.useState<string>('Internal Audit conducted an investigation into suspected fraud and operational misconduct. The investigation established that the auditee intentionally failed to remit field loan repayments and converted funds for personal use, resulting in a confirmed shortage.');
  const [auditFindings, setAuditFindings] = React.useState<string>('During the verification exercise, clients confirmed they did not receive the funds documented. Signatures on the loan agreements were found to be forged. The auditee was unable to account for the missing cash.');
  const [causeOfShortage, setCauseOfShortage] = React.useState<string>('Weak client verification controls, poor segregation of duties, and inadequate field supervision.');
  const [impactOfNegligence, setImpactOfNegligence] = React.useState<string>('These actions caused severe financial loss and reputational damage to the institution.');
  const [recommendations, setRecommendations] = React.useState<string>('1. Immediate recovery efforts should be initiated.\n2. Field officers must not disburse funds without supervision.\n3. Conduct surprise field audits regularly.');
  const [staffResponsibilitiesText, setStaffResponsibilitiesText] = React.useState<string>('1. Recruiting and onboarding clients.\n2. Inspecting client businesses and assessing risk.\n3. Collecting and remitting loan repayments to the office.');
  
  const [selectedClients, setSelectedClients] = React.useState<AffectedClient[]>([]);
  const [clientSearch, setClientSearch] = React.useState('');
  
  const [auditees, setAuditees] = React.useState<string[]>([]);
  const [reportAmount, setReportAmount] = React.useState<number>(0);
  const [showGenerator, setShowGenerator] = React.useState(false);
  const [reportRef, setReportRef] = React.useState<string>('');
  const [, setGeneratorSearch] = React.useState('');
  const [, setShowGeneratorResults] = React.useState(false);
  
  // Missing Legal/Audit Details State
  const [loanNumber, setLoanNumber] = React.useState<string>('');
  const [loanBalance, setLoanBalance] = React.useState<number>(0);
  const [loanDate, setLoanDate] = React.useState<string>('');
  const [borrowerAddress, setBorrowerAddress] = React.useState<string>('');
  const [borrowerPhone, setBorrowerPhone] = React.useState<string>('');
  const [borrowerNIN, setBorrowerNIN] = React.useState<string>('');
  const [recipientName, setRecipientName] = React.useState<string>('');
  const [recipientPhone, setRecipientPhone] = React.useState<string>('');
  const [guarantorNIN, setGuarantorNIN] = React.useState<string>('');
  const [guarantorPhone, setGuarantorPhone] = React.useState<string>('');
  const [guarantorAddress, setGuarantorAddress] = React.useState<string>('');
  const [dateReceived] = React.useState<string>(new Date().toISOString().split('T')[0]);
  const [recipientType] = React.useState<string>('Staff / Auditee');
  const [deadlineDate, setDeadlineDate] = React.useState<string>('');
  const [collateralDetails, setCollateralDetails] = React.useState<string>('');
  const [collateralType, setCollateralType] = React.useState<string>('Personal Property');
  const [collateralSerial, setCollateralSerial] = React.useState<string>('');
  const [collateralValue, setCollateralValue] = React.useState<string>('');
  const [collateralLocation, setCollateralLocation] = React.useState<string>('');
  const [paymentDetails, setPaymentDetails] = React.useState<string>('');

  // New Draft Templates State
  const [activeDraftTemplate, setActiveDraftTemplate] = React.useState<string | null>(null);

  // Draft 1: Loan Statement
  const [stmtAcNo, setStmtAcNo] = React.useState('255323102877201');
  const [stmtCurrency, setStmtCurrency] = React.useState('UGX');
  const [stmtProduct, setStmtProduct] = React.useState('Pride Boda Boda loan - ILS');
  const [stmtCustName, setStmtCustName] = React.useState('');
  const [stmtCustAddr, setStmtCustAddr] = React.useState('');
  const [stmtUnappliedFunds, setStmtUnappliedFunds] = React.useState(0);
  const [stmtLedgerBalance, setStmtLedgerBalance] = React.useState(2468578.33);
  const [stmtUnclearedBalance, setStmtUnclearedBalance] = React.useState(0);
  const [stmtInterestPrePaid, setStmtInterestPrePaid] = React.useState(201396.6);
  const [stmtInterestAccrued, setStmtInterestAccrued] = React.useState(-7419974.93);
  const [stmtChargePayOff, setStmtChargePayOff] = React.useState(-4750000);
  const [stmtClearedBalance, setStmtClearedBalance] = React.useState(-4750000);
  const [stmtPrincipalBalance, setStmtPrincipalBalance] = React.useState(-4750000);
  const [stmtTransactions, setStmtTransactions] = React.useState<any[]>([
    { postDate: '2026-04-23', valueDate: '2026-04-23', ref: '17506957782310002602', desc: 'Loan Disbursement Debit', debit: 5730000, credit: 0, balance: -5730000 },
    { postDate: '2026-04-23', valueDate: '2026-04-23', ref: '17506957782310002602', desc: 'Insurance Fee', debit: 60000, credit: 0, balance: -5790000 },
    { postDate: '2026-04-23', valueDate: '2026-04-23', ref: '17506957782310002602', desc: 'Loan Processing Fees', debit: 180000, credit: 0, balance: -5970000 },
    { postDate: '2026-04-23', valueDate: '2026-04-23', ref: '17506957782310002602', desc: 'Stamp Duty Charges', debit: 30000, credit: 0, balance: -6000000 },
    { postDate: '2026-04-24', valueDate: '2026-04-24', ref: '17532531641630118294', desc: 'Loan Repayment - Interest', debit: 0, credit: 9519.61, balance: -6000000 },
    { postDate: '2026-04-25', valueDate: '2026-04-25', ref: '17534521293250017714', desc: 'Loan Repayment - Interest', debit: 0, credit: 100000, balance: -6000000 },
    { postDate: '2026-04-27', valueDate: '2026-04-27', ref: '17538687387370132578', desc: 'Loan Repayment - Principal', debit: 0, credit: 179519.61, balance: -5820480.39 },
    { postDate: '2026-04-27', valueDate: '2026-04-27', ref: '17538687387370132578', desc: 'Loan Repayment - Interest', debit: 0, credit: 20480.39, balance: -5820480.39 },
    { postDate: '2026-04-28', valueDate: '2026-04-28', ref: '17539657564720543596', desc: 'Loan Repayment - Principal', debit: 0, credit: 66400, balance: -5754080.39 },
    { postDate: '2026-04-29', valueDate: '2026-04-29', ref: '17539762013260558609', desc: 'Loan Repayment - Principal', debit: 0, credit: 4080.39, balance: -5750000 }
  ]);

  const loadClientStatementData = async (clientName: string) => {
    const cl = clients.find(c => `${c.first_name} ${c.last_name}` === clientName);
    if (!cl) return;

    setStmtCustName(`${cl.first_name} ${cl.last_name}`);
    setStmtCustAddr(cl.home_address || `${cl.village || ''}, ${cl.sub_county || ''}, ${cl.district || ''}`);

    try {
      const loansRes = await api.getLoans();
      const clientLoans = (loansRes.data || []).filter((l: any) => l.client_id === cl.id);
      
      const activeLoan = clientLoans.find((l: any) => l.status === 'active') || clientLoans[0];
      if (activeLoan) {
        const detailRes = await api.getLoanById(activeLoan.id);
        const loanDetails = detailRes.data;
        if (loanDetails) {
          setStmtAcNo(loanDetails.loan_number || 'N/A');
          setStmtCurrency('UGX');
          setStmtProduct(loanDetails.loan_type === 'monthly' ? 'Monthly Microfinance Loan' : 'Standard Term Loan');
          setStmtUnappliedFunds(0);

          const outstanding = Number(loanDetails.outstanding_balance) || 0;
          const totalRepayable = Number(loanDetails.total_repayable) || 0;
          const principalAmt = Number(loanDetails.principal_amount) || 0;
          const interestAmt = Number(loanDetails.interest_amount) || 0;

          setStmtLedgerBalance(outstanding);
          setStmtUnclearedBalance(0);
          setStmtInterestPrePaid(0);
          setStmtInterestAccrued(-interestAmt);
          setStmtChargePayOff(-outstanding);
          setStmtClearedBalance(-outstanding);
          setStmtPrincipalBalance(-outstanding);

          const mappedTx: any[] = [];
          let currentBalance = -totalRepayable;

          // 1. Disbursement
          mappedTx.push({
            postDate: loanDetails.disbursed_at?.split('T')[0] || loanDetails.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
            valueDate: loanDetails.disbursed_at?.split('T')[0] || loanDetails.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
            ref: loanDetails.loan_number,
            desc: 'Loan Disbursement Debit',
            debit: totalRepayable,
            credit: 0,
            balance: currentBalance
          });

          // 2. Repayments
          if (loanDetails.payments && loanDetails.payments.length > 0) {
            const sortedPayments = [...loanDetails.payments].sort((a: any, b: any) => 
              new Date(a.payment_date).getTime() - new Date(b.payment_date).getTime()
            );

            sortedPayments.forEach((p: any) => {
              const amt = Number(p.amount_paid) || 0;
              currentBalance += amt;
              mappedTx.push({
                postDate: p.payment_date?.split('T')[0] || new Date().toISOString().split('T')[0],
                valueDate: p.payment_date?.split('T')[0] || new Date().toISOString().split('T')[0],
                ref: p.id || 'N/A',
                desc: `Loan Repayment (${p.payment_method || 'cash'})`,
                debit: 0,
                credit: amt,
                balance: currentBalance
              });
            });
          }

          setStmtTransactions(mappedTx);
        }
      } else {
        setStmtAcNo('N/A');
        setStmtLedgerBalance(0);
        setStmtUnclearedBalance(0);
        setStmtInterestPrePaid(0);
        setStmtInterestAccrued(0);
        setStmtChargePayOff(0);
        setStmtClearedBalance(0);
        setStmtPrincipalBalance(0);
        setStmtTransactions([]);
      }
    } catch (err) {
      console.error('Error loading statement data:', err);
    }
  };

  // Draft 2: Loan Application
  const [appDate, setAppDate] = React.useState(new Date().toISOString().split('T')[0]);
  const [appLoanTakenDate, setAppLoanTakenDate] = React.useState(new Date().toISOString().split('T')[0]);
  const [appClientName, setAppClientName] = React.useState('');
  const [appClientNIN, setAppClientNIN] = React.useState('');
  const [appClientID, setAppClientID] = React.useState('');
  const [appClientResAddr, setAppClientResAddr] = React.useState('');
  const [appClientBusAddr, setAppClientBusAddr] = React.useState('');
  const [appClientTel, setAppClientTel] = React.useState('');
  const [appClientBusType, setAppClientBusType] = React.useState('Retail Shop');
  const [appAmountApplied, setAppAmountApplied] = React.useState(1500000);
  const [appAmountApproved, setAppAmountApproved] = React.useState(1500000);
  const [appSecurityConsent, setAppSecurityConsent] = React.useState('Motorcycle');
  const [appItemName, setAppItemName] = React.useState('Bajaj Boxer Motorcycle');
  const [appItemQuantity, setAppItemQuantity] = React.useState(1);
  const [appItemSpecifics, setAppItemSpecifics] = React.useState('Frame No: MD625AA..., Engine No: DU102...');
  const [appGuarantorName, setAppGuarantorName] = React.useState('');
  const [appGuarantorTel, setAppGuarantorTel] = React.useState('');
  const [appGuarantorLoc, setAppGuarantorLoc] = React.useState('');
  const [appNextOfKinName, setAppNextOfKinName] = React.useState('');
  const [appNextOfKinTel, setAppNextOfKinTel] = React.useState('');
  const [appNextOfKinLoc, setAppNextOfKinLoc] = React.useState('');
  const [appChairpersonName, setAppChairpersonName] = React.useState('Kakooza Joseph');
  const [appChairpersonTel, setAppChairpersonTel] = React.useState('+256772888999');
  const [appLCIDefenseName, setAppLCIDefenseName] = React.useState('Ssemuwemba Paul');
  const [appLCIDefenseTel, setAppLCIDefenseTel] = React.useState('+256701777666');
  const [appStaffName, setAppStaffName] = React.useState('');

  // Draft 3 & 4: Staff Contracts
  const [contractDate, setContractDate] = React.useState(new Date().toISOString().split('T')[0]);
  const [contractStaffName, setContractStaffName] = React.useState('');
  const [contractStaffID, setContractStaffID] = React.useState('');
  const [contractRepName, setContractRepName] = React.useState('Mr. Niwagaba Felex');
  const [contractRepDesignation, setContractRepDesignation] = React.useState('Managing Director');
  const [contractWitnessName, setContractWitnessName] = React.useState('Sarah Nambi');
  const [contractStation, setContractStation] = React.useState('Lukuli, Makindye');
  
  // Custom Loans Consultant specifics
  const [contractCommission, setContractCommission] = React.useState(13);
  const [contractFoodMin, setContractFoodMin] = React.useState(5000);
  const [contractFoodMax, setContractFoodMax] = React.useState(20000);

  const generateDraftDocument = (type: string) => {
    const numberToWordsLocal = (num: number): string => {
      return numberToWords(num);
    };

    if (type === 'statement') {
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        alert("Please allow popups to generate the statement.");
        return;
      }
      const totalCredit = stmtTransactions.reduce((acc, t) => acc + (parseFloat(t.credit) || 0), 0);
      const totalDebit = stmtTransactions.reduce((acc, t) => acc + (parseFloat(t.debit) || 0), 0);

      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Detailed Loan Account Statement</title>
            <style>
              @page { size: A4; margin: 1cm; }
              body { font-family: Arial, sans-serif; font-size: 11px; color: #333; margin: 0; padding: 0; line-height: 1.4; }
              .header { display: flex; justify-content: space-between; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
              .bank-title { font-size: 18px; font-weight: bold; color: #1e3a8a; }
              .doc-title { font-size: 14px; font-weight: bold; text-align: right; text-transform: uppercase; }
              .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
              .meta-block table { width: 100%; border-collapse: collapse; }
              .meta-block td { padding: 4px 0; vertical-align: top; }
              .meta-block td.label { font-weight: bold; width: 120px; color: #555; }
              .summary-table { width: 100%; border-collapse: collapse; margin-bottom: 25px; }
              .summary-table th, .summary-table td { border: 1px solid #ddd; padding: 6px 8px; text-align: right; }
              .summary-table th { background-color: #f3f4f6; font-weight: bold; text-align: center; }
              .tx-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
              .tx-table th, .tx-table td { border: 1px solid #ddd; padding: 6px 8px; text-align: left; }
              .tx-table th { background-color: #f3f4f6; font-weight: bold; }
              .tx-table td.amount { text-align: right; }
              .total-row { font-weight: bold; background-color: #f9fafb; }
              .footer { margin-top: 30px; text-align: center; font-size: 9px; color: #777; border-top: 1px solid #ddd; padding-top: 10px; }
            </style>
          </head>
          <body>
            <div class="header">
              <div>
                <div class="bank-title">Pride Bank</div>
                <div style="font-size: 9px; color:#555;">Abayita Ababiri, Entebbe Road, Kampala, Uganda</div>
              </div>
              <div class="doc-title">
                Detailed Loan Account Statement
                <div style="font-size:10px; font-weight:normal; margin-top:4px;">Issue Date: ${new Date().toLocaleString()}</div>
              </div>
            </div>

            <div class="meta-grid">
              <div class="meta-block">
                <table>
                  <tr><td class="label">Customer Name:</td><td><strong>${stmtCustName || 'FELEX NIWAGABA'}</strong></td></tr>
                  <tr><td class="label">Address:</td><td>${stmtCustAddr || 'NALYA, NALYA, Kampala, Uganda'}</td></tr>
                </table>
              </div>
              <div class="meta-block">
                <table>
                  <tr><td class="label">Account Number:</td><td><strong>${stmtAcNo}</strong></td></tr>
                  <tr><td class="label">Currency:</td><td>${stmtCurrency}</td></tr>
                  <tr><td class="label">Loan Product:</td><td>${stmtProduct}</td></tr>
                </table>
              </div>
            </div>

            <table class="summary-table">
              <thead>
                <tr>
                  <th>Unapplied Funds</th>
                  <th>Ledger Balance</th>
                  <th>Uncleared Bal</th>
                  <th>Interest Pre-Paid</th>
                  <th>Interest Accrued</th>
                  <th>Cleared Balance</th>
                  <th>Principal Balance</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>${stmtUnappliedFunds.toFixed(2)}</td>
                  <td>${stmtLedgerBalance.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                  <td>${stmtUnclearedBalance.toFixed(2)}</td>
                  <td>${stmtInterestPrePaid.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                  <td>${stmtInterestAccrued.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                  <td>${stmtClearedBalance.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                  <td>${stmtPrincipalBalance.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                </tr>
              </tbody>
            </table>

            <h3>Statement Ledger Entries</h3>
            <table class="tx-table">
              <thead>
                <tr>
                  <th>Post Date</th>
                  <th>Value Date</th>
                  <th>Reference No.</th>
                  <th>Description</th>
                  <th class="amount">Debit</th>
                  <th class="amount">Credit</th>
                  <th class="amount">Balance</th>
                </tr>
              </thead>
              <tbody>
                ${stmtTransactions.map(t => `
                  <tr>
                    <td>${t.postDate}</td>
                    <td>${t.valueDate}</td>
                    <td>${t.ref}</td>
                    <td>${t.desc}</td>
                    <td class="amount">${t.debit > 0 ? t.debit.toLocaleString(undefined, {minimumFractionDigits: 2}) : '0.00'}</td>
                    <td class="amount">${t.credit > 0 ? t.credit.toLocaleString(undefined, {minimumFractionDigits: 2}) : '0.00'}</td>
                    <td class="amount">${t.balance.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                  </tr>
                `).join('')}
                <tr class="total-row">
                  <td colspan="4" style="text-align: right;">Total / Counts (${stmtTransactions.length}):</td>
                  <td class="amount">${totalDebit.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                  <td class="amount">${totalCredit.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                  <td class="amount">${stmtPrincipalBalance.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                </tr>
              </tbody>
            </table>

            <div class="footer">
              Page 1 of 1 &bull; Pride Microfinance Bank Limited &bull; Smart Microfinance Operating System Generated
            </div>

            <script>window.onload = function() { window.print(); window.close(); }</script>
          </body>
        </html>
      `;
      printWindow.document.write(html);
      printWindow.document.close();
    } else if (type === 'application') {
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        alert("Please allow popups to generate the application.");
        return;
      }

      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Musha Financial Services Loan Application</title>
            <style>
              @page { size: A4; margin: 1.2cm; }
              body { font-family: 'Times New Roman', Times, serif; font-size: 12px; color: #000; margin: 0; padding: 0; line-height: 1.5; }
              .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 8px; margin-bottom: 15px; position: relative; }
              .republic { font-size: 14px; font-weight: bold; text-transform: uppercase; margin-bottom: 2px; }
              .company { font-size: 16px; font-weight: bold; text-transform: uppercase; }
              .row-flex { display: flex; justify-content: space-between; margin-bottom: 8px; }
              .line-fill { border-bottom: 1px dotted #000; flex: 1; margin-left: 5px; min-height: 18px; }
              .section-title { font-weight: bold; font-size: 13px; text-transform: uppercase; margin: 15px 0 8px; border-bottom: 1px solid #000; padding-bottom: 2px; }
              .terms-list { padding-left: 20px; margin: 8px 0; }
              .terms-list li { margin-bottom: 6px; text-align: justify; }
              .signatures-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; margin-top: 15px; }
              .sig-card { border: 1px solid #000; padding: 8px; font-size: 10px; }
              .sig-title { font-weight: bold; border-bottom: 1px solid #000; padding-bottom: 4px; margin-bottom: 6px; text-transform: uppercase; }
              .approval-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
              .approval-table td { border: 1px solid #000; padding: 6px; }
              .approval-table td.label { font-weight: bold; background-color: #f2f2f2; width: 140px; }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="republic">THE REPUBLIC OF UGANDA</div>
              <div class="company">MUSHA FINANCIAL SERVICES LTD LOAN APPLICATION FORM</div>
              <div style="font-size: 10px; margin-top: 4px;">P.O. Box, Kampala, Uganda &bull; Tel: +256 701 000 111</div>
            </div>

            <div style="display: flex; justify-content: space-between; margin-bottom: 15px;">
              <div style="width: 60%;">
                <div style="display:flex; margin-bottom: 6px;">Application Date: <span class="line-fill">${appDate}</span></div>
                <div style="display:flex;">Loan Taken Date: <span class="line-fill">${appLoanTakenDate}</span></div>
              </div>
              <div style="display:flex; gap: 10px;">
                <div style="width: 80px; height: 80px; border: 1px solid #000; text-align: center; font-size: 8px; display: flex; flex-direction:column; justify-content: center; align-items: center; background-color: #fafafa;">
                  <span>Client's</span><span>Passport Photo</span>
                </div>
                <div style="width: 80px; height: 80px; border: 1px solid #000; text-align: center; font-size: 8px; display: flex; flex-direction:column; justify-content: center; align-items: center; background-color: #fafafa;">
                  <span>Guarantor's</span><span>Passport Photo</span>
                </div>
              </div>
            </div>

            <div class="section-title">Particulars of the Client</div>
            <div style="display:flex; margin-bottom: 6px;">Name: <span class="line-fill"><strong>${appClientName}</strong></span></div>
            <div style="display:flex; gap: 15px; margin-bottom: 6px;">
              <div style="display:flex; flex:1;">NIN: <span class="line-fill">${appClientNIN}</span></div>
              <div style="display:flex; flex:1;">ID Number: <span class="line-fill">${appClientID}</span></div>
            </div>
            <div style="display:flex; gap: 15px; margin-bottom: 6px;">
              <div style="display:flex; flex:1;">Residential Address: <span class="line-fill">${appClientResAddr}</span></div>
              <div style="display:flex; flex:1;">Business Address: <span class="line-fill">${appClientBusAddr}</span></div>
            </div>
            <div style="display:flex; gap: 15px; margin-bottom: 6px;">
              <div style="display:flex; flex:1;">Tel: <span class="line-fill">${appClientTel}</span></div>
              <div style="display:flex; flex:1;">Business Type: <span class="line-fill">${appClientBusType}</span></div>
            </div>

            <div class="section-title">Loan Particulars</div>
            <div style="display:flex; margin-bottom: 6px;">Amount Applied for (UGX): <span class="line-fill"><strong>${appAmountApplied.toLocaleString()}</strong></span></div>
            <div style="display:flex; margin-bottom: 6px;">Amount Applied for in words: <span class="line-fill"><em>Uganda Shillings ${numberToWordsLocal(appAmountApplied)} Only</em></span></div>
            <div style="display:flex; margin-bottom: 6px;">Amount Approved (UGX): <span class="line-fill"><strong>${appAmountApproved.toLocaleString()}</strong></span></div>
            <div style="display:flex; margin-bottom: 6px;">Amount Approved in words: <span class="line-fill"><em>Uganda Shillings ${numberToWordsLocal(appAmountApproved)} Only</em></span></div>

            <div class="section-title">Client Security Details and Consent</div>
            <p style="text-align: justify; margin: 0 0 8px 0;">
              I, <span style="text-decoration: underline; font-weight: bold;">${appClientName}</span>, consent that this <strong>${appSecurityConsent}</strong> is my independent property and I voluntarily, soberly agree to transfer ownership to Musha Financial Services Ltd for the services offered. The evidence of property ownership is here attached.
            </p>
            <div style="display:flex; gap: 15px; margin-bottom: 6px;">
              <div style="display:flex; flex:3;">Item Name/Model: <span class="line-fill">${appItemName}</span></div>
              <div style="display:flex; flex:1;">Quantity: <span class="line-fill">${appItemQuantity}</span></div>
            </div>
            <div style="display:flex; margin-bottom: 8px;">Item Specifics (e.g. Serial, Engine, Reg No.): <span class="line-fill">${appItemSpecifics}</span></div>
            
            <p style="text-align: justify; margin: 8px 0 0 0;">
              I agree that Musha Financial Services Ltd is free to pick their property whenever they feel its unsecure or in any circumstance of breach of relationship.
            </p>

            <div style="page-break-before: always;"></div>

            <div class="section-title">Guarantor / Next of Kin Details</div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
              <div>
                <div style="font-weight:bold; margin-bottom:4px;">Next of Kin</div>
                <div style="display:flex; margin-bottom:4px;">Name: <span class="line-fill">${appNextOfKinName}</span></div>
                <div style="display:flex; margin-bottom:4px;">Location: <span class="line-fill">${appNextOfKinLoc}</span></div>
                <div style="display:flex; margin-bottom:4px;">Tel: <span class="line-fill">${appNextOfKinTel}</span></div>
              </div>
              <div>
                <div style="font-weight:bold; margin-bottom:4px;">Guarantor</div>
                <div style="display:flex; margin-bottom:4px;">Name: <span class="line-fill">${appGuarantorName}</span></div>
                <div style="display:flex; margin-bottom:4px;">Location: <span class="line-fill">${appGuarantorLoc}</span></div>
                <div style="display:flex; margin-bottom:4px;">Tel: <span class="line-fill">${appGuarantorTel}</span></div>
              </div>
            </div>

            <div class="section-title">Terms and Conditions</div>
            <ol class="terms-list">
              <li>The Loan shall be paid on a daily basis within a period of Thirty (30) days from the date it is granted.</li>
              <li>The Guarantor shall be liable for the loan payment and liable to all consequences of the loan in case the guarantee fails to pay the loan as per agreed terms and conditions.</li>
              <li>Failure of the client to pay the loan in the period of 30 days, the loan balance shall be applied or penalty incorporated accordingly.</li>
              <li>Total Failure to pay the Loan; the guarantor, next of kin and client shall be sued.</li>
              <li>The collateral put by the client shall be taken with or without notification from any of the parties. Musha Financial Services Ltd shall not be liable for security items' damage or loss.</li>
            </ol>

            <div class="section-title">Declaration & Consent</div>
            <p style="font-style:italic; margin-bottom: 10px;">I agree that I have read, understood and ready to comply with the terms and conditions above.</p>
            <div class="signatures-grid">
              <div class="sig-card">
                <div class="sig-title">Client</div>
                <div>Name: ${appClientName}</div>
                <div style="margin-top: 15px; border-top: 1px dashed #000; padding-top: 2px;">Signature & Date</div>
              </div>
              <div class="sig-card">
                <div class="sig-title">Guarantor</div>
                <div>Name: ${appGuarantorName}</div>
                <div style="margin-top: 15px; border-top: 1px dashed #000; padding-top: 2px;">Signature & Date</div>
              </div>
              <div class="sig-card">
                <div class="sig-title">Next of Kin</div>
                <div>Name: ${appNextOfKinName}</div>
                <div style="margin-top: 15px; border-top: 1px dashed #000; padding-top: 2px;">Signature & Date</div>
              </div>
            </div>

            <div class="section-title">Certificate of Translation</div>
            <p style="text-align: justify; margin: 0 0 10px 0;">
              I, <span style="border-bottom: 1px solid #000; font-weight: bold;">${appClientName}</span>, consent that the details of this agreement have been translated in my local language and well understood. 
              <br><span style="display:inline-block; margin-top:10px; border-top: 1px dashed #000; width: 200px; font-size: 10px;">Signature / Thumbprint & Date</span>
            </p>

            <div class="section-title">Residential and Business Location Local Council I Approval</div>
            <table style="width: 100%; border: 1px solid #000; border-collapse: collapse; font-size: 11px;">
              <tr>
                <td style="border: 1px solid #000; padding: 6px; width: 50%;">
                  <strong>Chairperson LCI Approval:</strong><br><br>
                  Name: ${appChairpersonName}<br>
                  Tel: ${appChairpersonTel}<br><br>
                  <div style="border-top: 1px dashed #000; padding-top: 2px; font-size: 9px; margin-top: 10px;">Signature, Date & Stamp</div>
                </td>
                <td style="border: 1px solid #000; padding: 6px; width: 50%;">
                  <strong>LCI Secretary for Defense Approval:</strong><br><br>
                  Name: ${appLCIDefenseName}<br>
                  Tel: ${appLCIDefenseTel}<br><br>
                  <div style="border-top: 1px dashed #000; padding-top: 2px; font-size: 9px; margin-top: 10px;">Signature & Date</div>
                </td>
              </tr>
            </table>

            <div class="section-title">Musha Financial Services Ltd Loan Approval</div>
            <table class="approval-table">
              <tr>
                <td class="label">Officer Staff Name:</td>
                <td>${appStaffName || '__________________________________'}</td>
                <td class="label">Officer Signature:</td>
                <td>__________________________________</td>
              </tr>
              <tr>
                <td class="label">Effective Date of Loan:</td>
                <td>${appLoanTakenDate}</td>
                <td class="label">Loan Maturity Date:</td>
                <td>${appLoanTakenDate ? new Date(new Date(appLoanTakenDate).setDate(new Date(appLoanTakenDate).getDate() + 30)).toISOString().split('T')[0] : '______________________'}</td>
              </tr>
            </table>

            <script>window.onload = function() { window.print(); window.close(); }</script>
          </body>
        </html>
      `;
      printWindow.document.write(html);
      printWindow.document.close();
    } else if (type === 'loans_contract' || type === 'office_contract') {
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        alert("Please allow popups to generate the contract.");
        return;
      }

      const isLoans = type === 'loans_contract';
      const contractTitle = isLoans ? 'Loans Consultant' : 'Office Management Consultant';
      const contractorIDLabel = isLoans ? 'Loans Consultant Contractor ID' : 'Office Management Contractor ID';

      const compensationSection = isLoans ? `
        <ul>
          <li>The Contractor’s remuneration shall be based on the profits earned from the loans managed, whereby the Contractor will receive <strong>${contractCommission}%</strong> of the net monthly profits generated from their portfolio.</li>
          <li>Additionally, the Contractor shall receive a daily food allowance ranging from <strong>UGX ${contractFoodMin.toLocaleString()}</strong> to <strong>UGX ${contractFoodMax.toLocaleString()}</strong>, subject to the growth of cash-inflow attributed to their loan management.</li>
          <li>The Contractor shall be held liable for any financial losses caused by negligence, fraud, or theft attributable to their actions or omissions. Any such fraud or theft shall be subject to legal proceedings under the courts of law of Uganda.</li>
        </ul>
      ` : `
        <ul>
          <li>The Contractor’s remuneration shall be based on a mutually agreed arrangement, reflecting the scope and performance of their office and cashier management duties.</li>
          <li>The Contractor shall be held liable for any financial losses caused by negligence, fraud, or theft attributable to their actions or omissions. Any such fraud or theft shall be subject to legal proceedings under the courts of law of Uganda.</li>
        </ul>
      `;

      const scopeSection = isLoans ? `
        <ul>
          <li>Processing client loan applications;</li>
          <li>Verifying and assessing client information and financial capability;</li>
          <li>Conducting due diligence including site visits of business premises, residential addresses, and guarantors;</li>
          <li>Approving or recommending loan applications based on thorough verification;</li>
          <li>Managing and responsibly disbursing funds entrusted to the Contractor for client loans, ensuring the funds are used to grow the Institution’s portfolio without causing losses;</li>
          <li>Collection of the Loan Repayments while ensuring growth of the cash flows.</li>
        </ul>
      ` : `
        <ul>
          <li>Ensuring the smooth and efficient operation of the office and monitoring the performance of all contractors involved in loan processing and disbursement;</li>
          <li>Overseeing and managing loan disbursements to ensure timely, accurate, and secure handling of funds;</li>
          <li>Monitoring and safeguarding company finances related to loan disbursement and collections;</li>
          <li>Performing cashier duties, including handling cash inflows and outflows, recording transactions, and reconciling cash balances;</li>
          <li>Preparing and submitting daily and weekly operational and financial reports to management;</li>
          <li>Reporting any misconduct, negligence, fraud, or financial irregularities observed among contractors or staff;</li>
          <li>Coordinating with contractors to ensure compliance with institutional policies and procedures regarding loans and finance management.</li>
        </ul>
      `;

      const diligenceSection = isLoans ? `
        <ul>
          <li>All loan applications processed have been personally verified and assessed for financial capability and authenticity.</li>
          <li>Business premises, residential addresses, and guarantors associated with loan applicants have been inspected and verified.</li>
          <li>Guarantors’ financial standings have been confirmed to ensure their capacity to cover loan obligations in case of default.</li>
          <li>All submitted documents, income statements, collateral, and related information have been checked for authenticity and accuracy.</li>
        </ul>
      ` : `
        <ul>
          <li>Active oversight of all loan disbursement activities to ensure accuracy, legitimacy, and compliance with the Institution’s guidelines.</li>
          <li>Vigilant safeguarding of company finances and proper cashiering practices.</li>
          <li>Timely and accurate preparation of reports reflecting daily and weekly office activities, loan disbursement status, and financial reconciliations.</li>
          <li>Prompt reporting of any irregularities, misconduct, or breaches of policy by contractors or staff.</li>
        </ul>
      `;

      const formattedDate = new Date(contractDate).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
      const dayWords = new Date(contractDate).getDate();
      const monthWords = new Date(contractDate).toLocaleString('en-US', { month: 'long' });
      const yearWords = new Date(contractDate).getFullYear();

      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Independent Contractor Agreement - ${contractStaffName}</title>
            <style>
              @page { size: A4; margin: 1.2cm; }
              body { font-family: 'Times New Roman', Times, serif; font-size: 12px; color: #000; margin: 0; padding: 0; line-height: 1.6; text-align: justify; }
              .header-title { font-size: 16px; font-weight: bold; text-align: center; text-transform: uppercase; margin-bottom: 2px; }
              .header-sub { font-size: 14px; font-weight: bold; text-align: center; text-transform: uppercase; margin-bottom: 20px; }
              .section-title { font-weight: bold; font-size: 12px; margin: 15px 0 5px 0; text-transform: uppercase; }
              ul { margin: 5px 0 10px 20px; padding: 0; }
              li { margin-bottom: 6px; }
              .sig-block { margin-top: 40px; display: grid; grid-template-columns: 1fr; gap: 30px; }
              .sig-row { display: flex; justify-content: space-between; margin-top: 10px; }
              .sig-col { width: 45%; }
              .sig-line { border-top: 1px solid #000; margin-top: 40px; padding-top: 4px; font-weight: bold; }
            </style>
          </head>
          <body>
            <div class="header-title">INDEPENDENT CONTRACTOR AGREEMENT</div>
            <div class="header-sub">(${contractTitle})</div>

            <p>
              This Independent Contractor Agreement ("Agreement") is made and entered into this 
              <strong>${dayWords}</strong> day of <strong>${monthWords}</strong>, <strong>${yearWords}</strong>, by and between:
            </p>
            <p>
              <strong>Byax Financial Services Ltd</strong>, a duly registered financial institution, having its principal office at 
              <strong>Lukuli, Makindye</strong> (hereinafter referred to as the "Institution"),
            </p>
            <p>AND</p>
            <p>
              <strong>${contractStaffName || '___________________________________________'}</strong>, an independent contractor engaged as a 
              <strong>${contractTitle}</strong>, holding contractor identification number <strong>${contractStaffID || '________________'}</strong>, 
              and stationed at <strong>${contractStation}</strong> (hereinafter referred to as the "Contractor").
            </p>

            <div class="section-title">1. Scope of Work</div>
            <p>The Contractor agrees to provide ${isLoans ? 'loans disbursement management' : 'office management and loan disbursement oversight'} services to the Institution, including but not limited to:</p>
            ${scopeSection}

            <div class="section-title">2. Independent Contractor Status</div>
            <ul>
              <li>The Contractor shall perform services as an independent contractor and not as an employee, partner, or agent of the Institution.</li>
              <li>The Contractor shall be responsible for all taxes, insurance, and benefits associated with their services.</li>
              <li>The Contractor has no authority to bind the Institution or act on its behalf except as expressly authorized in writing.</li>
            </ul>

            <div class="section-title">3. Verification and Due Diligence</div>
            <p>The Contractor affirms and guarantees the following standards of professional conduct:</p>
            ${diligenceSection}

            <div style="page-break-before: always;"></div>

            <div class="section-title">4. Financial Responsibility and Compensation</div>
            <p>The financial relationship and corresponding remuneration of this engagement are defined below:</p>
            ${compensationSection}

            <div class="section-title">5. Liability and Accountability</div>
            <ul>
              <li>The Contractor acknowledges responsibility for ensuring office operations and loan processes under their care are conducted properly, securely, and in accordance with institutional guidelines.</li>
              <li>The Contractor understands that disciplinary and legal actions, including financial recovery measures, may be taken by the Institution in cases of negligence, fraud, misconduct, or breach of duties.</li>
            </ul>

            <div class="section-title">6. Term and Termination</div>
            <ul>
              <li>This Agreement shall commence on the date signed below and shall continue until terminated by either party with a written notice of at least thirty (30) days.</li>
              <li>The Institution shall not terminate this Agreement unless the Contractor has failed to deliver on their obligations and promises as agreed.</li>
              <li>This Agreement shall immediately cease to stand if either party reasonably feels insecure or unsafe regarding the continuation of the professional relationship.</li>
              <li>Neither party may terminate this Agreement immediately without prior written notice outlining the cause.</li>
            </ul>

            <div class="section-title">7. Confidentiality</div>
            <ul>
              <li>The Contractor agrees to maintain strict confidentiality of all client profiles, loan history, financial data, and Institution proprietary systems obtained during this engagement.</li>
            </ul>

            <div class="section-title">8. Governing Law</div>
            <p>This Agreement shall be governed by and construed in accordance with the laws of the Republic of Uganda.</p>

            <div class="section-title">9. Consent and Acceptance</div>
            <p>By signing below, the Contractor acknowledges full understanding and acceptance of all terms, responsibilities, and liabilities outlined herein.</p>

            <div class="sig-block">
              <div class="sig-row">
                <div class="sig-col">
                  <div class="sig-line">CONTRACTOR (${contractTitle})</div>
                  <div>Name: ${contractStaffName}</div>
                  <div>Contractor ID: ${contractStaffID}</div>
                  <div>Date: ____ / ____ / 202__</div>
                </div>
                <div class="sig-col">
                  <div class="sig-line">FOR BYAX FINANCIAL SERVICES LTD</div>
                  <div>Name: \dots \dots \dots \dots \dots \dots \dots \dots \dots \dots \dots \dots \dots \dots</div>
                  <div>Designation: ${contractRepName} (${contractRepDesignation})</div>
                  <div>Date: ____ / ____ / 202__</div>
                </div>
              </div>
              <div class="sig-row" style="margin-top: 20px;">
                <div class="sig-col">
                  <div class="sig-line">WITNESS</div>
                  <div>Name: ${contractWitnessName}</div>
                  <div>Signature: ______________________</div>
                  <div>Date: ____ / ____ / 202__</div>
                </div>
              </div>
            </div>

            <script>window.onload = function() { window.print(); window.close(); }</script>
          </body>
        </html>
      `;
      printWindow.document.write(html);
      printWindow.document.close();
    }
  };

  const numberToWords = (num: number): string => {
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];

    if (num === 0) return 'Zero';

    const convert = (n: number): string => {
      let res = '';
      if (n >= 1000000) {
        res += convert(Math.floor(n / 1000000)) + ' Million ';
        n %= 1000000;
      }
      if (n >= 1000) {
        res += convert(Math.floor(n / 1000)) + ' Thousand ';
        n %= 1000;
      }
      if (n >= 100) {
        res += convert(Math.floor(n / 100)) + ' Hundred ';
        n %= 100;
      }
      if (n >= 20) {
        res += tens[Math.floor(n / 10)] + ' ' + ones[n % 10];
      } else if (n >= 10) {
        res += teens[n - 10];
      } else {
        res += ones[n];
      }
      return res.trim();
    };

    return convert(num);
  };
  
  const totalShortageAmount = React.useMemo(() => {
    return selectedClients.reduce((acc, client) => acc + (parseFloat(client.amount) || 0), 0);
  }, [selectedClients]);

  // Sync reportAmount with selectedClients total if it's an internal audit
  React.useEffect(() => {
    if (reportType.includes('Internal Audit') && selectedClients.length > 0) {
      setReportAmount(totalShortageAmount);
    }
  }, [totalShortageAmount, reportType]);

  // Transition between Audit and Legal default wording
  React.useEffect(() => {
    if (reportType.includes('SCP Track')) {
      setSubject('RECOVERY OF LIQUIDATED DEBT UNDER SMALL CLAIMS PROCEDURE');
      setExecutiveSummary('Default on Microfinance Credit Facility / Consolidated Shortage Recovery');
      setAuditFindings('Liquidated debt acknowledgement as per tripartite agreement.');
      setCauseOfShortage('N/A - Formal Recovery');
      setImpactOfNegligence('N/A');
      setRecommendations('Immediate liquidation of outstanding balance within the statutory notice period.');
      setStaffResponsibilitiesText('N/A');
      if (!deadlineDate) setDeadlineDate('FOURTEEN (14) DAYS');
      if (!paymentDetails) setPaymentDetails('MTN MoMo: 0780000000 (Kilimo MF / Niwagaba Felex)');
    } else {
      setSubject('Fraud, Theft, Ghost Loans, and Gross Misconduct Investigation');
      setExecutiveSummary('Internal Audit conducted an investigation into suspected fraud and operational misconduct. The investigation established that the auditee intentionally failed to remit field loan repayments and converted funds for personal use, resulting in a confirmed shortage.');
      setAuditFindings('During the verification exercise, clients confirmed they did not receive the funds documented. Signatures on the loan agreements were found to be forged. The auditee was unable to account for the missing cash.');
      setCauseOfShortage('Weak client verification controls, poor segregation of duties, and inadequate field supervision.');
      setRecommendations('1. Immediate recovery efforts should be initiated.\n2. Field officers must not disburse funds without supervision.\n3. Conduct surprise field audits regularly.');
      setStaffResponsibilitiesText('1. Recruiting and onboarding clients.\n2. Inspecting client businesses and assessing risk.\n3. Collecting and remitting loan repayments to the office.');
    }
  }, [reportType]);

  const [activeTab, setActiveTab] = React.useState<'cases' | 'calendar' | 'tasks' | 'drafts'>('cases');
  const [showNewCaseModal, setShowNewCaseModal] = React.useState(false);
  const [newCaseData, setNewCaseData] = React.useState({ client_name: '', outstanding_balance: 0, status: 'open', description: '', staff_name: '' });

  const load = () => { 
    setLoading(true); 
    api.getLegalCases().then((r: any) => setCases(r.data)).finally(() => setLoading(false)); 
  };
  
  React.useEffect(() => { load(); }, []);

  const viewCase = async (c: any) => {
    setSelectedCase(c);
    try {
      const r: any = await api.getLegalCase(c.id);
      setDetail(r?.data || c);
    } catch (e) {
      setDetail(c);
    }
    
    // Auto-populate loan details from system case data
    if (c.loan_number) setLoanNumber(c.loan_number);
    if (c.outstanding_balance) setLoanBalance(parseFloat(c.outstanding_balance));
    if (c.created_at) setLoanDate(c.created_at.split('T')[0]); 

    // Find and populate Borrower Details from system database
    const borrower = clients.find(cl => 
      `${cl.first_name} ${cl.last_name}`.toLowerCase() === c.client_name.toLowerCase() ||
      cl.national_id === c.national_id
    );

    if (borrower) {
      setBorrowerAddress(borrower.home_address || `${borrower.village || ''}, ${borrower.sub_county || ''}, ${borrower.district || ''}`);
      setBorrowerPhone(borrower.phone_primary || borrower.phone);
      setBorrowerNIN(borrower.national_id);
    }

    // Attempt to find Guarantor details (if linked in case metadata)
    if (c.guarantor_name) setGuarantorName(c.guarantor_name);
    if (c.guarantor_nin) setGuarantorNIN(c.guarantor_nin);
    if (c.guarantor_phone) setGuarantorPhone(c.guarantor_phone);
    if (c.guarantor_address) setGuarantorAddress(c.guarantor_address);
    
    // Set default recipient as the borrower
    setRecipientName(c.client_name);
    setRecipientPhone(c.phone || '');
    
    if (c.staff_name && !auditees.includes(c.staff_name)) {
      setAuditees([c.staff_name]);
    }
  };

  const addAuditee = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val && !auditees.includes(val)) {
      setAuditees([...auditees, val]);
    }
    e.target.value = '';
  };

  const removeAuditee = (name: string) => {
    setAuditees(auditees.filter(a => a !== name));
  };

  const addClient = (c: any) => {
    const name = `${c.first_name} ${c.last_name}`;
    setSelectedClients(prev => {
      if (!prev.find(sc => sc.id === c.id)) {
        return [...prev, { id: c.id, name, date: '', amount: '', remarks: 'Verified Shortage' }];
      }
      return prev;
    });
    setClientSearch('');
  };

  const selectClientForGenerator = (c: any) => {
    // Populate Borrower Info
    setBorrowerAddress(`${c.village || 'N/A'}, ${c.sub_county || 'N/A'}, ${c.district || 'N/A'}`);
    setBorrowerPhone(c.phone || '');
    setBorrowerNIN(c.national_id || '');
    setAuditees([`${c.first_name} ${c.last_name}`]);

    // Find active loan for this client
    const loan = loans.find(l => l.client_id === c.id);
    if (loan) {
      setLoanNumber(loan.loan_number);
      setLoanBalance(loan.outstanding_balance);
      setLoanDate(loan.disbursed_at);
      setReportAmount(loan.outstanding_balance);
    } else {
      setLoanNumber('');
      setLoanBalance(0);
      setLoanDate('');
    }

    setGeneratorSearch(`${c.first_name} ${c.last_name}`);
    setShowGeneratorResults(false);

    // Auto-populate Guarantor if link exists (mock logic)
    if (c.guarantor_id) {
      const g = clients.find(gc => gc.id === c.guarantor_id);
      if (g) {
        setGuarantorName(`${g.first_name} ${g.last_name}`);
        setGuarantorAddress(`${g.village || 'N/A'}, ${g.district || 'N/A'}`);
        setGuarantorNIN(g.national_id || '');
        setGuarantorPhone(g.phone || '');
      }
    } else {
      setGuarantorName('');
      setGuarantorAddress('');
    }
  };

  const updateClient = (id: string, field: keyof AffectedClient, value: string) => {
    setSelectedClients(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  const removeClient = (id: string) => {
    setSelectedClients(prev => prev.filter(c => c.id !== id));
  };

  const generateCourtReport = () => {
    const reportData = {
      todayDate: new Date().toLocaleString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }),
      subject,
      location: branchLocation,
      supervisor: supervisorName || 'UNSPECIFIED',
      auditPeriod,
      reportType,
      execSummary: executiveSummary,
      findings: auditFindings,
      clientCount: selectedClients.length,
      clientsList: selectedClients,
      amount: reportAmount.toLocaleString(),
      cause: causeOfShortage,
      effect: impactOfNegligence,
      recs: recommendations,
      staff: auditees.length > 0 ? auditees.join(', ') : 'UNSPECIFIED',
      ref: reportRef || selectedCase?.case_number || `AUD-${Math.floor(Math.random()*9000)+1000}`,
      claimant: claimantName,
      guarantor: guarantorName || 'N/A',
      borrowerAddr: borrowerAddress || 'UNSPECIFIED',
      borrowerPh: borrowerPhone || 'UNSPECIFIED',
      borrowerNIN: borrowerNIN || 'UNSPECIFIED',
      guarantorAddr: guarantorAddress || 'UNSPECIFIED',
      guarantorPh: guarantorPhone || 'UNSPECIFIED',
      guarantorNIN: guarantorNIN || 'UNSPECIFIED',
      payment: paymentDetails,
      deadline: deadlineDate || 'FOURTEEN (14) DAYS',
      creditorAddr: branchLocation,
      loanNum: loanNumber || 'UNSPECIFIED',
      loanDt: loanDate || 'UNSPECIFIED',
      loanBal: loanBalance.toLocaleString(),
      collateral: collateralDetails || 'UNSPECIFIED',
      collateralType: collateralType || 'Personal Property',
      collateralSerial: collateralSerial || 'N/A',
      collateralValue: collateralValue ? `UGX ${parseFloat(collateralValue).toLocaleString()}` : 'TBD',
      collateralLoc: collateralLocation || 'Luzira / Borrower Residence',
      amountWords: numberToWords(reportAmount),
      currency: currency,
      recType: recipientType,
      recName: recipientName || 'UNSPECIFIED',
      recPhone: recipientPhone || 'UNSPECIFIED',
      recDate: dateReceived,
      amountRaw: reportAmount,
      staffDuties: staffResponsibilitiesText
    };

    // Auto-create legal case in background if it's a formal report
    api.openLegalCase({
      client_name: auditees.length > 0 ? auditees[0] : 'UNSPECIFIED',
      outstanding_balance: reportAmount,
      status: 'escalated',
      description: `${reportType} generated. Reference: ${reportRef || 'N/A'}`,
      staff_name: supervisorName,
      case_number: reportRef || `SMOS-LEGAL-${Math.floor(Math.random() * 900) + 100}`,
    }).then(res => {
      setCases(prev => {
        // Only add if not already there (simple check by name/ref)
        if (prev.find(c => c.case_number === res.data.case_number)) return prev;
        return [res.data, ...prev];
      });
    });



    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert("Please allow popups to generate the audit report.");
      return;
    }

    let documentBody = '';

    if (reportData.reportType === 'Internal Audit Investigation Report') {
      documentBody = `
        <div style="text-align: center; border: 2px solid #000; padding: 10px; margin-bottom: 25px;">
          <div class="company-name" style="margin:0">INTERNAL AUDIT & INVESTIGATION REPORT</div>
        </div>
        
        <table class="meta-table">
          <tr><td class="label">Investigation Ref:</td><td>${reportData.ref}</td></tr>
          <tr><td class="label">Branch / Location:</td><td>${reportData.location}</td></tr>
          <tr><td class="label">Auditee(s) / Subject:</td><td><strong>${reportData.staff}</strong></td></tr>
          <tr><td class="label">Audit Period:</td><td>${reportData.auditPeriod}</td></tr>
          <tr><td class="label">Confirmed Shortage:</td><td><strong style="color:red">${reportData.currency} ${reportData.amount}</strong></td></tr>
        </table>

        <div class="section-title">I. EXECUTIVE SUMMARY</div>
        <div class="content-box" style="background: #f2f2f2; padding: 15px; border: 1px solid #ccc;">
          ${reportData.execSummary.replace(/\n/g, '<br>')}
        </div>

        <div class="section-title">II. DETAILED AUDIT FINDINGS</div>
        <div class="content-box">
          ${reportData.findings.split('\n').filter(l => l.trim()).map(l => `<div class="list-content">${l.match(/^\d+\./) ? l : '• ' + l}</div>`).join('')}
        </div>

        <div class="section-title">III. ROOT CAUSE ANALYSIS</div>
        <div class="content-box">
          ${reportData.cause.split('\n').filter(l => l.trim()).map(l => `<div class="list-content">${l.match(/^\d+\./) ? l : '• ' + l}</div>`).join('')}
        </div>

        <div class="section-title">IV. ACCOUNTABILITY & RESPONSIBILITY</div>
        <div class="content-box">
          Subject Staff: <strong>${reportData.staff}</strong><br>
          Supervisory Oversight: <strong>${reportData.supervisor}</strong>
          <div style="margin-top: 10px;">
            <strong>Assigned Duties & Responsibilities under investigation:</strong>
            ${reportData.staffDuties.split('\n').filter(l => l.trim()).map(l => `<div class="list-content">${l.match(/^\d+\./) ? l : '• ' + l}</div>`).join('')}
          </div>
        </div>

        <div class="section-title">V. DISCIPLINARY & RECOVERY RECOMMENDATIONS</div>
        <div class="content-box">
          Internal Audit recommends the following immediate actions:
          ${reportData.recs.split('\n').map((r, i) => `<div class="list-content"><strong>${r.match(/^\d+\./) ? r : (i+1) + '. ' + r}</strong></div>`).join('')}
        </div>

        <div style="page-break-before: always;"></div>

        <div class="section-title">VI. AUDITOR'S DECLARATION</div>
        <div class="content-box" style="font-style: italic; font-size: 12px; border: 1px dashed #000; padding: 10px;">
          "I declare that this investigation was conducted with full independence. The findings are based on verifiable audit evidence including client ledger reconciliations and field verification exercises."
        </div>

        <div class="footer-sig" style="margin-top: 80px;">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px;">
            <div>
              <div class="sig-line">Manager, Internal Audit</div>
              <div>(Signature & Stamp)</div>
            </div>
            <div style="text-align: right;">
              <div class="sig-line" style="width: 250px; margin-left: auto;">Human Resource Manager</div>
              <div>(Witness)</div>
            </div>
          </div>
        </div>
      `;
    } else if (reportData.reportType === 'Tripartite Recovery Commitment (SCP Track)') {
      documentBody = `
        <div style="text-align: center; border-bottom: 3px solid #000; padding-bottom: 10px; margin-bottom: 20px;">
          <div style="font-size: 20px; font-weight: 900; text-transform: uppercase;">Tripartite Debt Recovery Commitment Agreement</div>
          <div style="font-size: 11px; margin-top: 5px; font-weight: bold;">Prepared in accordance with the Judicature (Small Claims Procedure) Rules of Uganda</div>
        </div>

        <div class="section-title">AGREEMENT DETAILS</div>
        <table class="meta-table">
          <tr><td class="label">Agreement Reference No.</td><td>${reportData.ref}</td></tr>
          <tr><td class="label">Date of Generation</td><td>${reportData.todayDate}</td></tr>
          <tr><td class="label">Recovery Officer / Agent</td><td>${reportData.supervisor}</td></tr>
          <tr><td class="label">Jurisdiction</td><td>Uganda</td></tr>
        </table>

        <div class="section-title">1. PARTIES TO THE AGREEMENT</div>
        <p style="font-size: 12px; margin-bottom: 10px;">This Agreement is entered into by and between the following parties:</p>
        
        <div style="font-weight: bold; font-size: 13px; margin: 10px 0 5px;">1.1 The Borrower</div>
        <table class="meta-table">
          <tr><td class="label">Full Name</td><td>${reportData.staff}</td></tr>
          <tr><td class="label">Physical Address</td><td>${reportData.borrowerAddr}</td></tr>
          <tr><td class="label">Phone Number</td><td>${reportData.borrowerPh}</td></tr>
          <tr><td class="label">National ID (NIN)</td><td>${reportData.borrowerNIN}</td></tr>
        </table>

        <div style="font-weight: bold; font-size: 13px; margin: 15px 0 5px;">1.2 The Guarantor</div>
        <table class="meta-table">
          <tr><td class="label">Full Name</td><td>${reportData.guarantor}</td></tr>
          <tr><td class="label">Physical Address</td><td>${reportData.guarantorAddr}</td></tr>
          <tr><td class="label">Phone Number</td><td>${reportData.guarantorPh}</td></tr>
          <tr><td class="label">National ID (NIN)</td><td>${reportData.guarantorNIN}</td></tr>
        </table>

        <div style="font-weight: bold; font-size: 13px; margin: 15px 0 5px;">1.3 The Creditor</div>
        <table class="meta-table">
          <tr><td class="label">Full Name</td><td>Mr. Niwagaba Felex</td></tr>
          <tr><td class="label">Physical Address</td><td>${reportData.location}</td></tr>
          <tr><td class="label">National ID (NIN)</td><td>CM840391234567</td></tr>
        </table>

        <div style="page-break-before: always;"></div>

        <div class="section-title">2. ACKNOWLEDGEMENT OF DEBT</div>
        <p style="font-size: 12px;">The Borrower and the Guarantor jointly and severally acknowledge that the Borrower is lawfully indebted to the Creditor for monies advanced and/or facilities extended.</p>
        <p style="font-size: 12px;">The parties confirm that the debt stated below is accurate, due, payable, and recoverable.</p>
        
        <div style="font-weight: bold; font-size: 13px; margin: 15px 0 5px; text-transform: uppercase;">Verified Outstanding Facilities</div>
        <table class="table-affected">
          <thead>
            <tr>
              <th>Account / Reference</th>
              <th>Facility Description</th>
              <th class="amount-col">Outstanding Amount (UGX)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>${reportData.loanNum}</td>
              <td>${reportData.execSummary}</td>
              <td class="amount-col">${reportData.amount}</td>
            </tr>
          </tbody>
        </table>

        <div style="margin: 20px 0; padding: 15px; border: 2px solid #000; text-align: center;">
          <div style="font-size: 11px; text-transform: uppercase; font-weight: bold; margin-bottom: 5px;">Total Outstanding Balance</div>
          <div style="font-size: 20px; font-weight: 900;">UGX ${reportData.amount}</div>
          <div style="font-size: 12px; font-style: italic; margin-top: 5px;">(Uganda Shillings ${reportData.amountWords} Only)</div>
        </div>

        <div class="section-title">3. RECOVERY COMMITMENT</div>
        <p style="font-size: 12px;">The Borrower and Guarantor hereby jointly and severally undertake and commit to fully settle the outstanding indebtedness of <strong>UGX ${reportData.amount}</strong> on or before <strong>${reportData.deadline}</strong>.</p>
        <p style="font-size: 12px;">The parties further agree that failure to fully settle the above debt within the agreed period shall constitute default and shall automatically authorize the Creditor to commence recovery proceedings under the Small Claims Procedure without further notice.</p>

        <div class="section-title">3A. COLLATERAL TRANSFER UPON DEFAULT</div>
        <p style="font-size: 12px; font-weight: bold; text-decoration: underline;">The Borrower and Guarantor expressly agree that in the event the outstanding indebtedness is not fully settled by the maturity date stated in this Agreement, ownership and possessory rights over the pledged collateral/security shall immediately and irrevocably transfer to Mr. Niwagaba Felex without further notice or demand.</p>
        <p style="font-size: 12px;">The Borrower and Guarantor further authorize the Creditor to take possession, control, transfer, sell, or otherwise dispose of the collateral for purposes of debt recovery and offsetting the outstanding indebtedness, recovery costs, and related expenses.</p>

        <div style="font-weight: bold; font-size: 13px; margin: 15px 0 5px; text-transform: uppercase;">Collateral Details</div>
        <table class="meta-table">
          <tr><td class="label">Collateral Type</td><td>${reportData.collateralType}</td></tr>
          <tr><td class="label">Description</td><td>${reportData.collateral}</td></tr>
          <tr><td class="label">Serial/Registration No.</td><td>${reportData.collateralSerial}</td></tr>
          <tr><td class="label">Estimated Value</td><td>${reportData.collateralValue}</td></tr>
          <tr><td class="label">Physical Location</td><td>${reportData.collateralLoc}</td></tr>
        </table>

        <div style="page-break-before: always;"></div>

        <div class="section-title">4. DECLARATION</div>
        <ol style="font-size: 12px;">
          <li>The debt acknowledged herein is true and correct.</li>
          <li>The information and KYC details provided are accurate.</li>
          <li>They understand the legal implications of default.</li>
          <li>This Agreement may be produced in court as evidence of indebtedness and commitment to repay.</li>
          <li>The collateral pledged under this Agreement may be recovered and transferred upon default in accordance with Clause 3A above.</li>
        </ol>

        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; margin-top: 40px;">
          <div style="text-align: left; border: 1px solid #000; padding: 10px;">
            <div style="font-weight: bold; border-bottom: 1px solid #000; margin-bottom: 8px; padding-bottom: 5px; text-transform: uppercase;">The Borrower</div>
            <div style="font-size: 10px;">Name: ${reportData.staff}</div>
            <div style="font-size: 10px;">NIN: ${reportData.borrowerNIN}</div>
            <div style="margin-top: 20px; border-top: 1px dashed #000; padding-top: 5px; font-size: 9px;">Signature & Date</div>
          </div>
          <div style="text-align: left; border: 1px solid #000; padding: 10px;">
            <div style="font-weight: bold; border-bottom: 1px solid #000; margin-bottom: 8px; padding-bottom: 5px; text-transform: uppercase;">The Guarantor</div>
            <div style="font-size: 10px;">Name: ${reportData.guarantor}</div>
            <div style="font-size: 10px;">NIN: ${reportData.guarantorNIN}</div>
            <div style="margin-top: 20px; border-top: 1px dashed #000; padding-top: 5px; font-size: 9px;">Signature & Date</div>
          </div>
          <div style="text-align: left; border: 1px solid #000; padding: 10px;">
            <div style="font-weight: bold; border-bottom: 1px solid #000; margin-bottom: 8px; padding-bottom: 5px; text-transform: uppercase;">The Creditor</div>
            <div style="font-size: 10px;">Name: Mr. Niwagaba Felex</div>
            <div style="font-size: 10px;">NIN: CM840391234567</div>
            <div style="margin-top: 20px; border-top: 1px dashed #000; padding-top: 5px; font-size: 9px;">Signature & Stamp</div>
          </div>
        </div>
      `;
    } else if (reportData.reportType === '14-Day Statutory Demand Notice (SCP Track)') {
      documentBody = `
        <div style="text-align: center; border-bottom: 3px solid #000; padding-bottom: 5px; margin-bottom: 10px;">
          <div style="font-size: 18px; font-weight: 900; text-transform: uppercase;">14-Day Statutory Demand Notice</div>
          <div style="font-size: 10px; font-weight: bold; margin-top: 4px;">(Prepared Under the Judicature (Small Claims Procedure) Rules, Uganda)</div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 15px;">
          <div>
            <div class="section-title" style="margin-top:0; font-size: 10px;">FROM THE OFFICE OF:</div>
            <div style="font-weight: 900; font-size: 13px; margin-bottom: 2px;">MR. NIWAGABA FELEX</div>
            <div style="font-size: 9px; line-height: 1.3;">
              ${reportData.location}<br>
              Tel: +256 700 000 000 | Email: felex@kilimomf.co.ug
            </div>
          </div>
          <div>
            <div class="section-title" style="margin-top:0; font-size: 10px;">NOTICE DETAILS</div>
            <table class="data-table" style="font-size: 9px;">
              <tr><td class="label">Ref No.</td><td>${reportData.ref}</td></tr>
              <tr><td class="label">Loan Ref</td><td>${reportData.loanNum}</td></tr>
              <tr><td class="label">Date</td><td>${reportData.todayDate}</td></tr>
              <tr><td class="label">Jurisdiction</td><td>Magistrate Court of Uganda</td></tr>
            </table>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 15px;">
          <div>
            <div class="section-title" style="margin-top:0; font-size: 10px;">TO: BORROWER</div>
            <table class="data-table" style="font-size: 9px;">
              <tr><td class="label">Name</td><td><strong>${reportData.staff}</strong></td></tr>
              <tr><td class="label">Address</td><td>${reportData.borrowerAddr}</td></tr>
              <tr><td class="label">Phone</td><td>${reportData.borrowerPh}</td></tr>
              <tr><td class="label">NIN</td><td>${reportData.borrowerNIN}</td></tr>
            </table>
          </div>
          <div>
            <div class="section-title" style="margin-top:0; font-size: 10px;">COPY TO: GUARANTOR</div>
            <table class="data-table" style="font-size: 9px;">
              <tr><td class="label">Name</td><td><strong>${reportData.guarantor}</strong></td></tr>
              <tr><td class="label">Address</td><td>${reportData.guarantorAddr}</td></tr>
              <tr><td class="label">Phone</td><td>${reportData.guarantorPh}</td></tr>
              <tr><td class="label">NIN</td><td>${reportData.guarantorNIN}</td></tr>
            </table>
          </div>
        </div>

        <div style="border: 2px solid #000; padding: 12px; font-weight: 900; margin-bottom: 25px; text-transform: uppercase; font-size: 13px; text-align: center; background: #f2f2f2;">
          SUBJECT: FINAL 14-DAY STATUTORY DEMAND NOTICE FOR PAYMENT OF ${reportData.currency} ${reportData.amount}
        </div>

        <div style="font-size: 11px; line-height: 1.6; margin-bottom: 25px;">
          Dear ${reportData.staff},<br><br>
          TAKE NOTICE that a review and reconciliation of your loan account confirms that you are indebted in the sum of:
          <div style="font-size: 18px; font-weight: 900; text-align: center; margin: 10px 0;">${reportData.currency} ${reportData.amount}</div>
          <div style="text-align: center; font-style: italic; font-weight: bold; font-size: 11px;">(${reportData.currency} ${reportData.amountWords} Only)</div>
          <br>
          The above indebtedness arises from a defaulted credit facility secured under the executed agreements on file, including the Tripartite Debt Recovery Commitment Agreement. Despite reminders, you have neglected to settle the debt.
          <br><br>
          You are hereby given a <strong>FINAL STATUTORY NOTICE</strong> of 14 Days to fully settle the outstanding amount.
        </div>

        <div style="display: grid; grid-template-columns: 1.5fr 1fr; gap: 25px; margin-bottom: 25px;">
          <div>
            <div class="section-title" style="margin-top:0; font-size: 10px;">MODE OF PAYMENT</div>
            <table class="data-table" style="font-size: 9px;">
              <tr><td class="label" style="width:110px">Name</td><td>Kilimo MF / Niwagaba Felex</td></tr>
              <tr><td class="label">Number</td><td>${reportData.payment}</td></tr>
            </table>
            
            <div class="section-title" style="margin-top:0; font-size: 11px;">CONSEQUENCES OF FAILURE TO COMPLY</div>
            <div style="font-size: 10px; line-height: 1.5; margin-top: 5px;">
              If you fail to settle by <strong>5:00 PM on ${reportData.deadline}</strong>, we shall:<br>
              1. Institute legal proceedings in the Magistrate’s Court;<br>
              2. Seek a court decree for principal, recovery costs, and fees;<br>
              3. Apply for attachment and sale of property;<br>
              4. Enforce all collateral recovery rights in the executed agreements.
            </div>
          </div>
          <div style="border: 1px solid #000; padding: 12px;">
            <div style="font-weight: 900; text-transform: uppercase; border-bottom: 1px solid #000; margin-bottom: 8px; padding-bottom: 5px; font-size: 10px;">Authorized By:</div>
            <div style="font-weight: 900; font-size: 13px; margin-top: 10px;">MR. NIWAGABA FELEX</div>
            <div style="font-size: 10px; color: #444;">Creditor / Intended Plaintiff</div>
            <div style="margin-top: 35px; border-top: 1px dashed #000; padding-top: 5px; font-size: 9px;">Signature & Stamp</div>
            <div style="margin-top: 10px; border-top: 1px dashed #000; padding-top: 5px; font-size: 9px;">Date: ____ / ____ / 202__</div>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 40px;">
          <div style="border: 1px solid #000; padding: 6px;">
            <div style="font-weight: bold; border-bottom: 1px solid #000; margin-bottom: 4px; padding-bottom: 2px; font-size: 9px; text-transform: uppercase;">Acknowledgement of Service</div>
            <div style="font-size: 8px; line-height: 1.6;">
              Name: _____________________________<br>
              Signature: __________________________<br>
              Date Received: ____ / ____ / 202__
            </div>
          </div>
          <div style="border: 1px solid #000; padding: 6px;">
            <div style="font-weight: bold; border-bottom: 1px solid #000; margin-bottom: 4px; padding-bottom: 2px; font-size: 9px; text-transform: uppercase;">Witness / Process Server</div>
            <div style="font-size: 8px; line-height: 1.6;">
              Name: _____________________________<br>
              Signature: __________________________<br>
              Date Served: ____ / ____ / 202__
            </div>
          </div>
        </div>
        <div style="text-align: center; font-size: 7.5px; color: #666; margin-top: 5px; font-style: italic;">
          This Notice shall be relied upon in court as evidence of prior demand and failure to settle the indebtedness.
        </div>
      `;
    } else {
      documentBody = `<div style="padding: 50px; text-align: center; font-family: sans-serif;"><h3>ERROR: Invalid Report Type</h3><p>Please select a specific report type from the generator modal.</p></div>`;
    }


    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${reportData.reportType} - ${reportData.ref}</title>
          <style>
            @page { size: A4; margin: 0.8cm; }
            body { font-family: 'Times New Roman', Times, serif; line-height: 1.6; color: #000; padding: 0; margin: 0; font-size: 14px; }
            .header-title { font-size: 18px; font-weight: bold; text-align: center; text-decoration: underline; margin-bottom: 25px; text-transform: uppercase; }
            .company-name { font-size: 22px; font-weight: bold; text-align: center; text-transform: uppercase; margin-bottom: 5px; }
            .meta-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            .meta-table td { padding: 8px 12px; border: 1px solid #000; vertical-align: top; }
            .meta-table td.label { font-weight: bold; width: 35%; background-color: #f2f2f2; }
            .section-title { font-size: 15px; font-weight: bold; margin: 25px 0 12px; text-transform: uppercase; text-decoration: underline; }
            .content-box { margin-bottom: 20px; text-align: justify; line-height: 1.5; }
            .list-content { padding-left: 5px; margin: 8px 0; }
            .footer-sig { margin-top: 60px; display: grid; grid-template-columns: 1fr; gap: 20px; }
            .sig-line { margin-top: 50px; border-top: 1px solid #000; width: 300px; padding-top: 5px; font-weight: bold; }
            .table-affected { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 12px; }
            .table-affected th, .table-affected td { border: 1px solid #000; padding: 6px; text-align: left; }
            .table-affected th { background-color: #f2f2f2; }
            .amount-col { text-align: right !important; }
          </style>
        </head>
        <body>
          ${documentBody}

          ${!reportData.reportType.includes('SCP Track') ? `
            <div style="page-break-before: always;"></div>

            <div class="section-title">${(reportData.reportType === 'Official Audit Demand Notice' || reportData.reportType === 'Fraud & Shortage Assessment') ? 'Schedule of Unaccounted Client Funds' : 'Appendix A: Affected Clients & Shortages'}</div>
            <table class="table-affected">
              <thead>
                <tr>
                  <th style="width: 40px">No.</th>
                  <th>Client Name</th>
                  <th>Verification Date</th>
                  <th>Auditor Remarks</th>
                  <th class="amount-col">Shortage (${reportData.currency})</th>
                </tr>
              </thead>
              <tbody>
                ${reportData.clientsList.map((c, i) => `
                  <tr>
                    <td>${i + 1}</td>
                    <td>${c.name}</td>
                    <td>${c.date || 'N/A'}</td>
                    <td>${c.remarks}</td>
                    <td class="amount-col">${reportData.currency} ${parseFloat(c.amount || '0').toLocaleString()}</td>
                  </tr>
                `).join('')}
              </tbody>
              <tfoot>
                <tr>
                  <th colspan="4" style="text-align:right">Total Shortage:</th>
                  <th class="amount-col">${reportData.currency} ${parseFloat(reportData.amount).toLocaleString()}</th>
                </tr>
              </tfoot>
            </table>
          ` : ''}

          <script>window.onload = function() { window.print(); window.close(); }</script>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };



  return (
    <div className="page-container" style={{ padding: '20px 24px', maxWidth: '100%', overflowX: 'hidden' }}>
      <div className="page-header" style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 className="page-title" style={{ fontSize: 22, margin: 0 }}>Legal Recovery cases</h1>
          <p className="page-subtitle" style={{ margin: 0 }}>Oversight and documentation for delinquent portfolio recovery.</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <select 
            className="form-control" 
            style={{ width: 300, background: 'var(--bg-card)', border: '1px solid var(--border)' }}
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
          >
            <option value="">-- Quick Select Report --</option>
            <option value="Internal Audit Investigation Report">Internal Audit Investigation Report</option>
            <option value="Tripartite Debt Recovery Commitment Agreement">Tripartite Debt Recovery Commitment Agreement</option>
            <option value="14-Day Statutory Demand Notice (SCP Track)">14-Day Statutory Demand Notice (SCP Track)</option>
          </select>
          <button className="btn btn-secondary" onClick={() => setShowNewCaseModal(true)}>
            <Plus size={18} /> Initialize New Case
          </button>
          <button className="btn btn-primary" onClick={() => setShowGenerator(true)}>
            <FilePlus size={18} /> Generate Report
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 24, marginBottom: 24, borderBottom: '1px solid var(--border)' }}>
        <button 
          onClick={() => setActiveTab('cases')}
          style={{ padding: '12px 24px', background: 'none', border: 'none', borderBottom: activeTab === 'cases' ? '2px solid var(--accent)' : 'none', color: activeTab === 'cases' ? 'var(--accent)' : 'var(--text-muted)', cursor: 'pointer', fontWeight: 'bold' }}
        >
          <Gavel size={16} style={{ marginRight: 8 }} /> Recovery Cases
        </button>
        <button 
          onClick={() => setActiveTab('calendar')}
          style={{ padding: '12px 24px', background: 'none', border: 'none', borderBottom: activeTab === 'calendar' ? '2px solid var(--accent)' : 'none', color: activeTab === 'calendar' ? 'var(--accent)' : 'var(--text-muted)', cursor: 'pointer', fontWeight: 'bold' }}
        >
          <Calendar size={16} style={{ marginRight: 8 }} /> Follow-up Calendar
        </button>
        <button 
          onClick={() => setActiveTab('tasks')}
          style={{ padding: '12px 24px', background: 'none', border: 'none', borderBottom: activeTab === 'tasks' ? '2px solid var(--accent)' : 'none', color: activeTab === 'tasks' ? 'var(--accent)' : 'var(--text-muted)', cursor: 'pointer', fontWeight: 'bold' }}
        >
          <CheckCircle2 size={16} style={{ marginRight: 8 }} /> Task Manager
        </button>
        <button 
          onClick={() => setActiveTab('drafts')}
          style={{ padding: '12px 24px', background: 'none', border: 'none', borderBottom: activeTab === 'drafts' ? '2px solid var(--accent)' : 'none', color: activeTab === 'drafts' ? 'var(--accent)' : 'var(--text-muted)', cursor: 'pointer', fontWeight: 'bold' }}
        >
          <FileText size={16} style={{ marginRight: 8 }} /> Document Drafts
        </button>
      </div>

      {/* Court Report Generator Modal Overlay */}
      {showGenerator && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(13, 17, 23, 0.95)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40
        }}>
          <div className="card" style={{ maxWidth: 1000, width: '100%', maxHeight: '90vh', overflow: 'auto', border: '1px solid var(--accent)', padding: 0 }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--accent)', color: '#000', position: 'sticky', top: 0, zIndex: 10 }}>
              <h2 style={{ fontSize: 16, fontWeight: 900, textTransform: 'uppercase' }}>
                <FileText size={18} style={{display:'inline', verticalAlign:'middle', marginRight:8}}/> 
                {reportType || 'Report Generator'}
              </h2>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 900 }} onClick={() => setShowGenerator(false)}>✕ CLOSE</button>
            </div>
            
            <div style={{ padding: 32 }}>
              {/* SECTION I: ADMINISTRATIVE DETAILS (TOP) */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 32 }}>
                <div style={{ gridColumn: 'span 2' }}>
                  <h3 style={{ fontSize: 12, textTransform: 'uppercase', color: 'var(--accent)', borderBottom: '1px solid var(--border)', paddingBottom: 8, marginBottom: 16 }}>
                    {reportType.includes('SCP Track') ? 'I. Legal Parties & Agreement Context' : 'I. Administrative Details (Staff & Period)'}
                  </h3>
                </div>
                <div className="form-group">
                  <label className="form-label">Report Reference No.</label>
                  <input type="text" className="form-control" value={reportRef} onChange={e => setReportRef(e.target.value)} placeholder="e.g. AUD-2026-001" />
                </div>
                <div className="form-group">
                  <label className="form-label">Select Currency</label>
                  <select className="form-control" value={currency} onChange={e => setCurrency(e.target.value)} style={{ fontWeight: 'bold', color: 'var(--accent)' }}>
                    <option value="UGX">UGX (Uganda Shilling)</option>
                    <option value="USD">USD (US Dollar)</option>
                    <option value="KES">KES (Kenya Shilling)</option>
                    <option value="RWF">RWF (Rwanda Franc)</option>
                    <option value="EUR">EUR (Euro)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Branch / Location</label>
                  <input type="text" className="form-control" value={branchLocation} onChange={e => setBranchLocation(e.target.value)} />
                </div>
                {!reportType.includes('SCP Track') && (
                  <div className="form-group">
                    <label className="form-label">Supervisor Concerned</label>
                    <select className="form-control" value={supervisorName} onChange={e => setSupervisorName(e.target.value)}>
                      <option value="">-- Select Supervisor --</option>
                      {staff.filter(s => s.role.includes('manager') || s.role === 'admin').map(s => (
                        <option key={s.id} value={`${s.first_name} ${s.last_name}`}>{s.first_name} {s.last_name}</option>
                      ))}
                    </select>
                  </div>
                )}
                {!reportType.includes('Notice') && (
                  <div className="form-group">
                    <label className="form-label">Investigation Period</label>
                    <input type="text" className="form-control" value={auditPeriod} onChange={e => setAuditPeriod(e.target.value)} placeholder="e.g. 01 April to 12 May 2026" />
                  </div>
                )}
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">{reportType.includes('SCP Track') ? 'Borrower (Primary Party / Client)' : 'Auditees (Staff Under Investigation)'}</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
                    {auditees.map(a => (
                      <span key={a} className="badge badge-active" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px' }}>
                        {a} <X size={12} style={{ cursor: 'pointer' }} onClick={() => removeAuditee(a)} />
                      </span>
                    ))}
                  </div>
                  <select className="form-control" onChange={(e) => {
                    const val = e.target.value;
                    if (!val) return;
                    if (reportType.includes('SCP Track')) {
                      const client = clients.find(c => `${c.first_name} ${c.last_name}` === val);
                      if (client) selectClientForGenerator(client);
                    } else {
                      addAuditee(e);
                    }
                  }}>
                    <option value="">{reportType.includes('SCP Track') ? '-- Select Borrower --' : '-- Add Auditee --'}</option>
                    <optgroup label={reportType.includes('SCP Track') ? "Registered Clients" : "Staff Members"}>
                      {(reportType.includes('SCP Track') ? clients : staff).map((s: any) => (
                        <option key={s.id} value={`${s.first_name} ${s.last_name}`}>{s.first_name} {s.last_name}</option>
                      ))}
                    </optgroup>
                  </select>
                </div>

                {reportType.includes('SCP Track') && (
                  <>
                    <div className="form-group">
                      <label className="form-label">Guarantor Full Name</label>
                      <input type="text" className="form-control" value={guarantorName} onChange={e => setGuarantorName(e.target.value)} placeholder="Enter full name..." />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Guarantor Physical Address</label>
                      <input type="text" className="form-control" value={guarantorAddress} onChange={e => setGuarantorAddress(e.target.value)} placeholder="Village, Parish, District..." />
                    </div>
                  </>
                )}
              </div>

              {/* SECTION II: AUDIT FINDINGS & NARRATIVE (Standard) OR FINANCIAL OBLIGATIONS (SCP) */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 32 }}>
                <div style={{ gridColumn: 'span 2' }}>
                  <h3 style={{ fontSize: 12, textTransform: 'uppercase', color: 'var(--accent)', borderBottom: '1px solid var(--border)', paddingBottom: 8, marginBottom: 16 }}>
                    {reportType.includes('SCP Track') ? 'II. Financial Obligations & Settlement' : 'II. Audit Narrative & Evidence'}
                  </h3>
                </div>
                
                {reportType.includes('SCP Track') ? (
                  <>
                    <div className="form-group">
                      <label className="form-label">Main Loan Reference</label>
                      <input type="text" className="form-control" value={loanNumber} onChange={e => setLoanNumber(e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Total Verified Debt (UGX)</label>
                      <input type="number" className="form-control" value={reportAmount} onChange={e => setReportAmount(Number(e.target.value))} style={{ fontWeight: 'bold', color: 'var(--accent)' }} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Liquidation Deadline Date</label>
                      <input type="text" className="form-control" value={deadlineDate} onChange={e => setDeadlineDate(e.target.value)} placeholder="e.g. 28th June 2026" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Payment Channel Details</label>
                      <input type="text" className="form-control" value={paymentDetails} onChange={e => setPaymentDetails(e.target.value)} placeholder="MTN MoMo: 078... / Bank: ..." />
                    </div>
                    {reportType.includes('Tripartite') && (
                      <>
                        <div className="form-group" style={{ gridColumn: 'span 2' }}>
                          <label className="form-label">Description of Pledged Collateral</label>
                          <input type="text" className="form-control" value={collateralDetails} onChange={e => setCollateralDetails(e.target.value)} placeholder="e.g. Household items, Motorcycle (Reg No...), Livestock..." />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Collateral Type</label>
                          <select className="form-control" value={collateralType} onChange={e => setCollateralType(e.target.value)}>
                            <option value="Personal Property">Personal Property</option>
                            <option value="Motor Vehicle">Motor Vehicle</option>
                            <option value="Land / Real Estate">Land / Real Estate</option>
                            <option value="Business Assets">Business Assets</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                        <div className="form-group">
                          <label className="form-label">Serial / Reg No.</label>
                          <input type="text" className="form-control" value={collateralSerial} onChange={e => setCollateralSerial(e.target.value)} placeholder="e.g. Chassis No, Reg No, Title No..." />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Estimated Value (UGX)</label>
                          <input type="number" className="form-control" value={collateralValue} onChange={e => setCollateralValue(e.target.value)} placeholder="e.g. 5000000" />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Physical Location</label>
                          <input type="text" className="form-control" value={collateralLocation} onChange={e => setCollateralLocation(e.target.value)} placeholder="e.g. Luzira, Block 4..." />
                        </div>
                      </>
                    )}
                    {!reportType.includes('Notice') && (
                      <div className="form-group" style={{ gridColumn: 'span 2' }}>
                        <label className="form-label">Debt Breakdown / Facility Description</label>
                        <textarea className="form-control" rows={2} value={executiveSummary} onChange={e => setExecutiveSummary(e.target.value)} placeholder="e.g. Microfinance Credit Facility / Accrued Interest & Penalties" />
                      </div>
                    )}

                    {reportType.includes('Notice') && (
                      <div style={{ gridColumn: 'span 2', padding: 12, background: 'rgba(255,255,255,0.05)', borderRadius: 4, borderLeft: '3px solid var(--accent)' }}>
                        <div style={{ fontSize: 11, fontWeight: 'bold', color: 'var(--accent)', marginBottom: 4, textTransform: 'uppercase' }}>Statutory Legal Content:</div>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)', lineHeight: 1.4 }}>
                          The generated memorandum will include the mandatory "FINAL STATUTORY NOTICE" wording, Judicature (Small Claims Procedure) Rules compliance, and the "Consequences of Failure" evidence block as required for court submission.
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                      <label className="form-label">Total Confirmed Shortage (UGX)</label>
                      <input type="number" className="form-control" value={reportAmount} onChange={e => setReportAmount(Number(e.target.value))} style={{ fontWeight: 'bold', color: 'var(--accent)', fontSize: 18 }} />
                    </div>

                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                      <label className="form-label">EXECUTIVE SUMMARY</label>
                      <textarea className="form-control" rows={3} value={executiveSummary} onChange={e => setExecutiveSummary(e.target.value)} />
                    </div>

                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <label className="form-label" style={{ marginBottom: 0 }}>AUDIT FINDINGS & EVIDENCE</label>
                        <select 
                          className="form-control form-control-sm" 
                          style={{ width: 'auto', height: 28, fontSize: 11 }}
                          value=""
                          onChange={e => {
                            if (e.target.value) {
                              const lines = auditFindings.split('\n').filter(l => l.trim());
                              const nextNum = lines.length + 1;
                              const formatted = `${nextNum}. ${e.target.value}`;
                              setAuditFindings(prev => prev ? prev + '\n' + formatted : formatted);
                            }
                          }}
                        >
                          <option value="">-- Quick Add Finding --</option>
                          {AUDIT_FINDINGS_TEMPLATES.map(f => <option key={f} value={f}>{f}</option>)}
                        </select>
                      </div>
                      <textarea className="form-control" rows={4} value={auditFindings} onChange={e => setAuditFindings(e.target.value)} />
                    </div>

                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <label className="form-label" style={{ marginBottom: 0 }}>STAFF DUTIES & RESPONSIBILITIES UNDER AUDIT</label>
                        <select 
                          className="form-control form-control-sm" 
                          style={{ width: 'auto', height: 28, fontSize: 11 }}
                          value=""
                          onChange={e => {
                            if (e.target.value) {
                              const lines = staffResponsibilitiesText.split('\n').filter(l => l.trim());
                              const nextNum = lines.length + 1;
                              const formatted = `${nextNum}. ${e.target.value}`;
                              setStaffResponsibilitiesText(prev => prev ? prev + '\n' + formatted : formatted);
                            }
                          }}
                        >
                          <option value="">-- Select Duty --</option>
                          {STAFF_RESPONSIBILITIES.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                      </div>
                      <textarea className="form-control" rows={3} value={staffResponsibilitiesText} onChange={e => setStaffResponsibilitiesText(e.target.value)} />
                    </div>

                    <div className="form-group">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <label className="form-label" style={{ marginBottom: 0 }}>ROOT CAUSE ASSESSMENT</label>
                        <select 
                          className="form-control form-control-sm" 
                          style={{ width: 'auto', height: 28, fontSize: 11 }}
                          value=""
                          onChange={e => {
                            if (e.target.value) {
                              const lines = causeOfShortage.split('\n').filter(l => l.trim());
                              const nextNum = lines.length + 1;
                              const formatted = `${nextNum}. ${e.target.value}`;
                              setCauseOfShortage(prev => prev ? prev + '\n' + formatted : formatted);
                            }
                          }}
                        >
                          <option value="">-- Select Cause --</option>
                          {COMMON_ROOT_CAUSES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                      <textarea className="form-control" rows={3} value={causeOfShortage} onChange={e => setCauseOfShortage(e.target.value)} />
                    </div>

                    <div className="form-group">
                      <label className="form-label">CONCLUSION & IMPACT</label>
                      <textarea className="form-control" rows={3} value={impactOfNegligence} onChange={e => setImpactOfNegligence(e.target.value)} />
                    </div>

                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                      <label className="form-label">AUDITOR RECOMMENDATIONS (ONE PER LINE)</label>
                      <textarea className="form-control" rows={3} value={recommendations} onChange={e => setRecommendations(e.target.value)} />
                    </div>
                  </>
                )}
              </div>

              {/* SECTION III: AFFECTED CLIENTS LEDGER (Standard Audit Only) */}
              {!reportType.includes('SCP Track') && (
                <div style={{ marginBottom: 32 }}>
                  <h3 style={{ fontSize: 12, textTransform: 'uppercase', color: 'var(--accent)', borderBottom: '1px solid var(--border)', paddingBottom: 8, marginBottom: 16 }}>
                    III. Affected Clients Ledger (Appendix A)
                  </h3>
                  <div className="form-group" style={{ marginBottom: 16 }}>
                    <label className="form-label">Search and Add Affected Client</label>
                    <div style={{ position: 'relative' }}>
                      <Search style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} size={16} />
                      <input 
                        type="text" 
                        className="form-control" 
                        style={{ paddingLeft: 36 }}
                        placeholder="Type client name to search..." 
                        value={clientSearch} 
                        onChange={e => setClientSearch(e.target.value)} 
                      />
                      {clientSearch && (
                        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, zIndex: 100, boxShadow: '0 8px 24px rgba(0,0,0,0.6)', marginTop: 4 }}>
                          {clients.filter(c => `${c.first_name} ${c.last_name}`.toLowerCase().includes(clientSearch.toLowerCase())).slice(0, 5).map(c => (
                            <div 
                              key={c.id} 
                              style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                              onClick={() => addClient(c)}
                            >
                              <div>
                                <div style={{ fontWeight: 'bold' }}>{c.first_name} {c.last_name}</div>
                                <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>ID: {c.national_id} | {c.phone_primary || c.phone}</div>
                              </div>
                              <Plus size={16} color="var(--accent)" />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="table-responsive" style={{ border: '1px solid var(--border)', borderRadius: 8 }}>
                    <table className="table" style={{ marginBottom: 0 }}>
                      <thead>
                        <tr>
                          <th>Client Name</th>
                          <th>Date</th>
                          <th style={{ width: 180 }}>Shortage ({currency})</th>
                          <th>Remarks</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedClients.map(c => (
                          <tr key={c.id}>
                            <td>{c.name}</td>
                            <td><input type="date" className="form-control form-control-sm" value={c.date} onChange={e => updateClient(c.id, 'date', e.target.value)} /></td>
                            <td>
                              <input type="number" className="form-control form-control-sm" value={c.amount} onChange={e => updateClient(c.id, 'amount', e.target.value)} />
                              <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 2, textAlign: 'right' }}>
                                {parseFloat(c.amount || '0').toLocaleString()} {currency}
                              </div>
                            </td>
                            <td><input type="text" className="form-control form-control-sm" value={c.remarks} onChange={e => updateClient(c.id, 'remarks', e.target.value)} /></td>
                            <td><button className="btn btn-icon btn-ghost" onClick={() => removeClient(c.id)}><Trash2 size={14} /></button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div style={{ position: 'sticky', bottom: -32, padding: '20px 0', background: 'var(--bg-card)', borderTop: '1px solid var(--border)' }}>
                <button 
                  className="btn btn-primary" 
                  style={{ width: '100%', height: 48, justifyContent: 'center' }}
                  onClick={() => {
                    generateCourtReport();
                    setShowGenerator(false);
                  }}
                >
                  <Printer size={18} /> GENERATE PROFESSIONAL DOCUMENT
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* NEW CASE INITIALIZATION MODAL */}
      {showNewCaseModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(13, 17, 23, 0.9)', zIndex: 1100,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40
        }}>
          <div className="card" style={{ maxWidth: 600, width: '100%', border: '1px solid var(--accent)' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: 16, fontWeight: 'bold', textTransform: 'uppercase' }}>Initialize New Legal Case</h2>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => setShowNewCaseModal(false)}>✕</button>
            </div>
            <div style={{ padding: 24 }}>
              <div className="form-group" style={{ position: 'relative' }}>
                <label className="form-label">Client / Subject Name</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="Start typing client or staff name..."
                  value={newCaseData.client_name}
                  onChange={e => {
                    const val = e.target.value;
                    setNewCaseData({ ...newCaseData, client_name: val });
                    setClientSearch(val);
                  }}
                />
                {clientSearch && !clients.find(c => `${c.first_name} ${c.last_name}` === clientSearch) && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, zIndex: 1200, boxShadow: '0 8px 24px rgba(0,0,0,0.6)', marginTop: 4 }}>
                    {clients.filter(c => `${c.first_name} ${c.last_name}`.toLowerCase().includes(clientSearch.toLowerCase())).slice(0, 5).map(c => (
                      <div 
                        key={c.id} 
                        style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', cursor: 'pointer' }}
                        onClick={() => {
                          setNewCaseData({ 
                            ...newCaseData, 
                            client_name: `${c.first_name} ${c.last_name}`,
                            outstanding_balance: loans.find(l => l.client_id === c.id)?.outstanding_balance || 0
                          });
                          setClientSearch('');
                        }}
                      >
                        <div style={{ fontWeight: 'bold' }}>{c.first_name} {c.last_name}</div>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>ID: {c.national_id} | Phone: {c.phone}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="form-group" style={{ marginTop: 16 }}>
                <label className="form-label">Outstanding Shortage (UGX)</label>
                <input 
                  type="number" 
                  className="form-control" 
                  value={newCaseData.outstanding_balance === 0 ? '' : newCaseData.outstanding_balance}
                  placeholder="0"
                  onChange={e => {
                    const val = e.target.value;
                    // Prevent leading zeros by converting to number and back if needed
                    setNewCaseData({ ...newCaseData, outstanding_balance: val === '' ? 0 : Number(val) });
                  }}
                />
              </div>
              <div className="form-group" style={{ marginTop: 16 }}>
                <label className="form-label">Responsible Officer / Auditor</label>
                <select 
                  className="form-control"
                  value={newCaseData.staff_name}
                  onChange={e => setNewCaseData({ ...newCaseData, staff_name: e.target.value })}
                >
                  <option value="">-- Select Officer --</option>
                  {staff.map((s: any) => <option key={s.id} value={`${s.first_name} ${s.last_name}`}>{s.first_name} {s.last_name}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ marginTop: 16 }}>
                <label className="form-label">Initial Status</label>
                <select 
                  className="form-control"
                  value={newCaseData.status}
                  onChange={e => setNewCaseData({ ...newCaseData, status: e.target.value })}
                >
                  <option value="open">Open (At Risk)</option>
                  <option value="in_progress">In Progress (Investigating)</option>
                  <option value="escalated">Escalated (Delinquent)</option>
                </select>
              </div>
              <div className="form-group" style={{ marginTop: 16 }}>
                <label className="form-label">Case Description / Preliminary Findings</label>
                <textarea 
                  className="form-control" 
                  rows={3} 
                  value={newCaseData.description}
                  onChange={e => setNewCaseData({ ...newCaseData, description: e.target.value })}
                ></textarea>
              </div>

              <div style={{ marginTop: 32, display: 'flex', gap: 12 }}>
                <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowNewCaseModal(false)}>Cancel</button>
                <button className="btn btn-primary" style={{ flex: 1 }} onClick={async () => {
                  if (!newCaseData.client_name) { alert("Please enter a client name."); return; }
                  try {
                    const res = await api.openLegalCase({
                      ...newCaseData,
                      case_number: `SMOS-LEGAL-${Math.floor(Math.random() * 900) + 100}`,
                    });
                    setCases([res.data, ...cases]);
                    setShowNewCaseModal(false);
                    setNewCaseData({ client_name: '', outstanding_balance: 0, status: 'open', description: '', staff_name: '' });
                  } catch (e) { alert("Error initializing case"); }
                }}>
                  Initialize Case
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'cases' && (
        <div style={{ display: 'grid', gridTemplateColumns: detail ? '1fr 420px' : '1fr', gap: 20, alignItems: 'start' }}>
          {/* CASE LIST TABLE */}
          <div className="card" style={{ padding: 0 }}>
            <div className="table-wrap">
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-secondary)' }}>
                    <th style={{ padding: 16, textAlign: 'left', fontSize: 11 }}>Case Details</th>
                    <th style={{ padding: 16, textAlign: 'right', fontSize: 11 }}>Outstanding</th>
                    <th style={{ padding: 16, textAlign: 'center', fontSize: 11 }}>Pending Follow-ups</th>
                    <th style={{ padding: 16, textAlign: 'center', fontSize: 11 }}>Status</th>
                    <th style={{ padding: 16, textAlign: 'center', fontSize: 11 }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={5} style={{ textAlign: 'center', padding: 40 }}>Syncing...</td></tr>
                  ) : cases.map(c => (
                    <tr key={c.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: 16 }}>
                        <div style={{ fontWeight: 'bold' }}>{c.client_name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{c.case_number}</div>
                      </td>
                      <td style={{ padding: 16, textAlign: 'right', fontWeight: 'bold', color: 'var(--red)' }}>
                        {fmt.currency(c.outstanding_balance, 'UGX')}
                      </td>
                      <td style={{ padding: 16, textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                          <Clock size={14} color="var(--accent)" />
                          <span style={{ fontSize: 12 }}>3 Pending</span>
                        </div>
                      </td>
                      <td style={{ padding: 16, textAlign: 'center' }}>
                        <span className={`badge ${STATUS_BADGE[c.status] || ''}`}>{c.status}</span>
                      </td>
                      <td style={{ padding: 16, textAlign: 'center' }}>
                        <button className="btn btn-secondary btn-icon" onClick={() => viewCase(c)}><Eye size={14} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* DETAIL VIEW */}
          {detail && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20, position: 'sticky', top: 0, maxHeight: 'calc(100vh - 160px)', overflowY: 'auto', paddingRight: 4 }}>
              <div className="card" style={{ border: '1px solid var(--accent)', background: 'var(--bg-card)', padding: '16px 20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, position: 'sticky', top: -16, background: 'var(--bg-card)', zIndex: 10, padding: '12px 0' }}>
                  <h3 style={{ textTransform: 'uppercase', fontSize: 13, color: 'var(--accent)', fontWeight: 'bold' }}>{detail.case_number}</h3>
                  <button onClick={() => setDetail(null)} className="btn-icon" style={{ background: 'rgba(255,255,255,0.05)', width: 24, height: 24 }}>✕</button>
                </div>
                <div style={{ fontSize: 13 }}>
                  <div style={{ marginBottom: 8 }}><strong>Client:</strong> {detail.client_name}</div>
                  <div style={{ marginBottom: 16 }}><strong>Staff Responsible:</strong> {detail.staff_name || detail.assigned_to}</div>
                  <div style={{ padding: 12, background: 'var(--bg-secondary)', borderRadius: 8, fontSize: 12, lineHeight: 1.5 }}>
                    {detail.description || 'No detailed description available for this case.'}
                  </div>
                </div>

                <div style={{ marginTop: 24 }}>
                  <h4 style={{ fontSize: 11, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 12 }}>Pending Follow-up Tasks</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ padding: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: 6, display: 'flex', gap: 10, alignItems: 'center' }}>
                      <input type="checkbox" />
                      <div style={{ fontSize: 12 }}>Serve 14-day statutory demand notice</div>
                    </div>
                    <div style={{ padding: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: 6, display: 'flex', gap: 10, alignItems: 'center' }}>
                      <input type="checkbox" />
                      <div style={{ fontSize: 12 }}>Verify guarantor village/sub-county</div>
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: 24 }}>
                  <h4 style={{ fontSize: 11, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 12 }}>Case History</h4>
                  <div style={{ borderLeft: '2px solid var(--border)', marginLeft: 8, paddingLeft: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div style={{ position: 'relative' }}>
                      <div style={{ position: 'absolute', left: -21, top: 4, width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)' }}></div>
                      <div style={{ fontSize: 11, fontWeight: 'bold' }}>Internal Audit Report Generated</div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Today, 10:45 AM</div>
                    </div>
                    <div style={{ position: 'relative' }}>
                      <div style={{ position: 'absolute', left: -21, top: 4, width: 8, height: 8, borderRadius: '50%', background: 'var(--text-muted)' }}></div>
                      <div style={{ fontSize: 11, fontWeight: 'bold' }}>Case Initialized in System</div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Yesterday, 02:15 PM</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'calendar' && (
        <div className="card" style={{ minHeight: 600 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <h2 style={{ fontSize: 18 }}>Recovery Timeline Calendar</h2>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-secondary btn-sm">Today</button>
              <button className="btn btn-secondary btn-sm">Month View</button>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1, background: 'var(--border)', border: '1px solid var(--border)' }}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
              <div key={d} style={{ padding: 12, background: 'var(--bg-secondary)', textAlign: 'center', fontSize: 12, fontWeight: 'bold' }}>{d}</div>
            ))}
            {Array.from({ length: 35 }).map((_, i) => (
              <div key={i} style={{ padding: 12, minHeight: 100, background: 'var(--bg-card)', fontSize: 12 }}>
                {i - 3 > 0 && i - 3 <= 31 ? i - 3 : ''}
                {i === 15 && (
                  <div style={{ marginTop: 8, padding: 4, background: 'var(--red)', color: 'white', fontSize: 9, borderRadius: 4 }}>
                    Deadline: SMOS-LEGAL-001
                  </div>
                )}
                {i === 18 && (
                  <div style={{ marginTop: 8, padding: 4, background: 'var(--accent)', color: 'white', fontSize: 9, borderRadius: 4 }}>
                    Small Claims Filing: Jane Doe
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'tasks' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: 24 }}>
          <div className="card">
            <h2 style={{ fontSize: 18, marginBottom: 20 }}>Pending Legal Tasks</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { t: 'Draft Small Claims Summon for Kato Paul', d: '2026-05-18', p: 'High', s: 'Pending' },
                { t: 'Verify Field Officer recovery for Mbarara Branch', d: '2026-05-19', p: 'Medium', s: 'In Progress' },
                { t: 'Submit monthly fraud report to Management', d: '2026-05-20', p: 'High', s: 'Pending' },
                { t: 'Update Tripartite Commitment for Sarah Akello', d: '2026-05-21', p: 'Low', s: 'Pending' }
              ].map((task, idx) => (
                <div key={idx} style={{ padding: 16, border: '1px solid var(--border)', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                    <CheckCircle2 size={20} color={task.s === 'Pending' ? 'var(--text-muted)' : 'var(--accent)'} />
                    <div>
                      <div style={{ fontWeight: 'bold', fontSize: 14 }}>{task.t}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Due Date: {task.d} | Priority: <span style={{ color: task.p === 'High' ? 'var(--red)' : 'var(--accent)' }}>{task.p}</span></div>
                    </div>
                  </div>
                  <button className="btn btn-secondary btn-sm">Update</button>
                </div>
              ))}
            </div>
          </div>
          <div className="card">
            <h3 style={{ fontSize: 14, marginBottom: 16 }}>Performance Summary</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ padding: 16, background: 'var(--bg-secondary)', borderRadius: 8 }}>
                <div style={{ fontSize: 24, fontWeight: 'bold' }}>12</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Active Tasks</div>
              </div>
              <div style={{ padding: 16, background: 'var(--bg-secondary)', borderRadius: 8 }}>
                <div style={{ fontSize: 24, fontWeight: 'bold', color: 'var(--accent)' }}>85%</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Completion Rate</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'drafts' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Main Drafts Cards Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
            <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', border: '1px solid var(--border)', position: 'relative' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <div style={{ padding: 8, background: 'rgba(30, 58, 138, 0.2)', borderRadius: 8, color: '#3b82f6' }}>
                    <FileText size={24} />
                  </div>
                  <span style={{ fontSize: 11, background: 'rgba(255,255,255,0.05)', padding: '4px 8px', borderRadius: 12 }}>Pride Bank Format</span>
                </div>
                <h3 style={{ fontSize: 16, marginBottom: 8, fontWeight: 'bold' }}>Detailed Loan Account Statement</h3>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: 20 }}>
                  High-fidelity replica of the Pride Microfinance Bank loan statement format. Includes transaction tables, ledger balances, and interest-principal breakdown.
                </p>
              </div>
              <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => {
                setActiveDraftTemplate('statement');
                // Select default client if any
                if (clients.length > 0) {
                  const cl = clients[0];
                  loadClientStatementData(`${cl.first_name} ${cl.last_name}`);
                }
              }}>
                Configure & Generate
              </button>
            </div>

            <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', border: '1px solid var(--border)' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <div style={{ padding: 8, background: 'rgba(16, 185, 129, 0.2)', borderRadius: 8, color: '#10b981' }}>
                    <FilePlus size={24} />
                  </div>
                  <span style={{ fontSize: 11, background: 'rgba(255,255,255,0.05)', padding: '4px 8px', borderRadius: 12 }}>Musha Financial Services</span>
                </div>
                <h3 style={{ fontSize: 16, marginBottom: 8, fontWeight: 'bold' }}>Loan Application Form</h3>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: 20 }}>
                  Two-page legal loan application document containing client particulars, security details/consents, local council (LCI) endorsement grids, and translations.
                </p>
              </div>
              <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => {
                setActiveDraftTemplate('application');
                if (clients.length > 0) {
                  const cl = clients[0];
                  setAppClientName(`${cl.first_name} ${cl.last_name}`);
                  setAppClientNIN(cl.national_id);
                  setAppClientID(cl.id);
                  setAppClientResAddr(cl.home_address || `${cl.village || ''}, ${cl.sub_county || ''}, ${cl.district || ''}`);
                  setAppClientBusAddr(cl.business_address || `${cl.village || ''} Trading Center`);
                  setAppClientTel(cl.phone_primary || cl.phone);
                }
                if (staff.length > 0) {
                  const st = staff[0];
                  setAppStaffName(`${st.first_name} ${st.last_name}`);
                }
              }}>
                Configure & Generate
              </button>
            </div>

            <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', border: '1px solid var(--border)' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <div style={{ padding: 8, background: 'rgba(245, 158, 11, 0.2)', borderRadius: 8, color: '#f59e0b' }}>
                    <CheckCircle2 size={24} />
                  </div>
                  <span style={{ fontSize: 11, background: 'rgba(255,255,255,0.05)', padding: '4px 8px', borderRadius: 12 }}>Byax Financial Services</span>
                </div>
                <h3 style={{ fontSize: 16, marginBottom: 8, fontWeight: 'bold' }}>Loans Consultant Agreement</h3>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: 20 }}>
                  Independent contractor agreement specifying a loans consultant's responsibilities, monthly commission metrics, food allowance parameters, and due diligence checks.
                </p>
              </div>
              <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => {
                setActiveDraftTemplate('loans_contract');
                if (staff.length > 0) {
                  const st = staff[0];
                  setContractStaffName(`${st.first_name} ${st.last_name}`);
                  setContractStaffID(st.id || 'BYAX-LC-01');
                }
              }}>
                Configure & Generate
              </button>
            </div>

            <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', border: '1px solid var(--border)' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <div style={{ padding: 8, background: 'rgba(139, 92, 246, 0.2)', borderRadius: 8, color: '#8b5cf6' }}>
                    <CheckCircle2 size={24} />
                  </div>
                  <span style={{ fontSize: 11, background: 'rgba(255,255,255,0.05)', padding: '4px 8px', borderRadius: 12 }}>Byax Financial Services</span>
                </div>
                <h3 style={{ fontSize: 16, marginBottom: 8, fontWeight: 'bold' }}>Office Management Agreement</h3>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: 20 }}>
                  Independent contractor agreement for office managers overseeing loan disbursements, cashier activities, daily/weekly reconciliation, and contractor compliance audits.
                </p>
              </div>
              <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => {
                setActiveDraftTemplate('office_contract');
                if (staff.length > 0) {
                  const st = staff[0];
                  setContractStaffName(`${st.first_name} ${st.last_name}`);
                  setContractStaffID(st.id || 'BYAX-OM-01');
                }
              }}>
                Configure & Generate
              </button>
            </div>
          </div>

          {/* ACTIVE DRAFT MODAL GENERATOR */}
          {activeDraftTemplate && (
            <div style={{
              position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(13, 17, 23, 0.95)', zIndex: 1000,
              display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40
            }}>
              <div className="card" style={{ maxWidth: 800, width: '100%', maxHeight: '90vh', overflow: 'auto', border: '1px solid var(--accent)', padding: 0 }}>
                <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--accent)', color: '#000', position: 'sticky', top: 0, zIndex: 10 }}>
                  <h2 style={{ fontSize: 16, fontWeight: 900, textTransform: 'uppercase' }}>
                    <FileText size={18} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 8 }} />
                    Configure Draft - {activeDraftTemplate === 'statement' ? 'Detailed Loan Statement' : activeDraftTemplate === 'application' ? 'Loan Application Form' : activeDraftTemplate === 'loans_contract' ? 'Loans Consultant Contract' : 'Office Management Contract'}
                  </h2>
                  <button style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 900 }} onClick={() => setActiveDraftTemplate(null)}>✕ CLOSE</button>
                </div>

                <div style={{ padding: 32 }}>
                  {activeDraftTemplate === 'statement' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        <div className="form-group">
                          <label className="form-label">Auto-populate Client Details</label>
                          <select className="form-control" onChange={(e) => {
                            const val = e.target.value;
                            if (val) {
                              loadClientStatementData(val);
                            }
                          }}>
                            <option value="">-- Choose Client --</option>
                            {clients.map((cl, i) => (
                              <option key={i} value={`${cl.first_name} ${cl.last_name}`}>{cl.first_name} {cl.last_name}</option>
                            ))}
                          </select>
                        </div>
                        <div className="form-group">
                          <label className="form-label">Account Number</label>
                          <input type="text" className="form-control" value={stmtAcNo} onChange={e => setStmtAcNo(e.target.value)} />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Customer Name</label>
                          <input type="text" className="form-control" value={stmtCustName} onChange={e => setStmtCustName(e.target.value)} />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Customer Address</label>
                          <input type="text" className="form-control" value={stmtCustAddr} onChange={e => setStmtCustAddr(e.target.value)} />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Currency</label>
                          <input type="text" className="form-control" value={stmtCurrency} onChange={e => setStmtCurrency(e.target.value)} />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Loan Product</label>
                          <input type="text" className="form-control" value={stmtProduct} onChange={e => setStmtProduct(e.target.value)} />
                        </div>
                      </div>

                      <h3 style={{ fontSize: 13, color: 'var(--accent)', borderBottom: '1px solid var(--border)', paddingBottom: 8, marginTop: 12 }}>Summary Balances</h3>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
                        <div className="form-group">
                          <label className="form-label">Unapplied Funds</label>
                          <input type="number" className="form-control" value={stmtUnappliedFunds} onChange={e => setStmtUnappliedFunds(parseFloat(e.target.value) || 0)} />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Ledger Balance</label>
                          <input type="number" className="form-control" value={stmtLedgerBalance} onChange={e => setStmtLedgerBalance(parseFloat(e.target.value) || 0)} />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Uncleared Balance</label>
                          <input type="number" className="form-control" value={stmtUnclearedBalance} onChange={e => setStmtUnclearedBalance(parseFloat(e.target.value) || 0)} />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Interest Pre-Paid</label>
                          <input type="number" className="form-control" value={stmtInterestPrePaid} onChange={e => setStmtInterestPrePaid(parseFloat(e.target.value) || 0)} />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Interest Accrued</label>
                          <input type="number" className="form-control" value={stmtInterestAccrued} onChange={e => setStmtInterestAccrued(parseFloat(e.target.value) || 0)} />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Cleared Balance</label>
                          <input type="number" className="form-control" value={stmtClearedBalance} onChange={e => setStmtClearedBalance(parseFloat(e.target.value) || 0)} />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Principal Balance</label>
                          <input type="number" className="form-control" value={stmtPrincipalBalance} onChange={e => setStmtPrincipalBalance(parseFloat(e.target.value) || 0)} />
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
                        <h3 style={{ fontSize: 13, color: 'var(--accent)' }}>Ledger Transactions</h3>
                        <button className="btn btn-secondary btn-sm" onClick={() => {
                          setStmtTransactions([...stmtTransactions, { postDate: new Date().toISOString().split('T')[0], valueDate: new Date().toISOString().split('T')[0], ref: Math.floor(Math.random()*1e20).toString(), desc: 'New Transaction', debit: 0, credit: 0, balance: stmtPrincipalBalance }]);
                        }}>+ Add Row</button>
                      </div>
                      <div style={{ overflowX: 'auto', border: '1px solid var(--border)', borderRadius: 8 }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                          <thead>
                            <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}>
                              <th style={{ padding: 8, textAlign: 'left' }}>Post Date</th>
                              <th style={{ padding: 8, textAlign: 'left' }}>Description</th>
                              <th style={{ padding: 8, textAlign: 'right' }}>Debit</th>
                              <th style={{ padding: 8, textAlign: 'right' }}>Credit</th>
                              <th style={{ padding: 8, textAlign: 'right' }}>Balance</th>
                              <th style={{ padding: 8, textAlign: 'center' }}>Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {stmtTransactions.map((tx, idx) => (
                              <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                                <td style={{ padding: 8 }}>
                                  <input type="date" className="form-control" style={{ width: 120, padding: 4 }} value={tx.postDate} onChange={e => {
                                    const updated = [...stmtTransactions];
                                    updated[idx].postDate = e.target.value;
                                    updated[idx].valueDate = e.target.value;
                                    setStmtTransactions(updated);
                                  }} />
                                </td>
                                <td style={{ padding: 8 }}>
                                  <input type="text" className="form-control" style={{ padding: 4 }} value={tx.desc} onChange={e => {
                                    const updated = [...stmtTransactions];
                                    updated[idx].desc = e.target.value;
                                    setStmtTransactions(updated);
                                  }} />
                                </td>
                                <td style={{ padding: 8 }}>
                                  <input type="number" className="form-control" style={{ width: 100, textAlign: 'right', padding: 4 }} value={tx.debit} onChange={e => {
                                    const updated = [...stmtTransactions];
                                    updated[idx].debit = parseFloat(e.target.value) || 0;
                                    setStmtTransactions(updated);
                                  }} />
                                </td>
                                <td style={{ padding: 8 }}>
                                  <input type="number" className="form-control" style={{ width: 100, textAlign: 'right', padding: 4 }} value={tx.credit} onChange={e => {
                                    const updated = [...stmtTransactions];
                                    updated[idx].credit = parseFloat(e.target.value) || 0;
                                    setStmtTransactions(updated);
                                  }} />
                                </td>
                                <td style={{ padding: 8 }}>
                                  <input type="number" className="form-control" style={{ width: 100, textAlign: 'right', padding: 4 }} value={tx.balance} onChange={e => {
                                    const updated = [...stmtTransactions];
                                    updated[idx].balance = parseFloat(e.target.value) || 0;
                                    setStmtTransactions(updated);
                                  }} />
                                </td>
                                <td style={{ padding: 8, textAlign: 'center' }}>
                                  <button className="btn btn-secondary btn-sm" onClick={() => {
                                    setStmtTransactions(stmtTransactions.filter((_, i) => i !== idx));
                                  }}>✕</button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {activeDraftTemplate === 'application' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                      <h3 style={{ fontSize: 13, color: 'var(--accent)', borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>Particulars of the Client</h3>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        <div className="form-group">
                          <label className="form-label">Auto-populate Client Details</label>
                          <select className="form-control" onChange={(e) => {
                            const val = e.target.value;
                            if (val) {
                              const cl = clients.find(c => `${c.first_name} ${c.last_name}` === val);
                              if (cl) {
                                setAppClientName(`${cl.first_name} ${cl.last_name}`);
                                setAppClientNIN(cl.national_id);
                                setAppClientID(cl.id);
                                setAppClientResAddr(cl.home_address || `${cl.village || ''}, ${cl.sub_county || ''}, ${cl.district || ''}`);
                                setAppClientBusAddr(cl.business_address || `${cl.village || ''} Trading Center`);
                                setAppClientTel(cl.phone_primary || cl.phone);
                              }
                            }
                          }}>
                            <option value="">-- Choose Client --</option>
                            {clients.map((cl, i) => (
                              <option key={i} value={`${cl.first_name} ${cl.last_name}`}>{cl.first_name} {cl.last_name}</option>
                            ))}
                          </select>
                        </div>
                        <div className="form-group">
                          <label className="form-label">Client Full Name</label>
                          <input type="text" className="form-control" value={appClientName} onChange={e => setAppClientName(e.target.value)} />
                        </div>
                        <div className="form-group">
                          <label className="form-label">NIN (National ID Number)</label>
                          <input type="text" className="form-control" value={appClientNIN} onChange={e => setAppClientNIN(e.target.value)} />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Client System ID</label>
                          <input type="text" className="form-control" value={appClientID} onChange={e => setAppClientID(e.target.value)} />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Residential Address</label>
                          <input type="text" className="form-control" value={appClientResAddr} onChange={e => setAppClientResAddr(e.target.value)} />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Business Address</label>
                          <input type="text" className="form-control" value={appClientBusAddr} onChange={e => setAppClientBusAddr(e.target.value)} />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Telephone</label>
                          <input type="text" className="form-control" value={appClientTel} onChange={e => setAppClientTel(e.target.value)} />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Business Type</label>
                          <input type="text" className="form-control" value={appClientBusType} onChange={e => setAppClientBusType(e.target.value)} />
                        </div>
                      </div>

                      <h3 style={{ fontSize: 13, color: 'var(--accent)', borderBottom: '1px solid var(--border)', paddingBottom: 8, marginTop: 12 }}>Loan Parameters</h3>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        <div className="form-group">
                          <label className="form-label">Application Date</label>
                          <input type="date" className="form-control" value={appDate} onChange={e => setAppDate(e.target.value)} />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Loan Taken Date</label>
                          <input type="date" className="form-control" value={appLoanTakenDate} onChange={e => setAppLoanTakenDate(e.target.value)} />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Amount Applied (UGX)</label>
                          <input type="number" className="form-control" value={appAmountApplied} onChange={e => setAppAmountApplied(parseInt(e.target.value) || 0)} />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Amount Approved (UGX)</label>
                          <input type="number" className="form-control" value={appAmountApproved} onChange={e => setAppAmountApproved(parseInt(e.target.value) || 0)} />
                        </div>
                      </div>

                      <h3 style={{ fontSize: 13, color: 'var(--accent)', borderBottom: '1px solid var(--border)', paddingBottom: 8, marginTop: 12 }}>Client Security & Consent Details</h3>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        <div className="form-group">
                          <label className="form-label">Security Item Category (e.g. Motorcycle)</label>
                          <input type="text" className="form-control" value={appSecurityConsent} onChange={e => setAppSecurityConsent(e.target.value)} />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Model/Name of Item</label>
                          <input type="text" className="form-control" value={appItemName} onChange={e => setAppItemName(e.target.value)} />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Quantity</label>
                          <input type="number" className="form-control" value={appItemQuantity} onChange={e => setAppItemQuantity(parseInt(e.target.value) || 1)} />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Item Specifics (e.g. Engine/Chassis No.)</label>
                          <input type="text" className="form-control" value={appItemSpecifics} onChange={e => setAppItemSpecifics(e.target.value)} />
                        </div>
                      </div>

                      <h3 style={{ fontSize: 13, color: 'var(--accent)', borderBottom: '1px solid var(--border)', paddingBottom: 8, marginTop: 12 }}>Next of Kin & Guarantor</h3>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        <div className="form-group">
                          <label className="form-label">Next of Kin Name</label>
                          <input type="text" className="form-control" value={appNextOfKinName} onChange={e => setAppNextOfKinName(e.target.value)} />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Next of Kin Location / Phone</label>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <input type="text" className="form-control" style={{ flex: 1 }} placeholder="Loc" value={appNextOfKinLoc} onChange={e => setAppNextOfKinLoc(e.target.value)} />
                            <input type="text" className="form-control" style={{ flex: 1 }} placeholder="Tel" value={appNextOfKinTel} onChange={e => setAppNextOfKinTel(e.target.value)} />
                          </div>
                        </div>
                        <div className="form-group">
                          <label className="form-label">Guarantor Name</label>
                          <input type="text" className="form-control" value={appGuarantorName} onChange={e => setAppGuarantorName(e.target.value)} />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Guarantor Location / Phone</label>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <input type="text" className="form-control" style={{ flex: 1 }} placeholder="Loc" value={appGuarantorLoc} onChange={e => setAppGuarantorLoc(e.target.value)} />
                            <input type="text" className="form-control" style={{ flex: 1 }} placeholder="Tel" value={appGuarantorTel} onChange={e => setAppGuarantorTel(e.target.value)} />
                          </div>
                        </div>
                      </div>

                      <h3 style={{ fontSize: 13, color: 'var(--accent)', borderBottom: '1px solid var(--border)', paddingBottom: 8, marginTop: 12 }}>Local Council I (LCI) Details</h3>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        <div className="form-group">
                          <label className="form-label">Chairperson Name / Tel</label>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <input type="text" className="form-control" style={{ flex: 1 }} value={appChairpersonName} onChange={e => setAppChairpersonName(e.target.value)} />
                            <input type="text" className="form-control" style={{ flex: 1 }} value={appChairpersonTel} onChange={e => setAppChairpersonTel(e.target.value)} />
                          </div>
                        </div>
                        <div className="form-group">
                          <label className="form-label">Defense Secretary Name / Tel</label>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <input type="text" className="form-control" style={{ flex: 1 }} value={appLCIDefenseName} onChange={e => setAppLCIDefenseName(e.target.value)} />
                            <input type="text" className="form-control" style={{ flex: 1 }} value={appLCIDefenseTel} onChange={e => setAppLCIDefenseTel(e.target.value)} />
                          </div>
                        </div>
                        <div className="form-group">
                          <label className="form-label">Loan Officer Signature Staff</label>
                          <select className="form-control" value={appStaffName} onChange={(e) => setAppStaffName(e.target.value)}>
                            <option value="">-- Select Loan Officer --</option>
                            {staff.map((s, i) => (
                              <option key={i} value={`${s.first_name} ${s.last_name}`}>{s.first_name} {s.last_name}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  )}

                  {(activeDraftTemplate === 'loans_contract' || activeDraftTemplate === 'office_contract') && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                      <h3 style={{ fontSize: 13, color: 'var(--accent)', borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>Contract Engagement Parameters</h3>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        <div className="form-group">
                          <label className="form-label">Select Staff Contractor</label>
                          <select className="form-control" onChange={(e) => {
                            const val = e.target.value;
                            if (val) {
                              const st = staff.find(s => `${s.first_name} ${s.last_name}` === val);
                              if (st) {
                                setContractStaffName(`${st.first_name} ${st.last_name}`);
                                setContractStaffID(st.id || `BYAX-${activeDraftTemplate === 'loans_contract' ? 'LC' : 'OM'}-01`);
                              }
                            }
                          }}>
                            <option value="">-- Choose Staff --</option>
                            {staff.map((s, i) => (
                              <option key={i} value={`${s.first_name} ${s.last_name}`}>{s.first_name} {s.last_name}</option>
                            ))}
                          </select>
                        </div>
                        <div className="form-group">
                          <label className="form-label">Contractor Full Name</label>
                          <input type="text" className="form-control" value={contractStaffName} onChange={e => setContractStaffName(e.target.value)} />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Contractor ID Number</label>
                          <input type="text" className="form-control" value={contractStaffID} onChange={e => setContractStaffID(e.target.value)} />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Agreement Commencing Date</label>
                          <input type="date" className="form-control" value={contractDate} onChange={e => setContractDate(e.target.value)} />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Station / Branch Location</label>
                          <input type="text" className="form-control" value={contractStation} onChange={e => setContractStation(e.target.value)} />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Contract Witness Full Name</label>
                          <input type="text" className="form-control" value={contractWitnessName} onChange={e => setContractWitnessName(e.target.value)} />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Institution Representative Name</label>
                          <input type="text" className="form-control" value={contractRepName} onChange={e => setContractRepName(e.target.value)} />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Institution Representative Designation</label>
                          <input type="text" className="form-control" value={contractRepDesignation} onChange={e => setContractRepDesignation(e.target.value)} />
                        </div>
                      </div>

                      {activeDraftTemplate === 'loans_contract' && (
                        <>
                          <h3 style={{ fontSize: 13, color: 'var(--accent)', borderBottom: '1px solid var(--border)', paddingBottom: 8, marginTop: 12 }}>Loans Consultant Compensation Structure</h3>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                            <div className="form-group">
                              <label className="form-label">Profit Share Commission (%)</label>
                              <input type="number" className="form-control" value={contractCommission} onChange={e => setContractCommission(parseInt(e.target.value) || 0)} />
                            </div>
                            <div className="form-group">
                              <label className="form-label">Daily Food Allowance Range (Min - Max UGX)</label>
                              <div style={{ display: 'flex', gap: 8 }}>
                                <input type="number" className="form-control" style={{ flex: 1 }} placeholder="Min" value={contractFoodMin} onChange={e => setContractFoodMin(parseInt(e.target.value) || 0)} />
                                <input type="number" className="form-control" style={{ flex: 1 }} placeholder="Max" value={contractFoodMax} onChange={e => setContractFoodMax(parseInt(e.target.value) || 0)} />
                              </div>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {/* FORM ACTIONS */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 32, borderTop: '1px solid var(--border)', paddingTop: 20 }}>
                    <button className="btn btn-secondary" onClick={() => setActiveDraftTemplate(null)}>Cancel</button>
                    <button className="btn btn-primary" onClick={() => {
                      generateDraftDocument(activeDraftTemplate);
                    }}>
                      <Printer size={16} style={{ marginRight: 8 }} /> Print Draft (A4 PDF)
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
