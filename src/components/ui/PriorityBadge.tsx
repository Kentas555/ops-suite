import { getPriorityColor } from '../../utils/helpers';
import { AlertTriangle, ArrowUp, Minus, ArrowDown } from 'lucide-react';
import { useTranslation } from '../../i18n/useTranslation';

interface PriorityBadgeProps {
  priority: string;
}

const icons: Record<string, React.ReactNode> = {
  urgent: <AlertTriangle size={10} />,
  high: <ArrowUp size={10} />,
  medium: <Minus size={10} />,
  low: <ArrowDown size={10} />,
};

export default function PriorityBadge({ priority }: PriorityBadgeProps) {
  const { t } = useTranslation();
  const label = (t.priorities as Record<string, string>)[priority] || priority;
  return (
    <span className={`${getPriorityColor(priority)} inline-flex items-center gap-1`}>
      {icons[priority]}
      {label}
    </span>
  );
}
