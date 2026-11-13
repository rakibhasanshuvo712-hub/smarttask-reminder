export type Priority = 'low' | 'medium' | 'high';

export type TaskStatus = 'completed' | 'pending' | 'overdue' | 'upcoming';

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  avatar_url?: string;
  timezone: string; // 'Asia/Dhaka'
  time_format: '12h' | '24h';
  default_reminder_offsets: number[]; // in minutes, e.g. [1440, 360, 120, 30]
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  start_at?: string | null; // ISO timestamptz
  deadline_at: string; // ISO timestamptz
  priority: Priority;
  is_completed: boolean;
  completed_at?: string | null;
  auto_delete_after_deadline: boolean;
  created_at: string;
  updated_at: string;
}

export interface Reminder {
  id: string;
  task_id: string;
  user_id: string;
  reminder_offset_minutes: number;
  scheduled_at: string; // ISO timestamptz
  status: 'pending' | 'sent' | 'cancelled';
  sent_at?: string | null;
  created_at: string;
}

export interface NotificationItem {
  id: string;
  user_id: string;
  task_id?: string | null;
  task_title?: string | null;
  message: string;
  type: 'reminder' | 'overdue' | 'completed' | 'system';
  is_read: boolean;
  created_at: string;
}

export interface PushSubscriptionRecord {
  id: string;
  user_id: string;
  subscription: any;
  created_at: string;
}

export interface TaskFilterOptions {
  status: 'all' | 'today' | 'upcoming' | 'completed' | 'pending' | 'overdue';
  priority: 'all' | 'low' | 'medium' | 'high';
  searchQuery: string;
  sortBy: 'deadline' | 'created_at' | 'priority' | 'title';
  sortOrder: 'asc' | 'desc';
}

export interface DashboardStats {
  total: number;
  completed: number;
  pending: number;
  overdue: number;
  upcoming: number;
  completionRate: number;
}

export interface ReminderOption {
  minutes: number;
  label: string;
}

export const STANDARD_REMINDER_OPTIONS: ReminderOption[] = [
  { minutes: 1440, label: '24 hours before' },
  { minutes: 720, label: '12 hours before' },
  { minutes: 360, label: '6 hours before' },
  { minutes: 120, label: '2 hours before' },
  { minutes: 60, label: '1 hour before' },
  { minutes: 30, label: '30 minutes before' },
  { minutes: 15, label: '15 minutes before' },
  { minutes: 10, label: '10 minutes before' },
];
