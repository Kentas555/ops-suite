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
  profiles: AppProfile[]; // all profiles — loaded for admin view
  initialized: boolean;

  initialize: () => Promise<() => void>;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  getCurrentUser: () => AppProfile | null;

  fetchProfiles: () => Promise<void>;
  updateProfile: (id: string, updates: Partial<Pick<AppProfile, 'displayName' | 'role' | 'isActive'>>) => Promise<void>;
  createUser: (email: string, password: string, displayName: string, role: 'admin' | 'user') => Promise<{ success: boolean; error?: string }>;
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

const useAuthStore = create<AuthState>()((set, get) => ({
  session: null,
  profile: null,
  profiles: [],
  initialized: false,

  initialize: async () => {
    // Load initial session
    const { data: { session } } = await supabase.auth.getSession();

    if (session?.user) {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (data) {
        await supabase
          .from('profiles')
          .update({ last_login_at: new Date().toISOString() })
          .eq('id', session.user.id);

        set({
          session,
          profile: mapProfile(data, session.user.email),
          initialized: true,
        });
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
    const { profile } = get();
    return profile;
  },

  fetchProfiles: async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at');
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

    const json = await res.json();
    if (!res.ok) return { success: false, error: json.error ?? 'Failed to create user' };

    // Refresh the profiles list
    await get().fetchProfiles();
    return { success: true };
  },

  updateProfile: async (id, updates) => {
    const dbUpdates: Record<string, unknown> = {};
    if (updates.displayName !== undefined) dbUpdates.display_name = updates.displayName;
    if (updates.role !== undefined) dbUpdates.role = updates.role;
    if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive;

    await supabase.from('profiles').update(dbUpdates).eq('id', id);

    set(s => ({
      profiles: s.profiles.map(p => p.id === id ? { ...p, ...updates } : p),
      profile: s.profile?.id === id ? { ...s.profile, ...updates } : s.profile,
    }));
  },
}));

export default useAuthStore;
