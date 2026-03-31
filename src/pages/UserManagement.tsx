import { useEffect, useState } from 'react';
import { User, UserX, UserCheck, Edit2, ShieldCheck, UserPlus, KeyRound } from 'lucide-react';
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
  const createUser = useAuthStore(s => s.createUser);
  const adminResetPassword = useAuthStore(s => s.adminResetPassword);
  const { t } = useTranslation();
  const toast = useToastStore();
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ displayName: '', role: 'user' as 'admin' | 'user' });

  // Reset password modal state
  const [resetTarget, setResetTarget] = useState<AppProfile | null>(null);
  const [resetPw, setResetPw] = useState({ newPassword: '', confirmPassword: '' });
  const [resetError, setResetError] = useState('');
  const [resetting, setResetting] = useState(false);

  const handleAdminReset = async () => {
    setResetError('');
    if (resetPw.newPassword.length < 6) { setResetError('Password must be at least 6 characters.'); return; }
    if (resetPw.newPassword !== resetPw.confirmPassword) { setResetError('Passwords do not match.'); return; }
    if (!resetTarget) return;
    setResetting(true);
    const result = await adminResetPassword(resetTarget.id, resetPw.newPassword);
    setResetting(false);
    if (!result.success) { setResetError(result.error ?? 'Failed to reset password.'); return; }
    setResetTarget(null);
    setResetPw({ newPassword: '', confirmPassword: '' });
    toast.success('Password reset successfully.');
  };

  // Create user modal state
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ email: '', password: '', displayName: '', role: 'user' as 'admin' | 'user' });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

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

  const handleCreate = async () => {
    setCreateError('');
    if (!createForm.email.trim() || !createForm.password || !createForm.displayName.trim()) {
      setCreateError('All fields are required.');
      return;
    }
    if (createForm.password.length < 6) {
      setCreateError('Password must be at least 6 characters.');
      return;
    }
    setCreating(true);
    const result = await createUser(createForm.email.trim(), createForm.password, createForm.displayName.trim(), createForm.role);
    setCreating(false);
    if (!result.success) {
      setCreateError(result.error ?? 'Failed to create user.');
      return;
    }
    setShowCreate(false);
    setCreateForm({ email: '', password: '', displayName: '', role: 'user' });
    toast.success(t.toast.userUpdated);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t.auth.userManagement}</h1>
          <p className="text-sm text-slate-500 mt-1">{profiles.length} {t.auth.users}</p>
        </div>
        <button
          className="btn-primary text-sm"
          onClick={() => { setShowCreate(true); setCreateError(''); }}
        >
          <UserPlus size={14} /> Add User
        </button>
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
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
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
                      {user.email && (
                        <div className="text-xs text-slate-500 mb-1">{user.email}</div>
                      )}
                      <div className="flex items-center gap-4 mt-1 text-xs text-slate-400">
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
                    <button
                      className="btn-ghost btn-sm text-slate-500"
                      onClick={() => { setResetTarget(user); setResetPw({ newPassword: '', confirmPassword: '' }); setResetError(''); }}
                      title="Reset Password"
                    >
                      <KeyRound size={14} />
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
            No users found.
          </div>
        )}
      </div>

      {/* Admin Reset Password Modal */}
      <Modal isOpen={!!resetTarget} onClose={() => setResetTarget(null)} title={`Reset Password — ${resetTarget?.displayName}`} size="sm">
        <div className="space-y-4">
          <div>
            <label className="label">New Password</label>
            <input
              name="resetNewPassword"
              type="password"
              className="input"
              placeholder="Min. 6 characters"
              value={resetPw.newPassword}
              onChange={(e) => setResetPw({ ...resetPw, newPassword: e.target.value })}
              autoFocus
            />
          </div>
          <div>
            <label className="label">Confirm Password</label>
            <input
              name="resetConfirmPassword"
              type="password"
              className="input"
              placeholder="Repeat new password"
              value={resetPw.confirmPassword}
              onChange={(e) => setResetPw({ ...resetPw, confirmPassword: e.target.value })}
              onKeyDown={(e) => { if (e.key === 'Enter') handleAdminReset(); }}
            />
          </div>
          {resetError && (
            <div className="p-3 bg-danger-50 border border-danger-200 rounded-lg text-sm text-danger-700">{resetError}</div>
          )}
          <div className="flex gap-2 pt-1">
            <button className="btn-primary flex-1 justify-center" onClick={handleAdminReset} disabled={resetting}>
              {resetting ? 'Saving...' : 'Reset Password'}
            </button>
            <button className="btn-ghost" onClick={() => setResetTarget(null)}>Cancel</button>
          </div>
        </div>
      </Modal>

      {/* Create User Modal */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Add New User">
        <div className="space-y-4">
          <div>
            <label className="label">Display Name</label>
            <input
              name="createDisplayName"
              className="input"
              placeholder="John Smith"
              value={createForm.displayName}
              onChange={(e) => setCreateForm({ ...createForm, displayName: e.target.value })}
              autoFocus
            />
          </div>
          <div>
            <label className="label">{t.auth.email}</label>
            <input
              name="createEmail"
              type="email"
              className="input"
              placeholder="john@company.com"
              value={createForm.email}
              onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
            />
          </div>
          <div>
            <label className="label">{t.auth.password}</label>
            <input
              name="createPassword"
              type="password"
              className="input"
              placeholder="Min. 6 characters"
              value={createForm.password}
              onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
            />
          </div>
          <div>
            <label className="label">{t.auth.role}</label>
            <select
              name="createRole"
              className="select"
              value={createForm.role}
              onChange={(e) => setCreateForm({ ...createForm, role: e.target.value as 'admin' | 'user' })}
            >
              <option value="user">{t.auth.user}</option>
              <option value="admin">{t.auth.admin}</option>
            </select>
          </div>

          {createError && (
            <div className="p-3 bg-danger-50 border border-danger-200 rounded-lg text-sm text-danger-700">
              {createError}
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <button
              className="btn-primary flex-1 justify-center"
              onClick={handleCreate}
              disabled={creating}
            >
              <UserPlus size={14} /> {creating ? 'Creating...' : 'Create User'}
            </button>
            <button className="btn-ghost" onClick={() => setShowCreate(false)}>{t.common.cancel}</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
