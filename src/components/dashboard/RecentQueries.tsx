import React from 'react';
import { Query } from '../../contexts/QueryContext';
import QueryStatusBadge from './QueryStatusBadge';
import PriorityBadge from './PriorityBadge';
import { Calendar, User } from 'lucide-react';

interface RecentQueriesProps {
  queries: Query[];
}

const RecentQueries: React.FC<RecentQueriesProps> = ({ queries }) => {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg md:text-xl font-semibold text-gray-900">Recent Client Requests</h2>
        <span className="text-sm text-gray-500">{queries.length} requests</span>
      </div>

      <div className="space-y-4">
        {queries.map((query) => (
          <div key={query.id} className="border border-gray-100 rounded-lg p-4 hover:bg-gray-50 transition-colors">
            <div className="flex flex-col md:flex-row md:items-start justify-between mb-2 space-y-2 md:space-y-0">
              <div className="flex-1">
                <h3 className="font-medium text-gray-900 mb-1">{query.subject}</h3>
                <p className="text-sm text-gray-600 line-clamp-2 md:line-clamp-1">{query.message}</p>
              </div>
              <div className="flex items-center space-x-2 md:ml-4">
                <PriorityBadge priority={query.priority} />
                <QueryStatusBadge status={query.status} />
              </div>
            </div>
            
            <div className="flex flex-col md:flex-row md:items-center justify-between text-xs text-gray-500 mt-3 space-y-2 md:space-y-0">
              <div className="flex items-center">
                <User className="h-3 w-3 mr-1" />
                <span>{query.clientName}</span>
              </div>
              
              <div className="flex flex-col md:flex-row md:items-center space-y-1 md:space-y-0 md:space-x-4">
                {query.assignedToName && (
                  <span className="bg-gray-100 px-2 py-1 rounded text-xs">
                    Assigned to {query.assignedToName}
                  </span>
                )}
                <div className="flex items-center">
                  <Calendar className="h-3 w-3 mr-1" />
                  <span>{new Date(query.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecentQueries;