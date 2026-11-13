# SmartTask – Smart Task Reminder & Deadline Management System

**SmartTask** is a modern, responsive web application designed to help users manage their daily tasks, set deadlines in **Bangladesh Standard Time (Asia/Dhaka, UTC+06:00)**, and receive automated reminders before and after deadlines until completion.

---

## 🌟 Key Features

1. **Exclusively Asia/Dhaka Timezone (BST, UTC+6)**
   - All tasks, deadlines, and notifications are scheduled and displayed in Bangladesh Standard Time.
   - Built-in live BST clock in the header.
   - 12-hour (AM/PM) and 24-hour time display options.
   - Safe UTC timestamp conversion for database persistence.

2. **User Authentication & Profile Management**
   - Simple password policy: Minimum 6 characters, numeric-only allowed, no special character or case restrictions.
   - No email verification barrier required.
   - Strict account separation: Each user has a private workspace; tasks, reminders, and notifications are 100% isolated.
   - Built-in multi-user quick switcher with 5 pre-configured demo profiles (`Rakib Hasan`, `Ayesha Rahman`, `Tanvir Ahmed`, `Sadia Islam`, `Farhan Kabir`) for instantaneous evaluation.
   - Profile editing: Name, email, avatar URL, member since date, and timezone preferences.

3. **Smart Automated Reminder Engine**
   - Pre-deadline reminders at customizable multi-intervals (e.g. 24h, 12h, 6h, 2h, 1h, 30m, 15m, 10m, or custom minutes).
   - Dynamic schedule recalculation whenever a task deadline is edited.
   - Overdue tracking: Detects when a deadline has passed without completion and sends recurring overdue alerts.
   - Automatic cleanup / Auto-delete: Users can enable "Auto-delete task when deadline passes" to automatically clean up expired tasks.
   - Duplicate prevention: Reminders are tracked by ID and status (`pending`, `sent`, `cancelled`) to guarantee zero duplicate spam.
   - Task completion triggers confetti celebration, plays audio chime, and cancels all future pending reminders.

4. **Multi-Channel Notification System**
   - **Browser Push Notifications**: Service Worker (`public/sw.js`) and Web Push API support.
   - **Notification Center**: Bell icon drawer displaying unread counter, action buttons on each reminder (`View Task`, `Mark Completed`, `Delete Task`), and mark-as-read/clear controls.
   - **Web Audio Alert Chimes**: Synthesized dual-tone chimes for reminder events and urgent alerts for overdue tasks.

5. **Main Dashboard & Analytics**
   - 5 key statistics: Total Tasks, Completed Tasks, Pending Tasks, Overdue Tasks, Upcoming Tasks.
   - Task completion percentage progress bar with motivational badges.
   - Organized sections for *Today's Tasks*, *Upcoming Deadlines*, *Overdue Alerts*, and *Recently Completed*.

6. **Task Filters & Search**
   - Filter by status: *All*, *Due Today*, *Upcoming*, *Pending*, *Overdue*, *Completed*.
   - Filter by priority: *High*, *Medium*, *Low*.
   - Search by title and notes in real time.
   - Sort by Deadline, Creation Date, Priority, or Title (A-Z).
   - Toggle between responsive Card Grid view and Table view.

7. **Dual-Mode Backend Integration (Supabase + Local Fallback)**
   - Connects directly to **Supabase PostgreSQL** with Row Level Security (RLS), stored procedures (`process_smart_reminders`), and Edge Functions.
   - Built-in zero-config local storage mode allows immediate full functionality without any initial database setup.
   - Interactive Supabase Setup modal with 1-click SQL copy to bootstrap your database in 15 seconds.

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
cd smart-task
npm install
```

### 2. Run the Development Server
```bash
npm run dev
```
Open `http://localhost:5173` in your browser.

### 3. Production Build
```bash
npm run build
npm run preview
```

---

## 🗄️ Supabase Setup & Schema

To connect your Supabase project:
1. Open the app and click the **Connect SQL** or **Database Settings** button in the header or settings page.
2. Enter your **Supabase URL** and **Anon Public Key**.
3. Run the SQL script located in `supabase/schema.sql` inside the **Supabase SQL Editor**:
   - Creates `profiles`, `tasks`, `reminders`, `notifications`, and `push_subscriptions` tables.
   - Enables Row Level Security (RLS) on all tables.
   - Registers the `handle_new_user()` trigger for automated profile creation upon registration.
   - Defines the `process_smart_reminders()` function for Supabase Cron or Edge Functions.
