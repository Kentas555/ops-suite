import { useState, useMemo } from 'react';
import { Plus, Search, Pin, PinOff, Edit2, Trash2, FileText, AlertTriangle, HelpCircle, Lightbulb, CheckSquare, BookOpen, MessageSquare, Globe } from 'lucide-react';
import useStore from '../stores/useStore';
import { formatDate } from '../utils/helpers';
import Modal from '../components/ui/Modal';
import { useTranslation } from '../i18n/useTranslation';
import useToastStore from '../stores/useToastStore';
import { getText } from '../utils/bilingual';
import VisibilityPicker from '../components/ui/VisibilityPicker';
import type { BilingualText, Visibility } from '../types';

export default function Knowledge() {
  const { knowledgeEntries, addKnowledgeEntry, updateKnowledgeEntry, deleteKnowledgeEntry } = useStore();
  const { t, lang } = useTranslation();
  const toast = useToastStore();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showAdd, setShowAdd] = useState(false);
  const [viewEntry, setViewEntry] = useState<string | null>(null);
  const [editEntry, setEditEntry] = useState<string | null>(null);

  // Single-language form (one language per entry)
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formCategory, setFormCategory] = useState('process' as any);
  const [formTags, setFormTags] = useState('');
  const [formPinned, setFormPinned] = useState(false);
  const [formLang, setFormLang] = useState<'lt' | 'en'>('lt');
  const [formVisibility, setFormVisibility] = useState<Visibility>('team');
  const [formSharedWith, setFormSharedWith] = useState<string[]>([]);

  const categories = [
    { key: 'all', label: t.knowledge.all, icon: BookOpen },
    { key: 'process', label: t.knowledge.processes, icon: FileText },
    { key: 'terminology', label: t.knowledge.terminology, icon: BookOpen },
    { key: 'checklist', label: t.knowledge.checklists, icon: CheckSquare },
    { key: 'faq', label: t.knowledge.faq, icon: HelpCircle },
    { key: 'guideline', label: t.knowledge.guidelines, icon: FileText },
    { key: 'template', label: t.knowledge.templates, icon: MessageSquare },
    { key: 'tip', label: t.knowledge.tips, icon: Lightbulb },
    { key: 'mistake_to_avoid', label: t.knowledge.mistakesToAvoid, icon: AlertTriangle },
  ];

  const filtered = useMemo(() => {
    let entries = knowledgeEntries.filter(e => {
      if (categoryFilter !== 'all' && e.category !== categoryFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return getText(e.title, lang).toLowerCase().includes(q) || getText(e.content, lang).toLowerCase().includes(q)
          || (e.title?.lt || '').toLowerCase().includes(q) || (e.title?.en || '').toLowerCase().includes(q)
          || e.tags.some(tg => tg.toLowerCase().includes(q));
      }
      return true;
    });
    return entries.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return b.updatedAt.localeCompare(a.updatedAt);
    });
  }, [knowledgeEntries, categoryFilter, search, lang]);

  const entry = viewEntry ? knowledgeEntries.find(e => e.id === viewEntry) : null;

  const resetForm = () => {
    setFormTitle(''); setFormContent('');
    setFormCategory('process'); setFormTags(''); setFormPinned(false); setFormLang('lt');
    setFormVisibility('team'); setFormSharedWith([]);
  };

  const handleSave = async () => {
    if (!formTitle.trim()) return;
    // Single language per entry: content goes into the selected language slot
    const title: BilingualText = { lt: formLang === 'lt' ? formTitle : '', en: formLang === 'en' ? formTitle : '' };
    const content: BilingualText = { lt: formLang === 'lt' ? formContent : '', en: formLang === 'en' ? formContent : '' };
    const tags = formTags.split(',').map(tg => tg.trim()).filter(Boolean);
    if (editEntry) {
      updateKnowledgeEntry(editEntry, { title, content, category: formCategory, tags, isPinned: formPinned });
      setEditEntry(null);
      setShowAdd(false);
      resetForm();
      toast.success(t.toast.entryUpdated);
    } else {
      try {
        await addKnowledgeEntry({ title, content, category: formCategory, tags, isPinned: formPinned, visibility: formVisibility, sharedWith: formSharedWith });
        setShowAdd(false);
        resetForm();
        toast.success(t.toast.entryCreated);
      } catch (err: any) {
        toast.error(err.message || 'Failed to save');
      }
    }
  };

  const startEdit = (e: typeof knowledgeEntries[0]) => {
    const titleLt = typeof e.title === 'string' ? e.title : (e.title?.lt || '');
    const titleEn = typeof e.title === 'string' ? e.title : (e.title?.en || '');
    const contentLt = typeof e.content === 'string' ? e.content : (e.content?.lt || '');
    const contentEn = typeof e.content === 'string' ? e.content : (e.content?.en || '');
    // Determine which language this entry is in
    const entryLang = contentLt ? 'lt' : 'en';
    setFormLang(entryLang);
    setFormTitle(entryLang === 'lt' ? titleLt : titleEn);
    setFormContent(entryLang === 'lt' ? contentLt : contentEn);
    setFormCategory(e.category); setFormTags(e.tags.join(', ')); setFormPinned(e.isPinned);
    setEditEntry(e.id); setShowAdd(true); setViewEntry(null);
  };

  const catLabel = (cat: string) => categories.find(c => c.key === cat)?.label || cat;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t.knowledge.title}</h1>
          <p className="text-sm text-slate-500 mt-1">{t.knowledge.subtitle}</p>
        </div>
        <button className="btn-primary" onClick={() => { setEditEntry(null); resetForm(); setShowAdd(true); }}>
          <Plus size={16} /> {t.knowledge.addEntry}
        </button>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-1 mb-6 overflow-x-auto pb-2">
        {categories.map(cat => {
          const count = cat.key === 'all' ? knowledgeEntries.length : knowledgeEntries.filter(e => e.category === cat.key).length;
          return (
            <button key={cat.key} onClick={() => setCategoryFilter(cat.key)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap flex items-center gap-1 transition-colors ${categoryFilter === cat.key ? 'bg-primary-100 text-primary-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
              <cat.icon size={12} /> {cat.label} <span className="ml-1 text-[10px] opacity-60">{count}</span>
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative max-w-md mb-6">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input name="search" className="input pl-9" placeholder={t.knowledge.searchKnowledge} value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {/* Entries List */}
      <div className="border border-slate-200 rounded-xl bg-white divide-y divide-slate-100">
        {filtered.map(e => {
          const title = getText(e.title, lang);
          const content = getText(e.content, lang);
          const firstLine = content.split('\n')[0].slice(0, 120);
          return (
            <div
              key={e.id}
              className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 cursor-pointer transition-colors"
              onClick={() => setViewEntry(e.id)}
            >
              {e.isPinned && <Pin size={13} className="text-slate-400 flex-shrink-0" />}
              {!e.isPinned && <div className="w-[13px] flex-shrink-0" />}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-slate-900 truncate">{title}</span>
                </div>
                {firstLine && (
                  <p className="text-xs text-slate-500 truncate mt-0.5">{firstLine}{content.length > 120 ? '...' : ''}</p>
                )}
              </div>
              <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${
                e.category === 'process' ? 'bg-blue-50 text-blue-600' :
                e.category === 'terminology' ? 'bg-purple-50 text-purple-600' :
                e.category === 'mistake_to_avoid' ? 'bg-red-50 text-red-600' :
                e.category === 'tip' ? 'bg-green-50 text-green-600' :
                e.category === 'faq' ? 'bg-amber-50 text-amber-600' :
                'bg-slate-100 text-slate-500'
              }`}>{catLabel(e.category)}</span>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && <div className="text-center py-16 text-sm text-slate-500">{t.knowledge.noEntriesMatch}</div>}

      {/* View Entry Modal */}
      <Modal isOpen={!!entry} onClose={() => setViewEntry(null)} title={entry ? getText(entry.title, lang) : ''} size="lg"
        footer={entry ? <>
          <button className="btn-ghost" onClick={() => { updateKnowledgeEntry(entry.id, { isPinned: !entry.isPinned }); }}>
            {entry.isPinned ? <><PinOff size={14} /> {t.common.unpin}</> : <><Pin size={14} /> {t.common.pin}</>}
          </button>
          <div className="flex-1" />
          <button className="btn-danger btn-sm" onClick={() => { deleteKnowledgeEntry(entry.id); setViewEntry(null); toast.success(t.toast.entryDeleted); }}><Trash2 size={14} /> {t.common.delete}</button>
          <button className="btn-secondary" onClick={() => startEdit(entry)}><Edit2 size={14} /> {t.common.edit}</button>
        </> : undefined}
      >
        {entry && (
          <div className="space-y-4">
            <div className="flex gap-2 flex-wrap">
              <span className="badge-blue">{catLabel(entry.category)}</span>
              {entry.tags.map(tag => <span key={tag} className="badge-gray">{tag}</span>)}
            </div>
            <div className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{getText(entry.content, lang)}</div>
            <div className="text-xs text-slate-400">{t.knowledge.createdLabel}: {formatDate(entry.createdAt)} • {t.knowledge.updated}: {formatDate(entry.updatedAt)}</div>
          </div>
        )}
      </Modal>

      {/* Add/Edit Modal — Single language per entry */}
      <Modal isOpen={showAdd} onClose={() => { setShowAdd(false); setEditEntry(null); }} title={editEntry ? t.knowledge.editEntry : t.knowledge.newEntry} size="lg"
        footer={<><button className="btn-secondary" onClick={() => { setShowAdd(false); setEditEntry(null); }}>{t.common.cancel}</button><button className="btn-primary" onClick={handleSave}>{t.common.save}</button></>}
      >
        <div className="space-y-4">
          {/* Language selector */}
          <div className="flex items-center gap-3">
            <label className="label mb-0">{t.common.language || 'Language'}</label>
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
              <button onClick={() => setFormLang('lt')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${formLang === 'lt' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>
                LT
              </button>
              <button onClick={() => setFormLang('en')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${formLang === 'en' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>
                EN
              </button>
            </div>
          </div>

          <div><label className="label">{t.common.title} *</label>
            <input name="title" className="input" value={formTitle} onChange={(e) => setFormTitle(e.target.value)} /></div>
          <div><label className="label">{t.common.category}</label>
            <select name="category" className="select" value={formCategory} onChange={(e) => setFormCategory(e.target.value)}>
              {categories.filter(c => c.key !== 'all').map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
            </select>
          </div>
          <div><label className="label">{t.knowledge.content}</label>
            <textarea name="content" className="textarea" rows={10} value={formContent} onChange={(e) => setFormContent(e.target.value)} /></div>

          <div><label className="label">{t.clients.tagsSeparated}</label><input name="tags" className="input" value={formTags} onChange={(e) => setFormTags(e.target.value)} /></div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input name="pinned" type="checkbox" checked={formPinned} onChange={(e) => setFormPinned(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500" />
            <span className="text-sm text-slate-700">{t.knowledge.pinThisEntry}</span>
          </label>
          {!editEntry && <VisibilityPicker value={{ visibility: formVisibility, sharedWith: formSharedWith }} onChange={(v) => { setFormVisibility(v.visibility); setFormSharedWith(v.sharedWith); }} />}
        </div>
      </Modal>
    </div>
  );
}
