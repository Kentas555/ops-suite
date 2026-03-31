import { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertTriangle, ChevronRight, Users, CheckCircle2, PhoneCall, ClipboardList, TrendingUp, Target, Zap, CalendarDays } from 'lucide-react';
import useStore from '../stores/useStore';
import { formatDate, isOverdue, isDueToday } from '../utils/helpers';
import PriorityBadge from '../components/ui/PriorityBadge';
import { useTranslation } from '../i18n/useTranslation';
import { computeClientHealth, HEALTH_CONFIG } from '../utils/clientHealth';
import { computeAutoValue } from '../utils/goalTracking';
import type { Task } from '../types';

const priorityOrder: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 };
const sortByPriority = (a: Task, b: Task) => (priorityOrder[a.priority] || 3) - (priorityOrder[b.priority] || 3);

function fmtVal(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(v >= 10_000 ? 0 : 1)}k`;
  return String(v);
}

export default function Dashboard() {
  const { clients, tasks, goals, communicationLogs } = useStore();
  const { t, lang } = useTranslation();
  const navigate = useNavigate();

  const today = new Date().toLocaleDateString(lang === 'lt' ? 'lt-LT' : 'en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const activeTasks = tasks.filter(tk => tk.status !== 'completed' && tk.status !== 'cancelled');
  const overdueTasks = activeTasks.filter(tk => isOverdue(tk.dueDate)).sort(sortByPriority);
  const todayTasks = activeTasks.filter(tk => isDueToday(tk.dueDate)).sort(sortByPriority);
  const completedToday = tasks.filter(tk => tk.status === 'completed' && tk.completedAt?.startsWith(new Date().toISOString().slice(0, 10))).length;
  const activeClients = clients.filter(c => c.status === 'active' || c.status === 'onboarding').length;

  // FOCUS: max 5 items — overdue first, then urgent/high today
  const focusItems = useMemo(() => {
    const items = [...overdueTasks, ...todayTasks.filter(tk => tk.priority === 'urgent' || tk.priority === 'high')];
    // Deduplicate (task could be both overdue and today)
    const seen = new Set<string>();
    return items.filter(t => { if (seen.has(t.id)) return false; seen.add(t.id); return true; }).slice(0, 5);
  }, [overdueTasks, todayTasks]);

  // GOALS: active in-progress goals
  const activeGoals = useMemo(() =>
    goals.filter(g => g.status === 'in_progress' && g.targetValue > 0).slice(0, 4),
  [goals]);

  // CLIENTS: health-based
  const clientHealthMap = useMemo(() => {
    const map = new Map<string, ReturnType<typeof computeClientHealth>>();
    for (const c of clients) {
      if (c.status !== 'churned' && c.status !== 'prospect') {
        map.set(c.id, computeClientHealth(c, tasks));
      }
    }
    return map;
  }, [clients, tasks]);

  const healthOrder = { at_risk: 0, needs_attention: 1, active: 2 };
  const clientsToFocus = useMemo(() =>
    clients
      .filter(c => {
        const h = clientHealthMap.get(c.id);
        return h && (h.status === 'at_risk' || h.status === 'needs_attention' || h.triggers.length > 0);
      })
      .sort((a, b) => (healthOrder[clientHealthMap.get(a.id)!.status] ?? 9) - (healthOrder[clientHealthMap.get(b.id)!.status] ?? 9))
      .slice(0, 5),
  [clients, clientHealthMap]);

  const hasFocus = focusItems.length > 0;
  const allClear = !hasFocus && todayTasks.length === 0;

  return (
    <div className="max-w-3xl mx-auto space-y-5">

      {/* ── HEADER: Date + Stats ── */}
      <div>
        <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>{today}</p>
        <div className="flex items-center gap-6 mt-3 flex-wrap">
          <Link to="/tasks" className="flex items-center gap-2 hover:opacity-70 transition-opacity">
            <span className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{overdueTasks.length + todayTasks.length}</span>
            <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{t.dashboard.tasksDueToday}</span>
          </Link>
          <Link to="/clients" className="flex items-center gap-2 hover:opacity-70 transition-opacity">
            <span className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{activeClients}</span>
            <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{t.dashboard.activeClients}</span>
          </Link>
          {completedToday > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-success-600">{completedToday}</span>
              <span className="text-xs text-success-600">{lang === 'lt' ? 'Atlikta šiandien' : 'Done today'}</span>
            </div>
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════════
          1. FOCUS — What to do NOW (max 5 items)
         ═══════════════════════════════════════════ */}

      {hasFocus ? (
        <div className="rounded-xl border-2 border-danger-200 bg-gradient-to-b from-danger-50 to-white dark:from-danger-950/30 dark:to-[var(--surface-0)] dark:border-danger-800 overflow-hidden">
          <div className="px-4 py-2.5 bg-danger-100/60 dark:bg-danger-900/30 flex items-center gap-2">
            <AlertTriangle size={14} className="text-danger-600 dark:text-danger-400" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-danger-700 dark:text-danger-400">
              {lang === 'lt' ? 'Svarbiausia dabar' : 'Focus Now'}
            </h2>
            <span className="ml-auto text-[10px] font-bold bg-danger-600 text-white px-2 py-0.5 rounded-full">{focusItems.length}</span>
          </div>
          <div>
            {focusItems.map((task) => {
              const isOD = isOverdue(task.dueDate);
              return (
                <div key={task.id} className="px-4 py-3 flex items-center gap-3 cursor-pointer border-b border-danger-100 dark:border-danger-900/30 last:border-b-0 hover:bg-danger-50/60 dark:hover:bg-danger-950/20 transition-colors"
                  onClick={() => navigate(`/tasks?open=${task.id}`)}>
                  <div className={`w-1.5 h-8 rounded-full flex-shrink-0 ${isOD ? 'bg-danger-500' : 'bg-warning-400'}`} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{task.title}</div>
                    <div className="flex items-center gap-2 mt-0.5">
                      {task.clientName && <span className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>{task.clientName}</span>}
                      {isOD && <span className="text-[10px] font-bold text-danger-600 uppercase">{t.common.overdue}</span>}
                    </div>
                  </div>
                  <PriorityBadge priority={task.priority} />
                  {task.dueDate && <span className={`text-xs flex-shrink-0 ${isOD ? 'text-danger-600' : ''}`} style={isOD ? undefined : { color: 'var(--text-tertiary)' }}>{formatDate(task.dueDate)}</span>}
                  <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} />
                </div>
              );
            })}
          </div>
          {/* Show remaining today tasks count if more exist */}
          {todayTasks.length > focusItems.length && (
            <Link to="/tasks?due=today" className="block px-4 py-2 text-center text-xs text-danger-600 hover:bg-danger-50/60 border-t border-danger-100 font-medium">
              +{todayTasks.length - focusItems.length} {lang === 'lt' ? 'daugiau užduočių šiandien' : 'more tasks today'} →
            </Link>
          )}
        </div>
      ) : allClear ? (
        <div className="rounded-xl border border-success-200 dark:border-success-800 bg-success-50/50 dark:bg-success-950/20 px-6 py-6 text-center">
          <CheckCircle2 size={28} className="mx-auto text-success-500 mb-2" />
          <p className="text-sm font-medium text-success-700 dark:text-success-400">{lang === 'lt' ? 'Viskas tvarkoje!' : 'All clear!'}</p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>{lang === 'lt' ? 'Nėra skubių užduočių šiandien' : 'No urgent tasks today'}</p>
        </div>
      ) : null}


      {/* ═══════════════════════════════════════════
          2. GOALS — How you're performing
         ═══════════════════════════════════════════ */}

      {activeGoals.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
              <Target size={12} /> {lang === 'lt' ? 'Tikslai' : 'Goals'}
            </h2>
            <Link to="/goals" className="text-[11px] hover:underline" style={{ color: 'var(--text-tertiary)' }}>{t.common.viewAll} <ChevronRight size={10} className="inline" /></Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {activeGoals.map(goal => {
              const isAuto = goal.trackingMode === 'auto';
              const current = isAuto ? computeAutoValue(goal, communicationLogs, tasks) : goal.currentValue;
              const pct = goal.targetValue > 0 ? Math.min(Math.round((current / goal.targetValue) * 100), 100) : 0;
              const barColor = pct >= 100 ? 'bg-success-500' : pct >= 50 ? 'bg-primary-500' : 'bg-amber-500';
              const overdue = goal.targetDate && isOverdue(goal.targetDate);

              return (
                <Link key={goal.id} to="/goals" className="card p-3 hover:shadow-md transition-shadow block">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{goal.title}</h3>
                    {isAuto && <Zap size={10} className="text-purple-500 flex-shrink-0" />}
                  </div>
                  <div className="flex items-baseline justify-between mb-1">
                    <span className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{pct}%</span>
                    <span className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>{fmtVal(current)} / {fmtVal(goal.targetValue)}</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div className={`h-2 rounded-full transition-all duration-500 ${barColor}`} style={{ width: `${pct}%` }} />
                  </div>
                  {goal.targetDate && (
                    <div className={`flex items-center gap-1 mt-1.5 text-[10px] ${overdue ? 'text-danger-600 font-medium' : ''}`} style={overdue ? undefined : { color: 'var(--text-tertiary)' }}>
                      <CalendarDays size={9} /> {formatDate(goal.targetDate)}
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      )}


      {/* ═══════════════════════════════════════════
          3. CLIENTS — Who needs attention
         ═══════════════════════════════════════════ */}

      {clientsToFocus.length > 0 ? (
        <section className="dash-section dash-section-attention">
          <div className="dash-section-header">
            <h2><Users size={11} className="inline mr-1" />{lang === 'lt' ? 'Klientai' : 'Clients'} ({clientsToFocus.length})</h2>
            <Link to="/clients" className="text-[11px] hover:underline" style={{ color: 'var(--text-tertiary)' }}>{t.common.viewAll} <ChevronRight size={10} className="inline" /></Link>
          </div>
          <div>
            {clientsToFocus.map((client) => {
              const health = clientHealthMap.get(client.id)!;
              const cfg = HEALTH_CONFIG[health.status];
              const trigger = health.triggers[0];
              const TriggerIcon = trigger?.type === 'follow_up' ? PhoneCall : trigger?.type === 'overdue_task' ? ClipboardList : TrendingUp;

              return (
                <Link key={client.id} to={`/clients/${client.id}`} className="dash-row block">
                  <div className="flex items-center gap-2.5 flex-1 min-w-0">
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${cfg.dot}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{client.companyName}</span>
                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${cfg.bg} ${cfg.color}`}>
                          {lang === 'lt' ? cfg.labelLt : cfg.label}
                        </span>
                      </div>
                      {trigger && (
                        <div className="flex items-center gap-1 mt-0.5">
                          <TriggerIcon size={10} className="text-slate-400 flex-shrink-0" />
                          <span className="text-[11px] truncate" style={{ color: 'var(--text-tertiary)' }}>
                            {lang === 'lt' ? trigger.labelLt : trigger.label}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <ChevronRight size={13} style={{ color: 'var(--text-muted)' }} />
                </Link>
              );
            })}
          </div>
        </section>
      ) : (
        <section className="dash-section dash-section-neutral">
          <div className="dash-section-header">
            <h2><Users size={11} className="inline mr-1" />{lang === 'lt' ? 'Klientai' : 'Clients'}</h2>
          </div>
          <div className="dash-empty">{t.crm.noClientsNeedAction}</div>
        </section>
      )}
    </div>
  );
}
