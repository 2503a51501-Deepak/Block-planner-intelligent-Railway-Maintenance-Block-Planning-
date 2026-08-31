import React from 'react';
import { Wrench, Zap, Signal } from 'lucide-react';

interface DeptBadgeProps {
  department: string;
  showIcon?: boolean;
}

export const DeptBadge: React.FC<DeptBadgeProps> = ({ department, showIcon = true }) => {
  let style = 'bg-slate-100 text-slate-700 border-slate-200';
  let Icon = Wrench;

  if (department.includes('Engineering') || department.includes('Track')) {
    style = 'bg-sky-50 text-sky-700 border-sky-200';
    Icon = Wrench;
  } else if (department.includes('Traction') || department.includes('Electrical')) {
    style = 'bg-purple-50 text-purple-700 border-purple-200';
    Icon = Zap;
  } else if (department.includes('Signal') || department.includes('Telecom')) {
    style = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    Icon = Signal;
  }

  return (
    <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-semibold border ${style}`}>
      {showIcon && <Icon className="w-3 h-3 shrink-0" />}
      <span className="truncate">{department}</span>
    </span>
  );
};