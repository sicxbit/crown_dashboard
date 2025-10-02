import React from 'react';
import { useQuery } from '../../contexts/QueryContext';
import { useTeam } from '../../contexts/TeamContext';
import StatsCard from './StatsCard';
import RecentQueries from './RecentQueries';
import TeamActivity from './TeamActivity';
import { 
  MessageSquare, 
  CheckCircle, 
  Clock, 
  TrendingUp,
  AlertTriangle 
} from 'lucide-react';

const DashboardHome: React.FC = () => {
  const { queries, getActiveQueries, getRespondedQueries, getPendingQueries } = useQuery();
  const { getActiveMembers } = useTeam();

  const activeQueries = getActiveQueries();
  const respondedQueries = getRespondedQueries();
  const pendingQueries = getPendingQueries();
  const activeMembers = getActiveMembers();

  const urgentQueries = queries.filter(q => q.priority === 'urgent' && q.status !== 'responded');

  const stats = [
    {
      title: 'Total Requests',
      value: queries.length,
      icon: MessageSquare,
      trend: '+12%',
      trendUp: true,
      color: 'blue',
    },
    {
      title: 'Active Requests',
      value: activeQueries.length,
      icon: Clock,
      trend: '+5%',
      trendUp: true,
      color: 'orange',
    },
    {
      title: 'Responded',
      value: respondedQueries.length,
      icon: CheckCircle,
      trend: '+18%',
      trendUp: true,
      color: 'green',
    },
    {
      title: 'Urgent',
      value: urgentQueries.length,
      icon: AlertTriangle,
      trend: '-8%',
      trendUp: false,
      color: 'red',
    },
  ];

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        {/* Heading and subheading */}
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Dashboard Overview
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Welcome back! Here's what's happening with your client requests today.
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {stats.map((stat) => (
          <StatsCard key={stat.title} {...stat} />
        ))}
      </div>

      {/* Recent queries & team activity */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <RecentQueries queries={queries.slice(0, 5)} />
        </div>
        <div>
          <TeamActivity members={activeMembers} />
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;
