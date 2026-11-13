import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: number;
  subtitle?: string;
  icon: LucideIcon;
  color: 'blue' | 'emerald' | 'amber' | 'red' | 'purple';
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
  onClick,
}) => {
  const styles = {
    blue: {
      bg: 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-200/60 dark:border-blue-900/40',
      iconBg: 'bg-blue-100 text-blue-600 dark:bg-blue-900/60 dark:text-blue-400',
      valueColor: 'text-blue-950 dark:text-blue-100',
    },
    emerald: {
      bg: 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200/60 dark:border-emerald-900/40',
      iconBg: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/60 dark:text-emerald-400',
      valueColor: 'text-emerald-950 dark:text-emerald-100',
    },
    amber: {
      bg: 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200/60 dark:border-amber-900/40',
      iconBg: 'bg-amber-100 text-amber-600 dark:bg-amber-900/60 dark:text-amber-400',
      valueColor: 'text-amber-950 dark:text-amber-100',
    },
    red: {
      bg: 'bg-red-50/50 dark:bg-red-950/20 border-red-200/60 dark:border-red-900/40',
      iconBg: 'bg-red-100 text-red-600 dark:bg-red-900/60 dark:text-red-400',
      valueColor: 'text-red-950 dark:text-red-100',
    },
    purple: {
      bg: 'bg-purple-50/50 dark:bg-purple-950/20 border-purple-200/60 dark:border-purple-900/40',
      iconBg: 'bg-purple-100 text-purple-600 dark:bg-purple-900/60 dark:text-purple-400',
      valueColor: 'text-purple-950 dark:text-purple-100',
    },
  }[color];

  return (
    <div
      onClick={onClick}
      className={`rounded-2xl border p-4 sm:p-5 flex items-center justify-between transition-all ${styles.bg} ${
        onClick ? 'cursor-pointer hover:scale-[1.02] hover:shadow-md' : ''
      }`}
    >
      <div>
        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          {title}
        </p>
        <p className={`text-2xl sm:text-3xl font-extrabold mt-1 tracking-tight ${styles.valueColor}`}>
          {value}
        </p>
        {subtitle && (
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-medium">
            {subtitle}
          </p>
        )}
      </div>

      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-xs ${styles.iconBg}`}>
        <Icon className="w-6 h-6" />
      </div>
    </div>
  );
};
