import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Profile, Task, Reminder, NotificationItem } from '@/types';

const STORAGE_KEY_CONFIG = 'smarttask_supabase_credentials';
const STORAGE_KEY_AUTH = 'smarttask_current_user_session';
const STORAGE_KEY_PROFILES = 'smarttask_db_profiles';
const STORAGE_KEY_TASKS = 'smarttask_db_tasks';
const STORAGE_KEY_REMINDERS = 'smarttask_db_reminders';
const STORAGE_KEY_NOTIFICATIONS = 'smarttask_db_notifications';

// 5 Pre-configured mock profiles for instant multi-user testing
export const INITIAL_DEMO_USERS: Array<{ email: string; name: string; avatar: string }> = [
  { email: 'alex@smarttask.com', name: 'Alex Rivera', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80' },
  { email: 'ayesha@smarttask.com', name: 'Ayesha Rahman', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80' },
  { email: 'tanvir@smarttask.com', name: 'Tanvir Ahmed', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80' },
  { email: 'sarah@smarttask.com', name: 'Sarah Connor', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=80' },
  { email: 'david@smarttask.com', name: 'David Kim', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80' },
];

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

// Get saved or environment credentials
export function getSupabaseCredentials(): SupabaseConfig {
  const envUrl = import.meta.env.VITE_SUPABASE_URL || '';
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

  try {
    const saved = localStorage.getItem(STORAGE_KEY_CONFIG);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.url && parsed.anonKey) {
        return parsed;
      }
    }
  } catch (e) {
    // ignore
  }

  return { url: envUrl, anonKey: envKey };
}

export function saveSupabaseCredentials(url: string, anonKey: string): void {
  localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify({ url: url.trim(), anonKey: anonKey.trim() }));
  window.location.reload();
}

export function clearSupabaseCredentials(): void {
  localStorage.removeItem(STORAGE_KEY_CONFIG);
  window.location.reload();
}

let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  const creds = getSupabaseCredentials();
  if (creds.url && creds.anonKey && creds.url.startsWith('http')) {
    if (!supabaseInstance) {
      try {
        supabaseInstance = createClient(creds.url, creds.anonKey, {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
          },
        });
      } catch (e) {
        console.error('Failed to initialize Supabase client:', e);
        supabaseInstance = null;
      }
    }
    return supabaseInstance;
  }
  return null;
}

export const isLiveSupabaseConnected = (): boolean => {
  const creds = getSupabaseCredentials();
  return Boolean(creds.url && creds.anonKey && creds.url.startsWith('http'));
};

// ==============================================================================
// LOCAL STORAGE DATABASE LAYER (Fully offline, multi-user, RLS emulation)
// ==============================================================================
class LocalDatabase {
  constructor() {
    this.seedDefaultsIfNeeded();
  }

