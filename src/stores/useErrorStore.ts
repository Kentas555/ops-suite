import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ErrorSeverity = 'error' | 'warning' | 'fatal';

export interface ErrorEntry {
  id: string;
  severity: ErrorSeverity;
  message: string;
  stack?: string;
  action?: string;
  component?: string;
  url: string;
  userAgent: string;
  timestamp: string;
  userId?: string;
  isRead: boolean;
}

interface ErrorState {
  errors: ErrorEntry[];
  captureError: (error: { message: string; stack?: string; action?: string; component?: string; severity?: ErrorSeverity }) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  clearErrors: () => void;
  deleteError: (id: string) => void;
  getUnreadCount: () => number;
}

let errorCounter = 0;
let lastErrorKey = '';
let lastErrorTime = 0;

const useErrorStore = create<ErrorState>()(
  persist(
    (set, get) => ({
      errors: [],

      captureError: ({ message, stack, action, component, severity = 'error' }) => {
        // Deduplicate: skip if same error within 2 seconds
        const errorKey = `${message}|${action}`;
        const now = Date.now();
        if (errorKey === lastErrorKey && now - lastErrorTime < 2000) return;
        lastErrorKey = errorKey;
        lastErrorTime = now;

        const id = `err-${++errorCounter}-${now}`;
        const entry: ErrorEntry = {
          id,
          severity,
          message,
          stack,
          action,
          component,
          url: window.location.pathname,
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString(),
          isRead: false,
        };
        set({ errors: [entry, ...get().errors].slice(0, 200) }); // Keep max 200 entries
      },

      markRead: (id) => set({ errors: get().errors.map(e => e.id === id ? { ...e, isRead: true } : e) }),
      markAllRead: () => set({ errors: get().errors.map(e => ({ ...e, isRead: true })) }),
      clearErrors: () => set({ errors: [] }),
      deleteError: (id) => set({ errors: get().errors.filter(e => e.id !== id) }),
      getUnreadCount: () => get().errors.filter(e => !e.isRead).length,
    }),
    { name: 'ops-suite-errors' }
  )
);

// Errors to ignore (Vite HMR, browser extensions, etc.)
const IGNORED_PATTERNS = [
  /reading 'send'/i,
  /hmr/i,
  /websocket/i,
  /chrome-extension/i,
  /moz-extension/i,
];

function shouldIgnore(message: string, stack?: string): boolean {
  const text = `${message} ${stack || ''}`;
  return IGNORED_PATTERNS.some(pattern => pattern.test(text));
}

// Global window error handler
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    const message = event.message || 'Unknown runtime error';
    const stack = event.error?.stack;
    if (shouldIgnore(message, stack)) return;
    useErrorStore.getState().captureError({
      message,
      stack,
      component: event.filename,
      severity: 'error',
      action: 'window.onerror',
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    const message = event.reason?.message || String(event.reason) || 'Unhandled promise rejection';
    const stack = event.reason?.stack;
    if (shouldIgnore(message, stack)) return;
    useErrorStore.getState().captureError({
      message,
      stack,
      severity: 'error',
      action: 'unhandledrejection',
    });
  });
}

export default useErrorStore;
