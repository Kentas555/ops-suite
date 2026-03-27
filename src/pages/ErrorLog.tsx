import { useState } from 'react';
import { Trash2, CheckCheck, AlertTriangle, AlertOctagon, XCircle, ChevronDown, ChevronUp } from 'lucide-react';
import useErrorStore, { type ErrorEntry, type ErrorSeverity } from '../stores/useErrorStore';
import { useTranslation } from '../i18n/useTranslation';
import useToastStore from '../stores/useToastStore';

export default function ErrorLog() {
  const { errors, markRead, markAllRead, clearErrors, deleteError, getUnreadCount } = useErrorStore();
  const { t } = useTranslation();
  const toast = useToastStore();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [severityFilter, setSeverityFilter] = useState<'all' | ErrorSeverity>('all');

  const filtered = severityFilter === 'all' ? errors : errors.filter(e => e.severity === severityFilter);
  const unreadCount = getUnreadCount();

  const severityIcon = (severity: ErrorSeverity) => {
    if (severity === 'fatal') return <AlertOctagon size={16} className="text-danger-600" />;
    if (severity === 'error') return <XCircle size={16} className="text-danger-500" />;
    return <AlertTriangle size={16} className="text-warning-500" />;
  };

  const severityBadge = (severity: ErrorSeverity) => {
    const cls = severity === 'fatal' ? 'bg-danger-100 text-danger-800' : severity === 'error' ? 'bg-danger-50 text-danger-700' : 'bg-warning-50 text-warning-700';
    return <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium uppercase ${cls}`}>{severity}</span>;
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString();
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t.errorLog.title}</h1>
          <p className="text-sm text-slate-500 mt-1">
            {errors.length} {t.errorLog.totalErrors} {unreadCount > 0 && <span className="text-danger-600 font-medium">({unreadCount} {t.errorLog.unread})</span>}
          </p>
        </div>
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <button className="btn-secondary btn-sm" onClick={() => { markAllRead(); }}>
              <CheckCheck size={14} /> {t.errorLog.markAllRead}
            </button>
          )}
          {errors.length > 0 && (
            <button className="btn-danger btn-sm" onClick={() => { clearErrors(); toast.info(t.errorLog.cleared); }}>
              <Trash2 size={14} /> {t.errorLog.clearAll}
            </button>
          )}
        </div>
      </div>

      {/* Severity Filter */}
      <div className="flex gap-2 mb-6">
        {(['all', 'fatal', 'error', 'warning'] as const).map(sev => (
          <button key={sev} onClick={() => setSeverityFilter(sev)}
            className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${severityFilter === sev ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
            {sev === 'all' ? t.common.all : sev.charAt(0).toUpperCase() + sev.slice(1)}
            <span className="ml-1 opacity-60">
              {sev === 'all' ? errors.length : errors.filter(e => e.severity === sev).length}
            </span>
          </button>
        ))}
      </div>

      {/* Error List */}
      {filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <AlertTriangle size={24} className="text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-slate-500">{t.errorLog.noErrors}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(err => {
            const isExpanded = expandedId === err.id;
            return (
              <div key={err.id} className={`card overflow-hidden ${!err.isRead ? 'ring-1 ring-danger-200' : ''}`}>
                <div
                  className="px-5 py-3 flex items-start gap-3 cursor-pointer hover:bg-slate-50"
                  onClick={() => { setExpandedId(isExpanded ? null : err.id); if (!err.isRead) markRead(err.id); }}
                >
                  <div className="mt-0.5">{severityIcon(err.severity)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      {severityBadge(err.severity)}
                      {!err.isRead && <span className="w-2 h-2 bg-danger-500 rounded-full" />}
                    </div>
                    <div className="text-sm font-medium text-slate-900 truncate font-mono">{err.message}</div>
                    <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-400">
                      <span>{formatTime(err.timestamp)}</span>
                      {err.action && <span className="text-slate-500">{t.errorLog.action}: {err.action}</span>}
                      <span>{err.url}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={(e) => { e.stopPropagation(); deleteError(err.id); }} className="p-1 rounded hover:bg-slate-200 text-slate-400"><Trash2 size={12} /></button>
                    {isExpanded ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
                  </div>
                </div>

                {isExpanded && (
                  <div className="px-5 pb-4 border-t border-slate-100 pt-3 bg-slate-50">
                    <div className="grid grid-cols-2 gap-4 text-xs mb-3">
                      <div>
                        <span className="text-slate-400 uppercase font-semibold">{t.errorLog.timestamp}</span>
                        <div className="text-slate-700 mt-0.5 font-mono">{formatTime(err.timestamp)}</div>
                      </div>
                      <div>
                        <span className="text-slate-400 uppercase font-semibold">{t.errorLog.page}</span>
                        <div className="text-slate-700 mt-0.5 font-mono">{err.url}</div>
                      </div>
                      {err.action && (
                        <div>
                          <span className="text-slate-400 uppercase font-semibold">{t.errorLog.action}</span>
                          <div className="text-slate-700 mt-0.5">{err.action}</div>
                        </div>
                      )}
                      {err.component && (
                        <div>
                          <span className="text-slate-400 uppercase font-semibold">{t.errorLog.component}</span>
                          <div className="text-slate-700 mt-0.5 font-mono text-[10px] truncate">{err.component}</div>
                        </div>
                      )}
                    </div>

                    {err.stack && (
                      <div>
                        <span className="text-slate-400 uppercase font-semibold text-xs">{t.errorLog.stackTrace}</span>
                        <pre className="mt-1 p-3 bg-slate-900 text-green-400 text-[10px] font-mono rounded-lg overflow-x-auto max-h-48 leading-relaxed">
                          {err.stack}
                        </pre>
                      </div>
                    )}

                    <div className="mt-3 text-[10px] text-slate-400 font-mono truncate">
                      UA: {err.userAgent}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
