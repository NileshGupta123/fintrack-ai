import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Wallet, List, Calendar, ArrowUpRight, ArrowDownRight, Sparkles } from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, Area, AreaChart,
} from 'recharts';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { StatCard } from '../components/StatCard';
import { formatCurrency, formatDate, cn } from '../lib/utils';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { useNavigate } from 'react-router-dom';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [summary, setSummary] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  const currentYear = new Date().getFullYear();
  const [dateRange, setDateRange] = useState({
    date_from: `${currentYear}-01-01`,
    date_to: new Date().toISOString().split('T')[0],
  });

  // Live clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      try {
        const summaryRes = await api.get('/dashboard/summary', {
          params: {
            date_from: dateRange.date_from,
            date_to: dateRange.date_to,
          },
        });
        setSummary(summaryRes.data);
      } catch (error) {
        console.error('Failed to fetch dashboard data', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDashboardData();
  }, [dateRange]);

  // ── Greeting helpers ──────────────────────────────────────────
  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour >= 5 && hour < 12) return 'Good morning';
    if (hour >= 12 && hour < 17) return 'Good afternoon';
    if (hour >= 17 && hour < 21) return 'Good evening';
    return 'Good night';
  };

  const getGreetingEmoji = () => {
    const hour = currentTime.getHours();
    if (hour >= 5 && hour < 12) return '☀️';
    if (hour >= 12 && hour < 17) return '🌤️';
    if (hour >= 17 && hour < 21) return '🌆';
    return '🌙';
  };

  const getDayMessage = () => {
    const day = currentTime.getDay();
    const messages: Record<number, string> = {
      0: 'Happy Sunday — enjoy your rest day',
      1: 'Monday — great day to review your budget',
      2: 'Tuesday — stay on top of your spending',
      3: 'Wednesday — halfway through the week',
      4: 'Thursday — almost there',
      5: 'Friday — wrap up your weekly finances',
      6: 'Saturday — weekend spending check',
    };
    return messages[day];
  };

  const getFormattedTime = () => {
    return currentTime.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  };

  // ── Chart data ────────────────────────────────────────────────
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const areaChartData = summary?.monthly_trends?.length > 0
    ? summary.monthly_trends.map((t: any) => ({
        name: `${monthNames[t.month - 1]}`,
        income: t.income,
        expense: t.expense,
        net: t.net,
      }))
    : [{ name: 'No data', income: 0, expense: 0, net: 0 }];

  const categoryChartData = summary?.expense_by_category?.length > 0
    ? summary.expense_by_category.map((c: any) => ({
        name: c.category.charAt(0).toUpperCase() + c.category.slice(1),
        amount: c.total,
        count: c.count,
      }))
    : [{ name: 'No data', amount: 0, count: 0 }];

  // ── Savings rate ──────────────────────────────────────────────
  const savingsRate = summary?.total_income > 0
    ? Math.round(((summary.total_income - summary.total_expense) / summary.total_income) * 100)
    : 0;

  if (isLoading && !summary) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-cyan-400 p-0.5 animate-pulse">
          <div className="w-full h-full bg-slate-900 rounded-[10px]" />
        </div>
        <LoadingSpinner size={32} />
        <p className="text-slate-500 text-sm">Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <span className="text-2xl">{getGreetingEmoji()}</span>
            <h2 className="text-2xl font-bold text-slate-100">
              {getGreeting()},{' '}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-cyan-400">
                {user?.full_name?.split(' ')[0]}
              </span>
            </h2>
          </div>
          <p className="text-slate-400 text-sm">
            {getDayMessage()}
          </p>
          <p className="text-slate-500 text-xs mt-0.5 font-mono">
            {getFormattedTime()}
          </p>
        </div>

        {/* Date range filter */}
        <div className="flex items-center space-x-2 bg-slate-900/50 p-2 rounded-xl border border-slate-800 shrink-0">
          <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="date"
            value={dateRange.date_from}
            onChange={(e) =>
              setDateRange((prev) => ({ ...prev, date_from: e.target.value }))
            }
            className="bg-transparent text-xs text-slate-200 focus:outline-none"
          />
          <span className="text-slate-600">→</span>
          <input
            type="date"
            value={dateRange.date_to}
            onChange={(e) =>
              setDateRange((prev) => ({ ...prev, date_to: e.target.value }))
            }
            className="bg-transparent text-xs text-slate-200 focus:outline-none"
          />
        </div>
      </div>

      {/* ── Stats Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Income"
          value={formatCurrency(summary?.total_income || 0)}
          icon={TrendingUp}
          color="green"
          trend="+12.5%"
        />
        <StatCard
          title="Total Expenses"
          value={formatCurrency(summary?.total_expense || 0)}
          icon={TrendingDown}
          color="red"
          trend="-2.4%"
        />
        <StatCard
          title="Net Balance"
          value={formatCurrency(summary?.net_balance || 0)}
          icon={Wallet}
          color="blue"
        />
        <StatCard
          title="Total Transactions"
          value={(summary?.transaction_count || 0).toString()}
          icon={List}
          color="purple"
        />
      </div>

      {/* ── Savings rate + Quick actions ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

        {/* Savings rate card */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 blur-2xl rounded-full" />
          <p className="text-xs text-slate-500 uppercase tracking-wider font-medium mb-3">
            Savings Rate
          </p>
          <div className="flex items-end justify-between mb-3">
            <p className={cn(
              'text-4xl font-black',
              savingsRate >= 20 ? 'text-emerald-400' :
              savingsRate >= 0 ? 'text-yellow-400' : 'text-rose-400'
            )}>
              {savingsRate}%
            </p>
            <span className={cn(
              'text-xs font-medium px-2 py-1 rounded-full border',
              savingsRate >= 20
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : savingsRate >= 0
                ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
            )}>
              {savingsRate >= 20 ? '🎯 Great' : savingsRate >= 0 ? '⚠️ Fair' : '🚨 Deficit'}
            </span>
          </div>
          {/* Progress bar */}
          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-1000',
                savingsRate >= 20 ? 'bg-emerald-500' :
                savingsRate >= 0 ? 'bg-yellow-500' : 'bg-rose-500'
              )}
              style={{ width: `${Math.min(Math.max(savingsRate, 0), 100)}%` }}
            />
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Target: 20% savings rate
          </p>
        </div>

        {/* Quick action cards */}
        <div
          onClick={() => navigate('/transactions')}
          className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 cursor-pointer hover:border-purple-500/50 hover:bg-slate-900/80 transition-all group relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-20 h-20 bg-purple-500/5 blur-xl rounded-full group-hover:bg-purple-500/10 transition-all" />
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center group-hover:bg-purple-500/20 transition-all">
              <ArrowUpRight className="w-5 h-5 text-purple-400" />
            </div>
            <span className="text-xs text-slate-500 group-hover:text-slate-400 transition-colors">
              Click to open →
            </span>
          </div>
          <p className="text-sm font-semibold text-slate-200 mb-1">
            Add Transaction
          </p>
          <p className="text-xs text-slate-500">
            Record a new income or expense entry
          </p>
        </div>

        <div
          onClick={() => navigate('/ai')}
          className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 cursor-pointer hover:border-cyan-500/50 hover:bg-slate-900/80 transition-all group relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-20 h-20 bg-cyan-500/5 blur-xl rounded-full group-hover:bg-cyan-500/10 transition-all" />
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center group-hover:bg-cyan-500/20 transition-all">
              <Sparkles className="w-5 h-5 text-cyan-400" />
            </div>
            <span className="text-xs text-slate-500 group-hover:text-slate-400 transition-colors">
              Click to open →
            </span>
          </div>
          <p className="text-sm font-semibold text-slate-200 mb-1">
            AI Insights
          </p>
          <p className="text-xs text-slate-500">
            Get AI-powered analysis of your finances
          </p>
        </div>
      </div>

      {/* ── Charts ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Area Chart — Monthly Trends */}
        <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-semibold text-slate-100">
                Income vs Expense Trends
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Monthly breakdown</p>
            </div>
            <div className="flex items-center space-x-3 text-xs text-slate-500">
              <span className="flex items-center">
                <span className="w-2 h-2 rounded-full bg-emerald-400 mr-1.5" />
                Income
              </span>
              <span className="flex items-center">
                <span className="w-2 h-2 rounded-full bg-rose-400 mr-1.5" />
                Expense
              </span>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={areaChartData}>
                <defs>
                  <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis
                  dataKey="name"
                  stroke="#475569"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#475569"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#1e293b',
                    borderRadius: '10px',
                    fontSize: '12px',
                  }}
                  itemStyle={{ color: '#e2e8f0' }}
                  formatter={(value: any) => [
                    `₹${Number(value).toLocaleString('en-IN')}`, ''
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="income"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  fill="url(#incomeGrad)"
                  dot={{ fill: '#10b981', r: 3 }}
                  activeDot={{ r: 5 }}
                />
                <Area
                  type="monotone"
                  dataKey="expense"
                  stroke="#f43f5e"
                  strokeWidth={2.5}
                  fill="url(#expenseGrad)"
                  dot={{ fill: '#f43f5e', r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bar Chart — Expense by Category */}
        <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-6">
          <div className="mb-6">
            <h3 className="text-base font-semibold text-slate-100">
              Expense by Category
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {categoryChartData.length} categories tracked
            </p>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={categoryChartData}
                layout="vertical"
                margin={{ top: 0, right: 10, left: 10, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#1e293b"
                  horizontal={false}
                />
                <XAxis
                  type="number"
                  stroke="#475569"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                />
                <YAxis
                  dataKey="name"
                  type="category"
                  stroke="#475569"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  width={75}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#1e293b',
                    borderRadius: '10px',
                    fontSize: '12px',
                  }}
                  cursor={{ fill: '#1e293b' }}
                  formatter={(value: any, name: any, props: any) => [
                    `₹${Number(value).toLocaleString('en-IN')} (${props.payload.count} txns)`,
                    'Total'
                  ]}
                />
                <Bar
                  dataKey="amount"
                  fill="#8b5cf6"
                  radius={[0, 6, 6, 0]}
                  barSize={20}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── Recent Transactions ── */}
      <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl overflow-hidden">
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-100">
              Recent Transactions
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Last 5 transactions</p>
          </div>
          <button
            onClick={() => navigate('/transactions')}
            className="text-xs text-cyan-400 hover:text-cyan-300 font-medium transition-colors flex items-center"
          >
            View all
            <ArrowUpRight className="w-3 h-3 ml-1" />
          </button>
        </div>

        {summary?.recent_transactions?.length > 0 ? (
          <div className="divide-y divide-slate-800/50">
            {summary.recent_transactions.map((tx: any, index: number) => (
              <div
                key={tx.id}
                className="flex items-center justify-between px-6 py-4 hover:bg-slate-800/30 transition-colors"
              >
                {/* Left — icon + info */}
                <div className="flex items-center space-x-4">
                  <div className={cn(
                    'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
                    tx.type === 'income'
                      ? 'bg-emerald-500/10 border border-emerald-500/20'
                      : 'bg-rose-500/10 border border-rose-500/20'
                  )}>
                    {tx.type === 'income'
                      ? <ArrowUpRight className="w-4 h-4 text-emerald-400" />
                      : <ArrowDownRight className="w-4 h-4 text-rose-400" />
                    }
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-200 capitalize">
                      {tx.category}
                    </p>
                    <p className="text-xs text-slate-500">
                      {tx.notes || formatDate(tx.date)}
                    </p>
                  </div>
                </div>

                {/* Right — amount + date */}
                <div className="text-right">
                  <p className={cn(
                    'text-sm font-bold',
                    tx.type === 'income' ? 'text-emerald-400' : 'text-rose-400'
                  )}>
                    {tx.type === 'income' ? '+' : '-'}
                    {formatCurrency(tx.amount)}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {formatDate(tx.date)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center mx-auto mb-4">
              <List className="w-7 h-7 text-slate-600" />
            </div>
            <p className="text-slate-400 font-medium mb-1">
              No transactions yet
            </p>
            <p className="text-sm text-slate-500 mb-6">
              Add your first transaction to see it here
            </p>
            <button
              onClick={() => navigate('/transactions')}
              className="inline-flex items-center px-5 py-2 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white text-sm font-medium rounded-xl transition-all shadow-lg"
            >
              <ArrowUpRight className="w-4 h-4 mr-2" />
              Add Transaction
            </button>
          </div>
        )}
      </div>
    </div>
  );
};