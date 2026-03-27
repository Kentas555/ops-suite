import { useState, useMemo } from 'react';
import { Plus, Search, Copy, Check, Edit2, Trash2, AlertTriangle, Globe } from 'lucide-react';
import useStore from '../stores/useStore';
import useToastStore from '../stores/useToastStore';
import { useTranslation } from '../i18n/useTranslation';
import Modal from '../components/ui/Modal';
import type { QuickReplyCategory, BilingualText } from '../types';
import { getText, isMissingTranslation } from '../utils/bilingual';

const categoryKeys: Array<'all' | QuickReplyCategory> = ['all', 'general', 'follow_up', 'onboarding', 'missing_info', 'pricing', 'issues'];

export default function QuickReplies() {
  const { quickReplies, addQuickReply, updateQuickReply, deleteQuickReply, incrementQuickReplyUsage } = useStore();
  const { t, lang } = useTranslation();
  const toast = useToastStore();

  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState<'all' | QuickReplyCategory>('all');
  const [sortBy, setSortBy] = useState<'most_used' | 'newest' | 'alpha'>('most_used');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  // Form — bilingual: LT tab and EN tab
  const [formLt, setFormLt] = useState({ title: '', message: '' });
  const [formEn, setFormEn] = useState({ title: '', message: '' });
  const [formCategory, setFormCategory] = useState<QuickReplyCategory>('general');
  const [formLang, setFormLang] = useState<'lt' | 'en'>('lt'); // Which tab is active in form

  const categoryLabel = (cat: string): string => {
    const map: Record<string, string> = {
      all: t.replies.allCategories, pricing: t.replies.pricing, onboarding: t.replies.onboarding,
      missing_info: t.replies.missingInfo, follow_up: t.replies.followUp, issues: t.replies.issues, general: t.replies.general,
    };
    return map[cat] || cat;
  };

  const categoryColor = (cat: string): string => {
    const map: Record<string, string> = {
      pricing: 'bg-amber-50 text-amber-700 ring-amber-200', onboarding: 'bg-blue-50 text-blue-700 ring-blue-200',
      missing_info: 'bg-red-50 text-red-700 ring-red-200', follow_up: 'bg-purple-50 text-purple-700 ring-purple-200',
      issues: 'bg-danger-50 text-danger-700 ring-red-200', general: 'bg-slate-100 text-slate-600 ring-slate-200',
    };
    return map[cat] || 'bg-slate-100 text-slate-600 ring-slate-200';
  };

  const filtered = useMemo(() => {
    let result = quickReplies.filter(r => {
      if (catFilter !== 'all' && r.category !== catFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return getText(r.title, 'lt').toLowerCase().includes(q) || getText(r.message, 'lt').toLowerCase().includes(q)
          || (r.title?.lt || '').toLowerCase().includes(q) || (r.title?.en || '').toLowerCase().includes(q)
          || (r.message?.lt || '').toLowerCase().includes(q) || (r.message?.en || '').toLowerCase().includes(q);
      }
      return true;
    });
    if (sortBy === 'most_used') result.sort((a, b) => b.usageCount - a.usageCount);
    else if (sortBy === 'newest') result.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    else result.sort((a, b) => getText(a.title, 'lt').localeCompare(getText(b.title, 'lt')));
    return result;
  }, [quickReplies, catFilter, search, sortBy]);

  const handleCopy = (reply: typeof quickReplies[0]) => {
    // Always copy Lithuanian content first (primary communication language)
    navigator.clipboard.writeText(getText(reply.message, 'lt'));
    incrementQuickReplyUsage(reply.id);
    setCopiedId(reply.id);
    toast.success(t.replies.copySuccess);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const resetForm = () => {
    setFormLt({ title: '', message: '' });
    setFormEn({ title: '', message: '' });
    setFormCategory('general');
    setFormLang('lt');
  };

  const handleSave = () => {
    if (!formLt.title.trim() && !formEn.title.trim()) return;
    if (!formLt.message.trim() && !formEn.message.trim()) return;
    const title: BilingualText = { lt: formLt.title, en: formEn.title };
    const message: BilingualText = { lt: formLt.message, en: formEn.message };
    if (editId) {
      updateQuickReply(editId, { title, category: formCategory, message });
      toast.success(t.toast.changesSaved);
    } else {
      addQuickReply({ title, category: formCategory, message });
      toast.success(t.toast.entryCreated);
    }
    setShowAdd(false);
    setEditId(null);
    resetForm();
  };

  const startEdit = (r: typeof quickReplies[0]) => {
    const titleLt = typeof r.title === 'string' ? r.title : (r.title?.lt || '');
    const titleEn = typeof r.title === 'string' ? r.title : (r.title?.en || '');
    const msgLt = typeof r.message === 'string' ? r.message : (r.message?.lt || '');
    const msgEn = typeof r.message === 'string' ? r.message : (r.message?.en || '');
    setFormLt({ title: titleLt, message: msgLt });
    setFormEn({ title: titleEn, message: msgEn });
    setFormCategory(r.category);
    setFormLang(msgLt ? 'lt' : 'en');
    setEditId(r.id);
    setShowAdd(true);
  };

  const currentForm = formLang === 'lt' ? formLt : formEn;
  const setCurrentForm = formLang === 'lt' ? setFormLt : setFormEn;
  const otherLang = formLang === 'lt' ? 'en' : 'lt';
  const otherForm = formLang === 'lt' ? formEn : formLt;
  const hasContent = formLt.message.trim() || formEn.message.trim();
  const hasTitle = formLt.title.trim() || formEn.title.trim();

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t.replies.title}</h1>
          <p className="text-sm text-slate-500 mt-1">{t.replies.subtitle}</p>
        </div>
        <button className="btn-primary" onClick={() => { setEditId(null); resetForm(); setShowAdd(true); }}>
          <Plus size={16} /> {t.replies.newReply}
        </button>
      </div>

      {/* Search + Sort */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input name="search" className="input pl-9" placeholder={t.replies.searchReplies} value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select name="sortBy" className="select w-40" value={sortBy} onChange={(e) => setSortBy(e.target.value as any)}>
          <option value="most_used">{t.replies.sortMostUsed}</option>
          <option value="newest">{t.replies.sortNewest}</option>
          <option value="alpha">{t.replies.sortAlpha}</option>
        </select>
      </div>

      {/* Category Pills */}
      <div className="flex gap-1.5 mb-4 flex-wrap">
        {categoryKeys.map(cat => {
          const count = cat === 'all' ? quickReplies.length : quickReplies.filter(r => r.category === cat).length;
          return (
            <button key={cat} onClick={() => setCatFilter(cat)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${catFilter === cat ? 'bg-primary-100 text-primary-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
              {categoryLabel(cat)} <span className="ml-1 opacity-50">{count}</span>
            </button>
          );
        })}
      </div>

      {/* Reply List */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-sm text-slate-500">{t.replies.noRepliesMatch}</div>
      ) : (
        <div className="space-y-1">
          {filtered.map(reply => {
            const isCopied = copiedId === reply.id;
            // Always show Lithuanian content as primary (communication language)
            const title = getText(reply.title, 'lt');
            const message = getText(reply.message, 'lt');
            const missingLt = isMissingTranslation(reply.message, 'lt');
            const missingCurrent = missingLt;
            const missingOther = isMissingTranslation(reply.message, 'en');

            return (
              <div key={reply.id} className="card px-4 py-2.5 group hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  {/* Title + category */}
                  <span className="text-sm font-medium text-slate-900 truncate">{title}</span>
                  <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-medium rounded-full ring-1 flex-shrink-0 ${categoryColor(reply.category)}`}>
                    {categoryLabel(reply.category)}
                  </span>
                  {reply.usageCount > 0 && <span className="text-[10px] text-slate-400 flex-shrink-0">{reply.usageCount}x</span>}
                  {missingCurrent && (
                    <span className="text-[10px] text-amber-600 flex items-center gap-0.5 flex-shrink-0" title={t.bilingual.showingFallback}>
                      <Globe size={10} /> {t.bilingual.showingFallback}
                    </span>
                  )}
                  {missingOther && (
                    <span className="text-[10px] text-slate-400 flex items-center gap-0.5 flex-shrink-0">
                      <AlertTriangle size={9} /> {lang === 'lt' ? 'EN' : 'LT'} {t.bilingual.translationMissing}
                    </span>
                  )}

                  {/* Spacer */}
                  <div className="flex-1" />

                  {/* Actions — visible on hover */}
                  <div className="flex gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleCopy(reply)}
                      className={`p-1.5 rounded-lg transition-colors ${isCopied ? 'bg-success-100 text-success-600' : 'hover:bg-slate-200 text-slate-400 hover:text-slate-600'}`}
                      title={t.common.copy}>
                      {isCopied ? <Check size={14} /> : <Copy size={14} />}
                    </button>
                    <button onClick={() => startEdit(reply)} className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-600"><Edit2 size={14} /></button>
                    <button onClick={() => { deleteQuickReply(reply.id); toast.success(t.toast.entryDeleted); }} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-danger-600"><Trash2 size={14} /></button>
                  </div>
                </div>
                <p className="text-xs text-slate-500 mt-1 truncate">{message}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Modal — Bilingual */}
      <Modal isOpen={showAdd} onClose={() => { setShowAdd(false); setEditId(null); }} title={editId ? t.replies.editReply : t.replies.newReply} size="lg"
        footer={<>
          <button className="btn-secondary" onClick={() => { setShowAdd(false); setEditId(null); }}>{t.common.cancel}</button>
          <button className="btn-primary" onClick={handleSave} disabled={!hasTitle || !hasContent}>{t.common.save}</button>
        </>}
      >
        <div className="space-y-4">
          {/* Language tabs */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg w-fit">
            <button onClick={() => setFormLang('lt')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 ${formLang === 'lt' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
              LT
              {formLt.message.trim() && <span className="w-1.5 h-1.5 bg-success-500 rounded-full" />}
              {!formLt.message.trim() && formEn.message.trim() && <span className="w-1.5 h-1.5 bg-amber-400 rounded-full" />}
            </button>
            <button onClick={() => setFormLang('en')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 ${formLang === 'en' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
              EN
              {formEn.message.trim() && <span className="w-1.5 h-1.5 bg-success-500 rounded-full" />}
              {!formEn.message.trim() && formLt.message.trim() && <span className="w-1.5 h-1.5 bg-amber-400 rounded-full" />}
            </button>
          </div>

          {/* Hint about primary language */}
          {formLang === 'lt' && <p className="text-[11px] text-primary-600">{t.bilingual.primaryLt}</p>}

          <div>
            <label className="label">{t.common.title} * <span className="text-slate-400 font-normal uppercase text-[10px]">({formLang})</span></label>
            <input name="title" className="input" value={currentForm.title} onChange={(e) => setCurrentForm({ ...currentForm, title: e.target.value })} autoFocus />
          </div>

          <div>
            <label className="label">{t.common.category}</label>
            <select name="category" className="select" value={formCategory} onChange={(e) => setFormCategory(e.target.value as QuickReplyCategory)}>
              {categoryKeys.filter(c => c !== 'all').map(cat => (<option key={cat} value={cat}>{categoryLabel(cat)}</option>))}
            </select>
          </div>

          <div>
            <label className="label">{t.replies.messageContent} * <span className="text-slate-400 font-normal uppercase text-[10px]">({formLang})</span></label>
            <textarea name="message" className="textarea" rows={7} value={currentForm.message} onChange={(e) => setCurrentForm({ ...currentForm, message: e.target.value })} placeholder={t.replies.messagePlaceholder} />
          </div>

          {/* Show other language version if it exists */}
          {otherForm.message.trim() && (
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <div className="text-[10px] font-semibold text-slate-400 uppercase mb-1">{otherLang === 'lt' ? t.bilingual.ltVersion : t.bilingual.enVersion}</div>
              <p className="text-xs text-slate-600 line-clamp-3 whitespace-pre-wrap">{otherForm.message}</p>
            </div>
          )}

          {/* Missing translation hint */}
          {!otherForm.message.trim() && currentForm.message.trim() && (
            <div className="flex items-center gap-2 p-2 bg-amber-50 rounded-lg border border-amber-100">
              <AlertTriangle size={14} className="text-amber-500 flex-shrink-0" />
              <span className="text-xs text-amber-700">
                {otherLang.toUpperCase()} {t.bilingual.translationMissing} —{' '}
                <button className="underline font-medium" onClick={() => setFormLang(otherLang as 'lt' | 'en')}>{t.bilingual.addTranslation}</button>
              </span>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
