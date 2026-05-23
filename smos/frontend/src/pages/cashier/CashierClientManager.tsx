import { useState, useEffect, Fragment } from 'react';
import { X, Search, User, Phone, Briefcase, CreditCard, Edit2, Check, TrendingUp, ShieldCheck, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useApp, fmt } from '../../store/AppContext';

export default function CashierClientManager({ onClose, isPage = false }: { onClose?: () => void, isPage?: boolean }) {
  const { state } = useApp();
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'loans' | 'ledger'>('profile');
  const [staffList, setStaffList] = useState<any[]>([]);
  
  const navigate = useNavigate();
  const curr = state.user?.currency || 'UGX';
  
  const handleClose = () => {
    if (onClose) onClose();
    else if (isPage) navigate('/cashier');
  };

  useEffect(() => { load(); loadStaff(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.getClients();
      setClients(res.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const loadStaff = async () => {
    try {
      const res = await api.getStaff();
      setStaffList(res.data || []);
    } catch (e) { console.error(e); }
  };

  const filtered = clients.filter(c => 
    !search || 
    c.first_name?.toLowerCase().includes(search.toLowerCase()) || 
    c.last_name?.toLowerCase().includes(search.toLowerCase()) ||
    c.phone_primary?.includes(search) ||
    c.id_number?.includes(search)
  );

  const content = (
    <div style={{
      background: '#161b22', border: isPage ? 'none' : '1px solid #30363d', borderRadius: isPage ? 0 : 16,
      width: '100%', height: isPage ? 'calc(100vh - 64px)' : '90vh', display: 'flex', overflow: 'hidden',
      position: 'relative',
      maxWidth: isPage ? 'none' : 1200,
    }}>
      {!isPage && (
        <button 
          onClick={handleClose}
          style={{
            position: 'absolute', top: 12, right: 12, zIndex: 1100,
            background: '#21262d', border: '1px solid #30363d', color: '#7d8590',
            width: 32, height: 32, borderRadius: '50%', display: 'flex', 
            alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
          }}
          onMouseEnter={e => e.currentTarget.style.color = '#f0f6fc'}
          onMouseLeave={e => e.currentTarget.style.color = '#7d8590'}
        >
          <X size={16} />
        </button>
      )}
        
        {/* Left Sidebar: Client List */}
        <div style={{ width: 350, borderRight: '1px solid #30363d', display: 'flex', flexDirection: 'column', background: '#0d1117' }}>
          <div style={{ padding: 20, borderBottom: '1px solid #30363d' }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#f0f6fc', marginBottom: 12 }}>Client Portfolio</h3>
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#7d8590' }} />
              <input 
                type="text" 
                placeholder="Search name, phone or ID..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{
                  width: '100%', background: '#161b22', border: '1px solid #30363d', borderRadius: 8,
                  padding: '8px 12px 8px 36px', color: '#e6edf3', fontSize: 13, outline: 'none'
                }}
              />
            </div>
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {loading ? (
              <div style={{ padding: 20, textAlign: 'center', color: '#7d8590' }}>Loading clients...</div>
            ) : filtered.length === 0 ? (
              <div style={{ padding: 20, textAlign: 'center', color: '#7d8590' }}>No clients found.</div>
            ) : (
              filtered.map(c => (
                <div 
                  key={c.id} 
                  onClick={() => { setSelectedClient(c); setActiveTab('profile'); }}
                  style={{
                    padding: '12px 20px', borderBottom: '1px solid #21262d', cursor: 'pointer',
                    background: selectedClient?.id === c.id ? '#1c2128' : 'transparent',
                    borderLeft: selectedClient?.id === c.id ? '3px solid #3fb950' : '3px solid transparent'
                  }}
                >
                  <div style={{ fontWeight: 600, color: selectedClient?.id === c.id ? '#3fb950' : '#f0f6fc' }}>{c.first_name} {c.last_name}</div>
                  <div style={{ fontSize: 11, color: '#7d8590', marginTop: 2 }}>{c.phone_primary} · {c.branch_name}</div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Content: Client Details */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {selectedClient ? (
            <ClientDetailsView 
              client={selectedClient} 
              activeTab={activeTab} 
              setActiveTab={setActiveTab} 
              staffList={staffList}
              handleClose={handleClose}
              onUpdate={load}
              curr={curr}
            />
          ) : (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#7d8590' }}>
              <div style={{ fontSize: 48, marginBottom: 20 }}>👤</div>
              <h3 style={{ color: '#f0f6fc' }}>Select a client to view details</h3>
              <p style={{ fontSize: 13 }}>Search and select a client from the list on the left to begin audit.</p>
              <button onClick={handleClose} style={{ marginTop: 24, background: '#21262d', border: '1px solid #30363d', color: '#c9d1d9', padding: '10px 24px', borderRadius: 8, cursor: 'pointer' }}>Close Client Manager</button>
            </div>
          )}
        </div>
      </div>
    );

  if (isPage) return content;

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
    }}>
      {content}
    </div>
  );
}

function ClientDetailsView({ client, activeTab, setActiveTab, staffList, onUpdate, curr, handleClose }: any) {
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({...client});
  const [loans, setLoans] = useState<any[]>([]);
  const [repayments, setRepayments] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [expandedLoanId, setExpandedLoanId] = useState<string | null>(null);

  useEffect(() => {
    setFormData({...client});
    if (activeTab === 'loans' || activeTab === 'ledger') loadClientFinancials();
  }, [client, activeTab]);

  const loadClientFinancials = async () => {
    setLoadingData(true);
    try {
      const [lRes, rRes] = await Promise.all([
        api.getLoans(`client_id=${client.id}`),
        api.getRepayments(`client_id=${client.id}`)
      ]);
      const fetchedLoans = lRes.data || [];
      const fetchedRepayments = rRes.data || [];
      
      setLoans(fetchedLoans);
      
      // Calculate running balances for repayments
      const loanTotals: Record<string, number> = fetchedLoans.reduce((acc: any, l: any) => {
        const total = Number(l.total_repayable) || (Number(l.outstanding_balance || 0) + Number(l.total_paid || 0)) || Number(l.principal_amount || l.principal || 0);
        acc[l.id] = total;
        if (l.loan_number) acc[l.loan_number] = total;
        return acc;
      }, {});
      
      const chronological = [...fetchedRepayments].sort((a: any, b: any) => new Date(a.payment_date || a.created_at).getTime() - new Date(b.payment_date || b.created_at).getTime() || a.id.localeCompare(b.id));
      const balanceMap: Record<string, number> = {};
      
      const processedRepayments = chronological.map((r: any) => {
        const key = r.loan_id || r.loan_number;
        if (balanceMap[key] === undefined) balanceMap[key] = loanTotals[key] || 0;
        balanceMap[key] -= Number(r.amount_paid || r.amount || 0);
        return { ...r, balance_after: Math.max(0, balanceMap[key]) };
      });
      
      setRepayments(processedRepayments.sort((a, b) => new Date(b.payment_date || b.created_at).getTime() - new Date(a.payment_date || a.created_at).getTime()));
    } catch (e) { console.error(e); }
    finally { setLoadingData(false); }
  };

  const totalArrears = loans.reduce((acc, l) => acc + Number(l.arrears_amount || 0), 0);
  const totalRunningBalance = loans.filter(l => !['closed', 'written_off', 'defaulted'].includes(l.status)).reduce((acc, l) => acc + Number(l.outstanding_balance || 0), 0);
  const hasActiveLoan = loans.some(l => !['closed', 'written_off', 'defaulted'].includes(l.status));

  const save = async () => {
    try {
      await api.updateClient(client.id, formData);
      setEditing(false);
      onUpdate();
      alert('Client details updated successfully.');
    } catch (e: any) { alert(e.message); }
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '24px 30px', borderBottom: '1px solid #30363d', background: '#1c2128', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#3fb95015', border: '2px solid #3fb950', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>👤</div>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#f0f6fc' }}>{client.first_name} {client.last_name}</h2>
            <div style={{ fontSize: 13, color: '#7d8590', display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
              <span>ID: {client.id_number || client.national_id}</span>
              <span>•</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Phone size={12}/> {client.phone_primary || client.phone}</span>
              <span>•</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><ShieldCheck size={14}/> Owner: {staffList.find((s: any) => s.id === client.staff_id)?.first_name || 'Sarah'} {staffList.find((s: any) => s.id === client.staff_id)?.last_name || 'Nambi'}</span>
              <span>•</span>
              <span>Client since {new Date(client.created_at).toLocaleDateString()}</span>
            </div>
            {totalArrears > 0 && (
              <div style={{ marginTop: 6, fontSize: 11, fontWeight: 700, color: '#f43f5e', background: '#f43f5e15', padding: '2px 8px', borderRadius: 12, display: 'inline-block', border: '1px solid #f43f5e30' }}>
                ⚠️ Arrears: {fmt.currency(totalArrears, curr)}
              </div>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 24 }}>
          <div style={{ textAlign: 'right' }}>
             <div style={{ fontSize: 11, fontWeight: 600, color: '#7d8590', textTransform: 'uppercase' }}>Loan Eligibility</div>
             {hasActiveLoan ? (
               <div style={{ fontSize: 13, fontWeight: 700, color: '#f59e0b', marginTop: 4 }}>Not Eligible (Uncleared Loan)</div>
             ) : (
               <div style={{ fontSize: 13, fontWeight: 700, color: '#3fb950', marginTop: 4 }}>Eligible for New Loan</div>
             )}
          </div>
          <div style={{ width: 1, background: '#30363d' }}></div>
          <div style={{ textAlign: 'right' }}>
             <div style={{ fontSize: 11, fontWeight: 600, color: '#7d8590', textTransform: 'uppercase' }}>Running Balance</div>
             <div style={{ fontSize: 18, fontWeight: 800, color: '#f0f6fc', marginTop: 2 }}>
               {fmt.currency(totalRunningBalance, curr)}
             </div>
          </div>
          <div style={{ width: 1, background: '#30363d' }}></div>
          <div style={{ textAlign: 'right', marginRight: 10 }}>
             <div style={{ fontSize: 11, fontWeight: 600, color: '#7d8590', textTransform: 'uppercase' }}>Credit Score</div>
             <div style={{ fontSize: 18, fontWeight: 800, color: '#3fb950', display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end', marginTop: 2 }}>
               <TrendingUp size={16} /> {client.credit_score || 720}
             </div>
          </div>
          <button onClick={handleClose} style={{ background: '#21262d', border: '1px solid #30363d', color: '#7d8590', width: 36, height: 36, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', marginLeft: 12 }}>
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid #30363d', background: '#0d1117' }}>
        {[
          { id: 'profile', label: 'Client Profile', icon: <User size={16} /> },
          { id: 'loans', label: 'Loan History', icon: <Briefcase size={16} /> },
          { id: 'ledger', label: 'Repayment Ledger', icon: <CreditCard size={16} /> },
          { id: 'guarantors', label: 'Guarantors', icon: <Users size={16} /> },
        ].map(t => (
          <button 
            key={t.id}
            onClick={() => setActiveTab(t.id as any)}
            style={{
              padding: '16px 24px', background: 'none', border: 'none', color: activeTab === t.id ? '#f0f6fc' : '#7d8590',
              fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
              borderBottom: activeTab === t.id ? '2px solid #f78166' : '2px solid transparent',
              transition: 'all 0.2s'
            }}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 30 }}>
        {activeTab === 'profile' && (
          <div style={{ maxWidth: 800 }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
               <h4 style={{ fontSize: 15, fontWeight: 700, color: '#f0f6fc' }}>Basic Information</h4>
               <button onClick={() => editing ? save() : setEditing(true)} style={{
                 background: editing ? '#238636' : '#21262d', border: '1px solid #30363d',
                 color: '#f0f6fc', padding: '6px 16px', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontSize: 12
               }}>
                 {editing ? <><Check size={14} /> Save Changes</> : <><Edit2 size={14} /> Edit Profile</>}
               </button>
             </div>

             <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                <Field label="First Name" value={formData.first_name} onChange={(v:any) => setFormData({...formData, first_name: v})} editing={editing} />
                <Field label="Last Name" value={formData.last_name} onChange={(v:any) => setFormData({...formData, last_name: v})} editing={editing} />
                <Field label="Phone Primary" value={formData.phone_primary} onChange={(v:any) => setFormData({...formData, phone_primary: v})} editing={editing} />
                <Field label="ID Number" value={formData.id_number} onChange={(v:any) => setFormData({...formData, id_number: v})} editing={editing} />
                <Field label="Occupation" value={formData.occupation} onChange={(v:any) => setFormData({...formData, occupation: v})} editing={editing} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 12, color: '#7d8590', fontWeight: 600 }}>Client Ownership (Assigned Staff)</label>
                  {editing ? (
                    <select 
                      value={formData.staff_id} 
                      onChange={e => setFormData({...formData, staff_id: e.target.value})}
                      style={{ background: '#0d1117', border: '1px solid #30363d', borderRadius: 6, padding: '8px 12px', color: '#e6edf3', fontSize: 13 }}
                    >
                      {staffList.map((s: any) => <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>)}
                    </select>
                  ) : (
                    <div style={{ padding: '8px 0', fontSize: 14, color: '#f0f6fc', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <ShieldCheck size={16} className="text-accent" />
                      {staffList.find((s: any) => s.id === client.staff_id)?.first_name || 'Sarah'} {staffList.find((s: any) => s.id === client.staff_id)?.last_name || 'Nambi'}
                    </div>
                  )}
                </div>
                <Field label="Residential Address" value={formData.address} onChange={(v:any) => setFormData({...formData, address: v})} editing={editing} span={2} />
             </div>

             <div style={{ marginTop: 40, padding: 20, background: '#1c2128', border: '1px solid #30363d', borderRadius: 12 }}>
                <h4 style={{ fontSize: 14, fontWeight: 700, color: '#f0f6fc', marginBottom: 12 }}>Audit Notes</h4>
                <textarea 
                  placeholder="Enter notes about client character, business stability, or repayment behavior..."
                  style={{ width: '100%', background: '#0d1117', border: '1px solid #30363d', borderRadius: 8, padding: 12, color: '#e6edf3', fontSize: 13, minHeight: 100, outline: 'none' }}
                />
             </div>
          </div>
        )}

        {activeTab === 'loans' && (
          <div>
            <h4 style={{ fontSize: 15, fontWeight: 700, color: '#f0f6fc', marginBottom: 20 }}>Loan History (Credit Book)</h4>
            {loadingData ? <p>Loading history...</p> : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead style={{ borderBottom: '2px solid #30363d' }}>
                  <tr>
                    <th style={{ padding: 12, textAlign: 'left', color: '#7d8590' }}>LOAN #</th>
                    <th style={{ padding: 12, textAlign: 'left', color: '#7d8590' }}>DATE</th>
                    <th style={{ padding: 12, textAlign: 'right', color: '#7d8590' }}>PRINCIPAL</th>
                    <th style={{ padding: 12, textAlign: 'right', color: '#7d8590' }}>BALANCE</th>
                    <th style={{ padding: 12, textAlign: 'center', color: '#7d8590' }}>STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {loans.length === 0 ? <tr><td colSpan={5} style={{ padding: 20, textAlign: 'center' }}>No loans found for this client.</td></tr> : loans.map(l => (
                    <Fragment key={l.id}>
                      <tr 
                        onClick={() => setExpandedLoanId(expandedLoanId === l.id ? null : l.id)}
                        style={{ borderBottom: '1px solid #21262d', cursor: 'pointer', background: expandedLoanId === l.id ? '#1c2128' : 'transparent' }}
                      >
                        <td style={{ padding: 12, fontWeight: 700, color: '#58a6ff' }}>{l.loan_number}</td>
                        <td style={{ padding: 12 }}>{l.disbursement_date || l.disbursed_at || l.created_at ? new Date(l.disbursement_date || l.disbursed_at || l.created_at).toLocaleDateString() : 'Pending'}</td>
                        <td style={{ padding: 12, textAlign: 'right' }}>{fmt.currency(l.principal_amount || l.principal || 0, curr)}</td>
                        <td style={{ padding: 12, textAlign: 'right', fontWeight: 700, color: '#f59e0b' }}>{fmt.currency(l.outstanding_balance, curr)}</td>
                        <td style={{ padding: 12, textAlign: 'center' }}>
                           <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 10, background: l.status === 'active' ? '#3fb95020' : '#30363d', color: l.status === 'active' ? '#3fb950' : '#7d8590' }}>{l.status.replace('_', ' ').toUpperCase()}</span>
                        </td>
                      </tr>
                      {expandedLoanId === l.id && (
                        <tr style={{ background: '#0d1117' }}>
                          <td colSpan={5} style={{ padding: '16px 24px', borderBottom: '1px solid #21262d' }}>
                            <div style={{ fontSize: 12, fontWeight: 600, color: '#7d8590', marginBottom: 12, textTransform: 'uppercase' }}>Payment History & Balance Edits</div>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, background: '#161b22', borderRadius: 8, overflow: 'hidden' }}>
                              <thead style={{ background: '#21262d' }}>
                                <tr>
                                  <th style={{ padding: '8px 12px', textAlign: 'left', color: '#7d8590' }}>DATE</th>
                                  <th style={{ padding: '8px 12px', textAlign: 'left', color: '#7d8590' }}>REFERENCE</th>
                                  <th style={{ padding: '8px 12px', textAlign: 'right', color: '#7d8590' }}>PAID</th>
                                  <th style={{ padding: '8px 12px', textAlign: 'right', color: '#7d8590' }}>BALANCE AFTER</th>
                                  <th style={{ padding: '8px 12px', textAlign: 'center', color: '#7d8590' }}>STATUS</th>
                                </tr>
                              </thead>
                              <tbody>
                                {repayments.filter(r => r.loan_id === l.id || r.loan_number === l.loan_number).length === 0 ? (
                                  <tr><td colSpan={5} style={{ padding: 12, textAlign: 'center', color: '#7d8590' }}>No payments found.</td></tr>
                                ) : repayments.filter(r => r.loan_id === l.id || r.loan_number === l.loan_number).map(r => (
                                  <tr key={r.id} style={{ borderBottom: '1px solid #21262d' }}>
                                    <td style={{ padding: '8px 12px' }}>{new Date(r.payment_date || r.created_at).toLocaleDateString()}</td>
                                    <td style={{ padding: '8px 12px' }}>{r.reference_number || 'SYS'}</td>
                                    <td style={{ padding: '8px 12px', textAlign: 'right', color: '#3fb950', fontWeight: 600 }}>{fmt.currency(r.amount_paid || r.amount || 0, curr)}</td>
                                    <td style={{ padding: '8px 12px', textAlign: 'right', color: '#f59e0b', fontWeight: 600 }}>{fmt.currency(r.balance_after, curr)}</td>
                                    <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                                      {r.is_reversed ? (
                                        <span style={{ color: '#f43f5e', fontSize: 10, fontWeight: 700 }}>REVERSED (EDIT)</span>
                                      ) : (
                                        <span style={{ color: '#7d8590', fontSize: 10 }}>VALID</span>
                                      )}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {activeTab === 'ledger' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h4 style={{ fontSize: 15, fontWeight: 700, color: '#f0f6fc' }}>Repayment Ledger (Individual Loan Transactions)</h4>
            </div>
            {loadingData ? <p style={{ color: '#7d8590' }}>Loading ledger...</p> : repayments.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#7d8590', background: '#161b22', borderRadius: 8, border: '1px solid #30363d' }}>
                No repayment history found for this client.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
                {loans.map(l => {
                  const loanReps = repayments.filter(r => r.loan_id === l.id || r.loan_number === l.loan_number);
                  if (loanReps.length === 0) return null;
                  return (
                    <div key={l.id} style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 12, overflow: 'hidden' }}>
                      <div style={{ padding: '16px 20px', background: '#21262d', borderBottom: '1px solid #30363d', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', gap: 40, alignItems: 'center' }}>
                          <div>
                            <div style={{ fontSize: 11, fontWeight: 600, color: '#7d8590', textTransform: 'uppercase' }}>Loan Number</div>
                            <h5 style={{ fontSize: 14, fontWeight: 700, color: '#58a6ff', margin: 0 }}>{l.loan_number}</h5>
                          </div>
                          <div>
                            <div style={{ fontSize: 11, fontWeight: 600, color: '#7d8590', textTransform: 'uppercase' }}>Loan Given Date</div>
                            <div style={{ fontSize: 13, color: '#f0f6fc', fontWeight: 600, marginTop: 2 }}>
                              {l.disbursement_date || l.disbursed_at || l.created_at ? new Date(l.disbursement_date || l.disbursed_at || l.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Pending'}
                            </div>
                          </div>
                          <div>
                            <div style={{ fontSize: 11, fontWeight: 600, color: '#7d8590', textTransform: 'uppercase' }}>Principal Amount</div>
                            <div style={{ fontSize: 13, color: '#f0f6fc', fontWeight: 600, marginTop: 2 }}>{fmt.currency(l.principal_amount || l.principal || 0, curr)}</div>
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: 11, fontWeight: 600, color: '#7d8590', textTransform: 'uppercase' }}>Performance Status</div>
                          <span style={{ display: 'inline-block', marginTop: 4, fontSize: 10, padding: '4px 10px', borderRadius: 12, background: l.status === 'active' ? '#3fb95020' : '#30363d', color: l.status === 'active' ? '#3fb950' : '#7d8590', fontWeight: 700 }}>
                            {l.status.replace('_', ' ').toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                        <thead style={{ background: '#0d1117' }}>
                          <tr>
                            <th style={{ padding: '12px 20px', textAlign: 'left', color: '#7d8590', fontWeight: 600, fontSize: 11, textTransform: 'uppercase' }}>DATE OF PAYMENT</th>
                            <th style={{ padding: '12px 20px', textAlign: 'left', color: '#7d8590', fontWeight: 600, fontSize: 11, textTransform: 'uppercase' }}>REFERENCE</th>
                            <th style={{ padding: '12px 20px', textAlign: 'left', color: '#7d8590', fontWeight: 600, fontSize: 11, textTransform: 'uppercase' }}>RECORDED BY</th>
                            <th style={{ padding: '12px 20px', textAlign: 'right', color: '#7d8590', fontWeight: 600, fontSize: 11, textTransform: 'uppercase' }}>AMOUNT PAID</th>
                            <th style={{ padding: '12px 20px', textAlign: 'right', color: '#7d8590', fontWeight: 600, fontSize: 11, textTransform: 'uppercase' }}>LOAN BALANCE AFTER PAYMENT</th>
                          </tr>
                        </thead>
                        <tbody>
                          {loanReps.map(r => (
                            <tr key={r.id} style={{ borderBottom: '1px solid #21262d' }}>
                              <td style={{ padding: '12px 20px', color: '#e6edf3' }}>{new Date(r.timestamp || r.created_at || r.payment_date).toLocaleString()}</td>
                              <td style={{ padding: '12px 20px', color: '#58a6ff' }}>{r.reference || r.reference_number || 'SYS-GEN'}</td>
                              <td style={{ padding: '12px 20px', color: '#e6edf3' }}>{r.staff_name || r.collected_by_name || 'System'}</td>
                              <td style={{ padding: '12px 20px', textAlign: 'right', fontWeight: 700, color: '#3fb950' }}>{fmt.currency(r.amount_paid || r.amount || 0, curr)}</td>
                              <td style={{ padding: '12px 20px', textAlign: 'right', fontWeight: 700, color: '#f59e0b' }}>{fmt.currency(r.balance_after, curr)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, value, onChange, editing, span = 1 }: any) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, gridColumn: span === 2 ? 'span 2' : 'auto' }}>
      <label style={{ fontSize: 12, color: '#7d8590', fontWeight: 600 }}>{label}</label>
      {editing ? (
        <input 
          type="text" 
          value={value} 
          onChange={e => onChange(e.target.value)}
          style={{ background: '#0d1117', border: '1px solid #30363d', borderRadius: 6, padding: '8px 12px', color: '#e6edf3', fontSize: 13, outline: 'none' }}
        />
      ) : (
        <div style={{ padding: '8px 0', fontSize: 14, color: '#f0f6fc', fontWeight: 500 }}>{value || '—'}</div>
      )}
    </div>
  );
}
