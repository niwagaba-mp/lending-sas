import { useState } from 'react';
import { 
  ArrowLeft, Download, Users, Briefcase, 
  TrendingUp, DollarSign, Database, CheckCircle, AlertTriangle 
} from 'lucide-react';
import { useApp } from '../../store/AppContext';
import api from '../../services/api';

export default function ExportPage() {
  const { state } = useApp();
  const [loading, setLoading] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const curr = state.user?.currency || 'UGX';

  const triggerDownload = (filename: string, headers: string, rows: any[]) => {
    const csvContent = headers + '\n' + rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExport = async (type: 'clients' | 'loans' | 'transactions' | 'expenses') => {
    setLoading(type);
    setError(null);
    setSuccess(null);
    try {
      if (type === 'clients') {
        const res = await api.getClients();
        const data = res.data || [];
        const headers = 'Client ID,First Name,Last Name,National ID,Primary Phone,Gender,DOB,District,Sub-county,Village,Credit Score,Credit Grade,Status,Created At';
        const rows = data.map((c: any) => [
          `"${c.id}"`,
          `"${c.first_name || ''}"`,
          `"${c.last_name || ''}"`,
          `"${c.national_id || ''}"`,
          `"${c.phone_primary || c.phone || ''}"`,
          `"${c.gender || ''}"`,
          `"${c.dob || ''}"`,
          `"${c.district || ''}"`,
          `"${c.sub_county || ''}"`,
          `"${c.village || ''}"`,
          c.credit_score || 0,
          `"${c.credit_grade || ''}"`,
          `"${c.status || ''}"`,
          `"${c.created_at || ''}"`
        ]);
        triggerDownload(`clients_export_${new Date().toISOString().split('T')[0]}.csv`, headers, rows);
        setSuccess('Clients directory exported successfully!');
      } else if (type === 'loans') {
        const res = await api.getLoans();
        const data = res.data || [];
        const headers = 'Loan ID,Loan Number,Client Name,Client Phone,Officer Name,Branch Name,Principal Amount,Interest Rate,Interest Amount,Total Repayable,Total Paid,Outstanding Balance,Arrears Amount,Arrears Days,Status,Loan Type,Disbursed At';
        const rows = data.map((l: any) => [
          `"${l.id}"`,
          `"${l.loan_number || ''}"`,
          `"${l.client_name || ''}"`,
          `"${l.client_phone || ''}"`,
          `"${l.staff_owner || l.officer_name || l.staff_name || ''}"`,
          `"${l.branch_name || ''}"`,
          l.principal_amount || 0,
          l.interest_rate || 0,
          l.interest_amount || 0,
          l.total_repayable || 0,
          l.total_paid || 0,
          l.outstanding_balance || 0,
          l.arrears_amount || 0,
          l.arrears_days || 0,
          `"${l.status || ''}"`,
          `"${l.loan_type || l.repayment_frequency || ''}"`,
          `"${l.disbursement_date || l.disbursed_at || ''}"`
        ]);
        triggerDownload(`loans_export_${new Date().toISOString().split('T')[0]}.csv`, headers, rows);
        setSuccess('Loan book exported successfully!');
      } else if (type === 'transactions') {
        const res = await api.getTransactions();
        const data = res.data || [];
        const headers = 'Transaction ID,Type,Category,Amount,Client Name,Reference,Staff Name,Status,Date,Timestamp';
        const rows = data.map((t: any) => [
          `"${t.id}"`,
          `"${t.type || ''}"`,
          `"${t.category || ''}"`,
          t.amount || 0,
          `"${t.client_name || ''}"`,
          `"${t.reference || ''}"`,
          `"${t.staff_name || ''}"`,
          `"${t.status || ''}"`,
          `"${t.date || ''}"`,
          `"${t.timestamp || ''}"`
        ]);
        triggerDownload(`transactions_export_${new Date().toISOString().split('T')[0]}.csv`, headers, rows);
        setSuccess('Transactions history exported successfully!');
      } else if (type === 'expenses') {
        const res = await api.getExpenses();
        const data = res.data || [];
        const headers = 'Expense ID,Category,Amount,Description,Branch Name,Staff Name,Status,Created At';
        const rows = data.map((e: any) => [
          `"${e.id}"`,
          `"${e.category || ''}"`,
          e.amount || 0,
          `"${(e.description || '').replace(/"/g, '""')}"`,
          `"${e.branch_name || ''}"`,
          `"${e.staff_name || e.submitted_by || ''}"`,
          `"${e.status || ''}"`,
          `"${e.created_at || ''}"`
        ]);
        triggerDownload(`expenses_export_${new Date().toISOString().split('T')[0]}.csv`, headers, rows);
        setSuccess('Expense logs exported successfully!');
      }
    } catch (e: any) {
      setError(e.message || 'Failed to export data. Please try again.');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="page-content" style={{ maxWidth: 1000, margin: '0 auto', paddingBottom: 40 }}>
      
      {/* ── HEADER ────────────────────────────────────────── */}
      <div className="page-header" style={{ marginBottom: 24 }}>
        <div>
          <button 
            onClick={() => window.history.back()} 
            style={{ 
              background: 'transparent', border: 'none', color: 'var(--text-muted)', 
              display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer',
              marginBottom: 12, padding: 0, fontSize: 13 
            }}
          >
            <ArrowLeft size={14} /> Back to Command Center
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ 
              background: 'linear-gradient(135deg, #10b981, #059669)', 
              borderRadius: 8, padding: 6, display: 'flex' 
            }}>
              <Database size={20} color="white" />
            </div>
            <h2 className="page-title" style={{ margin: 0 }}>Data Export Console</h2>
          </div>
          <p className="page-subtitle">Download system data modules in standardized CSV format for bookkeeping, accounting, and audits.</p>
        </div>
      </div>

      {/* Notifications */}
      {success && (
        <div className="alert alert-success animate-fade-in" style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
          <CheckCircle size={18} />
          <span>{success}</span>
        </div>
      )}
      {error && (
        <div className="alert alert-danger animate-fade-in" style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* ── EXPORT OPTIONS ─────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20 }}>
        
        {/* Clients Export Card */}
        <ExportCard 
          icon={<Users size={24} />}
          title="Clients Directory"
          description="Full database of registered clients, their details, credit scores, branch assignments, and registration history."
          loading={loading === 'clients'}
          onClick={() => handleExport('clients')}
          color="#10b981"
        />

        {/* Loan Book Export Card */}
        <ExportCard 
          icon={<Briefcase size={24} />}
          title="Loan Book"
          description="Detailed ledger of all loans issued, principal sums, outstanding balances, repayment types, and active overdue/arrears metrics."
          loading={loading === 'loans'}
          onClick={() => handleExport('loans')}
          color="#3b82f6"
        />

        {/* Repayment Transactions Export Card */}
        <ExportCard 
          icon={<TrendingUp size={24} />}
          title="Repayment Transactions"
          description="Unified history of cash inflows, repayment methods, Slip/Reference numbers, dates, and processing states."
          loading={loading === 'transactions'}
          onClick={() => handleExport('transactions')}
          color="#f59e0b"
        />

        {/* Expense Logs Export Card */}
        <ExportCard 
          icon={<DollarSign size={24} />}
          title="Operational Expense Logs"
          description="Full log of staff-reimbursed operational costs, transport allowances, stationery, airtime, and branches' overhead fees."
          loading={loading === 'expenses'}
          onClick={() => handleExport('expenses')}
          color="#a855f7"
        />

      </div>

    </div>
  );
}

function ExportCard({ icon, title, description, loading, onClick, color }: any) {
  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', padding: 24, justifyContent: 'space-between', height: '100%', borderTop: `4px solid ${color}` }}>
      <div>
        <div style={{ color, background: color + '15', width: 'fit-content', padding: 12, borderRadius: 12, marginBottom: 16 }}>
          {icon}
        </div>
        <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8, color: '#f0f6fc' }}>{title}</h3>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 24 }}>{description}</p>
      </div>
      <button 
        className="btn btn-primary" 
        onClick={onClick} 
        disabled={loading}
        style={{ 
          background: color, borderColor: color, width: '100%', 
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontWeight: 600, color: 'white'
        }}
      >
        <Download size={16} />
        {loading ? 'Exporting...' : `Export ${title}`}
      </button>
    </div>
  );
}
