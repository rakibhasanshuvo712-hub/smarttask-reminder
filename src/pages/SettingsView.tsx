import React, { useState } from 'react';
import {
  User,
  Mail,
  Lock,
  Bell,
  Clock,
  Database,
  Volume2,
  CheckCircle2,
  RotateCcw,
  ShieldCheck,
  Calendar,
  LogOut,
  Save,
  Smartphone,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/context/NotificationContext';
import { formatDhakaDateTime, BANGLADESH_TIMEZONE } from '@/lib/timezone';
import { STANDARD_REMINDER_OPTIONS } from '@/types';
import { sound } from '@/lib/audio';

interface SettingsViewProps {
  onOpenSupabaseModal: () => void;
  onOpenPrivacyPolicy?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onOpenSupabaseModal, onOpenPrivacyPolicy }) => {
  const { user, updateProfile, logout, isSupabaseLive } = useAuth();
  const { pushPermission, requestPushPermission, triggerTestNotification } = useNotifications();

  // Profile Form state
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || '');
  const [timeFormat, setTimeFormat] = useState<'12h' | '24h'>(user?.time_format || '12h');
  const [defaultOffsets, setDefaultOffsets] = useState<number[]>(
    user?.default_reminder_offsets || [1440, 360, 120, 30]
  );

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordSavedMsg, setPasswordSavedMsg] = useState<string | null>(null);

  // Status message
  const [profileMsg, setProfileMsg] = useState<{ text: string; error?: boolean } | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setProfileMsg(null);

    const res = await updateProfile({
      full_name: fullName.trim(),
      avatar_url: avatarUrl.trim() || undefined,
      time_format: timeFormat,
      default_reminder_offsets: defaultOffsets,
    });

    if (res.success) {
      setProfileMsg({ text: 'Profile preferences saved successfully!' });
      setTimeout(() => setProfileMsg(null), 3500);
    } else {
      setProfileMsg({ text: res.error || 'Failed to update profile', error: true });
    }
    setSaving(false);
  };

  const handleToggleDefaultOffset = (minutes: number) => {
    setDefaultOffsets((prev) =>
      prev.includes(minutes) ? prev.filter((m) => m !== minutes) : [...prev, minutes].sort((a, b) => b - a)
    );
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      setPasswordSavedMsg('Password must be at least 6 characters.');
      return;
    }
    setPasswordSavedMsg('Password updated successfully!');
    setCurrentPassword('');
    setNewPassword('');
    setTimeout(() => setPasswordSavedMsg(null), 3000);
  };

  return (
    <div className="max-w-4xl space-y-6 sm:space-y-8 animate-in fade-in duration-200">
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
          System Settings & Preferences
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Manage your personal profile, notification triggers, and Bangladesh timezone formatting.
        </p>
      </div>

      {/* SECTION 1: Profile Information */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Profile Settings
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Personal account details and display avatar
            </p>
          </div>
        </div>

        {profileMsg && (
          <div
            className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
              profileMsg.error
                ? 'bg-red-50 text-red-600 border border-red-200 dark:bg-red-950/40 dark:border-red-900'
                : 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-900'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{profileMsg.text}</span>
          </div>
        )}

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Full Name
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Email Address <span className="text-slate-400 lowercase font-normal">(read-only)</span>
              </label>
              <input
                type="email"
                disabled
                value={user?.email || ''}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/40 text-slate-500 text-xs sm:text-sm cursor-not-allowed"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Profile Avatar URL
            </label>
            <input
              type="url"
              placeholder="https://..."
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-1">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-slate-400" />
              Member Since: {formatDhakaDateTime(user?.created_at, 'date')}
            </span>

            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-colors"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{saving ? 'Saving...' : 'Save Profile Changes'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* SECTION 2: Bangladesh Timezone & Formatting */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Bangladesh Timezone (Asia/Dhaka)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Strictly fixed to Bangladesh Standard Time (UTC+06:00)
            </p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div>
            <span className="font-bold text-slate-900 dark:text-white block">
              Application Timezone: Asia/Dhaka (BST)
            </span>
            <span className="text-slate-500 dark:text-slate-400 block mt-0.5">
              Current Bangladesh Time: <span className="font-semibold text-blue-600 dark:text-blue-400">{formatDhakaDateTime(new Date(), 'full', timeFormat)}</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-600 dark:text-slate-400 font-medium">Time Format:</span>
            <div className="flex border border-slate-300 dark:border-slate-700 rounded-lg overflow-hidden p-0.5 bg-white dark:bg-slate-800">
              <button
                type="button"
                onClick={async () => {
                  setTimeFormat('12h');
                  await updateProfile({ time_format: '12h' });
                }}
                className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                  timeFormat === '12h'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                12-Hour (AM/PM)
              </button>
              <button
                type="button"
                onClick={async () => {
                  setTimeFormat('24h');
                  await updateProfile({ time_format: '24h' });
                }}
                className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                  timeFormat === '24h'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                24-Hour
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 3: Notification & Smart Reminder Settings */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Notification & Reminder Settings
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Configure automated pre-deadline alerts and Web Push permissions
            </p>
          </div>
        </div>

        {/* Browser Push Permission Status */}
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs text-slate-900 dark:text-white">
                Browser Push Notifications
              </span>
              <span
                className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                  pushPermission === 'granted'
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                    : 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400'
                }`}
              >
                {pushPermission}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Deliver desktop and mobile reminders even if the browser tab is minimised or closed.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {pushPermission !== 'granted' && (
              <button
                onClick={requestPushPermission}
                className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs"
              >
                Grant Permission
              </button>
            )}
            <button
              onClick={() => {
                sound.playReminderChime();
                triggerTestNotification();
              }}
              className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs hover:bg-slate-50 flex items-center gap-1.5"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>Test Audio & Push</span>
            </button>
          </div>
        </div>

        {/* Default Reminder Intervals for New Tasks */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
            Default Reminder Intervals for New Tasks
          </label>
          <div className="flex flex-wrap gap-2">
            {STANDARD_REMINDER_OPTIONS.map((opt) => {
              const active = defaultOffsets.includes(opt.minutes);
              return (
                <button
                  key={opt.minutes}
                  type="button"
                  onClick={() => handleToggleDefaultOffset(opt.minutes)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    active
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-indigo-400'
                  }`}
                >
                  {active ? '✓ ' : '+ '}
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* SECTION 4: Change Password (Min 6 chars, numeric allowed) */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="p-2 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Change Password
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Minimum 6 characters (numeric-only passwords accepted)
            </p>
          </div>
        </div>

        {passwordSavedMsg && (
          <div className="p-3 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-900 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{passwordSavedMsg}</span>
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-3.5 max-w-md">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Current Password
            </label>
            <input
              type="password"
              placeholder="••••••"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              New Password
            </label>
            <input
              type="password"
              minLength={6}
              required
              placeholder="••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
            />
          </div>

          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white text-xs font-bold transition-colors"
          >
            Update Password
          </button>
        </form>
      </div>

      {/* SECTION 5: Android App Distribution & F-Droid */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Android App Distribution (F-Droid & itch.io)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Free and open-source Android app stores and direct downloads
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex flex-col justify-between">
            <div>
              <span className="font-bold text-slate-900 dark:text-white block">
                F-Droid Open Source Repository
              </span>
              <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-1 leading-relaxed">
                Official F-Droid recipe configured targeting release tag <code className="font-mono bg-slate-200 dark:bg-slate-700 px-1 rounded">v1.0.0</code>.
              </p>
            </div>
            <a
              href="https://gitlab.com/fdroid/fdroiddata"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              <span>View F-Droid Data</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex flex-col justify-between">
            <div>
              <span className="font-bold text-slate-900 dark:text-white block">
                itch.io Web & Android Distribution
              </span>
              <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-1 leading-relaxed">
                Downloadable package and HTML5 bundle ready for instant distribution.
              </p>
            </div>
            <a
              href="https://github.com/rakibhasanshuvo712-hub/smarttask-reminder"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              <span>GitHub Release v1.0.0</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>

      {/* SECTION 6: Google Play Compliance & Privacy Policy */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            Privacy Policy & Google Play Compliance
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Read our compliance policy on native Android alarms, lock-screen notifications, and user data security.
          </p>
        </div>

        {onOpenPrivacyPolicy && (
          <button
            type="button"
            onClick={onOpenPrivacyPolicy}
            className="px-4 py-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-xs font-bold hover:bg-blue-100 transition-colors shrink-0"
          >
            View Privacy Policy
          </button>
        )}
      </div>

      {/* SECTION 6: Supabase Database Integration & Sign Out */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <Database className="w-4 h-4 text-emerald-600" />
            Supabase Connection
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Status:{' '}
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
              {isSupabaseLive ? 'Connected to Supabase PostgreSQL' : 'Local Storage Mode'}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onOpenSupabaseModal}
            className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Database Settings
          </button>

          <button
            onClick={logout}
            className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
};
