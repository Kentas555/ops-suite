import { getStatusColor } from '../../utils/helpers';
import { useTranslation } from '../../i18n/useTranslation';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

export default function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const { t } = useTranslation();
  const colorClass = getStatusColor(status);
  const sizeClass = size === 'sm' ? 'text-[10px] px-1.5 py-0' : '';
  const label = (t.statuses as Record<string, string>)[status] || status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  return (
    <span className={`${colorClass} ${sizeClass}`}>
      {label}
    </span>
  );
}
