import React, { useState } from 'react';
import { useTeam, TeamMember } from '../../contexts/TeamContext';
import { useAuth } from '../../contexts/AuthContext';
import AddMemberModal from './AddMemberModal';
import { 
  Users, 
  UserPlus, 
  Crown, 
  Shield, 
  UserCheck, 
  Clock,
  Circle,
} from 'lucide-react';

const TeamView: React.FC = () => {
  const { members, updateMember, removeMember } = useTeam();
  const { user } = useAuth();
  const [showAddModal, setShowAddModal] = useState(false);

  const canManageTeam = user?.role === 'admin' || user?.role === 'manager';

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Crown className="h-4 w-4 text-amber-500" />;
      case 'manager':
        return <Shield className="h-4 w-4 text-purple-500" />;
      case 'agent':
        return <UserCheck className="h-4 w-4 text-green-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = (date: Date) => {
    const diffInMinutes = Math.floor((new Date().getTime() - date.getTime()) / (1000 * 60));
    if (diffInMinutes < 30) return 'text-green-500';
    if (diffInMinutes < 120) return 'text-yellow-500';
    return 'text-gray-400 dark:text-gray-400';
  };

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

  const handleStatusToggle = (memberId: string, currentStatus: string) => {
    if (canManageTeam) {
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      updateMember(memberId, { status: newStatus });
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">Team Management</h1>
          <p className="text-gray-600 dark:text-gray-300">Manage your team members and their access rights</p>
        </div>
        {canManageTeam && (
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 md:px-4 py-2 rounded-lg flex items-center transition-colors text-sm md:text-base"
          >
            <UserPlus className="h-4 w-4 mr-1 md:mr-2" />
            <span className="hidden sm:inline">Add Member</span>
            <span className="sm:hidden">Add</span>
          </button>
        )}
      </div>

      {/* Team Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Total Members</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{members.length}</p>
            </div>
            <div className="p-3 bg-blue-50 dark:bg-blue-900 rounded-lg">
              <Users className="h-6 w-6 text-blue-600 dark:text-blue-300" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Active Members</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                {members.filter(m => m.status === 'active').length}
              </p>
            </div>
            <div className="p-3 bg-green-50 dark:bg-green-900 rounded-lg">
              <Circle className="h-6 w-6 text-green-600 dark:text-green-300" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Admins</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                {members.filter(m => m.role === 'admin').length}
              </p>
            </div>
            <div className="p-3 bg-amber-50 dark:bg-amber-900 rounded-lg">
              <Crown className="h-6 w-6 text-amber-600 dark:text-amber-300" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Agents</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                {members.filter(m => m.role === 'agent').length}
              </p>
            </div>
            <div className="p-3 bg-purple-50 dark:bg-purple-900 rounded-lg">
              <UserCheck className="h-6 w-6 text-purple-600 dark:text-purple-300" />
            </div>
          </div>
        </div>
      </div>

      {/* Team Members Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Team Members</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700 hidden md:table-header-group">
              <tr>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Member</th>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Role</th>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Last Active</th>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Joined</th>
                {canManageTeam && (
                  <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {members.map((member) => (
                <tr key={member.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors md:table-row flex flex-col md:flex-row border-b md:border-b-0 py-4 md:py-0">
                  <td className="px-4 md:px-6 py-2 md:py-4 md:whitespace-nowrap">
                    <div className="md:hidden text-xs font-medium text-gray-500 dark:text-gray-300 uppercase mb-1">Member</div>
                    <div className="flex items-center">
                      <div className="h-8 md:h-10 w-8 md:w-10 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-100">
                          {member.name.charAt(0)}
                        </span>
                      </div>
                      <div className="ml-3 md:ml-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{member.name}</div>
                        <div className="text-xs md:text-sm text-gray-500 dark:text-gray-300">{member.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 md:px-6 py-2 md:py-4 md:whitespace-nowrap">
                    <div className="md:hidden text-xs font-medium text-gray-500 dark:text-gray-300 uppercase mb-1">Role</div>
                    <div className="flex items-center">
                      {getRoleIcon(member.role)}
                      <span className="ml-2 text-sm text-gray-900 dark:text-gray-100 capitalize">{member.role}</span>
                    </div>
                  </td>
                  <td className="px-4 md:px-6 py-2 md:py-4 md:whitespace-nowrap">
                    <div className="md:hidden text-xs font-medium text-gray-500 dark:text-gray-300 uppercase mb-1">Status</div>
                    <button
                      onClick={() => handleStatusToggle(member.id, member.status)}
                      disabled={!canManageTeam}
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        member.status === 'active'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                      } ${canManageTeam ? 'cursor-pointer hover:opacity-80' : 'cursor-default'}`}
                    >
                      <Circle className={`h-2 w-2 mr-1 fill-current ${getStatusColor(member.lastActive)}`} />
                      {member.status}
                    </button>
                  </td>
                  <td className="px-4 md:px-6 py-2 md:py-4 md:whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                    <div className="md:hidden text-xs font-medium text-gray-500 dark:text-gray-300 uppercase mb-1">Last Active</div>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      {getLastActiveText(member.lastActive)}
                    </div>
                  </td>
                  <td className="px-4 md:px-6 py-2 md:py-4 md:whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                    <div className="md:hidden text-xs font-medium text-gray-500 dark:text-gray-300 uppercase mb-1">Joined</div>
                    {new Date(member.joinedAt).toLocaleDateString()}
                  </td>
                  {canManageTeam && (
                    <td className="px-4 md:px-6 py-2 md:py-4 md:whitespace-nowrap">
                      <div className="md:hidden text-xs font-medium text-gray-500 dark:text-gray-300 uppercase mb-1">Actions</div>
                      <div className="flex items-center space-x-2">
                        {member.id !== user?.id && (
                          <button
                            onClick={() => removeMember(member.id)}
                            className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 text-xs md:text-sm font-medium"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showAddModal && (
        <AddMemberModal onClose={() => setShowAddModal(false)} />
      )}
    </div>
  );
};

export default TeamView;
