import React, { useState } from 'react';
import { useQuery } from '../../contexts/QueryContext';
import { useTeam } from '../../contexts/TeamContext';
import { useAuth } from '../../contexts/AuthContext';
import QueryModal from './QueryModal';
import QueryStatusBadge from './QueryStatusBadge';
import PriorityBadge from './PriorityBadge';
import { 
  Search, 
  Filter, 
  Plus, 
  Calendar, 
  User,
  MessageSquare,
  UserPlus
} from 'lucide-react';

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
    const matchesSearch = query.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Client Request Management</h1>
          <p className="text-gray-600">Manage and respond to client care requests</p>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search client requests..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 md:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
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
              className="px-3 md:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
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
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 md:px-6 py-4 border-b border-gray-200">
          <h2 className="text-base md:text-lg font-semibold text-gray-900">Client Requests ({filteredQueries.length})</h2>
        </div>
        
        <div className="overflow-x-auto -mx-4 md:mx-0">
          <table className="w-full">
            <thead className="bg-gray-50 hidden md:table-header-group">
              <tr>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned To</th>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredQueries.map((query) => (
                <tr key={query.id} className="hover:bg-gray-50 transition-colors md:table-row flex flex-col md:flex-row border-b md:border-b-0 py-4 md:py-0">
                  <td className="px-4 md:px-6 py-2 md:py-4 md:whitespace-nowrap">
                    <div className="md:hidden text-xs font-medium text-gray-500 uppercase mb-1">Client</div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">{query.clientName}</div>
                      <div className="text-xs md:text-sm text-gray-500">{query.clientEmail}</div>
                    </div>
                  </td>
                  <td className="px-4 md:px-6 py-2 md:py-4">
                    <div className="md:hidden text-xs font-medium text-gray-500 uppercase mb-1">Subject</div>
                    <div className="text-sm text-gray-900 md:max-w-xs md:truncate">{query.subject}</div>
                  </td>
                  <td className="px-4 md:px-6 py-2 md:py-4 md:whitespace-nowrap">
                    <div className="md:hidden text-xs font-medium text-gray-500 uppercase mb-1">Priority</div>
                    <PriorityBadge priority={query.priority} />
                  </td>
                  <td className="px-4 md:px-6 py-2 md:py-4 md:whitespace-nowrap">
                    <div className="md:hidden text-xs font-medium text-gray-500 uppercase mb-1">Status</div>
                    <QueryStatusBadge status={query.status} />
                  </td>
                  <td className="px-4 md:px-6 py-2 md:py-4 md:whitespace-nowrap">
                    <div className="md:hidden text-xs font-medium text-gray-500 uppercase mb-1">Assigned To</div>
                    {query.assignedToName ? (
                      <div className="flex items-center">
                        <div className="h-6 w-6 bg-gray-300 rounded-full flex items-center justify-center mr-2">
                          <span className="text-xs font-medium text-gray-600">
                            {query.assignedToName.charAt(0)}
                          </span>
                        </div>
                        <span className="text-sm text-gray-900">{query.assignedToName}</span>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">Unassigned</span>
                    )}
                  </td>
                  <td className="px-4 md:px-6 py-2 md:py-4 md:whitespace-nowrap text-sm text-gray-500">
                    <div className="md:hidden text-xs font-medium text-gray-500 uppercase mb-1">Created</div>
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      {new Date(query.createdAt).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-4 md:px-6 py-2 md:py-4 md:whitespace-nowrap">
                    <div className="md:hidden text-xs font-medium text-gray-500 uppercase mb-1">Actions</div>
                    <div className="flex items-center space-x-2 flex-wrap">
                      <button
                        onClick={() => setSelectedQuery(query.id)}
                        className="text-blue-600 hover:text-blue-800 text-xs md:text-sm font-medium"
                      >
                        View
                      </button>
                      {!query.assignedTo && (user?.role === 'admin' || user?.role === 'manager') && (
                        <div className="relative group">
                          <button className="text-green-600 hover:text-green-800 text-xs md:text-sm font-medium flex items-center">
                            <UserPlus className="h-3 md:h-4 w-3 md:w-4 mr-1" />
                            <span className="hidden sm:inline">Assign</span>
                          </button>
                          <div className="absolute right-0 mt-1 w-40 md:w-48 bg-white rounded-md shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                            <div className="py-1">
                              {activeMembers.map((member) => (
                                <button
                                  key={member.id}
                                  onClick={() => handleAssign(query.id, member.id)}
                                  className="block w-full text-left px-3 md:px-4 py-2 text-xs md:text-sm text-gray-700 hover:bg-gray-100"
                                >
                                  <span className="block md:inline">{member.name}</span>
                                  <span className="block md:inline text-gray-500"> ({member.role})</span>
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
            <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No client requests found</h3>
            <p className="text-gray-500">Try adjusting your filters or search terms</p>
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