import { useState, useMemo } from 'react';
import { Plus, Edit2, Trash2, Target, CalendarDays } from 'lucide-react';
import useStore from '../stores/useStore';
import useAuthStore from '../stores/useAuthStore';
import useToastStore from '../stores/useToastStore';
import { useTranslation } from '../i18n/useTranslation';
import { formatDate, isOverdue } from '../utils/helpers';
import Modal from '../components/ui/Modal';
import VisibilityPicker from '../components/ui/VisibilityPicker';
import type { GoalPeriod, GoalStatus, Visibility } from '../types';

const PERIOD_ORDER: GoalPeriod[] = ['month', 'half_year', 'year'];

export default function Goals() {
  const { goals, addGoal, updateGoal, deleteGoal } = useStore();
  const currentUser = useAuthStore(s => s.getCurrentUser());
  const { t, lang } = useTranslation();
  const toast = useToastStore();

  const [periodFilter, setPeriodFilter] = useState<'all' | GoalPeriod>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | GoalStatus>('all');
  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: '',
    period: 'month' as GoalPeriod,
    status: 'in_progress' as GoalStatus,
    reflection: '',
    targetDate: '',
    visibility: 'team' as Visibility,
    sharedWith: [] as string[],
  });

  const periodLabel = (p: GoalPeriod): string => {
    const map: Record<GoalPeriod, string> = { month: t.goals.month, half_year: t.goals.halfYear, year: t.goals.year };
    return map[p];
  };

  const statusLabel = (s: GoalStatus): string => {
    const map: Record<GoalStatus, string> = {
      in_progress: t.goals.inProgress, completed: t.goals.completed,
      partially_completed: t.goals.partiallyCompleted, not_completed: t.goals.notCompleted,
    };
    return map[s];
  };

  const statusStyle = (s: GoalStatus): string => {
    const map: Record<GoalStatus, string> = {
      in_progress: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200',
      completed: 'bg-green-50 text-green-700 ring-1 ring-green-200',
      partially_completed: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
      not_completed: 'bg-slate-100 text-slate-500 ring-1 ring-slate-200',
    };
    return map[s];
  };

  const filtered = useMemo(() => {
    return goals
      .filter(g => {
        if (periodFilter !== 'all' && g.period !== periodFilter) return false;
        if (statusFilter !== 'all' && g.status !== statusFilter) return false;
        return true;
      })
      .sort((a, b) => {
        const pw: Record<string, number> = { year: 0, half_year: 1, month: 2 };
        const periodDiff = (pw[a.period] ?? 2) - (pw[b.period] ?? 2);
        if (periodDiff !== 0) return periodDiff;
        return b.createdAt.localeCompare(a.createdAt);
      });
  }, [goals, periodFilter, statusFilter]);

  const resetForm = () => {
    setForm({ title: '', period: 'month', status: 'in_progress', reflection: '', targetDate: '', visibility: 'team', sharedWith: [] });
  };

  const handleSave = async () => {
    if (!form.title.trim()) return;
    try {
      if (editId) {
        await updateGoal(editId, {
          title: form.title, period: form.period, status: form.status,
          reflection: form.reflection, targetDate: form.targetDate || undefined,
        });
        toast.success(t.toast.changesSaved);
      } else {
        await addGoal({
          title: form.title, period: form.period, status: form.status,
          reflection: form.reflection, targetDate: form.targetDate || undefined,
          userId: currentUser?.id || '', userName: currentUser?.displayName || '',
          visibility: form.visibility, sharedWith: form.sharedWith,
        });
        toast.success(t.toast.entryCreated);
      }
      setShowAdd(false);
      setEditId(null);
      resetForm();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save');
    }
  };

  const startEdit = (g: typeof goals[0]) => {
    setForm({
      title: g.title, period: g.period, status: g.status,
      reflection: g.reflection, targetDate: g.targetDate || '',
      visibility: 'team', sharedWith: [],
    });
    setEditId(g.id);
    setShowAdd(true);
  };

  const groupedByPeriod = useMemo(() => {
    const groups: Record<GoalPeriod, typeof filtered> = { year: [], half_year: [], month: [] };
    for (const g of filtered) groups[g.period].push(g);
    return groups;
  }, [filtered]);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t.goals.title}</h1>
          <p className="text-sm text-slate-500 mt-1">{t.goals.subtitle}</p>
        </div>
        <button className="btn-primary" onClick={() => { setEditId(null); resetForm(); setShowAdd(true); }}>
          <Plus size={16} /> {t.goals.newGoal}
        </button>
      </div>

      <p className="text-xs text-slate-400 mb-6 italic">{t.goals.motivationLine}</p>

      {/* Filters */}
      {goals.length > 0 && (
        <div className="flex items-center gap-3 mb-6">
          <select name="periodFilter" className="select w-full sm:w-40" value={periodFilter} onChange={(e) => setPeriodFilter(e.target.value as any)}>
            <option value="all">{t.goals.allPeriods}</option>
            <option value="month">{t.goals.month}</option>
            <option value="half_year">{t.goals.halfYear}</option>
            <option value="year">{t.goals.year}</option>
          </select>
          <select name="statusFilter" className="select w-full sm:w-44" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)}>
            <option value="all">{t.goals.allStatuses}</option>
            <option value="in_progress">{t.goals.inProgress}</option>
            <option value="completed">{t.goals.completed}</option>
            <option value="partially_completed">{t.goals.partiallyCompleted}</option>
            <option value="not_completed">{t.goals.notCompleted}</option>
          </select>
        </div>
      )}

      {/* Empty */}
      {goals.length === 0 && (
        <div className="text-center py-16">
          <Target size={32} className="text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-slate-500">{t.goals.noGoals}</p>
        </div>
      )}
      {goals.length > 0 && filtered.length === 0 && (
        <div className="text-center py-12 text-sm text-slate-500">{t.goals.noGoalsMatch}</div>
      )}

      {/* Goals cards */}
      {filtered.length > 0 && (
        <div className="space-y-8">
          {PERIOD_ORDER.filter(p => periodFilter === 'all' || periodFilter === p).map(period => {
            const periodGoals = groupedByPeriod[period];
            if (periodGoals.length === 0) return null;
            return (
              <div key={period}>
                <div className="flex items-center gap-2 mb-3">
                  <h2 className="text-sm font-semibold text-slate-700">{periodLabel(period)}</h2>
                  <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{periodGoals.length}</span>
                </div>
                <div className="space-y-3">
                  {periodGoals.map(goal => {
                    const overdue = goal.targetDate && isOverdue(goal.targetDate) && goal.status === 'in_progress';
                    return (
                      <div key={goal.id} className="card p-4 group hover:shadow-md transition-shadow">
                        <div className="flex items-start gap-3">
                          {/* Left: content */}
                          <div className="flex-1 min-w-0">
                            {/* Title + status */}
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-base font-semibold text-slate-900">{goal.title}</span>
                              <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${statusStyle(goal.status)}`}>
                                {statusLabel(goal.status)}
                              </span>
                            </div>

                            {/* Target date */}
                            {goal.targetDate && (
                              <div className={`flex items-center gap-1.5 mt-1.5 text-xs font-medium ${overdue ? 'text-danger-600' : 'text-slate-600'}`}>
                                <CalendarDays size={12} />
                                <span>{lang === 'lt' ? 'Terminas' : 'Deadline'}: {formatDate(goal.targetDate)}</span>
                                {overdue && <span className="text-[10px] uppercase font-bold text-danger-600 ml-1">{t.common.overdue}</span>}
                              </div>
                            )}

                            {/* Reflection */}
                            {goal.reflection && (
                              <p className="text-sm text-slate-500 mt-2 line-clamp-2">{goal.reflection}</p>
                            )}

                            {/* Meta row */}
                            <div className="flex items-center gap-3 mt-2">
                              <span className="text-[10px] text-slate-400">{goal.userName}</span>
                              <span className="text-[10px] text-slate-400">{formatDate(goal.createdAt)}</span>
                            </div>
                          </div>

                          {/* Right: actions */}
                          <div className="flex gap-1 flex-shrink-0 opacity-60 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                            <button onClick={() => startEdit(goal)} className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-600">
                              <Edit2 size={14} />
                            </button>
                            <button onClick={async () => { await deleteGoal(goal.id); toast.success(t.toast.entryDeleted); }} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-danger-600">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Modal */}
      <Modal
        isOpen={showAdd}
        onClose={() => { setShowAdd(false); setEditId(null); }}
        title={editId ? t.goals.editGoal : t.goals.newGoal}
        size="md"
        footer={<>
          <button className="btn-secondary" onClick={() => { setShowAdd(false); setEditId(null); }}>{t.common.cancel}</button>
          <button className="btn-primary" onClick={handleSave} disabled={!form.title.trim()}>{t.common.save}</button>
        </>}
      >
        <div className="space-y-4">
          <div>
            <label className="label">{t.goals.goalTitle} *</label>
            <input name="title" className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} autoFocus />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="label">{t.goals.period}</label>
              <select name="period" className="select" value={form.period} onChange={(e) => setForm({ ...form, period: e.target.value as GoalPeriod })}>
                <option value="month">{t.goals.month}</option>
                <option value="half_year">{t.goals.halfYear}</option>
                <option value="year">{t.goals.year}</option>
              </select>
            </div>
            <div>
              <label className="label">{t.goals.status}</label>
              <select name="status" className="select" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as GoalStatus })}>
                <option value="in_progress">{t.goals.inProgress}</option>
                <option value="completed">{t.goals.completed}</option>
                <option value="partially_completed">{t.goals.partiallyCompleted}</option>
                <option value="not_completed">{t.goals.notCompleted}</option>
              </select>
            </div>
            <div>
              <label className="label">{lang === 'lt' ? 'Terminas' : 'Deadline'}</label>
              <input name="targetDate" type="date" className="input" value={form.targetDate} onChange={(e) => setForm({ ...form, targetDate: e.target.value })} />
            </div>
          </div>

          <div>
            <label className="label">{t.goals.reflection}</label>
            <textarea
              name="reflection"
              className="textarea"
              rows={3}
              value={form.reflection}
              onChange={(e) => setForm({ ...form, reflection: e.target.value })}
              placeholder={t.goals.reflectionPlaceholder}
            />
          </div>
          {!editId && <VisibilityPicker value={{ visibility: form.visibility, sharedWith: form.sharedWith }} onChange={(v) => setForm({ ...form, ...v })} />}
        </div>
      </Modal>
    </div>
  );
}
