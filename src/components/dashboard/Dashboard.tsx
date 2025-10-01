import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import DashboardHome from './DashboardHome';
import QueriesView from './QueriesView';
import TeamView from './TeamView';
import SettingsView from './SettingsView';

type ViewType = 'dashboard' | 'queries' | 'team' | 'settings';

const Dashboard: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <DashboardHome />;
      case 'queries':
        return <QueriesView />;
      case 'team':
        return <TeamView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <DashboardHome />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex relative">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } lg:translate-x-0 fixed inset-y-0 left-0 z-50 w-64 transition-transform duration-300 ease-in-out`}
      >
        <Sidebar
          currentView={currentView}
          onViewChange={(view) => {
            setCurrentView(view);
            setSidebarOpen(false);
          }}
        />
      </div>


      <div className="flex-1 flex flex-col lg:ml-64">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 min-w-0 ">
          {renderView()}
        </main>
      </div>
    </div>
  );
};

export default Dashboard;