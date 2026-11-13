import React from 'react';
import {
  CheckSquare,
  Clock,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  TrendingUp,
  Plus,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTasks } from '@/context/TaskContext';
import { StatCard } from '@/components/dashboard/StatCard';
import { CompletionProgress } from '@/components/dashboard/CompletionProgress';
import { TaskCard } from '@/components/tasks/TaskCard';
import { Task } from '@/types';
import {
  isOverdue,
  isUpcoming,
  isDueTodayDhaka,
  formatDhakaDateTime,
} from '@/lib/timezone';

interface DashboardViewProps {
  onOpenTaskModal: () => void;
  onViewTask: (task: Task) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (task: Task) => void;
  onNavigateToTasks: (filterStatus?: any) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onOpenTaskModal,
  onViewTask,
  onEditTask,
  onDeleteTask,
  onNavigateToTasks,
}) => {
  const { user } = useAuth();
  const { tasks, stats, toggleCompleteTask } = useTasks();

  // Section 4 required buckets
  const todayTasks = tasks.filter((t) => !t.is_completed && isDueTodayDhaka(t.deadline_at));
  const upcomingTasks = tasks.filter((t) => !t.is_completed && isUpcoming(t.deadline_at, false) && !isDueTodayDhaka(t.deadline_at));
  const overdueTasks = tasks.filter((t) => !t.is_completed && isOverdue(t.deadline_at, false));
  const recentlyCompleted = tasks.filter((t) => t.is_completed).slice(0, 4);

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-200">
      {/* Welcome Banner */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-6 sm:p-8 text-white shadow-lg">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Bangladesh Standard Time (BST • UTC+6)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Hello, {user?.full_name?.split(' ')[0] || 'there'}! 👋
            </h1>
            <p className="text-sm sm:text-base text-blue-100 mt-2 leading-relaxed">
              You have <span className="font-bold underline">{stats.pending} pending tasks</span> and{' '}
              {stats.overdue > 0 ? (
                <span className="font-bold text-amber-200">{stats.overdue} overdue deadlines</span>
              ) : (
                <span>0 overdue deadlines</span>
              )}
              . Automated notifications will remind you right on time.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={onOpenTaskModal}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-white text-blue-700 font-bold text-sm shadow-md hover:bg-blue-50 active:scale-98 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Task</span>
            </button>
          </div>
        </div>
      </div>

      {/* 5 Key Statistics Cards (Total, Completed, Pending, Overdue, Upcoming) */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4">
        <StatCard
          title="Total Tasks"
          value={stats.total}
          subtitle="All tasks logged"
          icon={CheckSquare}
          color="purple"
          onClick={() => onNavigateToTasks('all')}
        />
        <StatCard
          title="Completed"
          value={stats.completed}
          subtitle="Finished on time"
          icon={CheckCircle2}
          color="emerald"
          onClick={() => onNavigateToTasks('completed')}
        />
        <StatCard
          title="Pending"
          value={stats.pending}
          subtitle="Awaiting action"
          icon={Clock}
          color="blue"
          onClick={() => onNavigateToTasks('pending')}
        />
        <StatCard
          title="Overdue"
          value={stats.overdue}
          subtitle="Passed deadline"
          icon={AlertTriangle}
          color="red"
          onClick={() => onNavigateToTasks('overdue')}
        />
        <StatCard
          title="Upcoming"
          value={stats.upcoming}
          subtitle="Next deadlines"
          icon={Calendar}
          color="amber"
          onClick={() => onNavigateToTasks('upcoming')}
        />
      </div>

      {/* Task Completion Progress Bar */}
      <CompletionProgress stats={stats} />

      {/* SECTION 1: Overdue Tasks (High Priority Alert if any) */}
      {overdueTasks.length > 0 && (
        <div className="p-5 sm:p-6 rounded-2xl border border-red-200 dark:border-red-900/50 bg-red-50/40 dark:bg-red-950/20 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-red-100 text-red-600 dark:bg-red-900/60 dark:text-red-400">
                <AlertTriangle className="w-4 h-4" />
              </span>
              <h2 className="text-base font-bold text-red-900 dark:text-red-200">
                Overdue Tasks ({overdueTasks.length})
              </h2>
            </div>
            <button
              onClick={() => onNavigateToTasks('overdue')}
              className="text-xs font-bold text-red-600 dark:text-red-400 hover:underline flex items-center gap-1"
            >
              View All <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {overdueTasks.slice(0, 3).map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onToggleComplete={toggleCompleteTask}
                onView={onViewTask}
                onEdit={onEditTask}
                onDelete={onDeleteTask}
              />
            ))}
          </div>
        </div>
      )}

      {/* SECTION 2: Today's Tasks */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/60 dark:text-blue-400">
              <Clock className="w-4 h-4" />
            </span>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Today's Tasks (Bangladesh Time)
            </h2>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
              {todayTasks.length}
            </span>
          </div>

          <button
            onClick={() => onNavigateToTasks('today')}
            className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
          >
            See All <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {todayTasks.length === 0 ? (
          <div className="p-8 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 text-center">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              No pending tasks due today in Bangladesh time.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {todayTasks.slice(0, 3).map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onToggleComplete={toggleCompleteTask}
                onView={onViewTask}
                onEdit={onEditTask}
                onDelete={onDeleteTask}
              />
            ))}
          </div>
        )}
      </div>

      {/* SECTION 3: Upcoming Deadlines */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-amber-100 text-amber-600 dark:bg-amber-900/60 dark:text-amber-400">
              <Calendar className="w-4 h-4" />
            </span>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Upcoming Deadlines
            </h2>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300">
              {upcomingTasks.length}
            </span>
          </div>

          <button
            onClick={() => onNavigateToTasks('upcoming')}
            className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
          >
            See All <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {upcomingTasks.length === 0 ? (
          <div className="p-8 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 text-center">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              No upcoming deadlines scheduled in the next few days.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {upcomingTasks.slice(0, 3).map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onToggleComplete={toggleCompleteTask}
                onView={onViewTask}
                onEdit={onEditTask}
                onDelete={onDeleteTask}
              />
            ))}
          </div>
        )}
      </div>

      {/* SECTION 4: Recently Completed Tasks */}
      {recentlyCompleted.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-900/60 dark:text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
              </span>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Recently Completed
              </h2>
            </div>
            <button
              onClick={() => onNavigateToTasks('completed')}
              className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
            >
              See All <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {recentlyCompleted.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onToggleComplete={toggleCompleteTask}
                onView={onViewTask}
                onEdit={onEditTask}
                onDelete={onDeleteTask}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
