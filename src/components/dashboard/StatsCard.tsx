import React from 'react';
import { DivideIcon as LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  trend: string;
  trendUp: boolean;
  color: 'blue' | 'green' | 'orange' | 'red';
}

const StatsCard: React.FC<StatsCardProps> = ({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  trendUp, 
  color 
}) => {
  const colorClasses = {
    blue: 'bg-blue-50 dark:bg-blue-900 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-800',
    green: 'bg-green-50 dark:bg-green-900 text-green-600 dark:text-green-400 border-green-100 dark:border-green-800',
    orange: 'bg-orange-50 dark:bg-orange-900 text-orange-600 dark:text-orange-400 border-orange-100 dark:border-orange-800',
    red: 'bg-red-50 dark:bg-red-900 text-red-600 dark:text-red-400 border-red-100 dark:border-red-800',
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 md:p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs md:text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{title}</p>
          <p className="text-xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
        </div>
        <div className={`p-2 md:p-3 rounded-lg border ${colorClasses[color]}`}>
          <Icon className="h-4 md:h-6 w-4 md:w-6" />
        </div>
      </div>
      
      <div className="mt-3 md:mt-4 flex items-center">
        {trendUp ? (
          <TrendingUp className="h-3 md:h-4 w-3 md:w-4 text-green-500 dark:text-green-400 mr-1" />
        ) : (
          <TrendingDown className="h-3 md:h-4 w-3 md:w-4 text-red-500 dark:text-red-400 mr-1" />
        )}
        <span className={`text-xs md:text-sm font-medium ${trendUp ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
          {trend}
        </span>
        <span className="text-xs md:text-sm text-gray-500 dark:text-gray-400 ml-1 hidden sm:inline">vs last month</span>
      </div>
    </div>
  );
};

export default StatsCard;
