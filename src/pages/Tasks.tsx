import { useState, useMemo, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, Search, CheckCircle2, Circle, RotateCcw, Trash2, LayoutGrid, List, Clock, X, GripVertical } from 'lucide-react';
import useStore from '../stores/useStore';
import { formatDate, formatRelative, isOverdue, isDueToday, getTimeGroup, type TimeGroup, generateId } from '../utils/helpers';
import StatusBadge from '../components/ui/StatusBadge';
import PriorityBadge from '../components/ui/PriorityBadge';
import Modal from '../components/ui/Modal';
import { useTranslation } from '../i18n/useTranslation';
import useToastStore from '../stores/useToastStore';

const PRIORITY_ORDER: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 };

const TIME_GROUP_ORDER: TimeGroup[] = ['overdue', 'today', 'tomorrow', 'this_week', 'next_week', 'later', 'no_date'];

const TIME_GROUP_INDICATOR: Record<TimeGroup, string> = {
  overdue: 'bg-red-500',
  today: 'bg-amber-500',
  tomorrow: 'bg-blue-400',
  this_week: 'bg-blue-300',
  next_week: 'bg-slate-400',
  later: 'bg-slate-300',
  no_date: 'bg-slate-200',
};

export default function Tasks() {
  const { tasks, clients, addTask, updateTask, deleteTask, toggleTaskChecklistItem } = useStore();
  const { t, lang } = useTranslation();
  const toast = useToastStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [view, setView] = useState<'kanban' | 'list' | 'timeline'>('timeline');
  const [showAdd, setShowAdd] = useState(searchParams.get('action') === 'new');
  const [selectedTask, setSelectedTask] = useState<string | null>(searchParams.get('open'));
  const [dueFilter, setDueFilter] = useState(searchParams.get('due') || 'all');

  // Drag and drop state
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const dragStartPos = useRef<{ x: number; y: number } | null>(null);

  const [form, setForm] = useState({
    title: '', description: '', priority: 'medium' as any, status: 'todo' as any,
    clientId: '', category: 'follow-up', dueDate: '', dueTime: '', isRecurring: false, recurringInterval: '', notes: '',
    checklistItems: '' as string,
  });

  const statusColumns = [
    { key: 'todo', label: t.tasks.toDo, dotColor: 'bg-slate-400' },
    { key: 'in_progress', label: t.tasks.inProgress, dotColor: 'bg-blue-400' },
    { key: 'waiting', label: t.tasks.waiting, dotColor: 'bg-amber-400' },
    { key: 'blocked', label: t.tasks.blocked, dotColor: 'bg-red-400' },
    { key: 'completed', label: t.tasks.completed, dotColor: 'bg-green-400' },
  ];

  const filtered = useMemo(() => tasks.filter(tk => {
    if (priorityFilter !== 'all' && tk.priority !== priorityFilter) return false;
    if (categoryFilter !== 'all' && tk.category !== categoryFilter) return false;
    if (search && !tk.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (dueFilter === 'today' && !(isDueToday(tk.dueDate) || isOverdue(tk.dueDate))) return false;
    return true;
  }), [tasks, priorityFilter, categoryFilter, search, dueFilter]);

  const task = selectedTask ? tasks.find(tk => tk.id === selectedTask) : null;

  // Timeline grouping: only active (non-completed, non-cancelled) tasks
  const timelineGroups = useMemo(() => {
    const activeTasks = filtered.filter(tk => tk.status !== 'completed' && tk.status !== 'cancelled');
    const groups: Record<TimeGroup, typeof activeTasks> = {
      overdue: [], today: [], tomorrow: [], this_week: [], next_week: [], later: [], no_date: [],
    };
    for (const tk of activeTasks) {
      const group = getTimeGroup(tk.dueDate);
      groups[group].push(tk);
    }
    // Sort each group by priority
    for (const key of TIME_GROUP_ORDER) {
      groups[key].sort((a, b) => (PRIORITY_ORDER[a.priority] ?? 99) - (PRIORITY_ORDER[b.priority] ?? 99));
    }
    return groups;
  }, [filtered]);

  const timeGroupLabels: Record<TimeGroup, string> = useMemo(() => ({
    overdue: t.common.overdue,
    today: lang === 'lt' ? 'Šiandien' : 'Today',
    tomorrow: lang === 'lt' ? 'Rytoj' : 'Tomorrow',
    this_week: t.dashboard.upcomingThisWeek,
    next_week: lang === 'lt' ? 'Kita savaitė' : 'Next Week',
    later: lang === 'lt' ? 'Vėliau' : 'Later',
    no_date: lang === 'lt' ? 'Be datos' : 'No Date',
  }), [t, lang]);

  // Drag handlers
  const handleDragStart = useCallback((e: React.DragEvent, taskId: string) => {
    setDraggedTaskId(taskId);
    dragStartPos.current = { x: e.clientX, y: e.clientY };
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', taskId);
    // Make the ghost slightly transparent
    if (e.currentTarget instanceof HTMLElement) {
      requestAnimationFrame(() => {
        (e.target as HTMLElement).style.opacity = '0.4';
      });
    }
  }, []);

  const handleDragEnd = useCallback((e: React.DragEvent) => {
    (e.target as HTMLElement).style.opacity = '1';
    setDraggedTaskId(null);
    setDragOverColumn(null);
    dragStartPos.current = null;
  }, []);

  const handleColumnDragOver = useCallback((e: React.DragEvent, columnKey: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverColumn(columnKey);
  }, []);

  const handleColumnDragLeave = useCallback((e: React.DragEvent) => {
    // Only clear if leaving the column itself, not entering a child
    const relatedTarget = e.relatedTarget as HTMLElement | null;
    if (!relatedTarget || !e.currentTarget.contains(relatedTarget)) {
      setDragOverColumn(null);
    }
  }, []);

  const handleColumnDrop = useCallback((e: React.DragEvent, columnKey: string) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain');
    if (taskId) {
      const droppedTask = tasks.find(tk => tk.id === taskId);
      if (droppedTask && droppedTask.status !== columnKey) {
        updateTask(taskId, {
          status: columnKey as any,
          completedAt: columnKey === 'completed' ? new Date().toISOString() : droppedTask.completedAt,
        });
        toast.success(columnKey === 'completed' ? t.toast.taskCompleted : t.toast.taskMoved);
      }
    }
    setDraggedTaskId(null);
    setDragOverColumn(null);
  }, [tasks, updateTask, toast, t]);

  const handleAdd = () => {
    if (!form.title.trim()) return;
    const client = clients.find(c => c.id === form.clientId);
    addTask({
      title: form.title, description: form.description, priority: form.priority, status: form.status,
      clientId: form.clientId || undefined, clientName: client?.companyName,
      category: form.category, dueDate: form.dueDate || undefined, dueTime: form.dueTime || undefined,
      isRecurring: form.isRecurring, recurringInterval: form.recurringInterval || undefined, notes: form.notes,
      checklistItems: form.checklistItems ? form.checklistItems.split('\n').filter(Boolean).map(text => ({ id: generateId(), text: text.trim(), completed: false })) : undefined,
    });
    setShowAdd(false);
    setSearchParams({});
    setForm({ title: '', description: '', priority: 'medium', status: 'todo', clientId: '', category: 'follow-up', dueDate: '', dueTime: '', isRecurring: false, recurringInterval: '', notes: '', checklistItems: '' });
    toast.success(t.toast.taskCreated);
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t.tasks.title}</h1>
          <p className="text-sm text-slate-500 mt-1">{tasks.filter(tk => tk.status !== 'completed' && tk.status !== 'cancelled').length} {t.tasks.openTasks}</p>
        </div>
        <div className="flex gap-2">
          <div className="flex rounded-lg border border-slate-200 overflow-hidden">
            <button onClick={() => setView('kanban')} className={`px-3 py-1.5 text-xs font-medium ${view === 'kanban' ? 'bg-primary-50 text-primary-700' : 'text-slate-500 hover:bg-slate-50'}`}><LayoutGrid size={14} /></button>
            <button onClick={() => setView('timeline')} className={`px-3 py-1.5 text-xs font-medium ${view === 'timeline' ? 'bg-primary-50 text-primary-700' : 'text-slate-500 hover:bg-slate-50'}`}><Clock size={14} /></button>
            <button onClick={() => setView('list')} className={`px-3 py-1.5 text-xs font-medium ${view === 'list' ? 'bg-primary-50 text-primary-700' : 'text-slate-500 hover:bg-slate-50'}`}><List size={14} /></button>
          </div>
          <button className="btn-primary" onClick={() => setShowAdd(true)}><Plus size={16} /> {t.tasks.newTask}</button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input className="input pl-9" placeholder={t.tasks.searchTasks} value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="select w-32" value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
          <option value="all">{t.tasks.allPriority}</option>
          <option value="urgent">{t.tasks.urgent}</option><option value="high">{t.tasks.high}</option><option value="medium">{t.tasks.medium}</option><option value="low">{t.tasks.low}</option>
        </select>
        <select className="select w-36" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
          <option value="all">{t.tasks.allCategories}</option>
          <option value="contract">{t.tasks.contract}</option><option value="account">{t.tasks.account}</option><option value="follow-up">{t.tasks.followUp}</option>
          <option value="onboarding">{t.tasks.onboarding}</option><option value="document">{t.tasks.document}</option><option value="communication">{t.tasks.communication}</option>
        </select>
        {dueFilter === 'today' && (
          <button
            onClick={() => { setDueFilter('all'); setSearchParams({}); }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full bg-danger-50 text-danger-700 ring-1 ring-danger-200 hover:bg-danger-100 transition-colors"
          >
            {t.dashboard.todaysPriorities}
            <X size={12} />
          </button>
        )}
      </div>

      {/* Kanban View */}
      {view === 'kanban' && (
        <div className="grid grid-cols-5 gap-4">
          {statusColumns.map(col => {
            const colTasks = filtered.filter(fk => fk.status === col.key);
            const isDropTarget = dragOverColumn === col.key && draggedTaskId !== null;
            const draggedIsInThisCol = draggedTaskId ? colTasks.some(fk => fk.id === draggedTaskId) : false;

            return (
              <div
                key={col.key}
                className={`rounded-xl p-3 min-h-[200px] transition-all duration-150 bg-slate-50/50 border border-slate-100 ${
                  isDropTarget && !draggedIsInThisCol
                    ? 'ring-2 ring-primary-300 ring-offset-1 bg-primary-50/30'
                    : ''
                }`}
                onDragOver={(e) => handleColumnDragOver(e, col.key)}
                onDragLeave={handleColumnDragLeave}
                onDrop={(e) => handleColumnDrop(e, col.key)}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${col.dotColor}`} />
                    <h3 className="text-xs font-semibold text-slate-600 uppercase">{col.label}</h3>
                  </div>
                  <span className="text-xs text-slate-400 px-1.5 py-0.5 rounded-full">{colTasks.length}</span>
                </div>
                <div className="space-y-2">
                  {colTasks.map(tk => {
                    const isDragging = draggedTaskId === tk.id;
                    return (
                      <div
                        key={tk.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, tk.id)}
                        onDragEnd={handleDragEnd}
                        onClick={(e) => {
                          // Only open detail if this wasn't a drag
                          if (!dragStartPos.current) { setSelectedTask(tk.id); return; }
                          const dx = Math.abs(e.clientX - (dragStartPos.current?.x || 0));
                          const dy = Math.abs(e.clientY - (dragStartPos.current?.y || 0));
                          if (dx < 5 && dy < 5) setSelectedTask(tk.id);
                        }}
                        className={`bg-white rounded-lg border border-slate-100 p-3 cursor-grab active:cursor-grabbing shadow-sm hover:shadow transition-all duration-150 select-none ${
                          isDragging ? 'opacity-40 scale-95 shadow-none' : ''
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <GripVertical size={14} className="text-slate-300 mt-0.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ opacity: isDragging ? 0 : undefined }} />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-slate-900 mb-1">{tk.title}</div>
                            {tk.clientName && <div className="text-xs text-slate-500 mb-2">{tk.clientName}</div>}
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <PriorityBadge priority={tk.priority} />
                              {tk.dueDate && (
                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                                  isOverdue(tk.dueDate) ? 'bg-danger-100 text-danger-700' :
                                  isDueToday(tk.dueDate) ? 'bg-amber-100 text-amber-700' :
                                  'bg-slate-100 text-slate-600'
                                }`}>
                                  {formatRelative(tk.dueDate)}
                                </span>
                              )}
                            </div>
                            {tk.checklistItems && tk.checklistItems.length > 0 && (
                              <div className="text-[10px] text-slate-400 mt-2">
                                {tk.checklistItems.filter(ci => ci.completed).length}/{tk.checklistItems.length} {t.common.doneCount}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {/* Drop zone placeholder when column is empty or drag target */}
                  {isDropTarget && !draggedIsInThisCol && colTasks.length === 0 && (
                    <div className="border-2 border-dashed border-primary-200 rounded-xl p-4 text-center text-xs text-primary-300 font-medium">
                      ↓
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Timeline View */}
      {view === 'timeline' && (
        <div className="space-y-6">
          {TIME_GROUP_ORDER.map(groupKey => {
            const groupTasks = timelineGroups[groupKey];
            if (groupTasks.length === 0) return null;
            return (
              <div key={groupKey}>
                <div className="flex items-center gap-2 mb-3">
                  <span className={`w-2.5 h-2.5 rounded-full ${TIME_GROUP_INDICATOR[groupKey]}`} />
                  <h3 className="text-sm font-semibold text-slate-700">{timeGroupLabels[groupKey]}</h3>
                  <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{groupTasks.length}</span>
                </div>
                <div className="card overflow-hidden">
                  <div className="divide-y divide-slate-100">
                    {groupTasks.map(tk => (
                      <div
                        key={tk.id}
                        className="flex items-center gap-4 px-4 py-3 hover:bg-slate-50 cursor-pointer transition-colors"
                        onClick={() => setSelectedTask(tk.id)}
                      >
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-medium text-slate-900">{tk.title}</span>
                        </div>
                        <div className="text-xs text-slate-500 w-32 truncate text-right">
                          {tk.clientName || '—'}
                        </div>
                        <div className="w-20">
                          <PriorityBadge priority={tk.priority} />
                        </div>
                        <div className="w-24 text-right">
                          {tk.dueDate ? (
                            <span className={`text-xs ${
                              isOverdue(tk.dueDate) ? 'text-danger-600 font-medium' :
                              isDueToday(tk.dueDate) ? 'text-amber-600 font-medium' :
                              'text-slate-500'
                            }`}>
                              {formatDate(tk.dueDate)}
                              {tk.dueTime && <span className="ml-1">{tk.dueTime}</span>}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400">—</span>
                          )}
                        </div>
                        <div className="w-24">
                          <StatusBadge status={tk.status} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
          {TIME_GROUP_ORDER.every(g => timelineGroups[g].length === 0) && (
            <div className="p-8 text-center text-sm text-slate-500">{t.tasks.noTasksMatch}</div>
          )}
        </div>
      )}

      {/* List View */}
      {view === 'list' && (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase w-8"></th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">{t.tasks.task}</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">{t.common.client}</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">{t.common.priority}</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">{t.common.status}</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">{t.common.category}</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">{t.tasks.dueDate}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(tk => (
                <tr key={tk.id} className="hover:bg-slate-50 cursor-pointer" onClick={() => setSelectedTask(tk.id)}>
                  <td className="px-4 py-3">
                    <button onClick={(e) => { e.stopPropagation(); updateTask(tk.id, { status: tk.status === 'completed' ? 'todo' : 'completed', completedAt: tk.status === 'completed' ? undefined : new Date().toISOString() }); }}
                      className="text-slate-400 hover:text-success-500">
                      {tk.status === 'completed' ? <CheckCircle2 size={18} className="text-success-500" /> : <Circle size={18} />}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-slate-900">{tk.title}{tk.isRecurring && <RotateCcw size={12} className="inline ml-1 text-slate-400" />}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{tk.clientName || '—'}</td>
                  <td className="px-4 py-3"><PriorityBadge priority={tk.priority} /></td>
                  <td className="px-4 py-3"><StatusBadge status={tk.status} /></td>
                  <td className="px-4 py-3 text-sm text-slate-600">{tk.category}</td>
                  <td className="px-4 py-3">
                    {tk.dueDate ? (
                      <span className={`text-sm ${isOverdue(tk.dueDate) ? 'text-danger-600 font-medium' : isDueToday(tk.dueDate) ? 'text-amber-600' : 'text-slate-600'}`}>
                        {formatDate(tk.dueDate)}
                      </span>
                    ) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <div className="p-8 text-center text-sm text-slate-500">{t.tasks.noTasksMatch}</div>}
        </div>
      )}

      {/* Task Detail Modal */}
      <Modal isOpen={!!task} onClose={() => setSelectedTask(null)} title={task?.title || ''} size="lg"
        footer={task ? <>
          <button className="btn-danger btn-sm" onClick={() => { deleteTask(task.id); setSelectedTask(null); toast.success(t.toast.taskDeleted); }}><Trash2 size={14} /> {t.common.delete}</button>
          <div className="flex-1" />
          <button className="btn-secondary" onClick={() => setSelectedTask(null)}>{t.common.close}</button>
          {task.status !== 'completed' && <button className="btn-primary" onClick={() => { updateTask(task.id, { status: 'completed', completedAt: new Date().toISOString() }); setSelectedTask(null); toast.success(t.toast.taskCompleted); }}>{t.tasks.markComplete}</button>}
        </> : undefined}
      >
        {task && (
          <div className="space-y-4">
            <div className="flex gap-2 flex-wrap">
              <PriorityBadge priority={task.priority} />
              <StatusBadge status={task.status} />
              {task.isRecurring && <span className="badge-purple"><RotateCcw size={10} className="mr-1" />{task.recurringInterval}</span>}
              <span className="badge-gray">{task.category}</span>
            </div>
            {task.description && <p className="text-sm text-slate-700">{task.description}</p>}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-slate-500">{t.common.client}:</span> <span className="text-slate-900">{task.clientName || '—'}</span></div>
              <div>
                <span className="text-slate-500">{t.tasks.dueDate}:</span>{' '}
                <span className={`${isOverdue(task.dueDate) ? 'text-danger-600 font-medium' : 'text-slate-900'}`}>
                  {formatDate(task.dueDate)}
                  {task.dueTime && <span className="ml-1 text-slate-500">({task.dueTime})</span>}
                </span>
              </div>
            </div>

            <div>
              <label className="label">{t.common.status}</label>
              <select className="select w-48" value={task.status} onChange={(e) => updateTask(task.id, { status: e.target.value as any })}>
                <option value="todo">{t.tasks.toDo}</option><option value="in_progress">{t.tasks.inProgress}</option><option value="waiting">{t.tasks.waiting}</option>
                <option value="blocked">{t.tasks.blocked}</option><option value="completed">{t.tasks.completed}</option>
              </select>
            </div>

            {task.checklistItems && task.checklistItems.length > 0 && (
              <div>
                <label className="label">{t.tasks.checklist} ({task.checklistItems.filter(ci => ci.completed).length}/{task.checklistItems.length})</label>
                <div className="space-y-1">
                  {task.checklistItems.map(ci => (
                    <label key={ci.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-50 cursor-pointer">
                      <input type="checkbox" checked={ci.completed} onChange={() => toggleTaskChecklistItem(task.id, ci.id)}
                        className="w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500" />
                      <span className={`text-sm ${ci.completed ? 'line-through text-slate-400' : 'text-slate-700'}`}>{ci.text}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {task.notes && (
              <div>
                <label className="label">{t.common.notes}</label>
                <div className="text-sm text-slate-700 bg-slate-50 p-3 rounded-lg whitespace-pre-wrap">{task.notes}</div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Add Task Modal */}
      <Modal isOpen={showAdd} onClose={() => { setShowAdd(false); setSearchParams({}); }} title={t.tasks.newTask} size="lg"
        footer={<><button className="btn-secondary" onClick={() => { setShowAdd(false); setSearchParams({}); }}>{t.common.cancel}</button><button className="btn-primary" onClick={handleAdd}>{t.tasks.createTask}</button></>}
      >
        <div className="space-y-4">
          <div><label className="label">{t.common.title} *</label><input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
          <div><label className="label">{t.common.description}</label><textarea className="textarea" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          <div className="grid grid-cols-4 gap-4">
            <div><label className="label">{t.common.priority}</label><select className="select" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}><option value="urgent">{t.tasks.urgent}</option><option value="high">{t.tasks.high}</option><option value="medium">{t.tasks.medium}</option><option value="low">{t.tasks.low}</option></select></div>
            <div><label className="label">{t.common.category}</label><select className="select" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}><option value="follow-up">{t.tasks.followUp}</option><option value="contract">{t.tasks.contract}</option><option value="account">{t.tasks.account}</option><option value="document">{t.tasks.document}</option><option value="communication">{t.tasks.communication}</option><option value="onboarding">{t.tasks.onboarding}</option><option value="other">{t.tasks.other}</option></select></div>
            <div><label className="label">{t.tasks.dueDate}</label><input className="input" type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} /></div>
            <div><label className="label">{lang === 'lt' ? 'Laikas' : 'Time'}</label><input className="input" type="time" value={form.dueTime} onChange={(e) => setForm({ ...form, dueTime: e.target.value })} /></div>
          </div>
          <div><label className="label">{t.tasks.clientOptional}</label>
            <select className="select" value={form.clientId} onChange={(e) => setForm({ ...form, clientId: e.target.value })}>
              <option value="">{t.common.noClient}</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.companyName}</option>)}
            </select>
          </div>
          <div><label className="label">{t.tasks.checklistItems}</label><textarea className="textarea" rows={3} value={form.checklistItems} onChange={(e) => setForm({ ...form, checklistItems: e.target.value })} /></div>
          <div><label className="label">{t.common.notes}</label><textarea className="textarea" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
        </div>
      </Modal>
    </div>
  );
}
