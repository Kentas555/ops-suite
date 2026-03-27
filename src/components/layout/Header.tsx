import { Search, Bell, Moon, Sun, Users, CheckSquare, BookOpen, Plus, X, Clock, AlertTriangle, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState, useRef, useEffect, useMemo } from 'react';
import useStore from '../../stores/useStore';
import useAuthStore from '../../stores/useAuthStore';
import useReminderStore from '../../stores/useReminderStore';
import useToastStore from '../../stores/useToastStore';
import { useTranslation } from '../../i18n/useTranslation';
import { formatDate } from '../../utils/helpers';
import { getText } from '../../utils/bilingual';

export default function Header() {
  const { searchQuery, setSearchQuery, clients, tasks, knowledgeEntries, darkMode, toggleDarkMode } = useStore();
  const { t, lang, setLang } = useTranslation();
  const toast = useToastStore();
  const { reminders, addReminder, markRead, dismiss, getUnreadCount } = useReminderStore();
  const [showResults, setShowResults] = useState(false);
  const [showReminders, setShowReminders] = useState(false);
  const [showAddReminder, setShowAddReminder] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const reminderRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // New reminder form
  const [remForm, setRemForm] = useState({ title: '', description: '', dueAt: '', clientId: '' });

  const unreadCount = getUnreadCount();

  const now = useMemo(() => new Date().toISOString(), [showReminders]);

  // Active reminders (due now or overdue, not dismissed)
  const activeReminders = useMemo(() =>
    reminders
      .filter(r => !r.isDismissed && r.dueAt <= now)
      .sort((a, b) => a.dueAt.localeCompare(b.dueAt)),
    [reminders, now]
  );

  // Upcoming reminders (not yet due, not dismissed)
  const upcomingReminders = useMemo(() =>
    reminders
      .filter(r => !r.isDismissed && r.dueAt > now)
      .sort((a, b) => a.dueAt.localeCompare(b.dueAt))
      .slice(0, 3),
    [reminders, now]
  );

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowResults(false);
      if (reminderRef.current && !reminderRef.current.contains(e.target as Node)) {
        setShowReminders(false);
        setShowAddReminder(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); inputRef.current?.focus(); }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  const q = searchQuery.toLowerCase();
  const filteredClients = q ? clients.filter(c =>
    c.companyName.toLowerCase().includes(q) ||
    c.responsiblePerson.toLowerCase().includes(q) ||
    c.phone.includes(q) ||
    (c.nextAction || '').toLowerCase().includes(q)
  ).slice(0, 5) : [];
  const filteredTasks = q ? tasks.filter(tk => tk.title.toLowerCase().includes(q)).slice(0, 4) : [];
  const filteredKnowledge = q ? knowledgeEntries.filter(k => getText(k.title, lang).toLowerCase().includes(q) || getText(k.content, lang).toLowerCase().includes(q) || (k.title?.lt || '').toLowerCase().includes(q) || (k.title?.en || '').toLowerCase().includes(q)).slice(0, 4) : [];
  const hasResults = filteredClients.length + filteredTasks.length + filteredKnowledge.length > 0;

  const handleAddReminder = () => {
    if (!remForm.title.trim() || !remForm.dueAt) return;
    const client = clients.find(c => c.id === remForm.clientId);
    addReminder({
      title: remForm.title,
      description: remForm.description || undefined,
      dueAt: new Date(remForm.dueAt).toISOString(),
      clientId: remForm.clientId || undefined,
      clientName: client?.companyName,
    });
    toast.success(t.toast.reminderCreated);
    setRemForm({ title: '', description: '', dueAt: '', clientId: '' });
    setShowAddReminder(false);
  };

  return (
    <header className="h-16 flex items-center justify-between px-6 flex-shrink-0" style={{ background: 'var(--surface-0)', borderBottom: '1px solid var(--border-default)' }}>
      {/* Search */}
      <div ref={searchRef} className="relative flex-1 max-w-xl">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input ref={inputRef} id="global-search" name="search" type="text" placeholder={t.app.searchPlaceholder}
            className="input pl-9 pr-4 py-2 bg-slate-50 border-slate-200 focus:bg-white"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setShowResults(true); }}
            onFocus={() => { if (searchQuery) setShowResults(true); }}
          />
        </div>
        {showResults && searchQuery && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl border border-slate-200 shadow-lg z-50 max-h-96 overflow-y-auto">
            {!hasResults && (<div className="p-4 text-sm text-slate-500 text-center">{t.common.noResults}</div>)}
            {filteredClients.length > 0 && (
              <div>
                <div className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase">{t.searchResults.clients}</div>
                {filteredClients.map(c => (
                    <button key={c.id} className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 flex items-center gap-2" onClick={() => { navigate(`/clients/${c.id}`); setShowResults(false); setSearchQuery(''); }}>
                      <Users size={14} className="text-slate-400" />
                      <div className="min-w-0 flex-1">
                        <span className="text-slate-700">{c.companyName}</span>
                        <span className="text-xs text-slate-400 ml-1.5">({c.responsiblePerson})</span>
                      </div>
                      <span className="text-xs text-slate-400 ml-auto flex-shrink-0">{c.status}</span>
                    </button>
                ))}
              </div>
            )}
            {filteredTasks.length > 0 && (
              <div>
                <div className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase border-t border-slate-100">{t.searchResults.tasks}</div>
                {filteredTasks.map(tk => (
                  <button key={tk.id} className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 flex items-center gap-2" onClick={() => { navigate('/tasks'); setShowResults(false); setSearchQuery(''); }}>
                    <CheckSquare size={14} className="text-slate-400" />
                    <span className="text-slate-700">{tk.title}</span>
                    <span className="text-xs text-slate-400 ml-auto">{tk.priority}</span>
                  </button>
                ))}
              </div>
            )}
            {filteredKnowledge.length > 0 && (
              <div>
                <div className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase border-t border-slate-100">{t.searchResults.knowledge}</div>
                {filteredKnowledge.map(k => (
                  <button key={k.id} className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 flex items-center gap-2" onClick={() => { navigate('/knowledge'); setShowResults(false); setSearchQuery(''); }}>
                    <BookOpen size={14} className="text-slate-400" />
                    <span className="text-slate-700">{getText(k.title, lang)}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 ml-4">
        {/* Language Switcher */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5">
          <button onClick={() => setLang('en')} className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${lang === 'en' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>EN</button>
          <button onClick={() => setLang('lt')} className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${lang === 'lt' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>LT</button>
        </div>

        {/* Dark Mode Toggle */}
        <button onClick={toggleDarkMode} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors">
          {darkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* Reminders Bell */}
        <div ref={reminderRef} className="relative">
          <button
            className="relative p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
            onClick={() => { setShowReminders(!showReminders); setShowAddReminder(false); }}
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center bg-danger-500 text-white text-[10px] font-bold rounded-full px-1">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Reminders Dropdown */}
          {showReminders && (
            <div className="absolute top-full right-0 mt-2 w-96 bg-white rounded-xl border border-slate-200 shadow-xl z-50 max-h-[70vh] flex flex-col animate-slide-in">
              <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-900">{t.reminders.title}</h3>
                <button onClick={() => { setShowAddReminder(!showAddReminder); }} className="btn-ghost btn-sm text-xs">
                  <Plus size={14} /> {t.reminders.addReminder}
                </button>
              </div>

              {/* Add Reminder Form */}
              {showAddReminder && (
                <div className="p-4 border-b border-slate-200 bg-slate-50 space-y-3">
                  <input id="rem-title" name="rem-title" className="input text-sm" placeholder={t.reminders.reminderTitle}
                    value={remForm.title} onChange={(e) => setRemForm({ ...remForm, title: e.target.value })} autoFocus />
                  <input id="rem-desc" name="rem-description" className="input text-sm" placeholder={t.common.description}
                    value={remForm.description} onChange={(e) => setRemForm({ ...remForm, description: e.target.value })} />
                  <div className="grid grid-cols-2 gap-2">
                    <input id="rem-due" name="rem-due" className="input text-sm" type="datetime-local"
                      value={remForm.dueAt} onChange={(e) => setRemForm({ ...remForm, dueAt: e.target.value })} />
                    <select id="rem-client" name="rem-client" className="select text-sm" value={remForm.clientId} onChange={(e) => setRemForm({ ...remForm, clientId: e.target.value })}>
                      <option value="">{t.reminders.linkedClient}</option>
                      {clients.map(c => <option key={c.id} value={c.id}>{c.companyName}</option>)}
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <button className="btn-primary btn-sm flex-1" onClick={handleAddReminder} disabled={!remForm.title.trim() || !remForm.dueAt}>
                      {t.reminders.addReminder}
                    </button>
                    <button className="btn-ghost btn-sm" onClick={() => setShowAddReminder(false)}>{t.common.cancel}</button>
                  </div>
                </div>
              )}

              <div className="overflow-y-auto flex-1">
                {/* Active (due/overdue) */}
                {activeReminders.length > 0 && (
                  <div>
                    <div className="px-4 py-2 text-[10px] font-semibold text-danger-600 uppercase bg-danger-50/50">{t.reminders.activeReminders}</div>
                    {activeReminders.map(rem => (
                      <div key={rem.id} className={`px-4 py-3 border-b border-slate-100 hover:bg-slate-50 ${!rem.isRead ? 'bg-primary-50/30' : ''}`}>
                        <div className="flex items-start gap-2">
                          <AlertTriangle size={14} className="text-danger-500 mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-slate-900">{rem.title}</div>
                            {rem.description && <div className="text-xs text-slate-500 mt-0.5">{rem.description}</div>}
                            <div className="flex items-center gap-2 mt-1">
                              {rem.clientName && (
                                <button className="text-[10px] text-primary-600 hover:underline" onClick={() => { rem.clientId && navigate(`/clients/${rem.clientId}`); setShowReminders(false); }}>
                                  {rem.clientName}
                                </button>
                              )}
                              <span className="text-[10px] text-slate-400">{formatDate(rem.dueAt)}</span>
                            </div>
                          </div>
                          <div className="flex gap-1 flex-shrink-0">
                            {!rem.isRead && (
                              <button onClick={() => markRead(rem.id)} className="p-1 rounded hover:bg-slate-200 text-slate-400" title={t.reminders.markRead}>
                                <Check size={12} />
                              </button>
                            )}
                            <button onClick={() => { dismiss(rem.id); toast.info(t.toast.reminderDismissed); }} className="p-1 rounded hover:bg-slate-200 text-slate-400" title={t.reminders.dismiss}>
                              <X size={12} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Upcoming */}
                {upcomingReminders.length > 0 && (
                  <div>
                    <div className="px-4 py-2 text-[10px] font-semibold text-slate-400 uppercase bg-slate-50">{t.reminders.upcoming}</div>
                    {upcomingReminders.map(rem => (
                      <div key={rem.id} className="px-4 py-3 border-b border-slate-100 hover:bg-slate-50">
                        <div className="flex items-start gap-2">
                          <Clock size={14} className="text-slate-400 mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-slate-700">{rem.title}</div>
                            <div className="flex items-center gap-2 mt-1">
                              {rem.clientName && <span className="text-[10px] text-primary-600">{rem.clientName}</span>}
                              <span className="text-[10px] text-slate-400">{formatDate(rem.dueAt)}</span>
                            </div>
                          </div>
                          <button onClick={() => { dismiss(rem.id); }} className="p-1 rounded hover:bg-slate-200 text-slate-400">
                            <X size={12} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {activeReminders.length === 0 && upcomingReminders.length === 0 && (
                  <div className="p-6 text-center text-sm text-slate-400">{t.reminders.noReminders}</div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* User name */}
        {(() => {
          const currentUser = useAuthStore.getState().getCurrentUser();
          return (
            <span className="text-xs font-medium text-slate-600">{currentUser?.displayName}</span>
          );
        })()}
      </div>
    </header>
  );
}
