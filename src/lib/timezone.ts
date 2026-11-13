// Timezone management for Asia/Dhaka (Bangladesh Standard Time, UTC+6)

export const BANGLADESH_TIMEZONE = 'Asia/Dhaka';
export const BST_OFFSET_HOURS = 6;
export const BST_OFFSET_MS = 6 * 60 * 60 * 1000;

/**
 * Gets the current time converted to Bangladesh Standard Time (UTC+6)
 */
export function getDhakaNow(): Date {
  return new Date();
}

/**
 * Format any ISO date/timestamp strictly in Asia/Dhaka timezone
 */
export function formatDhakaDateTime(
  dateInput: string | number | Date | null | undefined,
  format: 'full' | 'date' | 'time' | 'short' | 'relative' = 'full',
  timeFormat: '12h' | '24h' = '12h'
): string {
  if (!dateInput) return '—';

  const date = typeof dateInput === 'string' || typeof dateInput === 'number' ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return 'Invalid date';

  const hour12 = timeFormat === '12h';

  if (format === 'date') {
    return new Intl.DateTimeFormat('en-GB', {
      timeZone: BANGLADESH_TIMEZONE,
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  }

  if (format === 'time') {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: BANGLADESH_TIMEZONE,
      hour: 'numeric',
      minute: '2-digit',
      hour12,
    }).format(date) + ' BST';
  }

  if (format === 'short') {
    return new Intl.DateTimeFormat('en-GB', {
      timeZone: BANGLADESH_TIMEZONE,
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12,
    }).format(date);
  }

  // default 'full'
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: BANGLADESH_TIMEZONE,
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12,
  }).format(date) + ' (BST)';
}

/**
 * Deconstructs an ISO UTC timestamp into separate date (YYYY-MM-DD) and time (HH:mm) strings in Asia/Dhaka
 * Used for populating form date and time input elements in BST
 */
export function getDhakaInputParts(isoString?: string | null): { date: string; time: string } {
  const d = isoString ? new Date(isoString) : new Date();

  // Format in en-CA to easily get YYYY-MM-DD in Asia/Dhaka
  const dateStr = new Intl.DateTimeFormat('en-CA', {
    timeZone: BANGLADESH_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d);

  // Format in 24h to easily get HH:mm in Asia/Dhaka
  const timeStr = new Intl.DateTimeFormat('en-GB', {
    timeZone: BANGLADESH_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(d);

  return { date: dateStr, time: timeStr };
}

/**
 * Combines date input (YYYY-MM-DD) and time input (HH:mm) assumed to be in Asia/Dhaka (UTC+6)
 * and returns the exact ISO UTC string for safe database storage
 */
export function parseDhakaInputsToUTC(dateStr: string, timeStr: string): string {
  if (!dateStr) throw new Error('Date is required');
  const validTime = timeStr && timeStr.trim().length > 0 ? timeStr.trim() : '23:59';
  
  // Format: YYYY-MM-DDTHH:mm:00+06:00
  const isoWithBstOffset = `${dateStr}T${validTime.length === 5 ? validTime + ':00' : validTime}+06:00`;
  const date = new Date(isoWithBstOffset);

  if (isNaN(date.getTime())) {
    throw new Error('Invalid date/time format for Bangladesh timezone');
  }

  return date.toISOString();
}

/**
 * Check if a task is overdue (deadline has passed in UTC and task is not completed)
 */
export function isOverdue(deadlineAt: string, isCompleted: boolean): boolean {
  if (isCompleted) return false;
  const deadline = new Date(deadlineAt).getTime();
  const now = Date.now();
  return deadline < now;
}

/**
 * Check if a task is due today according to Bangladesh calendar
 */
export function isDueTodayDhaka(deadlineAt: string): boolean {
  const nowParts = getDhakaInputParts(new Date().toISOString());
  const deadlineParts = getDhakaInputParts(deadlineAt);
  return nowParts.date === deadlineParts.date;
}

/**
 * Check if a task is upcoming (deadline is in future, within next 7 days)
 */
export function isUpcoming(deadlineAt: string, isCompleted: boolean): boolean {
  if (isCompleted) return false;
  const deadline = new Date(deadlineAt).getTime();
  const now = Date.now();
  return deadline > now;
}

/**
 * Computes human readable remaining time or overdue duration
 */
export function getRemainingTimeLabel(deadlineAt: string, isCompleted: boolean): { text: string; isPast: boolean } {
  if (isCompleted) {
    return { text: 'Completed', isPast: false };
  }

  const deadline = new Date(deadlineAt).getTime();
  const now = Date.now();
  const diffMs = deadline - now;
  const isPast = diffMs < 0;
  const absDiff = Math.abs(diffMs);

  const minutes = Math.floor(absDiff / (1000 * 60));
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  let text = '';
  if (days > 0) {
    const remHours = hours % 24;
    text = `${days}d ${remHours}h ${isPast ? 'ago' : 'left'}`;
  } else if (hours > 0) {
    const remMin = minutes % 60;
    text = `${hours}h ${remMin}m ${isPast ? 'ago' : 'left'}`;
  } else if (minutes > 0) {
    text = `${minutes} min ${isPast ? 'ago' : 'left'}`;
  } else {
    text = isPast ? 'Just now' : 'Due now';
  }

  return { text, isPast };
}
