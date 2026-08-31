import React from 'react';
import {
  LayoutDashboard,
  Building2,
  TrainTrack,
  Wrench,
  CalendarClock,
  CalendarDays,
  CalendarRange,
  Settings
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onTabChange }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'stations', label: 'Stations', icon: Building2 },
    { id: 'trains', label: 'Trains', icon: TrainTrack },
    { id: 'tasks', label: 'Maintenance Tasks', icon: Wrench },
    { id: 'planner', label: 'Block Planner', icon: CalendarClock, isPrimary: true },
    { id: 'weekly', label: 'Weekly Plan', icon: CalendarDays },
    { id: 'monthly', label: 'Monthly Plan', icon: CalendarRange },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-56 bg-white border-r border-slate-200 flex flex-col justify-between p-3 shrink-0 select-none">
      <div className="space-y-1">
        <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
          Operations Menu
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all text-left ${
                isActive
                  ? item.isPrimary
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-100 text-blue-700 font-bold'
                  : item.isPrimary
                  ? 'bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold border border-blue-200'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${isActive && item.isPrimary ? 'text-white' : item.isPrimary ? 'text-blue-600' : 'text-slate-500'}`} />
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Footer System Status Indicator */}
      <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-[11px] text-slate-600 space-y-1">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-slate-800">System Status</span>
          <span className="flex items-center space-x-1 text-emerald-700 font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Online</span>
          </span>
        </div>
        <div className="text-[10px] text-slate-500 font-mono">
          Safety Rules Enforced
        </div>
      </div>
    </aside>
  );
};
