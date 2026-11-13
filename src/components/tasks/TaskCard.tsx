import React from 'react';
import {
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  Edit,
  Eye,
  Flame,
  Zap,
} from 'lucide-react';
import { Task } from '@/types';
import {
  formatDhakaDateTime,
  isOverdue,
  isUpcoming,
  isDueTodayDhaka,
  getRemainingTimeLabel,
} from '@/lib/timezone';
import { useAuth } from '@/context/AuthContext';

interface TaskCardProps {
  task: Task;
  onToggleComplete: (taskId: string) => void;
  onView: (task: Task) => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onToggleComplete,
  onView,
  onEdit,
  onDelete,
}) => {
  const { user } = useAuth();
  const overdue = isOverdue(task.deadline_at, task.is_completed);
  const dueToday = isDueTodayDhaka(task.deadline_at);
  const upcoming = isUpcoming(task.deadline_at, task.is_completed) && dueToday;
  const remaining = getRemainingTimeLabel(task.deadline_at, task.is_completed);

  // Status Colors requirement (Section 5):
  // Green: Completed
  // Blue: Pending
  // Red: Overdue
  // Orange: Upcoming deadline
  let statusBadgeColor = 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800';
  let cardBorderColor = 'border-slate-200 dark:border-slate-800 hover:border-blue-400';
  let statusLabel = 'Pending';

  if (task.is_completed) {
    statusBadgeColor = 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
    cardBorderColor = 'border-emerald-200/60 dark:border-emerald-900/40 bg-emerald-50/10';
    statusLabel = 'Completed';
  } else if (overdue) {
    statusBadgeColor = 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300 border-red-200 dark:border-red-800';
    cardBorderColor = 'border-red-300/80 dark:border-red-800/60 bg-red-50/20';
    statusLabel = 'Overdue';
  } else if (upcoming) {
    statusBadgeColor = 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800';
    cardBorderColor = 'border-amber-300/80 dark:border-amber-800/60 bg-amber-50/10';
    statusLabel = 'Due Today';
  }

  const priorityColors = {
    high: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800',
    medium: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800',
    low: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800',
  };

  return (
    <div
      className={`group relative rounded-2xl border p-4 sm:p-5 bg-white dark:bg-slate-900 shadow-xs hover:shadow-md transition-all flex flex-col justify-between ${cardBorderColor}`}
    >
      <div>
        {/* Top badges row */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Status Badge */}
            <span
              className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${statusBadgeColor}`}
            >
              {statusLabel}
            </span>

            {/* Priority Badge */}
            <span
              className={`text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${priorityColors[task.priority]}`}
            >
              {task.priority}
            </span>

            {/* Auto-delete tag */}
            {task.auto_delete_after_deadline && (
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                Auto-Delete
              </span>
            )}
          </div>

          {/* Time Remaining Badge */}
          <span
            className={`text-xs font-semibold px-2 py-0.5 rounded-md ${
              task.is_completed
                ? 'text-slate-400 dark:text-slate-500'
                : overdue
                ? 'text-red-600 dark:text-red-400 font-bold bg-red-50 dark:bg-red-950/50'
                : 'text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800'
            }`}
          >
            {remaining.text}
          </span>
        </div>

        {/* Title & Checkbox */}
        <div className="flex items-start gap-3">
          <button
            onClick={() => onToggleComplete(task.id)}
            className="mt-0.5 text-slate-300 hover:text-emerald-500 transition-colors shrink-0"
            title={task.is_completed ? 'Mark Pending' : 'Mark Completed'}
          >
            {task.is_completed ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-500 fill-emerald-100 dark:fill-emerald-950" />
            ) : (
              <div className="w-5 h-5 rounded-full border-2 border-slate-300 dark:border-slate-600 hover:border-emerald-500 transition-colors" />
            )}
          </button>

          <div className="flex-1 cursor-pointer" onClick={() => onView(task)}>
            <h3
              className={`text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-snug line-clamp-2 ${
                task.is_completed ? 'line-through text-slate-400 dark:text-slate-500' : ''
              }`}
            >
              {task.title}
            </h3>

            {task.description && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">
                {task.description}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Bottom dates and action buttons */}
      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-1.5 font-medium truncate pr-2">
          <Clock className="w-3.5 h-3.5 text-blue-500 shrink-0" />
          <span className="truncate">
            Due: {formatDhakaDateTime(task.deadline_at, 'short', user?.time_format || '12h')} BST
          </span>
        </div>

        {/* Hover / Quick Action Buttons */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => onView(task)}
            className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="View Details"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => onEdit(task)}
            className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Edit Task"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(task)}
            className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Delete Task"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
