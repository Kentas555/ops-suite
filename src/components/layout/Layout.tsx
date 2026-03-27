import { useEffect, useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import ToastContainer from '../ui/ToastContainer';
import useStore from '../../stores/useStore';

export default function Layout() {
  const mainRef = useRef<HTMLElement>(null);
  const { pathname } = useLocation();
  const darkMode = useStore(s => s.darkMode);

  // Sync dark mode class on mount (persisted state → DOM)
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  // Scroll to top on every route change
  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTo(0, 0);
    }
  }, [pathname]);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0">
        <Header />
        <main ref={mainRef} className="flex-1 overflow-y-auto p-6" style={{ background: 'var(--surface-1)' }}>
          <Outlet />
        </main>
      </div>
      <ToastContainer />
    </div>
  );
}
