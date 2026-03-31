import { useEffect, useRef, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import ToastContainer from '../ui/ToastContainer';
import useStore from '../../stores/useStore';
import { DashboardSkeleton, TableSkeleton, CardListSkeleton, KanbanSkeleton } from '../ui/Skeleton';

function ContentSkeleton() {
  const { pathname } = useLocation();
  if (pathname === '/' || pathname === '/today') return <DashboardSkeleton />;
  if (pathname === '/tasks') return <KanbanSkeleton />;
  if (pathname.startsWith('/clients') || pathname === '/contracts') return <TableSkeleton />;
  if (pathname === '/communications' || pathname === '/knowledge' || pathname === '/goals') return <CardListSkeleton />;
  return <TableSkeleton columns={4} rows={4} />;
}

export default function Layout() {
  const mainRef = useRef<HTMLElement>(null);
  const { pathname } = useLocation();
  const darkMode = useStore(s => s.darkMode);
  const dataReady = useStore(s => s.initialized);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTo(0, 0);
    }
    setMobileNavOpen(false);
  }, [pathname]);

  return (
    <div className="flex h-screen overflow-hidden">
      {mobileNavOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 md:hidden"
          onClick={() => setMobileNavOpen(false)}
        />
      )}
      <Sidebar mobileOpen={mobileNavOpen} onMobileClose={() => setMobileNavOpen(false)} />
      <div className="flex flex-col flex-1 min-w-0">
        <Header onMobileMenuClick={() => setMobileNavOpen(true)} />
        <main ref={mainRef} className="flex-1 overflow-y-auto p-4 md:p-6" style={{ background: 'var(--surface-1)' }}>
          {dataReady ? <Outlet /> : <ContentSkeleton />}
        </main>
      </div>
      <ToastContainer />
    </div>
  );
}
