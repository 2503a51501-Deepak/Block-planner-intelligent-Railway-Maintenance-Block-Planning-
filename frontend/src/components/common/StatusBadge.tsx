import React from 'react';

interface StatusBadgeProps {
  status: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const s = status?.toLowerCase() || 'pending';

  let style = 'bg-slate-100 text-slate-700 border-slate-200';
  if (s === 'active' || s === 'completed' || s === 'accepted' || s === 'available' || s === 'on time') {
    style = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  } else if (s === 'pending' || s === 'scheduled' || s === 'proposed') {
    style = 'bg-blue-50 text-blue-700 border-blue-200';
  } else if (s === 'overdue' || s === 'delayed') {
    style = 'bg-amber-50 text-amber-700 border-amber-200';
  } else if (s === 'rejected' || s === 'critical' || s === 'cancelled') {
    style = 'bg-rose-50 text-rose-700 border-rose-200';
  }

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border ${style}`}>
      {status}
    </span>
  );
};