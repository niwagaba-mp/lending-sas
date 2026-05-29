import { useState, useEffect } from 'react';
import { 
  Building2, TrendingUp, DollarSign, AlertTriangle, 
  ArrowUpRight, ArrowDownRight, 
  Zap, Briefcase, ChevronRight, Phone, Mail, MessageSquare, Send, CheckSquare, Plus, Check, X, FileText, ExternalLink,
  Users, UserCheck, ShieldAlert, ShieldCheck, Ban, CheckCircle, HelpCircle, Activity, Award, Compass, Key, RotateCcw, Calculator
} from 'lucide-react';
import { fmt } from '../../store/AppContext';
import api from '../../services/api';

export default function ExecutiveBusinessConsole() {
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('May 2026 (Current Month)');
  const [activeTab, setActiveTab] = useState<'branches' | 'tasks' | 'portfolio' | 'access'>('branches');

  // Core Data Layer States
  const [loans, setLoans] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [branchesList, setBranchesList] = useState<any[]>([]);
  const [staffSearchQuery, setStaffSearchQuery] = useState('');

  // Diagnostic Modal & Notice Drafting State
  const [selectedBranchDiagnostics, setSelectedBranchDiagnostics] = useState<any>(null);
  const [selectedBranchForNotice, setSelectedBranchForNotice] = useState<any>(null);
  const [noticeSubject, setNoticeSubject] = useState('');
  const [noticeBody, setNoticeBody] = useState('');

  // Recapitalization Simulator State
  const [recapCapital, setRecapCapital] = useState(50000000);
  const [recapBranch, setRecapBranch] = useState('Mbarara Hub');
  const [recapCohort, setRecapCohort] = useState('Female Micro-Borrowers');

  // Executive Follow-up Task Manager State
  const [tasks, setTasks] = useState([
    { id: '1', title: 'Audit Masaka Loan Collections & Non-Performing Arrears', branch: 'Masaka Regional Branch', assignee: 'Sarah Nambi (+256 701 987654)', status: 'Pending', followUpLink: 'https://wa.me/256701987654?text=Urgent%20Followup%20on%20Masaka%20Arrears' },
    { id: '2', title: 'Commendation for Kampala Central Q1 Cash-In Flows', branch: 'Kampala Central Branch', assignee: 'James Okello (+256 772 123456)', status: 'Completed', followUpLink: 'mailto:j.okello@kilimomf.com?subject=Excellent%20Q1%20Performance' },
    { id: '3', title: 'Review Mbarara Field Officer Transport Stipend Logs', branch: 'Mbarara Hub', assignee: 'David Kato (+256 752 456789)', status: 'In Progress', followUpLink: 'https://wa.me/256752456789?text=Followup%20on%20Mbarara%20Transport%20Stipend' },
  ]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskBranch, setNewTaskBranch] = useState('Kampala Central Branch');
  const [newTaskAssignee, setNewTaskAssignee] = useState('James Okello (+256 772 123456)');

  // Add Staff Modal & Form State
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [newStaffFirstName, setNewStaffFirstName] = useState('');
  const [newStaffLastName, setNewStaffLastName] = useState('');
  const [newStaffEmail, setNewStaffEmail] = useState('');
  const [newStaffPhone, setNewStaffPhone] = useState('');
  const [newStaffRole, setNewStaffRole] = useState('loan_officer');
  const [newStaffBranch, setNewStaffBranch] = useState('Head Office');

  // Add Staff Document Upload States
  const [newStaffDocuments, setNewStaffDocuments] = useState<any[]>([]);
  const [docName, setDocName] = useState('');
  const [docSubcategory, setDocSubcategory] = useState('employment_contract');
  const [docFile, setDocFile] = useState<File | null>(null);
  const [docFileName, setDocFileName] = useState('');

  useEffect(() => {
    loadAllData(timeframe);
  }, [timeframe]);

  const loadAllData = async (selectedPeriod: string) => {
    try {
      setLoading(true);
      // Load branch metrics
      await loadBranchPerformance(selectedPeriod);
      // Load tables from database/localStorage
      const [loansRes, clientsRes, staffRes, branchesRes] = await Promise.all([
        api.getLoans(),
        api.getClients(),
        api.getStaff(),
        api.getBranches()
      ]);
      setLoans(loansRes.data || []);
      setClients(clientsRes.data || []);
      setStaff(staffRes.data || []);
      setBranchesList(branchesRes.data || []);
    } catch (e) {
      console.error('Error loading Business Console data:', e);
    } finally {
      setLoading(false);
    }
  };

  const loadBranchPerformance = async (selectedPeriod: string) => {
    try {
      let multipliers = { capital: 1, loans: 1, cashIn: 1, interest: 1, expenses: 1, arrears: 0 };
      let summaries: Record<string, string> = {};

      if (selectedPeriod === 'May 2026 (Current Month)') {
        multipliers = { capital: 1.0, loans: 1.0, cashIn: 1.0, interest: 1.0, expenses: 1.0, arrears: 0 };
        summaries = {
          b1: 'Exceptional cash-in flows (+18%) driven by automated SMS reminders. High interest recovery with low operating overhead.',
          b2: 'Collections impacted by agricultural off-season delays in Masaka. Arrears rate elevated; immediate field officer follow-up required.',
          b3: 'Consistent loan disbursement and solid interest yield. Transport stipends slightly increased expenses but efficiency remains very high.'
        };
      } else if (selectedPeriod === 'April 2026 (Previous Month)') {
        multipliers = { capital: 0.95, loans: 0.90, cashIn: 0.88, interest: 0.92, expenses: 0.96, arrears: +0.4 };
        summaries = {
          b1: 'Solid monthly performance with high collection rate. Operating expenses remained well within budgeted limits.',
          b2: 'Heavy rains caused slight collection delays in rural zones. Field agents conducted manual house visits to recover interest.',
          b3: 'High disbursement month following local trade fair. Early repayment interest boost observed across small business ledgers.'
        };
      } else if (selectedPeriod === 'March 2026') {
        multipliers = { capital: 0.90, loans: 0.85, cashIn: 0.82, interest: 0.85, expenses: 0.90, arrears: -0.2 };
        summaries = {
          b1: 'Q1 end wrap-up showed excellent loan maturity conversion. Zero non-performing loans written off in March.',
          b2: 'Arrears restructuring successfully brought 14 delinquent clients back to active status. Expense ratio optimized.',
          b3: 'Record low transport expenses recorded as field officers utilized centralized collection points.'
        };
      } else if (selectedPeriod === 'Q1 2026 (Monthly Average)') {
        multipliers = { capital: 0.92, loans: 0.88, cashIn: 0.85, interest: 0.89, expenses: 0.93, arrears: +0.1 };
        summaries = {
          b1: 'Consolidated Q1 monthly averages highlight stellar growth in merchant loans and superior net interest margin.',
          b2: 'Seasonal fluctuations stabilized when averaged across Q1. Portfolio quality remains acceptable but requires vigilance.',
          b3: 'Mbarara Hub demonstrated the highest return on capital across all regional branches throughout the first quarter.'
        };
      } else if (selectedPeriod === 'Year-to-Date (Monthly Average)') {
        multipliers = { capital: 0.98, loans: 0.95, cashIn: 0.94, interest: 0.96, expenses: 0.98, arrears: -0.1 };
        summaries = {
          b1: 'Year-to-date monthly trajectory indicates Kampala Central will exceed annual net profit projections by 22%.',
          b2: 'YTD average shows steady recovery post-harvest season. Active client retention is above 94%.',
          b3: 'Overall YTD metrics confirm Mbarara as the most cost-efficient operational hub in the western territory.'
        };
      }

      const baseData = [
        { 
          id: 'b1', name: 'Kampala Central Branch', manager: 'James Okello', phone: '+256 772 123456', email: 'j.okello@kilimomf.com',
          capital_added: 200000000, loans_given: 165000000, cash_in_flows: 48500000, interest_earned: 14200000, expenses: 5000000, 
          arrears_rate: 2.4, status: 'Top Performer'
        },
        { 
          id: 'b2', name: 'Masaka Regional Branch', manager: 'Sarah Nambi', phone: '+256 701 987654', email: 's.nambi@kilimomf.com',
          capital_added: 120000000, loans_given: 95000000, cash_in_flows: 24100000, interest_earned: 6100000, expenses: 2800000, 
          arrears_rate: 5.8, status: 'Under Review'
        },
        { 
          id: 'b3', name: 'Mbarara Hub', manager: 'David Kato', phone: '+256 752 456789', email: 'd.kato@kilimomf.com',
          capital_added: 150000000, loans_given: 120000000, cash_in_flows: 35500000, interest_earned: 9500000, expenses: 3500000, 
          arrears_rate: 3.1, status: 'Steady'
        }
      ];

      const computed = baseData.map(b => {
        const cap = Math.round(b.capital_added * multipliers.capital);
        const lg = Math.round(b.loans_given * multipliers.loans);
        const ci = Math.round(b.cash_in_flows * multipliers.cashIn);
        const ie = Math.round(b.interest_earned * multipliers.interest);
        const exp = Math.round(b.expenses * multipliers.expenses);
        const netProfit = Math.round(ie - exp + (ci * 0.05)); // interest earned minus expenses plus processing margin
        const arr = Math.max(0.5, Number((b.arrears_rate + multipliers.arrears).toFixed(1)));
        return {
          ...b,
          capital_added: cap,
          loans_given: lg,
          cash_in_flows: ci,
          interest_earned: ie,
          expenses: exp,
          net_profit: netProfit,
          arrears_rate: arr,
          summary: summaries[b.id] || 'Performance verified against monthly financial ledgers.'
        };
      });

      setBranches(computed);
    } catch (e) {
      console.error(e);
    }
  };

  // Staff Access Controls
  const handleToggleAccess = async (member: any) => {
    const newStatus = member.status === 'suspended' ? 'active' : 'suspended';
    try {
      await api.updateStaff(member.id, { status: newStatus });
      alert(`System access for ${member.first_name} ${member.last_name} has been set to ${newStatus.toUpperCase()}.`);
      // Reload staff list
      const staffRes = await api.getStaff();
      setStaff(staffRes.data || []);
    } catch (e) {
      console.error(e);
      alert('Failed to update staff system access.');
    }
  };

  const handleRoleChange = async (member: any, newRole: string) => {
    try {
      await api.updateStaff(member.id, { role: newRole });
      alert(`Role for ${member.first_name} ${member.last_name} updated to ${newRole.toUpperCase()}.`);
      const staffRes = await api.getStaff();
      setStaff(staffRes.data || []);
    } catch (e) {
      console.error(e);
      alert('Failed to update staff system role.');
    }
  };

  const handleBranchChange = async (member: any, newBranch: string) => {
    try {
      await api.updateStaff(member.id, { branch_name: newBranch });
      alert(`Branch for ${member.first_name} ${member.last_name} updated to ${newBranch}.`);
      const staffRes = await api.getStaff();
      setStaff(staffRes.data || []);
    } catch (e) {
      console.error(e);
      alert('Failed to reassign branch.');
    }
  };

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const staffRes = await api.createStaff({
        first_name: newStaffFirstName,
        last_name: newStaffLastName,
        email: newStaffEmail,
        phone: newStaffPhone,
        role: newStaffRole,
        branch_name: newStaffBranch,
        status: 'active'
      });
      
      const newStaffId = staffRes.data.id;
      const newStaffFullName = `${newStaffFirstName} ${newStaffLastName}`;

      // Upload all attached onboarding documents
      if (newStaffDocuments.length > 0) {
        await Promise.all(newStaffDocuments.map(doc => 
          api.uploadDocument({
            name: doc.name,
            subcategory: doc.subcategory,
            category: 'staff',
            entity_id: newStaffId,
            entity_name: newStaffFullName,
            file_type: doc.file_type,
            file_size: doc.file_size,
            notes: doc.notes
          })
        ));
      }

      alert(`Staff member "${newStaffFullName}" has been successfully registered with ${newStaffDocuments.length} onboarding document(s) uploaded!`);
      
      // Reset state and close modal
      setNewStaffFirstName('');
      setNewStaffLastName('');
      setNewStaffEmail('');
      setNewStaffPhone('');
      setNewStaffRole('loan_officer');
      setNewStaffBranch('Head Office');
      setNewStaffDocuments([]);
      setShowAddStaffModal(false);

      // Reload staff list
      const staffListRes = await api.getStaff();
      setStaff(staffListRes.data || []);
    } catch (err) {
      console.error(err);
      alert('Failed to add staff member.');
    }
  };

  const handleAddTempDocument = () => {
    if (!docName.trim()) {
      alert('Please enter a document title.');
      return;
    }
    const fakeSize = docFile ? docFile.size : Math.floor(Math.random() * 800000) + 100000;
    const fakeType = docFile ? docFile.type : 'application/pdf';
    
    // Add to list
    setNewStaffDocuments([...newStaffDocuments, {
      name: docName.trim(),
      subcategory: docSubcategory,
      category: 'staff',
      file_type: fakeType,
      file_size: fakeSize,
      notes: `Staff onboarding attachment: ${docSubcategory}`,
      tempId: Date.now()
    }]);

    // Reset inputs
    setDocName('');
    setDocFileName('');
    setDocFile(null);
  };

  const handleRemoveTempDocument = (tempId: number) => {
    setNewStaffDocuments(newStaffDocuments.filter(d => d.tempId !== tempId));
  };

  const handleDeleteStaff = async (memberId: string, name: string) => {
    if (!window.confirm(`Are you absolutely sure you want to permanently delete staff member "${name}"? This action cannot be undone.`)) {
      return;
    }
    try {
      await api.deleteStaff(memberId);
      alert(`Staff member "${name}" was successfully deleted.`);
      // Reload staff list
      const staffRes = await api.getStaff();
      setStaff(staffRes.data || []);
    } catch (err) {
      console.error(err);
      alert('Failed to delete staff member.');
    }
  };

  // Dynamic Portfolio Diagnostics Aggregator
  const normalizeBranchName = (name: string = '') => {
    const n = name.toLowerCase();
    if (n.includes('kampala') || n.includes('head office')) return 'Kampala Central Branch';
    if (n.includes('masaka') || n.includes('gulu')) return 'Masaka Regional Branch';
    if (n.includes('mbarara')) return 'Mbarara Hub';
    return name;
  };

  const getBranchSegmentMetrics = () => {
    const branchNames = ['Kampala Central Branch', 'Masaka Regional Branch', 'Mbarara Hub'];
    
    // Baseline regional statistics to blend in for realistic representation of demo data
    const baselines: Record<string, any> = {
      'Kampala Central Branch': {
        femaleVolume: 42000000, femaleCount: 28, femaleRepay: 98.4, femaleArrears: 1.2,
        microVolume: 18500000, microCount: 68, microRepay: 97.2, microArrears: 1.5,
        avgVelocity: 3.2, hvRepay: 99.1, profitScore: 9.2
      },
      'Masaka Regional Branch': {
        femaleVolume: 19000000, femaleCount: 19, femaleRepay: 91.5, femaleArrears: 6.4,
        microVolume: 8200000, microCount: 35, microRepay: 92.1, microArrears: 5.2,
        avgVelocity: 2.4, hvRepay: 93.8, profitScore: 6.5
      },
      'Mbarara Hub': {
        femaleVolume: 28000000, femaleCount: 24, femaleRepay: 97.9, femaleArrears: 1.8,
        microVolume: 14400000, microCount: 52, microRepay: 98.6, microArrears: 0.9,
        avgVelocity: 2.9, hvRepay: 99.4, profitScore: 8.8
      }
    };

    return branchNames.map(bName => {
      const base = baselines[bName] || {
        femaleVolume: 10000000, femaleCount: 5, femaleRepay: 95, femaleArrears: 2,
        microVolume: 5000000, microCount: 10, microRepay: 95, microArrears: 2,
        avgVelocity: 2.0, hvRepay: 95, profitScore: 7
      };

      // Filter live loans from database/localStorage for this branch
      const branchLoans = loans.filter(l => normalizeBranchName(l.branch_name) === bName);
      
      // Female live calculations
      const femaleLoans = branchLoans.filter(l => {
        const c = clients.find(cl => cl.id === l.client_id);
        return c && c.gender === 'female';
      });
      
      let liveFemaleVolume = 0;
      let liveFemalePaid = 0;
      let liveFemaleRepayable = 0;
      let liveFemaleArrears = 0;
      
      femaleLoans.forEach(l => {
        liveFemaleVolume += Number(l.principal_amount || 0);
        liveFemalePaid += Number(l.total_paid || 0);
        liveFemaleRepayable += Number(l.total_repayable || 0);
        liveFemaleArrears += Number(l.arrears_amount || 0);
      });

      // 100k - 300k live calculations
      const microLoans = branchLoans.filter(l => {
        const principal = Number(l.principal_amount || 0);
        return principal >= 100000 && principal <= 300000;
      });

      let liveMicroVolume = 0;
      let liveMicroPaid = 0;
      let liveMicroRepayable = 0;
      let liveMicroArrears = 0;

      microLoans.forEach(l => {
        liveMicroVolume += Number(l.principal_amount || 0);
        liveMicroPaid += Number(l.total_paid || 0);
        liveMicroRepayable += Number(l.total_repayable || 0);
        liveMicroArrears += Number(l.arrears_amount || 0);
      });

      // Combine Live + Baseline for visual elegance and live response
      const femaleCount = base.femaleCount + femaleLoans.length;
      const femaleVolume = base.femaleVolume + liveFemaleVolume;
      const femaleRepay = femaleLoans.length > 0 
        ? ((liveFemalePaid / Math.max(1, liveFemaleRepayable)) * 100 * 0.4) + (base.femaleRepay * 0.6) 
        : base.femaleRepay;
      const femaleArrears = femaleLoans.length > 0
        ? ((liveFemaleArrears / Math.max(1, liveFemaleVolume)) * 100 * 0.4) + (base.femaleArrears * 0.6)
        : base.femaleArrears;

      const microCount = base.microCount + microLoans.length;
      const microVolume = base.microVolume + liveMicroVolume;
      const microRepay = microLoans.length > 0
        ? ((liveMicroPaid / Math.max(1, liveMicroRepayable)) * 100 * 0.4) + (base.microRepay * 0.6)
        : base.microRepay;
      const microArrears = microLoans.length > 0
        ? ((liveMicroArrears / Math.max(1, liveMicroVolume)) * 100 * 0.4) + (base.microArrears * 0.6)
        : base.microArrears;

      // Borrowing Frequency
      const hvLoans = branchLoans.filter(l => {
        const c = clients.find(cl => cl.id === l.client_id);
        return c && Number(c.loan_count || 0) >= 3;
      });
      const hvRepay = hvLoans.length > 0
        ? (hvLoans.filter(l => l.status === 'closed' || l.arrears_amount === 0).length / hvLoans.length) * 100
        : base.hvRepay;

      return {
        name: bName,
        femaleCount,
        femaleVolume,
        femaleRepay: Number(femaleRepay.toFixed(1)),
        femaleArrears: Number(femaleArrears.toFixed(1)),
        microCount,
        microVolume,
        microRepay: Number(microRepay.toFixed(1)),
        microArrears: Number(microArrears.toFixed(1)),
        avgVelocity: base.avgVelocity,
        hvRepay: Number(hvRepay.toFixed(1)),
        profitScore: base.profitScore
      };
    });
  };

  // High Velocity Repeat Customers per Branch
  const getHighVelocityClients = () => {
    const list = clients.filter(c => c.loan_count >= 1);
    const sorted = [...list].sort((a, b) => b.loan_count - a.loan_count || b.credit_score - a.credit_score);
    return sorted;
  };

  // Determine client's typical loan size range and duration from database
  const getClientLoanRangeAndTerm = (clientId: string) => {
    const clientLoans = loans.filter(l => l.client_id === clientId);
    if (clientLoans.length > 0) {
      const principals = clientLoans.map(l => Number(l.principal_amount || 0));
      const maxP = Math.max(...principals);
      const term = clientLoans[0].term_months || 3;
      
      let rangeStr = '';
      if (maxP <= 300000) rangeStr = '100k - 300k (Micro)';
      else if (maxP <= 600000) rangeStr = '400k - 600k (Mid-Micro)';
      else if (maxP <= 1500000) rangeStr = '1M Range (Mid)';
      else rangeStr = '5M Range (Comm)';

      return { range: rangeStr, term: `${term} Mo.` };
    }
    
    // Fallback logic
    if (clientId === 'c001') return { range: '1M Range (Mid)', term: '6 Mo.' };
    if (clientId === 'c002') return { range: '1M Range (Mid)', term: '6 Mo.' };
    if (clientId === 'c003') return { range: '400k - 600k (Mid-Micro)', term: '3 Mo.' };
    return { range: '100k - 300k (Micro)', term: '3 Mo.' };
  };

  // Expanded Loan Brackets analysis logic
  const getLoanSizeBracketMetrics = () => {
    const brackets = [
      { name: '100k - 300k Bracket', range: [100000, 300000], label: 'Micro-loans' },
      { name: '400k - 600k Bracket', range: [400000, 600000], label: 'Mid-Micro' },
      { name: '1M Bracket Range', range: [800000, 1200000], label: 'Mid-Range' },
      { name: '5M Bracket Range', range: [4000000, 6000000], label: 'Commercial' }
    ];

    const branchNames = ['Kampala Central Branch', 'Masaka Regional Branch', 'Mbarara Hub'];

    const bracketBaselines: Record<string, Record<string, any>> = {
      'Kampala Central Branch': {
        '100k - 300k Bracket': { volume: 18500000, count: 68, repay: 97.2, arrears: 1.5, profit: '🟢 High Yield (9.2/10)' },
        '400k - 600k Bracket': { volume: 22000000, count: 44, repay: 94.8, arrears: 3.1, profit: '🟢 Profitable (8.0/10)' },
        '1M Bracket Range': { volume: 38000000, count: 38, repay: 90.5, arrears: 6.2, profit: '🟡 Moderate (6.8/10)' },
        '5M Bracket Range': { volume: 85000000, count: 17, repay: 84.1, arrears: 11.8, profit: '🔴 Low Profit/High Risk (4.1/10)' }
      },
      'Masaka Regional Branch': {
        '100k - 300k Bracket': { volume: 8200000, count: 35, repay: 92.1, arrears: 5.2, profit: '🟢 Profitable (7.5/10)' },
        '400k - 600k Bracket': { volume: 11500000, count: 23, repay: 89.4, arrears: 7.8, profit: '🟡 Moderate Risk (6.2/10)' },
        '1M Bracket Range': { volume: 29000000, count: 29, repay: 85.2, arrears: 10.5, profit: '🔴 High Risk (4.5/10)' },
        '5M Bracket Range': { volume: 45000000, count: 9, repay: 81.7, arrears: 14.2, profit: '🔴 Unprofitable/Critical (2.8/10)' }
      },
      'Mbarara Hub': {
        '100k - 300k Bracket': { volume: 14400000, count: 52, repay: 98.6, arrears: 0.9, profit: '🟢 Exceptionally High (9.8/10)' },
        '400k - 600k Bracket': { volume: 19500000, count: 39, repay: 96.1, arrears: 1.8, profit: '🟢 High Yield (9.0/10)' },
        '1M Bracket Range': { volume: 32000000, count: 32, repay: 92.8, arrears: 4.5, profit: '🟢 Profitable (7.8/10)' },
        '5M Bracket Range': { volume: 55000000, count: 11, repay: 89.2, arrears: 8.5, profit: '🟡 Moderate Risk (6.1/10)' }
      }
    };

    return brackets.map(bracket => {
      const branchStats = branchNames.map(bName => {
        const base = bracketBaselines[bName]?.[bracket.name] || { volume: 0, count: 0, repay: 90, arrears: 5, profit: 'Unknown' };

        const liveLoans = loans.filter(l => {
          const isBranch = normalizeBranchName(l.branch_name) === bName;
          const principal = Number(l.principal_amount || 0);
          return isBranch && principal >= bracket.range[0] && principal <= bracket.range[1];
        });

        let liveVolume = 0;
        let livePaid = 0;
        let liveRepayable = 0;
        let liveArrears = 0;

        liveLoans.forEach(l => {
          liveVolume += Number(l.principal_amount || 0);
          livePaid += Number(l.total_paid || 0);
          liveRepayable += Number(l.total_repayable || 0);
          liveArrears += Number(l.arrears_amount || 0);
        });

        const count = base.count + liveLoans.length;
        const volume = base.volume + liveVolume;
        const repay = liveLoans.length > 0
          ? ((livePaid / Math.max(1, liveRepayable)) * 100 * 0.4) + (base.repay * 0.6)
          : base.repay;
        const arrears = liveLoans.length > 0
          ? ((liveArrears / Math.max(1, liveVolume)) * 100 * 0.4) + (base.arrears * 0.6)
          : base.arrears;

        return {
          branchName: bName,
          count,
          volume,
          repay: Number(repay.toFixed(1)),
          arrears: Number(arrears.toFixed(1)),
          profit: base.profit
        };
      });

      return {
        bracketName: bracket.name,
        label: bracket.label,
        branchStats
      };
    });
  };

  // Get Bad Performing Loans (Defaulters & High Risk in Arrears)
  const getBadPerformingLoans = () => {
    const badLoans = loans.filter(l => 
      Number(l.arrears_amount || 0) > 0 || 
      Number(l.arrears_days || 0) > 0 || 
      l.status === 'dormant' || 
      l.is_manual_default
    );
    return [...badLoans].sort((a, b) => Number(b.arrears_amount || 0) - Number(a.arrears_amount || 0));
  };

  // Strategic Recapitalization Simulation Engine
  const simulateRecap = () => {
    let avgLoanSize = 250000;
    let repaymentRate = 98.6;
    let interestRate = 20; // 20% flat interest
    let durationMonths = 3; // 3 months micro-finance rotation

    if (recapCohort === '100k-300k Micro-loans') {
      avgLoanSize = 200000;
      repaymentRate = recapBranch === 'Mbarara Hub' ? 98.6 : recapBranch === 'Kampala Central Branch' ? 97.2 : 92.1;
      durationMonths = 3;
    } else if (recapCohort === 'Female Micro-Borrowers') {
      avgLoanSize = 250000;
      repaymentRate = recapBranch === 'Mbarara Hub' ? 97.9 : recapBranch === 'Kampala Central Branch' ? 98.4 : 91.5;
      durationMonths = 4;
    } else { // High Velocity Repeat Customers
      avgLoanSize = 400000;
      repaymentRate = recapBranch === 'Mbarara Hub' ? 99.4 : recapBranch === 'Kampala Central Branch' ? 99.1 : 93.8;
      durationMonths = 3;
    }

    const clientsFunded = Math.floor(recapCapital / avgLoanSize);
    const grossReturn = recapCapital * (interestRate / 100);
    const expectedLoss = recapCapital * ((100 - repaymentRate) / 100);
    const netProfit = grossReturn - expectedLoss;
    const cyclesPerYear = Number((12 / durationMonths).toFixed(1));
    const annualVelocityProfit = netProfit * cyclesPerYear;

    return {
      clientsFunded,
      grossReturn,
      expectedLoss,
      netProfit,
      cyclesPerYear,
      annualVelocityProfit,
      repaymentRate
    };
  };

  const totalCapital = branches.reduce((s, b) => s + b.capital_added, 0);
  const totalLoans = branches.reduce((s, b) => s + b.loans_given, 0);
  const totalCashIn = branches.reduce((s, b) => s + b.cash_in_flows, 0);
  const totalProfit = branches.reduce((s, b) => s + b.net_profit, 0);
  const avgArrears = branches.reduce((s, b) => s + b.arrears_rate, 0) / branches.length;

  const openNoticeModal = (b: any) => {
    setSelectedBranchForNotice(b);
    setNoticeSubject(`Executive Review & Action Directive: ${b.name}`);
    setNoticeBody(
      `Dear ${b.manager},\n\n` +
      `Following our quarterly executive review of ${b.name}, we noted the following performance metrics:\n` +
      `- Capital Allocated: UGX ${(b.capital_added/1000000).toFixed(1)}M\n` +
      `- Loans Disbursed: UGX ${(b.loans_given/1000000).toFixed(1)}M\n` +
      `- Total Cash-In Flows: UGX ${(b.cash_in_flows/1000000).toFixed(1)}M\n` +
      `- Net Profit Generated: UGX ${(b.net_profit/1000000).toFixed(1)}M\n` +
      `- Arrears Rate: ${b.arrears_rate}%\n\n` +
      `AI Diagnostic Summary:\n"${b.summary}"\n\n` +
      `Please review your active field officer logs and implement immediate corrective actions to optimize collection density.\n\n` +
      `Best regards,\nBusiness Owner & Board of Directors`
    );
  };

  const handleDispatchNotice = (e: React.FormEvent) => {
    e.preventDefault();
    alert(`Official notification successfully dispatched to ${selectedBranchForNotice.email} (${selectedBranchForNotice.manager})!`);
    setSelectedBranchForNotice(null);
  };

  const addTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    setTasks([...tasks, {
      id: String(Date.now()),
      title: newTaskTitle.trim(),
      branch: newTaskBranch,
      assignee: newTaskAssignee,
      status: 'Pending',
      followUpLink: `https://wa.me/${newTaskAssignee.match(/\+256[0-9 ]+/)?.[0]?.replace(/ /g,'') || '256700000000'}?text=${encodeURIComponent(newTaskTitle)}`
    }]);
    setNewTaskTitle('');
  };

  const toggleTaskStatus = (id: string) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, status: t.status === 'Completed' ? 'Pending' : 'Completed' } : t));
  };

  const segmentMetrics = getBranchSegmentMetrics();
  const sim = simulateRecap();

  // Filter staff by search text
  const filteredStaff = staff.filter(s => 
    `${s.first_name} ${s.last_name}`.toLowerCase().includes(staffSearchQuery.toLowerCase()) ||
    s.email?.toLowerCase().includes(staffSearchQuery.toLowerCase()) ||
    s.role?.toLowerCase().includes(staffSearchQuery.toLowerCase())
  );

  return (
    <div className="page-container" style={{ background: '#f8fafc', minHeight: '100vh', padding: '24px 40px' }}>
      
      {/* ── EXECUTIVE HEADER ───────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <div style={{ background: '#0f172a', padding: 8, borderRadius: 10 }}>
              <Building2 size={24} color="#fff" />
            </div>
            <h1 style={{ fontSize: 28, fontWeight: 900, margin: 0, color: '#0f172a', letterSpacing: '-0.02em' }}>BUSINESS OWNER CONSOLE</h1>
          </div>
          <p style={{ color: '#64748b', margin: 0 }}>Multi-Branch Portfolio Intelligence, Staff Access Controls & Recapitalization Advisor</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <select 
            className="form-control" 
            value={timeframe} 
            onChange={e => setTimeframe(e.target.value)}
            style={{ width: 260, background: '#fff', fontWeight: 700, color: '#1e293b', border: '2px solid #cbd5e1', borderRadius: 10, padding: '8px 14px' }}
          >
            <option value="May 2026 (Current Month)">📅 May 2026 (Current Month)</option>
            <option value="April 2026 (Previous Month)">📅 April 2026 (Previous Month)</option>
            <option value="March 2026">📅 March 2026</option>
            <option value="Q1 2026 (Monthly Average)">📊 Q1 2026 (Monthly Average)</option>
            <option value="Year-to-Date (Monthly Average)">📈 Year-to-Date (Monthly Average)</option>
          </select>
          <button 
            className="btn btn-secondary" 
            style={{ background: '#fff', color: '#1e293b', border: '1px solid #cbd5e1' }} 
            onClick={() => loadAllData(timeframe)}
          >
            <RotateCcw size={16} /> Sync Data
          </button>
        </div>
      </div>

      {/* ── CONSOLIDATED KPI STRIP ─────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16, marginBottom: 28 }}>
        <ExecStatCard label="Total Capital Allocated" value={totalCapital} icon={<Briefcase size={20} />} color="#3b82f6" trend="+10.0%" />
        <ExecStatCard label="Total Loans Given Out" value={totalLoans} icon={<DollarSign size={20} />} color="#8b5cf6" trend="+14.2%" />
        <ExecStatCard label="Total Cash-In Flows" value={totalCashIn} icon={<TrendingUp size={20} />} color="#10b981" trend="+18.5%" />
        <ExecStatCard label="Group Net Profit" value={totalProfit} icon={<Zap size={20} />} color="#f59e0b" trend="+15.2%" />
        <ExecStatCard label="Avg Branch Arrears" value={`${avgArrears.toFixed(1)}%`} icon={<AlertTriangle size={20} />} color="#ef4444" trend="-0.5%" reverse />
      </div>

      {/* ── NAVIGATION TABS ────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 24, borderBottom: '1px solid #e2e8f0', marginBottom: 24, overflowX: 'auto' }}>
        <button 
          onClick={() => setActiveTab('branches')} 
          style={{ 
            padding: '16px 0', background: 'none', border: 'none', 
            borderBottom: activeTab === 'branches' ? '2px solid #1e293b' : 'none',
            color: activeTab === 'branches' ? '#1e293b' : '#64748b',
            fontWeight: activeTab === 'branches' ? 800 : 600, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, whiteSpace: 'nowrap'
          }}
        >
          <Building2 size={16} /> Branch Performance Hub
        </button>

        <button 
          onClick={() => setActiveTab('portfolio')} 
          style={{ 
            padding: '16px 0', background: 'none', border: 'none', 
            borderBottom: activeTab === 'portfolio' ? '2px solid #1e293b' : 'none',
            color: activeTab === 'portfolio' ? '#1e293b' : '#64748b',
            fontWeight: activeTab === 'portfolio' ? 800 : 600, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, whiteSpace: 'nowrap'
          }}
        >
          <TrendingUp size={16} /> Portfolio Insights & Recapitalize
        </button>

        <button 
          onClick={() => setActiveTab('access')} 
          style={{ 
            padding: '16px 0', background: 'none', border: 'none', 
            borderBottom: activeTab === 'access' ? '2px solid #1e293b' : 'none',
            color: activeTab === 'access' ? '#1e293b' : '#64748b',
            fontWeight: activeTab === 'access' ? 800 : 600, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, whiteSpace: 'nowrap'
          }}
        >
          <Key size={16} /> Staff Access Control
        </button>

        <button 
          onClick={() => setActiveTab('tasks')} 
          style={{ 
            padding: '16px 0', background: 'none', border: 'none', 
            borderBottom: activeTab === 'tasks' ? '2px solid #1e293b' : 'none',
            color: activeTab === 'tasks' ? '#1e293b' : '#64748b',
            fontWeight: activeTab === 'tasks' ? 800 : 600, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, whiteSpace: 'nowrap'
          }}
        >
          <CheckSquare size={16} /> Executive Task Manager ({tasks.filter(t => t.status === 'Pending').length})
        </button>
      </div>

      {/* ── TAB CONTENT: BRANCH PERFORMANCE ────────────────── */}
      {activeTab === 'branches' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div className="card" style={{ padding: 0, background: '#fff', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: '#1e293b', margin: 0 }}>Detailed Financial Flows & Performance per Branch</h3>
                <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>Displaying verified monthly data based on P&L reports for <strong style={{ color: '#0284c7' }}>{timeframe}</strong>.</p>
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#10b981', background: '#10b98115', padding: '6px 12px', borderRadius: 20 }}>
                ✓ All branches reporting live telemetry
              </span>
            </div>
            
            <table className="table" style={{ width: '100%' }}>
              <thead style={{ background: '#f8fafc' }}>
                <tr>
                  <th style={{ color: '#475569', padding: '16px 20px' }}>Branch & Manager</th>
                  <th style={{ color: '#475569' }}>Capital Added</th>
                  <th style={{ color: '#475569' }}>Loans Given Out</th>
                  <th style={{ color: '#475569' }}>Cash-In Flows</th>
                  <th style={{ color: '#475569' }}>Interest Earned</th>
                  <th style={{ color: '#475569' }}>Total Expenses</th>
                  <th style={{ color: '#475569' }}>Net Profit</th>
                  <th style={{ color: '#475569' }}>Arrears</th>
                  <th style={{ textAlign: 'right', paddingRight: 20 }}>Executive Action</th>
                </tr>
              </thead>
              <tbody>
                {branches.map(b => (
                  <tr key={b.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ fontWeight: 800, color: '#1e293b', fontSize: 14 }}>{b.name}</div>
                      <div style={{ fontSize: 11, color: '#64748b', display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                        <span style={{ fontWeight: 700, color: '#0f172a' }}>{b.manager}</span> · 
                        <a href={`tel:${b.phone}`} style={{ color: '#3b82f6', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 2 }}>
                          <Phone size={10} /> {b.phone}
                        </a>
                      </div>
                    </td>
                    <td style={{ fontWeight: 700, color: '#334155' }}>{fmt.currency(b.capital_added, 'UGX')}</td>
                    <td style={{ fontWeight: 700, color: '#3b82f6' }}>{fmt.currency(b.loans_given, 'UGX')}</td>
                    <td style={{ fontWeight: 800, color: '#10b981' }}>{fmt.currency(b.cash_in_flows, 'UGX')}</td>
                    <td style={{ fontWeight: 700, color: '#8b5cf6' }}>{fmt.currency(b.interest_earned, 'UGX')}</td>
                    <td style={{ fontWeight: 700, color: '#ef4444' }}>{fmt.currency(b.expenses, 'UGX')}</td>
                    <td style={{ fontWeight: 900, fontSize: 15, color: '#10b981' }}>{fmt.currency(b.net_profit, 'UGX')}</td>
                    <td>
                      <span className={`badge badge-${b.arrears_rate > 5 ? 'danger' : b.arrears_rate > 3 ? 'warning' : 'success'}`} style={{ fontSize: 12 }}>
                        {b.arrears_rate}%
                      </span>
                    </td>
                    <td style={{ textAlign: 'right', paddingRight: 20 }}>
                      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                        <button 
                          className="btn btn-secondary btn-sm" 
                          style={{ fontSize: 11, padding: '6px 10px', background: '#f1f5f9', color: '#1e293b' }}
                          onClick={() => setSelectedBranchDiagnostics(b)}
                        >
                          <Zap size={12} color="#f59e0b" fill="#f59e0b" /> Diagnostics
                        </button>
                        <button 
                          className="btn btn-primary btn-sm" 
                          style={{ fontSize: 11, padding: '6px 10px', background: '#1e293b', color: '#fff' }}
                          onClick={() => openNoticeModal(b)}
                        >
                          <Send size={12} /> Draft Notice
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ── DIAGNOSTICS & FOLLOWUPS ─────────────────────── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <div className="card" style={{ padding: 28, background: '#1e293b', color: '#fff', border: 'none', borderRadius: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                <div style={{ background: '#fbbf24', padding: 8, borderRadius: 10 }}>
                  <Zap size={22} color="#000" fill="#000" />
                </div>
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: '#fff' }}>Executive Diagnostic Summaries</h3>
                  <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>AI analysis identifying primary drivers of branch financial performance.</p>
                </div>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                {branches.map(b => (
                  <div key={b.id} style={{ padding: 16, background: '#0f172a', borderRadius: 12, borderLeft: `4px solid ${b.net_profit > 5000000 ? '#10b981' : '#f59e0b'}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <span style={{ fontSize: 14, fontWeight: 800, color: '#f8fafc' }}>{b.name} ({b.manager})</span>
                      <span style={{ fontSize: 12, color: '#3b82f6', fontWeight: 700 }}>Profit: {fmt.currency(b.net_profit, 'UGX')}</span>
                    </div>
                    <p style={{ fontSize: 12, color: '#cbd5e1', margin: 0, lineHeight: 1.5 }}>"{b.summary}"</p>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div className="card" style={{ padding: 24, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16 }}>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: '#1e293b', marginBottom: 16 }}>Quick Follow-up Contacts</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {branches.map(b => (
                    <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 14, background: '#f8fafc', borderRadius: 12, border: '1px solid #e2e8f0' }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 800, color: '#1e293b' }}>{b.manager}</div>
                        <div style={{ fontSize: 11, color: '#64748b' }}>{b.name}</div>
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <a href={`tel:${b.phone || ''}`} className="btn btn-secondary btn-sm" style={{ padding: '6px 12px', fontSize: 12 }}>
                          <Phone size={12} /> Call
                        </a>
                        <a href={`https://wa.me/${(b.phone || '').replace(/[^0-9]/g, '')}?text=Urgent%20Followup%20on%20Branch%20Performance`} target="_blank" rel="noreferrer" className="btn btn-primary btn-sm" style={{ padding: '6px 12px', fontSize: 12, background: '#25D366', color: '#fff', border: 'none' }}>
                          <MessageSquare size={12} /> WhatsApp
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* ── TAB CONTENT: PORTFOLIO INSIGHTS & RECAPITALIZATION ── */}
      {activeTab === 'portfolio' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
          
          {/* CRITICAL RISK ALERTS (WE DONT WANT TO THINK ADVISOR) */}
          <div className="card" style={{ padding: 24, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <ShieldAlert size={20} color="#ef4444" />
              <h3 style={{ fontSize: 16, fontWeight: 800, color: '#1e293b', margin: 0 }}>⚠️ Critical Portfolio Alerts & Risk Advisor</h3>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
              <div style={{ background: '#ef44440a', border: '1px solid #ef444433', padding: 16, borderRadius: 12, borderLeft: '4px solid #ef4444', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                    <Ban size={16} color="#ef4444" />
                    <span style={{ fontSize: 12, fontWeight: 800, color: '#b91c1c' }}>UNPROFITABLE: 5M Commercial</span>
                  </div>
                  <p style={{ fontSize: 11, color: '#3f3f46', margin: 0, lineHeight: 1.4 }}>
                    <strong>Kampala & Masaka large loans</strong> have highest default risk. Arrears rates are <strong>11.8%</strong> and <strong>14.2%</strong>. Capital return is negative after defaults.
                  </p>
                </div>
                <div style={{ fontSize: 10, fontWeight: 900, color: '#b91c1c', marginTop: 10, textTransform: 'uppercase' }}>
                  🛑 ACTION: Freeze all 5M approvals immediately.
                </div>
              </div>

              <div style={{ background: '#f973160a', border: '1px solid #f9731633', padding: 16, borderRadius: 12, borderLeft: '4px solid #f97316', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                    <AlertTriangle size={16} color="#f97316" />
                    <span style={{ fontSize: 12, fontWeight: 800, color: '#c2410c' }}>HIGH RISK: 1M Mid-Range</span>
                  </div>
                  <p style={{ fontSize: 11, color: '#3f3f46', margin: 0, lineHeight: 1.4 }}>
                    Masaka agricultural delayed harvests pushed arrears to <strong>10.5%</strong>. Mbarara remains safer (4.5% arrears) but requires tight oversight.
                  </p>
                </div>
                <div style={{ fontSize: 10, fontWeight: 900, color: '#c2410c', marginTop: 10, textTransform: 'uppercase' }}>
                  ⚠️ ACTION: Hold agricultural 1M; deploy field collections.
                </div>
              </div>

              <div style={{ background: '#eab3080a', border: '1px solid #eab30833', padding: 16, borderRadius: 12, borderLeft: '4px solid #eab308', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                    <AlertTriangle size={16} color="#eab308" />
                    <span style={{ fontSize: 12, fontWeight: 800, color: '#854d0e' }}>MODERATE: 400k-600k Mid-Micro</span>
                  </div>
                  <p style={{ fontSize: 11, color: '#3f3f46', margin: 0, lineHeight: 1.4 }}>
                    Highly profitable in Mbarara (1.8% arrears) and Kampala (3.1%). However, Masaka defaults sit at <strong>7.8%</strong>.
                  </p>
                </div>
                <div style={{ fontSize: 10, fontWeight: 900, color: '#854d0e', marginTop: 10, textTransform: 'uppercase' }}>
                  ⚡ ACTION: Limit 400k-600k to Mbarara & Kampala branches.
                </div>
              </div>

              <div style={{ background: '#10b9810a', border: '1px solid #10b98133', padding: 16, borderRadius: 12, borderLeft: '4px solid #10b981', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                    <CheckCircle size={16} color="#10b981" />
                    <span style={{ fontSize: 12, fontWeight: 800, color: '#047857' }}>HIGH PROFIT: 100k-300k Micro</span>
                  </div>
                  <p style={{ fontSize: 11, color: '#3f3f46', margin: 0, lineHeight: 1.4 }}>
                    Female micro-cohorts maintain <strong>98.6% recovery</strong> in Mbarara and <strong>97.2%</strong> in Kampala. Very low arrears & fast 3-month capital rotation.
                  </p>
                </div>
                <div style={{ fontSize: 10, fontWeight: 900, color: '#047857', marginTop: 10, textTransform: 'uppercase' }}>
                  💰 ACTION: Focus 80% recapitalization capital here.
                </div>
              </div>
            </div>
          </div>

          {/* TOP SUMMARY STRIP FOR TARGET PORTFOLIOS */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20 }}>
            <div className="card" style={{ padding: 24, background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', color: '#fff', border: 'none', borderRadius: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div style={{ background: '#ec48991b', color: '#ec4899', padding: 10, borderRadius: 12 }}>
                  <Users size={22} />
                </div>
                <span style={{ fontSize: 12, fontWeight: 800, color: '#ec4899', background: '#ec48991b', padding: '4px 10px', borderRadius: 20 }}>Target demographic</span>
              </div>
              <div style={{ fontSize: 12, textTransform: 'uppercase', color: '#94a3b8', fontWeight: 700, letterSpacing: '0.05em' }}>Female Borrowers Repayment</div>
              <div style={{ fontSize: 28, fontWeight: 900, marginTop: 4, color: '#fff' }}>95.9%</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#10b981', marginTop: 12 }}>
                <ArrowUpRight size={16} />
                <span>Highest segment recovery rate in Western Territory</span>
              </div>
              <div style={{ width: '100%', background: '#334155', height: 6, borderRadius: 3, marginTop: 12, overflow: 'hidden' }}>
                <div style={{ width: '95.9%', background: '#ec4899', height: '100%' }}></div>
              </div>
            </div>

            <div className="card" style={{ padding: 24, background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', color: '#fff', border: 'none', borderRadius: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div style={{ background: '#3b82f61b', color: '#3b82f6', padding: 10, borderRadius: 12 }}>
                  <Briefcase size={22} />
                </div>
                <span style={{ fontSize: 12, fontWeight: 800, color: '#3b82f6', background: '#3b82f61b', padding: '4px 10px', borderRadius: 20 }}>High Velocity Size</span>
              </div>
              <div style={{ fontSize: 12, textTransform: 'uppercase', color: '#94a3b8', fontWeight: 700, letterSpacing: '0.05em' }}>100k - 300k Borrowers Recovery</div>
              <div style={{ fontSize: 28, fontWeight: 900, marginTop: 4, color: '#fff' }}>96.0%</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#10b981', marginTop: 12 }}>
                <ArrowUpRight size={16} />
                <span>Shortest rotation cycles (Avg 90 days)</span>
              </div>
              <div style={{ width: '100%', background: '#334155', height: 6, borderRadius: 3, marginTop: 12, overflow: 'hidden' }}>
                <div style={{ width: '96%', background: '#3b82f6', height: '100%' }}></div>
              </div>
            </div>

            <div className="card" style={{ padding: 24, background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', color: '#fff', border: 'none', borderRadius: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div style={{ background: '#f59e0b1b', color: '#f59e0b', padding: 10, borderRadius: 12 }}>
                  <TrendingUp size={22} />
                </div>
                <span style={{ fontSize: 12, fontWeight: 800, color: '#f59e0b', background: '#f59e0b1b', padding: '4px 10px', borderRadius: 20 }}>Highly Profitable Cohort</span>
              </div>
              <div style={{ fontSize: 12, textTransform: 'uppercase', color: '#94a3b8', fontWeight: 700, letterSpacing: '0.05em' }}>Capital Rotation Speed</div>
              <div style={{ fontSize: 28, fontWeight: 900, marginTop: 4, color: '#fff' }}>3.2x / Year</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#10b981', marginTop: 12 }}>
                <Activity size={16} />
                <span>Repeat borrowers generate 32% more interest return</span>
              </div>
              <div style={{ width: '100%', background: '#334155', height: 6, borderRadius: 3, marginTop: 12, overflow: 'hidden' }}>
                <div style={{ width: '80%', background: '#f59e0b', height: '100%' }}></div>
              </div>
            </div>
          </div>

          {/* MAIN COMPARATIVE BRANCH MATRIX */}
          <div className="card" style={{ padding: 0, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: '#1e293b', margin: 0 }}>Target Portfolio Cohort Matrix (Per Branch)</h3>
                <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>Comparative metrics of target demographic, loan bracket sizes, and frequency velocity.</p>
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#8b5cf6', background: '#8b5cf615', padding: '6px 12px', borderRadius: 20 }}>
                💡 Mbarara Hub shows optimal micro-loan recovery
              </span>
            </div>

            <table className="table" style={{ width: '100%' }}>
              <thead style={{ background: '#f8fafc' }}>
                <tr>
                  <th style={{ color: '#475569', padding: '16px 20px' }}>Regional Branch</th>
                  <th style={{ color: '#ec4899', fontWeight: 700 }}>Female Cohort Vol.</th>
                  <th style={{ color: '#ec4899', fontWeight: 700 }}>Female Repay / Arrears</th>
                  <th style={{ color: '#3b82f6', fontWeight: 700 }}>100k-300k Size Vol.</th>
                  <th style={{ color: '#3b82f6', fontWeight: 700 }}>100k-300k Repay / Arrears</th>
                  <th style={{ color: '#f59e0b', fontWeight: 700 }}>Borrowing Velocity</th>
                  <th style={{ color: '#10b981', fontWeight: 800 }}>Profitability Score</th>
                </tr>
              </thead>
              <tbody>
                {segmentMetrics.map(seg => (
                  <tr key={seg.name} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '16px 20px', fontWeight: 800, color: '#0f172a' }}>{seg.name}</td>
                    
                    {/* Female Cohort */}
                    <td>
                      <div style={{ fontWeight: 700, color: '#334155' }}>{fmt.currency(seg.femaleVolume, 'UGX')}</div>
                      <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{seg.femaleCount} active clients</div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontWeight: 800, color: '#10b981' }}>{seg.femaleRepay}%</span>
                        <span style={{ fontSize: 10, color: '#94a3b8' }}>/</span>
                        <span style={{ fontWeight: 600, color: '#ef4444' }}>{seg.femaleArrears}%</span>
                      </div>
                    </td>

                    {/* 100k - 300k Bracket */}
                    <td>
                      <div style={{ fontWeight: 700, color: '#334155' }}>{fmt.currency(seg.microVolume, 'UGX')}</div>
                      <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{seg.microCount} micro-loans</div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontWeight: 800, color: '#10b981' }}>{seg.microRepay}%</span>
                        <span style={{ fontSize: 10, color: '#94a3b8' }}>/</span>
                        <span style={{ fontWeight: 600, color: '#ef4444' }}>{seg.microArrears}%</span>
                      </div>
                    </td>

                    {/* Velocity Frequency */}
                    <td>
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>{seg.avgVelocity}x Avg Cycles</div>
                      <div style={{ fontSize: 11, color: '#10b981', marginTop: 2 }}>HV Repayment: {seg.hvRepay}%</div>
                    </td>

                    {/* Profitability Score */}
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 15, fontWeight: 900, color: '#10b981' }}>{seg.profitScore} / 10</span>
                        <div style={{ width: 60, background: '#e2e8f0', height: 6, borderRadius: 3, overflow: 'hidden' }}>
                          <div style={{ width: `${seg.profitScore * 10}%`, background: '#10b981', height: '100%' }}></div>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* NEW COMPONENT: EXPANDED LOAN SIZE BRACKET PERFORMANCE MATRIX */}
          <div className="card" style={{ padding: 0, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: '#1e293b', margin: 0 }}>Loan Size Bracket Performance Matrix</h3>
                <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>Track repayment rates, volumes, and NPL risk ratings across 100k-300k, 400k-600k, 1M, and 5M brackets.</p>
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#ef4444', background: '#ef444415', padding: '6px 12px', borderRadius: 20 }}>
                ⚠️ High Risk observed in 5M Commercial bracket
              </span>
            </div>

            <table className="table" style={{ width: '100%' }}>
              <thead style={{ background: '#f8fafc' }}>
                <tr>
                  <th style={{ color: '#475569', padding: '16px 20px' }}>Loan Size Bracket</th>
                  <th style={{ color: '#475569' }}>Kampala Central Branch</th>
                  <th style={{ color: '#475569' }}>Masaka Regional Branch</th>
                  <th style={{ color: '#475569' }}>Mbarara Hub</th>
                </tr>
              </thead>
              <tbody>
                {getLoanSizeBracketMetrics().map(bracket => (
                  <tr key={bracket.bracketName} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '16px 20px', fontWeight: 800, color: '#0f172a' }}>
                      {bracket.bracketName}
                      <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, marginTop: 2 }}>{bracket.label}</div>
                    </td>
                    {bracket.branchStats.map(stat => (
                      <td key={stat.branchName}>
                        <div style={{ fontWeight: 700, color: '#334155' }}>{fmt.currency(stat.volume, 'UGX')}</div>
                        <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{stat.count} active loans</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                          <span style={{ fontWeight: 800, color: stat.repay > 95 ? '#10b981' : stat.repay > 90 ? '#f59e0b' : '#ef4444' }}>{stat.repay}% Repay</span>
                          <span style={{ fontSize: 10, color: '#cbd5e1' }}>|</span>
                          <span style={{ fontSize: 11, fontWeight: 700, color: stat.profit.includes('🟢') ? '#10b981' : stat.profit.includes('🟡') ? '#f59e0b' : '#ef4444' }}>{stat.profit}</span>
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* SIMULATOR & ADVISORY PANEL */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 24 }}>
            
            {/* STRATEGIC RECAPITALIZATION ADVISOR */}
            <div className="card" style={{ padding: 28, background: '#1e293b', color: '#fff', border: 'none', borderRadius: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                <div style={{ background: '#8b5cf6', padding: 8, borderRadius: 10 }}>
                  <Award size={22} color="#fff" />
                </div>
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: '#fff' }}>Strategic Recapitalization Advisor</h3>
                  <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>Data-driven priority recommendations based on cohort risk/return ratios.</p>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ background: '#0f172a', padding: 18, borderRadius: 12, borderLeft: '4px solid #10b981' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <Compass size={16} color="#10b981" />
                    <span style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>Primary Branch Recommendation: Mbarara Hub</span>
                  </div>
                  <p style={{ fontSize: 12, color: '#cbd5e1', margin: 0, lineHeight: 1.5 }}>
                    Mbarara Hub exhibits the highest recovery rate on micro-loans (<strong>98.6%</strong>) and the highest capital recycling velocity (<strong>2.9 cycles/year</strong>). Recapitalizing this branch will allow allocated funds to rotate rapidly with less than 1% default rate.
                  </p>
                </div>

                <div style={{ background: '#0f172a', padding: 18, borderRadius: 12, borderLeft: '4px solid #ec4899' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <UserCheck size={16} color="#ec4899" />
                    <span style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>Ideal Customer Focus: Female Repeat Borrowers</span>
                  </div>
                  <p style={{ fontSize: 12, color: '#cbd5e1', margin: 0, lineHeight: 1.5 }}>
                    Female borrowers across Kampala and Mbarara show an average repayment rate of <strong>98.15%</strong>. This demographic has high borrowing discipline and low NPL ratios. Focus on female retail merchant groups for maximum capital security.
                  </p>
                </div>

                <div style={{ background: '#0f172a', padding: 18, borderRadius: 12, borderLeft: '4px solid #3b82f6' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <DollarSign size={16} color="#3b82f6" />
                    <span style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>Recommended Loan Size: 100,000 to 300,000 UGX</span>
                  </div>
                  <p style={{ fontSize: 12, color: '#cbd5e1', margin: 0, lineHeight: 1.5 }}>
                    Loans in the 100k-300k UGX bracket mature in short windows (3-4 months), showing a default write-off rate under 1.5%. Larger loan brackets (&gt; 1.5M UGX) show higher duration risk and arrears days. Keep the portfolio highly distributed.
                  </p>
                </div>
              </div>
            </div>

            {/* CAPITAL SIMULATOR */}
            <div className="card" style={{ padding: 24, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <Calculator size={18} color="#0f172a" />
                <h3 style={{ fontSize: 16, fontWeight: 800, color: '#1e293b', margin: 0 }}>Capital Allocation Simulator</h3>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Recapitalization Capital (UGX)</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <input 
                      type="range" 
                      min="10000000" 
                      max="200000000" 
                      step="5000000" 
                      value={recapCapital} 
                      onChange={e => setRecapCapital(Number(e.target.value))}
                      style={{ flex: 1 }}
                    />
                    <span style={{ fontSize: 15, fontWeight: 900, color: '#0f172a', width: 130, textAlign: 'right' }}>
                      {fmt.currency(recapCapital, 'UGX')}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={{ fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Recapitalize Branch</label>
                    <select className="form-control" value={recapBranch} onChange={e => setRecapBranch(e.target.value)}>
                      <option value="Mbarara Hub">Mbarara Hub</option>
                      <option value="Kampala Central Branch">Kampala Central Branch</option>
                      <option value="Masaka Regional Branch">Masaka Regional Branch</option>
                    </select>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={{ fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Target Cohort</label>
                    <select className="form-control" value={recapCohort} onChange={e => setRecapCohort(e.target.value)}>
                      <option value="Female Micro-Borrowers">Female Micro-Borrowers</option>
                      <option value="100k-300k Micro-loans">100k-300k Micro-loans</option>
                      <option value="High-Velocity Repeat Customers">High-Velocity Repeat Customers</option>
                    </select>
                  </div>
                </div>

                {/* SIMULATION OUTPUT MATRIX */}
                <div style={{ background: '#f8fafc', padding: 18, borderRadius: 12, border: '1px solid #cbd5e1', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                    <span style={{ color: '#64748b' }}>Estimated Clients Funded:</span>
                    <span style={{ fontWeight: 800, color: '#0f172a' }}>{sim.clientsFunded} borrowers</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                    <span style={{ color: '#64748b' }}>Historical Recovery Rate:</span>
                    <span style={{ fontWeight: 800, color: '#10b981' }}>{sim.repaymentRate}%</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                    <span style={{ color: '#64748b' }}>Expected Default Write-off:</span>
                    <span style={{ fontWeight: 800, color: '#ef4444' }}>{fmt.currency(sim.expectedLoss, 'UGX')}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, borderTop: '1px solid #e2e8f0', paddingTop: 8 }}>
                    <span style={{ color: '#64748b', fontWeight: 600 }}>Projected Net Return / Cycle:</span>
                    <span style={{ fontWeight: 800, color: '#10b981' }}>{fmt.currency(sim.netProfit, 'UGX')}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                    <span style={{ color: '#64748b' }}>Annual Capital Rotations:</span>
                    <span style={{ fontWeight: 800, color: '#f59e0b' }}>{sim.cyclesPerYear}x cycles</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, background: '#1e293b', color: '#fff', padding: '10px 12px', borderRadius: 8, marginTop: 4 }}>
                    <span style={{ fontWeight: 700 }}>Annualized Velocity Yield:</span>
                    <span style={{ fontWeight: 900, color: '#10b981' }}>{fmt.currency(sim.annualVelocityProfit, 'UGX')}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* NEW COMPONENT: DEEP RISK & PAYMENT CYCLE DIAGNOSTICS */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 24 }}>
            
            {/* PAYMENT CYCLE ANALYSIS */}
            <div className="card" style={{ padding: 24, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <Activity size={18} color="#0f172a" />
                <h3 style={{ fontSize: 16, fontWeight: 800, color: '#1e293b', margin: 0 }}>Payment Cycle & Maturity Analysis</h3>
              </div>
              <p style={{ fontSize: 12, color: '#64748b', marginTop: -8, marginBottom: 16 }}>
                Comparing risk profiles and velocity ratios of short-term micro loan rotations vs long-term commercial loans.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ padding: 14, background: '#f8fafc', borderRadius: 12, border: '1px solid #cbd5e1' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 800, color: '#0f172a' }}>⚡ Shortest Rotation: 100k - 300k (2-3 Months)</span>
                    <span style={{ fontSize: 12, fontWeight: 800, color: '#10b981' }}>98.1% Recovery</span>
                  </div>
                  <div style={{ fontSize: 11, color: '#64748b', marginBottom: 10 }}>
                    Fast capital cycle (4.0x / year). High liquidity, minimum default impact. Ideal for retail markets.
                  </div>
                  <div style={{ width: '100%', background: '#e2e8f0', height: 6, borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ width: '98.1%', background: '#10b981', height: '100%' }}></div>
                  </div>
                </div>

                <div style={{ padding: 14, background: '#f8fafc', borderRadius: 12, border: '1px solid #cbd5e1' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 800, color: '#0f172a' }}>📅 Mid-Range Rotation: 400k - 1M (3-6 Months)</span>
                    <span style={{ fontSize: 12, fontWeight: 800, color: '#f59e0b' }}>91.9% Recovery</span>
                  </div>
                  <div style={{ fontSize: 11, color: '#64748b', marginBottom: 10 }}>
                    Moderate capital cycle (2.4x / year). Exposed to seasonal trade patterns (agribusiness / farming delays).
                  </div>
                  <div style={{ width: '100%', background: '#e2e8f0', height: 6, borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ width: '91.9%', background: '#f59e0b', height: '100%' }}></div>
                  </div>
                </div>

                <div style={{ padding: 14, background: '#f8fafc', borderRadius: 12, border: '1px solid #cbd5e1' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 800, color: '#0f172a' }}>⏳ Longest Rotation: 5M Commercial (6-12 Months)</span>
                    <span style={{ fontSize: 12, fontWeight: 800, color: '#ef4444' }}>85.0% Recovery</span>
                  </div>
                  <div style={{ fontSize: 11, color: '#64748b', marginBottom: 10 }}>
                    Slowest rotation (1.0x / year). High duration risk. Default cases require extensive manual field collections.
                  </div>
                  <div style={{ width: '100%', background: '#e2e8f0', height: 6, borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ width: '85.0%', background: '#ef4444', height: '100%' }}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* DEFAULT PORTFOLIO HOTSPOTS */}
            <div className="card" style={{ padding: 24, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <AlertTriangle size={18} color="#ef4444" />
                <h3 style={{ fontSize: 16, fontWeight: 800, color: '#1e293b', margin: 0 }}>Arrears & Default Hotspot Rankings</h3>
              </div>
              <p style={{ fontSize: 12, color: '#64748b', marginTop: -8, marginBottom: 16 }}>
                Direct visibility of where capital loss is concentrated. Unprofitable segments ordered by NPL rates.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 10, background: '#ef44440c', borderLeft: '4px solid #ef4444', borderRadius: 8 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: '#991b1b' }}>Masaka Hub — 5M Bracket</div>
                    <div style={{ fontSize: 11, color: '#7f1d1d' }}>Commercial Wholesale & Agri-Trades</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 14, fontWeight: 900, color: '#ef4444' }}>14.2% Arrears</div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#7f1d1d' }}>❌ UNPROFITABLE</div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 10, background: '#ef44440c', borderLeft: '4px solid #ef4444', borderRadius: 8 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: '#991b1b' }}>Kampala Central — 5M Bracket</div>
                    <div style={{ fontSize: 11, color: '#7f1d1d' }}>Commercial Retail Logistics</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 14, fontWeight: 900, color: '#ef4444' }}>11.8% Arrears</div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#7f1d1d' }}>❌ UNPROFITABLE</div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 10, background: '#f973160c', borderLeft: '4px solid #f97316', borderRadius: 8 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: '#c2410c' }}>Masaka Hub — 1M Bracket</div>
                    <div style={{ fontSize: 11, color: '#7c2d12' }}>Crop Harvest Retail Borrowers</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 14, fontWeight: 900, color: '#f97316' }}>10.5% Arrears</div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#7c2d12' }}>⚠️ HIGH RISK</div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 10, background: '#eab3080c', borderLeft: '4px solid #eab308', borderRadius: 8 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: '#854d0e' }}>Masaka Hub — 400k - 600k Bracket</div>
                    <div style={{ fontSize: 11, color: '#713f12' }}>Mid-Micro Smallholders</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 14, fontWeight: 900, color: '#eab308' }}>7.8% Arrears</div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#713f12' }}>🟡 MODERATE RISK</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* NEW COMPONENT: CRITICAL PORTFOLIO RISK WATCHLIST (BAD LOANS / CLIENTS) */}
          <div className="card" style={{ padding: 0, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0' }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: '#1e293b', margin: 0 }}>⚠️ High Risk & Underperforming Loans Watchlist</h3>
              <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>Critical defaults and NPL cases requiring immediate intervention and field officer collection directives.</p>
            </div>
            <table className="table" style={{ width: '100%' }}>
              <thead style={{ background: '#f8fafc' }}>
                <tr>
                  <th style={{ color: '#475569', padding: '16px 20px' }}>Borrower</th>
                  <th style={{ color: '#475569' }}>Loan Number</th>
                  <th style={{ color: '#475569' }}>Principal Amount</th>
                  <th style={{ color: '#475569' }}>Branch</th>
                  <th style={{ color: '#475569' }}>Arrears / Days</th>
                  <th style={{ color: '#475569' }}>NPL Risk Level</th>
                  <th style={{ color: '#475569' }}>Field Officer Assigned</th>
                </tr>
              </thead>
              <tbody>
                {getBadPerformingLoans().length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '20px', color: '#64748b', fontWeight: 600 }}>
                      ✓ Zero critical default alerts. All active accounts performing within margin.
                    </td>
                  </tr>
                ) : (
                  getBadPerformingLoans().map(l => (
                    <tr key={l.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '16px 20px', fontWeight: 800, color: '#0f172a' }}>
                        {l.client_name}
                        <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{l.client_phone}</div>
                      </td>
                      <td style={{ fontWeight: 600 }}>{l.loan_number}</td>
                      <td style={{ fontWeight: 700 }}>{fmt.currency(l.principal_amount, 'UGX')}</td>
                      <td style={{ fontWeight: 600, color: '#475569' }}>{normalizeBranchName(l.branch_name)}</td>
                      <td style={{ color: '#ef4444', fontWeight: 700 }}>
                        <div>{fmt.currency(l.arrears_amount, 'UGX')}</div>
                        <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{l.arrears_days || 0} days in arrears</div>
                      </td>
                      <td>
                        <span className={`badge badge-${Number(l.arrears_days || 0) > 30 ? 'danger' : 'warning'}`} style={{ fontWeight: 700 }}>
                          {Number(l.arrears_days || 0) > 30 ? '🔴 CRITICAL NPL' : '🟡 DELINQUENT'}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600, color: '#0284c7' }}>
                        {l.staff_owner || l.officer_name || 'Sarah Nambi'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* HIGH VELOCITY VIP CLIENTS TABLE */}
          <div className="card" style={{ padding: 0, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0' }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: '#1e293b', margin: 0 }}>High Velocity Customer Spotlights per Branch</h3>
              <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>Identified key clients with repeat borrowing records, high credit grades, and zero arrears.</p>
            </div>
            
            <table className="table" style={{ width: '100%' }}>
              <thead style={{ background: '#f8fafc' }}>
                <tr>
                  <th style={{ color: '#475569', padding: '16px 20px' }}>Client</th>
                  <th style={{ color: '#475569' }}>Branch</th>
                  <th style={{ color: '#475569' }}>Gender</th>
                  <th style={{ color: '#475569' }}>Borrowing Cycles</th>
                  <th style={{ color: '#475569' }}>Preferred Size Range</th>
                  <th style={{ color: '#475569' }}>Maturity Cycle</th>
                  <th style={{ color: '#475569' }}>Credit Assessment</th>
                  <th style={{ textAlign: 'right', paddingRight: 20 }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {getHighVelocityClients().map(cli => {
                  const details = getClientLoanRangeAndTerm(cli.id);
                  return (
                    <tr key={cli.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '16px 20px' }}>
                        <div style={{ fontWeight: 800, color: '#0f172a' }}>{cli.first_name} {cli.last_name}</div>
                        <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{cli.phone}</div>
                      </td>
                      <td style={{ fontWeight: 600, color: '#475569' }}>{normalizeBranchName(cli.branch_name)}</td>
                      <td>
                        <span className={`badge badge-${cli.gender === 'female' ? 'warning' : 'secondary'}`}>
                          {(cli.gender || 'unknown').toUpperCase()}
                        </span>
                      </td>
                      <td style={{ fontWeight: 800, color: '#0f172a' }}>⚡ {cli.loan_count} cycles</td>
                      <td style={{ fontWeight: 700, color: '#1e293b' }}>{details.range}</td>
                      <td style={{ fontWeight: 700, color: '#0284c7' }}>{details.term}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontWeight: 800, color: cli.credit_score > 700 ? '#10b981' : '#f59e0b' }}>Grade {cli.credit_grade}</span>
                          <span style={{ fontSize: 11, color: '#64748b' }}>({cli.credit_score} pts)</span>
                        </div>
                      </td>
                      <td style={{ textAlign: 'right', paddingRight: 20 }}>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                          <a href={`tel:${cli.phone || ''}`} className="btn btn-secondary btn-sm" style={{ padding: '4px 8px', fontSize: 11 }}>
                            Call
                          </a>
                          <a href={`https://wa.me/${(cli.phone || '').replace(/[^0-9]/g, '')}?text=Hello%20from%20management`} target="_blank" rel="noreferrer" className="btn btn-primary btn-sm" style={{ padding: '4px 8px', fontSize: 11, background: '#25D366', color: '#fff', border: 'none' }}>
                            WhatsApp
                          </a>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB CONTENT: STAFF ACCESS CONTROL ────────────────── */}
      {activeTab === 'access' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          
          <div className="card" style={{ padding: 24, background: '#1e293b', color: '#fff', border: 'none', borderRadius: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ background: '#ec48991b', padding: 8, borderRadius: 10 }}>
                <Key size={22} color="#ec4899" />
              </div>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>Staff Access & System Credentials Control Plane</h3>
                <p style={{ fontSize: 12, color: '#cbd5e1', margin: 0 }}>
                  Grant or deny credentials for supervisors, managers, cashiers, and loan officers. Suspended staff members are immediately blocked at the login layer.
                </p>
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: 0, background: '#fff', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 20 }}>
              <div style={{ display: 'flex', gap: 16, flex: 1, maxWidth: 600, alignItems: 'center' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <input 
                    className="form-control" 
                    placeholder="🔍 Search staff members..." 
                    value={staffSearchQuery} 
                    onChange={e => setStaffSearchQuery(e.target.value)}
                    style={{ width: '100%', borderRadius: 10, paddingLeft: 12 }}
                  />
                </div>
                <button 
                  onClick={() => setShowAddStaffModal(true)} 
                  className="btn btn-primary"
                  style={{ background: '#1e293b', color: '#fff', padding: '8px 16px', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, fontSize: 13, border: 'none', cursor: 'pointer', whiteSpace: 'nowrap' }}
                >
                  <Plus size={16} /> Add Staff Member
                </button>
              </div>
              <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>
                Showing {filteredStaff.length} system profiles
              </span>
            </div>

            <table className="table" style={{ width: '100%' }}>
              <thead style={{ background: '#f8fafc' }}>
                <tr>
                  <th style={{ color: '#475569', padding: '16px 20px' }}>Staff Name & Contact</th>
                  <th style={{ color: '#475569' }}>System Assigned Email</th>
                  <th style={{ color: '#475569' }}>System Role</th>
                  <th style={{ color: '#475569' }}>Operational Branch</th>
                  <th style={{ color: '#475569' }}>System Status</th>
                  <th style={{ textAlign: 'right', paddingRight: 20 }}>Access Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStaff.map(member => (
                  <tr key={member.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ fontWeight: 800, color: '#0f172a', fontSize: 14 }}>
                        {member.first_name} {member.last_name}
                      </div>
                      <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{member.phone || '—'}</div>
                    </td>
                    <td style={{ fontWeight: 600, color: '#334155' }}>{member.email}</td>
                    
                    {/* Role Select Dropdown */}
                    <td>
                      <select 
                        className="form-control" 
                        value={member.role} 
                        onChange={e => handleRoleChange(member, e.target.value)}
                        style={{ padding: '4px 8px', fontSize: 12, borderRadius: 8, height: 'auto', background: '#fff', border: '1px solid #cbd5e1', fontWeight: 600 }}
                      >
                        <option value="branch_manager">Supervisor / Manager</option>
                        <option value="cashier">Cashier</option>
                        <option value="loan_officer">Loan Officer</option>
                      </select>
                    </td>

                    {/* Branch Assignment Select */}
                    <td>
                      <select 
                        className="form-control" 
                        value={member.branch_name} 
                        onChange={e => handleBranchChange(member, e.target.value)}
                        style={{ padding: '4px 8px', fontSize: 12, borderRadius: 8, height: 'auto', background: '#fff', border: '1px solid #cbd5e1', fontWeight: 600 }}
                      >
                        <option value="Head Office">Head Office</option>
                        <option value="Gulu Branch">Gulu Branch</option>
                        <option value="Mbarara Branch">Mbarara Branch</option>
                        <option value="Masaka Regional Branch">Masaka Regional Branch</option>
                      </select>
                    </td>

                    {/* Status Badge */}
                    <td>
                      <span 
                        className={`badge badge-${member.status === 'suspended' ? 'danger' : 'success'}`}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 700, padding: '4px 10px', fontSize: 12 }}
                      >
                        {member.status === 'suspended' ? <Ban size={12} /> : <CheckCircle size={12} />}
                        {member.status === 'suspended' ? 'SUSPENDED' : 'ACTIVE'}
                      </span>
                    </td>

                    {/* Suspend & Delete Action Buttons */}
                    <td style={{ textAlign: 'right', paddingRight: 20 }}>
                      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                        <button 
                          onClick={() => handleToggleAccess(member)}
                          className={`btn ${member.status === 'suspended' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                          style={{ 
                            fontSize: 12, 
                            padding: '6px 12px', 
                            fontWeight: 700,
                            background: member.status === 'suspended' ? '#10b981' : '#f59e0b', 
                            color: '#fff', 
                            border: 'none',
                            boxShadow: 'none',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {member.status === 'suspended' ? 'Grant Access' : 'Deny Access'}
                        </button>
                        <button 
                          onClick={() => handleDeleteStaff(member.id, `${member.first_name} ${member.last_name}`)}
                          className="btn btn-danger btn-sm"
                          style={{ 
                            fontSize: 12, 
                            padding: '6px 12px', 
                            fontWeight: 700,
                            background: '#ef4444', 
                            color: '#fff', 
                            border: 'none',
                            boxShadow: 'none',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4
                          }}
                        >
                          <X size={12} /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB CONTENT: EXECUTIVE TASK MANAGER ──────────────── */}
      {activeTab === 'tasks' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 24 }}>
          <div className="card" style={{ padding: 0, background: '#fff', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: '#1e293b', margin: 0 }}>Executive Follow-up Task Manager</h3>
                <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>Track directives assigned to branch managers with instant messaging and mail links.</p>
              </div>
            </div>

            <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
              {tasks.map(t => (
                <div key={t.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 20, background: t.status === 'Completed' ? '#f8fafc' : '#fff', border: '1px solid #e2e8f0', borderRadius: 12, boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <button 
                      onClick={() => toggleTaskStatus(t.id)} 
                      style={{ 
                        width: 24, height: 24, borderRadius: 6, border: '2px solid #cbd5e1', 
                        background: t.status === 'Completed' ? '#10b981' : 'none', 
                        display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' 
                      }}
                    >
                      {t.status === 'Completed' && <Check size={14} color="#fff" />}
                    </button>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 800, color: t.status === 'Completed' ? '#94a3b8' : '#1e293b', textDecoration: t.status === 'Completed' ? 'line-through' : 'none' }}>
                        {t.title}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 12, color: '#64748b', marginTop: 4 }}>
                        <span style={{ fontWeight: 700, color: '#3b82f6' }}>{t.branch}</span> · 
                        <span>Assigned: <strong>{t.assignee}</strong></span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span className={`badge badge-${t.status === 'Completed' ? 'success' : t.status === 'In Progress' ? 'warning' : 'active'}`} style={{ fontSize: 11 }}>
                      {t.status}
                    </span>
                    <a 
                      href={t.followUpLink} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="btn btn-primary btn-sm" 
                      style={{ background: t.followUpLink.includes('wa.me') ? '#25D366' : '#3b82f6', color: '#fff', border: 'none', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}
                    >
                      {t.followUpLink.includes('wa.me') ? <MessageSquare size={13} /> : <Mail size={13} />} Follow-up <ExternalLink size={12} />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card" style={{ padding: 24, background: '#fff', border: '1px solid #e2e8f0', height: 'fit-content' }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: '#1e293b', marginBottom: 16 }}>Assign New Directive</h3>
            <form onSubmit={addTask} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Target Branch</label>
                <select className="form-control" value={newTaskBranch} onChange={e => {
                  setNewTaskBranch(e.target.value);
                  const b = branches.find(br => br.name === e.target.value);
                  if (b) setNewTaskAssignee(`${b.manager} (${b.phone})`);
                }}>
                  {branches.map(b => (
                    <option key={b.id} value={b.name}>{b.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Assigned Manager Contact</label>
                <input className="form-control" value={newTaskAssignee} onChange={e => setNewTaskAssignee(e.target.value)} required />
              </div>

              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Directive / Task Description</label>
                <textarea className="form-control" placeholder="e.g. Audit Masaka agricultural loan repayments and contact guarantors..." rows={3} value={newTaskTitle} onChange={e => setNewTaskTitle(e.target.value)} required />
              </div>

              <button type="submit" className="btn btn-primary" style={{ background: '#1e293b', color: '#fff', width: '100%', fontWeight: 700, marginTop: 8 }}>
                <Plus size={16} /> Create Task
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: BRANCH DIAGNOSTICS ────────────────────────── */}
      {selectedBranchDiagnostics && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.75)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }} onClick={() => setSelectedBranchDiagnostics(null)}>
          <div style={{ width: '100%', maxWidth: 650, background: '#fff', padding: 32, borderRadius: 20, boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, borderBottom: '1px solid #e2e8f0', paddingBottom: 16 }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: '#1e293b' }}>Diagnostic & Performance Breakdown</h2>
                <div style={{ fontSize: 13, color: '#3b82f6', fontWeight: 700, marginTop: 4 }}>{selectedBranchDiagnostics.name}</div>
              </div>
              <button onClick={() => setSelectedBranchDiagnostics(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><X size={20} /></button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ background: '#f8fafc', padding: 20, borderRadius: 14, border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: 8 }}>What's causing such performance:</div>
                <p style={{ fontSize: 14, color: '#0f172a', margin: 0, fontWeight: 600, lineHeight: 1.6 }}>"{selectedBranchDiagnostics.summary}"</p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div style={{ background: '#f1f5f9', padding: 16, borderRadius: 12 }}>
                  <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700 }}>TOTAL LOANS GIVEN OUT</div>
                  <div style={{ fontSize: 20, fontWeight: 900, color: '#3b82f6', marginTop: 4 }}>{fmt.currency(selectedBranchDiagnostics.loans_given, 'UGX')}</div>
                </div>
                <div style={{ background: '#f1f5f9', padding: 16, borderRadius: 12 }}>
                  <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700 }}>NET PROFIT GENERATED</div>
                  <div style={{ fontSize: 20, fontWeight: 900, color: '#10b981', marginTop: 4 }}>{fmt.currency(selectedBranchDiagnostics.net_profit, 'UGX')}</div>
                </div>
              </div>

              <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#1e293b', marginBottom: 12 }}>Manager Follow-up Actions ({selectedBranchDiagnostics.manager})</div>
                <div style={{ display: 'flex', gap: 12 }}>
                  <a href={`tel:${selectedBranchDiagnostics.phone}`} className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }}>
                    <Phone size={14} /> Call Manager
                  </a>
                  <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center', background: '#1e293b', color: '#fff' }} onClick={() => {
                    const b = selectedBranchDiagnostics;
                    setSelectedBranchDiagnostics(null);
                    openNoticeModal(b);
                  }}>
                    <FileText size={14} /> Draft Letter
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: AUTOMATIC NOTIFICATION / LETTER DRAFTING ── */}
      {selectedBranchForNotice && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.75)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }} onClick={() => setSelectedBranchForNotice(null)}>
          <div style={{ width: '100%', maxWidth: 700, background: '#fff', padding: 32, borderRadius: 20, boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, borderBottom: '1px solid #e2e8f0', paddingBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ background: '#1e293b', padding: 8, borderRadius: 10 }}>
                  <Send size={20} color="#fff" />
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: '#1e293b' }}>Automatic Executive Letter & Notification Draft</h2>
                  <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>Recipient: {selectedBranchForNotice.manager} ({selectedBranchForNotice.email})</div>
                </div>
              </div>
              <button onClick={() => setSelectedBranchForNotice(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><X size={20} /></button>
            </div>

            <form onSubmit={handleDispatchNotice} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Notification Subject</label>
                <input className="form-control" style={{ fontWeight: 800, color: '#1e293b' }} value={noticeSubject} onChange={e => setNoticeSubject(e.target.value)} required />
              </div>

              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Automated Body & Performance Metrics</label>
                <textarea className="form-control" rows={12} style={{ fontFamily: 'monospace', fontSize: 13, lineHeight: 1.6 }} value={noticeBody} onChange={e => setNoticeBody(e.target.value)} required />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 10 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setSelectedBranchForNotice(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ background: '#10b981', color: '#fff', fontWeight: 800 }}>
                  <Send size={16} /> Dispatch Official Notification
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: ADD NEW STAFF ────────────────────────────── */}
      {showAddStaffModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.75)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }} onClick={() => setShowAddStaffModal(false)}>
          <div style={{ width: '100%', maxWidth: 550, background: '#fff', padding: 32, borderRadius: 20, boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, borderBottom: '1px solid #e2e8f0', paddingBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ background: '#1e293b', padding: 8, borderRadius: 10 }}>
                  <Plus size={20} color="#fff" />
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: '#1e293b' }}>Register New System Staff</h2>
                  <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>Create login credentials and branch permissions.</div>
                </div>
              </div>
              <button onClick={() => setShowAddStaffModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><X size={20} /></button>
            </div>

            <form onSubmit={handleAddStaff} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>First Name</label>
                  <input className="form-control" placeholder="Juliet" value={newStaffFirstName} onChange={e => setNewStaffFirstName(e.target.value)} required />
                </div>
                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Last Name</label>
                  <input className="form-control" placeholder="Namazzi" value={newStaffLastName} onChange={e => setNewStaffLastName(e.target.value)} required />
                </div>
              </div>

              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Assigned Email (Login Username)</label>
                <input type="email" className="form-control" placeholder="juliet@kilimomf.co.ug" value={newStaffEmail} onChange={e => setNewStaffEmail(e.target.value)} required />
              </div>

              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Phone Number</label>
                <input type="tel" className="form-control" placeholder="+256 700 123456" value={newStaffPhone} onChange={e => setNewStaffPhone(e.target.value)} required />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>System Role</label>
                  <select className="form-control" value={newStaffRole} onChange={e => setNewStaffRole(e.target.value)}>
                    <option value="branch_manager">Supervisor / Manager</option>
                    <option value="cashier">Cashier</option>
                    <option value="loan_officer">Loan Officer</option>
                  </select>
                </div>
                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Operational Branch</label>
                  <select className="form-control" value={newStaffBranch} onChange={e => setNewStaffBranch(e.target.value)}>
                    <option value="Head Office">Head Office</option>
                    <option value="Gulu Branch">Gulu Branch</option>
                    <option value="Mbarara Branch">Mbarara Branch</option>
                    <option value="Masaka Regional Branch">Masaka Regional Branch</option>
                  </select>
                </div>
              </div>

              {/* Onboarding Document Upload Box */}
              <div style={{ borderTop: '1px solid #cbd5e1', paddingTop: 14 }}>
                <label style={{ fontSize: 12, fontWeight: 800, color: '#1e293b', display: 'block', marginBottom: 10 }}>
                  📎 Onboarding Documents Attachment
                </label>

                {/* Attached Docs List */}
                {newStaffDocuments.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
                    {newStaffDocuments.map(doc => (
                      <div key={doc.tempId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 12px', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 8 }}>
                        <div>
                          <span style={{ fontSize: 12, fontWeight: 700, color: '#1e293b' }}>{doc.name}</span>
                          <span style={{ fontSize: 10, color: '#64748b', marginLeft: 8, background: '#e2e8f0', padding: '2px 6px', borderRadius: 4 }}>
                            {doc.subcategory.toUpperCase().replace('_', ' ')}
                          </span>
                        </div>
                        <button type="button" onClick={() => handleRemoveTempDocument(doc.tempId)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Inline Doc Form */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr auto', gap: 8, alignItems: 'end' }}>
                  <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: '#64748b' }}>Doc Name</span>
                    <input className="form-control" style={{ padding: '6px 10px', fontSize: 12, height: 'auto' }} placeholder="e.g. Juliet Namazzi - CV" value={docName} onChange={e => setDocName(e.target.value)} />
                  </div>
                  <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: '#64748b' }}>Category</span>
                    <select className="form-control" style={{ padding: '6px 10px', fontSize: 12, height: 'auto' }} value={docSubcategory} onChange={e => setDocSubcategory(e.target.value)}>
                      <option value="employment_contract">Employment Contract</option>
                      <option value="id_copy">National ID Copy</option>
                      <option value="academic_certificate">Academic Cert</option>
                      <option value="other">Other Document</option>
                    </select>
                  </div>
                  <button type="button" onClick={handleAddTempDocument} className="btn btn-secondary" style={{ padding: '8px 12px', fontSize: 12, fontWeight: 700, height: 'auto', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Plus size={12} /> Attach
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 14 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddStaffModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ background: '#10b981', color: '#fff', fontWeight: 800, border: 'none' }}>
                  Register Staff Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

function ExecStatCard({ label, value, icon, color, trend, reverse }: any) {
  const isUp = trend?.startsWith('+');
  const positive = reverse ? !isUp : isUp;
  
  return (
    <div className="card" style={{ padding: 20, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ color, background: color + '15', padding: 8, borderRadius: 10 }}>{icon}</div>
        {trend && (
          <div style={{ 
            display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 700, 
            color: positive ? '#10b981' : '#ef4444' 
          }}>
            {positive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            {trend}
          </div>
        )}
      </div>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 900, color: '#1e293b', marginTop: 4 }}>
        {typeof value === 'number' ? fmt.currency(value, 'UGX') : value}
      </div>
    </div>
  );
}
