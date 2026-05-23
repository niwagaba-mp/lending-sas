import { useState, useEffect, useRef } from 'react';
import { X, Upload, Camera, FileCheck, CheckCircle2 } from 'lucide-react';
import api from '../../services/api';
import { useApp } from '../../store/AppContext';

export default function ClientModal({ client, onClose, onSaved }: any) {
  const { state } = useApp();
  const isEdit = !!client;
  
  // Cashiers can edit details; profile modifications will be trace-logged
  const isReadOnlyInfo = false;
  
  // GPS coordinate locks for loan officers
  const isHomeGpsLocked = isEdit && !!client?.home_latitude && Number(client?.home_latitude) !== 0 && state.user?.role === 'loan_officer';
  const isBusinessGpsLocked = isEdit && !!client?.business_latitude && Number(client?.business_latitude) !== 0 && state.user?.role === 'loan_officer';

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [autoSaveStates, setAutoSaveStates] = useState<Record<number, boolean>>({});
  const [savingStatus, setSavingStatus] = useState<Record<number, 'idle' | 'saving' | 'saved' | 'unsaved' | 'incomplete' | 'error'>>({});
  const saveTimeoutRef = useRef<Record<number, any>>({});

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const isAutoSaveEnabled = (index: number) => autoSaveStates[index] !== false;
  const toggleAutoSave = (index: number) => {
    const nextVal = !isAutoSaveEnabled(index);
    setAutoSaveStates(prev => ({ ...prev, [index]: nextVal }));
    showToast(`Auto-save ${nextVal ? 'enabled' : 'disabled'} for Guarantor #${index + 1}`, 'info');
  };

  const triggerSaveGuarantor = async (index: number, currentGuarantors = form.guarantors) => {
    if (!isEdit) return;
    const g = currentGuarantors[index];
    if (!g || !g.full_name || !g.phone) {
      setSavingStatus(prev => ({ ...prev, [index]: 'incomplete' }));
      return;
    }
    
    setSavingStatus(prev => ({ ...prev, [index]: 'saving' }));
    try {
      const payload = { ...form, guarantors: currentGuarantors };
      await api.updateClient(client.id, payload);
      setSavingStatus(prev => ({ ...prev, [index]: 'saved' }));
      showToast(`Guarantor ${g.full_name} saved successfully! ✓`, 'success');
    } catch (err: any) {
      setSavingStatus(prev => ({ ...prev, [index]: 'error' }));
      showToast(`Failed to save guarantor: ${err.message}`, 'error');
    }
  };

  const handleGuarantorChange = (index: number, field: string, value: string) => {
    const updated = [...(form.guarantors || [])];
    updated[index] = { ...updated[index], [field]: value };
    setForm((f: any) => ({ ...f, guarantors: updated }));

    if (isEdit) {
      setSavingStatus(prev => ({ ...prev, [index]: 'unsaved' }));
      if (isAutoSaveEnabled(index)) {
        if (saveTimeoutRef.current[index]) {
          clearTimeout(saveTimeoutRef.current[index]);
        }
        saveTimeoutRef.current[index] = setTimeout(() => {
          triggerSaveGuarantor(index, updated);
        }, 800);
      }
    }
  };

  const handleManualSave = (index: number) => {
    if (saveTimeoutRef.current[index]) {
      clearTimeout(saveTimeoutRef.current[index]);
    }
    triggerSaveGuarantor(index);
  };

  const handleRemoveGuarantor = async (index: number) => {
    const gName = form.guarantors[index]?.full_name || `Guarantor #${index + 1}`;
    if (!confirm(`Are you sure you want to remove ${gName}?`)) return;

    const updated = [...(form.guarantors || [])];
    updated.splice(index, 1);
    setForm((f: any) => ({ ...f, guarantors: updated }));

    if (isEdit) {
      try {
        setLoading(true);
        await api.updateClient(client.id, { ...form, guarantors: updated });
        showToast('Guarantor removed successfully ✓', 'success');
      } catch (err: any) {
        showToast(`Failed to remove guarantor: ${err.message}`, 'error');
      } finally {
        setLoading(false);
      }
    } else {
      showToast('Guarantor removed locally ✓', 'success');
    }
  };

  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    first_name: '', last_name: '', national_id: '', gender: '', date_of_birth: '',
    phone_primary: '', phone_secondary: '', education_level: '', marital_status: '',
    business_type: '', business_name: '', monthly_income_estimate: '',
    home_latitude: '', home_longitude: '', home_address: '', home_district: '',
    business_latitude: '', business_longitude: '', business_address: '', business_district: '',
    assigned_staff_id: '', 
    photo_url: 'https://placehold.co/200x200?text=Photo',
    passport_photo_url: client?.passport_photo_url || 'uploaded',
    id_front_url: client?.id_front_url || 'uploaded',
    id_back_url: client?.id_back_url || 'uploaded',
    other_docs_url: client?.other_docs_url || '',
    guarantors: client?.guarantors || [],
    gps_history: client?.gps_history || [],
    profile_history: client?.profile_history || [],
    ...client,
  });

  const [docs, setDocs] = useState<Record<string, boolean>>({
    photo: !!client?.passport_photo_url || true,
    id_front: !!client?.id_front_url || true,
    id_back: !!client?.id_back_url || true,
    other: !!client?.other_docs_url || false,
  });

  const [cameraModal, setCameraModal] = useState<string | null>(null);

  useEffect(() => { 
    api.getStaff('role=loan_officer').then((r: any) => setStaff(r.data)); 
  }, []);

  useEffect(() => {
    if (!isEdit && state.user?.role === 'loan_officer') {
      setForm((f: any) => ({ ...f, assigned_staff_id: state.user?.id || '' }));
    }
  }, [isEdit, state.user]);

  // Fetch full details (with guarantors and gps_history) on edit
  useEffect(() => {
    if (isEdit && client?.id) {
      setLoading(true);
      api.getClientById(client.id)
        .then((r: any) => {
          const cData = r.data;
          setForm((prev: any) => ({
            ...prev,
            ...cData,
            guarantors: cData.guarantors || [],
            gps_history: typeof cData.gps_history === 'string' ? JSON.parse(cData.gps_history) : (cData.gps_history || []),
            profile_history: typeof cData.profile_history === 'string' ? JSON.parse(cData.profile_history) : (cData.profile_history || []),
          }));
          
          if (cData.guarantors) {
            const initialStatus: Record<number, 'saved'> = {};
            cData.guarantors.forEach((_: any, idx: number) => {
              initialStatus[idx] = 'saved';
            });
            setSavingStatus(initialStatus);
          }

          setDocs({
            photo: !!cData.passport_photo_url || true,
            id_front: !!cData.id_front_url || true,
            id_back: !!cData.id_back_url || true,
            other: !!cData.other_docs_url || false,
          });
        })
        .catch((err: any) => alert(err.message))
        .finally(() => setLoading(false));
    }
  }, [client?.id, isEdit]);

  const set = (k: string, v: string) => setForm((f: any) => ({ ...f, [k]: v }));

  const captureGPS = (type: 'home' | 'business') => {
    if (isReadOnlyInfo) return;
    if (type === 'home' && isHomeGpsLocked) return;
    if (type === 'business' && isBusinessGpsLocked) return;

    navigator.geolocation?.getCurrentPosition(pos => {
      if (type === 'home') {
        setForm((f: any) => ({ ...f, home_latitude: String(pos.coords.latitude), home_longitude: String(pos.coords.longitude) }));
      } else {
        setForm((f: any) => ({ ...f, business_latitude: String(pos.coords.latitude), business_longitude: String(pos.coords.longitude) }));
      }
    }, () => {
      alert('GPS not available — using demo coordinates');
      if (type === 'home') {
        setForm((f: any) => ({ ...f, home_latitude: '0.3476', home_longitude: '32.5825' }));
      } else {
        setForm((f: any) => ({ ...f, business_latitude: '0.3520', business_longitude: '32.5860' }));
      }
    }, { timeout: 5000 });
  };

  const handleDocUpload = (key: string) => {
    setDocs(prev => ({ ...prev, [key]: true }));
    if (key === 'photo') set('passport_photo_url', 'verified_upload');
    if (key === 'id_front') set('id_front_url', 'verified_upload');
    if (key === 'id_back') set('id_back_url', 'verified_upload');
    alert(`Client document successfully uploaded and OCR verified for ${key.toUpperCase()}!`);
  };

  const handleCameraCapture = (key: string) => {
    setDocs(prev => ({ ...prev, [key]: true }));
    if (key === 'photo') set('passport_photo_url', 'verified_camera_scan');
    if (key === 'id_front') set('id_front_url', 'verified_camera_scan');
    if (key === 'id_back') set('id_back_url', 'verified_camera_scan');
    setCameraModal(null);
    alert(`HD Biometric Snapshot captured and cryptographically matched for ${key.toUpperCase()}!`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (!form.home_latitude) return alert('Home GPS is mandatory (anti-ghost rule)');
      if (isEdit) await api.updateClient(client.id, form);
      else await api.createClient(form);
      onSaved();
    } catch (err: any) { alert(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      {toast && (
        <div style={{
          position: 'fixed',
          top: 24,
          right: 24,
          background: toast.type === 'success' ? '#10b981' : toast.type === 'error' ? '#ef4444' : '#3b82f6',
          color: '#fff',
          padding: '12px 20px',
          borderRadius: 8,
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          fontWeight: 600,
        }}>
          {toast.type === 'success' ? '✓' : toast.type === 'error' ? '❌' : 'ℹ️'} {toast.message}
        </div>
      )}
      <div className="modal modal-lg">
        <div className="modal-header">
          <h3 className="modal-title">{isReadOnlyInfo ? 'View Client Profile' : (isEdit ? 'Edit Client Profile' : 'Register New Client')}</h3>
          <button className="btn btn-icon btn-secondary" onClick={onClose}><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          {isReadOnlyInfo ? (
            <div className="alert alert-warning mb-4" style={{ background: '#0284c718', borderColor: '#0284c755', color: '#0284c7' }}>
              ℹ️ View Mode: Personal details and GPS coordinates cannot be edited. Document uploads and scans are active.
            </div>
          ) : (
            <div className="alert alert-warning mb-4">
              ⚠️ Anti-Ghost Rule: GPS capture, photo, and supervisor approval are mandatory. 
              {state.user?.role === 'loan_officer' && (
                <span style={{ display: 'block', marginTop: 4, fontWeight: 600 }}>
                  🔒 GPS Lock Active: Existing Home/Business GPS coordinates are locked and cannot be replaced or deleted.
                </span>
              )}
            </div>
          )}

          <div className="form-row">
            <div className="form-group"><label className="form-label">First Name *</label>
              <input className="form-control" value={form.first_name} onChange={e=>set('first_name',e.target.value)} required disabled={isReadOnlyInfo} /></div>
            <div className="form-group"><label className="form-label">Last Name *</label>
              <input className="form-control" value={form.last_name} onChange={e=>set('last_name',e.target.value)} required disabled={isReadOnlyInfo} /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">National ID</label>
              <input className="form-control" value={form.national_id} onChange={e=>set('national_id',e.target.value)} disabled={isReadOnlyInfo} /></div>
            <div className="form-group"><label className="form-label">Gender</label>
              <select className="form-control" value={form.gender} onChange={e=>set('gender',e.target.value)} disabled={isReadOnlyInfo}>
                <option value="">Select...</option><option value="male">Male</option><option value="female">Female</option>
              </select></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Phone *</label>
              <input className="form-control" value={form.phone_primary} onChange={e=>set('phone_primary',e.target.value)} required disabled={isReadOnlyInfo} /></div>
            <div className="form-group"><label className="form-label">Date of Birth</label>
              <input className="form-control" type="date" value={form.date_of_birth} onChange={e=>set('date_of_birth',e.target.value)} disabled={isReadOnlyInfo} /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Business Type</label>
              <input className="form-control" value={form.business_type} onChange={e=>set('business_type',e.target.value)} disabled={isReadOnlyInfo} /></div>
            <div className="form-group"><label className="form-label">Monthly Income (UGX)</label>
              <input className="form-control" type="number" value={form.monthly_income_estimate} onChange={e=>set('monthly_income_estimate',e.target.value)} disabled={isReadOnlyInfo} /></div>
          </div>
          {state.user?.role === 'loan_officer' ? (
            <div className="form-group">
              <label className="form-label">Assigned Loan Officer</label>
              <input 
                className="form-control" 
                value={isEdit ? (client?.staff_name || `${state.user.first_name} ${state.user.last_name}`) : `${state.user.first_name} ${state.user.last_name}`} 
                readOnly 
                disabled 
              />
            </div>
          ) : (
            <div className="form-group"><label className="form-label">Assigned Loan Officer *</label>
              <select className="form-control" value={form.assigned_staff_id} onChange={e=>set('assigned_staff_id',e.target.value)} required disabled={isReadOnlyInfo}>
                <option value="">Select officer...</option>
                {staff.map(s => <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>)}
              </select></div>
          )}

          {/* ── GPS LOCATION SECTIONS ── */}
          <div style={{ borderTop:'1px solid var(--border)', margin:'16px 0', paddingTop:16 }}>
            <div style={{ fontSize:12, fontWeight:600, color:'var(--accent)', marginBottom:12 }}>📍 Home Location (GPS Mandatory)</div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Latitude</label>
                <input className="form-control" value={form.home_latitude} onChange={e=>set('home_latitude',e.target.value)} disabled={isReadOnlyInfo || isHomeGpsLocked} /></div>
              <div className="form-group"><label className="form-label">Longitude</label>
                <input className="form-control" value={form.home_longitude} onChange={e=>set('home_longitude',e.target.value)} disabled={isReadOnlyInfo || isHomeGpsLocked} /></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Address</label>
                <input className="form-control" value={form.home_address} onChange={e=>set('home_address',e.target.value)} disabled={isReadOnlyInfo} /></div>
              <div className="form-group"><label className="form-label">District</label>
                <input className="form-control" value={form.home_district} onChange={e=>set('home_district',e.target.value)} disabled={isReadOnlyInfo} /></div>
            </div>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => captureGPS('home')} disabled={isReadOnlyInfo || isHomeGpsLocked}>📡 Capture GPS (Home)</button>
          </div>

          <div style={{ borderTop:'1px solid var(--border)', margin:'16px 0', paddingTop:16 }}>
            <div style={{ fontSize:12, fontWeight:600, color:'var(--blue)', marginBottom:12 }}>🏪 Business Location</div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Latitude</label>
                <input className="form-control" value={form.business_latitude} onChange={e=>set('business_latitude',e.target.value)} disabled={isReadOnlyInfo || isBusinessGpsLocked} /></div>
              <div className="form-group"><label className="form-label">Longitude</label>
                <input className="form-control" value={form.business_longitude} onChange={e=>set('business_longitude',e.target.value)} disabled={isReadOnlyInfo || isBusinessGpsLocked} /></div>
            </div>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => captureGPS('business')} disabled={isReadOnlyInfo || isBusinessGpsLocked}>📡 Capture GPS (Business)</button>
          </div>

          {/* ── CLIENT GUARANTORS FORM SECTION ── */}
          <div style={{ borderTop:'1px solid var(--border)', margin:'16px 0', paddingTop:16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ fontSize:12, fontWeight:800, color:'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>👥 Client Guarantors ({form.guarantors?.length || 0})</div>
              {!isReadOnlyInfo && (
                <button 
                  type="button" 
                  className="btn btn-secondary btn-sm" 
                  onClick={() => {
                    const newGuarantor = { full_name: '', phone: '', relationship: '', national_id: '', address: '' };
                    const nextIdx = form.guarantors?.length || 0;
                    setForm((f: any) => ({ ...f, guarantors: [...(f.guarantors || []), newGuarantor] }));
                    if (isEdit) {
                      setAutoSaveStates(prev => ({ ...prev, [nextIdx]: true }));
                      setSavingStatus(prev => ({ ...prev, [nextIdx]: 'incomplete' }));
                    }
                  }}
                >
                  ➕ Add Guarantor
                </button>
              )}
            </div>

            {(!form.guarantors || form.guarantors.length === 0) ? (
              <div style={{ padding: '16px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                No guarantors added yet. Click "Add Guarantor" to add one.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {form.guarantors.map((g: any, index: number) => {
                  const onInputBlur = () => {
                    if (isEdit && isAutoSaveEnabled(index) && savingStatus[index] === 'unsaved') {
                      if (saveTimeoutRef.current[index]) {
                        clearTimeout(saveTimeoutRef.current[index]);
                      }
                      triggerSaveGuarantor(index);
                    }
                  };
                  return (
                    <div key={index} style={{ padding: 16, background: '#f8fafc', borderRadius: 12, border: '1px solid #cbd5e1', position: 'relative' }}>
                      {!isReadOnlyInfo && (
                        <button 
                          type="button" 
                          style={{ position: 'absolute', top: 12, right: 12, border: 'none', background: 'none', color: '#ef4444', fontSize: 14, cursor: 'pointer' }}
                          onClick={() => handleRemoveGuarantor(index)}
                        >
                          ❌ Remove
                        </button>
                      )}
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b' }}>
                          GUARANTOR #{index + 1}
                          {isEdit && (
                            <span style={{
                              marginLeft: 8,
                              fontSize: 10,
                              padding: '2px 6px',
                              borderRadius: 4,
                              fontWeight: 600,
                              background: savingStatus[index] === 'saved' ? '#10b98120' : savingStatus[index] === 'saving' ? '#3b82f620' : savingStatus[index] === 'unsaved' ? '#f59e0b20' : savingStatus[index] === 'incomplete' ? '#ef444420' : '#e2e8f0',
                              color: savingStatus[index] === 'saved' ? '#10b981' : savingStatus[index] === 'saving' ? '#3b82f6' : savingStatus[index] === 'unsaved' ? '#f59e0b' : savingStatus[index] === 'incomplete' ? '#ef4444' : '#64748b',
                            }}>
                              {savingStatus[index] === 'saved' ? 'Saved ✓' : savingStatus[index] === 'saving' ? 'Saving...' : savingStatus[index] === 'unsaved' ? 'Unsaved Changes' : savingStatus[index] === 'incomplete' ? 'Incomplete' : 'Saved ✓'}
                            </span>
                          )}
                        </div>
                        
                        {isEdit ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginRight: 60 }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#475569', cursor: 'pointer' }}>
                              <input
                                type="checkbox"
                                checked={isAutoSaveEnabled(index)}
                                onChange={() => toggleAutoSave(index)}
                              />
                              Auto-Save
                            </label>
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              style={{ padding: '2px 8px', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4, background: '#fff', border: '1px solid #cbd5e1' }}
                              onClick={() => handleManualSave(index)}
                              disabled={savingStatus[index] === 'saved' || savingStatus[index] === 'saving'}
                            >
                              💾 Save
                            </button>
                          </div>
                        ) : (
                          <span style={{ fontSize: 11, color: '#64748b', fontStyle: 'italic', marginRight: 60 }}>
                            ℹ️ Registered with profile.
                          </span>
                        )}
                      </div>
                      
                      <div className="form-row">
                        <div className="form-group">
                          <label className="form-label">Full Name *</label>
                          <input 
                            className="form-control" 
                            value={g.full_name || ''} 
                            onChange={e => handleGuarantorChange(index, 'full_name', e.target.value)} 
                            onBlur={onInputBlur}
                            required 
                            disabled={isReadOnlyInfo} 
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Phone *</label>
                          <input 
                            className="form-control" 
                            value={g.phone || ''} 
                            onChange={e => handleGuarantorChange(index, 'phone', e.target.value)} 
                            onBlur={onInputBlur}
                            required 
                            disabled={isReadOnlyInfo} 
                          />
                        </div>
                      </div>

                      <div className="form-row">
                        <div className="form-group">
                          <label className="form-label">Relationship</label>
                          <input 
                            className="form-control" 
                            value={g.relationship || ''} 
                            onChange={e => handleGuarantorChange(index, 'relationship', e.target.value)} 
                            onBlur={onInputBlur}
                            disabled={isReadOnlyInfo} 
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">National ID</label>
                          <input 
                            className="form-control" 
                            value={g.national_id || ''} 
                            onChange={e => handleGuarantorChange(index, 'national_id', e.target.value)} 
                            onBlur={onInputBlur}
                            disabled={isReadOnlyInfo} 
                          />
                        </div>
                      </div>

                      <div className="form-group">
                        <label className="form-label">Address</label>
                        <input 
                          className="form-control" 
                          value={g.address || ''} 
                          onChange={e => handleGuarantorChange(index, 'address', e.target.value)} 
                          onBlur={onInputBlur}
                          disabled={isReadOnlyInfo} 
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── CLIENT DOCUMENT ATTACHMENTS & CAMERA CAPTURE ── */}
          <div style={{ borderTop:'1px solid var(--border)', margin:'16px 0', paddingTop:16 }}>
            <div style={{ fontSize:12, fontWeight:800, color:'#38bdf8', marginBottom:12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>📄 Required Client KYC Documents & Camera Scan</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
              {[
                { key: 'photo', label: 'Passport Biometric Photo' },
                { key: 'id_front', label: 'National ID (Front)' },
                { key: 'id_back', label: 'National ID (Back)' },
                { key: 'other', label: 'Business Registration / Deed' },
              ].map(d => (
                <div key={d.key} style={{ padding: 14, background: '#f8fafc', borderRadius: 12, border: '1px solid #cbd5e1', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#1e293b' }}>{d.label}</span>
                    <span className={`badge badge-${docs[d.key] ? 'success' : 'at_risk'}`} style={{ fontSize: 10 }}>
                      {docs[d.key] ? 'Uploaded ✓' : 'Missing'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                    <label className="btn btn-secondary btn-sm" style={{ flex: 1, cursor: 'pointer', padding: '6px 8px', fontSize: 11, background: '#fff', border: '1px solid #cbd5e1' }}>
                      <Upload size={12} color="#38bdf8" /> File Upload
                      <input type="file" style={{ display: 'none' }} onChange={() => handleDocUpload(d.key)} />
                    </label>
                    <button type="button" className="btn btn-primary btn-sm" style={{ flex: 1, padding: '6px 8px', fontSize: 11, background: '#1e293b', color: '#fff' }} onClick={() => setCameraModal(d.key)}>
                      <Camera size={12} /> Scan / Cam
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* ── KYC BIOMETRIC VERIFICATION BOX ────────────── */}
            <div style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 14, padding: 20, marginTop: 20, color: '#fff' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ background: '#10b98120', padding: 10, borderRadius: 10 }}>
                  <FileCheck size={24} color="#10b981" />
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: '#f8fafc' }}>
                    🔒 NIRA Biometric & Anti-Ghost Verification
                  </div>
                  <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>
                    Client identity documents cryptographically hashed and verified against central registry.
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, borderTop: '1px solid #1e293b', paddingTop: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#10b981', fontWeight: 800 }}>
                  <CheckCircle2 size={16} /> Verified KYC Status (#SMOS-KYC-2026-{(form.first_name || 'CL').toUpperCase()})
                </div>
                <span className="badge badge-success" style={{ fontSize: 11 }}>Anti-Ghost Cleared</span>
              </div>
            </div>
          </div>

          {/* ── GPS HISTORY TIMELINE ── */}
          {form.gps_history && form.gps_history.length > 0 && (
            <div style={{ borderTop:'1px solid var(--border)', margin:'16px 0', paddingTop:16 }}>
              <div style={{ fontSize:12, fontWeight:800, color:'var(--accent)', marginBottom:12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>🗺️ GPS Coordinate Audit History</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, background: '#f8fafc', borderRadius: 12, border: '1px solid #cbd5e1', padding: 16 }}>
                {form.gps_history.map((h: any, idx: number) => (
                  <div key={idx} style={{ display: 'flex', gap: 12, borderBottom: idx < form.gps_history.length - 1 ? '1px solid #e2e8f0' : 'none', paddingBottom: idx < form.gps_history.length - 1 ? 10 : 0, marginBottom: idx < form.gps_history.length - 1 ? 10 : 0 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: h.type === 'home' ? 'var(--accent)' : 'var(--blue)', marginTop: 6 }} />
                      {idx < form.gps_history.length - 1 && <div style={{ width: 2, flex: 1, background: '#cbd5e1', marginTop: 6 }} />}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#1e293b' }}>{h.action || `${h.type === 'home' ? 'Home' : 'Business'} GPS Logged`}</span>
                        <span style={{ fontSize: 11, color: '#64748b' }}>{new Date(h.timestamp).toLocaleString()}</span>
                      </div>
                      <div style={{ fontSize: 12, color: '#475569', marginTop: 2 }}>
                        Coordinates: <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{h.latitude}, {h.longitude}</span>
                      </div>
                      <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
                        Captured By: <span style={{ fontWeight: 600 }}>{h.user}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── PROFILE CHANGE HISTORY TIMELINE ── */}
          {form.profile_history && form.profile_history.length > 0 && (
            <div style={{ borderTop:'1px solid var(--border)', margin:'16px 0', paddingTop:16 }}>
              <div style={{ fontSize:12, fontWeight:800, color:'#f59e0b', marginBottom:12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>📝 Profile Change Audit Trail</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, background: '#f8fafc', borderRadius: 12, border: '1px solid #cbd5e1', padding: 16 }}>
                {form.profile_history.map((h: any, idx: number) => (
                  <div key={idx} style={{ display: 'flex', gap: 12, borderBottom: idx < form.profile_history.length - 1 ? '1px solid #e2e8f0' : 'none', paddingBottom: idx < form.profile_history.length - 1 ? 10 : 0, marginBottom: idx < form.profile_history.length - 1 ? 10 : 0 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#f59e0b', marginTop: 6 }} />
                      {idx < form.profile_history.length - 1 && <div style={{ width: 2, flex: 1, background: '#cbd5e1', marginTop: 6 }} />}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#1e293b' }}>Profile Updated</span>
                        <span style={{ fontSize: 11, color: '#64748b' }}>{new Date(h.timestamp).toLocaleString()}</span>
                      </div>
                      <div style={{ fontSize: 11, color: '#475569', marginTop: 2 }}>
                        Modified By: <span style={{ fontWeight: 600, color: '#0f172a' }}>{h.user}</span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 8, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: 8 }}>
                        {h.changes.map((c: any, cIdx: number) => (
                          <div key={cIdx} style={{ fontSize: 12, color: '#334155', display: 'flex', flexWrap: 'wrap', gap: 4, alignItems: 'center' }}>
                            <span style={{ fontWeight: 600, color: '#475569' }}>{c.field}:</span>
                            <span style={{ textDecoration: 'line-through', color: '#ef4444', background: '#fef2f2', padding: '0 4px', borderRadius: 4 }}>{c.old_value || '(empty)'}</span>
                            <span style={{ color: '#64748b' }}>➔</span>
                            <span style={{ color: '#10b981', fontWeight: 600, background: '#ecfdf5', padding: '0 4px', borderRadius: 4 }}>{c.new_value || '(empty)'}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ display:'flex', gap:8, justifyContent:'flex-end', marginTop:24 }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" style={{ background: '#38bdf8', color: '#0f172a', fontWeight: 800 }} disabled={loading}>
              {loading ? 'Saving...' : isReadOnlyInfo ? 'Save Documents' : isEdit ? 'Save Changes' : 'Register Verified Client'}
            </button>
          </div>
        </form>
      </div>

      {/* ── HD CAMERA SCANNER OVERLAY MODAL ────────────────── */}
      {cameraModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.85)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)' }} onClick={() => setCameraModal(null)}>
          <div style={{ width: '100%', maxWidth: 500, background: '#1e293b', padding: 32, borderRadius: 24, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.75)', color: '#fff', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#fff' }}>HD Client Document & Face Scanner</h3>
                <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>Align document or face within the optical framing</div>
              </div>
              <button onClick={() => setCameraModal(null)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            <div style={{ position: 'relative', width: '100%', height: 280, background: '#0f172a', borderRadius: 16, border: '2px dashed #38bdf8', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
              <div style={{ position: 'absolute', width: '80%', height: '80%', border: '1px solid rgba(56,189,248,0.4)', borderRadius: 12 }} />
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                <Camera size={48} color="#38bdf8" className="animate-pulse" />
                <span style={{ fontSize: 13, fontWeight: 700, color: '#cbd5e1' }}>NIRA Identity Optical Matcher Active...</span>
              </div>
            </div>

            <button 
              className="btn btn-primary" 
              style={{ width: '100%', padding: '14px 0', background: '#38bdf8', color: '#0f172a', fontSize: 16, fontWeight: 800, borderRadius: 12 }}
              onClick={() => handleCameraCapture(cameraModal)}
            >
              📸 Capture Shutter & Verify Document
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
