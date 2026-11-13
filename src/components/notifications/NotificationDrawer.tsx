import React, { useRef, useEffect } from 'react';
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  ExternalLink,
  AlertTriangle,
  Clock,
  X,
  Volume2,
} from 'lucide-react';
import { useNotifications } from '@/context/NotificationContext';
import { useTasks } from '@/context/TaskContext';
import { formatDhakaDateTime } from '@/lib/timezone';
import { useAuth } from '@/context/AuthContext';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onViewTaskDetail?: (taskId: string) => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  onViewTaskDetail,
}) => {
  const { user } = useAuth();
  const {
    notifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
    triggerTestNotification,
  } = useNotifications();
  const { tasks, toggleCompleteTask, deleteTask } = useTasks();
  const drawerRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (drawerRef.current && !drawerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleAction = async (action: 'view' | 'complete' | 'delete', taskId?: string | null, notifId?: string) => {
    if (notifId) {
      markAsRead(notifId);
    }

    if (!taskId) return;

    if (action === 'view') {
      if (onViewTaskDetail) {
        onViewTaskDetail(taskId);
      }
      onClose();
    } else if (action === 'complete') {
      await toggleCompleteTask(taskId);
    } else if (action === 'delete') {
      const confirmed = window.confirm('Are you sure you want to delete this task?');
      if (confirmed) {
        await deleteTask(taskId);
      }
    }
  };

  return (
    <div
      ref={drawerRef}
      className="absolute right-0 mt-3 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 z-50 overflow-hidden flex flex-col max-h-[80vh]"
    >
      {/* Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/50">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">
            Notification Center
          </h3>
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300">
            {notifications.length}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={triggerTestNotification}
            className="p-1.5 text-slate-500 hover:text-blue-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Test reminder chime & notification"
          >
            <Volume2 className="w-4 h-4" />
          </button>
          <button
            onClick={markAllAsRead}
            disabled={notifications.length === 0}
            className="p-1.5 text-slate-500 hover:text-emerald-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-30"
            title="Mark all as read"
          >
            <CheckCheck className="w-4 h-4" />
          </button>
          <button
            onClick={clearAllNotifications}
            disabled={notifications.length === 0}
            className="p-1.5 text-slate-500 hover:text-red-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-30"
            title="Clear all"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 ml-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* List */}
      <div className="overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80 p-1 flex-1">
        {notifications.length === 0 ? (
          <div className="py-12 px-4 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-3 text-slate-400">
              <Bell className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              No notifications yet
            </p>
            <p className="text-xs text-slate-400 mt-1 max-w-[240px] mx-auto">
              Automated reminders before and after deadlines in Asia/Dhaka time will appear here.
            </p>
          </div>
        ) : (
          notifications.map((notif) => {
            const isOverdueType = notif.type === 'overdue';
            const isCompletedType = notif.type === 'completed';
            const associatedTask = notif.task_id ? tasks.find((t) => t.id === notif.task_id) : null;

            return (
              <div
                key={notif.id}
                className={`p-3.5 transition-colors rounded-xl m-1 ${
                  notif.is_read
                    ? 'bg-transparent hover:bg-slate-50 dark:hover:bg-slate-800/40 opacity-80'
                    : 'bg-blue-50/50 dark:bg-blue-950/20 border-l-3 border-blue-500 font-medium'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                        isOverdueType
                          ? 'bg-red-100 text-red-600 dark:bg-red-950/60 dark:text-red-400'
                          : isCompletedType
                          ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400'
                          : 'bg-blue-100 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400'
                      }`}
                    >
                      {isOverdueType ? (
                        <AlertTriangle className="w-4 h-4" />
                      ) : isCompletedType ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <Clock className="w-4 h-4" />
                      )}
                    </div>

                    <div>
                      {notif.task_title && (
                        <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                          {notif.task_title}
                        </span>
                      )}
                      <p className="text-xs text-slate-800 dark:text-slate-200 mt-0.5 leading-relaxed">
                        {notif.message}
                      </p>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 block">
                        {formatDhakaDateTime(notif.created_at, 'short', user?.time_format || '12h')} BST
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => deleteNotification(notif.id)}
                    className="p-1 text-slate-400 hover:text-red-500 rounded-md transition-colors shrink-0"
                    title="Delete notification"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Section 7 Action Buttons: View Task, Mark as Completed, Delete Task */}
                {notif.task_id && (
                  <div className="flex items-center gap-1.5 mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <button
                      onClick={() => handleAction('view', notif.task_id, notif.id)}
                      className="flex items-center gap-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-100/60 dark:hover:bg-blue-900/40 px-2 py-1 rounded-md transition-colors"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>View Task</span>
                    </button>

                    {associatedTask && !associatedTask.is_completed && (
                      <button
                        onClick={() => handleAction('complete', notif.task_id, notif.id)}
                        className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100/60 dark:hover:bg-emerald-900/40 px-2 py-1 rounded-md transition-colors"
                      >
                        <Check className="w-3 h-3" />
                        <span>Mark Done</span>
                      </button>
                    )}

                    <button
                      onClick={() => handleAction('delete', notif.task_id, notif.id)}
                      className="flex items-center gap-1 text-[11px] font-semibold text-red-600 dark:text-red-400 hover:bg-red-100/60 dark:hover:bg-red-900/40 px-2 py-1 rounded-md transition-colors ml-auto"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Delete Task</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
