import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useApp } from '../../store/AppContext';
import { Lock, Mail, Eye, EyeOff, Loader, Shield, Upload, FileText, CheckCircle, Smartphone, CreditCard, ChevronRight, X, AlertCircle } from 'lucide-react';
import api from '../../services/api';

export default function LoginPage() {
  const { state, login } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [forceLive, setForceLive] = useState(localStorage.getItem('smos_force_live') === 'true');
  const toggleForceLive = () => {
    const newVal = !forceLive;
    setForceLive(newVal);
    if (newVal) {
      localStorage.setItem('smos_force_live', 'true');
    } else {
      localStorage.removeItem('smos_force_live');
    }
  };

  // ── SaaS Onboarding & Subscription Wizard States ──
  const [showSubModal, setShowSubModal] = useState(false);
  const [subStep, setSubStep] = useState(1);
  const [subName, setSubName] = useState('');
  const [subSlug, setSubSlug] = useState('');
  const [subEmail, setSubEmail] = useState('');
  const [subPassword, setSubPassword] = useState('');
  const [subRecoveryEmail, setSubRecoveryEmail] = useState('');
  const [subPlan, setSubPlan] = useState('Enterprise');
  const [subCountry, setSubCountry] = useState('Uganda');
  const [subBilling, setSubBilling] = useState(500000);
  const [subDocs, setSubDocs] = useState<any[]>([]);
  const [mobileNum, setMobileNum] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'mm' | 'card'>('mm');
  const [payLink, setPayLink] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckoutActive, setIsCheckoutActive] = useState(false);
  const [isPaymentConfirmed, setIsPaymentConfirmed] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);
  const [subErr, setSubErr] = useState('');
  const [subSuccessMsg, setSubSuccessMsg] = useState('');

  const handlePlanChange = (plan: string) => {
    setSubPlan(plan);
    if (plan === 'Basic') setSubBilling(150000);
    else if (plan === 'Premium') setSubBilling(300000);
    else setSubBilling(500000);
  };

  const handleGenerateCheckout = () => {
    if (!subSlug) return;
    const generatedLink = `https://pay.smos.io/${subSlug.toLowerCase().trim()}/invoice-${Date.now().toString().slice(-4)}`;
    setPayLink(generatedLink);
    setIsCheckoutActive(true);
  };

  const handleSimulatePayment = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setIsPaymentConfirmed(true);
      setIsSubmitting(false);
      setIsCheckoutActive(false);
    }, 1800);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const filesArray = Array.from(e.target.files);
    
    filesArray.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSubDocs(prev => [...prev, {
          name: file.name,
          type: file.type,
          size: file.size,
          dataUrl: reader.result as string
        }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeSubDoc = (idx: number) => {
    setSubDocs(prev => prev.filter((_, i) => i !== idx));
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubErr('');
    setIsSubmitting(true);
    try {
      const tenantRes = await api.createTenant({
        name: subName,
        slug: subSlug.toLowerCase().trim(),
        email: subEmail,
        admin_password: subPassword,
        plan_name: subPlan,
        base_billing: subBilling,
        billing_amount: subBilling,
        country: subCountry,
        payment_status: 'paid',
        sub_status: 'pending_approval'
      });
      
      const newTenantId = tenantRes.data.id;

      for (const doc of subDocs) {
        await api.uploadDocument({
          name: doc.name,
          category: 'business',
          subcategory: 'onboarding_verification',
          entity_id: newTenantId,
          entity_name: subName,
          file_type: doc.type,
          file_size: doc.size,
          file_data: doc.dataUrl || '',
          notes: 'Uploaded during self-service onboarding registration'
        });
      }

      setSubSuccessMsg(`Subscription Submitted! Your onboarding registration for "${subName}" is now pending review by the system owner. We will contact you at ${subEmail} once approved.`);
      setShowCompleted(true);
    } catch (err: any) {
      setSubErr(err.message || 'Onboarding registration failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetModal = () => {
    setShowSubModal(false);
    setSubStep(1);
    setSubName('');
    setSubSlug('');
    setSubEmail('');
    setSubPassword('');
    setSubRecoveryEmail('');
    setSubPlan('Enterprise');
    setSubCountry('Uganda');
    setSubBilling(500000);
    setSubDocs([]);
    setMobileNum('');
    setCardNumber('');
    setPaymentMethod('mm');
    setPayLink('');
    setIsCheckoutActive(false);
    setIsPaymentConfirmed(false);
    setShowCompleted(false);
    setSubErr('');
    setSubSuccessMsg('');
  };

  if (state.user) {
    if (state.user.role === 'super_admin') return <Navigate to="/superadmin" replace />;
    if (state.user.role === 'tenant_admin') return <Navigate to="/executive/console" replace />;
    if (state.user.role === 'cashier') return <Navigate to="/cashier" replace />;
    if (state.user.role === 'loan_officer') return <Navigate to="/notebook" replace />;
    if (state.user.role === 'admin' || state.user.role === 'branch_manager') return <Navigate to="/admin" replace />;
    return <Navigate to="/dashboard" replace />;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const fillAndLogin = (m: string, p: string) => {
    setEmail(m);
    setPassword(p);
  };

  return (
    <div className="auth-page">
      <div className="auth-box">
        <div className="auth-logo">
          <div style={{ fontSize: 36, marginBottom: 8 }}>⚡</div>
          <h1>SMART MICROFINANCE OS</h1>
          <p>Decentralized Lending Intelligence Platform</p>
        </div>

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                className="form-control"
                style={{ paddingLeft: 36 }}
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                className="form-control"
                style={{ paddingLeft: 36, paddingRight: 36 }}
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
              <button type="button" onClick={() => setShowPw(!showPw)}
                style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="alert mb-4" style={{
              background: error.includes('Backend offline') ? '#f59e0b18' : '#ef444418',
              border: `1px solid ${error.includes('Backend offline') ? '#f59e0b55' : '#ef444455'}`,
              color: error.includes('Backend offline') ? '#f59e0b' : '#ef4444',
              borderRadius: 8, padding: '10px 14px', fontSize: 13,
            }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, marginBottom: 16, padding: '8px 12px', background: 'var(--bg-secondary)', borderRadius: 8, border: '1px solid var(--border)' }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>
              Database: {forceLive ? '🟢 Live Backend API' : '⚡ Demo Sandbox'}
            </span>
            <button
              type="button"
              onClick={toggleForceLive}
              style={{
                padding: '4px 10px',
                background: forceLive ? 'var(--accent)' : '#4b5563',
                border: 'none',
                borderRadius: 20,
                color: '#fff',
                fontSize: 10,
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {forceLive ? 'Go Demo' : 'Go Live'}
            </button>
          </div>

          <button className="btn btn-primary w-full" type="submit" disabled={loading} style={{ justifyContent: 'center', marginTop: 8, height: 44 }}>
            {loading ? <Loader size={14} className="spin" /> : null}
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <button
            type="button"
            onClick={() => setShowSubModal(true)}
            style={{
              background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer',
              fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em'
            }}
          >
            New Institution? Subscribe & Onboard Online
          </button>
        </div>

        <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 12, textAlign: 'center' }}>
            Quick Demo Accounts (Click to Fill)
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <button type="button" onClick={() => fillAndLogin('superadmin@kilimomf.co.ug', 'Superadmin@2024')} style={{
              padding: '10px 12px', background: 'var(--bg-secondary)', border: email === 'superadmin@kilimomf.co.ug' ? '1px solid #a855f7' : '1px solid var(--border)',
              borderRadius: 8, textAlign: 'left', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', flexDirection: 'column'
            }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#a855f7' }}>Super Admin (SaaS)</span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>System Owner</span>
            </button>

            <button type="button" onClick={() => fillAndLogin('owner@kilimomf.co.ug', 'Owner@2024')} style={{
              padding: '10px 12px', background: 'var(--bg-secondary)', border: email === 'owner@kilimomf.co.ug' ? '1px solid #3fb950' : '1px solid var(--border)',
              borderRadius: 8, textAlign: 'left', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', flexDirection: 'column'
            }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#3fb950' }}>Business Owner</span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Multi-Branch Exec</span>
            </button>

            <button type="button" onClick={() => fillAndLogin('admin@kilimomf.co.ug', 'Smos@2024')} style={{
              padding: '10px 12px', background: 'var(--bg-secondary)', border: email === 'admin@kilimomf.co.ug' ? '1px solid var(--accent)' : '1px solid var(--border)',
              borderRadius: 8, textAlign: 'left', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', flexDirection: 'column'
            }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)' }}>Branch Manager</span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Supervisor Desk</span>
            </button>

            <button type="button" onClick={() => fillAndLogin('sarah@kilimomf.co.ug', 'Cashier@2024')} style={{
              padding: '10px 12px', background: 'var(--bg-secondary)', border: email === 'sarah@kilimomf.co.ug' ? '1px solid #58a6ff' : '1px solid var(--border)',
              borderRadius: 8, textAlign: 'left', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', flexDirection: 'column'
            }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#58a6ff' }}>Cashier POS</span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Workstation Desk</span>
            </button>

            <button type="button" onClick={() => fillAndLogin('officer@kilimomf.co.ug', 'password123')} style={{
              padding: '10px 12px', background: 'var(--bg-secondary)', border: email === 'officer@kilimomf.co.ug' ? '1px solid #f59e0b' : '1px solid var(--border)',
              borderRadius: 8, textAlign: 'left', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', flexDirection: 'column',
              gridColumn: 'span 2'
            }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#f59e0b' }}>Loan Officer</span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Field & Recovery Desk</span>
            </button>
          </div>
        </div>
      </div>

      {/* ─── SAAS ONLINE ONBOARDING & SUBSCRIPTION WIZARD ─── */}
      {showSubModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          background: 'rgba(5, 5, 10, 0.85)', zIndex: 1000, display: 'flex',
          alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)',
          padding: 24, overflowY: 'auto'
        }}>
          <div style={{
            width: '100%', maxWidth: 680, background: '#111827', border: '1px solid #374151',
            padding: 32, borderRadius: 16, boxShadow: '0 25px 60px rgba(0,0,0,0.6)',
            position: 'relative', animation: 'modal-in 0.25s ease'
          }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, borderBottom: '1px solid #374151', paddingBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ background: 'var(--accent)', padding: 8, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Shield size={22} color="#000" />
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: '#f3f4f6', letterSpacing: '-0.02em' }}>SMOS Institutional Onboarding</h2>
                  <p style={{ margin: 0, fontSize: 11, color: '#9ca3af' }}>Provision your decentralized microfinance cloud instance</p>
                </div>
              </div>
              <button onClick={handleResetModal} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}><X size={20} /></button>
            </div>

            {/* Steps Indicator */}
            {!showCompleted && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 28, background: '#1f2937', padding: '12px 18px', borderRadius: 10, border: '1px solid #374151' }}>
                {[
                  { n: 1, label: 'Profile setup' },
                  { n: 2, label: 'Upload verification' },
                  { n: 3, label: 'Billing & payment' },
                  { n: 4, label: 'Submit review' }
                ].map(s => (
                  <div key={s.n} style={{ display: 'flex', alignItems: 'center', gap: 8, opacity: subStep === s.n ? 1 : 0.4 }}>
                    <div style={{
                      width: 24, height: 24, borderRadius: '50%',
                      background: subStep >= s.n ? 'var(--accent)' : '#4b5563',
                      color: subStep >= s.n ? '#000' : '#d1d5db',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 12, fontWeight: 900
                    }}>{s.n}</div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: subStep === s.n ? '#f3f4f6' : '#9ca3af' }}>{s.label}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Error alerts */}
            {subErr && (
              <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', padding: 14, borderRadius: 10, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                <AlertCircle size={16} /> {subErr}
              </div>
            )}

            {/* Wizard Forms */}
            {showCompleted ? (
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <div style={{ display: 'inline-flex', background: 'rgba(34, 197, 94, 0.15)', padding: 16, borderRadius: '50%', marginBottom: 20 }}>
                  <CheckCircle size={48} color="var(--green)" />
                </div>
                <h3 style={{ fontSize: 20, fontWeight: 900, color: '#f3f4f6', marginBottom: 12 }}>Onboarding Application Submitted!</h3>
                <p style={{ color: '#9ca3af', fontSize: 14, maxWidth: 520, margin: '0 auto 24px', lineHeight: 1.6 }}>
                  {subSuccessMsg}
                </p>
                <div style={{ background: '#1f2937', padding: 16, borderRadius: 12, border: '1px solid #374151', display: 'inline-block', textAlign: 'left', minWidth: 320, marginBottom: 24 }}>
                  <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 4 }}>INSTITUTION SLUG:</div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--accent)', fontFamily: 'monospace', marginBottom: 12 }}>{subSlug}.smos.io</div>
                  <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 4 }}>ADMIN EMAIL:</div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#f3f4f6', marginBottom: 12 }}>{subEmail}</div>
                  <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 4 }}>SUBSCRIPTION BILLING:</div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--green)' }}>UGX {subBilling.toLocaleString()} / month (PAID)</div>
                </div>
                <div>
                  <button className="btn btn-primary" onClick={handleResetModal}>Return to Login</button>
                </div>
              </div>
            ) : (
              <form onSubmit={subStep === 4 ? handleFinalSubmit : (e) => { e.preventDefault(); setSubStep(subStep + 1); }}>
                
                {/* STEP 1: Institutional Profile */}
                {subStep === 1 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 16 }}>
                      <div className="form-group">
                        <label className="form-label">Institution Name</label>
                        <input className="form-control" placeholder="e.g. Victoria SACCO Ltd" value={subName} onChange={e => setSubName(e.target.value)} required />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Subdomain Access Slug</label>
                        <input className="form-control" placeholder="e.g. victoria-sacco" value={subSlug} onChange={e => setSubSlug(e.target.value.replace(/[^a-zA-Z0-9-]/g, '').toLowerCase())} required />
                        <span style={{ fontSize: 10, color: '#9ca3af', marginTop: 4, display: 'block' }}>URL: {subSlug ? subSlug : '[slug]'}.smos.io</span>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 16 }}>
                      <div className="form-group">
                        <label className="form-label">Subscription Tier Plan</label>
                        <select className="form-control" value={subPlan} onChange={e => handlePlanChange(e.target.value)}>
                          <option value="Enterprise">Enterprise Tier (UGX 500,000 / mo)</option>
                          <option value="Premium">Premium Tier (UGX 300,000 / mo)</option>
                          <option value="Basic">Basic Tier (UGX 150,000 / mo)</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label className="form-label">Operating Country</label>
                        <select className="form-control" value={subCountry} onChange={e => setSubCountry(e.target.value)}>
                          <option value="Uganda">Uganda</option>
                          <option value="Kenya">Kenya</option>
                          <option value="Tanzania">Tanzania</option>
                        </select>
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Primary Administrator Email Address</label>
                      <input className="form-control" type="email" placeholder="admin@yourdomain.co.ug" value={subEmail} onChange={e => setSubEmail(e.target.value)} required />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                      <div className="form-group">
                        <label className="form-label">Admin Login Password</label>
                        <input className="form-control" type="password" placeholder="Min. 8 characters" value={subPassword} onChange={e => setSubPassword(e.target.value)} required />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Recovery Backup Email</label>
                        <input className="form-control" type="email" placeholder="backup@yourdomain.co.ug" value={subRecoveryEmail} onChange={e => setSubRecoveryEmail(e.target.value)} required />
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
                      <button type="submit" className="btn btn-primary" style={{ gap: 8 }}>
                        Continue to Documents <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 2: Corporate Verification Documents */}
                {subStep === 2 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <p style={{ color: '#9ca3af', fontSize: 13, margin: 0 }}>
                      Please upload corporate verification documentation to support your regulatory approval process.
                    </p>

                    <div style={{ background: '#1f2937', padding: 24, borderRadius: 12, border: '2px dashed #4b5563', textAlign: 'center', position: 'relative' }}>
                      <input type="file" multiple onChange={handleFileChange} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }} />
                      <Upload size={32} color="var(--accent)" style={{ marginBottom: 12, opacity: 0.8 }} />
                      <h4 style={{ margin: '0 0 6px 0', fontSize: 14, color: '#f3f4f6' }}>Upload Verification Certificates & Licences</h4>
                      <p style={{ margin: 0, fontSize: 11, color: '#9ca3af' }}>Drag and drop files here, or click to browse. (PDF, PNG, JPG, Docx up to 10MB)</p>
                    </div>

                    {/* Files list */}
                    {subDocs.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <label className="form-label">Selected Files ({subDocs.length})</label>
                        {subDocs.map((doc, idx) => (
                          <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: '#1f2937', borderRadius: 8, border: '1px solid #374151' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <FileText size={16} color="var(--accent)" />
                              <div>
                                <div style={{ fontSize: 12, fontWeight: 700, color: '#f3f4f6' }}>{doc.name}</div>
                                <div style={{ fontSize: 10, color: '#9ca3af' }}>{(doc.size / 1024).toFixed(1)} KB · {doc.type}</div>
                              </div>
                            </div>
                            <button type="button" onClick={() => removeSubDoc(idx)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--red)', fontSize: 11 }}>Remove</button>
                          </div>
                        ))}
                      </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16 }}>
                      <button type="button" className="btn btn-secondary" onClick={() => setSubStep(1)}>Back</button>
                      <button type="submit" className="btn btn-primary" style={{ gap: 8 }} disabled={subDocs.length === 0}>
                        Continue to Billing <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 3: Billing & Payments Checkout */}
                {subStep === 3 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    <div style={{ background: '#1f2937', padding: 20, borderRadius: 12, border: '1px solid #374151', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <h4 style={{ margin: '0 0 4px 0', color: '#9ca3af', fontSize: 12, textTransform: 'uppercase' }}>Selected Plan ({subPlan})</h4>
                        <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--green)' }}>UGX {subBilling.toLocaleString()} <span style={{ fontSize: 12, color: '#9ca3af', fontWeight: 600 }}>/ month</span></div>
                      </div>
                      <span className="badge badge-active" style={{ padding: '6px 12px', fontSize: 12 }}>Auto-recurring billing</span>
                    </div>

                    {!isPaymentConfirmed ? (
                      <div style={{ background: '#1f2937', padding: 24, borderRadius: 12, border: '1px solid #374151', textAlign: 'center' }}>
                        <FileText size={28} color="var(--accent)" style={{ marginBottom: 12, opacity: 0.8 }} />
                        <h4 style={{ margin: '0 0 8px 0', fontSize: 15, color: '#f3f4f6' }}>Generate Invoice Payment Link</h4>
                        <p style={{ margin: '0 0 20px 0', fontSize: 12, color: '#9ca3af', lineHeight: 1.5 }}>
                          A secure external checkout gateway link will be generated for Victoria SACCO. You can settle the subscription payment via MTN/Airtel Mobile Money or Debit/Credit Cards.
                        </p>
                        <button type="button" className="btn btn-primary" style={{ background: 'var(--accent)', color: '#000', margin: '0 auto' }} onClick={handleGenerateCheckout}>
                          Generate Checkout Payment Link
                        </button>
                      </div>
                    ) : (
                      <div style={{ background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.3)', padding: 20, borderRadius: 12, textAlign: 'center' }}>
                        <CheckCircle size={32} color="var(--green)" style={{ marginBottom: 8 }} />
                        <h4 style={{ margin: '0 0 4px 0', color: '#4ade80', fontSize: 15 }}>Payment Settled Successfully!</h4>
                        <p style={{ margin: 0, fontSize: 12, color: '#9ca3af' }}>Transaction reference: MM-SaaS-{Date.now().toString().slice(-6)} · Verified</p>
                      </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16 }}>
                      <button type="button" className="btn btn-secondary" onClick={() => setSubStep(2)}>Back</button>
                      <button type="submit" className="btn btn-primary" style={{ gap: 8 }} disabled={!isPaymentConfirmed}>
                        Continue to Submission <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 4: Submit Review */}
                {subStep === 4 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <h3 style={{ fontSize: 15, fontWeight: 800, color: '#f3f4f6', margin: 0 }}>Review Onboarding Application Details</h3>

                    <div style={{ background: '#1f2937', padding: 20, borderRadius: 12, border: '1px solid #374151', display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        <div>
                          <div style={{ fontSize: 11, color: '#9ca3af' }}>INSTITUTION NAME</div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: '#f3f4f6' }}>{subName}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: 11, color: '#9ca3af' }}>SUBDOMAIN SLUG</div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent)', fontFamily: 'monospace' }}>{subSlug}.smos.io</div>
                        </div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        <div>
                          <div style={{ fontSize: 11, color: '#9ca3af' }}>PLAN TIER SELECTED</div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: '#f3f4f6' }}>{subPlan}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: 11, color: '#9ca3af' }}>MONTHLY CHARGES</div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--green)' }}>UGX {subBilling.toLocaleString()} / mo</div>
                        </div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        <div>
                          <div style={{ fontSize: 11, color: '#9ca3af' }}>PRIMARY ADMIN USER</div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: '#f3f4f6' }}>{subEmail}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: 11, color: '#9ca3af' }}>VERIFICATION DOCUMENTS</div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: '#f3f4f6' }}>{subDocs.length} files attached</div>
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 2 }}>PAYMENT CONFIRMATION STATUS</div>
                        <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--green)', display: 'flex', alignItems: 'center', gap: 6 }}><CheckCircle size={14} /> PAID & VERIFIED (Mobile Money)</div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16 }}>
                      <button type="button" className="btn btn-secondary" onClick={() => setSubStep(3)}>Back</button>
                      <button type="submit" className="btn btn-primary" disabled={isSubmitting} style={{ background: 'var(--accent)', color: '#000', fontWeight: 800 }}>
                        {isSubmitting ? 'Submitting...' : 'Complete Onboarding & Submit'}
                      </button>
                    </div>
                  </div>
                )}
              </form>
            )}
          </div>
        </div>
      )}

      {/* ─── SIMULATED SECURE INVOICE CHECKOUT GATEWAY OVERLAY ─── */}
      {isCheckoutActive && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          background: 'rgba(5, 5, 8, 0.9)', zIndex: 1100, display: 'flex',
          alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(10px)',
          padding: 16
        }}>
          <div style={{
            width: '100%', maxWidth: 450, background: 'rgba(23, 23, 37, 0.85)',
            border: '1px solid rgba(255,255,255,0.08)', padding: 28, borderRadius: 18,
            boxShadow: '0 30px 70px rgba(0,0,0,0.7)', position: 'relative',
            animation: 'modal-in 0.2s ease', color: '#f3f4f6'
          }}>
            <button onClick={() => setIsCheckoutActive(false)} style={{ position: 'absolute', top: 18, right: 18, background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}><X size={18} /></button>
            
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--accent)', marginBottom: 4 }}>paystack</div>
              <div style={{ fontSize: 11, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Secured Multi-Tenant SaaS Gateway</div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.04)', padding: 16, borderRadius: 10, marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#9ca3af', marginBottom: 4 }}>
                <span>Institution:</span>
                <span style={{ fontWeight: 700, color: '#f3f4f6' }}>{subName || 'Victoria SACCO'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#9ca3af', marginBottom: 4 }}>
                <span>Plan Setup:</span>
                <span style={{ fontWeight: 700, color: '#f3f4f6' }}>SMOS {subPlan} Tier</span>
              </div>
              <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.08)', margin: '10px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 800 }}>
                <span>Amount Due:</span>
                <span style={{ color: 'var(--green)' }}>UGX {subBilling.toLocaleString()}</span>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
              <button
                type="button"
                onClick={() => setPaymentMethod('mm')}
                style={{
                  padding: '12px 14px', borderRadius: 10, cursor: 'pointer',
                  border: paymentMethod === 'mm' ? '1px solid var(--accent)' : '1px solid rgba(255,255,255,0.08)',
                  background: paymentMethod === 'mm' ? 'rgba(168, 85, 247, 0.08)' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: '#f3f4f6', fontWeight: 700
                }}
              >
                <Smartphone size={15} color={paymentMethod === 'mm' ? 'var(--accent)' : '#9ca3af'} /> Mobile Money
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('card')}
                style={{
                  padding: '12px 14px', borderRadius: 10, cursor: 'pointer',
                  border: paymentMethod === 'card' ? '1px solid var(--accent)' : '1px solid rgba(255,255,255,0.08)',
                  background: paymentMethod === 'card' ? 'rgba(168, 85, 247, 0.08)' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: '#f3f4f6', fontWeight: 700
                }}
              >
                <CreditCard size={15} color={paymentMethod === 'card' ? 'var(--accent)' : '#9ca3af'} /> Card Payment
              </button>
            </div>

            {/* Mobile money details */}
            {paymentMethod === 'mm' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 24 }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: 11 }}>Telecom Provider Operator</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {['MTN (Uganda)', 'Airtel (Uganda)', 'Safaricom M-Pesa'].map(op => (
                      <button key={op} type="button" style={{
                        flex: 1, padding: 8, fontSize: 11, borderRadius: 6, cursor: 'pointer',
                        background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#f3f4f6'
                      }}>{op}</button>
                    ))}
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: 11 }}>Mobile Wallet Number</label>
                  <input className="form-control" placeholder="e.g. +256 700 000 000" value={mobileNum} onChange={e => setMobileNum(e.target.value)} required />
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 24 }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: 11 }}>Cardholder Full Name</label>
                  <input className="form-control" placeholder="e.g. Juliet Namazzi" required />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: 11 }}>Card Number</label>
                  <input className="form-control" placeholder="4000 1234 5678 9010" value={cardNumber} onChange={e => setCardNumber(e.target.value)} required />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: 11 }}>Expiry Date</label>
                    <input className="form-control" placeholder="MM/YY" required />
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: 11 }}>Security CVV</label>
                    <input className="form-control" type="password" placeholder="123" required />
                  </div>
                </div>
              </div>
            )}

            <button
              className="btn btn-primary w-full"
              type="button"
              disabled={isSubmitting}
              onClick={handleSimulatePayment}
              style={{ background: 'var(--green)', color: '#000', fontWeight: 900, justifyContent: 'center', height: 44 }}
            >
              {isSubmitting ? <Loader size={14} className="spin" /> : null}
              {isSubmitting ? 'Authenticating Wallet funds...' : `Pay UGX ${subBilling.toLocaleString()}`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
