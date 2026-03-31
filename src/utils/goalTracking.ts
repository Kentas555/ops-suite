import type { Goal, CommunicationLog, Task, AutoSource } from '../types';

/**
 * Computes the time window start date for a goal based on its period.
 * Uses createdAt as anchor — counts from when the goal was created.
 */
function getPeriodStart(goal: Goal): string {
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth(), 1); // start of current month

  switch (goal.period) {
    case 'month':
      return d.toISOString();
    case 'half_year': {
      const halfStart = now.getMonth() < 6 ? 0 : 6;
      return new Date(now.getFullYear(), halfStart, 1).toISOString();
    }
    case 'year':
      return new Date(now.getFullYear(), 0, 1).toISOString();
    default:
      return d.toISOString();
  }
}

const SOURCE_ACTIVITY_MAP: Record<string, string[]> = {
  calls: ['phone'],
  emails: ['email'],
  meetings: ['meeting'],
  all_activity: ['phone', 'email', 'meeting', 'internal_note'],
};

/**
 * Computes auto-tracked current value for a goal.
 * Returns the count of matching records within the goal's period window.
 */
export function computeAutoValue(
  goal: Goal,
  communicationLogs: CommunicationLog[],
  tasks: Task[],
): number {
  if (goal.trackingMode !== 'auto' || !goal.autoSource) return goal.currentValue;

  const periodStart = getPeriodStart(goal);

  try {
    if (goal.autoSource === 'tasks_completed') {
      return tasks.filter(t =>
        t.status === 'completed' &&
        t.completedAt &&
        t.completedAt >= periodStart
      ).length;
    }

    const activityTypes = SOURCE_ACTIVITY_MAP[goal.autoSource];
    if (!activityTypes) return 0;

    return communicationLogs.filter(log =>
      activityTypes.includes(log.type) &&
      log.createdAt >= periodStart
    ).length;
  } catch {
    return 0; // safe fallback
  }
}

export function autoSourceLabel(source: AutoSource | undefined, lang: string): string {
  if (!source) return '';
  const labels: Record<AutoSource, { en: string; lt: string }> = {
    calls: { en: 'Calls (Activity)', lt: 'Skambučiai (veikla)' },
    emails: { en: 'Emails (Activity)', lt: 'El. laiškai (veikla)' },
    meetings: { en: 'Meetings (Activity)', lt: 'Susitikimai (veikla)' },
    all_activity: { en: 'All activity', lt: 'Visa veikla' },
    tasks_completed: { en: 'Completed tasks', lt: 'Užbaigtos užduotys' },
  };
  return lang === 'lt' ? labels[source].lt : labels[source].en;
}
