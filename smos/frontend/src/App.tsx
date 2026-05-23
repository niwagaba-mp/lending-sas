import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './store/AppContext';
import AppLayout from './components/layout/AppLayout';
import LoginPage from './pages/auth/LoginPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import StaffPage from './pages/staff/StaffPage';
import ClientsPage from './pages/clients/ClientsPage';
import ClientMapPage from './pages/clients/ClientMapPage';
import LoansPage from './pages/loans/LoansPage';
import NotebookPage from './pages/loans/NotebookPage';
import ExpensesPage from './pages/expenses/ExpensesPage';
import LegalPage from './pages/legal/LegalPage';
import BranchesPage from './pages/branches/BranchesPage';

import CashierDashboard from './pages/cashier/CashierDashboard';
import CashierWorkstation from './pages/cashier/CashierWorkstation';
import ClientCRMPage from './pages/cashier/ClientCRMPage';
import ReportsPage from './pages/reports/ReportsPage';
import TransactionsHistory from './pages/reports/TransactionsHistory';
import ArrearsModule from './pages/loans/ArrearsModule';
import CreditScorePage from './pages/loans/CreditScorePage';
import AdminHub from './pages/admin/AdminHub';
import StaffPerformanceAppraisal from './pages/admin/StaffPerformanceAppraisal';
import AdminFinancialConsole from './pages/admin/AdminFinancialConsole';
import PortfolioLifecycleHub from './pages/admin/PortfolioLifecycleHub';
import PeriodicReportingHub from './pages/admin/PeriodicReportingHub';
import SuperAdminHub from './pages/admin/SuperAdminHub';
import ExecutiveBusinessConsole from './pages/admin/ExecutiveBusinessConsole';
import ExportPage from './pages/admin/ExportPage';
import NotificationsPage from './pages/notifications/NotificationsPage';



const HomeRedirect = () => {
  const { state } = useApp();
  // Don't redirect while loading — wait for auth to resolve
  if (state.loading) return null;
  if (state.user?.role === 'cashier') return <Navigate to="/cashier" replace />;
  if (state.user?.role === 'admin' || state.user?.role === 'branch_manager') return <Navigate to="/admin" replace />;
  return <Navigate to="/dashboard" replace />;
};

// Full-screen loading spinner shown while auth state resolves
const AppLoader = () => {
  const { state } = useApp();

  if (state.loading) {
    return (
      <div style={{
        display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center',
        background: '#0d1117', flexDirection: 'column', gap: 16,
      }}>
        <div style={{ fontSize: 40 }}>⚡</div>
        <div style={{ color: '#94a3b8', fontSize: 14, fontWeight: 600, letterSpacing: '0.1em' }}>
          LOADING SMOS...
        </div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<LoginPage />} />

      {/* Cashier Workstation — completely standalone, no sidebar/admin layout */}
      <Route path="/cashier" element={<CashierWorkstation />} />

      {/* Admin / Manager portal with full sidebar layout */}
      <Route element={<AppLayout />}>
        <Route path="/" element={<HomeRedirect />} />
        <Route path="/admin" element={<AdminHub />} />
        <Route path="/admin/appraisals" element={<StaffPerformanceAppraisal />} />
        <Route path="/admin/auditor" element={<AdminFinancialConsole />} />
        <Route path="/admin/portfolio" element={<PortfolioLifecycleHub />} />
        <Route path="/admin/reports" element={<PeriodicReportingHub />} />
        <Route path="/admin/export" element={<ExportPage />} />
        <Route path="/superadmin" element={<SuperAdminHub />} />
        <Route path="/executive/console" element={<ExecutiveBusinessConsole />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/staff" element={<StaffPage />} />
        <Route path="/clients" element={<ClientsPage />} />
        <Route path="/clients/crm" element={<ClientCRMPage />} />
        <Route path="/clients/map" element={<ClientMapPage />} />
        <Route path="/loans" element={<LoansPage />} />
        <Route path="/loans/arrears" element={<ArrearsModule />} />
        <Route path="/notebook" element={<NotebookPage />} />
        <Route path="/cashier-admin" element={<CashierDashboard />} />
        <Route path="/repayments" element={<TransactionsHistory />} />
        <Route path="/credit" element={<CreditScorePage />} />
        <Route path="/expenses" element={<ExpensesPage />} />
        <Route path="/legal" element={<LegalPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/audit" element={<TransactionsHistory />} />
        <Route path="/branches" element={<BranchesPage />} />
      </Route>
    </Routes>
  );
};

export default function App() {
  return (
    // BrowserRouter MUST be at the absolute top level — never inside a
    // conditionally-rendered component. React Router v7 + React 19 crash
    // ("Illegal constructor") when History is mounted/unmounted mid-tree.
    <BrowserRouter>
      <AppProvider>
        <AppLoader />
      </AppProvider>
    </BrowserRouter>
  );
}
