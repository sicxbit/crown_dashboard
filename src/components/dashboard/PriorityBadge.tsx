import React from 'react';
import { AlertTriangle, ArrowUp, Minus, ArrowDown } from 'lucide-react';

interface PriorityBadgeProps {
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

// Configuration map for priorities
const PRIORITY_CONFIG = {
  urgent: {
    label: 'Urgent',
    className: 'bg-red-100 text-red-800 border-red-200',
    icon: AlertTriangle,
  },
  high: {
    label: 'High',
    className: 'bg-orange-100 text-orange-800 border-orange-200',
    icon: ArrowUp,
  },
  medium: {
    label: 'Medium',
    className: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: Minus,
  },
  low: {
    label: 'Low',
    className: 'bg-gray-100 text-gray-800 border-gray-200',
    icon: ArrowDown,
  },
} as const;

const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority }) => {
  const config = PRIORITY_CONFIG[priority] ?? PRIORITY_CONFIG.low;
  const Icon = config.icon;

  return (
    <span
      role="status"
      aria-label={`Priority: ${config.label}`}
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.className}`}
    >
      <Icon className="h-3 w-3 mr-1" />
      {config.label}
    </span>
  );
};

export default PriorityBadge;
