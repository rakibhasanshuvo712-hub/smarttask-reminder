-- ==============================================================================
-- SmartTask Database Schema & Setup Script
-- Timezone: Asia/Dhaka (UTC+06:00)
-- Target: Supabase PostgreSQL with Row Level Security (RLS)
-- ==============================================================================

-- 1. Enable UUID extension
create extension if not exists "uuid-ossp";

-- 2. Create profiles table
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  full_name text not null,
  email text not null,
  avatar_url text,
  timezone text default 'Asia/Dhaka',
  time_format text default '12h',
  default_reminder_offsets integer[] default array[1440, 360, 120, 30], -- 24h, 6h, 2h, 30m
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- 3. Create tasks table
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

-- 4. Create reminders table
create table if not exists public.reminders (
  id uuid default gen_random_uuid() primary key,
  task_id uuid references public.tasks(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  reminder_offset_minutes integer not null, -- minutes before deadline (e.g. 1440, 360, 120, 30)
  scheduled_at timestamptz not null,
  status text check (status in ('pending', 'sent', 'cancelled')) default 'pending' not null,
  sent_at timestamptz,
  created_at timestamptz default now() not null
);

-- 5. Create notifications table
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

-- 6. Create push_subscriptions table
create table if not exists public.push_subscriptions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  subscription jsonb not null,
  user_agent text,
  created_at timestamptz default now() not null,
  unique (user_id, subscription)
);

-- ==============================================================================
-- INDEXES for Maximum Query & Scheduler Performance
-- ==============================================================================
create index if not exists idx_tasks_user_id on public.tasks(user_id);
create index if not exists idx_tasks_deadline on public.tasks(deadline_at);
create index if not exists idx_tasks_status on public.tasks(is_completed, deadline_at);
create index if not exists idx_reminders_scheduler on public.reminders(status, scheduled_at);
create index if not exists idx_reminders_task_id on public.reminders(task_id);
create index if not exists idx_notifications_user on public.notifications(user_id, is_read, created_at desc);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Each user only accesses their own tasks, reminders, notifications and profile.
-- ==============================================================================
alter table public.profiles enable row level security;
alter table public.tasks enable row level security;
alter table public.reminders enable row level security;
alter table public.notifications enable row level security;
alter table public.push_subscriptions enable row level security;

-- Profiles policies
create policy "Users can view own profile" 
  on public.profiles for select 
  using (auth.uid() = id);

create policy "Users can update own profile" 
  on public.profiles for update 
  using (auth.uid() = id);

create policy "Users can insert own profile" 
  on public.profiles for insert 
  with check (auth.uid() = id);

-- Tasks policies
create policy "Users can view own tasks" 
  on public.tasks for select 
  using (auth.uid() = user_id);

create policy "Users can insert own tasks" 
  on public.tasks for insert 
  with check (auth.uid() = user_id);

create policy "Users can update own tasks" 
  on public.tasks for update 
  using (auth.uid() = user_id);

create policy "Users can delete own tasks" 
  on public.tasks for delete 
  using (auth.uid() = user_id);

-- Reminders policies
create policy "Users can view own reminders" 
  on public.reminders for select 
  using (auth.uid() = user_id);

create policy "Users can insert own reminders" 
  on public.reminders for insert 
  with check (auth.uid() = user_id);

create policy "Users can update own reminders" 
  on public.reminders for update 
  using (auth.uid() = user_id);

create policy "Users can delete own reminders" 
  on public.reminders for delete 
  using (auth.uid() = user_id);

-- Notifications policies
create policy "Users can view own notifications" 
  on public.notifications for select 
  using (auth.uid() = user_id);

create policy "Users can update own notifications" 
  on public.notifications for update 
  using (auth.uid() = user_id);

create policy "Users can delete own notifications" 
  on public.notifications for delete 
  using (auth.uid() = user_id);

create policy "Users can insert own notifications" 
  on public.notifications for insert 
  with check (auth.uid() = user_id);

-- Push Subscriptions policies
create policy "Users can manage own push subscriptions" 
  on public.push_subscriptions for all 
  using (auth.uid() = user_id) 
  with check (auth.uid() = user_id);

-- ==============================================================================
-- AUTOMATIC USER PROFILE TRIGGER
-- Automatically creates a user profile entry whenever a new user registers in Supabase Auth
-- ==============================================================================
create or replace function public.handle_new_user()
returns trigger as $$
declare
  user_full_name text;
begin
  user_full_name := coalesce(
    new.raw_user_meta_data->>'full_name',
    split_part(new.email, '@', 1)
  );

  insert into public.profiles (id, full_name, email, created_at, updated_at)
  values (new.id, user_full_name, new.email, now(), now())
  on conflict (id) do update
  set email = excluded.email,
      updated_at = now();
      
  return new;
end;
$$ language plpgsql security definer;

-- Drop trigger if already exists then recreate
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ==============================================================================
-- AUTOMATED REMINDER & OVERDUE PROCESSOR FUNCTION
-- Can be invoked by Supabase pg_cron, Supabase Edge Function, or an API call.
-- ==============================================================================
create or replace function public.process_smart_reminders()
returns table (
  reminders_sent int,
  overdue_detected int,
  tasks_deleted int
) as $$
declare
  v_reminders_sent int := 0;
  v_overdue_detected int := 0;
  v_tasks_deleted int := 0;
  r record;
  t record;
begin
  -- 1. Process pending reminders whose scheduled time has arrived
  for r in
    select rem.id, rem.task_id, rem.user_id, rem.reminder_offset_minutes, t.title, t.is_completed, t.deadline_at
    from public.reminders rem
    join public.tasks t on rem.task_id = t.id
    where rem.status = 'pending'
      and rem.scheduled_at <= now()
      and t.is_completed = false
  loop
    -- Insert notification for incomplete task
    insert into public.notifications (user_id, task_id, task_title, message, type, is_read, created_at)
    values (
      r.user_id,
      r.task_id,
      r.title,
      case 
        when r.reminder_offset_minutes >= 60 then 'Reminder! Your task "' || r.title || '" is due in ' || (r.reminder_offset_minutes / 60) || ' hours (BST).'
        else 'Reminder! Your task "' || r.title || '" is due in ' || r.reminder_offset_minutes || ' minutes (BST).'
      end,
      'reminder',
      false,
      now()
    );

    -- Mark reminder as sent
    update public.reminders
    set status = 'sent', sent_at = now()
    where id = r.id;

    v_reminders_sent := v_reminders_sent + 1;
  end loop;

  -- 2. Detect overdue tasks and generate overdue notification (prevent duplicate notification within 1 hour)
  for t in
    select id, user_id, title, deadline_at
    from public.tasks
    where is_completed = false
      and deadline_at < now()
      and not exists (
        select 1 from public.notifications n
        where n.task_id = tasks.id
          and n.type = 'overdue'
          and n.created_at >= now() - interval '1 hour'
      )
  loop
    insert into public.notifications (user_id, task_id, task_title, message, type, is_read, created_at)
    values (
      t.user_id,
      t.id,
      t.title,
      'Your task "' || t.title || '" is now OVERDUE! Please complete or update it.',
      'overdue',
      false,
      now()
    );
    v_overdue_detected := v_overdue_detected + 1;
  end loop;

  -- 3. Auto-delete tasks after deadline if user enabled auto_delete_after_deadline
  with deleted as (
    delete from public.tasks
    where auto_delete_after_deadline = true
      and deadline_at < now()
    returning id
  )
  select count(*) into v_tasks_deleted from deleted;

  return query select v_reminders_sent, v_overdue_detected, v_tasks_deleted;
end;
$$ language plpgsql security definer;
