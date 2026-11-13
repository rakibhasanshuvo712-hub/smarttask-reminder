import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { Task, Reminder, DashboardStats, TaskFilterOptions, Priority } from '@/types';
import { useAuth } from './AuthContext';
import { getSupabaseClient, localDb } from '@/lib/supabase';
import { notificationService } from '@/lib/notifications';
import { isOverdue, isUpcoming, isDueTodayDhaka } from '@/lib/timezone';
import { sound } from '@/lib/audio';

interface CreateTaskInput {
  title: string;
  description?: string;
  start_at?: string | null;
  deadline_at: string;
  priority: Priority;
  reminder_offsets: number[];
  auto_delete_after_deadline: boolean;
}

interface TaskContextType {
  tasks: Task[];
  loading: boolean;
  filterOptions: TaskFilterOptions;
  setFilterOptions: React.Dispatch<React.SetStateAction<TaskFilterOptions>>;
  filteredTasks: Task[];
  stats: DashboardStats;
  createTask: (input: CreateTaskInput) => Promise<{ success: boolean; error?: string }>;
  updateTask: (taskId: string, input: Partial<CreateTaskInput> & { is_completed?: boolean }) => Promise<{ success: boolean; error?: string }>;
  deleteTask: (taskId: string) => Promise<{ success: boolean; error?: string }>;
  toggleCompleteTask: (taskId: string) => Promise<void>;
  getTaskReminders: (taskId: string) => Promise<Reminder[]>;
  refreshTasks: () => Promise<void>;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const TaskProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filterOptions, setFilterOptions] = useState<TaskFilterOptions>({
    status: 'all',
    priority: 'all',
    searchQuery: '',
    sortBy: 'deadline',
    sortOrder: 'asc',
  });

  const fetchTasks = useCallback(async () => {
    if (!user) {
      setTasks([]);
      setLoading(false);
      return;
    }

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('tasks')
          .select('*')
          .eq('user_id', user.id)
          .order('deadline_at', { ascending: true });

        if (!error && data) {
          setTasks(data);
        }
      } catch (err) {
        console.warn('Failed to fetch tasks from Supabase:', err);
      }
    } else {
      setTasks(localDb.getTasks(user.id));
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Compute live statistics
  const stats = useMemo<DashboardStats>(() => {
    let completed = 0;
    let pending = 0;
    let overdue = 0;
    let upcoming = 0;

    for (const t of tasks) {
      if (t.is_completed) {
        completed++;
      } else {
        pending++;
        if (isOverdue(t.deadline_at, false)) {
          overdue++;
        } else if (isUpcoming(t.deadline_at, false)) {
          upcoming++;
        }
      }
    }

    const total = tasks.length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { total, completed, pending, overdue, upcoming, completionRate };
  }, [tasks]);

  // Create Task
  const createTask = async (input: CreateTaskInput): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'User not logged in' };
    if (!input.title || input.title.trim().length === 0) {
      return { success: false, error: 'Task title is required' };
    }
    if (!input.deadline_at) {
      return { success: false, error: 'Deadline is required' };
    }

    const newTask: Task = {
      id: 'task-' + Math.random().toString(36).substring(2, 9),
      user_id: user.id,
      title: input.title.trim(),
      description: input.description?.trim() || '',
      start_at: input.start_at || null,
      deadline_at: input.deadline_at,
      priority: input.priority || 'medium',
      is_completed: false,
      auto_delete_after_deadline: input.auto_delete_after_deadline || false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Calculate reminders based on chosen offsets
    const reminders = notificationService.calculateReminders(
      input.deadline_at,
      input.reminder_offsets && input.reminder_offsets.length > 0
        ? input.reminder_offsets
        : user.default_reminder_offsets || [1440, 360, 120, 30],
      newTask.id,
      user.id
    );

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data, error } = await supabase.from('tasks').insert(newTask).select().single();
        if (error) return { success: false, error: error.message };

        if (reminders.length > 0) {
          await supabase.from('reminders').insert(reminders);
        }
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    } else {
      localDb.saveTask(newTask);
      if (reminders.length > 0) {
        localDb.saveReminders(reminders);
      }
    }

    setTasks((prev) => [newTask, ...prev]);
    return { success: true };
  };

  // Update Task
  const updateTask = async (
    taskId: string,
    input: Partial<CreateTaskInput> & { is_completed?: boolean }
  ): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'User not logged in' };

    const existing = tasks.find((t) => t.id === taskId);
    if (!existing) return { success: false, error: 'Task not found' };

    const updatedTask: Task = {
      ...existing,
      title: input.title !== undefined ? input.title.trim() : existing.title,
      description: input.description !== undefined ? input.description.trim() : existing.description,
      start_at: input.start_at !== undefined ? input.start_at : existing.start_at,
      deadline_at: input.deadline_at || existing.deadline_at,
      priority: input.priority || existing.priority,
      is_completed: input.is_completed !== undefined ? input.is_completed : existing.is_completed,
      completed_at: input.is_completed ? new Date().toISOString() : null,
      auto_delete_after_deadline:
        input.auto_delete_after_deadline !== undefined
          ? input.auto_delete_after_deadline
          : existing.auto_delete_after_deadline,
      updated_at: new Date().toISOString(),
    };

    const deadlineChanged = input.deadline_at && input.deadline_at !== existing.deadline_at;
    const offsetsChanged = Boolean(input.reminder_offsets);

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { error } = await supabase.from('tasks').update(updatedTask).eq('id', taskId);
        if (error) return { success: false, error: error.message };

        if (deadlineChanged || offsetsChanged) {
          // Cancel old reminders and recalculate
          await supabase.from('reminders').delete().eq('task_id', taskId);
          const offsets = input.reminder_offsets || user.default_reminder_offsets || [1440, 360, 120, 30];
          const newReminders = notificationService.calculateReminders(
            updatedTask.deadline_at,
            offsets,
            taskId,
            user.id
          );
          if (newReminders.length > 0) {
            await supabase.from('reminders').insert(newReminders);
          }
        }
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    } else {
      localDb.saveTask(updatedTask);
      if (deadlineChanged || offsetsChanged) {
        localDb.deleteRemindersForTask(taskId);
        const offsets = input.reminder_offsets || user.default_reminder_offsets || [1440, 360, 120, 30];
        const newReminders = notificationService.calculateReminders(
          updatedTask.deadline_at,
          offsets,
          taskId,
          user.id
        );
        localDb.saveReminders(newReminders);
      }
    }

    setTasks((prev) => prev.map((t) => (t.id === taskId ? updatedTask : t)));
    return { success: true };
  };

  // Delete Task
  const deleteTask = async (taskId: string): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'User not logged in' };

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { error } = await supabase.from('tasks').delete().eq('id', taskId);
        if (error) return { success: false, error: error.message };
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    } else {
      localDb.deleteTask(taskId, user.id);
    }

    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    return { success: true };
  };

  // Toggle Complete Task
  const toggleCompleteTask = async (taskId: string) => {
    const target = tasks.find((t) => t.id === taskId);
    if (!target || !user) return;

    const newCompleted = !target.is_completed;
    const nowIso = new Date().toISOString();

    const updatedTask: Task = {
      ...target,
      is_completed: newCompleted,
      completed_at: newCompleted ? nowIso : null,
      updated_at: nowIso,
    };

    if (newCompleted) {
      // Confetti celebration!
      try {
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.7 },
        });
      } catch {
        // ignore
      }
      sound.playReminderChime();

      // Cancel future scheduled reminders
      if (!getSupabaseClient()) {
        const userReminders = localDb.getReminders(user.id);
        for (const rem of userReminders) {
          if (rem.task_id === taskId && rem.status === 'pending') {
            rem.status = 'cancelled';
          }
        }
        localDb.saveReminders(userReminders);

        // Add completed notification
        localDb.saveNotification({
          id: 'notif-' + Math.random().toString(36).substring(2, 9),
          user_id: user.id,
          task_id: taskId,
          task_title: target.title,
          message: 'Task completed successfully! Great job.',
          type: 'completed',
          is_read: false,
          created_at: nowIso,
        });
      }
    }

    const supabase = getSupabaseClient();
    if (supabase) {
      await supabase.from('tasks').update({
        is_completed: newCompleted,
        completed_at: newCompleted ? nowIso : null,
        updated_at: nowIso,
      }).eq('id', taskId);

      if (newCompleted) {
        // Cancel future reminders
        await supabase
          .from('reminders')
          .update({ status: 'cancelled' })
          .eq('task_id', taskId)
          .eq('status', 'pending');

        await supabase.from('notifications').insert({
          user_id: user.id,
          task_id: taskId,
          task_title: target.title,
          message: 'Task completed successfully! Great job.',
          type: 'completed',
          is_read: false,
          created_at: nowIso,
        });
      }
    } else {
      localDb.saveTask(updatedTask);
    }

    setTasks((prev) => prev.map((t) => (t.id === taskId ? updatedTask : t)));
  };

  const getTaskReminders = async (taskId: string): Promise<Reminder[]> => {
    if (!user) return [];
    const supabase = getSupabaseClient();
    if (supabase) {
      const { data } = await supabase.from('reminders').select('*').eq('task_id', taskId);
      return data || [];
    }
    return localDb.getReminders(user.id).filter((r) => r.task_id === taskId);
  };

  // Filtered & Sorted Tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      // 1. Search Query
      if (filterOptions.searchQuery) {
        const query = filterOptions.searchQuery.toLowerCase();
        const matchesTitle = task.title.toLowerCase().includes(query);
        const matchesDesc = task.description?.toLowerCase().includes(query) || false;
        if (!matchesTitle && !matchesDesc) return false;
      }

      // 2. Priority Filter
      if (filterOptions.priority !== 'all' && task.priority !== filterOptions.priority) {
        return false;
      }

      // 3. Status Filter
      if (filterOptions.status === 'completed') return task.is_completed;
      if (filterOptions.status === 'pending') return !task.is_completed;
      if (filterOptions.status === 'overdue') return isOverdue(task.deadline_at, task.is_completed);
      if (filterOptions.status === 'today') return isDueTodayDhaka(task.deadline_at);
      if (filterOptions.status === 'upcoming') return isUpcoming(task.deadline_at, task.is_completed);

      return true;
    }).sort((a, b) => {
      let order = filterOptions.sortOrder === 'asc' ? 1 : -1;

      if (filterOptions.sortBy === 'deadline') {
        return (new Date(a.deadline_at).getTime() - new Date(b.deadline_at).getTime()) * order;
      }
      if (filterOptions.sortBy === 'created_at') {
        return (new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) * order;
      }
      if (filterOptions.sortBy === 'title') {
        return a.title.localeCompare(b.title) * order;
      }
      if (filterOptions.sortBy === 'priority') {
        const pMap: Record<Priority, number> = { high: 3, medium: 2, low: 1 };
        return (pMap[a.priority] - pMap[b.priority]) * order;
      }
      return 0;
    });
  }, [tasks, filterOptions]);

  return (
    <TaskContext.Provider
      value={{
        tasks,
        loading,
        filterOptions,
        setFilterOptions,
        filteredTasks,
        stats,
        createTask,
        updateTask,
        deleteTask,
        toggleCompleteTask,
        getTaskReminders,
        refreshTasks: fetchTasks,
      }}
    >
      {children}
    </TaskContext.Provider>
  );
};

export const useTasks = () => {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error('useTasks must be used within TaskProvider');
  }
  return context;
};
