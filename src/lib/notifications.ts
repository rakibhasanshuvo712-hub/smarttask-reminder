import { Reminder, Task, NotificationItem } from '@/types';
import { sound } from './audio';
import { formatDhakaDateTime } from './timezone';
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';

class NotificationService {
  private swRegistration: ServiceWorkerRegistration | null = null;
  private isNative: boolean = false;

  constructor() {
    this.isNative = Capacitor.isNativePlatform();
    if (this.isNative) {
      this.initNativeChannels();
    } else {
      this.registerServiceWorker();
    }
  }

  /**
   * Initializes Android High-Priority Alarm Notification Channel
   */
  async initNativeChannels() {
    try {
      await LocalNotifications.createChannel({
        id: 'smarttask_alarms',
        name: 'Task Deadlines & Alarms',
        description: 'High-priority native alarm reminders for SmartTask deadlines',
        importance: 5, // MAX importance - pops up on screen
        visibility: 1, // Public on lock screen
        vibration: true,
        lights: true,
        sound: 'alarm.wav',
      });
    } catch (e) {
      console.warn('Failed to create native Android notification channel:', e);
    }
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

  async getPermissionState(): Promise<NotificationPermission> {
    if (this.isNative) {
      try {
        const perm = await LocalNotifications.checkPermissions();
        return perm.display === 'granted' ? 'granted' : 'denied';
      } catch {
        return 'denied';
      }
    }

    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission;
    }
    return 'denied';
  }

  async requestPermission(): Promise<NotificationPermission> {
    if (this.isNative) {
      try {
        const perm = await LocalNotifications.requestPermissions();
        return perm.display === 'granted' ? 'granted' : 'denied';
      } catch {
        return 'denied';
      }
    }

    if (typeof window !== 'undefined' && 'Notification' in window) {
      return await Notification.requestPermission();
    }
    return 'denied';
  }

  /**
   * Schedule Native Android Alarm on phone hardware AlarmManager
   */
  async scheduleNativeAlarm(
    taskId: string,
    title: string,
    body: string,
    scheduledAtDate: Date,
    intId: number
  ) {
    if (!this.isNative) return;

    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            id: intId,
            title: `⏰ Alarm: ${title}`,
            body,
            schedule: {
              at: scheduledAtDate,
              allowWhileIdle: true, // Wake device up even in battery saver / doze mode
            },
            channelId: 'smarttask_alarms',
            smallIcon: 'ic_launcher',
            sound: 'alarm.wav',
            extra: { taskId },
          },
        ],
      });
    } catch (err) {
      console.warn('Failed to schedule native Android alarm:', err);
    }
  }

  /**
   * Cancel Native Android Alarm by ID
   */
  async cancelNativeAlarm(intId: number) {
    if (!this.isNative) return;
    try {
      await LocalNotifications.cancel({ notifications: [{ id: intId }] });
    } catch (e) {
      // ignore
    }
  }

  /**
   * Dispatch immediate notification to user's phone notification tray
   */
  async sendBrowserNotification(
    title: string,
    body: string,
    data?: { taskId?: string; url?: string; type?: 'reminder' | 'overdue' | 'completed' }
  ): Promise<boolean> {
    // 1. If running as native Android app, use LocalNotifications directly
    if (this.isNative) {
      try {
        await LocalNotifications.schedule({
          notifications: [
            {
              id: Math.floor(Math.random() * 1000000),
              title: data?.type === 'overdue' ? `🚨 OVERDUE: ${title}` : `⏰ ${title}`,
              body,
              schedule: { at: new Date(Date.now() + 200) },
              channelId: 'smarttask_alarms',
              smallIcon: 'ic_launcher',
              extra: data || {},
            },
          ],
        });
        return true;
      } catch (err) {
        console.warn('Native alert error:', err);
      }
    }

    // 2. Web / PWA Notification API
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
          icon: '/favicon.svg',
          badge: '/favicon.svg',
          tag: 'smarttask-' + (data?.taskId || Date.now()),
          data: data || {},
        });
        return true;
      }

      new Notification(title, {
        body,
        icon: '/favicon.svg',
        tag: 'smarttask-' + (data?.taskId || Date.now()),
      });
      return true;
    } catch (e) {
      console.warn('Browser notification error:', e);
      return false;
    }
  }

  /**
   * Calculate reminder schedule times and schedule native alarms
   */
  calculateReminders(
    deadlineAtIso: string,
    offsetsMinutes: number[],
    taskId: string,
    userId: string,
    taskTitle?: string
  ): Reminder[] {
    const deadlineMs = new Date(deadlineAtIso).getTime();
    const nowMs = Date.now();
    const reminders: Reminder[] = [];

    const sortedOffsets = Array.from(new Set(offsetsMinutes)).sort((a, b) => b - a);

    for (const offset of sortedOffsets) {
      const scheduledMs = deadlineMs - offset * 60 * 1000;

      if (scheduledMs > nowMs) {
        const remId = 'rem-' + Math.random().toString(36).substring(2, 9);
        const intId = Math.abs(this.hashCode(remId));

        reminders.push({
          id: remId,
          task_id: taskId,
          user_id: userId,
          reminder_offset_minutes: offset,
          scheduled_at: new Date(scheduledMs).toISOString(),
          status: 'pending',
          created_at: new Date().toISOString(),
        });

        // If native Android, schedule native hardware alarm
        if (this.isNative) {
          const hours = Math.floor(offset / 60);
          const mins = offset % 60;
          const timeStr = hours > 0 ? `${hours}h ${mins > 0 ? mins + 'm' : ''} left` : `${mins}m left`;
          this.scheduleNativeAlarm(
            taskId,
            taskTitle || 'Task Reminder',
            `Your task deadline is in ${timeStr} (Bangladesh Time).`,
            new Date(scheduledMs),
            intId
          );
        }
      }
    }

    // Also schedule an exact deadline alarm!
    if (deadlineMs > nowMs && this.isNative) {
      const deadlineIntId = Math.abs(this.hashCode(taskId + '_deadline'));
      this.scheduleNativeAlarm(
        taskId,
        taskTitle || 'Task Due Now',
        `The deadline for "${taskTitle || 'Task'}" has arrived in Bangladesh Standard Time!`,
        new Date(deadlineMs),
        deadlineIntId
      );
    }

    return reminders;
  }

  private hashCode(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return hash;
  }
}

export const notificationService = new NotificationService();
