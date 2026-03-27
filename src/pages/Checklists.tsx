import { useState, useMemo } from 'react';
import { Plus, Search, Play, RotateCcw, CheckCircle2, Circle, Clock, HelpCircle, X } from 'lucide-react';
import useStore from '../stores/useStore';
import { generateId } from '../utils/helpers';
import Modal from '../components/ui/Modal';
import { useTranslation } from '../i18n/useTranslation';
import useToastStore from '../stores/useToastStore';

export default function Checklists() {
  const { sopChecklists, addSOPChecklist, activeChecklistProgress, toggleChecklistProgress, resetChecklistProgress } = useStore();
  const { t } = useTranslation();
  const toast = useToastStore();
  const [catFilter, setCatFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [runningChecklist, setRunningChecklist] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [showHelp, setShowHelp] = useState<string | null>(null);

  const categoryOptions = ['All', 'Onboarding', 'Contracts', 'Accounts', 'Issues', 'Payments', 'Documents'];

  const [form, setForm] = useState({
    title: '', description: '', category: 'Onboarding', estimatedTime: '',
    items: [{ text: '', helpText: '', isRequired: true }] as { text: string; helpText: string; isRequired: boolean }[],
  });

  const filtered = useMemo(() => sopChecklists.filter(c => {
    if (catFilter !== 'All' && c.category !== catFilter) return false;
    if (search && !c.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [sopChecklists, catFilter, search]);

  const running = runningChecklist ? sopChecklists.find(c => c.id === runningChecklist) : null;
  const progress = running ? (activeChecklistProgress[running.id] || {}) : {};
  const completedCount = running ? running.items.filter(i => progress[i.id]).length : 0;

  const handleAdd = () => {
    if (!form.title.trim()) return;
    addSOPChecklist({
      title: form.title, description: form.description, category: form.category,
      estimatedTime: form.estimatedTime || undefined,
      items: form.items.filter(i => i.text.trim()).map((item, i) => ({
        id: generateId(), text: item.text, helpText: item.helpText || undefined,
        isRequired: item.isRequired, order: i + 1,
      })),
      lastUsed: undefined, usageCount: 0,
    });
    setShowAdd(false);
    setForm({ title: '', description: '', category: 'Onboarding', estimatedTime: '', items: [{ text: '', helpText: '', isRequired: true }] });
    toast.success(t.toast.checklistCreated);
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t.checklists.title}</h1>
          <p className="text-sm text-slate-500 mt-1">{t.checklists.subtitle}</p>
        </div>
        <button className="btn-primary" onClick={() => setShowAdd(true)}><Plus size={16} /> {t.checklists.createChecklist}</button>
      </div>

      {/* Category Pills */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {categoryOptions.map(cat => (
          <button key={cat} onClick={() => setCatFilter(cat)}
            className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
              catFilter === cat ? 'bg-primary-100 text-primary-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}>
            {cat}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-md mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input name="search" className="input pl-9" placeholder={t.checklists.searchChecklists} value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {/* Checklist Table */}
      {filtered.length > 0 ? (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500">{t.common.title}</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500">{t.common.category}</th>
                <th className="px-4 py-2.5 text-center text-xs font-semibold text-slate-500">{t.common.steps}</th>
                <th className="px-4 py-2.5 text-center text-xs font-semibold text-slate-500">{t.checklists.estimatedTime}</th>
                <th className="px-4 py-2.5 text-center text-xs font-semibold text-slate-500">{t.common.used}</th>
                <th className="px-4 py-2.5 text-right text-xs font-semibold text-slate-500"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(checklist => {
                const prog = activeChecklistProgress[checklist.id] || {};
                const done = checklist.items.filter(i => prog[i.id]).length;
                const inProgress = done > 0 && done < checklist.items.length;

                return (
                  <tr key={checklist.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <span className="text-sm font-medium text-slate-900">{checklist.title}</span>
                      {inProgress && (
                        <div className="flex items-center gap-2 mt-1">
                          <div className="w-24 bg-slate-100 rounded-full h-1">
                            <div className="bg-primary-500 h-1 rounded-full" style={{ width: `${(done / checklist.items.length) * 100}%` }} />
                          </div>
                          <span className="text-[10px] text-slate-400">{done}/{checklist.items.length}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3"><span className="badge-gray text-[10px]">{checklist.category}</span></td>
                    <td className="px-4 py-3 text-center text-xs text-slate-600">{checklist.items.length}</td>
                    <td className="px-4 py-3 text-center text-xs text-slate-500">
                      {checklist.estimatedTime ? <span className="flex items-center justify-center gap-1"><Clock size={11} />{checklist.estimatedTime}</span> : <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-4 py-3 text-center text-xs text-slate-500">{checklist.usageCount}x</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button className="btn-primary btn-sm" onClick={() => setRunningChecklist(checklist.id)}>
                          <Play size={12} /> {inProgress ? t.common.continue_ : t.common.start}
                        </button>
                        {inProgress && (
                          <button className="btn-ghost btn-sm" onClick={() => resetChecklistProgress(checklist.id)}>
                            <RotateCcw size={12} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-16 text-sm text-slate-500">{t.checklists.noChecklistsMatch}</div>
      )}

      {/* Running Checklist Modal */}
      <Modal isOpen={!!running} onClose={() => setRunningChecklist(null)} title={running?.title || ''} size="lg"
        footer={running ? <>
          <button className="btn-ghost" onClick={() => { resetChecklistProgress(running.id); }}><RotateCcw size={14} /> {t.common.reset}</button>
          <div className="flex-1" />
          <button className="btn-secondary" onClick={() => setRunningChecklist(null)}>{t.common.close}</button>
          {completedCount === running.items.length && (
            <button className="btn-primary" onClick={() => setRunningChecklist(null)}>{t.common.done}</button>
          )}
        </> : undefined}
      >
        {running && (
          <div className="space-y-2">
            <div className="mb-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-slate-700">{t.common.progress}</span>
                <span className="text-sm text-slate-500">{completedCount}/{running.items.length}</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div className={`h-2 rounded-full transition-all ${completedCount === running.items.length ? 'bg-success-500' : 'bg-primary-500'}`}
                  style={{ width: `${(completedCount / running.items.length) * 100}%` }} />
              </div>
            </div>

            {running.items.map(item => {
              const checked = !!progress[item.id];
              return (
                <div key={item.id} className={`p-3 rounded-lg border transition-colors ${
                  checked ? 'bg-success-50 border-success-200' : item.isRequired ? 'bg-white border-slate-200' : 'bg-white border-slate-100'
                }`}>
                  <div className="flex items-start gap-3">
                    <button onClick={() => toggleChecklistProgress(running.id, item.id)} className="mt-0.5">
                      {checked ? <CheckCircle2 size={20} className="text-success-500" /> : <Circle size={20} className="text-slate-300" />}
                    </button>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-medium ${checked ? 'line-through text-slate-400' : 'text-slate-900'}`}>{item.text}</span>
                        {item.isRequired && !checked && <span className="text-[10px] text-danger-500 font-medium">{t.common.required}</span>}
                        {item.helpText && (
                          <button onClick={() => setShowHelp(showHelp === item.id ? null : item.id)} className="text-slate-400 hover:text-slate-600">
                            <HelpCircle size={14} />
                          </button>
                        )}
                      </div>
                      {showHelp === item.id && item.helpText && (
                        <div className="text-xs text-slate-500 mt-1 bg-slate-50 p-2 rounded">{item.helpText}</div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {completedCount === running.items.length && (
              <div className="text-center py-4">
                <div className="text-success-600 font-semibold">{t.checklists.allStepsCompleted}</div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Add Checklist Modal */}
      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title={t.checklists.createNewChecklist} size="lg"
        footer={<><button className="btn-secondary" onClick={() => setShowAdd(false)}>{t.common.cancel}</button><button className="btn-primary" onClick={handleAdd}>{t.common.create}</button></>}
      >
        <div className="space-y-4">
          <div><label className="label">{t.common.title} *</label><input name="title" className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
          <div><label className="label">{t.common.description}</label><textarea name="description" className="textarea" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">{t.common.category}</label>
              <select name="category" className="select" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {categoryOptions.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div><label className="label">{t.checklists.estimatedTime}</label><input name="estimatedTime" className="input" placeholder="e.g. 2-3 days" value={form.estimatedTime} onChange={(e) => setForm({ ...form, estimatedTime: e.target.value })} /></div>
          </div>
          <div>
            <label className="label">{t.checklists.stepsLabel}</label>
            <div className="space-y-2">
              {form.items.map((item, i) => (
                <div key={i} className="flex gap-2 items-start">
                  <span className="text-xs text-slate-400 mt-2.5 w-4">{i + 1}.</span>
                  <div className="flex-1 space-y-1">
                    <input name="stepText" className="input" placeholder={t.checklists.stepDescription} value={item.text} onChange={(e) => {
                      const items = [...form.items]; items[i] = { ...items[i], text: e.target.value }; setForm({ ...form, items });
                    }} />
                    <input name="stepHelpText" className="input text-xs" placeholder={t.checklists.helpTextOptional} value={item.helpText} onChange={(e) => {
                      const items = [...form.items]; items[i] = { ...items[i], helpText: e.target.value }; setForm({ ...form, items });
                    }} />
                  </div>
                  <label className="flex items-center gap-1 mt-2">
                    <input name="stepRequired" type="checkbox" checked={item.isRequired} onChange={(e) => {
                      const items = [...form.items]; items[i] = { ...items[i], isRequired: e.target.checked }; setForm({ ...form, items });
                    }} className="w-3 h-3 rounded border-slate-300 text-primary-600" />
                    <span className="text-[10px] text-slate-500">{t.checklists.req}</span>
                  </label>
                  {form.items.length > 1 && (
                    <button className="mt-2 text-slate-400 hover:text-danger-500" onClick={() => {
                      setForm({ ...form, items: form.items.filter((_, j) => j !== i) });
                    }}><X size={14} /></button>
                  )}
                </div>
              ))}
            </div>
            <button className="btn-ghost btn-sm mt-2" onClick={() => setForm({ ...form, items: [...form.items, { text: '', helpText: '', isRequired: true }] })}>
              <Plus size={14} /> {t.checklists.addStep}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
