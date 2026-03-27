import { Link, useNavigate } from 'react-router-dom';
import useStore from '../stores/useStore';
import { formatDate, isOverdue, isDueToday, isDueTomorrow, isDueThisWeek, isDueNextWeek, daysAgoCount } from '../utils/helpers';
import PriorityBadge from '../components/ui/PriorityBadge';
import { useTranslation } from '../i18n/useTranslation';
import type { Task } from '../types';

const priorityOrder: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 };
const sortByPriority = (a: Task, b: Task) => (priorityOrder[a.priority] || 3) - (priorityOrder[b.priority] || 3);

const SECTION_CLASS: Record<string, string> = {
  overdue: 'dash-section-overdue',
  today: 'dash-section-today',
  tomorrow: 'dash-section-tomorrow',
  this_week: 'dash-section-week',
  next_week: 'dash-section-week',
  clients: 'dash-section-neutral',
  attention: 'dash-section-attention',
};

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
  const tasksDueToday = todayTasks.length + overdueTasks.length;
  const thisWeekTotal = todayTasks.length + tomorrowTasks.length + thisWeekTasks.length + overdueTasks.length;

  const clientsWithActions = clients
    .filter(c => c.nextAction && c.status !== 'churned')
    .sort((a, b) => (a.lastInteractionAt || a.updatedAt).localeCompare(b.lastInteractionAt || b.updatedAt))
    .slice(0, 5);

  const inactiveClients = clients
    .filter(c => {
      if (c.status === 'churned' || c.status === 'prospect') return false;
      const days = daysAgoCount(c.lastInteractionAt);
      return days === null || days > 7;
    })
    .sort((a, b) => (a.lastInteractionAt || a.createdAt).localeCompare(b.lastInteractionAt || b.createdAt))
    .slice(0, 4);

  const riskClients = clients.filter(c => c.status === 'at_risk' || c.status === 'issue');
  const attentionClientIds = new Set<string>();
  const attentionClients = [...riskClients, ...inactiveClients].filter(c => {
    if (attentionClientIds.has(c.id)) return false;
    attentionClientIds.add(c.id);
    return true;
  });

  const stats: { label: string; value: number; to: string; className?: string }[] = [
    { label: t.dashboard.activeClients, value: activeClients, to: '/clients' },
    { label: t.dashboard.tasksDueToday, value: tasksDueToday, to: '/tasks' },
  ];
  if (overdueTasks.length > 0) {
    stats.push({ label: t.common.overdue, value: overdueTasks.length, to: '/tasks', className: 'text-danger-600' });
  }
  stats.push({ label: lang === 'lt' ? 'Ši savaitė' : 'This Week', value: thisWeekTotal, to: '/tasks' });

  const emptyMessages: Record<string, string> = {
    overdue: '',
    today: t.dashboard.noUrgentTasks,
    tomorrow: t.dashboard.noTasksTomorrow,
    this_week: t.dashboard.noTasksThisWeek,
    next_week: t.dashboard.noTasksNextWeek,
  };

  const taskSections: { key: string; label: string; tasks: Task[] }[] = [];
  if (overdueTasks.length > 0) {
    taskSections.push({ key: 'overdue', label: `${t.common.overdue} (${overdueTasks.length})`, tasks: overdueTasks });
  }
  taskSections.push({ key: 'today', label: t.dashboard.todaysPriorities, tasks: todayTasks });
  taskSections.push({ key: 'tomorrow', label: lang === 'lt' ? 'Rytoj' : 'Tomorrow', tasks: tomorrowTasks });
  if (thisWeekTasks.length > 0) {
    taskSections.push({ key: 'this_week', label: t.dashboard.upcomingThisWeek, tasks: thisWeekTasks });
  }
  if (nextWeekTasks.length > 0) {
    taskSections.push({ key: 'next_week', label: lang === 'lt' ? 'Kita savaitė' : 'Next Week', tasks: nextWeekTasks });
  }

  return (
    <div className="max-w-3xl mx-auto" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Date + Stats */}
      <div>
        <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>{today}</p>
        <div className="flex items-center gap-8 mt-4">
          {stats.map((stat) => (
            <Link key={stat.label} to={stat.to} className="flex items-baseline gap-2 hover:opacity-70 transition-opacity">
              <span className={`text-2xl font-semibold ${stat.className || ''}`} style={stat.className ? undefined : { color: 'var(--text-primary)' }}>{stat.value}</span>
              <span className="text-sm" style={{ color: stat.className ? undefined : 'var(--text-tertiary)' }}>{stat.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Task sections */}
      {taskSections.map((section) => (
        <section key={section.key} className={`dash-section ${SECTION_CLASS[section.key] || 'dash-section-week'}`}>
          <div className="dash-section-header">
            <h2>{section.label}</h2>
            <Link to="/tasks" className="text-[11px] hover:underline" style={{ color: 'var(--text-tertiary)' }}>{t.common.viewAll}</Link>
          </div>
          {section.tasks.length === 0 ? (
            <div className="dash-empty">{emptyMessages[section.key] || t.dashboard.noUrgentTasks}</div>
          ) : (
            <div>
              {section.tasks.slice(0, 5).map((task) => (
                <div key={task.id} className="dash-row" onClick={() => navigate(`/tasks?open=${task.id}`)}>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm truncate" style={{ color: 'var(--text-primary)' }}>{task.title}</div>
                    {task.clientName && <div className="text-[11px] mt-0.5" style={{ color: 'var(--text-tertiary)' }}>{task.clientName}</div>}
                  </div>
                  <PriorityBadge priority={task.priority} />
                  {task.dueDate && <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{formatDate(task.dueDate)}</span>}
                  {section.key === 'overdue' && <span className="text-[10px] font-bold text-danger-600 uppercase">{t.common.overdue}</span>}
                </div>
              ))}
            </div>
          )}
        </section>
      ))}

      {/* Clients Needing Action */}
      <section className={`dash-section ${SECTION_CLASS.clients}`}>
        <div className="dash-section-header">
          <h2>{t.crm.clientsNeedingAction}</h2>
          <Link to="/clients" className="text-[11px] hover:underline" style={{ color: 'var(--text-tertiary)' }}>{t.common.viewAll}</Link>
        </div>
        {clientsWithActions.length === 0 ? (
          <div className="dash-empty">{t.crm.noClientsNeedAction}</div>
        ) : (
          <div>
            {clientsWithActions.map((client) => (
              <Link key={client.id} to={`/clients/${client.id}`} className="dash-row block">
                <div className="flex-1 min-w-0">
                  <div className="text-sm" style={{ color: 'var(--text-primary)' }}>{client.companyName}</div>
                  <div className="text-[11px] mt-0.5 truncate" style={{ color: 'var(--text-tertiary)' }}>{client.nextAction}</div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Risk / Inactive Clients */}
      {attentionClients.length > 0 && (
        <section className={`dash-section ${SECTION_CLASS.attention}`}>
          <div className="dash-section-header">
            <h2>{t.crm.inactiveClients}</h2>
          </div>
          <div>
            {attentionClients.map((client) => {
              const days = daysAgoCount(client.lastInteractionAt);
              const isRisk = client.status === 'at_risk' || client.status === 'issue';
              return (
                <Link key={client.id} to={`/clients/${client.id}`} className="dash-row block">
                  <div className="flex-1 min-w-0">
                    <span className="text-sm" style={{ color: 'var(--text-primary)' }}>{client.companyName}</span>
                  </div>
                  {isRisk && <span className="text-xs text-danger-600">{client.status.replace('_', ' ')}</span>}
                  {days !== null && (
                    <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{days === 0 ? t.crm.today : `${days} ${t.crm.daysAgo}`}</span>
                  )}
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
