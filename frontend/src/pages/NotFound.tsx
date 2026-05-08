import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LineChart, Home, ArrowLeft, Search } from 'lucide-react';

export const NotFound: React.FC = () => {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(10);

  // Auto redirect after 10 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate('/dashboard');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center relative overflow-hidden px-4">

      {/* Background effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-purple-500/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-cyan-500/10 blur-[100px] rounded-full pointer-events-none" />

      <div className="relative z-10 text-center max-w-lg mx-auto">

        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-cyan-400 p-0.5 shadow-lg shadow-purple-500/30">
            <div className="w-full h-full bg-slate-900 rounded-[13px] flex items-center justify-center">
              <LineChart className="w-7 h-7 text-cyan-400" />
            </div>
          </div>
        </div>

        {/* 404 big number */}
        <div className="relative mb-6">
          <h1 className="text-[120px] sm:text-[160px] font-black leading-none bg-clip-text text-transparent bg-gradient-to-b from-slate-600 to-slate-800 select-none">
            404
          </h1>
          {/* Floating badge over 404 */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-slate-900/90 backdrop-blur-sm border border-slate-700 rounded-2xl px-5 py-2.5 shadow-2xl">
              <div className="flex items-center space-x-2">
                <Search className="w-4 h-4 text-slate-400" />
                <span className="text-sm font-medium text-slate-300">
                  Page not found
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Message */}
        <h2 className="text-2xl font-bold text-slate-200 mb-3">
          Oops! Lost in the ledger?
        </h2>
        <p className="text-slate-400 text-sm leading-relaxed mb-8 max-w-sm mx-auto">
          The page you're looking for doesn't exist or has been moved.
          Let's get you back to tracking your finances.
        </p>

        {/* Auto redirect countdown */}
        <div className="mb-8">
          <div className="inline-flex items-center space-x-2 bg-slate-900/60 border border-slate-800 rounded-full px-4 py-2">
            <div className="w-5 h-5 rounded-full border-2 border-cyan-500 border-t-transparent animate-spin" />
            <span className="text-xs text-slate-400">
              Redirecting to dashboard in{' '}
              <span className="font-bold text-cyan-400">{countdown}s</span>
            </span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full sm:w-auto flex items-center justify-center px-6 py-2.5 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white text-sm font-medium rounded-xl transition-all shadow-lg shadow-cyan-500/20"
          >
            <Home className="w-4 h-4 mr-2" />
            Go to Dashboard
          </button>
          <button
            onClick={() => navigate(-1)}
            className="w-full sm:w-auto flex items-center justify-center px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium rounded-xl transition-colors border border-slate-700"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </button>
        </div>

        {/* Quick links */}
        <div className="mt-10 pt-8 border-t border-slate-800/50">
          <p className="text-xs text-slate-500 mb-4">Quick links</p>
          <div className="flex flex-wrap justify-center gap-2">
            {[
              { label: 'Dashboard', path: '/dashboard' },
              { label: 'Transactions', path: '/transactions' },
              { label: 'AI Features', path: '/ai' },
              { label: 'Profile', path: '/profile' },
            ].map((link) => (
              <button
                key={link.path}
                onClick={() => navigate(link.path)}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-cyan-400 bg-slate-900/50 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-lg transition-all"
              >
                {link.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};