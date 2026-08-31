import React, { useState, useEffect } from 'react';
import { CalendarClock, Zap, RefreshCw, User, Bell, Clock } from 'lucide-react';

interface NavbarProps {
  onPlanBlock: () => void;
  isOptimizing?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ onPlanBlock, isOptimizing = false }) => {
  const [timeStr, setTimeStr] = useState<string>('');
  const [dateStr, setDateStr] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      setDateStr(now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 px-5 py-3 shadow-xs">
      <div className="flex items-center justify-between">
        {/* Left: Product Name & Subtitle */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-sm">
            <CalendarClock className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-bold text-slate-900 tracking-tight">BLOCK PLANNER</h1>
              <span className="text-[11px] font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded">
                OPS v2.0
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Intelligent Railway Maintenance Block Planning
            </p>
          </div>
        </div>

        {/* Center/Right: Clock, Section Controller Info & Action */}
        <div className="flex items-center space-x-4">
          {/* Live Date & Time */}
          <div className="hidden sm:flex items-center space-x-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-mono text-slate-700">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span>{dateStr || '31 Aug 2026'}</span>
            <span className="text-slate-300">•</span>
            <span className="font-bold text-slate-900">{timeStr || '11:00 AM'}</span>
          </div>

          {/* Controller Badge */}
          <div className="hidden md:flex items-center space-x-2 text-xs border border-slate-200 px-3 py-1.5 rounded-lg bg-slate-50">
            <User className="w-3.5 h-3.5 text-blue-600" />
            <div>
              <div className="font-semibold text-slate-800 leading-tight">Section Controller</div>
              <div className="text-[10px] text-slate-500">Secunderabad Division (SCR)</div>
            </div>
          </div>

          {/* Quick Plan Block Button */}
          <button
            onClick={onPlanBlock}
            disabled={isOptimizing}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition-all flex items-center space-x-1.5 active:scale-95 cursor-pointer"
          >
            <Zap className={`w-3.5 h-3.5 ${isOptimizing ? 'animate-spin' : ''}`} />
            <span>{isOptimizing ? 'Optimizing...' : 'PLAN BLOCK'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
