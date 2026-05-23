import React, { useState, useEffect, useRef } from 'react';
import { useApp, fmt } from '../../store/AppContext';
import api from '../../services/api';
import { 
  ClipboardList, CheckCircle2, 
  TrendingUp, Plus, User, Phone, DollarSign, BookOpen,
  AlertTriangle, Clock, AlertCircle, Eye, ShieldAlert,
  ArrowUpRight, ArrowDownRight, Wallet, Users,
  Save, Search, FileText, Bell, Trash2, Download, RotateCcw, PlusCircle, X
} from 'lucide-react';

interface ClientRequest {
  id: string;
  clientName: string;
  phone: string;
  requestText: string;
  date: string;
  status: 'pending' | 'resolved';
}

interface MockPayment {
  id: string;
  clientName: string;
  expectedAmount: number;
  actualAmount: number;
  date: string;
  notes: string;
}

interface NoteItem {
  id: string;
  title: string;
  content: string;
  type: 'Note' | 'Notice';
  date: string;
}

export default function NotebookPage() {
  const { state } = useApp();
  const userId = state.user?.id || 'default';
  const curr = state.user?.currency || 'UGX';

  const [activeTab, setActiveTab] = useState<'requests' | 'payments' | 'scorecard' | 'notes'>('requests');
  
  // State for logs
  const [requests, setRequests] = useState<ClientRequest[]>([]);
  const [payments, setPayments] = useState<MockPayment[]>([]);

  // Notes Library state
  const [notesList, setNotesList] = useState<NoteItem[]>([]);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [noteSearchQuery, setNoteSearchQuery] = useState('');
  const [noteFormDirty, setNoteFormDirty] = useState(false);
  const [noteForm, setNoteForm] = useState<{ title: string; content: string; type: 'Note' | 'Notice'; date: string }>({
    title: '', content: '', type: 'Note', date: new Date().toISOString().split('T')[0]
  });

  // Real-time API states
  const [loans, setLoans] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [repayments, setRepayments] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [portfolioSubTab, setPortfolioSubTab] = useState<'overview' | 'paid_today' | 'unpaid_today' | 'advance' | 'arrears' | 'defaulters'>('overview');

  useEffect(() => {
    async function loadPortfolioData() {
      try {
        setLoadingData(true);
        const [loansRes, clientsRes, repaymentsRes] = await Promise.all([
          api.getLoans(),
          api.getClients(),
          api.getRepayments()
        ]);
        setLoans(loansRes.data || []);
        setClients(clientsRes.data || []);
        setRepayments(repaymentsRes.data || []);
      } catch (err) {
        console.error('Failed to load portfolio data for notebook:', err);
      } finally {
        setLoadingData(false);
      }
    }
    loadPortfolioData();
  }, []);

  // Form states
  const [reqForm, setReqForm] = useState({ clientName: '', phone: '', requestText: '' });

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const savedRequests = localStorage.getItem(`smos_notebook_requests_${userId}`);
      if (savedRequests) setRequests(JSON.parse(savedRequests));

      const savedPayments = localStorage.getItem(`smos_notebook_payments_${userId}`);
      if (savedPayments) {
        const parsed = JSON.parse(savedPayments);
        // Migration: ensure every payment has a 'notes' field
        const migrated = parsed.map((p: any) => ({
          ...p,
          notes: p.notes ?? ''
        }));
        setPayments(migrated);
      }

      // Notes library: load with migration from legacy plain-text
      const savedNotes = localStorage.getItem(`smos_notebook_notes_${userId}`);
      if (savedNotes) {
        try {
          const parsed = JSON.parse(savedNotes);
          if (Array.isArray(parsed)) {
            // Already migrated to NoteItem[]
            setNotesList(parsed);
            if (parsed.length > 0) {
              setActiveNoteId(parsed[0].id);
              setNoteForm({
                title: parsed[0].title,
                content: parsed[0].content,
                type: parsed[0].type,
                date: parsed[0].date
              });
            }
          } else {
            // Legacy single string — migrate
            const migratedNote: NoteItem = {
              id: `note_migrated_${Date.now()}`,
              title: 'Migrated Notes',
              content: String(savedNotes),
              type: 'Note',
              date: new Date().toISOString().split('T')[0]
            };
            setNotesList([migratedNote]);
            setActiveNoteId(migratedNote.id);
            setNoteForm({
              title: migratedNote.title,
              content: migratedNote.content,
              type: migratedNote.type,
              date: migratedNote.date
            });
            // Persist the migration immediately
            localStorage.setItem(`smos_notebook_notes_${userId}`, JSON.stringify([migratedNote]));
          }
        } catch {
          // savedNotes was a plain string, not JSON — migrate
          const migratedNote: NoteItem = {
            id: `note_migrated_${Date.now()}`,
            title: 'Migrated Notes',
            content: savedNotes,
            type: 'Note',
            date: new Date().toISOString().split('T')[0]
          };
          setNotesList([migratedNote]);
          setActiveNoteId(migratedNote.id);
          setNoteForm({
            title: migratedNote.title,
            content: migratedNote.content,
            type: migratedNote.type,
            date: migratedNote.date
          });
          localStorage.setItem(`smos_notebook_notes_${userId}`, JSON.stringify([migratedNote]));
        }
      }
    } catch (e) {
      console.error('Error loading notebook data:', e);
    }
  }, [userId]);

  // Sync state helpers
  const saveRequests = (items: ClientRequest[]) => {
    setRequests(items);
    localStorage.setItem(`smos_notebook_requests_${userId}`, JSON.stringify(items));
  };

  const savePayments = (items: MockPayment[]) => {
    setPayments(items);
    localStorage.setItem(`smos_notebook_payments_${userId}`, JSON.stringify(items));
  };

  const saveNotesList = (items: NoteItem[]) => {
    setNotesList(items);
    localStorage.setItem(`smos_notebook_notes_${userId}`, JSON.stringify(items));
  };

  // Add Client Request
  const handleAddRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reqForm.clientName || !reqForm.requestText) return alert('Name and Request text are required.');
    
    const newReq: ClientRequest = {
      id: `req_${Date.now()}`,
      clientName: reqForm.clientName,
      phone: reqForm.phone || 'N/A',
      requestText: reqForm.requestText,
      date: new Date().toISOString().split('T')[0],
      status: 'pending'
    };

    saveRequests([newReq, ...requests]);
    setReqForm({ clientName: '', phone: '', requestText: '' });
  };

  // Resolve Client Request
  const toggleResolveRequest = (id: string) => {
    const updated = requests.map(r => {
      if (r.id === id) {
        return { ...r, status: r.status === 'pending' ? 'resolved' as const : 'pending' as const };
      }
      return r;
    });
    saveRequests(updated);
  };

  // Delete Request
  const handleDeleteRequest = (id: string) => {
    if (!confirm('Are you sure you want to delete this record?')) return;
    saveRequests(requests.filter(r => r.id !== id));
  };

  // ===== NOTES LIBRARY ACTIONS =====
  const handleCreateNote = (type: 'Note' | 'Notice') => {
    const newNote: NoteItem = {
      id: `note_${Date.now()}`,
      title: type === 'Notice' ? 'New Notice' : 'Untitled Note',
      content: '',
      type,
      date: new Date().toISOString().split('T')[0]
    };
    const updated = [newNote, ...notesList];
    saveNotesList(updated);
    setActiveNoteId(newNote.id);
    setNoteForm({ title: newNote.title, content: newNote.content, type: newNote.type, date: newNote.date });
    setNoteFormDirty(false);
  };

  const handleSelectNote = (note: NoteItem) => {
    setActiveNoteId(note.id);
    setNoteForm({ title: note.title, content: note.content, type: note.type, date: note.date });
    setNoteFormDirty(false);
  };

  const handleSaveNote = () => {
    if (!activeNoteId) return;
    const updated = notesList.map(n => {
      if (n.id === activeNoteId) {
        return { ...n, title: noteForm.title, content: noteForm.content, type: noteForm.type, date: noteForm.date };
      }
      return n;
    });
    saveNotesList(updated);
    setNoteFormDirty(false);
  };

  const handleDeleteNote = (id: string) => {
    if (!confirm('Delete this note permanently?')) return;
    const updated = notesList.filter(n => n.id !== id);
    saveNotesList(updated);
    if (activeNoteId === id) {
      if (updated.length > 0) {
        handleSelectNote(updated[0]);
      } else {
        setActiveNoteId(null);
        setNoteForm({ title: '', content: '', type: 'Note', date: new Date().toISOString().split('T')[0] });
      }
    }
  };

  const updateNoteForm = (changes: Partial<typeof noteForm>) => {
    setNoteForm(prev => ({ ...prev, ...changes }));
    setNoteFormDirty(true);
  };

  // Debounced auto-save effect
  useEffect(() => {
    if (!activeNoteId || !noteFormDirty) return;

    const timer = setTimeout(() => {
      setNotesList(currentNotes => {
        const updated = currentNotes.map(n => {
          if (n.id === activeNoteId) {
            return {
              ...n,
              title: noteForm.title,
              content: noteForm.content,
              type: noteForm.type,
              date: noteForm.date
            };
          }
          return n;
        });
        localStorage.setItem(`smos_notebook_notes_${userId}`, JSON.stringify(updated));
        return updated;
      });
      setNoteFormDirty(false);
    }, 1000); // 1-second debounce

    return () => clearTimeout(timer);
  }, [noteForm, activeNoteId, noteFormDirty, userId]);

  const filteredNotes = notesList.filter(n => {
    if (!noteSearchQuery) return true;
    const q = noteSearchQuery.toLowerCase();
    return n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q);
  });

  // ===== SPREADSHEET ACTIONS =====
  const handleInsertRow = () => {
    const newPayment: MockPayment = {
      id: `pay_${Date.now()}`,
      clientName: '',
      expectedAmount: 0,
      actualAmount: 0,
      date: new Date().toISOString().split('T')[0],
      notes: ''
    };
    savePayments([...payments, newPayment]);
  };

  const handleClearSpreadsheet = () => {
    if (!confirm('Are you sure you want to clear ALL rows in the spreadsheet? This action cannot be undone.')) return;
    savePayments([]);
  };

  const handleExportCSV = () => {
    const headers = ['Row', 'Date', 'Client Name', 'Expected Amount', 'Actual Amount', 'Notes'];
    const rows = payments.map((p, i) => [
      i + 1,
      p.date,
      `"${p.clientName.replace(/"/g, '""')}"`,
      p.expectedAmount,
      p.actualAmount,
      `"${(p.notes || '').replace(/"/g, '""')}"`
    ]);

    // Add summary row
    rows.push(['', '', 'TOTALS', totalExpected, totalActual, `Efficiency: ${collectionEfficiency}%`]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `notebook_collections_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDeletePayment = (id: string) => {
    if (!confirm('Remove this row?')) return;
    savePayments(payments.filter(p => p.id !== id));
  };

  const handleUpdatePaymentField = (id: string, field: keyof MockPayment, value: string | number) => {
    const updated = payments.map(p => {
      if (p.id === id) {
        if (field === 'expectedAmount' || field === 'actualAmount') {
          return { ...p, [field]: Number(value) || 0 };
        }
        return { ...p, [field]: value };
      }
      return p;
    });
    savePayments(updated);
  };

  // Auto-calculated performance metrics
  const totalRequests = requests.length;
  const resolvedRequests = requests.filter(r => r.status === 'resolved').length;
  const resolutionRate = totalRequests > 0 ? Math.round((resolvedRequests / totalRequests) * 100) : 100;

  const totalExpected = payments.reduce((acc, p) => acc + p.expectedAmount, 0);
  const totalActual = payments.reduce((acc, p) => acc + p.actualAmount, 0);
  const collectionEfficiency = totalExpected > 0 ? Math.round((totalActual / totalExpected) * 100) : 100;

  // Grade performance
  let performanceRating = 'Outstanding';
  let ratingColor = 'var(--green)';
  if (collectionEfficiency < 75) {
    performanceRating = 'Needs Attention';
    ratingColor = 'var(--red)';
  } else if (collectionEfficiency < 90) {
    performanceRating = 'Good';
    ratingColor = 'var(--orange)';
  }

  const fullName = `${state.user?.first_name || ''} ${state.user?.last_name || ''}`.toLowerCase();
  const isOfficer = state.user?.role === 'loan_officer';

  // Filters
  const filteredLoans = isOfficer
    ? loans.filter((l: any) => 
        (l.officer_name || '').toLowerCase().includes(fullName) || 
        (l.staff_name || '').toLowerCase().includes(fullName) ||
        (l.staff_owner || '').toLowerCase().includes(fullName)
      )
    : loans;

  const filteredClients = isOfficer
    ? clients.filter((c: any) => 
        c.branch_name === state.user?.branch_name ||
        c.assigned_staff_id === state.user?.id ||
        (c.staff_name || '').toLowerCase().includes(fullName)
      )
    : clients;

  const officerLoanNumbers = new Set(filteredLoans.map((l: any) => l.loan_number));
  const filteredRepayments = repayments.filter((r: any) => officerLoanNumbers.has(r.loan_number));

  // Metrics
  const activeLoans = filteredLoans.filter((l: any) => l.status === 'active' || l.status === 'at_risk' || l.status === 'delinquent');
  const activeLoansBalance = activeLoans.reduce((acc, l) => acc + (Number(l.outstanding_balance) || 0), 0);

  const arrearsLoans = filteredLoans.filter((l: any) => 
    (l.status === 'active' || l.status === 'at_risk' || l.status === 'delinquent') && 
    (Number(l.arrears_amount) > 0)
  );
  const totalArrears = arrearsLoans.reduce((acc, l) => acc + (Number(l.arrears_amount) || 0), 0);

  const unpaidLoans = filteredLoans.filter((l: any) => 
    (l.status === 'active' || l.status === 'at_risk' || l.status === 'delinquent') && 
    (Number(l.consecutive_missed) > 0 || Number(l.arrears_amount) > 0 || Number(l.total_paid) === 0)
  );

  const defaulterLoans = filteredLoans.filter((l: any) => 
    l.status === 'defaulted' || l.status === 'dormant' || l.status === 'written_off'
  );

  const parRate = activeLoansBalance > 0 ? ((totalArrears / activeLoansBalance) * 100).toFixed(1) : '0.0';

  const todayStr = new Date().toISOString().split('T')[0];
  const paidToday = filteredRepayments.filter((r: any) => {
    const dateStr = (r.created_at || r.date || '').split('T')[0];
    return dateStr === todayStr;
  });

  const isDueToday = (loan: any) => {
    if (!loan.disbursed_at || ['draft', 'pending_approval', 'approved', 'closed', 'written_off'].includes(loan.status)) return false;
    const today = new Date();
    today.setHours(0,0,0,0);
    const start = new Date(loan.disbursed_at);
    start.setHours(0,0,0,0);
    const diffTime = Math.abs(today.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const freq = loan.loan_type || loan.repayment_frequency || 'monthly';
    if (freq === 'daily') return true;
    if (freq === 'weekly') return diffDays % 7 === 0;
    if (freq === 'monthly') return today.getDate() === start.getDate();
    return false;
  };

  const unpaidToday = filteredLoans.filter((l: any) => {
    if (!isDueToday(l)) return false;
    const hasPaidToday = filteredRepayments.some((r: any) => {
      const isThisLoan = r.loan_id === l.id || r.loan_number === l.loan_number;
      const isToday = (r.created_at || r.date || '').split('T')[0] === todayStr;
      return isThisLoan && isToday;
    });
    return !hasPaidToday;
  });

  const paidInAdvance = filteredLoans.filter((l: any) => Number(l.advance_amount) > 0);

  let liveRating = 'Outstanding';
  let liveRatingColor = 'var(--green)';
  if (parseFloat(parRate) > 10) {
    liveRating = 'Needs Attention';
    liveRatingColor = 'var(--red)';
  } else if (parseFloat(parRate) > 5) {
    liveRating = 'Good';
    liveRatingColor = 'var(--orange)';
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">Personal Performance Notebook</h2>
          <p className="page-subtitle">Offline tracker for logs, mock payments, and custom follow-up metrics</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>
        <button 
          className={`btn ${activeTab === 'requests' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('requests')}
        >
          <ClipboardList size={16} style={{ marginRight: 6 }} /> Client Requests ({requests.filter(r => r.status === 'pending').length})
        </button>
        <button 
          className={`btn ${activeTab === 'payments' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('payments')}
        >
          <DollarSign size={16} style={{ marginRight: 6 }} /> Mock Payments Logs ({payments.length})
        </button>
        <button 
          className={`btn ${activeTab === 'scorecard' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('scorecard')}
        >
          <TrendingUp size={16} style={{ marginRight: 6 }} /> My Performance Scorecard
        </button>
        <button 
          className={`btn ${activeTab === 'notes' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('notes')}
        >
          <BookOpen size={16} style={{ marginRight: 6 }} /> Scratch Notepad ({notesList.length})
        </button>
      </div>

      {/* Tab Content */}
      <div className="grid-layout">
        
        {/* REQUESTS LOG TAB */}
        {activeTab === 'requests' && (
          <div className="grid-2">
            <div className="card">
              <div className="card-header">
                <span className="card-title">Log New Client Request / Contact</span>
              </div>
              <form onSubmit={handleAddRequest} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label className="form-label">Client Name</label>
                  <div className="input-group">
                    <User size={16} className="input-icon" />
                    <input 
                      type="text" 
                      className="input" 
                      placeholder="e.g. Juliet Namubiru" 
                      value={reqForm.clientName}
                      onChange={e => setReqForm({ ...reqForm, clientName: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <label className="form-label">Phone Number</label>
                  <div className="input-group">
                    <Phone size={16} className="input-icon" />
                    <input 
                      type="text" 
                      className="input" 
                      placeholder="e.g. +256752000000" 
                      value={reqForm.phone}
                      onChange={e => setReqForm({ ...reqForm, phone: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <label className="form-label">Request / Conversation Summary</label>
                  <textarea 
                    className="input" 
                    rows={4}
                    placeholder="Describe their request (e.g. wants to postpone installment, requesting grace period, applied for credit limit increase...)"
                    value={reqForm.requestText}
                    onChange={e => setReqForm({ ...reqForm, requestText: e.target.value })}
                  />
                </div>
                <button type="submit" className="btn btn-primary w-full">
                  <Plus size={16} style={{ marginRight: 6 }} /> Add Request to Notebook
                </button>
              </form>
            </div>

            <div className="card">
              <div className="card-header">
                <span className="card-title">Recorded Requests Ledger</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: '420px', overflowY: 'auto' }}>
                {requests.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px 0' }}>No requests recorded yet.</p>
                ) : (
                  requests.map(r => (
                    <div 
                      key={r.id} 
                      style={{ 
                        background: 'var(--bg-secondary)', 
                        padding: 14, 
                        borderRadius: 8, 
                        borderLeft: `4px solid ${r.status === 'resolved' ? 'var(--green)' : 'var(--accent)'}`,
                        opacity: r.status === 'resolved' ? 0.75 : 1
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                        <div>
                          <span style={{ fontWeight: 700, fontSize: 14 }}>{r.clientName}</span>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{r.phone} · Logged: {r.date}</div>
                        </div>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button 
                            className={`btn btn-sm ${r.status === 'resolved' ? 'btn-secondary' : 'btn-primary'}`}
                            onClick={() => toggleResolveRequest(r.id)}
                            style={{ padding: '2px 8px', fontSize: 11 }}
                          >
                            {r.status === 'resolved' ? 'Reopen' : 'Resolve'}
                          </button>
                          <button 
                            className="btn btn-danger btn-sm"
                            onClick={() => handleDeleteRequest(r.id)}
                            style={{ padding: '2px 6px', fontSize: 11 }}
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                      <p style={{ fontSize: 13, margin: 0, whiteSpace: 'pre-wrap', color: 'var(--text-primary)' }}>{r.requestText}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* PAYMENTS LOG TAB — Excel-like Spreadsheet */}
        {activeTab === 'payments' && (
          <div className="card">
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
              <span className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <DollarSign size={18} /> Collection Spreadsheet
              </span>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button className="btn btn-primary btn-sm" onClick={handleInsertRow} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
                  <PlusCircle size={14} /> Insert Row
                </button>
                <button className="btn btn-secondary btn-sm" onClick={handleExportCSV} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
                  <Download size={14} /> Export CSV
                </button>
                <button className="btn btn-danger btn-sm" onClick={handleClearSpreadsheet} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
                  <Trash2 size={14} /> Clear Sheet
                </button>
              </div>
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: -4, marginBottom: 12 }}>
              💡 Log payments clients claim to have sent or are planning to send. Click cells to edit inline. Totals auto-calculate.
            </p>

            <div className="table-wrap" style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-tertiary, var(--bg-secondary))' }}>
                    <th style={spreadsheetHeaderStyle}>A</th>
                    <th style={spreadsheetHeaderStyle}>B</th>
                    <th style={spreadsheetHeaderStyle}>C</th>
                    <th style={spreadsheetHeaderStyle}>D</th>
                    <th style={spreadsheetHeaderStyle}>E</th>
                    <th style={spreadsheetHeaderStyle}>F</th>
                    <th style={{ ...spreadsheetHeaderStyle, width: 40 }}></th>
                  </tr>
                  <tr>
                    <th style={spreadsheetSubHeaderStyle}>Row</th>
                    <th style={spreadsheetSubHeaderStyle}>Date</th>
                    <th style={spreadsheetSubHeaderStyle}>Client Name</th>
                    <th style={spreadsheetSubHeaderStyle}>Expected Amount</th>
                    <th style={spreadsheetSubHeaderStyle}>Actual Amount</th>
                    <th style={spreadsheetSubHeaderStyle}>Notes</th>
                    <th style={spreadsheetSubHeaderStyle}></th>
                  </tr>
                </thead>
                <tbody>
                  {payments.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px', fontSize: 14 }}>
                        No entries yet. Click <strong>"Insert Row"</strong> to start logging collections.
                      </td>
                    </tr>
                  ) : (
                    payments.map((p, idx) => (
                      <tr key={p.id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ ...spreadsheetCellStyle, width: 50, textAlign: 'center', color: 'var(--text-muted)', fontWeight: 600, fontSize: 12 }}>
                          {idx + 1}
                        </td>
                        <td style={spreadsheetCellStyle}>
                          <input
                            type="date"
                            value={p.date}
                            onChange={e => handleUpdatePaymentField(p.id, 'date', e.target.value)}
                            style={spreadsheetInputStyle}
                          />
                        </td>
                        <td style={spreadsheetCellStyle}>
                          <input
                            type="text"
                            value={p.clientName}
                            onChange={e => handleUpdatePaymentField(p.id, 'clientName', e.target.value)}
                            placeholder="Client name..."
                            style={spreadsheetInputStyle}
                          />
                        </td>
                        <td style={spreadsheetCellStyle}>
                          <input
                            type="number"
                            value={p.expectedAmount || ''}
                            onChange={e => handleUpdatePaymentField(p.id, 'expectedAmount', e.target.value)}
                            placeholder="0"
                            style={{ ...spreadsheetInputStyle, textAlign: 'right', fontFamily: 'monospace' }}
                          />
                        </td>
                        <td style={spreadsheetCellStyle}>
                          <input
                            type="number"
                            value={p.actualAmount || ''}
                            onChange={e => handleUpdatePaymentField(p.id, 'actualAmount', e.target.value)}
                            placeholder="0"
                            style={{ ...spreadsheetInputStyle, textAlign: 'right', fontFamily: 'monospace' }}
                          />
                        </td>
                        <td style={spreadsheetCellStyle}>
                          <input
                            type="text"
                            value={p.notes || ''}
                            onChange={e => handleUpdatePaymentField(p.id, 'notes', e.target.value)}
                            placeholder="Note..."
                            style={spreadsheetInputStyle}
                          />
                        </td>
                        <td style={{ ...spreadsheetCellStyle, textAlign: 'center', width: 40 }}>
                          <button
                            onClick={() => handleDeletePayment(p.id)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--red)', padding: 2, opacity: 0.6 }}
                            title="Delete row"
                          >
                            <X size={14} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                {/* Auto-Sum Footer */}
                {payments.length > 0 && (
                  <tfoot>
                    <tr style={{
                      borderTop: '3px double var(--text-primary)',
                      background: 'var(--bg-secondary)',
                      fontWeight: 700,
                      fontSize: 13
                    }}>
                      <td style={{ padding: '10px 8px' }}></td>
                      <td style={{ padding: '10px 8px' }}></td>
                      <td style={{ padding: '10px 8px', textAlign: 'right', fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase', fontSize: 11, color: 'var(--text-secondary)' }}>
                        TOTALS →
                      </td>
                      <td style={{ padding: '10px 8px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 700 }}>
                        {fmt.currency(totalExpected, curr)}
                      </td>
                      <td style={{ padding: '10px 8px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 700, color: totalActual >= totalExpected ? 'var(--green)' : 'var(--red)' }}>
                        {fmt.currency(totalActual, curr)}
                      </td>
                      <td style={{ padding: '10px 8px', fontSize: 12 }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '2px 10px',
                          borderRadius: 20,
                          background: collectionEfficiency >= 90 ? 'rgba(16,185,129,0.15)' : collectionEfficiency >= 75 ? 'rgba(245,158,11,0.15)' : 'rgba(239,68,68,0.15)',
                          color: collectionEfficiency >= 90 ? 'var(--green)' : collectionEfficiency >= 75 ? 'var(--orange)' : 'var(--red)',
                          fontWeight: 700
                        }}>
                          Efficiency: {collectionEfficiency}%
                        </span>
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        )}

        {/* PERFORMANCE SCORECARD TAB */}
        {activeTab === 'scorecard' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Sub tab navigation */}
            <div className="tabs" style={{ marginBottom: 12 }}>
              <div 
                className={`tab ${portfolioSubTab === 'overview' ? 'active' : ''}`}
                onClick={() => setPortfolioSubTab('overview')}
              >
                Overview
              </div>
              <div 
                className={`tab ${portfolioSubTab === 'paid_today' ? 'active' : ''}`}
                onClick={() => setPortfolioSubTab('paid_today')}
              >
                Paid Today ({paidToday.length})
              </div>
              <div 
                className={`tab ${portfolioSubTab === 'unpaid_today' ? 'active' : ''}`}
                onClick={() => setPortfolioSubTab('unpaid_today')}
              >
                Did Not Pay Today ({unpaidToday.length})
              </div>
              <div 
                className={`tab ${portfolioSubTab === 'advance' ? 'active' : ''}`}
                onClick={() => setPortfolioSubTab('advance')}
              >
                Paid in Advance ({paidInAdvance.length})
              </div>
              <div 
                className={`tab ${portfolioSubTab === 'arrears' ? 'active' : ''}`}
                onClick={() => setPortfolioSubTab('arrears')}
              >
                Arrears Portfolio ({arrearsLoans.length})
              </div>
              <div 
                className={`tab ${portfolioSubTab === 'defaulters' ? 'active' : ''}`}
                onClick={() => setPortfolioSubTab('defaulters')}
              >
                Defaulters ({defaulterLoans.length})
              </div>
            </div>

            {loadingData ? (
              <div className="card" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                Loading live portfolio data...
              </div>
            ) : (
              <>
                {portfolioSubTab === 'overview' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    {/* Live Portfolio Grid */}
                    <div>
                      <h3 style={{ fontSize: 14, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--text-secondary)', marginBottom: 12 }}>
                        Live Portfolio Summary
                      </h3>
                      <div className="stats-grid">
                        <div className="stat-card blue">
                          <div className="stat-label">Active Portfolio</div>
                          <div className="stat-value">{fmt.currency(activeLoansBalance, curr)}</div>
                          <div className="stat-sub">{activeLoans.length} active loans</div>
                          <Wallet size={40} className="stat-icon" color="var(--blue)" />
                        </div>
                        
                        <div className="stat-card green">
                          <div className="stat-label">My Clients</div>
                          <div className="stat-value">{filteredClients.length}</div>
                          <div className="stat-sub">Assigned in branch</div>
                          <Users size={40} className="stat-icon" color="var(--green)" />
                        </div>

                        <div className="stat-card red">
                          <div className="stat-label">Total Arrears</div>
                          <div className="stat-value" style={{ color: totalArrears > 0 ? 'var(--red)' : 'var(--text-primary)' }}>
                            {fmt.currency(totalArrears, curr)}
                          </div>
                          <div className="stat-sub">{arrearsLoans.length} loans in arrears</div>
                          <AlertTriangle size={40} className="stat-icon" color="var(--red)" />
                        </div>

                        <div className="stat-card" style={{ borderLeft: `5px solid ${liveRatingColor}` }}>
                          <div className="stat-label">Portfolio At Risk (PAR)</div>
                          <div className="stat-value" style={{ color: liveRatingColor }}>{parRate}%</div>
                          <div className="stat-sub">Status: {liveRating}</div>
                          <ShieldAlert size={40} className="stat-icon" color={liveRatingColor} />
                        </div>
                      </div>
                    </div>

                    {/* Today's Recovery Performance */}
                    <div style={{ marginTop: 24 }}>
                      <h3 style={{ fontSize: 14, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--text-secondary)', marginBottom: 12 }}>
                        Today's Recovery Performance
                      </h3>
                      <div className="stats-grid">
                        <div className="stat-card green">
                          <div className="stat-label">Repayments Paid Today</div>
                          <div className="stat-value">{paidToday.length}</div>
                          <div className="stat-sub">Total: {fmt.currency(paidToday.reduce((sum, r) => sum + (r.amount || 0), 0), curr)}</div>
                          <CheckCircle2 size={40} className="stat-icon" color="var(--green)" />
                        </div>

                        <div className="stat-card red">
                          <div className="stat-label">Missed Instalments Today</div>
                          <div className="stat-value">{unpaidToday.length}</div>
                          <div className="stat-sub">Expected follow-ups</div>
                          <AlertCircle size={40} className="stat-icon" color="var(--red)" />
                        </div>

                        <div className="stat-card blue">
                          <div className="stat-label">Payments in Advance</div>
                          <div className="stat-value">{paidInAdvance.length}</div>
                          <div className="stat-sub">Total: {fmt.currency(paidInAdvance.reduce((sum, l) => sum + (l.advance_amount || 0), 0), curr)}</div>
                          <TrendingUp size={40} className="stat-icon" color="var(--blue)" />
                        </div>

                        <div className="stat-card" style={{ borderLeft: '5px solid var(--accent)' }}>
                          <div className="stat-label">Daily Recovery Rate</div>
                          <div className="stat-value" style={{ color: 'var(--accent)' }}>
                            {Math.round((paidToday.length / Math.max(1, paidToday.length + unpaidToday.length)) * 100)}%
                          </div>
                          <div className="stat-sub">Today's target: 90%</div>
                          <TrendingUp size={40} className="stat-icon" color="var(--accent)" />
                        </div>
                      </div>
                    </div>

                    {/* Offline notebook stats */}
                    <div>
                      <h3 style={{ fontSize: 14, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--text-secondary)', marginBottom: 12 }}>
                        Notebook Tracker Summary
                      </h3>
                      <div className="stats-grid">
                        <div className="stat-card blue">
                          <div className="stat-label">Requests Logged</div>
                          <div className="stat-value">{totalRequests}</div>
                          <div className="stat-sub">{resolvedRequests} resolved ({resolutionRate}%)</div>
                          <ClipboardList size={40} className="stat-icon" color="var(--blue)" />
                        </div>
                        
                        <div className="stat-card green">
                          <div className="stat-label">Notebook Collections</div>
                          <div className="stat-value">{fmt.currency(totalActual, curr)}</div>
                          <div className="stat-sub">Expected: {fmt.currency(totalExpected, curr)}</div>
                          <TrendingUp size={40} className="stat-icon" color="var(--green)" />
                        </div>

                        <div className="stat-card accent">
                          <div className="stat-label">Collection Efficiency</div>
                          <div className="stat-value">{collectionEfficiency}%</div>
                          <div className="stat-sub">From notebook payments log</div>
                          <DollarSign size={40} className="stat-icon" color="var(--accent)" />
                        </div>

                        <div className="stat-card" style={{ borderLeft: `5px solid ${ratingColor}` }}>
                          <div className="stat-label">Notebook Performance</div>
                          <div className="stat-value" style={{ color: ratingColor }}>{performanceRating}</div>
                          <div className="stat-sub">Goal: Maintain &gt;90% collection</div>
                          <CheckCircle2 size={40} className="stat-icon" color={ratingColor} />
                        </div>
                      </div>
                    </div>

                    <div className="card">
                      <div className="card-header">
                        <span className="card-title">Performance Analysis & Follow-up Goals</span>
                      </div>
                      <div style={{ lineHeight: 1.6 }}>
                        <p>
                          This scorecard calculates your efficiency based on notes logged in the **Mock Payments Logs** tab and live portfolios assigned in your branch. Use it to cross-verify claims from clients and track your follow-up resolution speed.
                        </p>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 16 }}>
                          <div style={{ background: 'var(--bg-secondary)', padding: 16, borderRadius: 8 }}>
                            <h4 style={{ margin: '0 0 10px', color: 'var(--text-primary)' }}>💡 Client Recovery Strategies</h4>
                            <ul style={{ paddingLeft: 20, margin: 0, color: 'var(--text-muted)' }}>
                              <li>Always confirm payments on Cashier Ledger prior to marking notebook request as fully resolved.</li>
                              <li>Aim to contact clients at least 24 hours prior to their payment date to reduce default rate.</li>
                              <li>Log client excuses to maintain audit trail on scratchpad notes.</li>
                            </ul>
                          </div>
                          <div style={{ background: 'var(--bg-secondary)', padding: 16, borderRadius: 8 }}>
                            <h4 style={{ margin: '0 0 10px', color: 'var(--text-primary)' }}>📈 Rating Targets</h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>🌟 Outstanding Rating</span>
                                <span className="text-success font-bold">&gt;= 90% Collection / &lt; 5% PAR</span>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>👍 Good Rating</span>
                                <span className="text-warning font-bold">75% - 89% Collection / 5% - 10% PAR</span>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>⚠️ Needs Attention</span>
                                <span className="text-danger font-bold">&lt; 75% Collection / &gt; 10% PAR</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {portfolioSubTab === 'arrears' && (
                  <div className="card">
                    <div className="card-header">
                      <span className="card-title">Arrears Recovery Ledger</span>
                    </div>
                    {arrearsLoans.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                        🎉 Excellent! None of your clients are currently in arrears.
                      </div>
                    ) : (
                      <div className="table-wrap">
                        <table>
                          <thead>
                            <tr>
                              <th>Client Name</th>
                              <th>Loan #</th>
                              <th>Disbursed</th>
                              <th>Outstanding Bal</th>
                              <th>Arrears Amount</th>
                              <th>Days Late</th>
                              <th>Missed Inst.</th>
                              <th>Guarantor</th>
                            </tr>
                          </thead>
                          <tbody>
                            {arrearsLoans.map((l: any) => (
                              <tr key={l.id}>
                                <td>
                                  <div className="font-bold">{l.client_name}</div>
                                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{l.client_phone}</div>
                                </td>
                                <td className="font-mono">{l.loan_number}</td>
                                <td>{l.disbursed_at ? l.disbursed_at.split('T')[0] : '—'}</td>
                                <td>{fmt.currency(l.outstanding_balance, curr)}</td>
                                <td className="text-danger font-bold">{fmt.currency(l.arrears_amount, curr)}</td>
                                <td>
                                  <span className={`badge ${l.arrears_days > 30 ? 'badge-delinquent' : 'badge-at_risk'}`}>
                                    {l.arrears_days} Days
                                  </span>
                                </td>
                                <td className="font-bold text-center">{l.consecutive_missed || 0}</td>
                                <td>
                                  <div className="font-bold">{l.guarantor_name || '—'}</div>
                                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{l.guarantor_phone || '—'}</div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {portfolioSubTab === 'paid_today' && (
                  <div className="card">
                    <div className="card-header">
                      <span className="card-title">Instalments Paid Today</span>
                    </div>
                    {paidToday.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                        No collections logged today.
                      </div>
                    ) : (
                      <div className="table-wrap">
                        <table>
                          <thead>
                            <tr>
                              <th>Time</th>
                              <th>Client Name</th>
                              <th>Loan #</th>
                              <th>Amount Paid</th>
                              <th>Method</th>
                              <th>Collector</th>
                            </tr>
                          </thead>
                          <tbody>
                            {paidToday.map((r: any) => (
                              <tr key={r.id}>
                                <td>{new Date(r.created_at || r.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                                <td className="font-bold">{r.client_name}</td>
                                <td className="font-mono">{r.loan_number}</td>
                                <td className="text-success font-bold">{fmt.currency(r.amount, curr)}</td>
                                <td><span className="badge badge-draft">{r.payment_method || 'cash'}</span></td>
                                <td>{r.staff_name || 'Cashier'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {portfolioSubTab === 'unpaid_today' && (
                  <div className="card">
                    <div className="card-header">
                      <span className="card-title">Missed Instalments Today</span>
                    </div>
                    {unpaidToday.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                        All clients scheduled for today have completed their repayments.
                      </div>
                    ) : (
                      <div className="table-wrap">
                        <table>
                          <thead>
                            <tr>
                              <th>Client Name</th>
                              <th>Loan #</th>
                              <th>Principal</th>
                              <th>Balance</th>
                              <th>Frequency</th>
                              <th>Arrears Amount</th>
                              <th>Next Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {unpaidToday.map((l: any) => (
                              <tr key={l.id}>
                                <td>
                                  <div className="font-bold">{l.client_name}</div>
                                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{l.client_phone}</div>
                                </td>
                                <td className="font-mono">{l.loan_number}</td>
                                <td>{fmt.currency(l.principal_amount, curr)}</td>
                                <td className="font-bold">{fmt.currency(l.outstanding_balance, curr)}</td>
                                <td><span className="badge badge-draft">{l.loan_type || l.repayment_frequency || 'monthly'}</span></td>
                                <td className="text-danger font-bold">{fmt.currency(l.arrears_amount || 0, curr)}</td>
                                <td>
                                  <a 
                                    href={`tel:${l.client_phone}`}
                                    className="btn btn-secondary btn-sm"
                                    style={{ padding: '4px 8px', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                                  >
                                    <Phone size={11} /> Call Client
                                  </a>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {portfolioSubTab === 'advance' && (
                  <div className="card">
                    <div className="card-header">
                      <span className="card-title">Prepaid / Advance Ledger</span>
                    </div>
                    {paidInAdvance.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                        No clients are currently paid in advance.
                      </div>
                    ) : (
                      <div className="table-wrap">
                        <table>
                          <thead>
                            <tr>
                              <th>Client Name</th>
                              <th>Loan #</th>
                              <th>Principal</th>
                              <th>Outstanding Bal</th>
                              <th>Advance Paid</th>
                              <th>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {paidInAdvance.map((l: any) => (
                              <tr key={l.id}>
                                <td>
                                  <div className="font-bold">{l.client_name}</div>
                                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{l.client_phone}</div>
                                </td>
                                <td className="font-mono">{l.loan_number}</td>
                                <td>{fmt.currency(l.principal_amount, curr)}</td>
                                <td>{fmt.currency(l.outstanding_balance, curr)}</td>
                                <td style={{ color: 'var(--blue)', fontWeight: 700 }}>
                                  {fmt.currency(l.advance_amount, curr)}
                                </td>
                                <td>
                                  <span className="badge badge-active" style={{ background: 'var(--blue)', color: 'white' }}>
                                    Prepaid
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {portfolioSubTab === 'defaulters' && (
                  <div className="card">
                    <div className="card-header">
                      <span className="card-title">Defaulters & Written Off Ledger</span>
                    </div>
                    {defaulterLoans.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                        🎉 Excellent! No defaulted accounts in your portfolio.
                      </div>
                    ) : (
                      <div className="table-wrap">
                        <table>
                          <thead>
                            <tr>
                              <th>Client Name</th>
                              <th>Loan #</th>
                              <th>Principal</th>
                              <th>Outstanding Bal</th>
                              <th>Status</th>
                              <th>Guarantor</th>
                              <th>Consecutive Missed</th>
                            </tr>
                          </thead>
                          <tbody>
                            {defaulterLoans.map((l: any) => (
                              <tr key={l.id}>
                                <td>
                                  <div className="font-bold">{l.client_name}</div>
                                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{l.client_phone}</div>
                                </td>
                                <td className="font-mono">{l.loan_number}</td>
                                <td>{fmt.currency(l.principal_amount, curr)}</td>
                                <td className="text-danger font-bold">{fmt.currency(l.outstanding_balance, curr)}</td>
                                <td>
                                  <span className={`badge ${l.status === 'written_off' ? 'badge-written_off' : 'badge-delinquent'}`}>
                                    {l.status?.replace('_', ' ')}
                                  </span>
                                </td>
                                <td>
                                  <div className="font-bold">{l.guarantor_name || '—'}</div>
                                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{l.guarantor_phone || '—'}</div>
                                </td>
                                <td className="text-center font-bold">{l.consecutive_missed || 0}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* SCRATCH NOTEPAD TAB — Notes & Notices Library */}
        {activeTab === 'notes' && (
          <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 16, minHeight: 480 }}>
            {/* Sidebar — Library */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div className="card-header" style={{ paddingBottom: 10 }}>
                <span className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <BookOpen size={16} /> Library
                </span>
              </div>

              {/* Action buttons */}
              <div style={{ display: 'flex', gap: 6, marginBottom: 10, padding: '0 0 0 0' }}>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => handleCreateNote('Note')}
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, fontSize: 11 }}
                >
                  <FileText size={13} /> New Note
                </button>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => handleCreateNote('Notice')}
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, fontSize: 11, background: 'rgba(245,158,11,0.15)', color: 'var(--orange)', border: '1px solid var(--orange)' }}
                >
                  <Bell size={13} /> New Notice
                </button>
              </div>

              {/* Search */}
              <div style={{ position: 'relative', marginBottom: 10 }}>
                <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  className="input"
                  placeholder="Search notes..."
                  value={noteSearchQuery}
                  onChange={e => setNoteSearchQuery(e.target.value)}
                  style={{ paddingLeft: 32, fontSize: 12, height: 32 }}
                />
              </div>

              {/* Note items list */}
              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
                {filteredNotes.length === 0 ? (
                  <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 12, padding: '30px 0' }}>
                    {noteSearchQuery ? 'No matching notes found.' : 'No notes yet. Create one above.'}
                  </p>
                ) : (
                  filteredNotes.map(note => (
                    <div
                      key={note.id}
                      onClick={() => handleSelectNote(note)}
                      style={{
                        padding: '10px 12px',
                        borderRadius: 8,
                        cursor: 'pointer',
                        background: activeNoteId === note.id ? 'var(--accent-alpha, rgba(99,102,241,0.12))' : 'transparent',
                        borderLeft: activeNoteId === note.id ? '3px solid var(--accent)' : '3px solid transparent',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                        <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 180 }}>
                          {note.title || 'Untitled'}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <span style={{
                            display: 'inline-block',
                            padding: '1px 7px',
                            borderRadius: 10,
                            fontSize: 9,
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            letterSpacing: 0.5,
                            background: note.type === 'Notice' ? 'rgba(245,158,11,0.15)' : 'rgba(99,102,241,0.12)',
                            color: note.type === 'Notice' ? 'var(--orange)' : 'var(--accent)'
                          }}>
                            {note.type}
                          </span>
                          <button
                            onClick={e => { e.stopPropagation(); handleDeleteNote(note.id); }}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 2, opacity: 0.5 }}
                            title="Delete note"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 2 }}>{note.date}</div>
                      <p style={{ margin: 0, fontSize: 11, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {note.content.substring(0, 80) || 'Empty note...'}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Main Pane — Editor */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
              {activeNoteId ? (
                <>
                  {/* Editor toolbar */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, paddingBottom: 10, borderBottom: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>
                        {noteForm.type === 'Notice' ? '🔔' : '📝'} Edit {noteForm.type}
                      </span>
                      {noteFormDirty && (
                        <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 10, background: 'rgba(245,158,11,0.15)', color: 'var(--orange)', fontWeight: 600 }}>
                          Unsaved (Auto-saving...)
                        </span>
                      )}
                      {!noteFormDirty && (
                        <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 10, background: 'rgba(16,185,129,0.12)', color: 'var(--green)', fontWeight: 600 }}>
                          Saved (Auto & Manual)
                        </span>
                      )}
                    </div>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={handleSaveNote}
                      disabled={!noteFormDirty}
                      style={{ display: 'flex', alignItems: 'center', gap: 4, opacity: noteFormDirty ? 1 : 0.5 }}
                    >
                      <Save size={14} /> Save to Library
                    </button>
                  </div>

                  {/* Editor fields */}
                  <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                    <div style={{ flex: 2 }}>
                      <label className="form-label" style={{ fontSize: 11 }}>Title</label>
                      <input
                        type="text"
                        className="input"
                        value={noteForm.title}
                        onChange={e => updateNoteForm({ title: e.target.value })}
                        placeholder="Note title..."
                        style={{ fontSize: 14, fontWeight: 600 }}
                      />
                    </div>
                    <div style={{ flex: 0.7 }}>
                      <label className="form-label" style={{ fontSize: 11 }}>Type</label>
                      <select
                        className="input"
                        value={noteForm.type}
                        onChange={e => updateNoteForm({ type: e.target.value as 'Note' | 'Notice' })}
                      >
                        <option value="Note">📝 Note</option>
                        <option value="Notice">🔔 Notice</option>
                      </select>
                    </div>
                    <div style={{ flex: 0.8 }}>
                      <label className="form-label" style={{ fontSize: 11 }}>Date</label>
                      <input
                        type="date"
                        className="input"
                        value={noteForm.date}
                        onChange={e => updateNoteForm({ date: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <label className="form-label" style={{ fontSize: 11 }}>Content</label>
                    <textarea
                      className="input"
                      value={noteForm.content}
                      onChange={e => updateNoteForm({ content: e.target.value })}
                      placeholder="Start writing your note content here..."
                      style={{
                        flex: 1,
                        minHeight: 280,
                        fontFamily: 'monospace',
                        fontSize: 13,
                        lineHeight: 1.6,
                        resize: 'vertical'
                      }}
                    />
                  </div>
                </>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, color: 'var(--text-muted)', gap: 12 }}>
                  <BookOpen size={48} style={{ opacity: 0.3 }} />
                  <p style={{ fontSize: 14, margin: 0 }}>Select a note from the library or create a new one</p>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-primary btn-sm" onClick={() => handleCreateNote('Note')}>
                      <FileText size={14} style={{ marginRight: 4 }} /> New Note
                    </button>
                    <button className="btn btn-secondary btn-sm" onClick={() => handleCreateNote('Notice')} style={{ background: 'rgba(245,158,11,0.15)', color: 'var(--orange)', border: '1px solid var(--orange)' }}>
                      <Bell size={14} style={{ marginRight: 4 }} /> New Notice
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

// Spreadsheet styling constants
const spreadsheetHeaderStyle: React.CSSProperties = {
  padding: '4px 8px',
  fontSize: 10,
  fontWeight: 700,
  textAlign: 'center',
  color: 'var(--text-muted)',
  letterSpacing: 1,
  borderBottom: '1px solid var(--border)',
  textTransform: 'uppercase'
};

const spreadsheetSubHeaderStyle: React.CSSProperties = {
  padding: '6px 8px',
  fontSize: 11,
  fontWeight: 600,
  textAlign: 'left',
  color: 'var(--text-secondary)',
  borderBottom: '2px solid var(--border)'
};

const spreadsheetCellStyle: React.CSSProperties = {
  padding: '2px 4px',
  verticalAlign: 'middle'
};

const spreadsheetInputStyle: React.CSSProperties = {
  width: '100%',
  background: 'transparent',
  border: '1px solid transparent',
  borderRadius: 4,
  padding: '6px 8px',
  fontSize: 13,
  color: 'var(--text-primary)',
  outline: 'none',
  transition: 'border-color 0.15s ease'
};
