import React, { useState, useRef, useEffect } from 'react';
import { Menu, Bell, User, LogOut, ChevronDown, Settings } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';

export const Navbar: React.FC<{ onMenuClick: () => void }> = ({ onMenuClick }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
      if (userRef.current && !userRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/dashboard') return 'Dashboard';
    if (path === '/transactions') return 'Transactions';
    if (path === '/ai') return 'AI Features';
    if (path === '/users') return 'User Management';
    if (path === '/profile') return 'Profile';
    return '';
  };

  const notifications = [
    {
      id: 1,
      title: 'Welcome to FinTrack AI',
      message: 'Your account is set up and ready to use.',
      time: 'Just now',
      unread: true,
      color: 'bg-purple-500',
    },
    {
      id: 2,
      title: 'AI Features Available',
      message: 'Try auto-categorize and natural language search.',
      time: '2 min ago',
      unread: true,
      color: 'bg-cyan-500',
    },
    {
      id: 3,
      title: 'Dashboard Ready',
      message: 'Add transactions to see your financial insights.',
      time: '5 min ago',
      unread: false,
      color: 'bg-emerald-500',
    },
  ];

  const unreadCount = notifications.filter((n) => n.unread).length;

  return (
    <header className="h-16 bg-slate-900/50 backdrop-blur-md border-b border-slate-800 flex items-center justify-between px-4 lg:px-8 sticky top-0 z-30">
      {/* Left — hamburger + page title */}
      <div className="flex items-center">
        <button
          onClick={onMenuClick}
          className="p-2 mr-4 text-slate-400 hover:text-slate-200 lg:hidden rounded-lg hover:bg-slate-800 transition-colors"
        >
          <Menu className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-semibold text-slate-100">{getPageTitle()}</h1>
      </div>

      {/* Right — notifications + user menu */}
      <div className="flex items-center space-x-2">

        {/* Notification Bell */}
        <div ref={notifRef} className="relative">
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowUserMenu(false);
            }}
            className="p-2 text-slate-400 hover:text-cyan-400 transition-colors rounded-full hover:bg-slate-800 relative"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full text-white text-[10px] font-bold flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notification Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl shadow-black/50 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-200">Notifications</h3>
                <span className="text-xs text-cyan-400 font-medium">
                  {unreadCount} unread
                </span>
              </div>
              <div className="divide-y divide-slate-800/50 max-h-72 overflow-y-auto">
                {notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`px-4 py-3 hover:bg-slate-800/50 transition-colors cursor-pointer ${
                      notif.unread ? 'bg-slate-800/20' : ''
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${notif.color}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-200">
                          {notif.title}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                          {notif.message}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">{notif.time}</p>
                      </div>
                      {notif.unread && (
                        <div className="w-2 h-2 bg-cyan-400 rounded-full shrink-0 mt-2" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div className="px-4 py-3 border-t border-slate-800 text-center">
                <button className="text-xs text-cyan-400 hover:text-cyan-300 font-medium transition-colors">
                  Mark all as read
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User Menu */}
        <div ref={userRef} className="relative">
          <button
            onClick={() => {
              setShowUserMenu(!showUserMenu);
              setShowNotifications(false);
            }}
            className="hidden sm:flex items-center space-x-3 border border-slate-800 pl-3 pr-2 py-1.5 rounded-xl hover:bg-slate-800/50 transition-colors"
          >
            <div className="text-right">
              <p className="text-sm font-medium text-slate-200 leading-none">
                {user?.full_name}
              </p>
              <p className="text-xs text-slate-500 capitalize mt-0.5">
                {user?.role}
              </p>
            </div>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-cyan-400 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-cyan-500/20">
              {user?.full_name?.charAt(0).toUpperCase()}
            </div>
            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
          </button>

          {/* User Dropdown */}
          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl shadow-black/50 overflow-hidden">
              {/* User info header */}
              <div className="px-4 py-3 border-b border-slate-800">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-cyan-400 flex items-center justify-center text-white font-bold">
                    {user?.full_name?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-200">
                      {user?.full_name}
                    </p>
                    <p className="text-xs text-slate-400">{user?.email}</p>
                  </div>
                </div>
              </div>

              {/* Menu items */}
              <div className="py-1">
                <button
                  onClick={() => {
                    navigate('/profile');
                    setShowUserMenu(false);
                  }}
                  className="w-full flex items-center px-4 py-2.5 text-sm text-slate-300 hover:text-slate-100 hover:bg-slate-800 transition-colors"
                >
                  <User className="w-4 h-4 mr-3 text-slate-400" />
                  View Profile
                </button>
                <button
                  onClick={() => {
                    navigate('/profile');
                    setShowUserMenu(false);
                  }}
                  className="w-full flex items-center px-4 py-2.5 text-sm text-slate-300 hover:text-slate-100 hover:bg-slate-800 transition-colors"
                >
                  <Settings className="w-4 h-4 mr-3 text-slate-400" />
                  Settings
                </button>
              </div>

              <div className="border-t border-slate-800 py-1">
                <button
                  onClick={() => {
                    logout();
                    navigate('/login');
                    setShowUserMenu(false);
                  }}
                  className="w-full flex items-center px-4 py-2.5 text-sm text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors"
                >
                  <LogOut className="w-4 h-4 mr-3" />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};