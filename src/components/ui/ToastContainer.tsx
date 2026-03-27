import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';
import useToastStore from '../../stores/useToastStore';

const icons = {
  success: <CheckCircle2 size={16} className="text-success-600 flex-shrink-0" />,
  error: <XCircle size={16} className="text-danger-600 flex-shrink-0" />,
  warning: <AlertTriangle size={16} className="text-warning-600 flex-shrink-0" />,
  info: <Info size={16} className="text-primary-600 flex-shrink-0" />,
};

export default function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 max-w-sm w-full px-4">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className="flex items-start gap-2.5 px-4 py-3 rounded-lg border border-slate-200 bg-white shadow-sm text-sm font-medium text-slate-700 animate-slide-in"
          role="alert"
        >
          {icons[toast.type]}
          <span className="flex-1 leading-snug">{toast.message}</span>
          <button
            onClick={() => removeToast(toast.id)}
            className="text-slate-400 hover:text-slate-600 flex-shrink-0 -mr-1"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
