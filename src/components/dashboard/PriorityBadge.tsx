import React from 'react';
import { AlertTriangle, ArrowUp, Minus, ArrowDown } from 'lucide-react';

interface PriorityBadgeProps {
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority }) => {
  const getPriorityConfig = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return {
          label: 'Urgent',
          className: 'bg-red-100 text-red-800 border-red-200',
          icon: AlertTriangle,
        };
      case 'high':
        return {
          label: 'High',
          className: 'bg-orange-100 text-orange-800 border-orange-200',
          icon: ArrowUp,
        };
      case 'medium':
        return {
          label: 'Medium',
          className: 'bg-blue-100 text-blue-800 border-blue-200',
          icon: Minus,
        };
      case 'low':
        return {
          label: 'Low',
          className: 'bg-gray-100 text-gray-800 border-gray-200',
          icon: ArrowDown,
        };
      default:
        return {
          label: 'Unknown',
          className: 'bg-gray-100 text-gray-800 border-gray-200',
          icon: Minus,
        };
    }
  };

  const config = getPriorityConfig(priority);
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.className}`}>
      <Icon className="h-3 w-3 mr-1" />
      {config.label}
    </span>
  );
};

export default PriorityBadge;