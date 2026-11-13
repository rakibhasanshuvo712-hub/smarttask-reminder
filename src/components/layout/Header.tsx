import React, { useState, useEffect } from 'react';
import {
  Bell,
  Plus,
  Moon,
  Sun,
  Database,
  CheckCircle2,
  AlertCircle,
  Menu,
  Smartphone,
} from 'lucide-react';
import { BangladeshClockBadge } from '../dashboard/TimezoneBanner';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/context/NotificationContext';
import { useTheme } from '@/context/ThemeContext';
import { NotificationDrawer } from '../notifications/NotificationDrawer';

interface HeaderProps {
  onOpenTaskModal: () => void;
  onOpenSupabaseModal: () => void;
  onToggleSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenTaskModal,
  onOpenSupabaseModal,
  onToggleSidebar,
}) => {
  const { user, isSupabaseLive } = useAuth();
  const { unreadCount, pushPermission, requestPushPermission } = useNotifications();
  const { theme, toggleTheme } = useTheme();
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } else {
      alert('To install SmartTask on Android, open Chrome, tap the 3 dots (⋮) in the top right, and tap "Add to Home screen" or "Install app".');
    }
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="flex items-center justify-between h-full px-4 sm:px-6">
        {/* Left: Hamburger & Brand / Page */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="p-2 -ml-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden transition-colors"
            title="Toggle Sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="hidden sm:block">
            <h1 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              SmartTask
              <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                v2.0
              </span>
            </h1>
          </div>
        </div>

        {/* Center: Live Bangladesh BST Clock */}
        <div className="flex items-center">
          <BangladeshClockBadge />
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Supabase Status Button */}
          <button
            onClick={onOpenSupabaseModal}
            className={`hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all ${
              isSupabaseLive
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800 hover:bg-amber-100'
            }`}
            title="Click to view Supabase Database Connection & Setup"
          >
            <Database className="w-3.5 h-3.5" />
            <span>{isSupabaseLive ? 'Supabase Connected' : 'Local / Demo Mode'}</span>
            {isSupabaseLive ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <span className="text-[10px] underline ml-1">Connect SQL</span>
            )}
          </button>

          {/* Android App Install Button */}
          <button
            onClick={handleInstallClick}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 transition-colors"
            title="Install as Android Native PWA"
          >
            <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
            <span>Install App</span>
          </button>

          {/* Browser Push Permission Button if not granted */}
          {pushPermission !== 'granted' && (
            <button
              onClick={requestPushPermission}
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 hover:bg-purple-100 transition-colors"
              title="Enable Web Push Notifications"
            >
              <AlertCircle className="w-3.5 h-3.5 text-purple-600" />
              <span>Enable Push</span>
            </button>
          )}

          {/* Add Task Button */}
          <button
            onClick={onOpenTaskModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xs hover:from-blue-700 hover:to-indigo-700 active:scale-98 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Task</span>
          </button>

          {/* Notification Bell */}
          <div className="relative">
            <button
              onClick={() => setIsNotifOpen(!isNotifOpen)}
              className="relative p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white dark:ring-slate-900">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Notification Drawer Popover */}
            {isNotifOpen && (
              <NotificationDrawer
                isOpen={isNotifOpen}
                onClose={() => setIsNotifOpen(false)}
              />
            )}
          </div>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-700" />}
          </button>

          {/* User Profile Avatar */}
          {user && (
            <div className="flex items-center pl-1 sm:pl-2">
              <img
                src={user.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${user.full_name}`}
                alt={user.full_name}
                className="w-8 h-8 rounded-full object-cover ring-2 ring-blue-500/30"
              />
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
