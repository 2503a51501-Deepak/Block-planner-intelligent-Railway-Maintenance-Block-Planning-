import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import { RecommendedBlock } from '../types';
import { CalendarDays, Clock, Layers, Check, X, Edit2 } from 'lucide-react';
import { DeptBadge } from '../components/common/DeptBadge';
import { PriorityBadge } from '../components/common/PriorityBadge';
import { StatusBadge } from '../components/common/StatusBadge';

export const WeeklyPlan: React.FC = () => {
  const [weeklyData, setWeeklyData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWeekly();
  }, []);

  const loadWeekly = async () => {
    try {
      const data = await api.getWeeklyPlan();
      setWeeklyData(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const schedule = weeklyData?.weekly_schedule || [];

  return (
    <div className="space-y-5 animate-fadeIn pb-12">
      {/* Header */}
      <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
            <CalendarDays className="w-5 h-5 text-blue-600" />
            <span>Weekly Division Block Planning Schedule</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            7-day rolling maintenance program across Secunderabad Division corridor sections.
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs font-mono">
          <span className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 font-bold">
            Total Weekly Blocks: {weeklyData?.total_blocks || 12}
          </span>
        </div>
      </div>

      {/* Weekly Schedule Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 font-mono">
            Weekly Block Window Allocations
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 font-mono border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Date / Day</th>
                <th className="py-3 px-4">Section</th>
                <th className="py-3 px-4">Block Window</th>
                <th className="py-3 px-4">Maintenance Tasks</th>
                <th className="py-3 px-4">Departments</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {schedule.map((day: any) =>
                day.blocks?.map((blk: RecommendedBlock, bIdx: number) => (
                  <tr key={`${day.date}-${blk.recommendation_id || bIdx}`} className="hover:bg-slate-50/75">
                    <td className="py-3 px-4 font-mono">
                      <div className="font-bold text-slate-900">{day.day_label}</div>
                      <div className="text-[11px] text-slate-500">{day.date}</div>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-blue-700">
                      {blk.section}
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold text-slate-800">
                      {blk.start_time} ? {blk.end_time} ({blk.duration_hours}h)
                    </td>
                    <td className="py-3 px-4 text-slate-800">
                      <div className="font-medium truncate max-w-xs">
                        {blk.tasks?.map((t) => t.task_type).join(', ') || 'Scheduled maintenance'}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">{blk.tasks?.length || 0} tasks bundled</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1">
                        {blk.departments?.map((d) => (
                          <DeptBadge key={d} department={d} showIcon={false} />
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <StatusBadge status={blk.status || 'Accepted'} />
                    </td>
                    <td className="py-3 px-4 text-right space-x-1 font-semibold text-slate-600">
                      <button className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs cursor-pointer">
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
