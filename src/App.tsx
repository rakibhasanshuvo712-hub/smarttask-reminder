import React, { useState } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider, useNotifications } from './context/NotificationContext';
import { TaskProvider, useTasks } from './context/TaskContext';
import { Sidebar, TabType } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { DashboardView } from './pages/DashboardView';
import { TasksView } from './pages/TasksView';
import { SettingsView } from './pages/SettingsView';
import { PrivacyPolicyView } from './pages/PrivacyPolicyView';
import { TaskModal } from './components/tasks/TaskModal';
import { TaskDetailModal } from './components/tasks/TaskDetailModal';
import { DeleteConfirmModal } from './components/tasks/DeleteConfirmModal';
import { SupabaseConfigModal } from './components/settings/SupabaseConfigModal';
import { AuthModal } from './components/auth/AuthModal';
import { Task, Priority } from './types';

const MainAppContent: React.FC = () => {
  const { user, loading } = useAuth();
  const { createTask, updateTask, deleteTask, setFilterOptions } = useTasks();
  const { focusedTaskId, setFocusedTaskId } = useNotifications();

  const [currentTab, setCurrentTab] = useState<TabType>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);

  // Modals state
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const [viewingTask, setViewingTask] = useState<Task | null>(null);
  const [deletingTask, setDeletingTask] = useState<Task | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);

  // If user opened app via push notification with a taskId
  React.useEffect(() => {
    if (focusedTaskId) {
      // Find task if possible
      setFocusedTaskId(null);
    }
  }, [focusedTaskId, setFocusedTaskId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold text-slate-500">Loading SmartTask...</p>
        </div>
      </div>
    );
  }

  // If not logged in, show Auth Screen
  if (!user) {
    return <AuthModal isOpen={true} />;
  }

  const handleOpenCreateTask = () => {
    setEditingTask(null);
    setIsTaskModalOpen(true);
  };

  const handleOpenEditTask = (task: Task) => {
    setViewingTask(null);
    setEditingTask(task);
    setIsTaskModalOpen(true);
  };

  const handleOpenDeleteConfirm = (task: Task) => {
    setViewingTask(null);
    setDeletingTask(task);
  };

  const handleConfirmDelete = async () => {
    if (!deletingTask) return;
    try {
      setIsDeleting(true);
      await deleteTask(deletingTask.id);
      setDeletingTask(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleTaskSubmit = async (data: {
    title: string;
    description?: string;
    start_at?: string | null;
    deadline_at: string;
    priority: Priority;
    reminder_offsets: number[];
    auto_delete_after_deadline: boolean;
  }) => {
    if (editingTask) {
      await updateTask(editingTask.id, {
        title: data.title,
        description: data.description,
        start_at: data.start_at,
        deadline_at: data.deadline_at,
        priority: data.priority,
        reminder_offsets: data.reminder_offsets,
        auto_delete_after_deadline: data.auto_delete_after_deadline,
      });
    } else {
      await createTask({
        title: data.title,
        description: data.description,
        start_at: data.start_at,
        deadline_at: data.deadline_at,
        priority: data.priority,
        reminder_offsets: data.reminder_offsets,
        auto_delete_after_deadline: data.auto_delete_after_deadline,
      });
    }
  };

  const handleNavigateToTasks = (filterStatus?: any) => {
    if (filterStatus) {
      setFilterOptions((prev) => ({ ...prev, status: filterStatus }));
    }
    setCurrentTab('tasks');
  };

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      {/* Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={(tab) => {
          if (tab === 'completed') {
            setFilterOptions((prev) => ({ ...prev, status: 'completed' }));
            setCurrentTab('tasks');
          } else if (tab === 'notifications') {
            setCurrentTab('settings');
          } else {
            setCurrentTab(tab);
          }
        }}
        onOpenTaskModal={handleOpenCreateTask}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          onOpenTaskModal={handleOpenCreateTask}
          onOpenSupabaseModal={() => setIsSupabaseModalOpen(true)}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {showPrivacyPolicy ? (
            <PrivacyPolicyView onBack={() => setShowPrivacyPolicy(false)} />
          ) : (
            <>
              {currentTab === 'dashboard' && (
                <DashboardView
                  onOpenTaskModal={handleOpenCreateTask}
                  onViewTask={(task) => setViewingTask(task)}
                  onEditTask={handleOpenEditTask}
                  onDeleteTask={handleOpenDeleteConfirm}
                  onNavigateToTasks={handleNavigateToTasks}
                />
              )}

              {currentTab === 'tasks' && (
                <TasksView
                  onOpenTaskModal={handleOpenCreateTask}
                  onViewTask={(task) => setViewingTask(task)}
                  onEditTask={handleOpenEditTask}
                  onDeleteTask={handleOpenDeleteConfirm}
                />
              )}

              {currentTab === 'settings' && (
                <SettingsView
                  onOpenSupabaseModal={() => setIsSupabaseModalOpen(true)}
                  onOpenPrivacyPolicy={() => setShowPrivacyPolicy(true)}
                />
              )}
            </>
          )}
        </main>
      </div>

      {/* Modals */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false);
          setEditingTask(null);
        }}
        onSubmit={handleTaskSubmit}
        editingTask={editingTask}
      />

      <TaskDetailModal
        task={viewingTask}
        isOpen={Boolean(viewingTask)}
        onClose={() => setViewingTask(null)}
        onEdit={handleOpenEditTask}
        onDelete={handleOpenDeleteConfirm}
      />

      <DeleteConfirmModal
        task={deletingTask}
        isOpen={Boolean(deletingTask)}
        onClose={() => setDeletingTask(null)}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
      />

      <SupabaseConfigModal
        isOpen={isSupabaseModalOpen}
        onClose={() => setIsSupabaseModalOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <NotificationProvider>
          <TaskProvider>
            <MainAppContent />
          </TaskProvider>
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
