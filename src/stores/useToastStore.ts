import { create } from 'zustand';
import useErrorStore from './useErrorStore';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastState {
  toasts: Toast[];
  addToast: (type: ToastType, message: string, duration?: number) => void;
  removeToast: (id: string) => void;
  success: (message: string) => void;
  error: (message: string, action?: string) => void;
  warning: (message: string, action?: string) => void;
  info: (message: string) => void;
}

let counter = 0;

const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],

  addToast: (type, message, duration = 3000) => {
    const id = `toast-${++counter}-${Date.now()}`;
    const MAX_TOASTS = 1;
    const current = [...get().toasts, { id, type, message, duration }];
    // Remove oldest toasts if over limit
    const trimmed = current.length > MAX_TOASTS ? current.slice(current.length - MAX_TOASTS) : current;
    set({ toasts: trimmed });
    if (duration > 0) {
      setTimeout(() => get().removeToast(id), duration);
    }
  },

  removeToast: (id) => {
    set({ toasts: get().toasts.filter(t => t.id !== id) });
  },

  success: (message) => get().addToast('success', message, 2500),

  error: (message, action?) => {
    get().addToast('error', message, 5000);
    // Auto-capture to error log
    useErrorStore.getState().captureError({
      message,
      action: action || 'user_action_failed',
      severity: 'error',
    });
  },

  warning: (message, action?) => {
    get().addToast('warning', message, 4000);
    // Capture warnings too
    useErrorStore.getState().captureError({
      message,
      action: action || 'user_action_warning',
      severity: 'warning',
    });
  },

  info: (message) => get().addToast('info', message, 3000),
}));

export default useToastStore;
