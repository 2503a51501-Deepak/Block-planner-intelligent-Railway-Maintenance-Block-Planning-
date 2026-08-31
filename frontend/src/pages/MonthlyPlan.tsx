import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import { CalendarRange, Activity, Wrench, Zap, Signal, CheckCircle2 } from 'lucide-react';

export const MonthlyPlan: React.FC = () => {
  const [monthlyData, setMonthlyData] = useState<any>(null);

  useEffect(() => {
    api.getMonthlyPlan().then(setMonthlyData).catch(console.error);
  }, []);

  const workload = monthlyData?.department_workload || [
    { department: 'Engineering', planned_hours: 48.0, completed_hours: 32.0, target_hours: 50.0 },
    { department: 'Traction', planned_hours: 36.0, completed_hours: 24.0, target_hours: 40.0 },
    { department: 'Signal & Telecom', planned_hours: 30.0, completed_hours: 22.0, target_hours: 35.0 },
  ];

  return (
    <div className="space-y-5 animate-fadeIn pb-12">
      {/* Header */}
      <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
            <CalendarRange className="w-5 h-5 text-blue-600" />
            <span>Monthly Strategic Block Planning Overview</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Month: <strong className="text-slate-800">September 2026</strong> ? Division Workload Target vs Planned Hours
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs font-mono">
          <span className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 font-bold">
            Target Corridor Availability: 98.5%
          </span>
        </div>
      </div>

      {/* Target Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-white border border-slate-200 rounded-xl text-center font-mono shadow-2xs">
          <div className="text-xs text-slate-500">Planned Monthly Blocks</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{monthlyData?.total_planned_blocks || 38}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">September Horizon</div>
        </div>
        <div className="p-4 bg-white border border-slate-200 rounded-xl text-center font-mono shadow-2xs">
          <div className="text-xs text-slate-500">Maintenance Tasks Target</div>
          <div className="text-2xl font-bold text-blue-700 mt-1">{monthlyData?.total_maintenance_tasks || 65}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">3 Departments</div>
        </div>
        <div className="p-4 bg-white border border-slate-200 rounded-xl text-center font-mono shadow-2xs">
          <div className="text-xs text-slate-500">Critical Defect Target</div>
          <div className="text-2xl font-bold text-rose-600 mt-1">{monthlyData?.critical_tasks_target || 18}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Zero Backlog Target</div>
        </div>
        <div className="p-4 bg-white border border-slate-200 rounded-xl text-center font-mono shadow-2xs">
          <div className="text-xs text-slate-500">Projected Clearance Rate</div>
          <div className="text-2xl font-bold text-emerald-600 mt-1">{monthlyData?.projected_overdue_cleared_pct || 94.2}%</div>
          <div className="text-[11px] text-slate-400 mt-0.5">P-Way Standard Met</div>
        </div>
      </div>

      {/* Workload Distribution Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 font-mono">
            Department Monthly Maintenance Workload Hours
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 font-mono border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Planned Block Hours</th>
                <th className="py-3 px-4">Completed Hours</th>
                <th className="py-3 px-4">Monthly Target Hours</th>
                <th className="py-3 px-4 text-center">Progress %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {workload.map((w: any) => {
                const pct = Math.min(100, Math.round((w.completed_hours / w.target_hours) * 100));
                return (
                  <tr key={w.department} className="hover:bg-slate-50/75">
                    <td className="py-3.5 px-4 font-bold text-slate-900">{w.department}</td>
                    <td className="py-3.5 px-4 font-mono font-semibold text-blue-700">{w.planned_hours} hrs</td>
                    <td className="py-3.5 px-4 font-mono font-semibold text-emerald-700">{w.completed_hours} hrs</td>
                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-700">{w.target_hours} hrs</td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <div className="w-24 bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div className="bg-blue-600 h-full rounded-full" style={{ width: `${pct}%` }}></div>
                        </div>
                        <span className="font-mono font-bold text-slate-800">{pct}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
