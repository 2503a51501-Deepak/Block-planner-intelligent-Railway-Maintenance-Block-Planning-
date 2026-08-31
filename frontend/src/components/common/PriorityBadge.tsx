import React from 'react';

interface PriorityBadgeProps {
  priority: string;
  score?: number;
  size?: 'sm' | 'md';
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority, score, size = 'sm' }) => {
  const p = priority?.toLowerCase() || 'medium';

  const styles = {
    critical: 'bg-rose-50 text-rose-700 border-rose-200',
    high: 'bg-amber-50 text-amber-700 border-amber-200',
    medium: 'bg-blue-50 text-blue-700 border-blue-200',
    low: 'bg-slate-100 text-slate-600 border-slate-200',
  }[p] || 'bg-slate-100 text-slate-600 border-slate-200';

  const dotColors = {
    critical: 'bg-rose-500',
    high: 'bg-amber-500',
    medium: 'bg-blue-500',
    low: 'bg-slate-400',
  }[p] || 'bg-slate-400';

  return (
    <span className={`inline-flex items-center space-x-1.5 font-semibold font-mono rounded border ${styles} ${
      size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs'
    }`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dotColors}`}></span>
      <span>{priority}</span>
      {score !== undefined && <span className="opacity-75 font-normal">({score.toFixed(0)})</span>}
    </span>
  );
};