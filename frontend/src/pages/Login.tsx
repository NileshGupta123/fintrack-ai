import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, LineChart, ShieldCheck, Sparkles, Activity, Eye, EyeOff, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { cn } from '../lib/utils';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [shake, setShake] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  // Load remembered email on mount
  useEffect(() => {
    const savedEmail = localStorage.getItem('fintrack_remember_email');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  const triggerShake = () => {
    setShake(true);
    setHasError(true);
    setTimeout(() => setShake(false), 600);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setHasError(false);

    try {
      const response = await api.post('/auth/login', { email, password });
      const { access_token } = response.data;

      const userResponse = await api.get('/users/me', {
        headers: { Authorization: `Bearer ${access_token}` },
      });

      // Handle remember me
      if (rememberMe) {
        localStorage.setItem('fintrack_remember_email', email);
      } else {
        localStorage.removeItem('fintrack_remember_email');
      }

      login(access_token, userResponse.data);
      toast.success('Welcome back! 👋');
      navigate('/dashboard');
    } catch (error: any) {
      triggerShake();
      toast.error(error.response?.data?.detail || 'Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };

  // Clear error when user starts typing again
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (hasError) setHasError(false);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    if (hasError) setHasError(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">

      {/* Background pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjEiIGZpbGw9IiMzMzQxNTUiIGZpbGwtb3BhY2l0eT0iMC40Ii8+PC9zdmc+')] opacity-40" />

      {/* Ambient gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-purple-500/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-cyan-500/20 blur-[100px] rounded-full pointer-events-none" />

      {/* Logo + title */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-cyan-400 p-0.5 shadow-lg shadow-purple-500/30">
            <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center">
              <LineChart className="w-8 h-8 text-cyan-400" />
            </div>
          </div>
        </div>
        <h2 className="text-center text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-cyan-400">
          FinTrack AI
        </h2>
        <p className="mt-3 text-center text-sm text-slate-400 font-medium">
          Smart Finance Management Powered by AI
        </p>
      </div>

      {/* Form card */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div
          className={cn(
            'bg-slate-900/60 backdrop-blur-xl py-8 px-4 shadow-2xl shadow-black/50 sm:rounded-2xl sm:px-10 border transition-all duration-300',
            hasError
              ? 'border-rose-500/40 shadow-rose-500/10'
              : 'border-slate-800/60',
            shake ? 'animate-[shake_0.5s_ease-in-out]' : ''
          )}
          style={shake ? {
            animation: 'shake 0.5s ease-in-out',
          } : {}}
        >

          {/* Error banner */}
          {hasError && (
            <div className="mb-6 flex items-center space-x-2 bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <p className="text-sm text-rose-300">
                Invalid email or password. Please try again.
              </p>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Email address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className={cn(
                    'h-4 w-4 transition-colors',
                    hasError ? 'text-rose-500' : 'text-slate-500'
                  )} />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={handleEmailChange}
                  className={cn(
                    'block w-full pl-10 bg-slate-950/50 border rounded-lg py-2.5 text-slate-200 placeholder-slate-500 focus:ring-2 transition-all text-sm',
                    hasError
                      ? 'border-rose-500/50 focus:ring-rose-500/30 focus:border-rose-500'
                      : 'border-slate-800 focus:ring-cyan-500/50 focus:border-cyan-500'
                  )}
                  placeholder="you@example.com"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className={cn(
                    'h-4 w-4 transition-colors',
                    hasError ? 'text-rose-500' : 'text-slate-500'
                  )} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={handlePasswordChange}
                  className={cn(
                    'block w-full pl-10 pr-10 bg-slate-950/50 border rounded-lg py-2.5 text-slate-200 placeholder-slate-500 focus:ring-2 transition-all text-sm',
                    hasError
                      ? 'border-rose-500/50 focus:ring-rose-500/30 focus:border-rose-500'
                      : 'border-slate-800 focus:ring-cyan-500/50 focus:border-cyan-500'
                  )}
                  placeholder="••••••••"
                />
                {/* Show/hide password toggle */}
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword
                    ? <EyeOff className="h-4 w-4" />
                    : <Eye className="h-4 w-4" />
                  }
                </button>
              </div>
            </div>

            {/* Remember me */}
            <div className="flex items-center justify-between">
              <label className="flex items-center space-x-2 cursor-pointer group">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="sr-only"
                  />
                  <div className={cn(
                    'w-4 h-4 rounded border-2 transition-all flex items-center justify-center',
                    rememberMe
                      ? 'bg-cyan-500 border-cyan-500'
                      : 'border-slate-600 bg-transparent group-hover:border-slate-400'
                  )}>
                    {rememberMe && (
                      <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </div>
                <span className="text-xs text-slate-400 group-hover:text-slate-300 transition-colors select-none">
                  Remember me
                </span>
              </label>

              <Link
                to="/register"
                className="text-xs text-slate-500 hover:text-cyan-400 transition-colors"
              >
                Don't have an account?
              </Link>
            </div>

            {/* Submit button */}
            <div className="pt-1">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 focus:ring-offset-slate-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-cyan-500/10 hover:shadow-cyan-500/20"
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <LoadingSpinner size={18} className="text-white" />
                    <span>Signing in...</span>
                  </div>
                ) : (
                  'Sign in'
                )}
              </button>
            </div>
          </form>

          {/* Divider */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-800" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-3 bg-slate-900/60 text-slate-600">
                  New to FinTrack AI?
                </span>
              </div>
            </div>
            <div className="mt-4">
              <Link
                to="/register"
                className="w-full flex justify-center py-2.5 px-4 border border-slate-700 rounded-xl text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 hover:border-slate-600 transition-all"
              >
                Create a free account
              </Link>
            </div>
          </div>
        </div>

        {/* Feature highlights */}
        <div className="mt-10 grid grid-cols-3 gap-4 text-center">
          <div className="flex flex-col items-center group">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center mb-3 border border-purple-500/20 group-hover:bg-purple-500/20 group-hover:border-purple-500/40 transition-all">
              <ShieldCheck className="w-5 h-5 text-purple-400" />
            </div>
            <span className="text-xs font-medium text-slate-500 group-hover:text-slate-400 transition-colors">
              Role Based Access
            </span>
          </div>
          <div className="flex flex-col items-center group">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center mb-3 border border-cyan-500/20 group-hover:bg-cyan-500/20 group-hover:border-cyan-500/40 transition-all">
              <Sparkles className="w-5 h-5 text-cyan-400" />
            </div>
            <span className="text-xs font-medium text-slate-500 group-hover:text-slate-400 transition-colors">
              AI Insights
            </span>
          </div>
          <div className="flex flex-col items-center group">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-3 border border-emerald-500/20 group-hover:bg-emerald-500/20 group-hover:border-emerald-500/40 transition-all">
              <Activity className="w-5 h-5 text-emerald-400" />
            </div>
            <span className="text-xs font-medium text-slate-500 group-hover:text-slate-400 transition-colors">
              Real Time Analytics
            </span>
          </div>
        </div>

        {/* Default credentials hint */}
        <div className="mt-6 text-center">
          <div className="inline-flex items-center space-x-2 bg-slate-900/50 border border-slate-800 rounded-xl px-4 py-2.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <p className="text-xs text-slate-500">
              Demo:{' '}
              <button
                onClick={() => {
                  setEmail('admin@finance.dev');
                  setPassword('admin123');
                }}
                className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
              >
                admin@finance.dev
              </button>
              {' '}/ admin123
            </p>
          </div>
        </div>
      </div>

      {/* Shake animation style */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 50%, 90% { transform: translateX(-6px); }
          30%, 70% { transform: translateX(6px); }
        }
      `}</style>
    </div>
  );
};