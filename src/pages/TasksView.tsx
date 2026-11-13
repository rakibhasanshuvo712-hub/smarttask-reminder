import React, { useState } from 'react';
import {
  Search,
  Filter,
  ArrowUpDown,
  Plus,
  LayoutGrid,
  List,
  Calendar,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';
import { useTasks } from '@/context/TaskContext';
import { TaskCard } from '@/components/tasks/TaskCard';
import { Task, Priority } from '@/types';
import { formatDhakaDateTime } from '@/lib/timezone';
import { useAuth } from '@/context/AuthContext';

interface TasksViewProps {
  onOpenTaskModal: () => void;
  onViewTask: (task: Task) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (task: Task) => void;
}

export const TasksView: React.FC<TasksViewProps> = ({
  onOpenTaskModal,
  onViewTask,
  onEditTask,
  onDeleteTask,
}) => {
  const { user } = useAuth();
  const {
    filteredTasks,
    filterOptions,
    setFilterOptions,
    toggleCompleteTask,
    stats,
  } = useTasks();

  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  const filterTabs = [
    { id: 'all', label: 'All Tasks', count: stats.total },
    { id: 'today', label: 'Due Today', count: null },
    { id: 'upcoming', label: 'Upcoming', count: stats.upcoming },
    { id: 'pending', label: 'Pending', count: stats.pending },
    { id: 'overdue', label: 'Overdue', count: stats.overdue },
    { id: 'completed', label: 'Completed', count: stats.completed },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
            Task Management System
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Displaying tasks with real-time deadline monitoring in Bangladesh Time (BST).
          </p>
        </div>

        <button
          onClick={onOpenTaskModal}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs sm:text-sm shadow-sm active:scale-98 transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Task</span>
        </button>
      </div>

      {/* Filter Tabs (Section 10) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none border-b border-slate-200 dark:border-slate-800">
        {filterTabs.map((tab) => {
          const isActive = filterOptions.status === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() =>
                setFilterOptions((prev) => ({ ...prev, status: tab.id as any }))
              }
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <span>{tab.label}</span>
              {tab.count !== null && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Search & Sort Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
        {/* Search Bar */}
        <div className="sm:col-span-5 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search tasks by title or notes..."
            value={filterOptions.searchQuery}
            onChange={(e) =>
              setFilterOptions((prev) => ({ ...prev, searchQuery: e.target.value }))
            }
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-400"
          />
        </div>

        {/* Priority Filter */}
        <div className="sm:col-span-3">
          <select
            value={filterOptions.priority}
            onChange={(e) =>
              setFilterOptions((prev) => ({ ...prev, priority: e.target.value as any }))
            }
            className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Priority: All</option>
            <option value="high">Priority: High</option>
            <option value="medium">Priority: Medium</option>
            <option value="low">Priority: Low</option>
          </select>
        </div>

        {/* Sort By */}
        <div className="sm:col-span-3 flex items-center gap-1.5">
          <select
            value={filterOptions.sortBy}
            onChange={(e) =>
              setFilterOptions((prev) => ({ ...prev, sortBy: e.target.value as any }))
            }
            className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="deadline">Sort: Deadline</option>
            <option value="created_at">Sort: Creation Date</option>
            <option value="priority">Sort: Priority</option>
            <option value="title">Sort: Title (A-Z)</option>
          </select>

          <button
            onClick={() =>
              setFilterOptions((prev) => ({
                ...prev,
                sortOrder: prev.sortOrder === 'asc' ? 'desc' : 'asc',
              }))
            }
            className="p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 shrink-0"
            title={`Order: ${filterOptions.sortOrder.toUpperCase()}`}
          >
            <ArrowUpDown className="w-4 h-4" />
          </button>
        </div>

        {/* View Mode Toggle */}
        <div className="sm:col-span-1 flex justify-end">
          <div className="flex border border-slate-300 dark:border-slate-700 rounded-xl overflow-hidden bg-white dark:bg-slate-800 p-0.5">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg ${
                viewMode === 'grid'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg ${
                viewMode === 'table'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
              title="Table View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Task Content */}
      {filteredTasks.length === 0 ? (
        <div className="py-16 px-4 rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 text-center">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto mb-3">
            <Calendar className="w-7 h-7" />
          </div>
          <h3 className="font-bold text-base text-slate-800 dark:text-slate-200">
            No tasks found
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            Try adjusting your search query, priority filters, or click below to schedule a new task.
          </p>
          <button
            onClick={onOpenTaskModal}
            className="mt-4 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all"
          >
            + Create New Task
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTasks.map((task) => (
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
      ) : (
        /* Table View */
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900 shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4 w-10">Done</th>
                  <th className="py-3 px-4">Task Title</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Deadline (BST)</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredTasks.map((task) => {
                  return (
                    <tr
                      key={task.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <button
                          onClick={() => toggleCompleteTask(task.id)}
                          className="text-slate-300 hover:text-emerald-500"
                        >
                          {task.is_completed ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                          ) : (
                            <div className="w-5 h-5 rounded-full border-2 border-slate-300 dark:border-slate-600" />
                          )}
                        </button>
                      </td>
                      <td className="py-3 px-4">
                        <div
                          className="font-bold text-slate-900 dark:text-white cursor-pointer hover:underline"
                          onClick={() => onViewTask(task)}
                        >
                          {task.title}
                        </div>
                        {task.description && (
                          <div className="text-[11px] text-slate-400 truncate max-w-xs mt-0.5">
                            {task.description}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className="capitalize font-semibold text-slate-700 dark:text-slate-300">
                          {task.priority}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-300">
                        {formatDhakaDateTime(task.deadline_at, 'short', user?.time_format || '12h')} BST
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                            task.is_completed
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                              : 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400'
                          }`}
                        >
                          {task.is_completed ? 'Completed' : 'Pending'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => onEditTask(task)}
                            className="px-2 py-1 rounded-md text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => onDeleteTask(task)}
                            className="px-2 py-1 rounded-md text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
