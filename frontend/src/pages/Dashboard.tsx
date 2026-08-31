import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import { MaintenanceTask, Train, RecommendedBlock } from '../types';
import { MetricCard } from '../components/common/MetricCard';
import { CorridorMap } from '../components/network/CorridorMap';
import { PriorityBadge } from '../components/common/PriorityBadge';
import { DeptBadge } from '../components/common/DeptBadge';
import { StatusBadge } from '../components/common/StatusBadge';
import {
  Wrench,
  AlertTriangle,
  TrainTrack,
  CalendarClock,
  Plus,
  Zap,
  ArrowRight,
  Clock,
  ShieldCheck,
  Check
} from 'lucide-react';

interface DashboardProps {
  onNavigate: (tab: string) => void;
  onOpenAddTrain: () => void;
  onOpenAddStation: () => void;
  onOpenAddTask: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  onNavigate,
  onOpenAddTrain,
  onOpenAddStation,
  onOpenAddTask
}) => {
  const [tasks, setTasks] = useState<MaintenanceTask[]>([]);
  const [trains, setTrains] = useState<Train[]>([]);
  const [recommendations, setRecommendations] = useState<RecommendedBlock[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const [tList, trList, recList] = await Promise.all([
        api.getTasks(),
        api.getTrains(),
        api.getRecommendations()
      ]);
      setTasks(tList);
      setTrains(trList);
      setRecommendations(recList);
    } catch (e) {
      console.error('Failed to load dashboard data', e);
    } finally {
      setLoading(false);
    }
  };

  const pendingCount = tasks.filter((t) => t.status !== 'Completed').length;
  const criticalCount = tasks.filter((t) => t.severity === 'Critical').length;
  const todayTrainsCount = trains.length;
  const plannedBlocksCount = recommendations.length;

  const criticalTasks = tasks.filter((t) => t.severity === 'Critical' || t.severity === 'High').slice(0, 5);
  const upcomingTrains = trains.slice(0, 6);

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Action Bar */}
      <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-base font-bold text-slate-900">Section Controller Overview</h1>
          <p className="text-xs text-slate-500 font-medium">Secunderabad Division (SCR) ? Corridor Operations Control</p>
        </div>

        <div className="flex items-center space-x-2 flex-wrap gap-y-2">
          <button
            onClick={onOpenAddTrain}
            className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-200 flex items-center space-x-1 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Add Train</span>
          </button>
          <button
            onClick={onOpenAddStation}
            className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-200 flex items-center space-x-1 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Add Station</span>
          </button>
          <button
            onClick={onOpenAddTask}
            className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-200 flex items-center space-x-1 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Add Maintenance</span>
          </button>
          <button
            onClick={() => onNavigate('planner')}
            className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs flex items-center space-x-1.5 transition-all cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>PLAN BLOCK</span>
          </button>
        </div>
      </div>

      {/* 4 Compact Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          title="Pending Maintenance"
          value={pendingCount}
          subValue="Across 3 Departments"
          icon={Wrench}
          color="blue"
        />
        <MetricCard
          title="Critical Tasks"
          value={criticalCount}
          subValue="Urgent Safety Resolution"
          icon={AlertTriangle}
          trend="up"
          trendValue="High Priority"
          color="rose"
        />
        <MetricCard
          title="Today's Trains"
          value={todayTrainsCount}
          subValue="COA Scheduled Services"
          icon={TrainTrack}
          color="amber"
        />
        <MetricCard
          title="Today's Planned Blocks"
          value={plannedBlocksCount}
          subValue="Coordinated Windows"
          icon={CalendarClock}
          color="emerald"
        />
      </div>

      {/* Corridor Infrastructure Schematic */}
      <CorridorMap
        tasks={tasks}
        recommendations={recommendations}
        onSelectSection={() => onNavigate('stations')}
      />

      {/* Two Columns: Upcoming Trains & Maintenance Requiring Attention */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Upcoming Trains (6 cols) */}
        <div className="lg:col-span-6 bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <TrainTrack className="w-4 h-4 text-blue-600" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 font-mono">
                Upcoming Trains & Operations
              </h2>
            </div>
            <button
              onClick={() => onNavigate('trains')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center space-x-1 cursor-pointer"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-[10px] uppercase text-slate-500 font-mono border-b border-slate-200">
                <tr>
                  <th className="py-2 px-3">Train</th>
                  <th className="py-2 px-3">Section</th>
                  <th className="py-2 px-3">Time</th>
                  <th className="py-2 px-3">Priority</th>
                  <th className="py-2 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {upcomingTrains.map((tr) => (
                  <tr key={tr.train_id} className="hover:bg-slate-50/75">
                    <td className="py-2.5 px-3 font-semibold text-slate-900">
                      <span className="font-mono font-bold text-blue-700 mr-1.5">{tr.train_number}</span>
                      <span className="truncate">{tr.train_name}</span>
                    </td>
                    <td className="py-2.5 px-3 font-mono font-medium text-slate-700">{tr.section}</td>
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-800">{tr.arrival_time}</td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                        tr.priority === 1 ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {tr.priority === 1 ? '? Protected' : `P${tr.priority}`}
                      </span>
                    </td>
                    <td className="py-2.5 px-3"><StatusBadge status={tr.running_status || tr.expected} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Maintenance Requiring Attention (6 cols) */}
        <div className="lg:col-span-6 bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 font-mono">
                Maintenance Requiring Attention
              </h2>
            </div>
            <button
              onClick={() => onNavigate('tasks')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center space-x-1 cursor-pointer"
            >
              <span>View All Tasks</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2">
            {criticalTasks.map((t) => (
              <div key={t.task_id} className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-xs flex items-center justify-between">
                <div className="flex items-center space-x-2.5 truncate">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${t.severity === 'Critical' ? 'bg-rose-500' : 'bg-amber-500'}`}></span>
                  <div className="truncate">
                    <div className="flex items-center space-x-1.5">
                      <span className="font-mono font-bold text-blue-700">{t.task_id}</span>
                      <span className="font-bold text-slate-900 truncate">{t.task_type}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 truncate">
                      {t.section} ? {t.location}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  <DeptBadge department={t.department} showIcon={false} />
                  <PriorityBadge priority={t.severity} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Today's Block Plan Table */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <CalendarClock className="w-4 h-4 text-blue-600" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 font-mono">
              Today's Block Plan & Scheduled Maintenance Windows
            </h2>
          </div>
          <button
            onClick={() => onNavigate('planner')}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center space-x-1 cursor-pointer"
          >
            <span>Open Planner</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 font-mono border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Section</th>
                <th className="py-3 px-4">Block Time</th>
                <th className="py-3 px-4">Tasks Bundled</th>
                <th className="py-3 px-4">Departments Coordinated</th>
                <th className="py-3 px-4">Train Impact</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recommendations.slice(0, 5).map((rec) => (
                <tr key={rec.recommendation_id} className="hover:bg-slate-50/75">
                  <td className="py-3 px-4 font-bold text-slate-900 font-mono">
                    {rec.section}
                  </td>
                  <td className="py-3 px-4 font-mono font-semibold text-slate-800">
                    {rec.start_time} ? {rec.end_time} ({rec.duration_hours}h)
                  </td>
                  <td className="py-3 px-4 text-slate-700 font-medium">
                    {rec.tasks.length} task{rec.tasks.length !== 1 ? 's' : ''} ({rec.tasks.map((t) => t.task_type).join(', ')})
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex flex-wrap gap-1">
                      {rec.departments.map((d) => (
                        <DeptBadge key={d} department={d} showIcon={false} />
                      ))}
                    </div>
                  </td>
                  <td className="py-3 px-4 font-mono font-semibold">
                    <span className={rec.train_impact_score < 25 ? 'text-emerald-700' : 'text-amber-700'}>
                      {rec.train_impact_score < 25 ? 'Low Disruption' : 'Medium Disruption'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <StatusBadge status={rec.status} />
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => onNavigate('planner')}
                      className="text-xs text-blue-600 hover:text-blue-700 font-semibold cursor-pointer"
                    >
                      Review ?
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
