import React, { useState } from 'react';
import { Train, GoodsForecast, BlockAvailability, RecommendedBlock } from '../../types';
import { Clock, ShieldAlert, Sparkles, Filter } from 'lucide-react';

interface TimelineGanttProps {
  trains: Train[];
  goodsForecasts: GoodsForecast[];
  blocks: BlockAvailability[];
  recommendations: RecommendedBlock[];
  selectedSection?: string;
  onSectionChange?: (sec: string) => void;
}

export const TimelineGantt: React.FC<TimelineGanttProps> = ({
  trains,
  goodsForecasts,
  blocks,
  recommendations,
  selectedSection = 'WL-BZA',
  onSectionChange
}) => {
  const [activeSection, setActiveSection] = useState<string>(selectedSection);
  const [hoverItem, setHoverItem] = useState<any>(null);

  const sections = ['WL-BZA', 'SEC-KZJ', 'KZJ-WL', 'BZA-GNT'];

  const timeToPercent = (timeStr: string) => {
    try {
      const [h, m] = timeStr.split(':').map(Number);
      const totalMinutes = h * 60 + m;
      return (totalMinutes / 1440) * 100;
    } catch {
      return 0;
    }
  };

  const handleSecChange = (sec: string) => {
    setActiveSection(sec);
    if (onSectionChange) onSectionChange(sec);
  };

  const secTrains = trains.filter((t) => t.section === activeSection);
  const secForecasts = goodsForecasts.filter((g) => g.section === activeSection);
  const secBlocks = blocks.filter((b) => b.section === activeSection);
  const secRecs = recommendations.filter((r) => r.section === activeSection);

  const hours = Array.from({ length: 25 }, (_, i) => i);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-base font-bold text-white flex items-center space-x-2">
            <Clock className="w-5 h-5 text-blue-400" />
            <span>Corridor Timeline & Train Path Visualization</span>
          </h2>
          <p className="text-xs text-slate-400">
            24-hour Gantt chart of train paths, permitted block windows, and AI multi-department bundles.
          </p>
        </div>

        {/* Section Selector */}
        <div className="flex items-center space-x-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800">
          {sections.map((sec) => (
            <button
              key={sec}
              onClick={() => handleSecChange(sec)}
              className={`px-3 py-1 text-xs font-mono font-semibold rounded transition-all ${
                activeSection === sec
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              {sec}
            </button>
          ))}
        </div>
      </div>

      {/* Gantt Canvas */}
      <div className="mt-6 overflow-x-auto">
        <div className="min-w-[850px] relative">
          {/* Time Header Grid */}
          <div className="grid grid-cols-24 border-b border-slate-800 text-[10px] font-mono text-slate-400 pb-2">
            {hours.slice(0, 24).map((h) => (
              <div key={h} className="text-left border-l border-slate-800/60 pl-1">
                {String(h).padStart(2, '0')}:00
              </div>
            ))}
          </div>

          {/* Swimlanes */}
          <div className="space-y-4 py-4 relative">
            {/* Hour Vertical Grid Lines */}
            <div className="absolute inset-0 grid grid-cols-24 pointer-events-none z-0">
              {hours.slice(0, 24).map((h) => (
                <div key={h} className="border-l border-slate-800/40 h-full"></div>
              ))}
            </div>

            {/* Swimlane 1: Priority 1 High-Speed Trains */}
            <div className="relative z-10">
              <div className="text-[11px] font-semibold text-rose-300 mb-1 flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-400"></span>
                <span>Priority 1: High-Speed (Vande Bharat / Rajdhani)</span>
              </div>
              <div className="h-9 bg-slate-950/80 rounded-lg border border-slate-800 relative flex items-center">
                {secTrains.filter((t) => t.priority === 1).map((t) => {
                  const left = timeToPercent(t.arrival_time);
                  const right = timeToPercent(t.departure_time);
                  const width = Math.max(2.5, right - left);
                  return (
                    <div
                      key={t.train_id}
                      onMouseEnter={() => setHoverItem(t)}
                      onMouseLeave={() => setHoverItem(null)}
                      style={{ left: `${left}%`, width: `${width}%` }}
                      className="absolute h-6 bg-gradient-to-r from-rose-600 to-red-500 hover:from-rose-500 hover:to-red-400 rounded px-1.5 flex items-center shadow text-[10px] font-mono font-bold text-white truncate cursor-pointer transition-all border border-rose-400/40"
                    >
                      {t.train_number} ({t.arrival_time}-{t.departure_time})
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Swimlane 2: Passenger & Superfast Express */}
            <div className="relative z-10">
              <div className="text-[11px] font-semibold text-blue-300 mb-1 flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                <span>Priority 2 & 3: Superfast, Express & Passenger</span>
              </div>
              <div className="h-9 bg-slate-950/80 rounded-lg border border-slate-800 relative flex items-center">
                {secTrains.filter((t) => t.priority === 2 || t.priority === 3).map((t) => {
                  const left = timeToPercent(t.arrival_time);
                  const right = timeToPercent(t.departure_time);
                  const width = Math.max(2.5, right - left);
                  return (
                    <div
                      key={t.train_id}
                      onMouseEnter={() => setHoverItem(t)}
                      onMouseLeave={() => setHoverItem(null)}
                      style={{ left: `${left}%`, width: `${width}%` }}
                      className="absolute h-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded px-1.5 flex items-center shadow text-[10px] font-mono font-medium text-white truncate cursor-pointer transition-all border border-blue-400/30"
                    >
                      {t.train_number} {t.train_name.split(' ')[0]}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Swimlane 3: Goods & Freight Movement */}
            <div className="relative z-10">
              <div className="text-[11px] font-semibold text-amber-300 mb-1 flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                <span>Freight & Goods Forecast Windows</span>
              </div>
              <div className="h-9 bg-slate-950/80 rounded-lg border border-slate-800 relative flex items-center">
                {secForecasts.map((gf) => {
                  const left = timeToPercent(gf.expected_start_time);
                  const right = timeToPercent(gf.expected_end_time);
                  const width = Math.max(3, right - left);
                  return (
                    <div
                      key={gf.forecast_id}
                      onMouseEnter={() => setHoverItem(gf)}
                      onMouseLeave={() => setHoverItem(null)}
                      style={{ left: `${left}%`, width: `${width}%` }}
                      className="absolute h-6 bg-amber-950/70 border border-amber-600/60 rounded px-1.5 flex items-center shadow text-[10px] font-mono font-medium text-amber-200 truncate cursor-pointer transition-all"
                    >
                      Goods ({Math.round(gf.probability * 100)}% prob)
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Swimlane 4: Available Maintenance Block Windows */}
            <div className="relative z-10">
              <div className="text-[11px] font-semibold text-emerald-300 mb-1 flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span>Permitted Maintenance Block Windows</span>
              </div>
              <div className="h-9 bg-slate-950/80 rounded-lg border border-slate-800 relative flex items-center">
                {secBlocks.map((b) => {
                  const left = timeToPercent(b.start_time);
                  const right = timeToPercent(b.end_time);
                  const width = Math.max(3, right - left);
                  return (
                    <div
                      key={b.block_id}
                      onMouseEnter={() => setHoverItem(b)}
                      onMouseLeave={() => setHoverItem(null)}
                      style={{ left: `${left}%`, width: `${width}%` }}
                      className="absolute h-6 bg-emerald-950/40 border-2 border-dashed border-emerald-500/70 rounded px-1.5 flex items-center shadow text-[10px] font-mono font-semibold text-emerald-300 truncate cursor-pointer transition-all"
                    >
                      {b.block_id} ({b.start_time} - {b.end_time})
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Swimlane 5: AI Recommended Multi-Department Blocks */}
            <div className="relative z-10 pt-2 border-t border-slate-800/80">
              <div className="text-xs font-bold text-indigo-300 mb-1 flex items-center space-x-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>AI Recommended Multi-Department Coordinated Blocks</span>
              </div>
              <div className="h-12 bg-indigo-950/40 rounded-lg border border-indigo-500/40 relative flex items-center p-1">
                {secRecs.map((r) => {
                  const left = timeToPercent(r.start_time);
                  const right = timeToPercent(r.end_time);
                  const width = Math.max(4, right - left);
                  return (
                    <div
                      key={r.recommendation_id}
                      onMouseEnter={() => setHoverItem(r)}
                      onMouseLeave={() => setHoverItem(null)}
                      style={{ left: `${left}%`, width: `${width}%` }}
                      className="absolute h-9 bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 rounded-lg px-2 flex items-center justify-between shadow-lg shadow-emerald-900/30 text-xs font-mono font-bold text-white cursor-pointer transition-all hover:scale-105 border border-emerald-300/40"
                    >
                      <div className="flex items-center space-x-1.5 truncate">
                        <Sparkles className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                        <span className="truncate">{r.recommendation_id} ({r.departments.join(' + ')})</span>
                      </div>
                      <span className="ml-2 bg-slate-950/70 text-emerald-300 text-[10px] px-1.5 py-0.5 rounded font-mono">
                        {r.optimization_score}/100
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hover Info Tooltip */}
      {hoverItem && (
        <div className="mt-4 p-3 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-slate-300 flex items-center justify-between animate-fadeIn">
          <div>
            <span className="font-bold text-white">
              {hoverItem.train_name || hoverItem.forecast_id || hoverItem.block_id || hoverItem.recommendation_id}
            </span>
            <span className="text-slate-500 mx-2">•</span>
            <span>
              Time: {hoverItem.arrival_time ? `${hoverItem.arrival_time} → ${hoverItem.departure_time}` : `${hoverItem.start_time || hoverItem.expected_start_time} → ${hoverItem.end_time || hoverItem.expected_end_time}`}
            </span>
            {hoverItem.departments && (
              <span className="ml-3 text-emerald-400 font-sans font-semibold">
                Depts: {hoverItem.departments.join(', ')} ({hoverItem.tasks?.length} tasks bundled)
              </span>
            )}
          </div>
          {hoverItem.priority && (
            <span className="text-slate-400">Priority {hoverItem.priority}</span>
          )}
        </div>
      )}
    </div>
  );
};
