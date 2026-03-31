import { useState, useMemo } from 'react';
import { Plus, Edit2, Trash2, Target, CalendarDays, TrendingUp, Users, PhoneCall, Layers } from 'lucide-react';
import useStore from '../stores/useStore';
import useAuthStore from '../stores/useAuthStore';
import useToastStore from '../stores/useToastStore';
import { useTranslation } from '../i18n/useTranslation';
import { formatDate, isOverdue } from '../utils/helpers';
import Modal from '../components/ui/Modal';
import VisibilityPicker from '../components/ui/VisibilityPicker';
import type { GoalPeriod, GoalStatus, GoalType, Visibility } from '../types';

const PERIOD_ORDER: GoalPeriod[] = ['month', 'half_year', 'year'];

function formatValue(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(v >= 10_000 ? 0 : 1)}k`;
  return String(v);
}

export default function Goals() {
  const { goals, addGoal, updateGoal, deleteGoal } = useStore();
  const currentUser = useAuthStore(s => s.getCurrentUser());
  const { t, lang } = useTranslation();
  const toast = useToastStore();

  const [periodFilter, setPeriodFilter] = useState<'all' | GoalPeriod>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | GoalStatus>('all');
  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [progressEdit, setProgressEdit] = useState<{ id: string; value: string } | null>(null);

  const emptyForm = {
    title: '', period: 'month' as GoalPeriod, status: 'in_progress' as GoalStatus,
    goalType: 'revenue' as GoalType, targetValue: '', currentValue: '',
    reflection: '', targetDate: '',
    visibility: 'team' as Visibility, sharedWith: [] as string[],
  };
  const [form, setForm] = useState(emptyForm);

  const periodLabel = (p: GoalPeriod) => ({ month: t.goals.month, half_year: t.goals.halfYear, year: t.goals.year }[p]);

  const statusLabel = (s: GoalStatus) => ({
    in_progress: t.goals.inProgress, completed: t.goals.completed,
    partially_completed: t.goals.partiallyCompleted, not_completed: t.goals.notCompleted,
  }[s]);

  const statusColor = (s: GoalStatus) => ({
    in_progress: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200',
    completed: 'bg-green-50 text-green-700 ring-1 ring-green-200',
    partially_completed: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
    not_completed: 'bg-slate-100 text-slate-500 ring-1 ring-slate-200',
  }[s]);

  const typeLabel = (gt: GoalType) => ({
    revenue: lang === 'lt' ? 'Pajamos' : 'Revenue',
    growth: lang === 'lt' ? 'Augimas' : 'Growth',
    activity: lang === 'lt' ? 'Aktyvumas' : 'Activity',
    custom: lang === 'lt' ? 'Kita' : 'Custom',
  }[gt]);

  const TypeIcon = ({ type }: { type: GoalType }) => {
    if (type === 'revenue') return <TrendingUp size={12} />;
    if (type === 'growth') return <Users size={12} />;
    if (type === 'activity') return <PhoneCall size={12} />;
    return <Layers size={12} />;
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
        const d = (pw[a.period] ?? 2) - (pw[b.period] ?? 2);
        return d !== 0 ? d : b.createdAt.localeCompare(a.createdAt);
      });
  }, [goals, periodFilter, statusFilter]);

  const handleSave = async () => {
    if (!form.title.trim()) return;
    try {
      const shared = {
        title: form.title, period: form.period, status: form.status,
        goalType: form.goalType,
        targetValue: Number(form.targetValue) || 0,
        currentValue: Number(form.currentValue) || 0,
        reflection: form.reflection,
        targetDate: form.targetDate || undefined,
      };
      if (editId) {
        await updateGoal(editId, shared);
        toast.success(t.toast.changesSaved);
      } else {
        await addGoal({
          ...shared,
          userId: currentUser?.id || '', userName: currentUser?.displayName || '',
          visibility: form.visibility, sharedWith: form.sharedWith,
        });
        toast.success(t.toast.entryCreated);
      }
      setShowAdd(false);
      setEditId(null);
      setForm(emptyForm);
    } catch (err: any) {
      toast.error(err.message || 'Failed to save');
    }
  };

  const startEdit = (g: typeof goals[0]) => {
    setForm({
      title: g.title, period: g.period, status: g.status,
      goalType: g.goalType, targetValue: String(g.targetValue || ''),
      currentValue: String(g.currentValue || ''),
      reflection: g.reflection, targetDate: g.targetDate || '',
      visibility: 'team', sharedWith: [],
    });
    setEditId(g.id);
    setShowAdd(true);
  };

  const handleProgressSave = async () => {
    if (!progressEdit) return;
    const val = Number(progressEdit.value) || 0;
    try {
      await updateGoal(progressEdit.id, { currentValue: val });
      toast.success(t.toast.changesSaved);
      setProgressEdit(null);
    } catch (err: any) {
      toast.error(err.message || 'Failed to update');
    }
  };

  const groupedByPeriod = useMemo(() => {
    const groups: Record<GoalPeriod, typeof filtered> = { year: [], half_year: [], month: [] };
    for (const g of filtered) groups[g.period].push(g);
    return groups;
  }, [filtered]);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t.goals.title}</h1>
          <p className="text-sm text-slate-500 mt-1">{t.goals.subtitle}</p>
        </div>
        <button className="btn-primary" onClick={() => { setEditId(null); setForm(emptyForm); setShowAdd(true); }}>
          <Plus size={16} /> {t.goals.newGoal}
        </button>
      </div>

      {/* Filters */}
      {goals.length > 0 && (
        <div className="flex items-center gap-3 mb-6 flex-wrap">
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

      {/* Goal cards grouped by period */}
      {filtered.length > 0 && (
        <div className="space-y-8">
          {PERIOD_ORDER.filter(p => periodFilter === 'all' || periodFilter === p).map(period => {
            const pg = groupedByPeriod[period];
            if (pg.length === 0) return null;
            return (
              <div key={period}>
                <div className="flex items-center gap-2 mb-3">
                  <h2 className="text-sm font-semibold text-slate-700">{periodLabel(period)}</h2>
                  <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{pg.length}</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {pg.map(goal => {
                    const pct = goal.targetValue > 0 ? Math.min(Math.round((goal.currentValue / goal.targetValue) * 100), 100) : 0;
                    const overdue = goal.targetDate && isOverdue(goal.targetDate) && goal.status === 'in_progress';
                    const barColor = pct >= 100 ? 'bg-success-500' : pct >= 50 ? 'bg-primary-500' : 'bg-amber-500';
                    const isEditingProgress = progressEdit?.id === goal.id;

                    return (
                      <div key={goal.id} className="card p-4 group hover:shadow-md transition-shadow flex flex-col">
                        {/* Header: title + actions */}
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-base font-semibold text-slate-900 leading-snug">{goal.title}</h3>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${statusColor(goal.status)}`}>{statusLabel(goal.status)}</span>
                              <span className="text-[10px] text-slate-400 flex items-center gap-0.5"><TypeIcon type={goal.goalType} /> {typeLabel(goal.goalType)}</span>
                            </div>
                          </div>
                          <div className="flex gap-1 flex-shrink-0 opacity-60 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                            <button onClick={() => startEdit(goal)} className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-600"><Edit2 size={14} /></button>
                            <button onClick={async () => { await deleteGoal(goal.id); toast.success(t.toast.entryDeleted); }} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-danger-600"><Trash2 size={14} /></button>
                          </div>
                        </div>

                        {/* Progress bar */}
                        {goal.targetValue > 0 && (
                          <div className="mb-3">
                            <div className="flex items-baseline justify-between mb-1">
                              <span className="text-2xl font-bold text-slate-900">{pct}%</span>
                              <span className="text-xs text-slate-500">
                                {formatValue(goal.currentValue)} / {formatValue(goal.targetValue)}
                              </span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-2.5">
                              <div className={`h-2.5 rounded-full transition-all duration-500 ${barColor}`} style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        )}

                        {/* Quick progress update */}
                        {goal.targetValue > 0 && goal.status === 'in_progress' && (
                          <div className="mb-3">
                            {isEditingProgress ? (
                              <div className="flex items-center gap-2">
                                <input
                                  type="number"
                                  name="progressValue"
                                  className="input flex-1 text-sm"
                                  value={progressEdit.value}
                                  onChange={(e) => setProgressEdit({ ...progressEdit, value: e.target.value })}
                                  autoFocus
                                  onKeyDown={(e) => { if (e.key === 'Enter') handleProgressSave(); if (e.key === 'Escape') setProgressEdit(null); }}
                                />
                                <button className="btn-primary btn-sm" onClick={handleProgressSave}>{t.common.save}</button>
                                <button className="btn-ghost btn-sm" onClick={() => setProgressEdit(null)}>{t.common.cancel}</button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setProgressEdit({ id: goal.id, value: String(goal.currentValue) })}
                                className="text-xs text-primary-600 hover:text-primary-700 font-medium hover:underline"
                              >
                                {lang === 'lt' ? 'Atnaujinti progresą' : 'Update progress'} →
                              </button>
                            )}
                          </div>
                        )}

                        {/* Deadline */}
                        {goal.targetDate && (
                          <div className={`flex items-center gap-1.5 text-xs font-medium mb-2 ${overdue ? 'text-danger-600' : 'text-slate-500'}`}>
                            <CalendarDays size={12} />
                            <span>{formatDate(goal.targetDate)}</span>
                            {overdue && <span className="text-[10px] uppercase font-bold text-danger-600">{t.common.overdue}</span>}
                          </div>
                        )}

                        {/* Reflection */}
                        {goal.reflection && (
                          <p className="text-xs text-slate-400 mt-auto pt-2 border-t border-slate-100 line-clamp-2">{goal.reflection}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Modal */}
      <Modal
        isOpen={showAdd}
        onClose={() => { setShowAdd(false); setEditId(null); }}
        title={editId ? t.goals.editGoal : t.goals.newGoal}
        size="lg"
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">{lang === 'lt' ? 'Tipas' : 'Type'}</label>
              <select name="goalType" className="select" value={form.goalType} onChange={(e) => setForm({ ...form, goalType: e.target.value as GoalType })}>
                <option value="revenue">{lang === 'lt' ? 'Pajamos' : 'Revenue'}</option>
                <option value="growth">{lang === 'lt' ? 'Augimas' : 'Growth'}</option>
                <option value="activity">{lang === 'lt' ? 'Aktyvumas' : 'Activity'}</option>
                <option value="custom">{lang === 'lt' ? 'Kita' : 'Custom'}</option>
              </select>
            </div>
            <div>
              <label className="label">{t.goals.period}</label>
              <select name="period" className="select" value={form.period} onChange={(e) => setForm({ ...form, period: e.target.value as GoalPeriod })}>
                <option value="month">{t.goals.month}</option>
                <option value="half_year">{t.goals.halfYear}</option>
                <option value="year">{t.goals.year}</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="label">{lang === 'lt' ? 'Tikslas (skaičius)' : 'Target value'}</label>
              <input name="targetValue" type="number" className="input" placeholder="e.g. 200000" value={form.targetValue} onChange={(e) => setForm({ ...form, targetValue: e.target.value })} />
            </div>
            <div>
              <label className="label">{lang === 'lt' ? 'Dabartinė reikšmė' : 'Current value'}</label>
              <input name="currentValue" type="number" className="input" placeholder="e.g. 45000" value={form.currentValue} onChange={(e) => setForm({ ...form, currentValue: e.target.value })} />
            </div>
            <div>
              <label className="label">{lang === 'lt' ? 'Terminas' : 'Deadline'}</label>
              <input name="targetDate" type="date" className="input" value={form.targetDate} onChange={(e) => setForm({ ...form, targetDate: e.target.value })} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              <label className="label">{t.goals.reflection}</label>
              <input name="reflection" className="input" value={form.reflection} onChange={(e) => setForm({ ...form, reflection: e.target.value })} placeholder={t.goals.reflectionPlaceholder} />
            </div>
          </div>

          {!editId && <VisibilityPicker value={{ visibility: form.visibility, sharedWith: form.sharedWith }} onChange={(v) => setForm({ ...form, ...v })} />}
        </div>
      </Modal>
    </div>
  );
}
