import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { Train, RailwaySection } from '../types';
import {
  TrainTrack,
  Plus,
  Search,
  Edit2,
  Trash2,
  X
} from 'lucide-react';
import { StatusBadge } from '../components/common/StatusBadge';

export const Trains: React.FC = () => {
  const [trains, setTrains] = useState<Train[]>([]);
  const [sections, setSections] = useState<RailwaySection[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [sectionFilter, setSectionFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [editingTrain, setEditingTrain] = useState<Train | null>(null);
  const [trainForm, setTrainForm] = useState<Train>({
    train_id: '',
    train_number: '',
    train_name: '',
    train_type: 'Express',
    origin_station: 'Secunderabad',
    destination_station: 'Vijayawada',
    section: 'SC-KZJ',
    arrival_time: '10:00',
    departure_time: '11:15',
    date: '2026-08-30',
    priority: 2,
    priority_label: 'High',
    direction: 'Down',
    running_status: 'Scheduled',
    expected: 'On Time',
    remarks: ''
  });

  useEffect(() => {
    loadData();
  }, [sectionFilter, typeFilter, statusFilter]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [trList, secList] = await Promise.all([
        api.getTrains({
          search,
          section: sectionFilter,
          train_type: typeFilter,
          running_status: statusFilter
        }),
        api.getSections()
      ]);
      setTrains(trList);
      setSections(secList);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  const handleOpenAddTrain = () => {
    setEditingTrain(null);
    setTrainForm({
      train_id: '',
      train_number: '',
      train_name: '',
      train_type: 'Express',
      origin_station: 'Secunderabad',
      destination_station: 'Vijayawada',
      section: sections[0]?.section_id || 'SC-KZJ',
      arrival_time: '10:00',
      departure_time: '11:15',
      date: '2026-08-30',
      priority: 2,
      priority_label: 'High',
      direction: 'Down',
      running_status: 'Scheduled',
      expected: 'On Time',
      remarks: ''
    });
    setShowModal(true);
  };

  const handleOpenEditTrain = (tr: Train) => {
    setEditingTrain(tr);
    setTrainForm({ ...tr });
    setShowModal(true);
  };

  const handleSaveTrain = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingTrain) {
        await api.updateTrain(editingTrain.train_id, trainForm);
      } else {
        await api.createTrain(trainForm);
      }
      setShowModal(false);
      loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteTrain = async (id: string) => {
    if (!confirm(`Are you sure you want to delete train ${id}?`)) return;
    try {
      await api.deleteTrain(id);
      loadData();
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
            <TrainTrack className="w-5 h-5 text-blue-600" />
            <span>Train Operations & Timetable Management</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Control Office Application (COA) passenger timetables, freight movements, and train priority rules.
          </p>
        </div>

        <button
          onClick={handleOpenAddTrain}
          className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs flex items-center space-x-1.5 transition-all active:scale-95 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>+ Add Train</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-slate-200 p-3.5 rounded-xl shadow-2xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by Train Number, Name, Origin, or Destination..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500"
          />
        </form>

        <div className="flex items-center space-x-2 w-full md:w-auto overflow-x-auto">
          <select
            value={sectionFilter}
            onChange={(e) => setSectionFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-xs text-slate-700 rounded-lg px-3 py-1.5 focus:outline-none focus:border-blue-500 font-medium"
          >
            <option value="All">All Sections</option>
            {sections.map((s) => (
              <option key={s.section_id} value={s.section_id}>{s.section_id}</option>
            ))}
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-xs text-slate-700 rounded-lg px-3 py-1.5 focus:outline-none focus:border-blue-500 font-medium"
          >
            <option value="All">All Train Types</option>
            <option value="Express">Express</option>
            <option value="Superfast">Superfast</option>
            <option value="Passenger">Passenger</option>
            <option value="MEMU">MEMU</option>
            <option value="DEMU">DEMU</option>
            <option value="Goods">Goods</option>
            <option value="Special">Special</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-xs text-slate-700 rounded-lg px-3 py-1.5 focus:outline-none focus:border-blue-500 font-medium"
          >
            <option value="All">All Statuses</option>
            <option value="Scheduled">Scheduled</option>
            <option value="Delayed">Delayed</option>
            <option value="Cancelled">Cancelled</option>
            <option value="Completed">Completed</option>
          </select>
        </div>
      </div>

      {/* Train Timetable Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 font-mono border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Train No</th>
                <th className="py-3 px-4">Train Name</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Origin ? Dest</th>
                <th className="py-3 px-4">Section</th>
                <th className="py-3 px-4">Arrival</th>
                <th className="py-3 px-4">Departure</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {trains.map((t) => (
                <tr key={t.train_id} className="hover:bg-slate-50/75 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-blue-700">
                    {t.train_number}
                  </td>
                  <td className="py-3 px-4 font-bold text-slate-900">
                    {t.train_name}
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                      {t.train_type}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-600 font-medium">
                    {t.origin_station || 'SC'} ? {t.destination_station || 'BZA'}
                  </td>
                  <td className="py-3 px-4 font-mono font-semibold text-slate-800">
                    {t.section}
                  </td>
                  <td className="py-3 px-4 font-mono font-semibold text-slate-900">
                    {t.arrival_time}
                  </td>
                  <td className="py-3 px-4 font-mono font-semibold text-slate-900">
                    {t.departure_time}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold ${
                      t.priority === 1 ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                      t.priority === 2 ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {t.priority === 1 ? '? Protected' : t.priority_label || `Prio ${t.priority}`}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <StatusBadge status={t.running_status || t.expected} />
                  </td>
                  <td className="py-3 px-4 text-right space-x-1">
                    <button
                      onClick={() => handleOpenEditTrain(t)}
                      className="p-1.5 rounded hover:bg-blue-50 text-blue-600 hover:text-blue-700 transition-colors cursor-pointer"
                      title="Edit Train"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteTrain(t.train_id)}
                      className="p-1.5 rounded hover:bg-rose-50 text-rose-500 hover:text-rose-700 transition-colors cursor-pointer"
                      title="Delete Train"
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

      {/* Add / Edit Train Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-xl overflow-hidden animate-fadeIn">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <TrainTrack className="w-4 h-4 text-blue-600" />
                <span>{editingTrain ? 'Edit Train Details' : 'Add New Train'}</span>
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTrain} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Train Number *</label>
                  <input
                    type="text"
                    required
                    value={trainForm.train_number}
                    onChange={(e) => setTrainForm({ ...trainForm, train_number: e.target.value })}
                    placeholder="e.g. 12701"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-mono font-bold focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Train Name *</label>
                  <input
                    type="text"
                    required
                    value={trainForm.train_name}
                    onChange={(e) => setTrainForm({ ...trainForm, train_name: e.target.value })}
                    placeholder="e.g. Hussain Sagar Express"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Train Type</label>
                  <select
                    value={trainForm.train_type}
                    onChange={(e) => setTrainForm({ ...trainForm, train_type: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-medium"
                  >
                    <option value="Express">Express</option>
                    <option value="Superfast">Superfast</option>
                    <option value="Passenger">Passenger</option>
                    <option value="MEMU">MEMU</option>
                    <option value="DEMU">DEMU</option>
                    <option value="Goods">Goods</option>
                    <option value="Special">Special</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Railway Section</label>
                  <select
                    value={trainForm.section}
                    onChange={(e) => setTrainForm({ ...trainForm, section: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-mono"
                  >
                    {sections.map((s) => (
                      <option key={s.section_id} value={s.section_id}>{s.section_id}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Priority</label>
                  <select
                    value={trainForm.priority}
                    onChange={(e) => {
                      const p = parseInt(e.target.value);
                      setTrainForm({
                        ...trainForm,
                        priority: p,
                        priority_label: p === 1 ? 'Critical' : p === 2 ? 'High' : p === 3 ? 'Medium' : 'Low'
                      });
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-semibold"
                  >
                    <option value={1}>1 - Critical (Protected)</option>
                    <option value={2}>2 - High (Superfast)</option>
                    <option value={3}>3 - Medium (Passenger)</option>
                    <option value={4}>4 - Low (Freight)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Origin Station</label>
                  <input
                    type="text"
                    value={trainForm.origin_station || ''}
                    onChange={(e) => setTrainForm({ ...trainForm, origin_station: e.target.value })}
                    placeholder="Secunderabad"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Destination Station</label>
                  <input
                    type="text"
                    value={trainForm.destination_station || ''}
                    onChange={(e) => setTrainForm({ ...trainForm, destination_station: e.target.value })}
                    placeholder="Vijayawada"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Arrival Time *</label>
                  <input
                    type="time"
                    required
                    value={trainForm.arrival_time}
                    onChange={(e) => setTrainForm({ ...trainForm, arrival_time: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Departure Time *</label>
                  <input
                    type="time"
                    required
                    value={trainForm.departure_time}
                    onChange={(e) => setTrainForm({ ...trainForm, departure_time: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Running Status</label>
                  <select
                    value={trainForm.running_status}
                    onChange={(e) => setTrainForm({ ...trainForm, running_status: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-medium"
                  >
                    <option value="Scheduled">Scheduled</option>
                    <option value="Delayed">Delayed</option>
                    <option value="Cancelled">Cancelled</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Remarks / Operation Notes</label>
                <input
                  type="text"
                  value={trainForm.remarks || ''}
                  onChange={(e) => setTrainForm({ ...trainForm, remarks: e.target.value })}
                  placeholder="e.g. Protected high-speed corridor slot"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-xs cursor-pointer"
                >
                  {editingTrain ? 'Save Changes' : 'Create Train'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
