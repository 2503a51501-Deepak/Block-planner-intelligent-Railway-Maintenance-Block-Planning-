import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { MaintenanceTask, RailwaySection } from '../types';
import { PriorityBadge } from '../components/common/PriorityBadge';
import { DeptBadge } from '../components/common/DeptBadge';
import { StatusBadge } from '../components/common/StatusBadge';
import {
  Wrench,
  Search,
  Plus,
  Edit2,
  Trash2,
  AlertTriangle,
  Sparkles,
  Info,
  X
} from 'lucide-react';

export const MaintenanceTasks: React.FC = () => {
  const [tasks, setTasks] = useState<MaintenanceTask[]>([]);
  const [sections, setSections] = useState<RailwaySection[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');
  const [sevFilter, setSevFilter] = useState('All');
  const [secFilter, setSecFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // Modals
  const [selectedInspectTask, setSelectedInspectTask] = useState<MaintenanceTask | null>(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState<MaintenanceTask | null>(null);
  const [taskForm, setTaskForm] = useState<MaintenanceTask>({
    task_id: '',
    department: 'Engineering',
    asset_id: '',
    section: 'SC-KZJ',
    location: '',
    task_type: '',
    description: '',
    severity: 'High',
    asset_criticality: 'High',
    due_date: '2026-08-30',
    overdue_days: 0,
    estimated_duration_hours: 2.0,
    required_team: 'P-Way Gang 01',
    status: 'Pending',
    requires_power_block: false,
    requires_traffic_block: true
  });

  useEffect(() => {
    loadTasks();
  }, [deptFilter, sevFilter, secFilter, statusFilter]);

  const loadTasks = async () => {
    setLoading(true);
    try {
      const [data, secList] = await Promise.all([
        api.getTasks({
          department: deptFilter,
          severity: sevFilter,
          section: secFilter,
          status: statusFilter,
          search: search
        }),
        api.getSections()
      ]);
      setTasks(data);
      setSections(secList);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadTasks();
  };

  const handleOpenAddTask = () => {
    setEditingTask(null);
    setTaskForm({
      task_id: '',
      department: 'Engineering',
      asset_id: `TRK-${secFilter !== 'All' ? secFilter : 'SC-KZJ'}-${Math.floor(100 + Math.random() * 900)}`,
      section: secFilter !== 'All' ? secFilter : 'SC-KZJ',
      location: 'Km 100/10-15 Up Main',
      task_type: 'Track Tamping & Lining',
      description: 'Scheduled preventive alignment correction.',
      severity: 'High',
      asset_criticality: 'High',
      due_date: '2026-08-30',
      overdue_days: 0,
      estimated_duration_hours: 2.0,
      required_team: 'P-Way Gang 01',
      status: 'Pending',
      requires_power_block: false,
      requires_traffic_block: true
    });
    setShowTaskModal(true);
  };

  const handleOpenEditTask = (t: MaintenanceTask) => {
    setEditingTask(t);
    setTaskForm({ ...t });
    setShowTaskModal(true);
  };

  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingTask) {
        await api.updateTask(editingTask.task_id, taskForm);
      } else {
        await api.createTask(taskForm);
      }
      setShowTaskModal(false);
      loadTasks();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteTask = async (id: string) => {
    if (!confirm(`Are you sure you want to delete maintenance task ${id}?`)) return;
    try {
      await api.deleteTask(id);
      loadTasks();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-5 animate-fadeIn pb-12">
      {/* Header */}
      <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
            <Wrench className="w-5 h-5 text-blue-600" />
            <span>Integrated Maintenance Requirements</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Cross-department maintenance queue spanning Engineering (Track/TMS), Traction Distribution (TDMS), and Signal & Telecom (SMMS).
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleOpenAddTask}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs flex items-center space-x-1.5 transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Maintenance Task</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-slate-200 p-3.5 rounded-xl shadow-2xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <form onSubmit={handleSearch} className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by Task ID, Asset, Location, or Defect description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500"
          />
        </form>

        <div className="flex items-center space-x-2 w-full md:w-auto overflow-x-auto">
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-xs text-slate-700 rounded-lg px-3 py-1.5 focus:outline-none focus:border-blue-500 font-medium"
          >
            <option value="All">All Departments</option>
            <option value="Engineering">Engineering (Track / TMS)</option>
            <option value="Traction">Traction (OHE / TDMS)</option>
            <option value="Signal & Telecom">Signal & Telecom (SMMS)</option>
          </select>

          <select
            value={sevFilter}
            onChange={(e) => setSevFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-xs text-slate-700 rounded-lg px-3 py-1.5 focus:outline-none focus:border-blue-500 font-medium"
          >
            <option value="All">All Severities</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>

          <select
            value={secFilter}
            onChange={(e) => setSecFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-xs text-slate-700 rounded-lg px-3 py-1.5 focus:outline-none focus:border-blue-500 font-medium"
          >
            <option value="All">All Sections</option>
            {sections.map((s) => (
              <option key={s.section_id} value={s.section_id}>{s.section_id}</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-xs text-slate-700 rounded-lg px-3 py-1.5 focus:outline-none focus:border-blue-500 font-medium"
          >
            <option value="All">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Overdue">Overdue</option>
            <option value="Scheduled">Scheduled</option>
            <option value="Completed">Completed</option>
          </select>
        </div>
      </div>

      {/* Task Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 font-mono border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Task ID</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Section & Location</th>
                <th className="py-3 px-4">Defect / Activity</th>
                <th className="py-3 px-4">Severity</th>
                <th className="py-3 px-4">Overdue</th>
                <th className="py-3 px-4">Duration</th>
                <th className="py-3 px-4">Priority Score</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tasks.map((t) => (
                <tr key={t.task_id} className="hover:bg-slate-50/75 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-blue-700">
                    {t.task_id}
                  </td>
                  <td className="py-3 px-4">
                    <DeptBadge department={t.department} />
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-mono font-semibold text-slate-900">{t.section}</div>
                    <div className="text-[11px] text-slate-500 truncate max-w-xs">{t.location}</div>
                  </td>
                  <td className="py-3 px-4 max-w-xs">
                    <div className="font-bold text-slate-900 truncate">{t.task_type}</div>
                    <div className="text-[11px] text-slate-500 truncate">{t.description}</div>
                  </td>
                  <td className="py-3 px-4">
                    <PriorityBadge priority={t.severity} />
                  </td>
                  <td className="py-3 px-4 font-mono">
                    {t.overdue_days > 0 ? (
                      <span className="text-rose-600 font-bold flex items-center">
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        +{t.overdue_days}d
                      </span>
                    ) : (
                      <span className="text-slate-400">On Track</span>
                    )}
                  </td>
                  <td className="py-3 px-4 font-mono font-semibold text-slate-800">
                    {t.estimated_duration_hours}h
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-blue-700">
                    {t.priority_score ? t.priority_score.toFixed(0) : '50'}/100
                  </td>
                  <td className="py-3 px-4">
                    <StatusBadge status={t.status} />
                  </td>
                  <td className="py-3 px-4 text-right space-x-1">
                    <button
                      onClick={() => setSelectedInspectTask(t)}
                      className="p-1.5 rounded hover:bg-blue-50 text-blue-600 hover:text-blue-700 transition-colors cursor-pointer"
                      title="Inspect AI Score"
                    >
                      <Info className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleOpenEditTask(t)}
                      className="p-1.5 rounded hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                      title="Edit Task"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteTask(t.task_id)}
                      className="p-1.5 rounded hover:bg-rose-50 text-rose-500 hover:text-rose-700 transition-colors cursor-pointer"
                      title="Delete Task"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Priority Scoring Inspector Modal */}
      {selectedInspectTask && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-xl overflow-hidden animate-fadeIn">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <span>Priority Scoring Formula: {selectedInspectTask.task_id}</span>
              </h3>
              <button onClick={() => setSelectedInspectTask(null)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="text-slate-500 font-semibold">{selectedInspectTask.department} ? {selectedInspectTask.section}</div>
                  <div className="text-sm font-bold text-slate-900 mt-0.5">{selectedInspectTask.task_type}</div>
                </div>
                <div className="text-right">
                  <div className="text-slate-500">Score</div>
                  <div className="text-2xl font-bold font-mono text-blue-600">
                    {selectedInspectTask.priority_score ? selectedInspectTask.priority_score.toFixed(0) : '50'}/100
                  </div>
                </div>
              </div>

              <div className="space-y-2 bg-slate-50 p-3.5 rounded-xl border border-slate-200 font-mono">
                <div className="flex justify-between">
                  <span>Severity Weight (35%)</span>
                  <span className="font-bold text-blue-700">
                    +{selectedInspectTask.score_breakdown?.severity_contribution ? selectedInspectTask.score_breakdown.severity_contribution.toFixed(1) : '35.0'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Asset Criticality (25%)</span>
                  <span className="font-bold text-blue-700">
                    +{selectedInspectTask.score_breakdown?.criticality_contribution ? selectedInspectTask.score_breakdown.criticality_contribution.toFixed(1) : '25.0'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Overdue Penalty (20%)</span>
                  <span className="font-bold text-blue-700">
                    +{selectedInspectTask.score_breakdown?.overdue_contribution ? selectedInspectTask.score_breakdown.overdue_contribution.toFixed(1) : '15.0'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Corridor Traffic Density (20%)</span>
                  <span className="font-bold text-blue-700">
                    +{selectedInspectTask.score_breakdown?.impact_contribution ? selectedInspectTask.score_breakdown.impact_contribution.toFixed(1) : '18.0'}
                  </span>
                </div>
                <div className="pt-2 border-t border-slate-200 flex justify-between font-bold text-slate-900">
                  <span>Total Calculated Priority</span>
                  <span>
                    {selectedInspectTask.priority_score ? selectedInspectTask.priority_score.toFixed(1) : '50.0'} ({selectedInspectTask.priority_level || 'High'})
                  </span>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-slate-800 uppercase tracking-wider mb-2 font-mono">Contributing Reasons</h4>
                <ul className="space-y-1.5 text-slate-600">
                  {selectedInspectTask.score_reasons?.map((r, i) => (
                    <li key={i} className="flex items-start space-x-2 bg-slate-50 p-2 rounded border border-slate-200">
                      <span className="text-blue-600 font-bold">?</span>
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setSelectedInspectTask(null)}
                  className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Task Modal */}
      {showTaskModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-xl overflow-hidden animate-fadeIn">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <Wrench className="w-4 h-4 text-blue-600" />
                <span>{editingTask ? 'Edit Maintenance Task' : 'Add Maintenance Task'}</span>
              </h3>
              <button onClick={() => setShowTaskModal(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTask} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Department</label>
                  <select
                    value={taskForm.department}
                    onChange={(e) => setTaskForm({ ...taskForm, department: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-medium"
                  >
                    <option value="Engineering">Engineering (Track / TMS)</option>
                    <option value="Traction">Traction (OHE / TDMS)</option>
                    <option value="Signal & Telecom">Signal & Telecom (SMMS)</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Railway Section</label>
                  <select
                    value={taskForm.section}
                    onChange={(e) => setTaskForm({ ...taskForm, section: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-mono"
                  >
                    {sections.map((s) => (
                      <option key={s.section_id} value={s.section_id}>{s.section_id}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Asset ID *</label>
                  <input
                    type="text"
                    required
                    value={taskForm.asset_id}
                    onChange={(e) => setTaskForm({ ...taskForm, asset_id: e.target.value })}
                    placeholder="e.g. TRK-WL-142"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Location Details *</label>
                  <input
                    type="text"
                    required
                    value={taskForm.location}
                    onChange={(e) => setTaskForm({ ...taskForm, location: e.target.value })}
                    placeholder="e.g. Km 142/10 Up Main"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Defect / Maintenance Activity Type *</label>
                <input
                  type="text"
                  required
                  value={taskForm.task_type}
                  onChange={(e) => setTaskForm({ ...taskForm, task_type: e.target.value })}
                  placeholder="e.g. USFD Rail Flaw Defect"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-semibold"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Description & Defect Details</label>
                <textarea
                  rows={2}
                  value={taskForm.description}
                  onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                  placeholder="Details regarding the defect, equipment condition, or inspection finding."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2"
                />
              </div>

              <div className="grid grid-cols-4 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Severity</label>
                  <select
                    value={taskForm.severity}
                    onChange={(e) => setTaskForm({ ...taskForm, severity: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2"
                  >
                    <option value="Critical">Critical</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Duration (hrs)</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    max="8"
                    value={taskForm.estimated_duration_hours}
                    onChange={(e) => setTaskForm({ ...taskForm, estimated_duration_hours: parseFloat(e.target.value) || 1.0 })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Overdue Days</label>
                  <input
                    type="number"
                    min="0"
                    value={taskForm.overdue_days}
                    onChange={(e) => setTaskForm({ ...taskForm, overdue_days: parseInt(e.target.value) || 0 })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Status</label>
                  <select
                    value={taskForm.status}
                    onChange={(e) => setTaskForm({ ...taskForm, status: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Overdue">Overdue</option>
                    <option value="Scheduled">Scheduled</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Assigned Team / Maintenance Gang</label>
                <input
                  type="text"
                  value={taskForm.required_team}
                  onChange={(e) => setTaskForm({ ...taskForm, required_team: e.target.value })}
                  placeholder="e.g. P-Way Gang 04 (Warangal)"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowTaskModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-xs cursor-pointer"
                >
                  {editingTask ? 'Save Changes' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
