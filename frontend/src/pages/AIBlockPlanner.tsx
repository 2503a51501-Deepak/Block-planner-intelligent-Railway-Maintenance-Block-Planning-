import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import {
  OptimizationConfig,
  RecommendedBlock,
  MaintenanceTask,
  Train,
  RailwaySection,
  ManualBlockRequest
} from '../types';
import {
  CalendarClock,
  Zap,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Check,
  X,
  Plus,
  TrainTrack,
  Info,
  Sparkles,
  Wrench
} from 'lucide-react';
import { PriorityBadge } from '../components/common/PriorityBadge';
import { DeptBadge } from '../components/common/DeptBadge';
import { StatusBadge } from '../components/common/StatusBadge';

export const AIBlockPlanner: React.FC = () => {
  const [horizon, setHorizon] = useState<'Daily' | 'Weekly' | 'Monthly'>('Daily');
  const [selectedDate, setSelectedDate] = useState('2026-08-30');
  const [selectedSection, setSelectedSection] = useState('WL-BZA');
  const [windowStartTime, setWindowStartTime] = useState('13:00');
  const [windowEndTime, setWindowEndTime] = useState('15:00');

  // Loaded section data
  const [sections, setSections] = useState<RailwaySection[]>([]);
  const [sectionTrains, setSectionTrains] = useState<Train[]>([]);
  const [sectionTasks, setSectionTasks] = useState<MaintenanceTask[]>([]);
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [recommendations, setRecommendations] = useState<RecommendedBlock[]>([]);
  const [isOptimizing, setIsOptimizing] = useState(false);

  // Manual Block Modal
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualForm, setManualForm] = useState<ManualBlockRequest>({
    date: '2026-08-30',
    section: 'WL-BZA',
    start_time: '13:00',
    end_time: '15:00',
    task_ids: [],
    remarks: ''
  });
  const [manualValidation, setManualValidation] = useState<any>(null);
  const [isValidatingManual, setIsValidatingManual] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    loadSectionData();
  }, [selectedSection, selectedDate]);

  const loadInitialData = async () => {
    try {
      const [secList, recList] = await Promise.all([
        api.getSections(),
        api.getRecommendations()
      ]);
      setSections(secList);
      if (secList.length > 0) {
        setSelectedSection(secList[0].section_id);
      }
      setRecommendations(recList);
    } catch (e) {
      console.error(e);
    }
  };

  const loadSectionData = async () => {
    try {
      const [trList, tList] = await Promise.all([
        api.getTrains({ section: selectedSection }),
        api.getTasks({ section: selectedSection })
      ]);
      setSectionTrains(trList);
      setSectionTasks(tList);
      setSelectedTaskIds(tList.map((t) => t.task_id));
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleTask = (taskId: string) => {
    if (selectedTaskIds.includes(taskId)) {
      setSelectedTaskIds(selectedTaskIds.filter((id) => id !== taskId));
    } else {
      setSelectedTaskIds([...selectedTaskIds, taskId]);
    }
  };

  const handleSelectAllTasks = () => {
    if (selectedTaskIds.length === sectionTasks.length) {
      setSelectedTaskIds([]);
    } else {
      setSelectedTaskIds(sectionTasks.map((t) => t.task_id));
    }
  };

  const handleGenerateBlockPlan = async () => {
    setIsOptimizing(true);
    try {
      const config: OptimizationConfig = {
        horizon: horizon,
        target_date: selectedDate,
        section_filter: selectedSection,
        selected_task_ids: selectedTaskIds,
        train_disruption_tolerance: 'Medium',
        enable_multi_dept_grouping: true
      };
      const res = await api.runOptimization(config);
      setRecommendations(res.recommendations);
    } catch (e: any) {
      alert(`Optimization error: ${e.message}`);
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleAcceptBlock = async (id: string) => {
    try {
      await api.acceptRecommendation(id);
      setRecommendations((prev) =>
        prev.map((r) => (r.recommendation_id === id ? { ...r, status: 'Accepted' } : r))
      );
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleRejectBlock = async (id: string) => {
    try {
      await api.rejectRecommendation(id);
      setRecommendations((prev) =>
        prev.map((r) => (r.recommendation_id === id ? { ...r, status: 'Rejected' } : r))
      );
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleOpenManualBlock = () => {
    setManualForm({
      date: selectedDate,
      section: selectedSection,
      start_time: windowStartTime,
      end_time: windowEndTime,
      task_ids: selectedTaskIds.slice(0, 3),
      remarks: 'Controller scheduled coordinated corridor maintenance block.'
    });
    setManualValidation(null);
    setShowManualModal(true);
  };

  const handleValidateManual = async () => {
    setIsValidatingManual(true);
    try {
      const val = await api.validateManualBlock(manualForm);
      setManualValidation(val);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setIsValidatingManual(false);
    }
  };

  const handleSaveManualBlock = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newRec = await api.createManualBlock(manualForm);
      setRecommendations([newRec, ...recommendations]);
      setShowManualModal(false);
      alert('Manual maintenance block successfully scheduled!');
    } catch (err: any) {
      alert(err.message);
    }
  };

  const currentSectionObj = sections.find((s) => s.section_id === selectedSection);

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header */}
      <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-blue-600 text-xs font-mono font-bold uppercase mb-0.5">
            <CalendarClock className="w-4 h-4" />
            <span>Operational Decision Support</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900">
            Corridor Maintenance Block Planner
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Align Track (TMS), Traction (TDMS), and Signaling (SMMS) tasks into synchronized corridor windows with minimal train delays.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={handleOpenManualBlock}
            className="px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-200 flex items-center space-x-1.5 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Create Manual Block</span>
          </button>
        </div>
      </div>

      {/* Controller Planning Controls Strip */}
      <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono">
            1. Configure Corridor Parameters & Target Date
          </h2>
          {/* Horizon Selector */}
          <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
            {(['Daily', 'Weekly', 'Monthly'] as const).map((h) => (
              <button
                key={h}
                onClick={() => setHorizon(h)}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                  horizon === h
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {h === 'Daily' ? 'Today' : h === 'Weekly' ? 'Week' : 'Month'}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-mono font-bold text-slate-800 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Railway Section</label>
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-semibold text-slate-800 focus:outline-none focus:border-blue-500 font-mono"
            >
              {sections.map((s) => (
                <option key={s.section_id} value={s.section_id}>
                  {s.section_id} ({s.from_station} ? {s.to_station})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Available Window Start</label>
            <input
              type="time"
              value={windowStartTime}
              onChange={(e) => setWindowStartTime(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-mono font-bold text-slate-800 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Available Window End</label>
            <input
              type="time"
              value={windowEndTime}
              onChange={(e) => setWindowEndTime(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-mono font-bold text-slate-800 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {currentSectionObj && (
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-600 flex flex-wrap items-center justify-between gap-2 font-mono">
            <div>
              <span>Corridor: <strong>{currentSectionObj.from_station} ? {currentSectionObj.to_station}</strong></span>
              <span className="mx-2 text-slate-300">|</span>
              <span>Distance: <strong>{currentSectionObj.distance_km} km</strong></span>
              <span className="mx-2 text-slate-300">|</span>
              <span>Tracks: <strong>{currentSectionObj.tracks_count}</strong></span>
            </div>
            <div className="flex items-center space-x-1.5 text-emerald-700 font-semibold">
              <ShieldCheck className="w-4 h-4" />
              <span>Safety constraints enforced</span>
            </div>
          </div>
        )}
      </div>

      {/* Middle Grid: Trains & Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Scheduled Trains */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center space-x-1.5">
              <TrainTrack className="w-4 h-4 text-blue-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 font-mono">
                Scheduled Trains ({sectionTrains.length})
              </h3>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">COA Timetable</span>
          </div>

          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {sectionTrains.map((tr) => (
              <div key={tr.train_id} className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-xs flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-1.5">
                    <span className="font-mono font-bold text-blue-700">{tr.train_number}</span>
                    <span className="font-bold text-slate-800 truncate">{tr.train_name}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                    {tr.arrival_time} ? {tr.departure_time} ({tr.train_type})
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold shrink-0 ${
                  tr.priority === 1 ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                  tr.priority === 2 ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                  'bg-slate-100 text-slate-600'
                }`}>
                  {tr.priority === 1 ? '? Protected' : `Prio ${tr.priority}`}
                </span>
              </div>
            ))}
            {sectionTrains.length === 0 && (
              <div className="p-4 text-center text-xs text-slate-400 font-mono">No scheduled trains on this section.</div>
            )}
          </div>
        </div>

        {/* Maintenance Tasks Queue */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center space-x-1.5">
              <Wrench className="w-4 h-4 text-blue-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 font-mono">
                Eligible Section Maintenance Tasks ({sectionTasks.length})
              </h3>
            </div>
            <button
              onClick={handleSelectAllTasks}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 cursor-pointer"
            >
              {selectedTaskIds.length === sectionTasks.length ? 'Deselect All' : 'Select All'}
            </button>
          </div>

          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {sectionTasks.map((t) => {
              const isChecked = selectedTaskIds.includes(t.task_id);
              return (
                <div
                  key={t.task_id}
                  onClick={() => handleToggleTask(t.task_id)}
                  className={`p-2.5 rounded-lg border text-xs flex items-center justify-between cursor-pointer transition-all ${
                    isChecked
                      ? 'bg-blue-50/70 border-blue-200'
                      : 'bg-slate-50 border-slate-200 opacity-60'
                  }`}
                >
                  <div className="flex items-center space-x-2.5 truncate">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {}}
                      className="rounded text-blue-600 focus:ring-0 cursor-pointer"
                    />
                    <div className="truncate">
                      <div className="flex items-center space-x-1.5">
                        <span className="font-mono font-bold text-blue-700">{t.task_id}</span>
                        <span className="font-bold text-slate-900 truncate">{t.task_type}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 truncate mt-0.5">
                        {t.location} ? {t.required_team}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    <DeptBadge department={t.department} showIcon={false} />
                    <PriorityBadge priority={t.severity} />
                    <span className="font-mono font-bold text-slate-700">{t.estimated_duration_hours}h</span>
                  </div>
                </div>
              );
            })}
            {sectionTasks.length === 0 && (
              <div className="p-4 text-center text-xs text-slate-400 font-mono">No pending maintenance tasks on this section.</div>
            )}
          </div>
        </div>
      </div>

      {/* Large Primary Execution Trigger */}
      <div className="flex justify-center pt-2">
        <button
          onClick={handleGenerateBlockPlan}
          disabled={isOptimizing || sectionTasks.length === 0}
          className="w-full max-w-md py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold shadow-md shadow-blue-500/20 flex items-center justify-center space-x-2 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
        >
          <Zap className={`w-5 h-5 ${isOptimizing ? 'animate-spin' : 'text-amber-300 fill-amber-300'}`} />
          <span>{isOptimizing ? 'CALCULATING OPTIMAL BLOCK...' : 'GENERATE BLOCK PLAN'}</span>
        </button>
      </div>

      {/* Results Section */}
      <div className="space-y-4 pt-4 border-t border-slate-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span>Recommended Maintenance Blocks</span>
            </h2>
            <p className="text-xs text-slate-500">
              Optimal multi-department maintenance windows selected to minimize train disruption.
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-slate-600">
            {recommendations.length} Recommended Block{recommendations.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Recommended Block Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recommendations.map((rec) => (
            <div
              key={rec.recommendation_id}
              className={`p-5 rounded-xl border transition-all ${
                rec.status === 'Accepted'
                  ? 'bg-emerald-50/30 border-emerald-300 shadow-xs'
                  : rec.status === 'Rejected'
                  ? 'bg-slate-50 border-slate-200 opacity-60'
                  : 'bg-white border-slate-200 shadow-2xs hover:shadow-xs'
              }`}
            >
              {/* Card Header */}
              <div className="flex items-start justify-between pb-3 border-b border-slate-100">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      RECOMMENDED BLOCK
                    </span>
                    <span className="text-sm font-bold text-slate-900">{rec.section}</span>
                  </div>
                  <div className="text-xs text-slate-500 mt-1 font-mono">
                    Date: <strong className="text-slate-800">{rec.date}</strong> ? Time: <strong className="text-slate-800">{rec.start_time} ? {rec.end_time}</strong> ({rec.duration_hours}h)
                  </div>
                </div>

                <StatusBadge status={rec.status} />
              </div>

              {/* Maintenance Activities */}
              <div className="mt-3 space-y-2">
                <div className="text-xs font-semibold text-slate-700">Maintenance Activities:</div>
                <div className="space-y-1.5 bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-xs">
                  {rec.tasks.map((t) => (
                    <div key={t.task_id} className="flex items-center justify-between text-slate-800">
                      <div className="flex items-center space-x-2 truncate">
                        <span className="text-blue-600 font-bold">?</span>
                        <span className="font-semibold truncate">{t.task_type}</span>
                        <span className="text-slate-400">?</span>
                        <span className={`text-[11px] font-bold ${t.severity === 'Critical' ? 'text-rose-600' : 'text-amber-600'}`}>
                          {t.severity}
                        </span>
                      </div>
                      <span className="font-mono text-slate-500 font-semibold">{t.estimated_duration_hours}h</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Departments & Train Impact */}
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <div className="text-[11px] text-slate-500 font-semibold mb-1">Departments:</div>
                  <div className="flex flex-wrap gap-1">
                    {rec.departments.map((d) => (
                      <DeptBadge key={d} department={d} showIcon={false} />
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-slate-500 font-semibold mb-1">Train Impact:</div>
                  <div className="font-bold text-slate-800 font-mono">
                    <span className={rec.train_impact_score < 25 ? 'text-emerald-600' : 'text-amber-600'}>
                      {rec.train_impact_score < 25 ? 'Low' : 'Moderate'}
                    </span>
                    <span className="text-slate-400 text-[11px] ml-1.5">({Math.round(rec.train_impact_score)} disruption)</span>
                  </div>
                </div>
              </div>

              {/* Why This Block Reason Section */}
              <div className="mt-3.5 p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1.5">
                <div className="font-bold text-slate-800 flex items-center space-x-1.5">
                  <Info className="w-3.5 h-3.5 text-blue-600" />
                  <span>Why this block?</span>
                </div>
                <ul className="space-y-1 text-slate-600">
                  {rec.reasons.map((r, i) => (
                    <li key={i} className="flex items-start space-x-1.5">
                      <span className="text-blue-600 font-bold">?</span>
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                {rec.status !== 'Accepted' && (
                  <button
                    onClick={() => handleAcceptBlock(rec.recommendation_id)}
                    className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center space-x-1 shadow-2xs transition-all active:scale-95 cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>ACCEPT BLOCK</span>
                  </button>
                )}

                {rec.status !== 'Rejected' && (
                  <button
                    onClick={() => handleRejectBlock(rec.recommendation_id)}
                    className="px-4 py-1.5 rounded-lg bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 border border-slate-200 text-xs font-bold flex items-center space-x-1 transition-all active:scale-95 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>REJECT</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Manual Block Creation Modal */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-xl overflow-hidden animate-fadeIn">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <CalendarClock className="w-4 h-4 text-blue-600" />
                <span>Create Manual Maintenance Block</span>
              </h3>
              <button onClick={() => setShowManualModal(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveManualBlock} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Date *</label>
                  <input
                    type="date"
                    required
                    value={manualForm.date}
                    onChange={(e) => setManualForm({ ...manualForm, date: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Section *</label>
                  <select
                    value={manualForm.section}
                    onChange={(e) => setManualForm({ ...manualForm, section: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-mono font-bold"
                  >
                    {sections.map((s) => (
                      <option key={s.section_id} value={s.section_id}>{s.section_id}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Start Time *</label>
                  <input
                    type="time"
                    required
                    value={manualForm.start_time}
                    onChange={(e) => setManualForm({ ...manualForm, start_time: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">End Time *</label>
                  <input
                    type="time"
                    required
                    value={manualForm.end_time}
                    onChange={(e) => setManualForm({ ...manualForm, end_time: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Maintenance Tasks to Include</label>
                <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg max-h-32 overflow-y-auto space-y-1">
                  {sectionTasks.map((t) => {
                    const isSelected = manualForm.task_ids.includes(t.task_id);
                    return (
                      <label key={t.task_id} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setManualForm({ ...manualForm, task_ids: [...manualForm.task_ids, t.task_id] });
                            } else {
                              setManualForm({ ...manualForm, task_ids: manualForm.task_ids.filter((id) => id !== t.task_id) });
                            }
                          }}
                          className="rounded text-blue-600"
                        />
                        <span className="font-mono font-bold text-blue-700">{t.task_id}</span>
                        <span className="truncate">{t.task_type} ({t.estimated_duration_hours}h)</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Controller Remarks</label>
                <input
                  type="text"
                  value={manualForm.remarks || ''}
                  onChange={(e) => setManualForm({ ...manualForm, remarks: e.target.value })}
                  placeholder="Operational authorization remarks"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2"
                />
              </div>

              {/* Validation Check Button & Results */}
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800">Safety & Conflict Verification</span>
                  <button
                    type="button"
                    onClick={handleValidateManual}
                    disabled={isValidatingManual}
                    className="px-3 py-1 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded font-semibold cursor-pointer"
                  >
                    {isValidatingManual ? 'Checking...' : 'Check Conflicts'}
                  </button>
                </div>

                {manualValidation && (
                  <div className="text-xs space-y-1">
                    <div className={`font-bold flex items-center space-x-1 ${manualValidation.is_feasible ? 'text-emerald-700' : 'text-rose-700'}`}>
                      {manualValidation.is_feasible ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertTriangle className="w-4 h-4 text-rose-600" />}
                      <span>{manualValidation.is_feasible ? 'Safety Verified ? Block is Feasible' : 'Conflicts Detected'}</span>
                    </div>

                    {manualValidation.conflicts?.map((c: string, i: number) => (
                      <div key={i} className="text-rose-600 font-medium pl-5">? {c}</div>
                    ))}
                    {manualValidation.warnings?.map((w: string, i: number) => (
                      <div key={i} className="text-amber-600 font-medium pl-5">? {w}</div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowManualModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-xs cursor-pointer"
                >
                  Confirm & Schedule Block
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
