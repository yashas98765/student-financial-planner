import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { LogOut } from 'lucide-react';

const Layout = () => {
  const { user, logout } = useAuth();

  const handleSignOut = () => {
    if (window.confirm('Are you sure you want to sign out?')) {
      logout();
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-primary-600 text-white p-4 flex justify-between items-center">
        <Link to="/dashboard" className="font-bold text-xl">Student Financial Planner</Link>
        <div className="flex items-center space-x-4">
          <nav className="space-x-4">
            <Link to="/dashboard" className="hover:underline">Dashboard</Link>
            <Link to="/expenses" className="hover:underline">Expenses</Link>
            <Link to="/goals" className="hover:underline">Goals</Link>
            <Link to="/reports" className="hover:underline">Reports</Link>
            <Link to="/profile" className="hover:underline">Profile</Link>
          </nav>
          <div className="flex items-center space-x-3 ml-6 pl-6 border-l border-primary-400">
            <span className="text-sm opacity-90">
              Hi, {user?.firstName || user?.name || 'User'}!
            </span>
            <button
              onClick={handleSignOut}
              className="flex items-center space-x-1 bg-primary-700 hover:bg-primary-800 px-3 py-1 rounded-md transition-colors duration-200"
              title="Sign Out"
            >
              <LogOut size={16} />
              <span className="text-sm">Sign Out</span>
            </button>
          </div>
        </div>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="bg-gray-100 text-center p-4 text-gray-500">
        &copy; {new Date().getFullYear()} Student Financial Planner
      </footer>
    </div>
  );
};

export default Layout;
