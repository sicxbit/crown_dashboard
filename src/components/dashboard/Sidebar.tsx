import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  LayoutDashboard, 
  MessageSquare, 
  Users, 
  Settings, 
  LogOut,
  Crown,
  Shield,
  UserCheck
} from 'lucide-react';

interface SidebarProps {
  currentView: string;
  onViewChange: (view: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onViewChange }) => {
  const { user, logout } = useAuth();

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'queries', label: 'Client Requests', icon: MessageSquare },
    { id: 'team', label: 'Team', icon: Users },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

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

  return (
    <div className="bg-white w-64 h-screen border-r border-gray-200 flex flex-col ">
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-lg md:text-xl font-bold text-gray-900">Crown Caregivers Dashboard</h1>
        <p className="text-xs md:text-sm text-gray-600 mt-1">Manage client requests</p>
      </div>

      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            
            return (
              <li key={item.id}>
                <button
                  onClick={() => onViewChange(item.id)}
                  className={`w-full flex items-center px-3 md:px-4 py-3 text-left rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Icon className={`h-4 md:h-5 w-4 md:w-5 mr-2 md:mr-3 ${isActive ? 'text-blue-700' : 'text-gray-400'}`} />
                  <span className="text-sm md:text-base">{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <div className="h-8 w-8 bg-gray-300 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-gray-600">
                {user?.name.charAt(0)}
              </span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900">{user?.name}</p>
              <div className="flex items-center">
                {getRoleIcon(user?.role || '')}
                <span className="ml-1 text-xs text-gray-500 capitalize">{user?.role}</span>
              </div>
            </div>
          </div>
        </div>
        
        <button
          onClick={logout}
          className="w-full flex items-center px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </button>
      </div>
    </div>
  );
};

export default Sidebar;