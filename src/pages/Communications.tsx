import { useState, useMemo } from 'react';
import { Plus, Search, Copy, Edit2, Trash2, Check } from 'lucide-react';
import useStore from '../stores/useStore';
import { formatDate } from '../utils/helpers';
import Modal from '../components/ui/Modal';
import { useTranslation } from '../i18n/useTranslation';
import useToastStore from '../stores/useToastStore';

export default function Communications() {
  const {
    communicationLogs, communicationTemplates, clients,
    addCommunicationLog, addCommunicationTemplate, updateCommunicationTemplate, deleteCommunicationTemplate,
  } = useStore();
  const { t } = useTranslation();
  const toast = useToastStore();

  const [tab, setTab] = useState<'log' | 'templates'>('log');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [catFilter, setCatFilter] = useState('All');
  const [showAddLog, setShowAddLog] = useState(false);
  const [showAddTpl, setShowAddTpl] = useState(false);
  const [useTpl, setUseTpl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [editTpl, setEditTpl] = useState<string | null>(null);
  const [tplVars, setTplVars] = useState<Record<string, string>>({});

  const [logForm, setLogForm] = useState({ type: 'email' as any, clientId: '', contactPerson: '', subject: '', summary: '', nextAction: '' });
  const [tplForm, setTplForm] = useState({ title: '', category: 'Welcome', subject: '', body: '' });

  const filteredLogs = useMemo(() => {
    const sorted = [...communicationLogs].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return sorted.filter(l => {
      if (typeFilter !== 'all' && l.type !== typeFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return l.subject.toLowerCase().includes(q) || l.clientName.toLowerCase().includes(q) || l.summary.toLowerCase().includes(q);
      }
      return true;
    });
  }, [communicationLogs, typeFilter, search]);

  const templateCategories = ['All', ...new Set(communicationTemplates.map(tp => tp.category))];
  const filteredTemplates = communicationTemplates.filter(tp => catFilter === 'All' || tp.category === catFilter);

  const activeTpl = useTpl ? communicationTemplates.find(tp => tp.id === useTpl) : null;

  const filledBody = activeTpl ? activeTpl.body.replace(/\{\{(\w+)\}\}/g, (_, key) => tplVars[key] || `{{${key}}}`) : '';
  const filledSubject = activeTpl?.subject ? activeTpl.subject.replace(/\{\{(\w+)\}\}/g, (_, key) => tplVars[key] || `{{${key}}}`) : '';

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success(t.toast.copied);
  };

  const handleAddLog = () => {
    if (!logForm.subject) return;
    const client = clients.find(c => c.id === logForm.clientId);
    addCommunicationLog({
      type: logForm.type, clientId: logForm.clientId, clientName: client?.companyName || 'Unknown',
      contactPerson: logForm.contactPerson, subject: logForm.subject,
      summary: logForm.summary, nextAction: logForm.nextAction || undefined,
    });
    setShowAddLog(false);
    setLogForm({ type: 'email', clientId: '', contactPerson: '', subject: '', summary: '', nextAction: '' });
    toast.success(t.toast.commLogged);
  };

  const handleSaveTpl = () => {
    if (!tplForm.title) return;
    const vars = [...(tplForm.body + ' ' + tplForm.subject).matchAll(/\{\{(\w+)\}\}/g)].map(m => m[1]);
    if (editTpl) {
      updateCommunicationTemplate(editTpl, { ...tplForm, variables: [...new Set(vars)] });
      setEditTpl(null);
    } else {
      addCommunicationTemplate({ ...tplForm, variables: [...new Set(vars)] });
    }
    setShowAddTpl(false);
    setTplForm({ title: '', category: 'Welcome', subject: '', body: '' });
    toast.success(t.toast.templateSaved);
  };

  const groupedLogs = filteredLogs.reduce((groups, log) => {
    const date = log.createdAt.split('T')[0];
    if (!groups[date]) groups[date] = [];
    groups[date].push(log);
    return groups;
  }, {} as Record<string, typeof filteredLogs>);

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">{t.comms.title}</h1>
        <div className="flex gap-2">
          <button onClick={() => setTab('log')} className={`px-4 py-2 text-sm font-medium rounded-lg ${tab === 'log' ? 'bg-primary-100 text-primary-700' : 'bg-slate-100 text-slate-600'}`}>{t.comms.activityLog}</button>
          <button onClick={() => setTab('templates')} className={`px-4 py-2 text-sm font-medium rounded-lg ${tab === 'templates' ? 'bg-primary-100 text-primary-700' : 'bg-slate-100 text-slate-600'}`}>{t.comms.templatesTab}</button>
        </div>
      </div>

      {tab === 'log' && (
        <>
          <div className="flex items-center gap-3 mb-6">
            <button className="btn-primary" onClick={() => setShowAddLog(true)}><Plus size={16} /> {t.comms.logCommunication}</button>
            <div className="relative flex-1 max-w-xs">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input name="search" className="input pl-9" placeholder={t.comms.searchComms} value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <select name="typeFilter" className="select w-36" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
              <option value="all">{t.comms.allTypes}</option>
              <option value="email">{t.comms.email}</option><option value="phone">{t.comms.phone}</option><option value="meeting">{t.comms.meeting}</option><option value="internal_note">{t.comms.internalNote}</option>
            </select>
          </div>

          <div className="space-y-6">
            {Object.entries(groupedLogs).map(([date, logs]) => (
              <div key={date}>
                <div className="text-xs font-semibold text-slate-400 uppercase mb-2">{formatDate(date)}</div>
                <div className="space-y-1">
                  {logs.map(log => (
                    <div key={log.id} className="card px-4 py-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="badge-gray text-[10px] flex-shrink-0">{log.type}</span>
                        <span className="text-sm font-medium text-slate-900 truncate">{log.subject}</span>
                        <span className="text-xs text-slate-500 flex-shrink-0">{log.clientName}</span>
                        <span className="text-xs text-slate-400 truncate hidden md:block">{log.summary.slice(0, 80)}{log.summary.length > 80 ? '...' : ''}</span>
                        <span className="text-xs text-slate-400 flex-shrink-0 ml-auto">{log.createdAt.split('T')[1]?.slice(0, 5) || ''}</span>
                      </div>
                      {log.nextAction && (
                        <div className="mt-1.5 px-2 py-1 bg-primary-50 rounded text-xs text-primary-700 font-medium">
                          {t.clients.nextAction}: {log.nextAction}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {filteredLogs.length === 0 && <div className="text-center py-16 text-sm text-slate-500">{t.comms.noCommunications}</div>}
          </div>

          <Modal isOpen={showAddLog} onClose={() => setShowAddLog(false)} title={t.comms.logCommunication}
            footer={<><button className="btn-secondary" onClick={() => setShowAddLog(false)}>{t.common.cancel}</button><button className="btn-primary" onClick={handleAddLog}>{t.common.save}</button></>}
          >
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">{t.common.type}</label><select name="type" className="select" value={logForm.type} onChange={(e) => setLogForm({ ...logForm, type: e.target.value })}><option value="email">{t.comms.email}</option><option value="phone">{t.comms.phone}</option><option value="meeting">{t.comms.meeting}</option><option value="internal_note">{t.comms.internalNote}</option></select></div>
                <div><label className="label">{t.common.client}</label><select name="clientId" className="select" value={logForm.clientId} onChange={(e) => setLogForm({ ...logForm, clientId: e.target.value })}><option value="">{t.common.select}</option>{clients.map(c => <option key={c.id} value={c.id}>{c.companyName}</option>)}</select></div>
              </div>
              <div><label className="label">{t.clients.contactPerson}</label><input name="contactPerson" className="input" value={logForm.contactPerson} onChange={(e) => setLogForm({ ...logForm, contactPerson: e.target.value })} /></div>
              <div><label className="label">{t.clients.subject} *</label><input name="subject" className="input" value={logForm.subject} onChange={(e) => setLogForm({ ...logForm, subject: e.target.value })} /></div>
              <div><label className="label">{t.clients.summary}</label><textarea name="summary" className="textarea" rows={4} value={logForm.summary} onChange={(e) => setLogForm({ ...logForm, summary: e.target.value })} /></div>
              <div><label className="label">{t.clients.nextAction}</label><input name="nextAction" className="input" value={logForm.nextAction} onChange={(e) => setLogForm({ ...logForm, nextAction: e.target.value })} /></div>
            </div>
          </Modal>
        </>
      )}

      {tab === 'templates' && (
        <>
          <div className="flex items-center gap-3 mb-6">
            <button className="btn-primary" onClick={() => { setEditTpl(null); setTplForm({ title: '', category: 'Welcome', subject: '', body: '' }); setShowAddTpl(true); }}>
              <Plus size={16} /> {t.comms.newTemplate}
            </button>
            <div className="flex gap-1 flex-wrap">
              {templateCategories.map(cat => (
                <button key={cat} onClick={() => setCatFilter(cat)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-full ${catFilter === cat ? 'bg-primary-100 text-primary-700' : 'bg-slate-100 text-slate-600'}`}>
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredTemplates.map(tpl => (
              <div key={tpl.id} className="card p-5">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-sm font-semibold text-slate-900">{tpl.title}</h3>
                  <span className="badge-blue text-[10px]">{tpl.category}</span>
                </div>
                {tpl.subject && <div className="text-xs text-slate-500 mb-2">{t.clients.subject}: {tpl.subject}</div>}
                <p className="text-xs text-slate-600 line-clamp-3 mb-3 whitespace-pre-wrap">{tpl.body.slice(0, 120)}...</p>
                {tpl.variables.length > 0 && (
                  <div className="flex gap-1 flex-wrap mb-3">
                    {tpl.variables.map(v => <span key={v} className="px-1.5 py-0.5 text-[10px] bg-amber-50 text-amber-700 rounded">{`{{${v}}}`}</span>)}
                  </div>
                )}
                <div className="flex gap-2">
                  <button className="btn-primary btn-sm flex-1" onClick={() => { setUseTpl(tpl.id); setTplVars({}); }}>{t.comms.useTemplate}</button>
                  <button className="btn-ghost btn-sm" onClick={() => handleCopy(tpl.body)}><Copy size={14} /></button>
                  <button className="btn-ghost btn-sm" onClick={() => {
                    setEditTpl(tpl.id); setTplForm({ title: tpl.title, category: tpl.category, subject: tpl.subject || '', body: tpl.body }); setShowAddTpl(true);
                  }}><Edit2 size={14} /></button>
                  <button className="btn-ghost btn-sm text-danger-500" onClick={() => { deleteCommunicationTemplate(tpl.id); toast.success(t.toast.templateDeleted); }}><Trash2 size={14} /></button>
                </div>
              </div>
            ))}
          </div>

          {/* Use Template Modal */}
          <Modal isOpen={!!activeTpl} onClose={() => setUseTpl(null)} title={activeTpl?.title || ''} size="xl"
            footer={<>
              <button className="btn-secondary" onClick={() => setUseTpl(null)}>{t.common.close}</button>
              <button className="btn-primary" onClick={() => { handleCopy(filledSubject ? `${t.clients.subject}: ${filledSubject}\n\n${filledBody}` : filledBody); }}>
                {copied ? <><Check size={14} /> {t.common.copied}</> : <><Copy size={14} /> {t.common.copyResult}</>}
              </button>
            </>}
          >
            {activeTpl && (
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h4 className="text-xs font-semibold text-slate-700 uppercase mb-3">{t.common.fillVariables}</h4>
                  <div className="space-y-3">
                    {activeTpl.variables.map(v => (
                      <div key={v}>
                        <label className="label">{v.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}</label>
                        <input name={v} className="input" value={tplVars[v] || ''} onChange={(e) => setTplVars({ ...tplVars, [v]: e.target.value })} />
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-slate-700 uppercase mb-3">{t.common.preview}</h4>
                  {filledSubject && (
                    <div className="text-sm font-medium text-slate-900 mb-2 pb-2 border-b border-slate-200">
                      {t.clients.subject}: {filledSubject}
                    </div>
                  )}
                  <div className="text-sm text-slate-700 whitespace-pre-wrap bg-slate-50 p-4 rounded-lg max-h-96 overflow-y-auto leading-relaxed">
                    {filledBody}
                  </div>
                </div>
              </div>
            )}
          </Modal>

          {/* Add/Edit Template Modal */}
          <Modal isOpen={showAddTpl} onClose={() => { setShowAddTpl(false); setEditTpl(null); }} title={editTpl ? t.comms.editTemplate : t.comms.newTemplateTitle} size="lg"
            footer={<><button className="btn-secondary" onClick={() => { setShowAddTpl(false); setEditTpl(null); }}>{t.common.cancel}</button><button className="btn-primary" onClick={handleSaveTpl}>{t.common.save}</button></>}
          >
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="label">{t.common.title} *</label><input name="title" className="input" value={tplForm.title} onChange={(e) => setTplForm({ ...tplForm, title: e.target.value })} /></div>
                <div><label className="label">{t.common.category}</label>
                  <select name="category" className="select" value={tplForm.category} onChange={(e) => setTplForm({ ...tplForm, category: e.target.value })}>
                    <option>Welcome</option><option>Follow-up</option><option>Documents</option><option>Contracts</option><option>Issues</option><option>Payments</option><option>Meetings</option>
                  </select>
                </div>
              </div>
              <div><label className="label">{t.comms.subjectOptional}</label><input name="subject" className="input" value={tplForm.subject} onChange={(e) => setTplForm({ ...tplForm, subject: e.target.value })} placeholder={t.comms.variablePlaceholder} /></div>
              <div><label className="label">{t.comms.body}</label><textarea name="body" className="textarea" rows={10} value={tplForm.body} onChange={(e) => setTplForm({ ...tplForm, body: e.target.value })} placeholder={t.comms.variablePlaceholder} /></div>
              <p className="text-xs text-slate-500">{t.comms.variablesHint}</p>
            </div>
          </Modal>
        </>
      )}
    </div>
  );
}
