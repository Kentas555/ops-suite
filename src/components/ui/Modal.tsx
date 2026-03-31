import { useEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: () => void; // Cmd+Enter triggers this
  title: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  footer?: ReactNode;
}

export default function Modal({ isOpen, onClose, onSubmit, title, children, size = 'md', footer }: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && onSubmit) {
        e.preventDefault();
        onSubmit();
      }
    };
    if (isOpen) window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose, onSubmit]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  return (
    <div
      ref={overlayRef}
      className="modal-overlay fixed inset-0 z-50 flex items-start justify-center pt-4 sm:pt-[10vh] px-3 sm:px-4 bg-black/40 backdrop-blur-sm overflow-y-auto"
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div className={`modal-content w-full min-w-0 ${sizeClasses[size]} bg-white rounded-2xl shadow-xl max-h-[85vh] sm:max-h-[80vh] flex flex-col my-4`} style={{ background: 'var(--surface-0)' }}>
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-200 flex-shrink-0">
          <h2 className="text-base sm:text-lg font-semibold text-slate-900 min-w-0 truncate pr-2">{title}</h2>
          <button onClick={onClose} className="p-2 -mr-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors flex-shrink-0">
            <X size={20} />
          </button>
        </div>
        <div className="px-4 sm:px-6 py-4 overflow-y-auto flex-1 min-h-0">{children}</div>
        {footer && (
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-slate-200 flex flex-wrap justify-end gap-2 sm:gap-3 flex-shrink-0">
            {footer}
            {onSubmit && (
              <span className="hidden sm:inline text-[10px] text-slate-300 self-center ml-1">⌘↵</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
