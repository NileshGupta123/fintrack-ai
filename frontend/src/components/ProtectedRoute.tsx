import React, { useEffect, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PageLoader } from './LoadingSpinner';
import { ShieldAlert, Clock, LogIn } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ('admin' | 'analyst' | 'viewer')[];
}

// Decode JWT to get expiry time
const getTokenExpiry = (token: string): number | null => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp ? payload.exp * 1000 : null; // convert to ms
  } catch {
    return null;
  }
};

// Format remaining time nicely
const formatTimeLeft = (ms: number): string => {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
};

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
}) => {
  const { user, token, isLoading, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [showExpiryWarning, setShowExpiryWarning] = useState(false);
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (!token) return;

    const expiry = getTokenExpiry(token);
    if (!expiry) return;

    const checkExpiry = () => {
      const now = Date.now();
      const remaining = expiry - now;

      // Already expired
      if (remaining <= 0) {
        setIsExpired(true);
        setShowExpiryWarning(false);
        logout();
        return;
      }

      // Show warning when less than 5 minutes left
      if (remaining <= 5 * 60 * 1000) {
        setShowExpiryWarning(true);
        setTimeLeft(formatTimeLeft(remaining));
      } else {
        setShowExpiryWarning(false);
      }
    };

    // Check immediately
    checkExpiry();

    // Check every second
    const interval = setInterval(checkExpiry, 1000);
    return () => clearInterval(interval);
  }, [token, logout]);

  // ── Loading state ─────────────────────────────────────────────
  if (isLoading) {
    return <PageLoader message="Verifying your session..." />;
  }

  // ── Token expired ─────────────────────────────────────────────
  if (isExpired) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-6">
            <Clock className="w-10 h-10 text-amber-400" />
          </div>
          <h2 className="text-2xl font-bold text-slate-100 mb-2">
            Session Expired
          </h2>
          <p className="text-slate-400 text-sm mb-8 leading-relaxed">
            Your session has expired for security reasons.
            Please sign in again to continue.
          </p>
          <button
            onClick={() => navigate('/login')}
            className="w-full flex items-center justify-center px-6 py-3 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white font-medium rounded-xl transition-all shadow-lg"
          >
            <LogIn className="w-4 h-4 mr-2" />
            Sign In Again
          </button>
        </div>
      </div>
    );
  }

  // ── Not authenticated ─────────────────────────────────────────
  if (!token || !user) {
    return (
      <Navigate
        to="/login"
        state={{ from: location }}
        replace
      />
    );
  }

  // ── Not authorized (wrong role) ───────────────────────────────
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          {/* Icon */}
          <div className="w-20 h-20 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto mb-6">
            <ShieldAlert className="w-10 h-10 text-rose-400" />
          </div>

          {/* Message */}
          <h2 className="text-2xl font-bold text-slate-100 mb-2">
            Access Denied
          </h2>
          <p className="text-slate-400 text-sm mb-2 leading-relaxed">
            You don't have permission to access this page.
          </p>
          <p className="text-slate-500 text-xs mb-8">
            Your role:{' '}
            <span className="text-slate-300 font-medium capitalize">
              {user.role}
            </span>
            {' '}— Required:{' '}
            <span className="text-slate-300 font-medium">
              {allowedRoles.join(' or ')}
            </span>
          </p>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex-1 flex items-center justify-center px-6 py-3 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white font-medium rounded-xl transition-all shadow-lg text-sm"
            >
              Go to Dashboard
            </button>
            <button
              onClick={() => navigate(-1)}
              className="flex-1 flex items-center justify-center px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-xl transition-colors border border-slate-700 text-sm"
            >
              Go Back
            </button>
          </div>

          {/* Role info */}
          <div className="mt-8 p-4 bg-slate-900/50 border border-slate-800 rounded-xl text-left">
            <p className="text-xs font-semibold text-slate-400 mb-3 uppercase tracking-wider">
              What your role can access:
            </p>
            <div className="space-y-2">
              {[
                { page: 'Dashboard', roles: ['viewer', 'analyst', 'admin'] },
                { page: 'Transactions', roles: ['viewer', 'analyst', 'admin'] },
                { page: 'AI Features', roles: ['analyst', 'admin'] },
                { page: 'User Management', roles: ['admin'] },
                { page: 'Profile', roles: ['viewer', 'analyst', 'admin'] },
              ].map((item) => (
                <div
                  key={item.page}
                  className="flex items-center justify-between"
                >
                  <span className="text-xs text-slate-400">{item.page}</span>
                  <span className={
                    item.roles.includes(user.role)
                      ? 'text-xs text-emerald-400 font-medium'
                      : 'text-xs text-slate-600'
                  }>
                    {item.roles.includes(user.role) ? '✓ Allowed' : '✗ Restricted'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Authorized — render children ──────────────────────────────
  return (
    <>
      {/* Session expiry warning banner */}
      {showExpiryWarning && (
        <div className="fixed top-0 left-0 right-0 z-[100] bg-amber-500/95 backdrop-blur-sm px-4 py-2.5 flex items-center justify-between shadow-lg">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-amber-900 shrink-0" />
            <p className="text-sm font-medium text-amber-900">
              Your session expires in{' '}
              <span className="font-bold">{timeLeft}</span>
              {' '}— Save your work.
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                logout();
                navigate('/login');
              }}
              className="text-xs font-semibold text-amber-900 bg-amber-400/50 hover:bg-amber-400/80 px-3 py-1.5 rounded-lg transition-colors"
            >
              Sign In Again
            </button>
            <button
              onClick={() => setShowExpiryWarning(false)}
              className="text-xs text-amber-800 hover:text-amber-900 transition-colors px-2"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Push content down when warning banner is shown */}
      {showExpiryWarning && <div className="h-10" />}

      {children}
    </>
  );
};