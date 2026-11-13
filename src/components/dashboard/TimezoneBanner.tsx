import React, { useState, useEffect } from 'react';
import { Clock, Globe, ShieldCheck } from 'lucide-react';
import { BANGLADESH_TIMEZONE, formatDhakaDateTime } from '@/lib/timezone';
import { useAuth } from '@/context/AuthContext';

export const BangladeshClockBadge: React.FC = () => {
  const { user } = useAuth();
  const [timeStr, setTimeStr] = useState<string>('');

  useEffect(() => {
    const update = () => {
      setTimeStr(formatDhakaDateTime(new Date(), 'time', user?.time_format || '12h'));
    };
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [user?.time_format]);

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/50 border border-blue-200/80 dark:border-blue-800/80 text-blue-700 dark:text-blue-300 text-xs font-medium shadow-xs">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
      </span>
      <Clock className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
      <span className="font-semibold tracking-wide">{timeStr}</span>
      <span className="text-[11px] text-blue-500 dark:text-blue-400 font-mono hidden sm:inline">
        (BST • UTC+6)
      </span>
    </div>
  );
};
