import React from 'react';
import { CheckCircle, Clock, AlertCircle, XCircle } from 'lucide-react';

interface QueryStatusBadgeProps {
  status: 'active' | 'responded' | 'pending' | 'closed';
}

const QueryStatusBadge: React.FC<QueryStatusBadgeProps> = ({ status }) => {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'active':
        return {
          label: 'Active',
          className: 'bg-orange-100 text-orange-800 border-orange-200',
          icon: Clock,
        };
      case 'responded':
        return {
          label: 'Responded',
          className: 'bg-green-100 text-green-800 border-green-200',
          icon: CheckCircle,
        };
      case 'pending':
        return {
          label: 'Pending',
          className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
          icon: AlertCircle,
        };
      case 'closed':
        return {
          label: 'Closed',
          className: 'bg-gray-100 text-gray-800 border-gray-200',
          icon: XCircle,
        };
      default:
        return {
          label: 'Unknown',
          className: 'bg-gray-100 text-gray-800 border-gray-200',
          icon: AlertCircle,
        };
    }
  };

  const config = getStatusConfig(status);
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.className}`}>
      <Icon className="h-3 w-3 mr-1" />
      {config.label}
    </span>
  );
};

export default QueryStatusBadge;