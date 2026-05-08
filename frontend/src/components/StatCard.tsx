import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '../lib/utils';

interface StatCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  color: 'green' | 'red' | 'blue' | 'purple';
  trend?: string;
}

const colorStyles = {
  green: 'text-emerald-400 bg-emerald-400/10 border-emerald-500/20 shadow-emerald-500/10',
  red: 'text-rose-400 bg-rose-400/10 border-rose-500/20 shadow-rose-500/10',
  blue: 'text-cyan-400 bg-cyan-400/10 border-cyan-500/20 shadow-cyan-500/10',
  purple: 'text-purple-400 bg-purple-400/10 border-purple-500/20 shadow-purple-500/10',
};

export const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, color, trend }) => {
  return (
    <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-6 hover:bg-slate-800/50 transition-colors duration-300">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-400 mb-1">{title}</p>
          <h3 className="text-2xl font-bold text-slate-100">{value}</h3>
          {trend && (
            <p className={cn("text-xs mt-2 font-medium", trend.startsWith('+') ? "text-emerald-400" : "text-rose-400")}>
              {trend} from last month
            </p>
          )}
        </div>
        <div className={cn("p-3 rounded-lg border shadow-lg", colorStyles[color])}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
};
