import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Shield, LineChart, Eye, EyeOff, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { cn } from '../lib/utils';

const roles = [
  {
    value: 'viewer',
    label: 'Viewer',
    description: 'Read-only access to transactions and dashboard',
    color: 'border-slate-500/50 bg-slate-500/5 text-slate-300',
    activeColor: 'border-slate-400 bg-slate-500/20 text-slate-200',
    dot: 'bg-slate-400',
  },
  {
    value: 'analyst',
    label: 'Analyst',
    description: 'Create and update transactions, access AI features',
    color: 'border-cyan-500/30 bg-cyan-500/5 text-cyan-300',
    activeColor: 'border-cyan-400 bg-cyan-500/20 text-cyan-200',
    dot: 'bg-cyan-400',
  },
  {
    value: 'admin',
    label: 'Admin',
    description: 'Full access including user management and delete',
    color: 'border-rose-500/30 bg-rose-500/5 text-rose-300',
    activeColor: 'border-rose-400 bg-rose-500/20 text-rose-200',
    dot: 'bg-rose-400',
  },
];

// Password strength checker
const getPasswordStrength = (password: string) => {
  if (!password) return { score: 0, label: '', color: '' };
  let score = 0;
  if (password.length >= 6) score++;
  if (password.length >= 10) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { score, label: 'Weak', color: 'bg-rose-500' };
  if (score <= 3) return { score, label: 'Fair', color: 'bg-yellow-500' };
  if (score <= 4) return { score, label: 'Good', color: 'bg-cyan-500' };
  return { score, label: 'Strong', color: 'bg-emerald-500' };
};

export const Register: React.FC = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    role: 'viewer',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const passwordStrength = getPasswordStrength(formData.password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setIsLoading(true);
    try {
      await api.post('/auth/register', formData);
      toast.success('Account created! Please sign in.');
      navigate('/login');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">

      {/* Background effects */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjEiIGZpbGw9IiMzMzQxNTUiIGZpbGwtb3BhY2l0eT0iMC40Ii8+PC9zdmc+')] opacity-40" />
      <div className="absolute top-0 right-1/4 w-[600px] h-[400px] bg-purple-500/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-[600px] h-[300px] bg-cyan-500/20 blur-[100px] rounded-full pointer-events-none" />

      {/* Logo + Title */}
      <div className="sm:mx-auto sm:w-full sm:max-w-lg relative z-10">
        <div className="flex justify-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-cyan-400 p-0.5 shadow-lg shadow-purple-500/30">
            <div className="w-full h-full bg-slate-900 rounded-[13px] flex items-center justify-center">
              <LineChart className="w-7 h-7 text-cyan-400" />
            </div>
          </div>
        </div>
        <h2 className="text-center text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-cyan-400">
          FinTrack AI
        </h2>
        <p className="mt-2 text-center text-sm text-slate-400">
          Create your account and start managing finances smartly
        </p>
      </div>

      {/* Form Card */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg relative z-10">
        <div className="bg-slate-900/60 backdrop-blur-xl py-8 px-4 shadow-2xl shadow-black/50 sm:rounded-2xl sm:px-10 border border-slate-800/60">

          <form className="space-y-5" onSubmit={handleSubmit}>

            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-4 w-4 text-slate-500" />
                </div>
                <input
                  type="text"
                  required
                  value={formData.full_name}
                  onChange={(e) =>
                    setFormData({ ...formData, full_name: e.target.value })
                  }
                  className="block w-full pl-10 bg-slate-950/50 border border-slate-800 rounded-lg py-2.5 text-slate-200 placeholder-slate-500 focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-colors text-sm"
                  placeholder="John Doe"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-slate-500" />
                </div>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="block w-full pl-10 bg-slate-950/50 border border-slate-800 rounded-lg py-2.5 text-slate-200 placeholder-slate-500 focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-colors text-sm"
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
                  <Lock className="h-4 w-4 text-slate-500" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className="block w-full pl-10 pr-10 bg-slate-950/50 border border-slate-800 rounded-lg py-2.5 text-slate-200 placeholder-slate-500 focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-colors text-sm"
                  placeholder="Min 6 characters"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword
                    ? <EyeOff className="h-4 w-4" />
                    : <Eye className="h-4 w-4" />
                  }
                </button>
              </div>

              {/* Password strength indicator */}
              {formData.password && (
                <div className="mt-2">
                  <div className="flex space-x-1 mb-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div
                        key={i}
                        className={cn(
                          'h-1 flex-1 rounded-full transition-all duration-300',
                          i <= passwordStrength.score
                            ? passwordStrength.color
                            : 'bg-slate-800'
                        )}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-slate-500">
                    Password strength:{' '}
                    <span className={cn(
                      'font-medium',
                      passwordStrength.score <= 1 ? 'text-rose-400' :
                      passwordStrength.score <= 3 ? 'text-yellow-400' :
                      passwordStrength.score <= 4 ? 'text-cyan-400' :
                      'text-emerald-400'
                    )}>
                      {passwordStrength.label}
                    </span>
                  </p>
                </div>
              )}
            </div>

            {/* Role Selector — card style */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                <Shield className="w-4 h-4 inline mr-1.5 text-slate-400" />
                Select Role
              </label>
              <div className="grid grid-cols-3 gap-2">
                {roles.map((role) => (
                  <button
                    key={role.value}
                    type="button"
                    onClick={() =>
                      setFormData({ ...formData, role: role.value })
                    }
                    className={cn(
                      'relative p-3 rounded-xl border text-left transition-all duration-200',
                      formData.role === role.value
                        ? role.activeColor + ' shadow-lg'
                        : 'border-slate-800 bg-slate-950/30 text-slate-400 hover:border-slate-700'
                    )}
                  >
                    {/* Selected checkmark */}
                    {formData.role === role.value && (
                      <div className="absolute top-2 right-2">
                        <Check className="w-3 h-3" />
                      </div>
                    )}
                    <div className={cn(
                      'w-2 h-2 rounded-full mb-2',
                      role.dot
                    )} />
                    <p className="text-xs font-semibold mb-1">{role.label}</p>
                    <p className="text-xs opacity-70 leading-relaxed">
                      {role.description}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Submit */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 focus:ring-offset-slate-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading
                  ? <LoadingSpinner size={20} className="text-white" />
                  : 'Create Account'
                }
              </button>
            </div>
          </form>

          {/* Login link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-slate-500">
              Already have an account?{' '}
              <Link
                to="/login"
                className="font-medium text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>

        {/* Feature highlights */}
        <div className="mt-8 grid grid-cols-3 gap-3 text-center">
          {[
            { icon: '🔐', text: 'Secure Auth' },
            { icon: '🤖', text: 'AI Powered' },
            { icon: '📊', text: 'Real Analytics' },
          ].map((item) => (
            <div
              key={item.text}
              className="bg-slate-900/30 border border-slate-800/50 rounded-xl py-3 px-2"
            >
              <div className="text-xl mb-1">{item.icon}</div>
              <p className="text-xs text-slate-400 font-medium">{item.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};