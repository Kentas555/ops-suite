import { useEffect, useState } from 'react';
import { User, UserX, UserCheck, Edit2, ShieldCheck, ExternalLink } from 'lucide-react';
import useAuthStore, { type AppProfile } from '../stores/useAuthStore';
import { useTranslation } from '../i18n/useTranslation';
import useToastStore from '../stores/useToastStore';
import { formatDate } from '../utils/helpers';
import Modal from '../components/ui/Modal';

export default function UserManagement() {
  const profiles = useAuthStore(s => s.profiles);
  const currentUserId = useAuthStore(s => s.profile?.id ?? null);
  const fetchProfiles = useAuthStore(s => s.fetchProfiles);
  const updateProfile = useAuthStore(s => s.updateProfile);
  const { t } = useTranslation();
  const toast = useToastStore();
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ displayName: '', role: 'user' as 'admin' | 'user' });

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  const startEdit = (user: AppProfile) => {
    setEditForm({ displayName: user.displayName, role: user.role });
    setEditingUser(user.id);
  };

  const saveEdit = async () => {
    if (!editingUser) return;
    await updateProfile(editingUser, { displayName: editForm.displayName, role: editForm.role });
    setEditingUser(null);
    toast.success(t.toast.userUpdated);
  };

  const toggleActive = async (user: AppProfile) => {
    await updateProfile(user.id, { isActive: !user.isActive });
    toast.success(user.isActive ? t.auth.disabledStatus : t.auth.activeStatus);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t.auth.userManagement}</h1>
          <p className="text-sm text-slate-500 mt-1">{profiles.length} {t.auth.users}</p>
        </div>
        <a
          href="https://supabase.com/dashboard"
          target="_blank"
          rel="noopener noreferrer"
          className="btn-secondary text-sm"
        >
          <ExternalLink size={14} /> Add users in Supabase
        </a>
      </div>

      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-700">
        To create or delete users, go to <strong>Supabase Dashboard → Authentication → Users</strong>.
        Here you can manage display names, roles, and account status.
      </div>

      {/* Users List */}
      <div className="space-y-3">
        {profiles.map(user => {
          const isCurrentUser = user.id === currentUserId;
          const isEditing = editingUser === user.id;

          return (
            <div
              key={user.id}
              className={`card p-5 ${!user.isActive ? 'opacity-60' : ''} ${isCurrentUser ? 'ring-1 ring-primary-200' : ''}`}
            >
              <div className="flex items-start gap-4">
                {/* Avatar */}
                <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 bg-slate-100">
                  {user.role === 'admin'
                    ? <ShieldCheck size={20} className="text-slate-500" />
                    : <User size={20} className="text-slate-500" />
                  }
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  {isEditing ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="label">{t.auth.displayName}</label>
                          <input
                            name="displayName"
                            className="input"
                            value={editForm.displayName}
                            onChange={(e) => setEditForm({ ...editForm, displayName: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="label">{t.auth.role}</label>
                          <select
                            name="role"
                            className="select"
                            value={editForm.role}
                            onChange={(e) => setEditForm({ ...editForm, role: e.target.value as 'admin' | 'user' })}
                          >
                            <option value="admin">{t.auth.admin}</option>
                            <option value="user">{t.auth.user}</option>
                          </select>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button className="btn-primary btn-sm" onClick={saveEdit}>{t.common.save}</button>
                        <button className="btn-ghost btn-sm" onClick={() => setEditingUser(null)}>{t.common.cancel}</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-sm font-semibold text-slate-900">{user.displayName}</span>
                        {isCurrentUser && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-primary-50 text-primary-600 rounded-full font-medium">you</span>
                        )}
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                          user.role === 'admin' ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {user.role === 'admin' ? t.auth.admin : t.auth.user}
                        </span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                          user.isActive ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                        }`}>
                          {user.isActive ? t.auth.activeStatus : t.auth.disabledStatus}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                        <span>{t.clients.created}: {formatDate(user.createdAt)}</span>
                        <span>{t.auth.lastLogin}: {user.lastLoginAt ? formatDate(user.lastLoginAt) : t.auth.neverLoggedIn}</span>
                      </div>
                    </>
                  )}
                </div>

                {/* Actions */}
                {!isEditing && (
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button className="btn-ghost btn-sm" onClick={() => startEdit(user)} title={t.common.edit}>
                      <Edit2 size={14} />
                    </button>
                    {user.isActive ? (
                      <button
                        className="btn-ghost btn-sm text-amber-600"
                        onClick={() => toggleActive(user)}
                        title={t.auth.disable}
                        disabled={isCurrentUser}
                      >
                        <UserX size={14} />
                      </button>
                    ) : (
                      <button
                        className="btn-ghost btn-sm text-green-600"
                        onClick={() => toggleActive(user)}
                        title={t.auth.enable}
                      >
                        <UserCheck size={14} />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {profiles.length === 0 && (
          <div className="text-center py-12 text-slate-400 text-sm">
            No users found. Create users in the Supabase dashboard.
          </div>
        )}
      </div>

      {/* Edit modal not needed — inline editing above */}
      <Modal isOpen={false} onClose={() => {}} title="">
        <></>
      </Modal>
    </div>
  );
}
