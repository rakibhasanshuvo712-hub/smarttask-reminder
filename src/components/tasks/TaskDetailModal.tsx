import React, { useState, useEffect } from 'react';
import {
  X,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Bell,
  Trash2,
  Edit,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react';
import { Task, Reminder } from '@/types';
import {
  formatDhakaDateTime,
  isOverdue,
  getRemainingTimeLabel,
} from '@/lib/timezone';
import { useAuth } from '@/context/AuthContext';
import { useTasks } from '@/context/TaskContext';

interface TaskDetailModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
}

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  task,
  isOpen,
  onClose,
  onEdit,
  onDelete,
}) => {
  const { user } = useAuth();
  const { toggleCompleteTask, getTaskReminders } = useTasks();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loadingReminders, setLoadingReminders] = useState(false);

  useEffect(() => {
    if (task && isOpen) {
      setLoadingReminders(true);
      getTaskReminders(task.id)
        .then((rems) => setReminders(rems))
        .finally(() => setLoadingReminders(false));
    }
  }, [task, isOpen, getTaskReminders]);

  if (!isOpen || !task) return null;

  const overdue = isOverdue(task.deadline_at, task.is_completed);
  const remaining = getRemainingTimeLabel(task.deadline_at, task.is_completed);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/40">
          <div className="flex items-center gap-2">
            <span
              className={`text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                task.is_completed
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                  : overdue
                  ? 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400'
                  : 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400'
              }`}
            >
              {task.is_completed ? 'Completed' : overdue ? 'Overdue' : 'Pending'}
            </span>

            <span
              className={`text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                task.priority === 'high'
                  ? 'bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400'
                  : task.priority === 'medium'
                  ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400'
                  : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
              }`}
            >
              {task.priority} Priority
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Title & Description */}
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white leading-snug">
              {task.title}
            </h3>
            {task.description && (
              <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 whitespace-pre-wrap leading-relaxed">
                {task.description}
              </p>
            )}
          </div>

          {/* Time & Countdown Box */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5 font-medium">
                <Clock className="w-4 h-4 text-blue-500" />
                Remaining Status:
              </span>
              <span
                className={`font-bold px-2 py-0.5 rounded-md ${
                  task.is_completed
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : overdue
                    ? 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40'
                    : 'text-blue-600 dark:text-blue-400'
                }`}
              >
                {remaining.text}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5 font-medium">
                <Calendar className="w-4 h-4 text-slate-400" />
                Deadline (Asia/Dhaka):
              </span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {formatDhakaDateTime(task.deadline_at, 'full', user?.time_format || '12h')}
              </span>
            </div>

            {task.start_at && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5 font-medium">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  Start (Asia/Dhaka):
                </span>
                <span className="text-slate-700 dark:text-slate-300">
                  {formatDhakaDateTime(task.start_at, 'full', user?.time_format || '12h')}
                </span>
              </div>
            )}

            {task.completed_at && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  Completed At:
                </span>
                <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
                  {formatDhakaDateTime(task.completed_at, 'full', user?.time_format || '12h')}
                </span>
              </div>
            )}
          </div>

          {/* Scheduled Reminders List */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1.5">
              <Bell className="w-3.5 h-3.5 text-indigo-500" />
              Automated Reminders ({reminders.length})
            </h4>

            {loadingReminders ? (
              <p className="text-xs text-slate-400">Loading reminders...</p>
            ) : reminders.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No reminders scheduled for this task.</p>
            ) : (
              <div className="space-y-1.5">
                {reminders.map((rem) => {
                  const hours = Math.floor(rem.reminder_offset_minutes / 60);
                  const mins = rem.reminder_offset_minutes % 60;
                  const label = hours > 0 ? `${hours}h ${mins > 0 ? mins + 'm' : ''} before` : `${mins}m before`;

                  return (
                    <div
                      key={rem.id}
                      className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            rem.status === 'sent'
                              ? 'bg-emerald-500'
                              : rem.status === 'cancelled'
                              ? 'bg-slate-400'
                              : 'bg-amber-500 animate-pulse'
                          }`}
                        />
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          {label}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                          {formatDhakaDateTime(rem.scheduled_at, 'short', user?.time_format || '12h')} BST
                        </span>
                        <span
                          className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-sm ${
                            rem.status === 'sent'
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                              : rem.status === 'cancelled'
                              ? 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                              : 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400'
                          }`}
                        >
                          {rem.status}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/40">
          <button
            onClick={() => onDelete(task)}
            className="flex items-center gap-1.5 text-xs font-semibold text-red-600 hover:text-red-700 px-3 py-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onEdit(task)}
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <Edit className="w-4 h-4" />
              <span>Edit</span>
            </button>

            <button
              onClick={async () => {
                await toggleCompleteTask(task.id);
                onClose();
              }}
              className={`flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-xl text-white shadow-xs transition-all active:scale-98 ${
                task.is_completed
                  ? 'bg-slate-600 hover:bg-slate-700'
                  : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{task.is_completed ? 'Mark Pending' : 'Mark Completed'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
