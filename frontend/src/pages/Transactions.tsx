import React, { useState, useEffect } from 'react';
import {
  Search, Plus, Edit2, Trash2, FilterX,
  Inbox, TrendingUp, TrendingDown, Wallet,
  Download, ArrowUpRight, ArrowDownRight,
} from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, formatDate, cn } from '../lib/utils';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { TransactionModal } from '../components/TransactionModal';
import toast from 'react-hot-toast';

export const Transactions: React.FC = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  const [filters, setFilters] = useState({
    type: '',
    category: '',
    date_from: '',
    date_to: '',
    search: '',
    page: 1,
    page_size: 20,
  });

  const fetchTransactions = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== '') params.append(key, value.toString());
      });
      const response = await api.get(`/transactions/?${params.toString()}`);
      setTransactions(response.data.items);
      setTotalCount(response.data.total);
    } catch (error) {
      console.error('Failed to fetch transactions', error);
      toast.error('Failed to load transactions');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [
    filters.type,
    filters.category,
    filters.date_from,
    filters.date_to,
    filters.page,
  ]);

  useEffect(() => {
    const timer = setTimeout(() => fetchTransactions(), 500);
    return () => clearTimeout(timer);
  }, [filters.search]);

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/transactions/${id}`);
      toast.success('Transaction deleted');
      setDeleteConfirmId(null);
      fetchTransactions();
    } catch (error) {
      toast.error('Failed to delete transaction');
    }
  };

  const clearFilters = () => {
    setFilters({
      type: '',
      category: '',
      date_from: '',
      date_to: '',
      search: '',
      page: 1,
      page_size: 20,
    });
  };

  const hasActiveFilters =
    filters.type || filters.category ||
    filters.date_from || filters.date_to || filters.search;

  // Export to CSV
  const exportToCSV = () => {
    if (transactions.length === 0) {
      toast.error('No transactions to export');
      return;
    }
    const headers = ['Date', 'Type', 'Category', 'Amount', 'Notes'];
    const rows = transactions.map((tx) => [
      tx.date,
      tx.type,
      tx.category,
      tx.amount,
      tx.notes || '',
    ]);
    const csvContent = [headers, ...rows]
      .map((row) => row.map((v) => `"${v}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fintrack-transactions-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Exported to CSV!');
  };

  // Summary calculations from current page
  const pageIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((s, t) => s + Number(t.amount), 0);

  const pageExpense = transactions
    .filter((t) => t.type === 'expense')
    .reduce((s, t) => s + Number(t.amount), 0);

  const pageNet = pageIncome - pageExpense;

  const canEdit = user?.role === 'admin' || user?.role === 'analyst';
  const canDelete = user?.role === 'admin';
  const totalPages = Math.ceil(totalCount / filters.page_size);

  return (
    <div className="space-y-5 pb-8">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-100">Transactions</h2>
          <p className="text-slate-400 text-sm mt-1">
            Manage and view all your financial records.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {/* Export CSV */}
          <button
            onClick={exportToCSV}
            className="flex items-center px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium rounded-lg transition-colors border border-slate-700"
            title="Export to CSV"
          >
            <Download className="w-4 h-4 mr-1.5" />
            Export
          </button>

          {/* Add Transaction */}
          {canEdit && (
            <button
              onClick={() => {
                setSelectedTransaction(null);
                setIsModalOpen(true);
              }}
              className="flex items-center px-4 py-2 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white text-sm font-medium rounded-lg transition-all shadow-lg shadow-cyan-500/20"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Transaction
            </button>
          )}
        </div>
      </div>

      {/* ── Summary Bar ── */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 relative overflow-hidden group hover:border-emerald-500/30 transition-all">
          <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/5 blur-xl rounded-full" />
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">
              Income
            </p>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            </div>
          </div>
          <p className="text-lg font-bold text-emerald-400">
            +{formatCurrency(pageIncome)}
          </p>
          <p className="text-xs text-slate-600 mt-1">
            {transactions.filter((t) => t.type === 'income').length} entries
          </p>
        </div>

        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 relative overflow-hidden group hover:border-rose-500/30 transition-all">
          <div className="absolute top-0 right-0 w-16 h-16 bg-rose-500/5 blur-xl rounded-full" />
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">
              Expenses
            </p>
            <div className="w-7 h-7 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
              <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
            </div>
          </div>
          <p className="text-lg font-bold text-rose-400">
            -{formatCurrency(pageExpense)}
          </p>
          <p className="text-xs text-slate-600 mt-1">
            {transactions.filter((t) => t.type === 'expense').length} entries
          </p>
        </div>

        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 relative overflow-hidden group hover:border-cyan-500/30 transition-all">
          <div className="absolute top-0 right-0 w-16 h-16 bg-cyan-500/5 blur-xl rounded-full" />
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">
              Net
            </p>
            <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
              <Wallet className="w-3.5 h-3.5 text-cyan-400" />
            </div>
          </div>
          <p className={cn(
            'text-lg font-bold',
            pageNet >= 0 ? 'text-cyan-400' : 'text-rose-400'
          )}>
            {pageNet >= 0 ? '+' : ''}{formatCurrency(pageNet)}
          </p>
          <p className="text-xs text-slate-600 mt-1">
            {totalCount} total records
          </p>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">

          {/* Search */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-500" />
            </div>
            <input
              type="text"
              placeholder="Search notes..."
              value={filters.search}
              onChange={(e) =>
                setFilters({ ...filters, search: e.target.value })
              }
              className="block w-full pl-9 bg-slate-950/50 border border-slate-800 rounded-lg py-2 text-slate-200 focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-colors text-sm"
            />
          </div>

          {/* Type */}
          <select
            value={filters.type}
            onChange={(e) =>
              setFilters({ ...filters, type: e.target.value, page: 1 })
            }
            className="block w-full bg-slate-950/50 border border-slate-800 rounded-lg py-2 px-3 text-slate-200 focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-colors text-sm"
          >
            <option value="">All Types</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>

          {/* Category */}
          <select
            value={filters.category}
            onChange={(e) =>
              setFilters({ ...filters, category: e.target.value, page: 1 })
            }
            className="block w-full bg-slate-950/50 border border-slate-800 rounded-lg py-2 px-3 text-slate-200 focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-colors text-sm"
          >
            <option value="">All Categories</option>
            <option value="salary">Salary</option>
            <option value="freelance">Freelance</option>
            <option value="investment">Investment</option>
            <option value="food">Food</option>
            <option value="transport">Transport</option>
            <option value="utilities">Utilities</option>
            <option value="healthcare">Healthcare</option>
            <option value="entertainment">Entertainment</option>
            <option value="rent">Rent</option>
            <option value="shopping">Shopping</option>
            <option value="education">Education</option>
            <option value="other">Other</option>
          </select>

          {/* Date from */}
          <input
            type="date"
            value={filters.date_from}
            onChange={(e) =>
              setFilters({ ...filters, date_from: e.target.value, page: 1 })
            }
            className="block w-full bg-slate-950/50 border border-slate-800 rounded-lg py-2 px-3 text-slate-200 focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-colors text-sm"
          />

          {/* Date to */}
          <input
            type="date"
            value={filters.date_to}
            onChange={(e) =>
              setFilters({ ...filters, date_to: e.target.value, page: 1 })
            }
            className="block w-full bg-slate-950/50 border border-slate-800 rounded-lg py-2 px-3 text-slate-200 focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-colors text-sm"
          />
        </div>

        {/* Filter actions row */}
        <div className="mt-3 flex items-center justify-between">
          {hasActiveFilters ? (
            <p className="text-xs text-cyan-400">
              Filters active — showing filtered results
            </p>
          ) : (
            <p className="text-xs text-slate-600">
              Use filters to narrow down results
            </p>
          )}
          <button
            onClick={clearFilters}
            className={cn(
              'flex items-center px-3 py-1.5 text-sm font-medium rounded-lg transition-colors',
              hasActiveFilters
                ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500/20'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            )}
          >
            <FilterX className="w-4 h-4 mr-1.5" />
            Clear Filters
          </button>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl overflow-hidden flex flex-col min-h-[400px]">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left text-sm text-slate-400">
            <thead className="text-xs text-slate-500 uppercase bg-slate-900/80 border-b border-slate-800">
              <tr>
                <th className="px-6 py-4 font-medium">Date</th>
                <th className="px-6 py-4 font-medium">Type</th>
                <th className="px-6 py-4 font-medium">Category</th>
                <th className="px-6 py-4 font-medium">Amount</th>
                <th className="px-6 py-4 font-medium">Notes</th>
                {(canEdit || canDelete) && (
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <LoadingSpinner size={32} className="mx-auto" />
                    <p className="text-slate-500 text-sm mt-3">
                      Loading transactions...
                    </p>
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-16 h-16 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center mb-4">
                        <Inbox className="w-7 h-7 text-slate-600" />
                      </div>
                      <p className="text-base font-medium text-slate-400 mb-1">
                        No transactions found
                      </p>
                      <p className="text-sm text-slate-500 mb-5">
                        {hasActiveFilters
                          ? 'Try adjusting or clearing your filters'
                          : 'Add your first transaction to get started'
                        }
                      </p>
                      {hasActiveFilters ? (
                        <button
                          onClick={clearFilters}
                          className="flex items-center px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium rounded-lg transition-colors"
                        >
                          <FilterX className="w-4 h-4 mr-2" />
                          Clear Filters
                        </button>
                      ) : canEdit && (
                        <button
                          onClick={() => {
                            setSelectedTransaction(null);
                            setIsModalOpen(true);
                          }}
                          className="flex items-center px-4 py-2 bg-gradient-to-r from-purple-600 to-cyan-600 text-white text-sm font-medium rounded-lg transition-all"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add Transaction
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                transactions.map((tx: any) => (
                  <tr
                    key={tx.id}
                    className={cn(
                      'hover:bg-slate-800/40 transition-colors group',
                      tx.type === 'income'
                        ? 'hover:bg-emerald-500/5'
                        : 'hover:bg-rose-500/5'
                    )}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-slate-300">
                      {formatDate(tx.date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={cn(
                        'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border',
                        tx.type === 'income'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                      )}>
                        {tx.type === 'income'
                          ? <ArrowUpRight className="w-3 h-3 mr-1" />
                          : <ArrowDownRight className="w-3 h-3 mr-1" />
                        }
                        {tx.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2.5 py-1 rounded-md bg-slate-800 text-slate-300 text-xs font-medium capitalize">
                        {tx.category}
                      </span>
                    </td>
                    <td className={cn(
                      'px-6 py-4 whitespace-nowrap font-bold',
                      tx.type === 'income' ? 'text-emerald-400' : 'text-rose-400'
                    )}>
                      {tx.type === 'income' ? '+' : '-'}
                      {formatCurrency(tx.amount)}
                    </td>
                    <td className="px-6 py-4 text-slate-400 truncate max-w-xs">
                      {tx.notes || (
                        <span className="text-slate-600 italic">No notes</span>
                      )}
                    </td>
                    {(canEdit || canDelete) && (
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        {deleteConfirmId === tx.id ? (
                          // Inline delete confirmation
                          <div className="flex items-center justify-end space-x-2">
                            <span className="text-xs text-slate-400">
                              Delete?
                            </span>
                            <button
                              onClick={() => handleDelete(tx.id)}
                              className="px-2.5 py-1 text-xs font-medium text-white bg-rose-500 hover:bg-rose-400 rounded-md transition-colors"
                            >
                              Yes
                            </button>
                            <button
                              onClick={() => setDeleteConfirmId(null)}
                              className="px-2.5 py-1 text-xs font-medium text-slate-300 bg-slate-700 hover:bg-slate-600 rounded-md transition-colors"
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {canEdit && (
                              <button
                                onClick={() => {
                                  setSelectedTransaction(tx);
                                  setIsModalOpen(true);
                                }}
                                className="p-1.5 text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 rounded-lg transition-colors"
                                title="Edit"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                            )}
                            {canDelete && (
                              <button
                                onClick={() => setDeleteConfirmId(tx.id)}
                                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ── Pagination ── */}
        <div className="px-6 py-4 border-t border-slate-800 flex items-center justify-between bg-slate-900/80">
          <p className="text-sm text-slate-400">
            Showing{' '}
            <span className="font-medium text-slate-200">
              {totalCount === 0
                ? 0
                : (filters.page - 1) * filters.page_size + 1}
            </span>{' '}
            to{' '}
            <span className="font-medium text-slate-200">
              {Math.min(filters.page * filters.page_size, totalCount)}
            </span>{' '}
            of{' '}
            <span className="font-medium text-slate-200">{totalCount}</span>{' '}
            transactions
          </p>
          <div className="flex items-center space-x-1">
            <button
              onClick={() =>
                setFilters({ ...filters, page: Math.max(1, filters.page - 1) })
              }
              disabled={filters.page === 1}
              className="px-3 py-1.5 text-sm font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              ← Prev
            </button>

            {/* Page numbers */}
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const pageNum = i + 1;
              return (
                <button
                  key={pageNum}
                  onClick={() => setFilters({ ...filters, page: pageNum })}
                  className={cn(
                    'w-8 h-8 text-sm font-medium rounded-lg transition-colors',
                    filters.page === pageNum
                      ? 'bg-gradient-to-r from-purple-600 to-cyan-600 text-white'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  )}
                >
                  {pageNum}
                </button>
              );
            })}

            <button
              onClick={() =>
                setFilters({ ...filters, page: filters.page + 1 })
              }
              disabled={filters.page >= totalPages}
              className="px-3 py-1.5 text-sm font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next →
            </button>
          </div>
        </div>
      </div>

      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchTransactions}
        transaction={selectedTransaction}
      />
    </div>
  );
};