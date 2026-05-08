import React, { useState } from 'react';
import { Sparkles, Search, Brain, TrendingUp, AlertTriangle, CheckCircle, Info, Wand2 } from 'lucide-react';
import api from '../api/axios';
import { formatCurrency, formatDate, cn } from '../lib/utils';
import { LoadingSpinner } from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

export const AIFeatures: React.FC = () => {
  // Auto Categorize State
  const [categorizeText, setCategorizeText] = useState('');
  const [isCategorizing, setIsCategorizing] = useState(false);
  const [categoryResult, setCategoryResult] = useState<any>(null);

  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any>(null);

  // Insights State
  const [isGeneratingInsights, setIsGeneratingInsights] = useState(false);
  const [insights, setInsights] = useState<any>(null);

  const handleCategorize = async () => {
    if (!categorizeText.trim()) return;
    setIsCategorizing(true);
    setCategoryResult(null);
    try {
      // ✅ Fixed: send "notes" not "description"
      const response = await api.post('/ai/categorize', { notes: categorizeText });
      setCategoryResult(response.data);
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to categorize transaction');
    } finally {
      setIsCategorizing(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setSearchResults(null);
    try {
      const response = await api.post('/ai/search', { query: searchQuery });
      setSearchResults(response.data);
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to search transactions');
    } finally {
      setIsSearching(false);
    }
  };

  const handleGenerateInsights = async () => {
    setIsGeneratingInsights(true);
    setInsights(null);
    try {
      const response = await api.get('/ai/insights');
      setInsights(response.data);
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to generate insights');
    } finally {
      setIsGeneratingInsights(false);
    }
  };

  const getConfidenceColor = (level: string) => {
    switch (level?.toLowerCase()) {
      case 'high': return 'text-emerald-400 bg-emerald-400/10 border-emerald-500/20';
      case 'medium': return 'text-yellow-400 bg-yellow-400/10 border-yellow-500/20';
      case 'low': return 'text-rose-400 bg-rose-400/10 border-rose-500/20';
      default: return 'text-slate-400 bg-slate-400/10 border-slate-500/20';
    }
  };

  const getInsightIcon = (index: number) => {
    const icons = [
      <TrendingUp className="w-5 h-5 text-purple-400" />,
      <CheckCircle className="w-5 h-5 text-emerald-400" />,
      <AlertTriangle className="w-5 h-5 text-yellow-400" />,
      <Info className="w-5 h-5 text-cyan-400" />,
      <Brain className="w-5 h-5 text-rose-400" />,
    ];
    return icons[index % icons.length];
  };

  return (
    <div className="space-y-8 pb-12">
      <div>
        <h2 className="text-2xl font-bold text-slate-100">AI Features</h2>
        <p className="text-slate-400 text-sm mt-1">Powered by Groq — Fast AI Inference</p>
      </div>

      {/* Banner */}
      <div className="bg-gradient-to-r from-purple-900/40 to-cyan-900/40 border border-purple-500/20 rounded-xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-purple-500/30 blur-2xl rounded-full pointer-events-none" />
        <div className="relative z-10 flex items-start">
          <div className="p-3 bg-slate-900/50 rounded-lg mr-4 border border-slate-800">
            <Sparkles className="w-6 h-6 text-cyan-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-100 mb-2">
              Supercharge your finances
            </h3>
            <p className="text-slate-300 text-sm leading-relaxed max-w-3xl">
              FinTrack AI uses Groq's lightning-fast inference to help you categorize
              transactions, search using natural language, and understand your finances
              through plain English insights.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* Section 1: Auto Categorize */}
        <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-6 flex flex-col">
          <div className="flex items-center mb-4">
            <Wand2 className="w-5 h-5 text-purple-400 mr-2" />
            <h3 className="text-lg font-semibold text-slate-100">Auto Categorize</h3>
          </div>
          <p className="text-sm text-slate-400 mb-4">
            Describe your transaction and AI will suggest the best category automatically.
          </p>

          <div className="flex-1 flex flex-col space-y-4">
            <textarea
              value={categorizeText}
              onChange={(e) => setCategorizeText(e.target.value)}
              placeholder="e.g. Paid electricity bill for the month, bought groceries at DMart, Netflix subscription..."
              className="w-full bg-slate-950/50 border border-slate-800 rounded-lg p-3 text-slate-200 focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-colors text-sm resize-none h-24"
            />

            {!categorizeText && !categoryResult && (
              <div className="text-xs text-slate-500">
                <span className="font-medium text-slate-400">Try:</span> paid electricity bill,
                monthly Netflix, grocery shopping, uber ride
              </div>
            )}

            <button
              onClick={handleCategorize}
              disabled={isCategorizing || !categorizeText.trim()}
              className="w-full flex items-center justify-center py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium rounded-lg transition-colors border border-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCategorizing ? (
                <>
                  <LoadingSpinner size={16} className="mr-2 text-purple-400" />
                  AI is thinking...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2 text-purple-400" />
                  Suggest Category
                </>
              )}
            </button>

            {/* ✅ Fixed: use suggested_category not category */}
            {categoryResult && (
              <div className="mt-4 p-4 bg-slate-950/50 rounded-lg border border-slate-800">
                <div className="flex items-center justify-between mb-3">
                  <span className="px-3 py-1 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-md text-sm font-medium capitalize">
                    {categoryResult.suggested_category}
                  </span>
                  <span className={cn(
                    'px-2 py-1 text-xs font-medium rounded-full border',
                    getConfidenceColor(categoryResult.confidence)
                  )}>
                    {categoryResult.confidence} confidence
                  </span>
                </div>
                <p className="text-sm text-slate-300">{categoryResult.reason}</p>
              </div>
            )}
          </div>
        </div>

        {/* Section 2: Natural Language Search */}
        <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-6 flex flex-col">
          <div className="flex items-center mb-4">
            <Search className="w-5 h-5 text-cyan-400 mr-2" />
            <h3 className="text-lg font-semibold text-slate-100">Natural Language Search</h3>
          </div>
          <p className="text-sm text-slate-400 mb-4">
            Search your transactions in plain English — no filters needed.
          </p>

          <div className="flex-1 flex flex-col space-y-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-slate-500" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="e.g. food expenses last month..."
                className="w-full pl-9 bg-slate-950/50 border border-slate-800 rounded-lg py-2.5 text-slate-200 focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-colors text-sm"
              />
            </div>

            <button
              onClick={handleSearch}
              disabled={isSearching || !searchQuery.trim()}
              className="w-full flex items-center justify-center py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium rounded-lg transition-colors border border-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSearching ? (
                <>
                  <LoadingSpinner size={16} className="mr-2 text-cyan-400" />
                  Searching...
                </>
              ) : (
                'Search'
              )}
            </button>

            {searchResults && (
              <div className="mt-4">
                <div className="bg-cyan-900/20 border border-cyan-500/20 rounded-lg p-3 mb-4">
                  <p className="text-sm text-cyan-200">
                    <span className="font-medium text-cyan-400">Interpreted as: </span>
                    {searchResults.interpreted_as}
                  </p>
                </div>

                <p className="text-xs text-slate-400 mb-2">
                  Found{' '}
                  <span className="font-medium text-slate-200">
                    {searchResults.transactions?.length || 0}
                  </span>{' '}
                  transactions
                </p>

                <div className="max-h-48 overflow-y-auto rounded-lg border border-slate-800 bg-slate-950/50">
                  {searchResults.transactions?.length > 0 ? (
                    <table className="w-full text-left text-xs text-slate-300">
                      <thead className="text-slate-500 border-b border-slate-800">
                        <tr>
                          <th className="px-3 py-2">Date</th>
                          <th className="px-3 py-2">Category</th>
                          <th className="px-3 py-2 text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/50">
                        {searchResults.transactions.map((tx: any) => (
                          <tr key={tx.id} className="hover:bg-slate-800/50">
                            <td className="px-3 py-2 whitespace-nowrap text-slate-400">
                              {formatDate(tx.date)}
                            </td>
                            <td className="px-3 py-2 capitalize">{tx.category}</td>
                            <td className={cn(
                              'px-3 py-2 font-medium text-right',
                              tx.type === 'income' ? 'text-emerald-400' : 'text-rose-400'
                            )}>
                              {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="p-4 text-center text-slate-500 text-sm">
                      No matching transactions found.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Section 3: Financial Insights */}
      <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Brain className="w-6 h-6 text-purple-400 mr-3" />
            <div>
              <h3 className="text-lg font-semibold text-slate-100">Financial Insights</h3>
              <p className="text-sm text-slate-400">
                Get plain English analysis of your financial patterns and spending behavior.
              </p>
            </div>
          </div>

          <button
            onClick={handleGenerateInsights}
            disabled={isGeneratingInsights}
            className="flex items-center px-6 py-2.5 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white text-sm font-medium rounded-lg transition-all shadow-lg shadow-cyan-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGeneratingInsights ? (
              <>
                <LoadingSpinner size={18} className="text-white mr-2" />
                Groq AI is analyzing...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                {insights ? 'Regenerate Insights' : 'Generate My Insights'}
              </>
            )}
          </button>
        </div>

        {/* ✅ Fixed: insights.insights is array of strings not objects */}
        {insights && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {insights.insights?.map((insight: string, index: number) => (
                <div
                  key={index}
                  className="bg-slate-950/50 border border-slate-800 rounded-lg p-5 relative overflow-hidden group hover:border-slate-700 transition-colors"
                >
                  {/* Left gradient border */}
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-purple-500 to-cyan-400 opacity-50 group-hover:opacity-100 transition-opacity" />

                  <div className="flex items-start pl-3">
                    <div className="p-2 bg-slate-900 rounded-lg border border-slate-800 mr-4 shrink-0">
                      {getInsightIcon(index)}
                    </div>
                    <p className="text-sm text-slate-300 leading-relaxed">{insight}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-right text-xs text-slate-500">
              Generated at: {insights.generated_at}
            </div>
          </div>
        )}

        {!insights && !isGeneratingInsights && (
          <div className="py-12 text-center border-2 border-dashed border-slate-800 rounded-lg">
            <Brain className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400 font-medium">No insights generated yet.</p>
            <p className="text-sm text-slate-500 mt-1">
              Click the button above to analyze your financial data.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};