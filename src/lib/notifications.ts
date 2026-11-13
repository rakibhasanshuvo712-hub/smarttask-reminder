import { Reminder, Task, NotificationItem } from '@/types';
import { sound } from './audio';
import { formatDhakaDateTime } from './timezone';

class NotificationService {
  private swRegistration: ServiceWorkerRegistration | null = null;

  constructor() {
    this.registerServiceWorker();
  }

  async registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      try {
        const reg = await navigator.serviceWorker.register('/sw.js');
        this.swRegistration = reg;
        return reg;
      } catch (err) {
        console.warn('Service Worker registration skipped or failed:', err);
      }
    }
    return null;
  }

  getPermissionState(): NotificationPermission {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission;
    }
    return 'denied';
  }

  async requestPermission(): Promise<NotificationPermission> {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const permission = await Notification.requestPermission();
      return permission;
    }
    return 'denied';
  }

  /**
   * Dispatch high-priority browser notification with fallback to standard Web Notification API
   */
  async sendBrowserNotification(
    title: string,
    body: string,
    data?: { taskId?: string; url?: string; type?: 'reminder' | 'overdue' | 'completed' }
  ): Promise<boolean> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return false;
    }

    if (Notification.permission !== 'granted') {
      return false;
    }

    // Play appropriate sound chime
    if (data?.type === 'overdue') {
      sound.playOverdueAlert();
    } else {
      sound.playReminderChime();
    }

    try {
      if (this.swRegistration && 'showNotification' in this.swRegistration) {
        await this.swRegistration.showNotification(title, {
          body,
          icon: '/vite.svg',
          badge: '/vite.svg',
          tag: 'smarttask-' + (data?.taskId || Date.now()),
          data: data || {},
        });
        return true;
      }

      // Standard desktop notification fallback
      new Notification(title, {
        body,
        icon: '/vite.svg',
        tag: 'smarttask-' + (data?.taskId || Date.now()),
      });
      return true;
    } catch (e) {
      console.warn('Browser notification error:', e);
      return false;
    }
  }

  /**
   * Calculate reminder schedule times for a given task deadline and offsets in minutes
   */
  calculateReminders(
    deadlineAtIso: string,
    offsetsMinutes: number[],
    taskId: string,
    userId: string
  ): Reminder[] {
    const deadlineMs = new Date(deadlineAtIso).getTime();
    const nowMs = Date.now();
    const reminders: Reminder[] = [];

    // Unique sorted offsets
    const sortedOffsets = Array.from(new Set(offsetsMinutes)).sort((a, b) => b - a);

    for (const offset of sortedOffsets) {
      const scheduledMs = deadlineMs - offset * 60 * 1000;

      // Only schedule if the reminder time is in the future
      if (scheduledMs > nowMs) {
        reminders.push({
          id: 'rem-' + Math.random().toString(36).substring(2, 9),
          task_id: taskId,
          user_id: userId,
          reminder_offset_minutes: offset,
          scheduled_at: new Date(scheduledMs).toISOString(),
          status: 'pending',
          created_at: new Date().toISOString(),
        });
      }
    }

    return reminders;
  }
}

export const notificationService = new NotificationService();
