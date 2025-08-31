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
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    green: 'bg-green-50 text-green-600 border-green-100',
    orange: 'bg-orange-50 text-orange-600 border-orange-100',
    red: 'bg-red-50 text-red-600 border-red-100',
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs md:text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-xl md:text-3xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`p-2 md:p-3 rounded-lg border ${colorClasses[color]}`}>
          <Icon className="h-4 md:h-6 w-4 md:w-6" />
        </div>
      </div>
      
      <div className="mt-3 md:mt-4 flex items-center">
        {trendUp ? (
          <TrendingUp className="h-3 md:h-4 w-3 md:w-4 text-green-500 mr-1" />
        ) : (
          <TrendingDown className="h-3 md:h-4 w-3 md:w-4 text-red-500 mr-1" />
        )}
        <span className={`text-xs md:text-sm font-medium ${trendUp ? 'text-green-600' : 'text-red-600'}`}>
          {trend}
        </span>
        <span className="text-xs md:text-sm text-gray-500 ml-1 hidden sm:inline">vs last month</span>
      </div>
    </div>
  );
};

export default StatsCard;