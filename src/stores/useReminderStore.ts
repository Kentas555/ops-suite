import { create } from 'zustand';
import { supabase } from '../lib/supabase';

export interface Reminder {
  id: string;
  title: string;
  description?: string;
  dueAt: string;
  clientId?: string;
  clientName?: string;
  isRead: boolean;
  isDismissed: boolean;
  createdAt: string;
}

interface ReminderState {
  reminders: Reminder[];
  initialized: boolean;

  fetchReminders: () => Promise<void>;
  addReminder: (reminder: Omit<Reminder, 'id' | 'isRead' | 'isDismissed' | 'createdAt'>) => Promise<void>;
  markRead: (id: string) => Promise<void>;
  dismiss: (id: string) => Promise<void>;
  deleteReminder: (id: string) => Promise<void>;
  getActiveReminders: () => Reminder[];
  getUnreadCount: () => number;
}

function mapReminder(r: Record<string, unknown>): Reminder {
  return {
    id: r.id as string,
    title: (r.title as string) || '',
    description: r.description as string | undefined,
    dueAt: r.due_at as string,
    clientId: r.client_id as string | undefined,
    clientName: r.client_name as string | undefined,
    isRead: r.is_read as boolean,
    isDismissed: r.is_dismissed as boolean,
    createdAt: r.created_at as string,
  };
}

const useReminderStore = create<ReminderState>()((set, get) => ({
  reminders: [],
  initialized: false,

  fetchReminders: async () => {
    const { data, error } = await supabase
      .from('reminders')
      .select('*')
      .order('due_at');
    if (error) {
      console.error('[fetchReminders] error:', error.message);
    }
    set({
      reminders: (data || []).map(r => mapReminder(r as Record<string, unknown>)),
      initialized: true,
    });
  },

  addReminder: async (reminderData) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const id = crypto.randomUUID();
    const newReminder: Reminder = {
      ...reminderData,
      id,
      isRead: false,
      isDismissed: false,
      createdAt: new Date().toISOString(),
    };

    set(s => ({ reminders: [...s.reminders, newReminder] }));

    const { error } = await supabase.from('reminders').insert({
      id,
      title: reminderData.title,
      description: reminderData.description,
      due_at: reminderData.dueAt,
      client_id: reminderData.clientId || null,
      client_name: reminderData.clientName,
      is_read: false,
      is_dismissed: false,
      user_id: user.id,
    });
    if (error) {
      console.error('[addReminder] INSERT failed:', error.message);
      set(s => ({ reminders: s.reminders.filter(r => r.id !== id) }));
    }
  },

  markRead: async (id) => {
    set(s => ({
      reminders: s.reminders.map(r => r.id === id ? { ...r, isRead: true } : r),
    }));
    const { error } = await supabase.from('reminders').update({ is_read: true }).eq('id', id);
    if (error) console.error('[markRead] UPDATE failed:', error.message);
  },

  dismiss: async (id) => {
    set(s => ({
      reminders: s.reminders.map(r => r.id === id ? { ...r, isDismissed: true, isRead: true } : r),
    }));
    const { error } = await supabase.from('reminders').update({ is_dismissed: true, is_read: true }).eq('id', id);
    if (error) console.error('[dismiss] UPDATE failed:', error.message);
  },

  deleteReminder: async (id) => {
    set(s => ({ reminders: s.reminders.filter(r => r.id !== id) }));
    const { error } = await supabase.from('reminders').delete().eq('id', id);
    if (error) console.error('[deleteReminder] DELETE failed:', error.message);
  },

  getActiveReminders: () => {
    const n = new Date().toISOString();
    return get().reminders
      .filter(r => !r.isDismissed && r.dueAt <= n)
      .sort((a, b) => a.dueAt.localeCompare(b.dueAt));
  },

  getUnreadCount: () => {
    const n = new Date().toISOString();
    return get().reminders.filter(r => !r.isDismissed && !r.isRead && r.dueAt <= n).length;
  },
}));

export default useReminderStore;
