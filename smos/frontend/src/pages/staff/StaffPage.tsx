import { useEffect, useState } from 'react';
import { Search, Plus, Eye } from 'lucide-react';
import api from '../../services/api';
import { useApp, fmt } from '../../store/AppContext';
import StaffModal from './StaffModal';

const ROLE_COLORS: Record<string, string> = {
  super_admin: 'badge-active', tenant_admin: 'badge-active',
  branch_manager: 'badge-B', supervisor: 'badge-C',
  loan_officer: 'badge-D', cashier: 'badge-D', auditor: 'badge-at_risk',
};

export default function StaffPage() {
  const { state } = useApp();
  const curr = state.user?.currency || 'UGX';
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState<any>(null);

  const load = () => {
    setLoading(true);
    api.getStaff(search ? `search=${search}` : '')
      .then((r: any) => setStaff(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [search]);

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">Staff Management</h2>
          <p className="page-subtitle">{staff.length} staff members</p>
        </div>
        <div className="flex gap-2">
          <div className="search-bar">
            <Search size={14} color="var(--text-muted)" />
            <input placeholder="Search staff..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <button className="btn btn-primary" onClick={() => { setSelected(null); setShowModal(true); }}>
            <Plus size={14} /> Add Staff
          </button>
        </div>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th><th>Role</th><th>Branch</th><th>Phone</th>
                <th>Approved Salary</th><th>Daily Allowance</th><th>Payroll Status</th><th>Recommender</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? <tr><td colSpan={9} style={{ textAlign:'center', padding:40, color:'var(--text-muted)' }}>Loading...</td></tr>
                : staff.map(s => (
                <tr key={s.id}>
                  <td>
                    <div className="font-bold">{s.first_name} {s.last_name}</div>
                    <div style={{ fontSize:11, color:'var(--text-muted)' }}>{s.email}</div>
                  </td>
                  <td><span className={`badge ${ROLE_COLORS[s.role] || ''}`}>{s.role?.replace('_',' ')}</span></td>
                  <td>{s.branch_name}</td>
                  <td className="font-mono">{s.phone_primary}</td>
                  <td className="font-bold text-success">{fmt.currency(s.salary_approved || 1500000, curr)}</td>
                  <td className="font-bold" style={{ color: 'var(--blue)' }}>{fmt.currency(s.allowance_approved || 50000, curr)}/day</td>
                  <td>
                    <span className={`badge ${s.payroll_status === 'Paid' ? 'badge-success' : 'badge-at_risk'}`}>
                      {s.payroll_status || 'Unpaid'}
                    </span>
                  </td>
                  <td>
                    <div className="font-bold" style={{ fontSize: 12 }}>{s.recommender_name || 'Dr. William Bwogi'}</div>
                    <div style={{ fontSize:11, color:'var(--text-muted)' }}>{s.recommender_workplace || 'Bank of Uganda'} ({s.recommender_phone || '+256772900800'})</div>
                  </td>
                  <td>
                    <button className="btn btn-secondary btn-sm"
                      onClick={() => { setSelected(s); setShowModal(true); }}>
                      <Eye size={12} /> View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <StaffModal
          staff={selected}
          onClose={() => setShowModal(false)}
          onSaved={() => { setShowModal(false); load(); }}
        />
      )}
    </div>
  );
}
