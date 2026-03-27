import { useEffect, useRef, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import ToastContainer from '../ui/ToastContainer';
import useStore from '../../stores/useStore';

export default function Layout() {
  const mainRef = useRef<HTMLElement>(null);
  const { pathname } = useLocation();
  const darkMode = useStore(s => s.darkMode);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Sync dark mode class on mount (persisted state → DOM)
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  // Scroll to top on every route change
  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTo(0, 0);
    }
    setMobileNavOpen(false);
  }, [pathname]);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Mobile backdrop */}
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
          <Outlet />
        </main>
      </div>
      <ToastContainer />
    </div>
  );
}
