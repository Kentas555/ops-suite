import { useState } from 'react';
import { Copy, Check, RotateCcw, Trash2, ChevronDown, Wand2, FileText } from 'lucide-react';
import useStore from '../stores/useStore';
import useToastStore from '../stores/useToastStore';
import { useTranslation } from '../i18n/useTranslation';
import { generateReply, detectLanguage, type AITone, type DetectedLanguage } from '../services/aiReplyService';
import { getText } from '../utils/bilingual';

export default function AIReply() {
  const { quickReplies } = useStore();
  const { t, lang } = useTranslation();
  const toast = useToastStore();

  // Input
  const [clientMessage, setClientMessage] = useState('');
  const [tone, setTone] = useState<AITone>('professional');
  const [maxLength, setMaxLength] = useState<'short' | 'medium' | 'long'>('medium');
  const [templateContext, setTemplateContext] = useState('');
  const [showTemplateSelect, setShowTemplateSelect] = useState(false);

  // Output
  const [generatedReply, setGeneratedReply] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [detectedLang, setDetectedLang] = useState<DetectedLanguage>('unknown');

  // Live language detection as user types
  const liveDetected = clientMessage.trim().length > 10 ? detectLanguage(clientMessage) : 'unknown';

  const handleGenerate = async () => {
    if (!clientMessage.trim()) return;
    setIsGenerating(true);
    setGeneratedReply('');
    setCopied(false);
    setEditMode(false);

    const result = await generateReply({
      clientMessage,
      tone,
      context: templateContext || undefined,
      maxLength,
      language: lang === 'lt' ? 'lt' : 'en', // Fallback only — detection takes priority in the service
    });

    if (result.success) {
      setGeneratedReply(result.reply);
      setDetectedLang(result.detectedLanguage);
    } else {
      toast.error(result.error || t.aiReply.generationFailed);
    }
    setIsGenerating(false);
  };

  const handleCopy = () => {
    if (!generatedReply) return;
    navigator.clipboard.writeText(generatedReply);
    setCopied(true);
    toast.success(t.toast.copied);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = () => {
    setClientMessage('');
    setGeneratedReply('');
    setTemplateContext('');
    setCopied(false);
    setEditMode(false);
    setDetectedLang('unknown');
  };

  const handleUseTemplate = (message: string) => {
    setTemplateContext(message);
    setShowTemplateSelect(false);
  };

  const toneOptions: { value: AITone; label: string; desc: string }[] = [
    { value: 'professional', label: t.aiReply.toneProfessional, desc: t.aiReply.toneProfessionalDesc },
    { value: 'friendly', label: t.aiReply.toneFriendly, desc: t.aiReply.toneFriendlyDesc },
    { value: 'formal', label: t.aiReply.toneFormal, desc: t.aiReply.toneFormalDesc },
    { value: 'concise', label: t.aiReply.toneConcise, desc: t.aiReply.toneConciseDesc },
  ];

  const lengthOptions = [
    { value: 'short' as const, label: t.aiReply.lengthShort },
    { value: 'medium' as const, label: t.aiReply.lengthMedium },
    { value: 'long' as const, label: t.aiReply.lengthLong },
  ];

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900">{t.aiReply.title}</h1>
            <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-primary-50 text-primary-700">
              Gemini
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">{t.aiReply.subtitle}</p>
        </div>
        {(clientMessage || generatedReply) && (
          <button className="btn-ghost text-xs" onClick={handleClear}>
            <Trash2 size={14} /> {t.aiReply.clearAll}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left — Input */}
        <div className="space-y-4">
          {/* Client Message Input */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-2">
              <label className="label mb-0">{t.aiReply.clientMessage}</label>
              {liveDetected !== 'unknown' && (
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                  liveDetected === 'lt' ? 'bg-green-50 text-green-700 ring-1 ring-green-200' : 'bg-blue-50 text-blue-700 ring-1 ring-blue-200'
                }`}>
                  {liveDetected === 'lt' ? 'LT' : 'EN'} {t.aiReply.detected}
                </span>
              )}
            </div>
            <textarea
              name="clientMessage"
              className="textarea"
              rows={7}
              value={clientMessage}
              onChange={(e) => setClientMessage(e.target.value)}
              placeholder={t.aiReply.clientMessagePlaceholder}
            />
          </div>

          {/* Controls */}
          <div className="card p-5 space-y-4">
            {/* Tone selector — simple dropdown */}
            <div>
              <label className="label mb-2">{t.aiReply.toneLabel}</label>
              <select
                name="tone"
                className="select"
                value={tone}
                onChange={(e) => setTone(e.target.value as AITone)}
              >
                {toneOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* Length */}
            <div>
              <label className="label mb-2">{t.aiReply.lengthLabel}</label>
              <div className="flex gap-2">
                {lengthOptions.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setMaxLength(opt.value)}
                    className={`flex-1 py-1.5 text-xs font-medium rounded-lg border transition-all ${
                      maxLength === opt.value
                        ? 'border-primary-300 bg-primary-50 text-primary-700'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Template context */}
            <div>
              <label className="label mb-2">{t.aiReply.templateContext}</label>
              {templateContext ? (
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 relative">
                  <p className="text-xs text-slate-600 line-clamp-3 pr-6">{templateContext}</p>
                  <button
                    onClick={() => setTemplateContext('')}
                    className="absolute top-2 right-2 p-1 rounded hover:bg-slate-200 text-slate-400"
                  >
                    <RotateCcw size={12} />
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <button
                    onClick={() => setShowTemplateSelect(!showTemplateSelect)}
                    className="w-full px-3 py-2 text-xs text-left border border-dashed border-slate-300 rounded-lg text-slate-500 hover:bg-slate-50 hover:border-slate-400 transition-colors flex items-center gap-2"
                  >
                    <FileText size={14} />
                    {t.aiReply.selectTemplate}
                    <ChevronDown size={12} className="ml-auto" />
                  </button>
                  {showTemplateSelect && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl border border-slate-200 shadow-lg z-20 max-h-48 overflow-y-auto">
                      {quickReplies.map(r => (
                        <button
                          key={r.id}
                          onClick={() => handleUseTemplate(getText(r.message, lang))}
                          className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 border-b border-slate-50 last:border-0"
                        >
                          <div className="font-medium text-slate-900">{getText(r.title, lang)}</div>
                          <div className="text-slate-500 truncate mt-0.5">{getText(r.message, lang).slice(0, 60)}...</div>
                        </button>
                      ))}
                      {quickReplies.length === 0 && (
                        <div className="px-3 py-4 text-xs text-slate-400 text-center">{t.aiReply.noTemplates}</div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Generate Button */}
            <button
              onClick={handleGenerate}
              disabled={!clientMessage.trim() || isGenerating}
              className="btn-primary w-full justify-center py-3"
            >
              {isGenerating ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {t.aiReply.generating}
                </span>
              ) : (
                <><Wand2 size={16} /> {t.aiReply.generateReply}</>
              )}
            </button>
          </div>
        </div>

        {/* Right — Output */}
        <div className="space-y-4">
          <div className={`card p-5 min-h-[300px] flex flex-col ${!generatedReply && !isGenerating ? 'items-center justify-center' : ''}`}>
            {!generatedReply && !isGenerating && (
              <p className="text-sm text-slate-500">{t.aiReply.emptyStateDesc}</p>
            )}

            {isGenerating && (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-8 h-8 border-2 border-slate-200 border-t-slate-600 rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-sm text-slate-500">{t.aiReply.generating}</p>
                </div>
              </div>
            )}

            {generatedReply && !isGenerating && (
              <>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-semibold text-slate-500 uppercase">{t.aiReply.suggestedReply}</label>
                    {detectedLang !== 'unknown' && (
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                        detectedLang === 'lt' ? 'bg-green-50 text-green-700 ring-1 ring-green-200' : 'bg-blue-50 text-blue-700 ring-1 ring-blue-200'
                      }`} title={t.aiReply.autoDetected}>
                        {detectedLang === 'lt' ? 'LT' : 'EN'}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setEditMode(!editMode)}
                      className={`btn-ghost btn-sm text-xs ${editMode ? 'bg-primary-50 text-primary-700' : ''}`}
                    >
                      {editMode ? <Check size={12} /> : <FileText size={12} />}
                      {editMode ? t.common.done : t.common.edit}
                    </button>
                    <button onClick={handleGenerate} className="btn-ghost btn-sm text-xs" title={t.aiReply.regenerate}>
                      <RotateCcw size={12} />
                    </button>
                  </div>
                </div>

                {editMode ? (
                  <textarea
                    name="generatedReply"
                    className="textarea flex-1"
                    rows={12}
                    value={generatedReply}
                    onChange={(e) => setGeneratedReply(e.target.value)}
                  />
                ) : (
                  <div className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed bg-slate-50 p-4 rounded-lg flex-1 overflow-y-auto">
                    {generatedReply}
                  </div>
                )}

                {/* Copy button */}
                <button
                  onClick={handleCopy}
                  className={`mt-4 w-full justify-center py-2.5 ${copied ? 'btn-secondary' : 'btn-primary'}`}
                >
                  {copied ? <><Check size={16} /> {t.common.copied}</> : <><Copy size={16} /> {t.aiReply.copyReply}</>}
                </button>
              </>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
