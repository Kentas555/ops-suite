import { useState, useMemo, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Phone, Edit2, Plus, FileText, User, PhoneCall, Mail, MessageSquare, Check, X, Send, TrendingUp, AlertTriangle, Zap } from 'lucide-react';
import useStore from '../stores/useStore';
import { formatDate, daysAgoCount } from '../utils/helpers';
import { computeClientHealth, HEALTH_CONFIG } from '../utils/clientHealth';
import StatusBadge from '../components/ui/StatusBadge';
import PriorityBadge from '../components/ui/PriorityBadge';
import Modal from '../components/ui/Modal';
import type { OnboardingStage } from '../types';
import { useTranslation } from '../i18n/useTranslation';
import useToastStore from '../stores/useToastStore';

const stages: OnboardingStage[] = ['initial_contact', 'documents_collection', 'contract_preparation', 'account_setup', 'system_configuration', 'training', 'go_live', 'completed'];

export default function ClientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { clients, tasks, contracts, communicationLogs, updateClient, addTask, addInteraction } = useStore();
  const { t, lang } = useTranslation();
  const toast = useToastStore();
  const client = clients.find(c => c.id === id);
  const [activeTab, setActiveTab] = useState('overview');
  const [showAddTask, setShowAddTask] = useState(false);
  const [editingNextAction, setEditingNextAction] = useState(false);
  const [nextActionDraft, setNextActionDraft] = useState('');
  const nextActionRef = useRef<HTMLInputElement>(null);

  // Quick interaction form
  const [interactionType, setInteractionType] = useState<'phone' | 'email' | 'internal_note' | 'meeting'>('phone');
  const [interactionNote, setInteractionNote] = useState('');
  const interactionInputRef = useRef<HTMLInputElement>(null);

  const [taskForm, setTaskForm] = useState({ title: '', description: '', priority: 'medium' as any, dueDate: '', category: 'follow-up' });

  const clientTasks = useMemo(() => tasks.filter(tk => tk.clientId === id), [tasks, id]);
  const clientContracts = useMemo(() => contracts.filter(c => c.clientId === id), [contracts, id]);
  const clientComms = useMemo(() => communicationLogs.filter(c => c.clientId === id).sort((a, b) => b.createdAt.localeCompare(a.createdAt)), [communicationLogs, id]);

  if (!client) return <div className="text-center py-16"><p className="text-slate-500">{t.clients.clientNotFound}</p><Link to="/clients" className="text-primary-600 text-sm mt-2 block">{t.clients.backToClients}</Link></div>;

  const currentStageIndex = stages.indexOf(client.onboardingStage);
  const lastInteractionDays = daysAgoCount(client.lastInteractionAt);
  const health = computeClientHealth(client, tasks);
  const hCfg = HEALTH_CONFIG[health.status];

  const interactionTypes = [
    { key: 'phone' as const, label: t.crm.call },
    { key: 'email' as const, label: t.crm.email },
    { key: 'meeting' as const, label: t.comms.meeting },
    { key: 'internal_note' as const, label: t.crm.noteLabel },
  ];

  const handleLogInteraction = async () => {
    if (!interactionNote.trim()) return;
    try {
      await addInteraction(client.id, {
        clientId: client.id,
        clientName: client.companyName,
        type: interactionType,
        subject: interactionNote.trim().slice(0, 60),
        summary: interactionNote.trim(),
        contactPerson: client.responsiblePerson,
      });
      setInteractionNote('');
      interactionInputRef.current?.focus();
      toast.success(t.toast.interactionLogged);
    } catch {
      toast.error('Failed to log interaction');
    }
  };

  const handleSaveNextAction = () => {
    updateClient(client.id, { nextAction: nextActionDraft.trim() || undefined });
    setEditingNextAction(false);
    toast.success(t.toast.changesSaved);
  };

  const tabs = [
    { key: 'overview', label: t.clients.overview },
    { key: 'timeline', label: t.crm.interactionTimeline, count: clientComms.length },
    { key: 'tasks', label: t.nav.tasks, count: clientTasks.filter(tk => tk.status !== 'completed').length },
    { key: 'documents', label: t.common.documents, count: clientContracts.length },
  ];

  const commIconMap: Record<string, typeof Mail> = {
    email: Mail,
    phone: PhoneCall,
    meeting: MessageSquare,
    internal_note: Edit2,
  };

  return (
    <div className="max-w-5xl mx-auto">
      <button onClick={() => navigate('/clients')} className="btn-ghost mb-4"><ArrowLeft size={16} /> {t.clients.backToClients}</button>

      {/* Client Header */}
      <div className="card p-6 mb-4">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900">{client.companyName}</h1>
            <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
              <span className="flex items-center gap-1"><User size={13} /> {client.responsiblePerson}</span>
              {client.responsiblePersonRole && <span className="text-slate-400">({client.responsiblePersonRole})</span>}
              <span className="flex items-center gap-1"><Phone size={13} /> {client.phone}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={client.status} />
            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${hCfg.bg} ${hCfg.color}`}>
              {lang === 'lt' ? hCfg.labelLt : hCfg.label}
            </span>
            {lastInteractionDays !== null && (
              <span className={`text-xs ${
                lastInteractionDays <= 3 ? 'text-slate-400' :
                lastInteractionDays <= 7 ? 'text-amber-600' :
                'text-red-600'
              }`}>
                {lastInteractionDays === 0 ? t.crm.today : `${lastInteractionDays} ${t.crm.daysAgo}`}
              </span>
            )}
          </div>
        </div>

        {/* Triggers */}
        {health.triggers.length > 0 && (
          <div className="flex gap-2 mt-3 flex-wrap">
            {health.triggers.map((trigger, i) => {
              const Icon = trigger.type === 'follow_up' ? PhoneCall : trigger.type === 'overdue_task' ? AlertTriangle : TrendingUp;
              const colors = trigger.type === 'overdue_task' ? 'bg-danger-50 text-danger-700 ring-danger-200' :
                trigger.type === 'upsell' ? 'bg-purple-50 text-purple-700 ring-purple-200' :
                'bg-amber-50 text-amber-700 ring-amber-200';
              return (
                <span key={i} className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ring-1 ${colors}`}>
                  <Icon size={11} />
                  {lang === 'lt' ? trigger.labelLt : trigger.label}
                </span>
              );
            })}
          </div>
        )}
      </div>

      {/* Next Action */}
      <div className="card p-4 mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-400 uppercase">{t.crm.nextAction}</span>
        </div>
        {editingNextAction ? (
          <div className="flex items-center gap-2 mt-2">
            <input ref={nextActionRef} name="nextAction" className="input text-sm flex-1" value={nextActionDraft}
              onChange={(e) => setNextActionDraft(e.target.value)} placeholder={t.crm.nextActionPlaceholder}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSaveNextAction(); if (e.key === 'Escape') setEditingNextAction(false); }} autoFocus />
            <button onClick={handleSaveNextAction} className="p-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200"><Check size={14} /></button>
            <button onClick={() => setEditingNextAction(false)} className="p-1.5 rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200"><X size={14} /></button>
          </div>
        ) : (
          <div className="flex items-center gap-2 mt-1 cursor-pointer group" onClick={() => { setNextActionDraft(client.nextAction || ''); setEditingNextAction(true); }}>
            <span className={`text-sm ${client.nextAction ? 'text-slate-900 font-medium' : 'text-slate-400 italic'}`}>
              {client.nextAction || t.crm.noNextAction}
            </span>
            <Edit2 size={12} className="text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        )}
      </div>

      {/* Quick Interaction Logger */}
      <div className="card p-4 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-semibold text-slate-400 uppercase">{t.crm.addInteraction}</span>
        </div>
        <div className="flex gap-1.5 mb-3">
          {interactionTypes.map(it => (
            <button key={it.key} onClick={() => setInteractionType(it.key)}
              className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                interactionType === it.key ? 'text-slate-900 bg-slate-100' : 'text-slate-400 hover:text-slate-600'
              }`}>
              {it.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input ref={interactionInputRef} name="interactionNote" className="input text-sm flex-1" value={interactionNote}
            onChange={(e) => setInteractionNote(e.target.value)} placeholder={t.crm.whatHappened}
            onKeyDown={(e) => { if (e.key === 'Enter') handleLogInteraction(); }} />
          <button onClick={handleLogInteraction} className="btn-primary btn-sm" disabled={!interactionNote.trim()}>
            <Send size={14} /> {t.crm.logInteraction}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-slate-200">
        {tabs.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.key ? 'border-primary-600 text-primary-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && <span className="ml-1.5 bg-slate-100 text-slate-600 text-xs px-1.5 py-0.5 rounded-full">{tab.count}</span>}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-slate-900 mb-4">{t.clients.onboardingProgress}</h3>
            <div className="space-y-1">
              {stages.map((stage, i) => (
                <div key={stage} className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm ${
                  i === currentStageIndex ? 'font-medium text-slate-900' : i < currentStageIndex ? 'text-slate-500' : 'text-slate-400'
                }`}>
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                    i < currentStageIndex ? 'bg-slate-700 text-white' :
                    i === currentStageIndex ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-400'
                  }`}>{i < currentStageIndex ? <Check size={10} /> : i + 1}</div>
                  {(t.statuses as Record<string, string>)[stage] || stage}
                </div>
              ))}
            </div>
          </div>

          <div className="card p-5">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">{t.clients.keyInformation}</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-slate-500">{t.clients.companyName}</span><span className="text-slate-900 font-medium">{client.companyName}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">{t.clients.responsiblePerson}</span><span className="text-slate-900">{client.responsiblePerson}</span></div>
              {client.responsiblePersonRole && <div className="flex justify-between"><span className="text-slate-500">{t.clients.responsiblePersonRole}</span><span className="text-slate-900">{client.responsiblePersonRole}</span></div>}
              <div className="flex justify-between"><span className="text-slate-500">{t.clients.phone}</span><span className="text-slate-900">{client.phone}</span></div>
              <div className="border-t border-slate-100 my-2" />
              <div className="flex justify-between"><span className="text-slate-500">{t.clients.created}</span><span className="text-slate-900">{formatDate(client.createdAt)}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">{t.crm.lastInteraction}</span>
                <span className={`${lastInteractionDays !== null && lastInteractionDays > 7 ? 'text-danger-600 font-medium' : 'text-slate-900'}`}>
                  {client.lastInteractionAt ? formatDate(client.lastInteractionAt) : t.crm.never}
                </span>
              </div>
              <div className="flex justify-between"><span className="text-slate-500">{t.clients.nextFollowUp}</span><span className="text-slate-900">{formatDate(client.nextFollowUp)}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">{t.common.status}</span><StatusBadge status={client.status} /></div>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100">
              <select name="status" className="select text-xs" value={client.status}
                onChange={(e) => updateClient(client.id, { status: e.target.value as any })}>
                <option value="prospect">{t.clients.prospect}</option>
                <option value="onboarding">{t.clients.onboarding}</option>
                <option value="active">{t.clients.active}</option>
                <option value="at_risk">{t.clients.atRisk}</option>
                <option value="paused">{t.clients.paused}</option>
                <option value="issue">{t.clients.issue}</option>
                <option value="churned">{t.clients.churned}</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Interaction Timeline Tab */}
      {activeTab === 'timeline' && (
        <div className="space-y-2">
          {clientComms.length === 0 ? (
            <div className="card p-8 text-center text-sm text-slate-500">{t.crm.noInteractions}</div>
          ) : clientComms.map(comm => {
            const Icon = commIconMap[comm.type] || Edit2;
            return (
              <div key={comm.id} className="card p-4">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5"><Icon size={14} className="text-slate-400" /></div>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium text-slate-900">{comm.subject}</span>
                    <p className="text-sm text-slate-600 mt-0.5">{comm.summary}</p>
                    {comm.nextAction && <p className="text-xs text-slate-500 mt-1">{t.clients.nextAction}: {comm.nextAction}</p>}
                  </div>
                  <div className="text-xs text-slate-400 flex-shrink-0">{formatDate(comm.createdAt)}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tasks Tab */}
      {activeTab === 'tasks' && (
        <div className="card">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900">{t.clients.clientTasks}</h3>
            <button className="btn-primary btn-sm" onClick={() => setShowAddTask(true)}><Plus size={14} /> {t.clients.addTask}</button>
          </div>
          <div className="divide-y divide-slate-50">
            {clientTasks.length === 0 ? <div className="p-5 text-center text-sm text-slate-500">{t.clients.noTasks}</div> :
              clientTasks.map(task => (
                <div key={task.id} className="px-5 py-3 flex items-center gap-3">
                  <div className="flex-1">
                    <div className="text-sm font-medium text-slate-900">{task.title}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{task.category} • {t.clients.due}: {formatDate(task.dueDate)}</div>
                  </div>
                  <PriorityBadge priority={task.priority} />
                  <StatusBadge status={task.status} />
                </div>
              ))
            }
          </div>
          <Modal isOpen={showAddTask} onClose={() => setShowAddTask(false)} title={t.clients.addTask} footer={
            <><button className="btn-secondary" onClick={() => setShowAddTask(false)}>{t.common.cancel}</button>
            <button className="btn-primary" onClick={() => {
              if (taskForm.title) {
                addTask({ ...taskForm, clientId: client.id, clientName: client.companyName, status: 'todo', isRecurring: false, notes: '', visibility: 'team', sharedWith: [] });
                setShowAddTask(false);
                setTaskForm({ title: '', description: '', priority: 'medium', dueDate: '', category: 'follow-up' });
                toast.success(t.toast.taskCreated);
              }
            }}>{t.common.add}</button></>
          }>
            <div className="space-y-3">
              <div><label className="label">{t.common.title} *</label><input name="title" className="input" value={taskForm.title} onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })} /></div>
              <div><label className="label">{t.common.description}</label><textarea name="description" className="textarea" rows={2} value={taskForm.description} onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })} /></div>
              <div className="grid grid-cols-3 gap-3">
                <div><label className="label">{t.common.priority}</label><select name="priority" className="select" value={taskForm.priority} onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}><option value="urgent">{t.tasks.urgent}</option><option value="high">{t.tasks.high}</option><option value="medium">{t.tasks.medium}</option><option value="low">{t.tasks.low}</option></select></div>
                <div><label className="label">{t.common.category}</label><select name="category" className="select" value={taskForm.category} onChange={(e) => setTaskForm({ ...taskForm, category: e.target.value })}><option value="follow-up">{t.tasks.followUp}</option><option value="contract">{t.tasks.contract}</option><option value="account">{t.tasks.account}</option><option value="document">{t.tasks.document}</option><option value="communication">{t.tasks.communication}</option><option value="onboarding">{t.tasks.onboarding}</option></select></div>
                <div><label className="label">{t.tasks.dueDate}</label><input name="dueDate" className="input" type="date" value={taskForm.dueDate} onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })} /></div>
              </div>
            </div>
          </Modal>
        </div>
      )}

      {/* Documents Tab */}
      {activeTab === 'documents' && (
        <div className="space-y-4">
          {clientContracts.length === 0 ? <div className="card p-8 text-center text-sm text-slate-500">{t.clients.noContracts}</div> :
            clientContracts.map(contract => (
              <div key={contract.id} className="card p-5">
                <div className="flex items-center justify-between mb-3">
                  <div><span className="text-sm font-semibold text-slate-900">{contract.contractNumber}</span><span className="text-sm text-slate-500 ml-2">• {contract.type}</span></div>
                  <StatusBadge status={contract.status} />
                </div>
                {contract.value && <div className="text-sm text-slate-700 mb-2">{t.common.value}: €{contract.value.toLocaleString()}</div>}
                <div className="text-xs text-slate-500 mb-3">{formatDate(contract.startDate)} — {formatDate(contract.endDate)}</div>
                {contract.documents.length > 0 && (
                  <div className="mb-3">
                    <div className="text-xs font-semibold text-slate-700 mb-2">{t.common.documents}:</div>
                    {contract.documents.map(doc => (
                      <div key={doc.id} className="flex items-center gap-2 py-1 text-xs"><FileText size={12} className="text-slate-400" /><span className="text-slate-700">{doc.name}</span><StatusBadge status={doc.status} size="sm" /></div>
                    ))}
                  </div>
                )}
                {contract.missingItems.length > 0 && (
                  <div className="p-2 bg-danger-50 rounded-lg">
                    <div className="text-xs font-semibold text-danger-700 mb-1">{t.common.missingItems}:</div>
                    {contract.missingItems.map((item, i) => <div key={i} className="text-xs text-danger-600">• {item}</div>)}
                  </div>
                )}
              </div>
            ))
          }
        </div>
      )}
    </div>
  );
}