  private seedDefaultsIfNeeded() {
    const existing = this.getProfiles();
    if (existing.length > 0) {
      // Clean up legacy Rakib demo user profile if present
      const cleaned = existing.map((p) => {
        if (p.email === 'rakib@smarttask.com' || p.full_name === 'Rakib Hasan') {
          return {
            ...p,
            full_name: 'Alex Rivera',
            email: 'alex@smarttask.com',
            avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
          };
        }
        return p;
      });
      localStorage.setItem(STORAGE_KEY_PROFILES, JSON.stringify(cleaned));
    } else {
      const initialProfiles: Profile[] = INITIAL_DEMO_USERS.map((u, i) => ({
        id: `user-${i + 1}`,
        full_name: u.name,
        email: u.email,
        avatar_url: u.avatar,
        timezone: 'Asia/Dhaka',
        time_format: '12h',
        default_reminder_offsets: [1440, 360, 120, 30],
        created_at: new Date(Date.now() - (i + 1) * 86400000 * 3).toISOString(),
        updated_at: new Date().toISOString(),
      }));
      localStorage.setItem(STORAGE_KEY_PROFILES, JSON.stringify(initialProfiles));

      // Seed starter tasks for user-1 with Bangladesh deadlines
      const now = Date.now();
      const sampleTasks: Task[] = [
        {
          id: 'task-101',
          user_id: 'user-1',
          title: 'Prepare SmartTask Architecture Presentation',
          description: 'Finalize slides covering Supabase schema, RLS policies, and BST reminders.',
          start_at: new Date(now - 3600000 * 4).toISOString(),
          deadline_at: new Date(now + 3600000 * 5).toISOString(), // 5 hours in future
          priority: 'high',
          is_completed: false,
          auto_delete_after_deadline: false,
          created_at: new Date(now - 3600000 * 6).toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: 'task-102',
          user_id: 'user-1',
          title: 'Deploy Bangladesh Timezone Notifications',
          description: 'Verify 12-hour BST formatting and Web Push service worker hooks.',
          start_at: new Date(now - 3600000 * 20).toISOString(),
          deadline_at: new Date(now + 3600000 * 24).toISOString(), // tomorrow
          priority: 'medium',
          is_completed: false,
          auto_delete_after_deadline: false,
          created_at: new Date(now - 3600000 * 22).toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: 'task-103',
          user_id: 'user-1',
          title: 'Submit Daily Sprint Standup Report',
          description: 'Share progress on task CRUD, automated scheduling, and notification center.',
          start_at: new Date(now - 3600000 * 10).toISOString(),
          deadline_at: new Date(now - 3600000 * 2).toISOString(), // Overdue 2 hours ago!
          priority: 'high',
          is_completed: false,
          auto_delete_after_deadline: false,
          created_at: new Date(now - 3600000 * 12).toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: 'task-104',
          user_id: 'user-1',
          title: 'Review System Security & Password Policy',
          description: 'Confirm minimum 6 character passwords and numeric-only support.',
          start_at: new Date(now - 86400000 * 2).toISOString(),
          deadline_at: new Date(now - 86400000 * 1).toISOString(),
          priority: 'low',
          is_completed: true,
          completed_at: new Date(now - 86400000 * 1).toISOString(),
          auto_delete_after_deadline: false,
          created_at: new Date(now - 86400000 * 2).toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];
      localStorage.setItem(STORAGE_KEY_TASKS, JSON.stringify(sampleTasks));

      // Starter reminders
      const sampleReminders: Reminder[] = [
        {
          id: 'rem-1',
          task_id: 'task-101',
          user_id: 'user-1',
          reminder_offset_minutes: 120, // 2 hours before
          scheduled_at: new Date(now + 3600000 * 3).toISOString(),
          status: 'pending',
          created_at: new Date().toISOString(),
        },
        {
          id: 'rem-2',
          task_id: 'task-101',
          user_id: 'user-1',
          reminder_offset_minutes: 30, // 30 min before
          scheduled_at: new Date(now + 3600000 * 4.5).toISOString(),
          status: 'pending',
          created_at: new Date().toISOString(),
        },
      ];
      localStorage.setItem(STORAGE_KEY_REMINDERS, JSON.stringify(sampleReminders));

      // Starter notifications
      const sampleNotifications: NotificationItem[] = [
        {
          id: 'notif-1',
          user_id: 'user-1',
          task_id: 'task-103',
          task_title: 'Submit Daily Sprint Standup Report',
          message: 'Your task "Submit Daily Sprint Standup Report" is now OVERDUE! Please complete or update it.',
          type: 'overdue',
          is_read: false,
          created_at: new Date(now - 3600000 * 1.5).toISOString(),
        },
        {
          id: 'notif-2',
          user_id: 'user-1',
          task_id: 'task-104',
          task_title: 'Review System Security & Password Policy',
          message: 'Task completed successfully! Great job.',
          type: 'completed',
          is_read: true,
          created_at: new Date(now - 86400000 * 1).toISOString(),
        },
      ];
      localStorage.setItem(STORAGE_KEY_NOTIFICATIONS, JSON.stringify(sampleNotifications));
    }
  }

  // --- PROFILES ---
  getProfiles(): Profile[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY_PROFILES);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  getProfile(userId: string): Profile | null {
    return this.getProfiles().find((p) => p.id === userId) || null;
  }

  saveProfile(profile: Profile): void {
    const profiles = this.getProfiles();
    const idx = profiles.findIndex((p) => p.id === profile.id);
    if (idx >= 0) {
      profiles[idx] = { ...profile, updated_at: new Date().toISOString() };
    } else {
      profiles.push(profile);
    }
    localStorage.setItem(STORAGE_KEY_PROFILES, JSON.stringify(profiles));
  }

  // --- TASKS ---
  seedStarterTasksForUser(userId: string, userName: string): void {
    const existing = this.getTasks(userId);
    if (existing.length > 0) return;

    const now = Date.now();
    const starterTasks: Task[] = [
      {
        id: `task-${Date.now()}-1`,
        user_id: userId,
        title: `Welcome to SmartTask, ${userName.split(' ')[0] || 'User'}!`,
        description: 'Explore your personalized dashboard, configure reminder intervals, and manage your deadlines.',
        start_at: new Date(now).toISOString(),
        deadline_at: new Date(now + 3600000 * 24).toISOString(),
        priority: 'high',
        is_completed: false,
        auto_delete_after_deadline: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: `task-${Date.now()}-2`,
        user_id: userId,
        title: 'Configure Bangladesh Timezone Reminders',
        description: 'Create your first custom task with Asia/Dhaka (UTC+6) deadlines and multi-tier alert intervals.',
        start_at: new Date(now).toISOString(),
        deadline_at: new Date(now + 3600000 * 48).toISOString(),
        priority: 'medium',
        is_completed: false,
        auto_delete_after_deadline: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    for (const t of starterTasks) {
      this.saveTask(t);
    }
  }

  getTasks(userId: string): Task[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY_TASKS);
      const all: Task[] = data ? JSON.parse(data) : [];
      return all.filter((t) => t.user_id === userId);
    } catch {
      return [];
    }
  }

  saveTask(task: Task): void {
    try {
      const data = localStorage.getItem(STORAGE_KEY_TASKS);
      let all: Task[] = data ? JSON.parse(data) : [];
      const idx = all.findIndex((t) => t.id === task.id);
      if (idx >= 0) {
        all[idx] = { ...task, updated_at: new Date().toISOString() };
      } else {
        all.unshift(task);
      }
      localStorage.setItem(STORAGE_KEY_TASKS, JSON.stringify(all));
    } catch (e) {
      console.error('Failed to save task to local storage:', e);
    }
  }

  deleteTask(taskId: string, userId: string): void {
    try {
      const data = localStorage.getItem(STORAGE_KEY_TASKS);
      let all: Task[] = data ? JSON.parse(data) : [];
      all = all.filter((t) => !(t.id === taskId && t.user_id === userId));
      localStorage.setItem(STORAGE_KEY_TASKS, JSON.stringify(all));

      // Also remove associated reminders
      this.deleteRemindersForTask(taskId);
      // Remove or update associated notifications
      this.deleteNotificationsForTask(taskId);
    } catch (e) {
      console.error('Failed to delete task:', e);
    }
  }

  // --- REMINDERS ---
  getReminders(userId: string): Reminder[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY_REMINDERS);
      const all: Reminder[] = data ? JSON.parse(data) : [];
      return all.filter((r) => r.user_id === userId);
    } catch {
      return [];
    }
  }

  saveReminders(reminders: Reminder[]): void {
    try {
      const data = localStorage.getItem(STORAGE_KEY_REMINDERS);
      let all: Reminder[] = data ? JSON.parse(data) : [];
      for (const rem of reminders) {
        const idx = all.findIndex((r) => r.id === rem.id);
        if (idx >= 0) {
          all[idx] = rem;
        } else {
          all.push(rem);
        }
      }
      localStorage.setItem(STORAGE_KEY_REMINDERS, JSON.stringify(all));
    } catch (e) {
      console.error('Failed to save reminders:', e);
    }
  }

  deleteRemindersForTask(taskId: string): void {
    try {
      const data = localStorage.getItem(STORAGE_KEY_REMINDERS);
      let all: Reminder[] = data ? JSON.parse(data) : [];
      all = all.filter((r) => r.task_id !== taskId);
      localStorage.setItem(STORAGE_KEY_REMINDERS, JSON.stringify(all));
    } catch (e) {
      console.error('Failed to delete reminders for task:', e);
    }
  }

  // --- NOTIFICATIONS ---
  getNotifications(userId: string): NotificationItem[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY_NOTIFICATIONS);
      const all: NotificationItem[] = data ? JSON.parse(data) : [];
      return all
        .filter((n) => n.user_id === userId)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } catch {
      return [];
    }
  }

  saveNotification(notification: NotificationItem): void {
    try {
      const data = localStorage.getItem(STORAGE_KEY_NOTIFICATIONS);
      const all: NotificationItem[] = data ? JSON.parse(data) : [];
      all.unshift(notification);
      localStorage.setItem(STORAGE_KEY_NOTIFICATIONS, JSON.stringify(all));
    } catch (e) {
      console.error('Failed to save notification:', e);
    }
  }

  markNotificationAsRead(notifId: string, userId: string): void {
    try {
      const data = localStorage.getItem(STORAGE_KEY_NOTIFICATIONS);
      let all: NotificationItem[] = data ? JSON.parse(data) : [];
      const item = all.find((n) => n.id === notifId && n.user_id === userId);
      if (item) {
        item.is_read = true;
        localStorage.setItem(STORAGE_KEY_NOTIFICATIONS, JSON.stringify(all));
      }
    } catch (e) {
      console.error('Failed to mark notification as read:', e);
    }
  }

  markAllNotificationsAsRead(userId: string): void {
    try {
      const data = localStorage.getItem(STORAGE_KEY_NOTIFICATIONS);
      let all: NotificationItem[] = data ? JSON.parse(data) : [];
      for (const n of all) {
        if (n.user_id === userId) {
          n.is_read = true;
        }
      }
      localStorage.setItem(STORAGE_KEY_NOTIFICATIONS, JSON.stringify(all));
    } catch (e) {
      console.error('Failed to mark all notifications as read:', e);
    }
  }

  deleteNotification(notifId: string, userId: string): void {
    try {
      const data = localStorage.getItem(STORAGE_KEY_NOTIFICATIONS);
      let all: NotificationItem[] = data ? JSON.parse(data) : [];
      all = all.filter((n) => !(n.id === notifId && n.user_id === userId));
      localStorage.setItem(STORAGE_KEY_NOTIFICATIONS, JSON.stringify(all));
    } catch (e) {
      console.error('Failed to delete notification:', e);
    }
  }

  clearNotifications(userId: string): void {
    try {
      const data = localStorage.getItem(STORAGE_KEY_NOTIFICATIONS);
      let all: NotificationItem[] = data ? JSON.parse(data) : [];
      all = all.filter((n) => n.user_id !== userId);
      localStorage.setItem(STORAGE_KEY_NOTIFICATIONS, JSON.stringify(all));
    } catch (e) {
      console.error('Failed to clear notifications:', e);
    }
  }

  deleteNotificationsForTask(taskId: string): void {
    try {
      const data = localStorage.getItem(STORAGE_KEY_NOTIFICATIONS);
      let all: NotificationItem[] = data ? JSON.parse(data) : [];
      all = all.filter((n) => n.task_id !== taskId);
      localStorage.setItem(STORAGE_KEY_NOTIFICATIONS, JSON.stringify(all));
    } catch (e) {
      console.error('Failed to delete notifications for task:', e);
    }
  }

  // --- AUTH SESSION ---
  getCurrentSession(): { user: Profile } | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_AUTH);
      if (raw) {
        const parsed = JSON.parse(raw);
        // Clear old legacy auto-assigned Rakib session so app does not run on behalf of Rakib
        if (parsed?.user?.email === 'rakib@smarttask.com' || parsed?.user?.full_name === 'Rakib Hasan') {
          localStorage.removeItem(STORAGE_KEY_AUTH);
          return null;
        }
        if (parsed?.user?.id) {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    // Return null so user starts at the login/register screen as themselves
    return null;
  }

  setCurrentSession(user: Profile | null): void {
    if (user) {
      localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify({ user }));
    } else {
      localStorage.removeItem(STORAGE_KEY_AUTH);
    }
  }
}

export const localDb = new LocalDatabase();
