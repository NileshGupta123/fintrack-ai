import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { LoadingSpinner } from './LoadingSpinner';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  transaction?: any;
}

const CATEGORIES = [
  { value: 'salary', label: 'Salary' },
  { value: 'freelance', label: 'Freelance' },
  { value: 'investment', label: 'Investment' },
  { value: 'food', label: 'Food' },
  { value: 'transport', label: 'Transport' },
  { value: 'utilities', label: 'Utilities' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'entertainment', label: 'Entertainment' },
  { value: 'rent', label: 'Rent' },
  { value: 'shopping', label: 'Shopping' },
  { value: 'education', label: 'Education' },
  { value: 'other', label: 'Other' },
];

// Convert any date format to YYYY-MM-DD for backend
const toBackendDate = (dateStr: string): string => {
  if (!dateStr) return '';
  // If already YYYY-MM-DD return as is
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
  // Handle DD-MM-YYYY format (Windows)
  if (/^\d{2}-\d{2}-\d{4}$/.test(dateStr)) {
    const [day, month, year] = dateStr.split('-');
    return `${year}-${month}-${day}`;
  }
  // Handle DD/MM/YYYY format
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
    const [day, month, year] = dateStr.split('/');
    return `${year}-${month}-${day}`;
  }
  return dateStr;
};

// Always show YYYY-MM-DD in the date input
const toInputDate = (dateStr: string): string => {
  if (!dateStr) return new Date().toISOString().split('T')[0];
  return toBackendDate(dateStr);
};

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  transaction,
}) => {
  const [formData, setFormData] = useState({
    amount: '',
    type: 'expense',
    category: 'food',
    date: new Date().toISOString().split('T')[0],
    notes: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (transaction) {
      setFormData({
        amount: transaction.amount.toString(),
        type: transaction.type,
        category: transaction.category,
        date: toInputDate(transaction.date),
        notes: transaction.notes || '',
      });
    } else {
      setFormData({
        amount: '',
        type: 'expense',
        category: 'food',
        date: new Date().toISOString().split('T')[0],
        notes: '',
      });
    }
  }, [transaction, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate amount
    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Amount must be a positive number');
      return;
    }

    // Validate category
    if (!formData.category) {
      toast.error('Please select a category');
      return;
    }

    // Convert date to YYYY-MM-DD before sending
    const backendDate = toBackendDate(formData.date);
    if (!backendDate) {
      toast.error('Please select a valid date');
      return;
    }

    setIsLoading(true);
    try {
      const payload = {
        amount: amount,
        type: formData.type,
        category: formData.category,
        date: backendDate,
        notes: formData.notes || null,
      };

      if (transaction) {
        await api.patch(`/transactions/${transaction.id}`, payload);
        toast.success('Transaction updated successfully');
      } else {
        await api.post('/transactions/', payload);
        toast.success('Transaction added successfully');
      }
      onSuccess();
      onClose();
    } catch (error: any) {
      const detail = error.response?.data?.detail;
      if (Array.isArray(detail)) {
        // Pydantic validation errors — show first one
        toast.error(detail[0]?.msg || 'Validation failed');
      } else {
        toast.error(detail || 'Failed to save transaction');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <h3 className="text-lg font-semibold text-slate-100">
            {transaction ? 'Edit Transaction' : 'Add Transaction'}
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 transition-colors p-1 rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Type + Date */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Type
              </label>
              <select
                value={formData.type}
                onChange={(e) =>
                  setFormData({ ...formData, type: e.target.value })
                }
                className="w-full bg-slate-950/50 border border-slate-800 rounded-lg py-2.5 px-3 text-slate-200 focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-colors sm:text-sm"
              >
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Date
              </label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) =>
                  setFormData({ ...formData, date: e.target.value })
                }
                className="w-full bg-slate-950/50 border border-slate-800 rounded-lg py-2.5 px-3 text-slate-200 focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-colors sm:text-sm"
              />
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Amount (₹)
            </label>
            <input
              type="number"
              required
              min="0.01"
              step="0.01"
              value={formData.amount}
              onChange={(e) =>
                setFormData({ ...formData, amount: e.target.value })
              }
              className="w-full bg-slate-950/50 border border-slate-800 rounded-lg py-2.5 px-3 text-slate-200 focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-colors sm:text-sm"
              placeholder="0.00"
            />
          </div>

          {/* Category — dropdown not text input */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Category
            </label>
            <select
              required
              value={formData.category}
              onChange={(e) =>
                setFormData({ ...formData, category: e.target.value })
              }
              className="w-full bg-slate-950/50 border border-slate-800 rounded-lg py-2.5 px-3 text-slate-200 focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-colors sm:text-sm"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Notes (Optional)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              rows={3}
              className="w-full bg-slate-950/50 border border-slate-800 rounded-lg py-2.5 px-3 text-slate-200 focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-colors sm:text-sm resize-none"
              placeholder="Add some details..."
            />
          </div>

          {/* Buttons */}
          <div className="pt-4 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 rounded-lg transition-all disabled:opacity-50 flex items-center"
            >
              {isLoading && (
                <LoadingSpinner size={16} className="text-white mr-2" />
              )}
              {transaction ? 'Update' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};