import React from 'react';
import { Shield, Lock, Bell, Eye, ArrowLeft } from 'lucide-react';

interface PrivacyPolicyViewProps {
  onBack?: () => void;
}

export const PrivacyPolicyView: React.FC<PrivacyPolicyViewProps> = ({ onBack }) => {
  return (
    <div className="max-w-3xl mx-auto space-y-6 sm:space-y-8 animate-in fade-in duration-200 p-4 sm:p-6">
      {onBack && (
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </button>
      )}

      <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-sm space-y-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 text-xs font-semibold mb-3">
            <Shield className="w-4 h-4" />
            <span>Google Play Store Compliance</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            Privacy Policy for SmartTask
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Last Updated: November 2026 • Official Google Play Developer Statement
          </p>
        </div>

        <div className="space-y-4 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Lock className="w-4 h-4 text-blue-500" />
              1. Information We Collect
            </h2>
            <p>
              SmartTask collects user email addresses and full names solely for account authentication and workspace isolation. We store your task titles, descriptions, start times, deadline dates, and reminder configurations.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Bell className="w-4 h-4 text-amber-500" />
              2. Android System Notifications & Alarms
            </h2>
            <p>
              To ensure that your task deadlines are met, SmartTask requests the following Android permissions:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-xs">
              <li><strong className="text-slate-900 dark:text-white">POST_NOTIFICATIONS:</strong> To post reminder alerts directly on your phone lock screen and notification shade.</li>
              <li><strong className="text-slate-900 dark:text-white">SCHEDULE_EXACT_ALARM:</strong> To trigger native alarm sounds and vibrations at the exact reminder times you configure in Bangladesh Standard Time (BST).</li>
              <li><strong className="text-slate-900 dark:text-white">RECEIVE_BOOT_COMPLETED:</strong> To reschedule your pending task alarms automatically whenever your Android device is rebooted.</li>
              <li><strong className="text-slate-900 dark:text-white">WAKE_LOCK:</strong> To briefly illuminate your device when high-priority task alarms sound.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Eye className="w-4 h-4 text-emerald-500" />
              3. Security & Scalability for Thousands of Users
            </h2>
            <p>
              Your data is stored in enterprise-grade Supabase PostgreSQL databases with Row Level Security (RLS) enabled. Only your authenticated user account can access, modify, or delete your tasks. We do not sell or share your personal data with third-party advertisers.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              4. Data Deletion
            </h2>
            <p>
              Users can delete individual tasks at any time directly in the app. Deleting a task immediately cancels all scheduled reminders and purges associated records.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              5. Contact Information
            </h2>
            <p>
              For privacy inquiries regarding SmartTask, reach out to: <span className="font-mono text-blue-600 dark:text-blue-400">support@smarttask.app</span>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};
