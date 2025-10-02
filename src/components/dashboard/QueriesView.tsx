import React, { useState } from 'react';
import { useQuery } from '../../contexts/QueryContext';
import { useTeam } from '../../contexts/TeamContext';
import { useAuth } from '../../contexts/AuthContext';
import QueryModal from './QueryModal';
import QueryStatusBadge from './QueryStatusBadge';
import PriorityBadge from './PriorityBadge';
import { 
  Search, 
  Calendar, 
  MessageSquare,
  UserPlus
} from 'lucide-react';

// this component manages the content in client requests 


const QueriesView: React.FC = () => {
  const { queries, assignQuery, respondToQuery } = useQuery();
  const { getActiveMembers } = useTeam();
  const { user } = useAuth();
  const [selectedQuery, setSelectedQuery] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const activeMembers = getActiveMembers();

  const filteredQueries = queries.filter(query => {
    const matchesSearch =
      query.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      query.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      query.clientEmail.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = filterStatus === 'all' || query.status === filterStatus;
    const matchesPriority = filterPriority === 'all' || query.priority === filterPriority;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  const handleAssign = (queryId: string, memberId: string) => {
    const member = activeMembers.find(m => m.id === memberId);
    if (member) {
      assignQuery(queryId, memberId, member.name);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gray-50 dark:bg-gray-900 p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Client Request Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage and respond to client care requests
          </p>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 md:p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search client requests..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500"
              />
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 md:px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="responded">Responded</option>
              <option value="closed">Closed</option>
            </select>
            
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="px-3 md:px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200"
            >
              <option value="all">All Priority</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Queries Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-4 md:px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white">
            Client Requests ({filteredQueries.length})
          </h2>
        </div>
        
        <div className="overflow-x-auto -mx-4 md:mx-0">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700 hidden md:table-header-group">
              <tr>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Client</th>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Subject</th>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Priority</th>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Assigned To</th>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Created</th>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredQueries.map((query) => (
                <tr
                  key={query.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors md:table-row flex flex-col md:flex-row border-b md:border-b-0 border-gray-200 dark:border-gray-700 py-4 md:py-0"
                >
                  <td className="px-4 md:px-6 py-2 md:py-4 md:whitespace-nowrap">
                    <div className="md:hidden text-xs font-medium text-gray-500 dark:text-gray-400 uppercase mb-1">Client</div>
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">{query.clientName}</div>
                      <div className="text-xs md:text-sm text-gray-500 dark:text-gray-400">{query.clientEmail}</div>
                    </div>
                  </td>
                  <td className="px-4 md:px-6 py-2 md:py-4">
                    <div className="md:hidden text-xs font-medium text-gray-500 dark:text-gray-400 uppercase mb-1">Subject</div>
                    <div className="text-sm text-gray-900 dark:text-gray-200 md:max-w-xs md:truncate">{query.subject}</div>
                  </td>
                  <td className="px-4 md:px-6 py-2 md:py-4 md:whitespace-nowrap">
                    <div className="md:hidden text-xs font-medium text-gray-500 dark:text-gray-400 uppercase mb-1">Priority</div>
                    <PriorityBadge priority={query.priority} />
                  </td>
                  <td className="px-4 md:px-6 py-2 md:py-4 md:whitespace-nowrap">
                    <div className="md:hidden text-xs font-medium text-gray-500 dark:text-gray-400 uppercase mb-1">Status</div>
                    <QueryStatusBadge status={query.status} />
                  </td>
                  <td className="px-4 md:px-6 py-2 md:py-4 md:whitespace-nowrap">
                    <div className="md:hidden text-xs font-medium text-gray-500 dark:text-gray-400 uppercase mb-1">Assigned To</div>
                    {query.assignedToName ? (
                      <div className="flex items-center">
                        <div className="h-6 w-6 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center mr-2">
                          <span className="text-xs font-medium text-gray-600 dark:text-gray-200">
                            {query.assignedToName.charAt(0)}
                          </span>
                        </div>
                        <span className="text-sm text-gray-900 dark:text-gray-200">{query.assignedToName}</span>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">Unassigned</span>
                    )}
                  </td>
                  <td className="px-4 md:px-6 py-2 md:py-4 md:whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    <div className="md:hidden text-xs font-medium text-gray-500 dark:text-gray-400 uppercase mb-1">Created</div>
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      {new Date(query.createdAt).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-4 md:px-6 py-2 md:py-4 md:whitespace-nowrap">
                    <div className="md:hidden text-xs font-medium text-gray-500 dark:text-gray-400 uppercase mb-1">Actions</div>
                    <div className="flex items-center space-x-2 flex-wrap">
                      <button
                        onClick={() => setSelectedQuery(query.id)}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-xs md:text-sm font-medium"
                      >
                        View
                      </button>
                      {!query.assignedTo && (user?.role === 'admin' || user?.role === 'manager') && (
                        <div className="relative group">
                          <button className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 text-xs md:text-sm font-medium flex items-center">
                            <UserPlus className="h-3 md:h-4 w-3 md:w-4 mr-1" />
                            <span className="hidden sm:inline">Assign</span>
                          </button>
                          <div className="absolute right-0 mt-1 w-40 md:w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                            <div className="py-1">
                              {activeMembers.map((member) => (
                                <button
                                  key={member.id}
                                  onClick={() => handleAssign(query.id, member.id)}
                                  className="block w-full text-left px-3 md:px-4 py-2 text-xs md:text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                                >
                                  <span className="block md:inline">{member.name}</span>
                                  <span className="block md:inline text-gray-500 dark:text-gray-400"> ({member.role})</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredQueries.length === 0 && (
          <div className="text-center py-12">
            <MessageSquare className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No client requests found
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              Try adjusting your filters or search terms
            </p>
          </div>
        )}
      </div>

      {selectedQuery && (
        <QueryModal 
          queryId={selectedQuery} 
          onClose={() => setSelectedQuery(null)}
          onRespond={respondToQuery}
        />
      )}
    </div>
  );
};

export default QueriesView;
