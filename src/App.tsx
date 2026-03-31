import { useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import ErrorBoundary from './components/ErrorBoundary';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import ClientDetail from './pages/ClientDetail';
import Contracts from './pages/Contracts';
import Accounts from './pages/Accounts';
import Tasks from './pages/Tasks';
import Knowledge from './pages/Knowledge';
import Checklists from './pages/Checklists';
import Tools from './pages/Tools';
import Communications from './pages/Communications';
import QuickReplies from './pages/QuickReplies';
import AIReply from './pages/AIReply';
import Goals from './pages/Goals';
import Login from './pages/Login';
import UserManagement from './pages/UserManagement';
import ErrorLog from './pages/ErrorLog';
import useAuthStore from './stores/useAuthStore';
import useStore from './stores/useStore';
import useReminderStore from './stores/useReminderStore';

// Initializes Supabase auth listener + loads all data on login
function AppLoader({ children }: { children: React.ReactNode }) {
  const authInitialized = useAuthStore(s => s.initialized);
  const session = useAuthStore(s => s.session);
  const initialize = useAuthStore(s => s.initialize);
  const dataInitialized = useStore(s => s.initialized);
  const fetchAll = useStore(s => s.fetchAll);
  const fetchReminders = useReminderStore(s => s.fetchReminders);
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    initialize().then(cleanup => {
      cleanupRef.current = cleanup;
    });
    return () => cleanupRef.current?.();
  }, [initialize]);

  useEffect(() => {
    if (session) {
      fetchAll();
      fetchReminders();
    }
  }, [session, fetchAll, fetchReminders]);

  // Wait for auth to initialize
  if (!authInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--surface-0, #f8fafc)' }}>
        <div className="text-sm" style={{ color: 'var(--text-tertiary, #94a3b8)' }}>Loading...</div>
      </div>
    );
  }

  // If logged in, also wait for data before rendering any page
  if (session && !dataInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--surface-0, #f8fafc)' }}>
        <div className="text-sm" style={{ color: 'var(--text-tertiary, #94a3b8)' }}>Loading...</div>
      </div>
    );
  }

  return <>{children}</>;
}

function AuthGuard({ children }: { children: React.ReactNode }) {
  const profile = useAuthStore(s => s.profile);
  if (!profile) return <Navigate to="/login" replace />;
  if (!profile.isActive) {
    useAuthStore.getState().logout();
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

function AdminGuard({ children }: { children: React.ReactNode }) {
  const profile = useAuthStore(s => s.profile);
  if (!profile || profile.role !== 'admin') return <Navigate to="/" replace />;
  return <>{children}</>;
}

function LoginRoute() {
  const profile = useAuthStore(s => s.profile);
  if (profile && profile.isActive) return <Navigate to="/" replace />;
  return <Login />;
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AppLoader>
          <Routes>
            <Route path="/login" element={<LoginRoute />} />
            <Route element={<AuthGuard><Layout /></AuthGuard>}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/clients" element={<Clients />} />
              <Route path="/clients/:id" element={<ClientDetail />} />
              <Route path="/contracts" element={<Contracts />} />
              <Route path="/accounts" element={<Accounts />} />
              <Route path="/tasks" element={<Tasks />} />
              <Route path="/goals" element={<Goals />} />
              <Route path="/knowledge" element={<Knowledge />} />
              <Route path="/checklists" element={<Checklists />} />
              <Route path="/tools" element={<Tools />} />
              <Route path="/communications" element={<Communications />} />
              <Route path="/replies" element={<QuickReplies />} />
              <Route path="/ai-reply" element={<AIReply />} />
              <Route path="/admin/users" element={<AdminGuard><UserManagement /></AdminGuard>} />
              <Route path="/admin/errors" element={<AdminGuard><ErrorLog /></AdminGuard>} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AppLoader>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
