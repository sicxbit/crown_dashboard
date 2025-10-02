import React from 'react';
import { TeamMember } from '../../contexts/TeamContext';
import { Clock, Circle } from 'lucide-react';

interface TeamActivityProps {
  members: TeamMember[];
}

const TeamActivity: React.FC<TeamActivityProps> = ({ members }) => {
  const getLastActiveText = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  const getStatusColor = (date: Date) => {
    const diffInMinutes = Math.floor((new Date().getTime() - date.getTime()) / (1000 * 60));
    if (diffInMinutes < 30) return 'text-green-500 dark:text-green-400';
    if (diffInMinutes < 120) return 'text-yellow-500 dark:text-yellow-400';
    return 'text-gray-400 dark:text-gray-500';
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 md:p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-gray-100">Team Activity</h2>
        <span className="text-sm text-gray-500 dark:text-gray-400">{members.length} members</span>
      </div>

      <div className="space-y-4">
        {members.map((member) => (
          <div key={member.id} className="flex items-center justify-between py-2">
            <div className="flex items-center">
              <div className="h-8 md:h-10 w-8 md:w-10 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-200">
                  {member.name.charAt(0)}
                </span>
              </div>
              <div className="ml-2 md:ml-3">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{member.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{member.role}</p>
              </div>
            </div>
            
            <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 ml-2">
              <Circle className={`h-2 w-2 mr-2 fill-current ${getStatusColor(member.lastActive)}`} />
              <div className="flex items-center whitespace-nowrap">
                <Clock className="h-3 w-3 mr-1" />
                <span>{getLastActiveText(member.lastActive)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TeamActivity;
