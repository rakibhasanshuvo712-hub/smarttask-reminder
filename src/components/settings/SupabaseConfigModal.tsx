import React, { useState } from 'react';
import {
  Database,
  X,
  Copy,
  Check,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Key,
  Globe,
  Trash2,
} from 'lucide-react';
import {
  getSupabaseCredentials,
  saveSupabaseCredentials,
  clearSupabaseCredentials,
  isLiveSupabaseConnected,
} from '@/lib/supabase';

interface SupabaseConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupabaseConfigModal: React.FC<SupabaseConfigModalProps> = ({
  isOpen,
  onClose,
}) => {
  const currentCreds = getSupabaseCredentials();
  const isConnected = isLiveSupabaseConnected();

  const [url, setUrl] = useState(currentCreds.url);
  const [anonKey, setAnonKey] = useState(currentCreds.anonKey);
  const [copied, setCopied] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; msg: string } | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() || !anonKey.trim()) {
      alert('Please provide both Supabase URL and Anon Key.');
      return;
    }
    saveSupabaseCredentials(url, anonKey);
  };

  const handleClear = () => {
    if (window.confirm('Disconnect Supabase and switch back to Local Storage Demo Mode?')) {
      clearSupabaseCredentials();
    }
  };

  const handleCopySql = () => {
    const sqlScript = `-- SmartTask Complete PostgreSQL Migration
create extension if not exists "uuid-ossp";

create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  full_name text not null,
  email text not null,
  avatar_url text,
  timezone text default 'Asia/Dhaka',
  time_format text default '12h',
  default_reminder_offsets integer[] default array[1440, 360, 120, 30],
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create table if not exists public.tasks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  description text,
  start_at timestamptz,
  deadline_at timestamptz not null,
  priority text check (priority in ('low', 'medium', 'high')) default 'medium' not null,
  is_completed boolean default false not null,
  completed_at timestamptz,
  auto_delete_after_deadline boolean default false not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create table if not exists public.reminders (
  id uuid default gen_random_uuid() primary key,
  task_id uuid references public.tasks(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  reminder_offset_minutes integer not null,
  scheduled_at timestamptz not null,
  status text check (status in ('pending', 'sent', 'cancelled')) default 'pending' not null,
  sent_at timestamptz,
  created_at timestamptz default now() not null
);

create table if not exists public.notifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  task_id uuid references public.tasks(id) on delete cascade,
  task_title text,
  message text not null,
  type text check (type in ('reminder', 'overdue', 'completed', 'system')) default 'reminder' not null,
  is_read boolean default false not null,
  created_at timestamptz default now() not null
);

create table if not exists public.push_subscriptions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  subscription jsonb not null,
  created_at timestamptz default now() not null
);

-- Enable RLS
alter table public.profiles enable row level security;
alter table public.tasks enable row level security;
alter table public.reminders enable row level security;
alter table public.notifications enable row level security;
alter table public.push_subscriptions enable row level security;

create policy "Users can manage own profile" on public.profiles for all using (auth.uid() = id);
create policy "Users can manage own tasks" on public.tasks for all using (auth.uid() = user_id);
create policy "Users can manage own reminders" on public.reminders for all using (auth.uid() = user_id);
create policy "Users can manage own notifications" on public.notifications for all using (auth.uid() = user_id);
create policy "Users can manage own push_subscriptions" on public.push_subscriptions for all using (auth.uid() = user_id);

-- Auto Profile Trigger
create or replace function public.handle_new_user() returns trigger as $$
begin
  insert into public.profiles (id, full_name, email, created_at, updated_at)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)), new.email, now(), now())
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
`;
    navigator.clipboard.writeText(sqlScript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Supabase Backend Integration
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                PostgreSQL Database, Authentication & RLS
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Status Box */}
          <div
            className={`p-4 rounded-xl border flex items-center justify-between ${
              isConnected
                ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800'
                : 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800'
            }`}
          >
            <div className="flex items-center gap-3">
              {isConnected ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              )}
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">
                  {isConnected ? 'Live Supabase Connected' : 'Running in Zero-Config Demo Mode'}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {isConnected
                    ? 'All user data, tasks, and reminders synchronize with your Supabase project.'
                    : 'Works offline using local storage. Connect your Supabase project anytime.'}
                </p>
              </div>
            </div>

            {isConnected && (
              <button
                onClick={handleClear}
                className="text-xs font-semibold text-red-600 hover:text-red-700 flex items-center gap-1 hover:underline ml-2"
                title="Disconnect Supabase"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Disconnect</span>
              </button>
            )}
          </div>

          {/* Connect Form */}
          <form onSubmit={handleSave} className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Globe className="w-3.5 h-3.5 text-blue-500" />
                Supabase Project URL
              </label>
              <input
                type="url"
                required
                placeholder="https://xyzcompany.supabase.co"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Key className="w-3.5 h-3.5 text-blue-500" />
                Supabase Anon (Public) Key
              </label>
              <input
                type="text"
                required
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                value={anonKey}
                onChange={(e) => setAnonKey(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs sm:text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-xs transition-colors"
            >
              Save & Connect Supabase
            </button>
          </form>

          {/* Copy SQL Migration */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                1-Click Supabase SQL Setup Script
              </span>
              <button
                type="button"
                onClick={handleCopySql}
                className="flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied to Clipboard!' : 'Copy SQL Script'}</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Paste into your <span className="font-semibold text-slate-700 dark:text-slate-300">Supabase SQL Editor</span> to automatically provision all 5 tables (`profiles`, `tasks`, `reminders`, `notifications`, `push_subscriptions`), Row Level Security policies, and user triggers in 10 seconds.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
