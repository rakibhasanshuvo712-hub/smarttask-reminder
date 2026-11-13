import React from 'react';
import { CheckCircle2, TrendingUp, Award } from 'lucide-react';
import { DashboardStats } from '@/types';

interface CompletionProgressProps {
  stats: DashboardStats;
}

export const CompletionProgress: React.FC<CompletionProgressProps> = ({ stats }) => {
  const { total, completed, pending, overdue, completionRate } = stats;

  let message = 'Start completing your tasks to build momentum!';
  if (completionRate === 100 && total > 0) {
    message = '🎉 Amazing! All tasks completed for today!';
  } else if (completionRate >= 70) {
    message = '🔥 Outstanding productivity! You are almost there!';
  } else if (completionRate >= 40) {
    message = '⚡ Great pace! Keep going to finish remaining tasks.';
  }

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-gradient-to-br from-white to-blue-50/30 dark:from-slate-900 dark:to-blue-950/20 p-5 sm:p-6 shadow-xs">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-400">
              <TrendingUp className="w-4 h-4" />
            </span>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              Task Completion Rate
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {message}
          </p>
        </div>

        <div className="flex items-baseline gap-2">
          <span className="text-3xl sm:text-4xl font-extrabold text-blue-600 dark:text-blue-400 tracking-tight">
            {completionRate}%
          </span>
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            ({completed}/{total} Done)
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mt-4">
        <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5">
          <div
            className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-500 rounded-full transition-all duration-700 ease-out"
            style={{ width: `${Math.min(100, Math.max(0, completionRate))}%` }}
          />
        </div>
      </div>

      {/* Micro Breakdown */}
      <div className="mt-3 flex items-center justify-between text-[11px] font-medium text-slate-500 dark:text-slate-400">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          {completed} Completed
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-blue-500" />
          {pending} In Progress
        </span>
        {overdue > 0 && (
          <span className="flex items-center gap-1.5 text-red-600 dark:text-red-400 font-bold">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            {overdue} Overdue
          </span>
        )}
      </div>
    </div>
  );
};
