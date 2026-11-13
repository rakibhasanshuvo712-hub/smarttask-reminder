import React from 'react';
import {
  LayoutDashboard,
  CheckSquare,
  PlusCircle,
  CheckCircle2,
  Bell,
  Settings,
  LogOut,
  Users,
  ChevronRight,
  ShieldCheck,
  X,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTasks } from '@/context/TaskContext';
import { useNotifications } from '@/context/NotificationContext';

export type TabType = 'dashboard' | 'tasks' | 'completed' | 'notifications' | 'settings';

interface SidebarProps {
  currentTab: TabType;
  onSelectTab: (tab: TabType) => void;
  onOpenTaskModal: () => void;
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  onOpenTaskModal,
  isOpen,
  onClose,
}) => {
  const { user, logout, allProfiles, switchUser } = useAuth();
  const { stats } = useTasks();
  const { unreadCount } = useNotifications();

  const navItems = [
    {
      id: 'dashboard' as TabType,
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'tasks' as TabType,
      label: 'My Tasks',
      icon: CheckSquare,
      badge: stats.pending > 0 ? stats.pending : null,
      badgeColor: 'bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300',
    },
    {
      id: 'completed' as TabType,
      label: 'Completed Tasks',
      icon: CheckCircle2,
      badge: stats.completed > 0 ? stats.completed : null,
      badgeColor: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300',
    },
    {
      id: 'notifications' as TabType,
      label: 'Notifications',
      icon: Bell,
      badge: unreadCount > 0 ? unreadCount : null,
      badgeColor: 'bg-red-100 text-red-700 dark:bg-red-900/60 dark:text-red-300',
    },
    {
      id: 'settings' as TabType,
      label: 'Settings',
      icon: Settings,
      badge: null,
    },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs lg:hidden"
        />
      )}

      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 z-50 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Top: Logo & Close button on mobile */}
        <div>
          <div className="flex items-center justify-between h-16 px-6 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
                <CheckSquare className="w-5 h-5" />
              </div>
              <div>
                <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  SmartTask
                </span>
                <span className="block text-[10px] uppercase font-bold tracking-wider text-slate-400">
                  Asia/Dhaka (BST)
                </span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 lg:hidden rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Add Task button in sidebar */}
          <div className="p-4">
            <button
              onClick={() => {
                onOpenTaskModal();
                onClose();
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold text-sm shadow-sm active:scale-98 transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Add New Task</span>
            </button>
          </div>

          {/* Navigation links */}
          <nav className="px-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelectTab(item.id);
                    onClose();
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all ${
                    isActive
                      ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-semibold shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100/70 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>

                  {item.badge !== null && (
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${item.badgeColor}`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Demo User Switcher Section (5 separate accounts) */}
          {allProfiles.length > 1 && (
            <div className="mt-6 px-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5" />
                  Profiles ({allProfiles.length})
                </span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                  Multi-User RLS
                </span>
              </div>

              <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                {allProfiles.map((p) => {
                  const isCurrent = user?.id === p.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => switchUser(p.id)}
                      className={`w-full flex items-center justify-between p-1.5 rounded-lg text-xs text-left transition-colors ${
                        isCurrent
                          ? 'bg-slate-100 dark:bg-slate-800 font-semibold text-blue-600 dark:text-blue-400 ring-1 ring-blue-500/20'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <img
                          src={p.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${p.full_name}`}
                          alt={p.full_name}
                          className="w-5 h-5 rounded-full object-cover shrink-0"
                        />
                        <span className="truncate">{p.full_name}</span>
                      </div>
                      {isCurrent && <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0"></span>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Bottom: Current User Card & Logout */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          {user && (
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5 truncate">
                <img
                  src={user.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${user.full_name}`}
                  alt={user.full_name}
                  className="w-9 h-9 rounded-full object-cover ring-2 ring-slate-200 dark:ring-slate-700 shrink-0"
                />
                <div className="truncate">
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                    {user.full_name}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    {user.email}
                  </p>
                </div>
              </div>
            </div>
          )}

          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};
