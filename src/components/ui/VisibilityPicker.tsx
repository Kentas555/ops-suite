import { Lock, Users, UserPlus, Check } from 'lucide-react';
import useAuthStore from '../../stores/useAuthStore';
import type { Visibility } from '../../types';

export interface VisibilityValue {
  visibility: Visibility;
  sharedWith: string[];
}

interface VisibilityPickerProps {
  value: VisibilityValue;
  onChange: (v: VisibilityValue) => void;
}

export function VisibilityBadge({ visibility, sharedWith }: VisibilityValue) {
  if (visibility === 'private') {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded-full font-medium">
        <Lock size={9} /> Only me
      </span>
    );
  }
  if (visibility === 'selected') {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded-full font-medium">
        <UserPlus size={9} /> {sharedWith.length + 1} people
      </span>
    );
  }
  return null; // 'team' — visible to everyone, no badge needed
}

export default function VisibilityPicker({ value, onChange }: VisibilityPickerProps) {
  const profiles = useAuthStore(s => s.profiles);
  const currentUserId = useAuthStore(s => s.profile?.id);
  const others = profiles.filter(p => p.id !== currentUserId && p.isActive);

  const setMode = (mode: Visibility) => {
    if (mode === 'private') {
      onChange({ visibility: 'private', sharedWith: [] });
    } else if (mode === 'team') {
      onChange({ visibility: 'team', sharedWith: [] });
    } else {
      onChange({ visibility: 'selected', sharedWith: value.sharedWith });
    }
  };

  const toggleUser = (userId: string) => {
    const updated = value.sharedWith.includes(userId)
      ? value.sharedWith.filter(id => id !== userId)
      : [...value.sharedWith, userId];
    onChange({ visibility: 'selected', sharedWith: updated });
  };

  const btnClass = (active: boolean) =>
    `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
      active
        ? 'bg-slate-900 text-white border-slate-900'
        : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400 hover:text-slate-700'
    }`;

  return (
    <div>
      <label className="label mb-1.5">Visibility</label>
      <div className="flex flex-wrap gap-1.5 mb-2">
        <button type="button" onClick={() => setMode('private')} className={btnClass(value.visibility === 'private')}>
          <Lock size={12} /> Only me
        </button>
        <button type="button" onClick={() => setMode('team')} className={btnClass(value.visibility === 'team')}>
          <Users size={12} /> Whole team
        </button>
        <button type="button" onClick={() => setMode('selected')} className={btnClass(value.visibility === 'selected')}>
          <UserPlus size={12} /> Select people
          {value.visibility === 'selected' && value.sharedWith.length > 0 && (
            <span className="ml-0.5 bg-white/20 text-current rounded-full px-1.5 text-[10px] font-bold">
              {value.sharedWith.length}
            </span>
          )}
        </button>
      </div>

      {value.visibility === 'selected' && (
        <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
          {others.length === 0 ? (
            <span className="text-xs text-slate-400">No other team members yet</span>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {others.map(p => {
                const selected = value.sharedWith.includes(p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => toggleUser(p.id)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                      selected
                        ? 'bg-primary-600 text-white border-primary-600'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
                    }`}
                  >
                    {selected && <Check size={10} />}
                    {p.displayName}
                  </button>
                );
              })}
            </div>
          )}
          {value.sharedWith.length === 0 && others.length > 0 && (
            <p className="text-xs text-amber-600 mt-1.5">Select at least one person, or choose "Whole team"</p>
          )}
        </div>
      )}
    </div>
  );
}
