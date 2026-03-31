import type { Client, Task } from '../types';
import { isOverdue, daysAgoCount } from './helpers';

export type HealthStatus = 'active' | 'needs_attention' | 'at_risk';

export interface ClientTrigger {
  type: 'follow_up' | 'overdue_task' | 'upsell';
  label: string;
  labelLt: string;
}

export interface ClientHealth {
  status: HealthStatus;
  triggers: ClientTrigger[];
  daysSinceInteraction: number | null;
  overdueTaskCount: number;
}

export function computeClientHealth(client: Client, tasks: Task[]): ClientHealth {
  if (client.status === 'churned' || client.status === 'prospect') {
    return { status: 'active', triggers: [], daysSinceInteraction: null, overdueTaskCount: 0 };
  }

  const days = daysAgoCount(client.lastInteractionAt);
  const clientTasks = tasks.filter(t => t.clientId === client.id && t.status !== 'completed' && t.status !== 'cancelled');
  const overdueTasks = clientTasks.filter(t => isOverdue(t.dueDate));
  const overdueCount = overdueTasks.length;
  const triggers: ClientTrigger[] = [];

  // Determine health status
  let status: HealthStatus = 'active';

  if (overdueCount > 0 || (days !== null && days >= 14)) {
    status = 'at_risk';
  } else if ((days !== null && days >= 7) || client.nextAction) {
    status = 'needs_attention';
  }

  // Generate triggers (max 2)
  if (days !== null && days >= 7 && triggers.length < 2) {
    triggers.push({
      type: 'follow_up',
      label: `No contact for ${days} days — follow up`,
      labelLt: `Nėra kontakto ${days} d. — susisiekite`,
    });
  }

  if (overdueCount > 0 && triggers.length < 2) {
    triggers.push({
      type: 'overdue_task',
      label: `${overdueCount} overdue task${overdueCount > 1 ? 's' : ''} — take action`,
      labelLt: `${overdueCount} vėluojanti${overdueCount > 1 ? 'os' : ''} užduotis — imkitės veiksmų`,
    });
  }

  // Upsell: active client, recent interaction (≤7 days), no pending tasks
  if (
    (client.status === 'active' || client.status === 'onboarding') &&
    days !== null && days <= 7 &&
    clientTasks.length === 0 &&
    overdueCount === 0 &&
    triggers.length < 2
  ) {
    triggers.push({
      type: 'upsell',
      label: 'Good moment — propose visibility boost',
      labelLt: 'Geras momentas — pasiūlykite matomumo padidinimą',
    });
  }

  return { status, triggers, daysSinceInteraction: days, overdueTaskCount: overdueCount };
}

export const HEALTH_CONFIG: Record<HealthStatus, { color: string; bg: string; dot: string; label: string; labelLt: string }> = {
  active: { color: 'text-success-700', bg: 'bg-success-50', dot: 'bg-success-500', label: 'Active', labelLt: 'Aktyvus' },
  needs_attention: { color: 'text-amber-700', bg: 'bg-amber-50', dot: 'bg-amber-500', label: 'Needs Attention', labelLt: 'Reikia dėmesio' },
  at_risk: { color: 'text-danger-700', bg: 'bg-danger-50', dot: 'bg-danger-500', label: 'At Risk', labelLt: 'Rizikoje' },
};
