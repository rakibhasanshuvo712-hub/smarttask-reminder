import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { NotificationItem, Task, Reminder } from '@/types';
import { useAuth } from './AuthContext';
import {
  getSupabaseClient,
  localDb,
} from '@/lib/supabase';
import { notificationService } from '@/lib/notifications';
import { sound } from '@/lib/audio';

interface NotificationContextType {
  notifications: NotificationItem[];
  unreadCount: number;
  loading: boolean;
  pushPermission: NotificationPermission;
  requestPushPermission: () => Promise<NotificationPermission>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  clearAllNotifications: () => Promise<void>;
  triggerTestNotification: () => void;
  focusedTaskId: string | null;
  setFocusedTaskId: (id: string | null) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [pushPermission, setPushPermission] = useState<NotificationPermission>(() =>
    notificationService.getPermissionState()
  );
  const [focusedTaskId, setFocusedTaskId] = useState<string | null>(null);

  // Keep track of overdue notification timestamps to avoid duplicate spam within 1 hour
  const overdueNotifiedMap = useRef<Map<string, number>>(new Map());

  // Load notifications for current user
  const fetchNotifications = useCallback(async () => {
    if (!user) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (!error && data) {
          setNotifications(data);
        }
      } catch (err) {
        console.warn('Failed to fetch notifications from Supabase:', err);
      }
    } else {
      setNotifications(localDb.getNotifications(user.id));
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Request browser push permission
  const requestPushPermission = async () => {
    const res = await notificationService.requestPermission();
    setPushPermission(res);
    if (res === 'granted') {
      notificationService.sendBrowserNotification(
        '🔔 SmartTask Notifications Enabled',
        'You will now receive timely reminders in Bangladesh Standard Time (BST).'
      );
    }
    return res;
  };

  const markAsRead = async (id: string) => {
    if (!user) return;
    const supabase = getSupabaseClient();
    if (supabase) {
      await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    } else {
      localDb.markNotificationAsRead(id, user.id);
    }
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
  };

  const markAllAsRead = async () => {
    if (!user) return;
    const supabase = getSupabaseClient();
    if (supabase) {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id);
    } else {
      localDb.markAllNotificationsAsRead(user.id);
    }
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const deleteNotification = async (id: string) => {
    if (!user) return;
    const supabase = getSupabaseClient();
    if (supabase) {
      await supabase.from('notifications').delete().eq('id', id);
    } else {
      localDb.deleteNotification(id, user.id);
    }
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const clearAllNotifications = async () => {
    if (!user) return;
    const supabase = getSupabaseClient();
    if (supabase) {
      await supabase.from('notifications').delete().eq('user_id', user.id);
    } else {
      localDb.clearNotifications(user.id);
    }
    setNotifications([]);
  };

  const triggerTestNotification = () => {
    const newNotif: NotificationItem = {
      id: 'test-' + Date.now(),
      user_id: user?.id || 'demo',
      task_title: 'Test Task Reminder',
      message: '🔔 Test reminder triggered successfully in Bangladesh Standard Time (BST)!',
      type: 'reminder',
      is_read: false,
      created_at: new Date().toISOString(),
    };

    if (user) {
      localDb.saveNotification(newNotif);
    }
    setNotifications((prev) => [newNotif, ...prev]);

    notificationService.sendBrowserNotification(
      '🔔 SmartTask Test Reminder',
      'Browser push notifications and audio alerts are working perfectly!'
    );
  };

  // ============================================================================
  // AUTOMATED SCHEDULER: Checks pending reminders & overdue tasks every 12s
  // ============================================================================
  useEffect(() => {
    if (!user) return;

    const runScheduler = async () => {
      const nowMs = Date.now();
      const supabase = getSupabaseClient();

      if (supabase) {
        // If live Supabase, call process_smart_reminders stored function
        try {
          const { data } = await supabase.rpc('process_smart_reminders');
          if (data && (data[0]?.reminders_sent > 0 || data[0]?.overdue_detected > 0)) {
            fetchNotifications();
            sound.playReminderChime();
          }
        } catch (e) {
          // ignore
        }
      } else {
        // Local scheduler engine
        const tasks = localDb.getTasks(user.id);
        const reminders = localDb.getReminders(user.id);
        let updatedReminders = false;
        let newNotifsCount = 0;

        // 1. Check pending reminders
        for (const rem of reminders) {
          if (rem.status === 'pending') {
            const scheduledMs = new Date(rem.scheduled_at).getTime();
            if (scheduledMs <= nowMs) {
              const task = tasks.find((t) => t.id === rem.task_id);
              if (task && !task.is_completed) {
                const hours = Math.floor(rem.reminder_offset_minutes / 60);
                const mins = rem.reminder_offset_minutes % 60;
                const timeStr = hours > 0 ? `${hours} hour${hours > 1 ? 's' : ''}` : `${mins} minutes`;

                const notifMsg = `Reminder! Your task "${task.title}" is due in ${timeStr} (BST).`;

                const notif: NotificationItem = {
                  id: 'notif-' + Math.random().toString(36).substring(2, 9),
                  user_id: user.id,
                  task_id: task.id,
                  task_title: task.title,
                  message: notifMsg,
                  type: 'reminder',
                  is_read: false,
                  created_at: new Date().toISOString(),
                };

                localDb.saveNotification(notif);
                newNotifsCount++;

                // Send browser notification
                notificationService.sendBrowserNotification(
                  `SmartTask: ${task.title}`,
                  notifMsg,
                  { taskId: task.id, type: 'reminder' }
                );
              }

              // Mark reminder as sent so it NEVER repeats
              rem.status = 'sent';
              rem.sent_at = new Date().toISOString();
              updatedReminders = true;
            }
          }
        }

        if (updatedReminders) {
          localDb.saveReminders(reminders);
        }

        // 2. Overdue detection and repeat reminders
        for (const task of tasks) {
          if (!task.is_completed) {
            const deadlineMs = new Date(task.deadline_at).getTime();
            if (deadlineMs < nowMs) {
              const lastNotified = overdueNotifiedMap.current.get(task.id) || 0;
              // Check cooldown: repeat every 30 minutes if incomplete
              if (nowMs - lastNotified > 30 * 60 * 1000) {
                overdueNotifiedMap.current.set(task.id, nowMs);

                const notifMsg = `Your task "${task.title}" is now OVERDUE! Please complete or update it.`;
                const notif: NotificationItem = {
                  id: 'notif-' + Math.random().toString(36).substring(2, 9),
                  user_id: user.id,
                  task_id: task.id,
                  task_title: task.title,
                  message: notifMsg,
                  type: 'overdue',
                  is_read: false,
                  created_at: new Date().toISOString(),
                };

                localDb.saveNotification(notif);
                newNotifsCount++;

                notificationService.sendBrowserNotification(
                  `⚠️ Overdue Task: ${task.title}`,
                  notifMsg,
                  { taskId: task.id, type: 'overdue' }
                );
              }

              // Auto-delete after deadline if user selected auto_delete_after_deadline
              if (task.auto_delete_after_deadline) {
                localDb.deleteTask(task.id, user.id);
                const deleteMsg = `Task "${task.title}" has passed its deadline and was automatically cleaned up.`;
                const notif: NotificationItem = {
                  id: 'notif-' + Math.random().toString(36).substring(2, 9),
                  user_id: user.id,
                  task_id: null,
                  task_title: task.title,
                  message: deleteMsg,
                  type: 'system',
                  is_read: false,
                  created_at: new Date().toISOString(),
                };
                localDb.saveNotification(notif);
                newNotifsCount++;
              }
            }
          }
        }

        if (newNotifsCount > 0) {
          fetchNotifications();
        }
      }
    };

    // Run immediately then every 12 seconds
    runScheduler();
    const interval = setInterval(runScheduler, 12000);
    return () => clearInterval(interval);
  }, [user, fetchNotifications]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        pushPermission,
        requestPushPermission,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        clearAllNotifications,
        triggerTestNotification,
        focusedTaskId,
        setFocusedTaskId,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};
