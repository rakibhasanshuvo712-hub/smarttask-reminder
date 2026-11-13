import React, { useState, useEffect } from 'react';
import {
  X,
  Calendar,
  Clock,
  AlertCircle,
  Bell,
  Trash2,
  Plus,
  Flame,
  Check,
  RotateCcw,
} from 'lucide-react';
import { Task, Priority, STANDARD_REMINDER_OPTIONS } from '@/types';
import {
  getDhakaInputParts,
  parseDhakaInputsToUTC,
  formatDhakaDateTime,
  BANGLADESH_TIMEZONE,
} from '@/lib/timezone';
import { useAuth } from '@/context/AuthContext';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    description?: string;
    start_at?: string | null;
    deadline_at: string;
    priority: Priority;
    reminder_offsets: number[];
    auto_delete_after_deadline: boolean;
  }) => Promise<void>;
  editingTask?: Task | null;
  initialOffsets?: number[];
}

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  editingTask,
  initialOffsets,
}) => {
  const { user } = useAuth();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [deadlineDate, setDeadlineDate] = useState('');
  const [deadlineTime, setDeadlineTime] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [selectedOffsets, setSelectedOffsets] = useState<number[]>([1440, 360, 120, 30]);
  const [customOffsetInput, setCustomOffsetInput] = useState('');
  const [autoDeleteAfterDeadline, setAutoDeleteAfterDeadline] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Initialize form when opening
  useEffect(() => {
    if (editingTask) {
      setTitle(editingTask.title);
      setDescription(editingTask.description || '');
      setPriority(editingTask.priority);
      setAutoDeleteAfterDeadline(editingTask.auto_delete_after_deadline || false);

      const deadlineParts = getDhakaInputParts(editingTask.deadline_at);
      setDeadlineDate(deadlineParts.date);
      setDeadlineTime(deadlineParts.time);

      if (editingTask.start_at) {
        const startParts = getDhakaInputParts(editingTask.start_at);
        setStartDate(startParts.date);
        setStartTime(startParts.time);
      } else {
        setStartDate('');
        setStartTime('');
      }

      if (initialOffsets && initialOffsets.length > 0) {
        setSelectedOffsets(initialOffsets);
      }
    } else {
      // New task default: deadline tomorrow at 10:00 PM BST
      setTitle('');
      setDescription('');
      setPriority('medium');
      setAutoDeleteAfterDeadline(false);

      const nowParts = getDhakaInputParts(new Date().toISOString());
      setStartDate(nowParts.date);
      setStartTime(nowParts.time);

      // Default deadline tomorrow 10:00 PM
      const tomorrow = new Date(Date.now() + 86400000);
      const tomorrowParts = getDhakaInputParts(tomorrow.toISOString());
      setDeadlineDate(tomorrowParts.date);
      setDeadlineTime('22:00'); // 10:00 PM BST

      setSelectedOffsets(user?.default_reminder_offsets || [1440, 360, 120, 30]);
    }
    setErrorMsg(null);
  }, [editingTask, isOpen, user, initialOffsets]);

  if (!isOpen) return null;

  const toggleOffset = (minutes: number) => {
    setSelectedOffsets((prev) =>
      prev.includes(minutes) ? prev.filter((m) => m !== minutes) : [...prev, minutes].sort((a, b) => b - a)
    );
  };

  const handleAddCustomOffset = () => {
    const mins = parseInt(customOffsetInput.trim(), 10);
    if (!isNaN(mins) && mins > 0 && !selectedOffsets.includes(mins)) {
      setSelectedOffsets((prev) => [...prev, mins].sort((a, b) => b - a));
      setCustomOffsetInput('');
    }
  };

  const resetToDefaultReminders = () => {
    setSelectedOffsets(user?.default_reminder_offsets || [1440, 360, 120, 30]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!title.trim()) {
      setErrorMsg('Task title is required.');
      return;
    }
    if (!deadlineDate) {
      setErrorMsg('Deadline date in Bangladesh time is required.');
      return;
    }

    try {
      setIsSubmitting(true);
      const deadlineAtUtc = parseDhakaInputsToUTC(deadlineDate, deadlineTime || '23:59');
      let startAtUtc: string | null = null;
      if (startDate) {
        startAtUtc = parseDhakaInputsToUTC(startDate, startTime || '00:00');
      }

      await onSubmit({
        title: title.trim(),
        description: description.trim(),
        start_at: startAtUtc,
        deadline_at: deadlineAtUtc,
        priority,
        reminder_offsets: selectedOffsets,
        auto_delete_after_deadline: autoDeleteAfterDeadline,
      });

      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save task.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Compute calculated reminder previews in BST
  let previewReminders: Array<{ label: string; bstTime: string }> = [];
  try {
    if (deadlineDate) {
      const deadlineAtUtc = parseDhakaInputsToUTC(deadlineDate, deadlineTime || '23:59');
      const deadlineMs = new Date(deadlineAtUtc).getTime();
      previewReminders = selectedOffsets
        .slice()
        .sort((a, b) => b - a)
        .map((offset) => {
          const remTime = new Date(deadlineMs - offset * 60 * 1000);
          const hours = Math.floor(offset / 60);
          const mins = offset % 60;
          const label = hours > 0 ? `${hours}h ${mins > 0 ? mins + 'm' : ''} before` : `${mins}m before`;
          return {
            label,
            bstTime: formatDhakaDateTime(remTime, 'short', user?.time_format || '12h'),
          };
        });
    }
  } catch {
    // ignore
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/40">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {editingTask ? 'Edit Task' : 'Add New Task'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Scheduled strictly in Asia/Dhaka time (Bangladesh Standard Time, UTC+6)
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-600 dark:text-red-400 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Task Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Complete Final Project Assignment"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-slate-400"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Description <span className="text-slate-400 font-normal lowercase">(optional)</span>
            </label>
            <textarea
              rows={2}
              placeholder="Add key notes, links, or submission details..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-slate-400"
            />
          </div>

          {/* Start Date & Time (BST) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-500" />
                Start Date (BST)
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-blue-500" />
                Start Time (BST)
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Deadline Date & Time (BST) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/50">
            <div>
              <label className="block text-xs font-bold text-blue-900 dark:text-blue-300 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                Deadline Date (BST) <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={deadlineDate}
                onChange={(e) => setDeadlineDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-blue-200 dark:border-blue-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-blue-900 dark:text-blue-300 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                Deadline Time (BST) <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                required
                value={deadlineTime}
                onChange={(e) => setDeadlineTime(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-blue-200 dark:border-blue-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Priority
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['low', 'medium', 'high'] as Priority[]).map((p) => {
                const isSelected = priority === p;
                const colors = {
                  low: isSelected
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 hover:bg-blue-100',
                  medium: isSelected
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 hover:bg-amber-100',
                  high: isSelected
                    ? 'bg-red-600 text-white shadow-xs'
                    : 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 hover:bg-red-100',
                };
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={`py-2 px-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border border-transparent ${colors[p]}`}
                  >
                    {p}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Smart Reminder Settings (Multi-interval) */}
          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Bell className="w-3.5 h-3.5 text-indigo-500" />
                Automated Reminders Before Deadline
              </label>
              <button
                type="button"
                onClick={resetToDefaultReminders}
                className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                Default (24h, 6h, 2h, 30m)
              </button>
            </div>

            <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2.5">
              Select multiple intervals to be alerted before the deadline arrives:
            </p>

            <div className="flex flex-wrap gap-1.5 mb-3">
              {STANDARD_REMINDER_OPTIONS.map((opt) => {
                const active = selectedOffsets.includes(opt.minutes);
                return (
                  <button
                    key={opt.minutes}
                    type="button"
                    onClick={() => toggleOffset(opt.minutes)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
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

            {/* Custom offset input */}
            <div className="flex items-center gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
              <input
                type="number"
                placeholder="Custom minutes (e.g. 45)"
                value={customOffsetInput}
                onChange={(e) => setCustomOffsetInput(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white w-48 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <button
                type="button"
                onClick={handleAddCustomOffset}
                className="px-2.5 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 text-xs font-semibold hover:bg-indigo-100 transition-colors"
              >
                + Add Custom
              </button>
            </div>

            {/* Live Bangladesh Preview of Reminder Triggers */}
            {previewReminders.length > 0 && (
              <div className="mt-3 p-2.5 rounded-lg bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Scheduled Trigger Times (Bangladesh Time):
                </span>
                <div className="space-y-1">
                  {previewReminders.map((pr, idx) => (
                    <div key={idx} className="flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400">
                      <span>• {pr.label}</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{pr.bstTime} BST</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Auto-Delete After Deadline (Requirement: "after the deadeline task will be deleted") */}
          <div className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
            <input
              type="checkbox"
              id="autoDelete"
              checked={autoDeleteAfterDeadline}
              onChange={(e) => setAutoDeleteAfterDeadline(e.target.checked)}
              className="mt-1 w-4 h-4 text-blue-600 rounded-sm focus:ring-blue-500 cursor-pointer"
            />
            <label htmlFor="autoDelete" className="text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
              <span className="font-bold text-slate-900 dark:text-white block">
                Auto-delete task when deadline passes
              </span>
              <span className="text-slate-500 dark:text-slate-400 block mt-0.5">
                Automatically deletes and cleans up this task once its Bangladesh Standard Time deadline has elapsed.
              </span>
            </label>
          </div>

          {/* Footer Submit */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs sm:text-sm font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs sm:text-sm font-bold shadow-sm active:scale-98 transition-all disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : editingTask ? 'Update Task' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
