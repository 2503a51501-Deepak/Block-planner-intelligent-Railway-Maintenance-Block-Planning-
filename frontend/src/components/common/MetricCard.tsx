import React from 'react';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subValue?: string;
  icon: LucideIcon;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  color?: 'blue' | 'rose' | 'amber' | 'emerald' | 'indigo' | 'purple';
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subValue,
  icon: Icon,
  trend,
  trendValue,
  color = 'blue'
}) => {
  const colorMap = {
    blue: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', icon: 'text-blue-600' },
    rose: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', icon: 'text-rose-600' },
    amber: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', icon: 'text-amber-600' },
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', icon: 'text-emerald-600' },
    indigo: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200', icon: 'text-indigo-600' },
    purple: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', icon: 'text-purple-600' },
  };

  const style = colorMap[color] || colorMap.blue;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</span>
        <div className={`p-2 rounded-lg ${style.bg} ${style.border} border`}>
          <Icon className={`w-4 h-4 ${style.icon}`} />
        </div>
      </div>

      <div className="mt-2">
        <div className="text-2xl font-bold font-mono text-slate-900">{value}</div>
        {subValue && <div className="text-xs text-slate-500 mt-0.5">{subValue}</div>}
      </div>

      {trendValue && (
        <div className="mt-2 pt-2 border-t border-slate-100 flex items-center text-[11px] font-medium text-slate-600">
          <span className={`font-semibold ${trend === 'up' ? 'text-emerald-600' : 'text-slate-600'}`}>
            {trendValue}
          </span>
        </div>
      )}
    </div>
  );
};