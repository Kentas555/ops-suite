import { format, formatDistanceToNow, isToday, isTomorrow, isPast, isThisWeek, parseISO, startOfWeek, endOfWeek, addWeeks } from 'date-fns';

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

export function formatDate(date: string | undefined): string {
  if (!date) return '—';
  return format(parseISO(date), 'MMM d, yyyy');
}

export function formatRelative(date: string): string {
  const d = parseISO(date);
  if (isToday(d)) return 'Today';
  if (isTomorrow(d)) return 'Tomorrow';
  return formatDistanceToNow(d, { addSuffix: true });
}

export function isDueToday(date: string | undefined): boolean {
  if (!date) return false;
  return isToday(parseISO(date));
}

export function isDueTomorrow(date: string | undefined): boolean {
  if (!date) return false;
  return isTomorrow(parseISO(date));
}

export function isOverdue(date: string | undefined): boolean {
  if (!date) return false;
  return isPast(parseISO(date)) && !isToday(parseISO(date));
}

export function isDueThisWeek(date: string | undefined): boolean {
  if (!date) return false;
  return isThisWeek(parseISO(date), { weekStartsOn: 1 });
}

export function isDueNextWeek(date: string | undefined): boolean {
  if (!date) return false;
  const d = parseISO(date);
  const nextWeekStart = startOfWeek(addWeeks(new Date(), 1), { weekStartsOn: 1 });
  const nextWeekEnd = endOfWeek(addWeeks(new Date(), 1), { weekStartsOn: 1 });
  return d >= nextWeekStart && d <= nextWeekEnd;
}

export type TimeGroup = 'overdue' | 'today' | 'tomorrow' | 'this_week' | 'next_week' | 'later' | 'no_date';

export function getTimeGroup(date: string | undefined): TimeGroup {
  if (!date) return 'no_date';
  if (isOverdue(date)) return 'overdue';
  if (isDueToday(date)) return 'today';
  if (isDueTomorrow(date)) return 'tomorrow';
  if (isDueThisWeek(date)) return 'this_week';
  if (isDueNextWeek(date)) return 'next_week';
  return 'later';
}

export function daysAgoCount(dateStr?: string): number | null {
  if (!dateStr) return null;
  return Math.floor((new Date().getTime() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    active: 'badge-green',
    completed: 'badge-green',
    signed: 'badge-green',
    go_live: 'badge-green',
    onboarding: 'badge-blue',
    in_progress: 'badge-blue',
    draft: 'badge-gray',
    pending: 'badge-gray',
    pending_creation: 'badge-yellow',
    waiting_info: 'badge-yellow',
    waiting: 'badge-yellow',
    waiting_approval: 'badge-yellow',
    review: 'badge-purple',
    at_risk: 'badge-red',
    blocked: 'badge-red',
    overdue: 'badge-red',
    expired: 'badge-red',
    churned: 'badge-red',
    cancelled: 'badge-gray',
    closed: 'badge-gray',
    suspended: 'badge-yellow',
    prospect: 'badge-purple',
    paused: 'badge-yellow',
    issue: 'badge-red',
    todo: 'badge-gray',
    not_started: 'badge-gray',
    failed: 'badge-red',
  };
  return colors[status] || 'badge-gray';
}

export function getPriorityColor(priority: string): string {
  const colors: Record<string, string> = {
    urgent: 'badge-red',
    high: 'badge-yellow',
    medium: 'badge-blue',
    low: 'badge-gray',
  };
  return colors[priority] || 'badge-gray';
}

export function formatCurrency(amount: number, currency: string = 'EUR'): string {
  return new Intl.NumberFormat('en-EU', { style: 'currency', currency }).format(amount);
}
