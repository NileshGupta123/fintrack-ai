import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  ArrowLeftRight,
  Sparkles,
  Users,
  User as UserIcon,
  LogOut,
  LineChart,
  ChevronLeft,
  ChevronRight,
  Shield,
  TrendingUp,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';

export const Sidebar: React.FC<{
  isOpen: boolean;
  setIsOpen: (v: boolean) => void;
}> = ({ isOpen, setIsOpen }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const navItems = [
    {
      to: '/dashboard',
      icon: LayoutDashboard,
      label: 'Dashboard',
      roles: ['admin', 'analyst', 'viewer'],
      description: 'Overview & charts',
      color: 'text-purple-400',
      activeGlow: 'shadow-purple-500/20',
    },
    {
      to: '/transactions',
      icon: ArrowLeftRight,
      label: 'Transactions',
      roles: ['admin', 'analyst', 'viewer'],
      description: 'Manage records',
      color: 'text-cyan-400',
      activeGlow: 'shadow-cyan-500/20',
    },
    {
      to: '/ai',
      icon: Sparkles,
      label: 'AI Features',
      roles: ['admin', 'analyst'],
      description: 'Powered by Groq',
      color: 'text-yellow-400',
      activeGlow: 'shadow-yellow-500/20',
      badge: 'AI',
    },
    {
      to: '/users',
      icon: Users,
      label: 'Users',
      roles: ['admin'],
      description: 'Manage access',
      color: 'text-rose-400',
      activeGlow: 'shadow-rose-500/20',
    },
    {
      to: '/profile',
      icon: UserIcon,
      label: 'Profile',
      roles: ['admin', 'analyst', 'viewer'],
      description: 'Your account',
      color: 'text-emerald-400',
      activeGlow: 'shadow-emerald-500/20',
    },
  ];

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return {
          label: 'Admin',
          style: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
          icon: <Shield className="w-3 h-3 mr-1" />,
        };
      case 'analyst':
        return {
          label: 'Analyst',
          style: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
          icon: <TrendingUp className="w-3 h-3 mr-1" />,
        };
      default:
        return {
          label: 'Viewer',
          style: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
          icon: <UserIcon className="w-3 h-3 mr-1" />,
        };
    }
  };

  const roleBadge = getRoleBadge(user?.role || 'viewer');
  const filteredItems = navItems.filter((item) =>
    item.roles.includes(user?.role || '')
  );

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-screen bg-slate-900 border-r border-slate-800 transition-all duration-300 ease-in-out lg:translate-x-0 flex flex-col',
          isOpen ? 'translate-x-0' : '-translate-x-full',
          collapsed ? 'w-[72px]' : 'w-64'
        )}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center overflow-hidden">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-500 to-cyan-400 flex items-center justify-center shrink-0 shadow-lg shadow-purple-500/20">
              <LineChart className="w-4 h-4 text-white" />
            </div>
            {!collapsed && (
              <span className="ml-3 text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-cyan-400 whitespace-nowrap">
                FinTrack AI
              </span>
            )}
          </div>

          {/* Collapse button — desktop only */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex p-1.5 text-slate-500 hover:text-slate-300 hover:bg-slate-800 rounded-lg transition-colors shrink-0"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed
              ? <ChevronRight className="w-4 h-4" />
              : <ChevronLeft className="w-4 h-4" />
            }
          </button>
        </div>

        {/* Nav label */}
        {!collapsed && (
          <div className="px-4 pt-4 pb-2">
            <p className="text-xs font-semibold text-slate-600 uppercase tracking-widest">
              Navigation
            </p>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-1">
          {filteredItems.map((item) => {
            const isActive = location.pathname === item.to;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setIsOpen(false)}
                title={collapsed ? item.label : undefined}
                className={cn(
                  'relative flex items-center rounded-xl text-sm font-medium transition-all duration-200 group',
                  collapsed ? 'px-0 py-3 justify-center' : 'px-3 py-2.5',
                  isActive
                    ? 'bg-gradient-to-r from-purple-500/15 to-cyan-400/10 text-white border border-slate-700/50 shadow-lg'
                    : 'text-slate-400 hover:bg-slate-800/70 hover:text-slate-200'
                )}
              >
                {/* Active left bar indicator */}
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-gradient-to-b from-purple-400 to-cyan-400 rounded-full" />
                )}

                {/* Icon */}
                <div className={cn(
                  'shrink-0 transition-all duration-200',
                  collapsed ? '' : 'mr-3',
                  isActive ? item.color : 'text-slate-500 group-hover:text-slate-300'
                )}>
                  <item.icon className="w-5 h-5" />
                </div>

                {/* Label + description */}
                {!collapsed && (
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className={isActive ? 'text-slate-100' : ''}>
                        {item.label}
                      </span>
                      {/* AI badge */}
                      {item.badge && (
                        <span className="ml-2 px-1.5 py-0.5 text-[10px] font-bold bg-gradient-to-r from-purple-500/20 to-cyan-500/20 text-cyan-400 border border-cyan-500/20 rounded-md">
                          {item.badge}
                        </span>
                      )}
                    </div>
                    {isActive && (
                      <p className="text-xs text-slate-500 mt-0.5 leading-none">
                        {item.description}
                      </p>
                    )}
                  </div>
                )}

                {/* Tooltip for collapsed mode */}
                {collapsed && (
                  <div className="absolute left-full ml-3 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-200 whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity shadow-xl z-50">
                    <p className="font-medium">{item.label}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {item.description}
                    </p>
                    {/* Arrow */}
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-2 h-2 bg-slate-800 border-l border-b border-slate-700 rotate-45" />
                  </div>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom section */}
        <div className="border-t border-slate-800 p-3 space-y-2 shrink-0">

          {/* User info */}
          {!collapsed && (
            <div className="flex items-center px-2 py-2 rounded-xl bg-slate-800/50 border border-slate-700/50">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-cyan-400 flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-lg">
                {user?.full_name?.charAt(0).toUpperCase()}
              </div>
              <div className="ml-2.5 flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-200 truncate">
                  {user?.full_name}
                </p>
                <span className={cn(
                  'inline-flex items-center mt-0.5 px-1.5 py-0.5 text-[10px] font-medium rounded border',
                  roleBadge.style
                )}>
                  {roleBadge.icon}
                  {roleBadge.label}
                </span>
              </div>
            </div>
          )}

          {/* Collapsed avatar */}
          {collapsed && (
            <div className="flex justify-center">
              <div
                className="w-9 h-9 rounded-lg bg-gradient-to-br from-purple-500 to-cyan-400 flex items-center justify-center text-white font-bold text-sm shadow-lg cursor-pointer"
                title={user?.full_name}
              >
                {user?.full_name?.charAt(0).toUpperCase()}
              </div>
            </div>
          )}

          {/* Logout button */}
          <button
            onClick={logout}
            className={cn(
              'w-full flex items-center text-sm font-medium text-slate-400 rounded-xl hover:bg-rose-500/10 hover:text-rose-400 hover:border-rose-500/20 border border-transparent transition-all duration-200',
              collapsed ? 'justify-center px-0 py-2.5' : 'px-3 py-2.5'
            )}
            title={collapsed ? 'Logout' : undefined}
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!collapsed && <span className="ml-3">Sign Out</span>}
          </button>

          {/* Version */}
          {!collapsed && (
            <p className="text-center text-[10px] text-slate-700 font-mono pt-1">
              FinTrack AI v1.0.0
            </p>
          )}
        </div>
      </aside>
    </>
  );
};