import { create } from 'zustand';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export interface AppProfile {
  id: string;
  email?: string;
  displayName: string;
  role: 'admin' | 'user';
  isActive: boolean;
  createdAt: string;
  lastLoginAt?: string;
}

interface AuthState {
  session: Session | null;
  profile: AppProfile | null;
  profiles: AppProfile[];
  initialized: boolean;

  initialize: () => Promise<() => void>;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  getCurrentUser: () => AppProfile | null;

  fetchProfiles: () => Promise<void>;
  updateProfile: (id: string, updates: Partial<Pick<AppProfile, 'displayName' | 'role' | 'isActive'>>) => Promise<void>;
  createUser: (email: string, password: string, displayName: string, role: 'admin' | 'user') => Promise<{ success: boolean; error?: string }>;
  changePassword: (newPassword: string) => Promise<{ success: boolean; error?: string }>;
  adminResetPassword: (userId: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
}

function mapProfile(row: Record<string, unknown>, email?: string): AppProfile {
  return {
    id: row.id as string,
    email,
    displayName: (row.display_name as string) || '',
    role: (row.role as 'admin' | 'user') || 'user',
    isActive: row.is_active as boolean,
    createdAt: row.created_at as string,
    lastLoginAt: (row.last_login_at as string) ?? undefined,
  };
}

async function safeFetchJson(res: Response): Promise<{ ok: boolean; json: any }> {
  try {
    const json = await res.json();
    return { ok: res.ok, json };
  } catch {
    return { ok: false, json: { error: `HTTP ${res.status}` } };
  }
}

const useAuthStore = create<AuthState>()((set, get) => ({
  session: null,
  profile: null,
  profiles: [],
  initialized: false,

  initialize: async () => {
    const { data: { session } } = await supabase.auth.getSession();

    if (session?.user) {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (data) {
        supabase
          .from('profiles')
          .update({ last_login_at: new Date().toISOString() })
          .eq('id', session.user.id)
          .then(({ error }) => { if (error) console.error('[auth] last_login_at update failed:', error.message); });

        set({
          session,
          profile: mapProfile(data, session.user.email),
          initialized: true,
        });

        // Load all profiles so VisibilityPicker and UserManagement have data immediately
        get().fetchProfiles();
      } else {
        set({ session, initialized: true });
      }
    } else {
      set({ initialized: true });
    }

    // Keep auth state in sync
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        set({
          session,
          profile: data ? mapProfile(data, session.user.email) : null,
        });
      } else {
        set({ session: null, profile: null });
      }
    });

    return () => subscription.unsubscribe();
  },

  login: async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  },

  logout: async () => {
    await supabase.auth.signOut();
    set({ session: null, profile: null });
  },

  getCurrentUser: () => {
    return get().profile;
  },

  fetchProfiles: async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at');
    if (error) {
      console.error('[fetchProfiles] Supabase error:', error.message, error.code);
      return;
    }
    if (data) {
      set({ profiles: data.map(row => mapProfile(row)) });
    }
  },

  createUser: async (email, password, displayName, role) => {
    const session = get().session;
    if (!session) return { success: false, error: 'Not authenticated' };

    const res = await fetch('/api/create-user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ email, password, displayName, role }),
    });

    const { ok, json } = await safeFetchJson(res);
    if (!ok) return { success: false, error: json.error ?? 'Failed to create user' };

    await get().fetchProfiles();
    return { success: true };
  },

  changePassword: async (newPassword) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) return { success: false, error: error.message };
    return { success: true };
  },

  adminResetPassword: async (userId, newPassword) => {
    const session = get().session;
    if (!session) return { success: false, error: 'Not authenticated' };
    const res = await fetch('/api/reset-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ userId, newPassword }),
    });
    const { ok, json } = await safeFetchJson(res);
    if (!ok) return { success: false, error: json.error ?? 'Failed to reset password' };
    return { success: true };
  },

  updateProfile: async (id, updates) => {
    const dbUpdates: Record<string, unknown> = {};
    if (updates.displayName !== undefined) dbUpdates.display_name = updates.displayName;
    if (updates.role !== undefined) dbUpdates.role = updates.role;
    if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive;

    const { error } = await supabase.from('profiles').update(dbUpdates).eq('id', id);
    if (error) {
      console.error('[updateProfile] UPDATE failed:', error.message);
      return;
    }

    set(s => ({
      profiles: s.profiles.map(p => p.id === id ? { ...p, ...updates } : p),
      profile: s.profile?.id === id ? { ...s.profile, ...updates } : s.profile,
    }));
  },
}));

export default useAuthStore;
