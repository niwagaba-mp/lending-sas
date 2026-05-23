import { useEffect, useState } from 'react';
import { Plus, CheckCircle } from 'lucide-react';
import api from '../../services/api';
import { useApp, fmt } from '../../store/AppContext';

const CAT_COLORS: Record<string,string> = { salary:'badge-success', allowance:'badge-active', transport:'badge-B', airtime:'badge-C', recovery:'badge-at_risk', operational:'badge-draft', other:'badge-draft' };

export default function ExpensesPage() {
  const { state } = useApp();
  const curr = state.user?.currency || 'UGX';
  const [expenses, setExpenses] = useState<any[]>([]);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ category:'salary', amount:'', description:'', expense_date: new Date().toISOString().split('T')[0], staff_id: '' });

  const load = () => { setLoading(true); api.getExpenses().then((r: any) => setExpenses(r.data)).finally(()=>setLoading(false)); };
  useEffect(() => { 
    load(); 
    api.getStaff().then((r: any) => setStaffList(r.data));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const st = staffList.find(s => s.id === form.staff_id);
    const desc = form.description || (form.category === 'salary' ? `Monthly Salary Payment for ${st ? st.first_name + ' ' + st.last_name : 'Staff'}` : `Staff Expense (${form.category})`);
    await api.createExpense({ ...form, description: desc, staff_name: st ? `${st.first_name} ${st.last_name}` : 'General Staff' });
    if (form.category === 'salary' && form.staff_id) {
      await api.markStaffSalaryPaid(form.staff_id);
    }
    setShowForm(false); load();
    setForm({ category:'salary', amount:'', description:'', expense_date: new Date().toISOString().split('T')[0], staff_id: '' });
  };

  return (
    <div>
      <div className="page-header">
        <div><h2 className="page-title">Staff Expenses & Payroll</h2><p className="page-subtitle">Salary disbursements, allowance tracking and operational expenses</p></div>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}><Plus size={14} /> Log Expense / Pay Salary</button>
      </div>

      {showForm && (
        <div className="card mb-4">
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Category</label>
                <select className="form-control" value={form.category} onChange={e=>{
                  const cat = e.target.value;
                  const st = staffList.find(s => s.id === form.staff_id);
                  let amt = form.amount;
                  if (st) {
                    if (cat === 'salary') amt = st.salary_approved || 1500000;
                    if (cat === 'allowance') amt = st.allowance_approved || 50000;
                  }
                  setForm(f=>({...f, category: cat, amount: amt}));
                }}>
                  {['salary','allowance','transport','airtime','recovery','operational','other'].map(c => <option key={c} value={c}>{c}</option>)}
                </select></div>
              <div className="form-group"><label className="form-label">Employee / Staff</label>
                <select className="form-control" value={form.staff_id} onChange={e=>{
                  const stId = e.target.value;
                  const st = staffList.find(s => s.id === stId);
                  let amt = form.amount;
                  if (st) {
                    if (form.category === 'salary') amt = st.salary_approved || 1500000;
                    if (form.category === 'allowance') amt = st.allowance_approved || 50000;
                  }
                  setForm(f=>({...f, staff_id: stId, amount: amt}));
                }}>
                  <option value="">Select Staff...</option>
                  {staffList.map(s => <option key={s.id} value={s.id}>{s.first_name} {s.last_name} ({s.role?.replace('_',' ')})</option>)}
                </select></div>
              <div className="form-group"><label className="form-label">Amount (UGX) *</label>
                <input className="form-control" type="number" value={form.amount} onChange={e=>setForm(f=>({...f,amount:e.target.value}))} required /></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Description</label>
                <input className="form-control" value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} /></div>
              <div className="form-group"><label className="form-label">Date</label>
                <input className="form-control" type="date" value={form.expense_date} onChange={e=>setForm(f=>({...f,expense_date:e.target.value}))} /></div>
            </div>
            <button className="btn btn-primary btn-sm" type="submit">Submit Expense</button>
          </form>
        </div>
      )}

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead><tr><th>Staff</th><th>Category</th><th>Amount</th><th>Description</th><th>Date</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {loading
                ? <tr><td colSpan={7} style={{ textAlign:'center', padding:40, color:'var(--text-muted)' }}>Loading...</td></tr>
                : expenses.map(e => (
                <tr key={e.id}>
                  <td>{e.staff_name}</td>
                  <td><span className={`badge ${CAT_COLORS[e.category]||''}`}>{e.category}</span></td>
                  <td className="font-bold">{fmt.currency(e.amount, curr)}</td>
                  <td>{e.description || '—'}</td>
                  <td>{fmt.date(e.expense_date)}</td>
                  <td>
                    {e.is_approved
                      ? <span className="badge badge-active"><CheckCircle size={10}/> Approved</span>
                      : <span className="badge badge-at_risk">Pending</span>}
                  </td>
                  <td>
                    {!e.is_approved && ['branch_manager','supervisor','tenant_admin','super_admin'].includes(state.user?.role||'') && (
                      <button className="btn btn-success btn-sm" onClick={() => api.approveExpense(e.id).then(load)}>Approve</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
