import React from 'react';
import { cn } from '../lib/utils';

interface LoadingSpinnerProps {
  className?: string;
  size?: number;
  variant?: 'default' | 'branded' | 'dots' | 'pulse';
  label?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  className,
  size = 24,
  variant = 'branded',
  label,
}) => {

  // ── Branded gradient spinner (default) ──────────────────────
  if (variant === 'branded') {
    return (
      <div className={cn('flex flex-col items-center justify-center', className)}>
        <div
          className="relative"
          style={{ width: size, height: size }}
        >
          {/* Outer ring — gradient */}
          <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            className="animate-spin"
            style={{ animationDuration: '0.8s' }}
          >
            <defs>
              <linearGradient id="spinnerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#8b5cf6" />
                <stop offset="100%" stopColor="#06b6d4" />
              </linearGradient>
            </defs>
            {/* Track */}
            <circle
              cx="12"
              cy="12"
              r="10"
              stroke="#1e293b"
              strokeWidth="2.5"
            />
            {/* Spinning arc */}
            <circle
              cx="12"
              cy="12"
              r="10"
              stroke="url(#spinnerGrad)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeDasharray="40 23"
            />
          </svg>
        </div>
        {label && (
          <p className="mt-2 text-xs text-slate-500 animate-pulse">
            {label}
          </p>
        )}
      </div>
    );
  }

  // ── Dots variant ─────────────────────────────────────────────
  if (variant === 'dots') {
    return (
      <div className={cn('flex items-center space-x-1', className)}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-2 h-2 rounded-full bg-gradient-to-r from-purple-500 to-cyan-400"
            style={{
              animation: 'dotBounce 1.2s ease-in-out infinite',
              animationDelay: `${i * 0.2}s`,
            }}
          />
        ))}
        {label && (
          <span className="ml-2 text-xs text-slate-500">{label}</span>
        )}
        <style>{`
          @keyframes dotBounce {
            0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
            40% { transform: scale(1); opacity: 1; }
          }
        `}</style>
      </div>
    );
  }

  // ── Pulse variant ─────────────────────────────────────────────
  if (variant === 'pulse') {
    return (
      <div className={cn('flex items-center space-x-2', className)}>
        <div
          className="rounded-full bg-gradient-to-r from-purple-500 to-cyan-400"
          style={{
            width: size / 2,
            height: size / 2,
            animation: 'pulse 1.5s ease-in-out infinite',
          }}
        />
        {label && (
          <span className="text-xs text-slate-500">{label}</span>
        )}
        <style>{`
          @keyframes pulse {
            0%, 100% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.5); opacity: 0.5; }
          }
        `}</style>
      </div>
    );
  }

  // ── Default plain spinner ─────────────────────────────────────
  return (
    <div className={cn('flex items-center justify-center', className)}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        className="animate-spin"
      >
        <circle
          cx="12"
          cy="12"
          r="10"
          stroke="#1e293b"
          strokeWidth="2.5"
        />
        <circle
          cx="12"
          cy="12"
          r="10"
          stroke="#06b6d4"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray="40 23"
        />
      </svg>
      {label && (
        <span className="ml-2 text-xs text-slate-500">{label}</span>
      )}
    </div>
  );
};

// ── Full page loading screen ──────────────────────────────────
export const PageLoader: React.FC<{ message?: string }> = ({
  message = 'Loading...',
}) => {
  return (
    <div className="fixed inset-0 bg-slate-950 flex flex-col items-center justify-center z-50">
      {/* Logo */}
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-cyan-400 p-0.5 shadow-2xl shadow-purple-500/30 mb-6">
        <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center">
          <svg
            className="w-8 h-8"
            viewBox="0 0 24 24"
            fill="none"
            stroke="url(#logoGrad)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <defs>
              <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#8b5cf6" />
                <stop offset="100%" stopColor="#06b6d4" />
              </linearGradient>
            </defs>
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
          </svg>
        </div>
      </div>

      {/* App name */}
      <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-cyan-400 mb-2">
        FinTrack AI
      </h1>

      {/* Spinner */}
      <LoadingSpinner size={32} variant="branded" className="mt-4" />

      {/* Message */}
      <p className="mt-4 text-sm text-slate-500 animate-pulse">
        {message}
      </p>

      {/* Bottom bar animation */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5">
        <div
          className="h-full bg-gradient-to-r from-purple-500 via-cyan-400 to-purple-500"
          style={{
            animation: 'loadBar 2s ease-in-out infinite',
            backgroundSize: '200% 100%',
          }}
        />
      </div>

      <style>{`
        @keyframes loadBar {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
};