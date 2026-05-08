import React, { useState, useEffect } from 'react';
import {
  Mail, Shield, Calendar, Activity, TrendingUp,
  TrendingDown, Wallet, Edit3, Check, X, Lock
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { formatDate, formatCurrency, cn } from '../lib/utils';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { LoadingSpinner } from '../components/LoadingSpinner';

export const Profile: React.FC = () => {
  const { user } = useAuth();
  const [summary, setSummary] = useState<any>(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(true);
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState(user?.full_name || '');
  const [isSavingName, setIsSavingName] = useState(false);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const res = await api.get('/dashboard/summary');
        setSummary(res.data);
      } catch {
        // silently fail
      } finally {
        setIsLoadingSummary(false);
      }
    };
    fetchSummary();
  }, []);

  const handleSaveName = async () => {
    if (!newName.trim() || newName === user?.full_name) {
      setIsEditingName(false);
      return;
    }
    setIsSavingName(true);
    try {
      await api.patch(`/users/${user?.id}`, { full_name: newName.trim() });
      toast.success('Name updated successfully');
      setIsEditingName(false);
    } catch {
      toast.error('Failed to update name');
    } finally {
      setIsSavingName(false);
    }
  };

  if (!user) return null;

  const getRoleBadgeStyle = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      case 'analyst': return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
      default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  const getRoleDescription = (role: string) => {
    switch (role) {
      case 'admin': return 'Full access — manage users, transactions, and all settings';
      case 'analyst': return 'Can create and update transactions, view dashboard and AI features';
      default: return 'Read-only access — can view transactions and dashboard';
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">

      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-100">Profile</h2>
        <p className="text-slate-400 text-sm mt-1">
          Manage your account settings and preferences.
        </p>
      </div>

      {/* Main Profile Card */}
      <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl overflow-hidden">

        {/* Banner */}
        <div className="h-28 bg-gradient-to-r from-purple-900/60 via-slate-900 to-cyan-900/60 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-cyan-500/10" />
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-purple-500/50 via-cyan-500/50 to-transparent" />
        </div>

        <div className="px-6 sm:px-8 pb-8">
          {/* Avatar row */}
          <div className="relative -mt-14 mb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div className="w-28 h-28 rounded-2xl bg-gradient-to-br from-purple-500 to-cyan-400 p-0.5 shadow-xl shadow-purple-500/30">
              <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center text-5xl font-bold text-white">
                {user.full_name?.charAt(0).toUpperCase()}
              </div>
            </div>

            <div className="flex items-center space-x-3 sm:mb-2">
              <span className={cn(
                'px-3 py-1.5 rounded-full text-xs font-semibold border uppercase tracking-wider',
                getRoleBadgeStyle(user.role)
              )}>
                {user.role}
              </span>
              <span className={cn(
                'px-3 py-1.5 rounded-full text-xs font-medium border flex items-center',
                user.is_active
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
              )}>
                <Activity className="w-3 h-3 mr-1.5" />
                {user.is_active ? 'Active Account' : 'Inactive'}
              </span>
            </div>
          </div>

          {/* Name + Email */}
          <div className="space-y-1 mb-8">
            <div className="flex items-center space-x-3">
              {isEditingName ? (
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-200 text-2xl font-bold focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 outline-none"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveName();
                      if (e.key === 'Escape') setIsEditingName(false);
                    }}
                  />
                  <button
                    onClick={handleSaveName}
                    disabled={isSavingName}
                    className="p-2 text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors"
                  >
                    {isSavingName
                      ? <LoadingSpinner size={16} />
                      : <Check className="w-4 h-4" />
                    }
                  </button>
                  <button
                    onClick={() => {
                      setIsEditingName(false);
                      setNewName(user.full_name);
                    }}
                    className="p-2 text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <>
                  <h1 className="text-3xl font-bold text-slate-100">
                    {user.full_name}
                  </h1>
                  <button
                    onClick={() => setIsEditingName(true)}
                    className="p-1.5 text-slate-500 hover:text-cyan-400 hover:bg-slate-800 rounded-lg transition-colors"
                    title="Edit name"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
            <p className="text-slate-400 flex items-center text-sm">
              <Mail className="w-4 h-4 mr-2 shrink-0" />
              {user.email}
            </p>
          </div>

          {/* Info Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-slate-800">
            <div className="bg-slate-950/50 rounded-xl p-4 border border-slate-800/50">
              <div className="flex items-center text-slate-400 mb-2">
                <Shield className="w-4 h-4 mr-2" />
                <span className="text-xs font-medium uppercase tracking-wider">Role</span>
              </div>
              <p className="text-base font-semibold text-slate-200 capitalize mb-1">
                {user.role}
              </p>
              <p className="text-xs text-slate-500 leading-relaxed">
                {getRoleDescription(user.role)}
              </p>
            </div>

            <div className="bg-slate-950/50 rounded-xl p-4 border border-slate-800/50">
              <div className="flex items-center text-slate-400 mb-2">
                <Calendar className="w-4 h-4 mr-2" />
                <span className="text-xs font-medium uppercase tracking-wider">Member Since</span>
              </div>
              <p className="text-base font-semibold text-slate-200">
                {formatDate(user.created_at)}
              </p>
              <p className="text-xs text-slate-500 mt-1">Account created</p>
            </div>

            <div className="bg-slate-950/50 rounded-xl p-4 border border-slate-800/50">
              <div className="flex items-center text-slate-400 mb-2">
                <Lock className="w-4 h-4 mr-2" />
                <span className="text-xs font-medium uppercase tracking-wider">Security</span>
              </div>
              <p className="text-base font-semibold text-emerald-400">Protected</p>
              <p className="text-xs text-slate-500 mt-1">JWT • Argon2 hashing</p>
            </div>
          </div>
        </div>
      </div>

      {/* Financial Summary Cards */}
      <div>
        <h3 className="text-lg font-semibold text-slate-200 mb-4">
          Your Financial Summary
        </h3>
        {isLoadingSummary ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner size={32} />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-slate-400">Total Income</span>
                <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                </div>
              </div>
              <p className="text-2xl font-bold text-emerald-400">
                {formatCurrency(summary?.total_income || 0)}
              </p>
              <p className="text-xs text-slate-500 mt-1">All time income</p>
            </div>

            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-slate-400">Total Expenses</span>
                <div className="w-9 h-9 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                  <TrendingDown className="w-4 h-4 text-rose-400" />
                </div>
              </div>
              <p className="text-2xl font-bold text-rose-400">
                {formatCurrency(summary?.total_expense || 0)}
              </p>
              <p className="text-xs text-slate-500 mt-1">All time expenses</p>
            </div>

            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-slate-400">Net Balance</span>
                <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                  <Wallet className="w-4 h-4 text-cyan-400" />
                </div>
              </div>
              <p className={cn(
                'text-2xl font-bold',
                (summary?.net_balance || 0) >= 0
                  ? 'text-cyan-400'
                  : 'text-rose-400'
              )}>
                {formatCurrency(summary?.net_balance || 0)}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {summary?.transaction_count || 0} total transactions
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Account Info */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
        <h3 className="text-base font-semibold text-slate-200 mb-4 flex items-center">
          <Shield className="w-4 h-4 mr-2 text-purple-400" />
          Account Information
        </h3>
        <div className="space-y-3">
          {[
            { label: 'User ID', value: `#${user.id}` },
            { label: 'Email', value: user.email },
            { label: 'Role', value: user.role.charAt(0).toUpperCase() + user.role.slice(1) },
            { label: 'Account Status', value: user.is_active ? 'Active' : 'Inactive' },
            { label: 'Member Since', value: formatDate(user.created_at) },
            { label: 'Authentication', value: 'JWT Bearer Token' },
            { label: 'Password Security', value: 'Argon2 Hashing' },
          ].map((item) => (
            <div
              key={item.label}
              className="flex items-center justify-between py-2.5 border-b border-slate-800/50 last:border-0"
            >
              <span className="text-sm text-slate-500">{item.label}</span>
              <span className="text-sm font-medium text-slate-300">{item.value}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};