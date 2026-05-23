import { useEffect, useState } from 'react';
import { Search, Plus, Edit2, Building2, MapPin, Phone, Mail, ShieldAlert } from 'lucide-react';
import api, { isDemoMode } from '../../services/api';
import { useApp, fmt } from '../../store/AppContext';

export default function BranchesPage() {
  const { state } = useApp();
  const curr = state.user?.currency || 'UGX';
  const userRole = state.user?.role || 'admin';
  const canModify = ['super_admin', 'tenant_admin'].includes(userRole);

  const [branches, setBranches] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [regionFilter, setRegionFilter] = useState('');

  // Modals state
  const [showModal, setShowModal] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<any>(null);

  // Form state
  const [form, setForm] = useState({
    name: '',
    code: '',
    phone: '',
    email: '',
    region: 'Central',
    district: '',
    address: '',
    latitude: '',
    longitude: '',
    manager_id: '',
    is_active: true
  });

  const load = async () => {
    setLoading(true);
    try {
      const branchRes = await api.getBranches();
      setBranches(branchRes.data || []);
      
      const staffRes = await api.getStaff();
      setStaff(staffRes.data || []);
    } catch (err) {
      console.error('Failed to load branches data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleOpenOnboard = () => {
    setSelectedBranch(null);
    setForm({
      name: '',
      code: '',
      phone: '',
      email: '',
      region: 'Central',
      district: '',
      address: '',
      latitude: '0.3476',
      longitude: '32.5825',
      manager_id: '',
      is_active: true
    });
    setShowModal(true);
  };

  const handleOpenEdit = (branch: any) => {
    setSelectedBranch(branch);
    setForm({
      name: branch.name || '',
      code: branch.code || '',
      phone: branch.phone || '',
      email: branch.email || '',
      region: branch.region || 'Central',
      district: branch.district || '',
      address: branch.address || '',
      latitude: branch.latitude ? String(branch.latitude) : '0.3476',
      longitude: branch.longitude ? String(branch.longitude) : '32.5825',
      manager_id: branch.manager_id || '',
      is_active: branch.is_active !== false
    });
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (selectedBranch) {
        // Edit Branch
        await api.updateBranch(selectedBranch.id, form);
      } else {
        // Onboard New Branch
        await api.createBranch(form);
      }
      setShowModal(false);
      load();
    } catch (err: any) {
      alert(err.message || 'Error saving branch details');
    }
  };

  // Filter logic
  const filteredBranches = branches.filter(b => {
    const term = search.toLowerCase();
    const matchesSearch = 
      b.name?.toLowerCase().includes(term) ||
      b.code?.toLowerCase().includes(term) ||
      b.district?.toLowerCase().includes(term) ||
      b.manager_name?.toLowerCase().includes(term);

    const matchesRegion = !regionFilter || b.region === regionFilter;
    return matchesSearch && matchesRegion;
  });

  // Calculate totals
  const totalPortfolio = filteredBranches.reduce((sum, b) => sum + Number(b.portfolio_value || b.total_portfolio || 0), 0);
  const totalClients = filteredBranches.reduce((sum, b) => sum + Number(b.client_count || 0), 0);
  const totalActiveLoans = filteredBranches.reduce((sum, b) => sum + Number(b.active_loan_count || b.active_loans || 0), 0);

  return (
    <div style={{ padding: '4px 0' }}>
      {/* Page Header */}
      <div className="page-header" style={{ marginBottom: 24 }}>
        <div>
          <h2 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Building2 size={24} color="var(--accent)" />
            Branch Directory & Management
          </h2>
          <p className="page-subtitle">Configure, onboard and audit institutional branches and regional nodes</p>
        </div>
        <div className="flex gap-2">
          <div className="search-bar">
            <Search size={14} color="var(--text-muted)" />
            <input 
              placeholder="Search branches..." 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
            />
          </div>
          <select 
            className="form-control" 
            style={{ width: 160, height: 42, background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--text-primary)' }}
            value={regionFilter} 
            onChange={e => setRegionFilter(e.target.value)}
          >
            <option value="">All Regions</option>
            <option value="Central">Central Region</option>
            <option value="Eastern">Eastern Region</option>
            <option value="Western">Western Region</option>
            <option value="Northern">Northern Region</option>
          </select>
          {canModify && (
            <button className="btn btn-primary" onClick={handleOpenOnboard} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Plus size={16} /> Onboard Branch
            </button>
          )}
        </div>
      </div>

      {/* Global Branch Summary Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        <div className="card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Active Branches</span>
          <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'baseline', gap: 8 }}>
            {filteredBranches.length}
            <span style={{ fontSize: 12, color: 'var(--text-success)', fontWeight: 600 }}>100% Operational</span>
          </div>
        </div>
        <div className="card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Cumulative Portfolio</span>
          <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--accent)' }}>
            {fmt.currency(totalPortfolio, curr)}
          </div>
        </div>
        <div className="card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Active Loans</span>
          <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary)' }}>
            {totalActiveLoans}
          </div>
        </div>
        <div className="card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Clients Served</span>
          <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--blue)' }}>
            {totalClients}
          </div>
        </div>
      </div>

      {/* Branch List Table */}
      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Branch Details</th>
                <th>Location / Code</th>
                <th>Branch Manager</th>
                <th style={{ textAlign: 'right' }}>Active Loans</th>
                <th style={{ textAlign: 'right' }}>Outstanding Portfolio</th>
                <th style={{ textAlign: 'right' }}>Clients</th>
                <th>Status</th>
                {canModify && <th style={{ textAlign: 'center' }}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={canModify ? 8 : 7} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                    Loading branches directory data...
                  </td>
                </tr>
              ) : filteredBranches.length === 0 ? (
                <tr>
                  <td colSpan={canModify ? 8 : 7} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                    No branches found matching your search.
                  </td>
                </tr>
              ) : (
                filteredBranches.map(b => {
                  const isActive = b.is_active !== false;
                  return (
                    <tr key={b.id}>
                      <td>
                        <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--text-primary)' }}>{b.name}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4, fontSize: 11, color: 'var(--text-muted)' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Phone size={10} /> {b.phone || 'No phone'}</span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Mail size={10} /> {b.email || 'No email'}</span>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <MapPin size={12} color="var(--accent)" />
                          <span style={{ fontWeight: 600 }}>{b.district || 'Unspecified'}</span>
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Code: {b.code} ({b.region} Region)</div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{b.manager_name || 'Unassigned'}</div>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Manager ID: {b.manager_id || 'N/A'}</div>
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 700 }}>
                        {b.active_loan_count || b.active_loans || 0}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 800, color: 'var(--accent)' }}>
                        {fmt.currency(b.portfolio_value || b.total_portfolio || 0, curr)}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--blue)' }}>
                        {b.client_count || 0}
                      </td>
                      <td>
                        <span className={`badge ${isActive ? 'badge-success' : 'badge-at_risk'}`}>
                          {isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      {canModify && (
                        <td style={{ textAlign: 'center' }}>
                          <button 
                            className="btn btn-secondary btn-sm" 
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                            onClick={() => handleOpenEdit(b)}
                          >
                            <Edit2 size={12} /> Edit
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Onboard / Edit Branch Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 600 }}>
            <div className="modal-header">
              <h3 className="modal-title">
                {selectedBranch ? 'Modify Branch Settings' : 'Onboard New Branch Node'}
              </h3>
              <button className="btn btn-icon btn-secondary" onClick={() => setShowModal(false)}>&times;</button>
            </div>
            
            <form onSubmit={handleSave}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Branch Name *</label>
                  <input 
                    className="form-control" 
                    value={form.name} 
                    onChange={e => setForm({ ...form, name: e.target.value })} 
                    placeholder="e.g. Jinja Regional Branch" 
                    required 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Branch Code *</label>
                  <input 
                    className="form-control" 
                    value={form.code} 
                    onChange={e => setForm({ ...form, code: e.target.value })} 
                    placeholder="e.g. JNJ-01" 
                    required 
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Phone Contact</label>
                  <input 
                    className="form-control" 
                    value={form.phone} 
                    onChange={e => setForm({ ...form, phone: e.target.value })} 
                    placeholder="e.g. +256700000000" 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input 
                    className="form-control" 
                    type="email"
                    value={form.email} 
                    onChange={e => setForm({ ...form, email: e.target.value })} 
                    placeholder="e.g. jinja@kilimomf.co.ug" 
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Region *</label>
                  <select 
                    className="form-control" 
                    value={form.region} 
                    onChange={e => setForm({ ...form, region: e.target.value })}
                    required
                  >
                    <option value="Central">Central</option>
                    <option value="Eastern">Eastern</option>
                    <option value="Western">Western</option>
                    <option value="Northern">Northern</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">District *</label>
                  <input 
                    className="form-control" 
                    value={form.district} 
                    onChange={e => setForm({ ...form, district: e.target.value })} 
                    placeholder="e.g. Jinja" 
                    required 
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Physical Address</label>
                <input 
                  className="form-control" 
                  value={form.address} 
                  onChange={e => setForm({ ...form, address: e.target.value })} 
                  placeholder="e.g. Plot 12, Main Street, Jinja" 
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Latitude</label>
                  <input 
                    className="form-control" 
                    value={form.latitude} 
                    onChange={e => setForm({ ...form, latitude: e.target.value })} 
                    placeholder="0.3476" 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Longitude</label>
                  <input 
                    className="form-control" 
                    value={form.longitude} 
                    onChange={e => setForm({ ...form, longitude: e.target.value })} 
                    placeholder="32.5825" 
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Branch Manager</label>
                  <select 
                    className="form-control" 
                    value={form.manager_id} 
                    onChange={e => setForm({ ...form, manager_id: e.target.value })}
                  >
                    <option value="">Select Manager...</option>
                    {staff.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.first_name} {s.last_name} ({s.role?.replace('_', ' ')})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Operational Status</label>
                  <select 
                    className="form-control" 
                    value={form.is_active ? 'true' : 'false'} 
                    onChange={e => setForm({ ...form, is_active: e.target.value === 'true' })}
                  >
                    <option value="true">Active / Operational</option>
                    <option value="false">Inactive / Suspended</option>
                  </select>
                </div>
              </div>

              {isDemoMode() && (
                <div style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 10, padding: '10px 14px', display: 'flex', gap: 10, marginTop: 16 }}>
                  <ShieldAlert size={18} color="rgba(245,158,11,1)" style={{ flexShrink: 0, marginTop: 2 }} />
                  <span style={{ fontSize: 12, color: 'var(--text-primary)' }}>
                    <strong>Demo Mode Active:</strong> Changes will be synchronized locally in client-side storage without connecting to the DB server.
                  </span>
                </div>
              )}

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 24, borderTop: '1px solid var(--border)', paddingTop: 16 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {selectedBranch ? 'Save Changes' : 'Onboard Node'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
