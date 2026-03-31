import { useState } from 'react';
import { UserPlus, RefreshCw, UserX, CheckCircle2, Circle, Clock, AlertCircle, ChevronDown, ChevronUp, Plus, X } from 'lucide-react';
import useStore from '../stores/useStore';
import { formatDate, generateId } from '../utils/helpers';
import StatusBadge from '../components/ui/StatusBadge';
import Modal from '../components/ui/Modal';
import { useTranslation } from '../i18n/useTranslation';
import useToastStore from '../stores/useToastStore';
import VisibilityPicker from '../components/ui/VisibilityPicker';
import type { Visibility } from '../types';

export default function Accounts() {
  const { accountWorkflows, clients, addAccountWorkflow, updateWorkflowStep } = useStore();
  const { t, lang } = useTranslation();
  const toast = useToastStore();
  const [expanded, setExpanded] = useState<string | null>(accountWorkflows[0]?.id || null);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ type: 'create' as 'create' | 'update' | 'close', clientId: '', notes: '', visibility: 'team' as Visibility, sharedWith: [] as string[] });

  const defaultSteps = {
    create: [
      { title: lang === 'lt' ? 'Surinkti reikalavimus' : 'Gather requirements', description: lang === 'lt' ? 'Surinkti visą reikiamą kliento informaciją' : 'Collect all needed client information' },
      { title: lang === 'lt' ? 'Patikrinti dokumentus' : 'Verify documents', description: lang === 'lt' ? 'Patikrinti pateiktų dokumentų išsamumą' : 'Check all submitted documents for completeness' },
      { title: lang === 'lt' ? 'Sukurti paskyrą sistemoje' : 'Create account in system', description: lang === 'lt' ? 'Įvesti kliento duomenis į sistemą' : 'Enter client data into the main system' },
      { title: lang === 'lt' ? 'Konfigūruoti nustatymus' : 'Configure settings', description: lang === 'lt' ? 'Nustatyti kainas, pranešimus, prieigos lygius' : 'Set up pricing, notifications, access levels' },
      { title: lang === 'lt' ? 'Išsiųsti prisijungimo duomenis' : 'Send credentials', description: lang === 'lt' ? 'Sugeneruoti ir išsiųsti prisijungimo duomenis' : 'Generate and send login details to client' },
      { title: lang === 'lt' ? 'Patvirtinti prieigą' : 'Verify access', description: lang === 'lt' ? 'Patvirtinti, kad klientas gali prisijungti' : 'Confirm client can log in and use the system' },
    ],
    update: [
      { title: lang === 'lt' ? 'Peržiūrėti pakeitimo užklausą' : 'Review change request', description: lang === 'lt' ? 'Suprasti, ką reikia atnaujinti' : 'Understand what needs to be updated' },
      { title: lang === 'lt' ? 'Patvirtinti duomenis' : 'Validate data', description: lang === 'lt' ? 'Patvirtinti naujų duomenų teisingumą' : 'Confirm new data is correct' },
      { title: lang === 'lt' ? 'Atnaujinti sistemą' : 'Update system', description: lang === 'lt' ? 'Pritaikyti pakeitimus sistemoje' : 'Apply changes in the system' },
      { title: lang === 'lt' ? 'Patikrinti pakeitimus' : 'Verify changes', description: lang === 'lt' ? 'Patvirtinti, kad pakeitimai teisingi' : 'Confirm changes are applied correctly' },
      { title: lang === 'lt' ? 'Informuoti klientą' : 'Notify client', description: lang === 'lt' ? 'Išsiųsti patvirtinimą klientui' : 'Send confirmation to client' },
    ],
    close: [
      { title: lang === 'lt' ? 'Gauti uždarymo užklausą' : 'Receive closure request', description: lang === 'lt' ? 'Gauti rašytinį patvirtinimą' : 'Get written confirmation from client' },
      { title: lang === 'lt' ? 'Patikrinti neapmokėtus elementus' : 'Check outstanding items', description: lang === 'lt' ? 'Peržiūrėti neapmokėtas sąskaitas' : 'Review pending invoices and obligations' },
      { title: lang === 'lt' ? 'Atlikti galutinį atsiskaitymą' : 'Process final settlement', description: lang === 'lt' ? 'Apdoroti likusius mokėjimus' : 'Handle any remaining payments' },
      { title: lang === 'lt' ? 'Deaktyvuoti paskyrą' : 'Deactivate account', description: lang === 'lt' ? 'Išjungti prieigą sistemoje' : 'Disable access in the system' },
      { title: lang === 'lt' ? 'Archyvuoti duomenis' : 'Archive data', description: lang === 'lt' ? 'Perkelti įrašus į archyvą' : 'Move records to archive (retain per regulations)' },
      { title: lang === 'lt' ? 'Išsiųsti patvirtinimą' : 'Send confirmation', description: lang === 'lt' ? 'Informuoti klientą apie uždarymą' : 'Notify client of completed closure' },
    ],
  };

  const typeCounts = {
    create: accountWorkflows.filter(w => w.type === 'create' && w.status !== 'completed').length,
    update: accountWorkflows.filter(w => w.type === 'update' && w.status !== 'completed').length,
    close: accountWorkflows.filter(w => w.type === 'close' && w.status !== 'completed').length,
  };

  const filtered = typeFilter === 'all' ? accountWorkflows : accountWorkflows.filter(w => w.type === typeFilter);

  const handleAdd = async () => {
    if (!form.clientId) return;
    const client = clients.find(c => c.id === form.clientId);
    try {
      await addAccountWorkflow({
        clientId: form.clientId,
        clientName: client?.companyName || '',
        type: form.type,
        status: 'in_progress',
        steps: defaultSteps[form.type].map((s, i) => ({
          id: generateId(),
          title: s.title,
          description: s.description,
          status: i === 0 ? 'in_progress' : 'pending',
        })),
        notes: form.notes,
        visibility: form.visibility,
        sharedWith: form.sharedWith,
      });
      setShowAdd(false);
      setForm({ type: 'create', clientId: '', notes: '', visibility: 'team', sharedWith: [] });
      toast.success(t.toast.workflowCreated);
    } catch (err: any) {
      toast.error(err.message || 'Failed to save');
    }
  };

  const stepIcon = (status: string) => {
    if (status === 'completed') return <CheckCircle2 size={18} className="text-success-500" />;
    if (status === 'in_progress') return <Clock size={18} className="text-slate-600" />;
    if (status === 'blocked') return <AlertCircle size={18} className="text-danger-500" />;
    if (status === 'skipped') return <X size={18} className="text-slate-400" />;
    return <Circle size={18} className="text-slate-300" />;
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">{t.accounts.title} <span className="text-base font-normal text-slate-500">({accountWorkflows.length})</span></h1>
        <button className="btn-primary" onClick={() => setShowAdd(true)}><Plus size={16} /> {t.accounts.newWorkflow}</button>
      </div>

      {/* Type Filter */}
      <div className="flex items-center gap-2 mb-6">
        {[
          { type: 'all', label: t.contracts.allStatuses },
          { type: 'create', label: t.accounts.createAccount, icon: UserPlus, count: typeCounts.create },
          { type: 'update', label: t.accounts.updateAccount, icon: RefreshCw, count: typeCounts.update },
          { type: 'close', label: t.accounts.closeAccount, icon: UserX, count: typeCounts.close },
        ].map(tp => (
          <button key={tp.type} onClick={() => setTypeFilter(tp.type)}
            className={`px-3 py-1.5 text-sm rounded-full border transition-all flex items-center gap-1.5 ${
              typeFilter === tp.type
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
            }`}>
            {tp.icon && <tp.icon size={14} />}
            <span>{tp.label}</span>
            {tp.count !== undefined && <span className="text-xs opacity-75">({tp.count})</span>}
          </button>
        ))}
      </div>

      {/* Workflows */}
      <div className="space-y-4">
        {filtered.length === 0 && <div className="card p-8 text-center text-sm text-slate-500">{t.accounts.noWorkflows}</div>}
        {filtered.map(wf => {
          const completedSteps = wf.steps.filter(s => s.status === 'completed').length;
          const pct = wf.steps.length > 0 ? Math.round((completedSteps / wf.steps.length) * 100) : 0;
          const isExpanded = expanded === wf.id;

          return (
            <div key={wf.id} className="card overflow-hidden">
              <div className="p-5 cursor-pointer hover:bg-slate-50" onClick={() => setExpanded(isExpanded ? null : wf.id)}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className="text-base font-semibold text-slate-900">{wf.clientName}</span>
                    <span className="text-xs font-medium text-slate-500">{wf.type}</span>
                    <StatusBadge status={wf.status} />
                  </div>
                  {isExpanded ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-slate-100 rounded-full h-2">
                    <div className={`h-2 rounded-full transition-all ${pct === 100 ? 'bg-slate-600' : 'bg-slate-400'}`} style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-xs font-medium text-slate-500">{completedSteps}/{wf.steps.length} {t.common.steps} • {pct}%</span>
                </div>
              </div>

              {isExpanded && (
                <div className="px-5 pb-5 border-t border-slate-100 pt-4">
                  <div className="space-y-1">
                    {wf.steps.map((step) => (
                      <div key={step.id} className="flex items-start gap-3 p-3 rounded-lg">
                        <div className="mt-0.5">{stepIcon(step.status)}</div>
                        <div className="flex-1 min-w-0">
                          <div className={`text-sm font-medium ${step.status === 'completed' ? 'text-slate-400 line-through' : step.status === 'skipped' ? 'text-slate-400' : 'text-slate-900'}`}>{step.title}</div>
                          <div className="text-xs text-slate-500 mt-0.5">{step.description}</div>
                          {step.notes && <div className="text-xs text-slate-500 mt-1">{t.accounts.note}: {step.notes}</div>}
                          {step.completedAt && <div className="text-[10px] text-slate-400 mt-1">{t.accounts.completed}: {formatDate(step.completedAt)}</div>}
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {step.status !== 'completed' && step.status !== 'skipped' && (
                            <>
                              <button className="px-2.5 py-1 text-xs font-medium bg-slate-100 text-slate-700 rounded hover:bg-slate-200"
                                onClick={(e) => { e.stopPropagation(); updateWorkflowStep(wf.id, step.id, { status: 'completed', completedAt: new Date().toISOString() }); toast.success(t.toast.stepCompleted); }}>
                                {t.common.complete}
                              </button>
                              {step.status !== 'blocked' && (
                                <button className="text-xs text-slate-400 hover:text-slate-600 underline"
                                  onClick={(e) => { e.stopPropagation(); updateWorkflowStep(wf.id, step.id, { status: 'blocked', notes: lang === 'lt' ? 'Blokuota — reikia sprendimo' : 'Blocked — needs resolution' }); }}>
                                  {t.common.block}
                                </button>
                              )}
                              <button className="text-xs text-slate-400 hover:text-slate-600 underline"
                                onClick={(e) => { e.stopPropagation(); updateWorkflowStep(wf.id, step.id, { status: 'skipped' }); }}>
                                {t.common.skip}
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  {wf.notes && (
                    <div className="mt-4 p-3 bg-slate-50 rounded-lg text-sm text-slate-600">
                      <span className="font-medium text-slate-700">{t.common.notes}:</span> {wf.notes}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title={t.accounts.newAccountWorkflow}
        footer={<><button className="btn-secondary" onClick={() => setShowAdd(false)}>{t.common.cancel}</button><button className="btn-primary" onClick={handleAdd}>{t.accounts.createWorkflow}</button></>}
      >
        <div className="space-y-4">
          <div><label className="label">{t.accounts.workflowType}</label>
            <select name="type" className="select" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as any })}>
              <option value="create">{t.accounts.createAccount}</option><option value="update">{t.accounts.updateAccount}</option><option value="close">{t.accounts.closeAccount}</option>
            </select>
          </div>
          <div><label className="label">{t.common.client} *</label>
            <select name="clientId" className="select" value={form.clientId} onChange={(e) => setForm({ ...form, clientId: e.target.value })}>
              <option value="">{t.common.select}</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.companyName}</option>)}
            </select>
          </div>
          <div>
            <label className="label">{t.accounts.stepsAutoPopulated}</label>
            <div className="space-y-1">
              {defaultSteps[form.type].map((s, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-slate-600 p-2 bg-slate-50 rounded">
                  <span className="w-5 h-5 bg-slate-200 rounded-full flex items-center justify-center text-xs font-bold text-slate-500">{i + 1}</span>
                  {s.title}
                </div>
              ))}
            </div>
          </div>
          <div><label className="label">{t.common.notes}</label><textarea name="notes" className="textarea" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
          <VisibilityPicker value={{ visibility: form.visibility, sharedWith: form.sharedWith }} onChange={(v) => setForm({ ...form, ...v })} />
        </div>
      </Modal>
    </div>
  );
}
