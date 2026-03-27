import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Users, FileText, UserCog, CheckSquare,
  BookOpen, ClipboardList, Calculator, MessageSquare, Zap, Sparkles, Target,
  ChevronLeft, ChevronRight, Briefcase, Shield, LogOut, Bug, X,
} from 'lucide-react';
import useStore from '../../stores/useStore';
import useAuthStore from '../../stores/useAuthStore';
import useErrorStore from '../../stores/useErrorStore';
import { useTranslation } from '../../i18n/useTranslation';

type NavItem = { to: string; icon: React.ComponentType<{ size?: number }>; label: string };

interface SidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

function SectionDivider({ collapsed }: { collapsed: boolean }) {
  return (
    <div className={`${collapsed ? 'mx-2' : 'mx-3'} my-2`}>
      <div className="border-t border-slate-100" />
    </div>
  );
}

function NavItemLink({ item, collapsed }: { item: NavItem; collapsed: boolean }) {
  return (
    <NavLink
      key={item.to}
      to={item.to}
      end={item.to === '/'}
      className={({ isActive }) =>
        isActive
          ? `flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-slate-900 border-l-2 border-slate-900 bg-slate-50 ${collapsed ? 'justify-center !px-0 mx-1' : ''}`
          : `flex items-center gap-3 px-3 py-2 rounded-md text-sm text-slate-500 hover:text-slate-700 hover:bg-slate-50 border-l-2 border-transparent ${collapsed ? 'justify-center !px-0 mx-1' : ''}`
      }
      title={collapsed ? item.label : undefined}
    >
      <item.icon size={18} />
      {!collapsed && <span>{item.label}</span>}
    </NavLink>
  );
}

