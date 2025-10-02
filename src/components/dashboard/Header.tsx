import React from 'react';
import { Bell, Menu } from 'lucide-react';

interface HeaderProps {
  onMenuClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  return (
    <header className="flex items-center justify-between px-4 md:px-6 py-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
    
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
      >
        <Menu className="h-6 w-6 text-gray-700 dark:text-gray-200" />
      </button>

      
      <div className="flex-1 mx-4">
        <input
          type="text"
          placeholder="Search client requests..."
          className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

     
      <div className="flex items-center space-x-4">
        <button className="relative p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
          <Bell className="h-6 w-6 text-gray-700 dark:text-gray-200" />
          <span className="absolute top-0 right-0 inline-block w-2 h-2 bg-red-500 rounded-full border-1 border-white dark:border-gray-800" />
        </button>

        <div className="flex items-center space-x-2">
          <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium">
            J
          </div>
          <div className="hidden sm:flex flex-col text-sm">
            <span className="text-gray-900 dark:text-gray-100 font-medium">Jon Don</span>
            <span className="text-gray-500 dark:text-gray-400 text-xs">Admin</span>
          </div>
        </div>
      </div> 
    </header>
  );
};

export default Header;
