import { Link, useNavigate } from 'react-router-dom';
import { AlertTriangle, Clock, ChevronRight, CalendarDays, Users, CheckCircle2 } from 'lucide-react';
import useStore from '../stores/useStore';
import { formatDate, isOverdue, isDueToday, isDueTomorrow, isDueThisWeek, isDueNextWeek, daysAgoCount } from '../utils/helpers';
import PriorityBadge from '../components/ui/PriorityBadge';
import StatusBadge from '../components/ui/StatusBadge';
import { useTranslation } from '../i18n/useTranslation';
import type { Task } from '../types';

const priorityOrder: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 };
const sortByPriority = (a: Task, b: Task) => (priorityOrder[a.priority] || 3) - (priorityOrder[b.priority] || 3);

export default function Dashboard() {
  const { clients, tasks } = useStore();
  const { t, lang } = useTranslation();
  const navigate = useNavigate();

  const today = new Date().toLocaleDateString(lang === 'lt' ? 'lt-LT' : 'en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const activeTasks = tasks.filter(tk => tk.status !== 'completed' && tk.status !== 'cancelled');

  const overdueTasks = activeTasks.filter(tk => isOverdue(tk.dueDate)).sort(sortByPriority);
  const todayTasks = activeTasks.filter(tk => isDueToday(tk.dueDate)).sort(sortByPriority);
  const tomorrowTasks = activeTasks.filter(tk => isDueTomorrow(tk.dueDate)).sort(sortByPriority);
  const thisWeekTasks = activeTasks
    .filter(tk => isDueThisWeek(tk.dueDate) && !isDueToday(tk.dueDate) && !isDueTomorrow(tk.dueDate) && !isOverdue(tk.dueDate))
    .sort(sortByPriority);
  const nextWeekTasks = activeTasks.filter(tk => isDueNextWeek(tk.dueDate)).sort(sortByPriority);

  const activeClients = clients.filter(c => c.status === 'active' || c.status === 'onboarding').length;
  const completedToday = tasks.filter(tk => tk.status === 'completed' && tk.completedAt?.startsWith(new Date().toISOString().slice(0, 10))).length;

  // Focus items = overdue + high/urgent due today (the absolute must-dos)
  const focusItems = [...overdueTasks, ...todayTasks.filter(tk => tk.priority === 'urgent' || tk.priority === 'high')];

  // Clients needing action: have a nextAction or are at_risk/issue
  const clientsWithActions = clients
    .filter(c => c.nextAction && c.status !== 'churned')
    .sort((a, b) => (a.lastInteractionAt || a.updatedAt).localeCompare(b.lastInteractionAt || b.updatedAt));

  const riskClients = clients.filter(c => c.status === 'at_risk' || c.status === 'issue');

  const inactiveClients = clients
    .filter(c => {
      if (c.status === 'churned' || c.status === 'prospect') return false;
      const days = daysAgoCount(c.lastInteractionAt);
      return days === null || days > 7;
    })
    .sort((a, b) => (a.lastInteractionAt || a.createdAt).localeCompare(b.lastInteractionAt || b.createdAt));

  // Merge attention clients (risk + inactive), deduplicated
  const attentionClientIds = new Set<string>();
  const attentionClients = [...riskClients, ...clientsWithActions, ...inactiveClients].filter(c => {
    if (attentionClientIds.has(c.id)) return false;
    attentionClientIds.add(c.id);
    return true;
  });

  const hasFocus = focusItems.length > 0;
  const allClear = overdueTasks.length === 0 && todayTasks.length === 0 && attentionClients.length === 0;

  return (
    <div className="max-w-3xl mx-auto space-y-5">

      {/* ── DATE + STATS BAR ── */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>{today}</p>
          <div className="flex items-center gap-6 mt-3">
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
      </div>

      {/* ══════════════════════════════════════════════════════════
          LEVEL 1 — ACT NOW (dominant focus area)
         ══════════════════════════════════════════════════════════ */}

      {hasFocus ? (
        <div className="rounded-xl border-2 border-danger-200 bg-gradient-to-b from-danger-50 to-white dark:from-danger-950/30 dark:to-[var(--surface-0)] dark:border-danger-800 overflow-hidden">
          <div className="px-4 py-2.5 bg-danger-100/60 dark:bg-danger-900/30 flex items-center gap-2">
            <AlertTriangle size={14} className="text-danger-600 dark:text-danger-400" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-danger-700 dark:text-danger-400">
              {lang === 'lt' ? 'Reikia dėmesio dabar' : 'Needs Attention Now'}
            </h2>
            <span className="ml-auto text-[10px] font-bold bg-danger-600 text-white px-2 py-0.5 rounded-full">{focusItems.length}</span>
          </div>
          <div>
            {focusItems.slice(0, 6).map((task) => {
              const isOD = isOverdue(task.dueDate);
              return (
                <div
                  key={task.id}
                  className="px-4 py-3 flex items-center gap-3 cursor-pointer border-b border-danger-100 dark:border-danger-900/30 last:border-b-0 hover:bg-danger-50/60 dark:hover:bg-danger-950/20 transition-colors"
                  onClick={() => navigate(`/tasks?open=${task.id}`)}
                >
                  <div className={`w-1.5 h-8 rounded-full flex-shrink-0 ${isOD ? 'bg-danger-500' : 'bg-warning-400'}`} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{task.title}</div>
                    <div className="flex items-center gap-2 mt-0.5">
                      {task.clientName && <span className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>{task.clientName}</span>}
                      {isOD && <span className="text-[10px] font-bold text-danger-600 dark:text-danger-400 uppercase">{t.common.overdue}</span>}
                    </div>
                  </div>
                  <PriorityBadge priority={task.priority} />
                  {task.dueDate && <span className={`text-xs flex-shrink-0 ${isOD ? 'text-danger-600' : ''}`} style={isOD ? undefined : { color: 'var(--text-tertiary)' }}>{formatDate(task.dueDate)}</span>}
                  <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} />
                </div>
              );
            })}
          </div>
        </div>
      ) : allClear ? (
        <div className="rounded-xl border border-success-200 dark:border-success-800 bg-success-50/50 dark:bg-success-950/20 px-6 py-8 text-center">
          <CheckCircle2 size={32} className="mx-auto text-success-500 mb-2" />
          <p className="text-sm font-medium text-success-700 dark:text-success-400">{lang === 'lt' ? 'Viskas tvarkoje! Nėra skubių užduočių.' : 'All clear! No urgent tasks today.'}</p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>{lang === 'lt' ? 'Gera diena produktyvumui' : 'A good day for deep work'}</p>
        </div>
      ) : null}


      {/* ══════════════════════════════════════════════════════════
          LEVEL 2 — TODAY'S SCHEDULE + TOMORROW
         ══════════════════════════════════════════════════════════ */}

      {/* Today's full task list (including medium/low not in focus) */}
      {todayTasks.length > 0 && (
        <section className="dash-section dash-section-today">
          <div className="dash-section-header">
            <h2>{t.dashboard.todaysPriorities} ({todayTasks.length})</h2>
            <Link to="/tasks" className="text-[11px] hover:underline" style={{ color: 'var(--text-tertiary)' }}>{t.common.viewAll} <ChevronRight size={10} className="inline" /></Link>
          </div>
          <div>
            {todayTasks.slice(0, 6).map((task) => (
              <div key={task.id} className="dash-row" onClick={() => navigate(`/tasks?open=${task.id}`)}>
                <div className="flex-1 min-w-0">
                  <div className="text-sm truncate" style={{ color: 'var(--text-primary)' }}>{task.title}</div>
                  {task.clientName && <div className="text-[11px] mt-0.5" style={{ color: 'var(--text-tertiary)' }}>{task.clientName}</div>}
                </div>
                <PriorityBadge priority={task.priority} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Tomorrow */}
      <section className="dash-section dash-section-tomorrow">
        <div className="dash-section-header">
          <h2>{lang === 'lt' ? 'Rytoj' : 'Tomorrow'} ({tomorrowTasks.length})</h2>
          <Link to="/tasks" className="text-[11px] hover:underline" style={{ color: 'var(--text-tertiary)' }}>{t.common.viewAll} <ChevronRight size={10} className="inline" /></Link>
        </div>
        {tomorrowTasks.length === 0 ? (
          <div className="dash-empty">{t.dashboard.noTasksTomorrow}</div>
        ) : (
          <div>
            {tomorrowTasks.slice(0, 5).map((task) => (
              <div key={task.id} className="dash-row" onClick={() => navigate(`/tasks?open=${task.id}`)}>
                <div className="flex-1 min-w-0">
                  <div className="text-sm truncate" style={{ color: 'var(--text-primary)' }}>{task.title}</div>
                  {task.clientName && <div className="text-[11px] mt-0.5" style={{ color: 'var(--text-tertiary)' }}>{task.clientName}</div>}
                </div>
                <PriorityBadge priority={task.priority} />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* This Week + Next Week — side by side on wider screens */}
      {(thisWeekTasks.length > 0 || nextWeekTasks.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {thisWeekTasks.length > 0 && (
            <section className="dash-section dash-section-week">
              <div className="dash-section-header">
                <h2><CalendarDays size={11} className="inline mr-1" />{t.dashboard.upcomingThisWeek} ({thisWeekTasks.length})</h2>
              </div>
              <div>
                {thisWeekTasks.slice(0, 4).map((task) => (
                  <div key={task.id} className="dash-row" onClick={() => navigate(`/tasks?open=${task.id}`)}>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm truncate" style={{ color: 'var(--text-primary)' }}>{task.title}</div>
                    </div>
                    <PriorityBadge priority={task.priority} />
                    {task.dueDate && <span className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>{formatDate(task.dueDate)}</span>}
                  </div>
                ))}
              </div>
            </section>
          )}
          {nextWeekTasks.length > 0 && (
            <section className="dash-section dash-section-week">
              <div className="dash-section-header">
                <h2><CalendarDays size={11} className="inline mr-1" />{lang === 'lt' ? 'Kita savaitė' : 'Next Week'} ({nextWeekTasks.length})</h2>
              </div>
              <div>
                {nextWeekTasks.slice(0, 4).map((task) => (
                  <div key={task.id} className="dash-row" onClick={() => navigate(`/tasks?open=${task.id}`)}>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm truncate" style={{ color: 'var(--text-primary)' }}>{task.title}</div>
                    </div>
                    <PriorityBadge priority={task.priority} />
                    {task.dueDate && <span className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>{formatDate(task.dueDate)}</span>}
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}


      {/* ══════════════════════════════════════════════════════════
          LEVEL 3 — CLIENT INTELLIGENCE
         ══════════════════════════════════════════════════════════ */}

      {attentionClients.length > 0 && (
        <section className="dash-section dash-section-attention">
          <div className="dash-section-header">
            <h2><Users size={11} className="inline mr-1" />{t.crm.clientsNeedingAction} ({attentionClients.length})</h2>
            <Link to="/clients" className="text-[11px] hover:underline" style={{ color: 'var(--text-tertiary)' }}>{t.common.viewAll} <ChevronRight size={10} className="inline" /></Link>
          </div>
          <div>
            {attentionClients.slice(0, 6).map((client) => {
              const days = daysAgoCount(client.lastInteractionAt);
              const isRisk = client.status === 'at_risk' || client.status === 'issue';
              return (
                <Link key={client.id} to={`/clients/${client.id}`} className="dash-row block">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {isRisk && <span className="w-1.5 h-1.5 rounded-full bg-danger-500 flex-shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{client.companyName}</div>
                      {client.nextAction && <div className="text-[11px] mt-0.5 truncate" style={{ color: 'var(--text-tertiary)' }}>{client.nextAction}</div>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {isRisk && <StatusBadge status={client.status} />}
                    {days !== null && (
                      <span className={`text-[10px] ${days > 7 ? 'text-warning-600 font-medium' : ''}`} style={days <= 7 ? { color: 'var(--text-tertiary)' } : undefined}>
                        {days === 0 ? t.crm.today : `${days}d`}
                      </span>
                    )}
                    <ChevronRight size={13} style={{ color: 'var(--text-muted)' }} />
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* If there are no clients needing action and no attention clients */}
      {attentionClients.length === 0 && clientsWithActions.length === 0 && (
        <section className="dash-section dash-section-neutral">
          <div className="dash-section-header">
            <h2><Users size={11} className="inline mr-1" />{t.crm.clientsNeedingAction}</h2>
          </div>
          <div className="dash-empty">{t.crm.noClientsNeedAction}</div>
        </section>
      )}
    </div>
  );
}