function SidebarContent({ collapsed, onMobileClose }: { collapsed: boolean; onMobileClose?: () => void }) {
  const currentUser = useAuthStore(s => s.getCurrentUser());
  const logout = useAuthStore(s => s.logout);
  const { t } = useTranslation();
  const { toggleSidebar } = useStore();
  const isAdmin = currentUser?.role === 'admin';
  const errorUnreadCount = useErrorStore(s => s.getUnreadCount());

  const coreGroup: NavItem[] = [
    { to: '/', icon: LayoutDashboard, label: t.nav.dashboard },
    { to: '/clients', icon: Users, label: t.nav.clients },
    { to: '/tasks', icon: CheckSquare, label: t.nav.tasks },
    { to: '/goals', icon: Target, label: t.nav.goals },
  ];

  const opsGroup: NavItem[] = [
    { to: '/contracts', icon: FileText, label: t.nav.contracts },
    { to: '/accounts', icon: UserCog, label: t.nav.accounts },
  ];

  const commsGroup: NavItem[] = [
    { to: '/communications', icon: MessageSquare, label: t.nav.communications },
    { to: '/replies', icon: Zap, label: t.nav.quickReplies },
    { to: '/ai-reply', icon: Sparkles, label: t.nav.aiReply },
  ];

  const refGroup: NavItem[] = [
    { to: '/knowledge', icon: BookOpen, label: t.nav.knowledgeBase },
    { to: '/checklists', icon: ClipboardList, label: t.nav.checklists },
  ];

  const toolsGroup: NavItem[] = [
    { to: '/tools', icon: Calculator, label: t.nav.quickTools },
  ];

  return (
    <>
      {/* Logo */}
      <div className={`h-16 flex items-center flex-shrink-0 ${collapsed ? 'justify-center' : 'px-5'}`} style={{ borderBottom: '1px solid var(--border-default)' }}>
        {collapsed ? (
          <div className="w-8 h-8 bg-slate-700 rounded-lg flex items-center justify-center">
            <Briefcase size={16} className="text-white" />
          </div>
        ) : (
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-8 h-8 bg-slate-700 rounded-lg flex items-center justify-center flex-shrink-0">
              <Briefcase size={16} className="text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold text-slate-900 truncate">{t.app.name}</div>
              <div className="text-[10px] text-slate-500">{t.app.subtitle}</div>
            </div>
            {/* Mobile close button */}
            {onMobileClose && (
              <button
                onClick={onMobileClose}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 flex-shrink-0"
              >
                <X size={18} />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 overflow-y-auto">
        {/* Core work */}
        <div className="space-y-0.5">
          {coreGroup.map((item) => (
            <NavItemLink key={item.to} item={item} collapsed={collapsed} />
          ))}
        </div>

        <SectionDivider collapsed={collapsed} />

        {/* Operations */}
        <div className="space-y-0.5">
          {opsGroup.map((item) => (
            <NavItemLink key={item.to} item={item} collapsed={collapsed} />
          ))}
        </div>

        <SectionDivider collapsed={collapsed} />

        {/* Communication */}
        <div className="space-y-0.5">
          {commsGroup.map((item) => (
            <NavItemLink key={item.to} item={item} collapsed={collapsed} />
          ))}
        </div>

        <SectionDivider collapsed={collapsed} />

        {/* Knowledge & Processes */}
        <div className="space-y-0.5">
          {refGroup.map((item) => (
            <NavItemLink key={item.to} item={item} collapsed={collapsed} />
          ))}
        </div>

        <SectionDivider collapsed={collapsed} />

        {/* Tools */}
        <div className="space-y-0.5">
          {toolsGroup.map((item) => (
            <NavItemLink key={item.to} item={item} collapsed={collapsed} />
          ))}
        </div>

        {/* Admin */}
        {isAdmin && (
          <>
            <SectionDivider collapsed={collapsed} />
            <div className={`${collapsed ? '' : 'px-3'} pt-1 pb-1`}>
              {!collapsed && <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{t.auth.admin}</div>}
            </div>
            <div className="space-y-0.5">
              <NavLink
                to="/admin/users"
                className={({ isActive }) =>
                  isActive
                    ? `flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-slate-900 border-l-2 border-slate-900 bg-slate-50 ${collapsed ? 'justify-center !px-0 mx-1' : ''}`
                    : `flex items-center gap-3 px-3 py-2 rounded-md text-sm text-slate-500 hover:text-slate-700 hover:bg-slate-50 border-l-2 border-transparent ${collapsed ? 'justify-center !px-0 mx-1' : ''}`
                }
                title={collapsed ? t.auth.userManagement : undefined}
              >
                <Shield size={18} />
                {!collapsed && <span>{t.auth.users}</span>}
              </NavLink>
              <NavLink
                to="/admin/errors"
                className={({ isActive }) =>
                  isActive
                    ? `flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-slate-900 border-l-2 border-slate-900 bg-slate-50 ${collapsed ? 'justify-center !px-0 mx-1' : ''}`
                    : `flex items-center gap-3 px-3 py-2 rounded-md text-sm text-slate-500 hover:text-slate-700 hover:bg-slate-50 border-l-2 border-transparent ${collapsed ? 'justify-center !px-0 mx-1' : ''}`
                }
                title={collapsed ? t.errorLog.debugPanel : undefined}
              >
                <Bug size={18} />
                {!collapsed && (
                  <span className="flex items-center gap-2">
                    {t.errorLog.debugPanel}
                    {errorUnreadCount > 0 && (
                      <span className="min-w-[16px] h-4 flex items-center justify-center bg-danger-500 text-white text-[9px] font-bold rounded-full px-1">{errorUnreadCount}</span>
                    )}
                  </span>
                )}
                {collapsed && errorUnreadCount > 0 && (
                  <span className="absolute top-0 right-0 min-w-[14px] h-3.5 flex items-center justify-center bg-danger-500 text-white text-[8px] font-bold rounded-full px-0.5">{errorUnreadCount}</span>
                )}
              </NavLink>
            </div>
          </>
        )}
      </nav>

      {/* Bottom: User info + Collapse + Logout */}
      <div style={{ borderTop: '1px solid var(--border-default)' }}>
        {/* User info */}
        {currentUser && !collapsed && (
          <div className="px-4 py-3 border-b border-slate-100">
            <div className="text-xs font-medium text-slate-900 truncate">{currentUser.displayName}</div>
            <div className="text-[10px] text-slate-400 truncate">{currentUser.email ?? currentUser.role === 'admin' ? t.auth.admin : t.auth.user}</div>
          </div>
        )}

        <div className="p-3 space-y-0.5">
          <button
            onClick={() => logout()}
            className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm text-slate-500 hover:text-slate-700 hover:bg-slate-50 w-full ${collapsed ? 'justify-center' : ''}`}
            title={collapsed ? t.auth.logout : undefined}
          >
            <LogOut size={18} />
            {!collapsed && <span>{t.auth.logout}</span>}
          </button>

          {/* Only show collapse toggle on desktop */}
          {!onMobileClose && (
            <button
              onClick={toggleSidebar}
              className="sidebar-link w-full justify-center hidden md:flex"
            >
              {collapsed ? <ChevronRight size={18} /> : (
                <>
                  <ChevronLeft size={18} />
                  <span>{t.nav.collapse}</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </>
  );
}

export default function Sidebar({ mobileOpen, onMobileClose }: SidebarProps) {
  const { sidebarCollapsed } = useStore();

  return (
    <>
      {/* Mobile sidebar — fixed overlay, slides in from left */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-40 md:hidden
          w-64 h-screen flex flex-col
          transition-transform duration-200
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
        style={{ background: 'var(--surface-0)', borderRight: '1px solid var(--border-default)' }}
      >
        <SidebarContent collapsed={false} onMobileClose={onMobileClose} />
      </aside>

      {/* Desktop sidebar — static, collapsible */}
      <aside
        className={`hidden md:flex ${sidebarCollapsed ? 'w-[68px]' : 'w-60'} h-screen flex-col transition-all duration-200 flex-shrink-0`}
        style={{ background: 'var(--surface-0)', borderRight: '1px solid var(--border-default)' }}
      >
        <SidebarContent collapsed={sidebarCollapsed} />
      </aside>
    </>
  );
}
