import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { Station, RailwaySection } from '../types';
import {
  Building2,
  Plus,
  Search,
  Edit2,
  Trash2,
  Layers,
  X
} from 'lucide-react';
import { StatusBadge } from '../components/common/StatusBadge';

export const Stations: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'stations' | 'sections'>('stations');
  const [stations, setStations] = useState<Station[]>([]);
  const [sections, setSections] = useState<RailwaySection[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // Modals
  const [showStationModal, setShowStationModal] = useState(false);
  const [editingStation, setEditingStation] = useState<Station | null>(null);
  const [stationForm, setStationForm] = useState<Station>({
    station_code: '',
    station_name: '',
    station_type: 'Junction',
    division: 'Secunderabad',
    zone: 'South Central Railway',
    location: '',
    platforms: 2,
    lines: 4,
    electrified: 'Yes',
    status: 'Active'
  });

  const [showSectionModal, setShowSectionModal] = useState(false);
  const [editingSection, setEditingSection] = useState<RailwaySection | null>(null);
  const [sectionForm, setSectionForm] = useState<RailwaySection>({
    section_id: '',
    from_station: '',
    to_station: '',
    distance_km: 50.0,
    tracks_count: 2,
    electrified: 'Yes',
    max_speed_kmh: 130,
    permitted_block_duration: 4.0,
    status: 'Active'
  });

  useEffect(() => {
    loadData();
  }, [typeFilter, statusFilter]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [stList, secList] = await Promise.all([
        api.getStations({ search, station_type: typeFilter, status: statusFilter }),
        api.getSections(statusFilter)
      ]);
      setStations(stList);
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

  const handleOpenAddStation = () => {
    setEditingStation(null);
    setStationForm({
      station_code: '',
      station_name: '',
      station_type: 'Junction',
      division: 'Secunderabad',
      zone: 'South Central Railway',
      location: '',
      platforms: 2,
      lines: 4,
      electrified: 'Yes',
      status: 'Active'
    });
    setShowStationModal(true);
  };

  const handleOpenEditStation = (st: Station) => {
    setEditingStation(st);
    setStationForm({ ...st });
    setShowStationModal(true);
  };

  const handleSaveStation = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingStation) {
        await api.updateStation(editingStation.station_code, stationForm);
      } else {
        await api.createStation(stationForm);
      }
      setShowStationModal(false);
      loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteStation = async (code: string) => {
    if (!confirm(`Are you sure you want to delete station ${code}?`)) return;
    try {
      await api.deleteStation(code);
      loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleOpenAddSection = () => {
    setEditingSection(null);
    setSectionForm({
      section_id: '',
      from_station: stations[0]?.station_name || 'Secunderabad',
      to_station: stations[1]?.station_name || 'Kazipet',
      distance_km: 50.0,
      tracks_count: 2,
      electrified: 'Yes',
      max_speed_kmh: 130,
      permitted_block_duration: 4.0,
      status: 'Active'
    });
    setShowSectionModal(true);
  };

  const handleOpenEditSection = (sec: RailwaySection) => {
    setEditingSection(sec);
    setSectionForm({ ...sec });
    setShowSectionModal(true);
  };

  const handleSaveSection = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingSection) {
        await api.updateSection(editingSection.section_id, sectionForm);
      } else {
        await api.createSection(sectionForm);
      }
      setShowSectionModal(false);
      loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteSection = async (id: string) => {
    if (!confirm(`Are you sure you want to delete section ${id}?`)) return;
    try {
      await api.deleteSection(id);
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
            <Building2 className="w-5 h-5 text-blue-600" />
            <span>Station & Corridor Section Management</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Maintain railway stations, junction classifications, and corridor track sections used for block optimization.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {activeTab === 'stations' ? (
            <button
              onClick={handleOpenAddStation}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs flex items-center space-x-1.5 transition-all active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Station</span>
            </button>
          ) : (
            <button
              onClick={handleOpenAddSection}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs flex items-center space-x-1.5 transition-all active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Section</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('stations')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
            activeTab === 'stations'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Stations Directory ({stations.length})
        </button>
        <button
          onClick={() => setActiveTab('sections')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
            activeTab === 'sections'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Railway Sections & Corridors ({sections.length})
        </button>
      </div>

      {/* Tab 1: Stations */}
      {activeTab === 'stations' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 p-3.5 rounded-xl shadow-2xs flex flex-col md:flex-row gap-3 items-center justify-between">
            <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search station by code, name, or location..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500"
              />
            </form>

            <div className="flex items-center space-x-2 w-full md:w-auto">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-xs text-slate-700 rounded-lg px-3 py-1.5 focus:outline-none focus:border-blue-500 font-medium"
              >
                <option value="All">All Types</option>
                <option value="Major">Major</option>
                <option value="Junction">Junction</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Terminal">Terminal</option>
                <option value="Halt">Halt</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-xs text-slate-700 rounded-lg px-3 py-1.5 focus:outline-none focus:border-blue-500 font-medium"
              >
                <option value="All">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 font-mono border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Station Code</th>
                    <th className="py-3 px-4">Station Name</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Division / Zone</th>
                    <th className="py-3 px-4">Location</th>
                    <th className="py-3 px-4 text-center">Platforms</th>
                    <th className="py-3 px-4 text-center">Lines</th>
                    <th className="py-3 px-4 text-center">Electrified</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {stations.map((st) => (
                    <tr key={st.station_code} className="hover:bg-slate-50/75 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-blue-700">{st.station_code}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">{st.station_name}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                          {st.station_type}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600">{st.division} ({st.zone})</td>
                      <td className="py-3 px-4 text-slate-500 truncate max-w-xs">{st.location || '?'}</td>
                      <td className="py-3 px-4 text-center font-mono font-semibold text-slate-800">{st.platforms}</td>
                      <td className="py-3 px-4 text-center font-mono font-semibold text-slate-800">{st.lines}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          st.electrified === 'Yes' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {st.electrified}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center"><StatusBadge status={st.status} /></td>
                      <td className="py-3 px-4 text-right space-x-1">
                        <button
                          onClick={() => handleOpenEditStation(st)}
                          className="p-1.5 rounded hover:bg-blue-50 text-blue-600 hover:text-blue-700 transition-colors cursor-pointer"
                          title="Edit Station"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteStation(st.station_code)}
                          className="p-1.5 rounded hover:bg-rose-50 text-rose-500 hover:text-rose-700 transition-colors cursor-pointer"
                          title="Delete Station"
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
        </div>
      )}

      {/* Tab 2: Sections */}
      {activeTab === 'sections' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 font-mono border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Section ID</th>
                    <th className="py-3 px-4">From Station</th>
                    <th className="py-3 px-4">To Station</th>
                    <th className="py-3 px-4">Distance</th>
                    <th className="py-3 px-4 text-center">Tracks</th>
                    <th className="py-3 px-4 text-center">Electrified</th>
                    <th className="py-3 px-4 text-center">Max Speed</th>
                    <th className="py-3 px-4 text-center">Permitted Block</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sections.map((sec) => (
                    <tr key={sec.section_id} className="hover:bg-slate-50/75 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-blue-700">{sec.section_id}</td>
                      <td className="py-3 px-4 font-semibold text-slate-900">{sec.from_station}</td>
                      <td className="py-3 px-4 font-semibold text-slate-900">{sec.to_station}</td>
                      <td className="py-3 px-4 font-mono font-semibold text-slate-700">{sec.distance_km} km</td>
                      <td className="py-3 px-4 text-center font-mono text-slate-800">{sec.tracks_count}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          sec.electrified === 'Yes' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {sec.electrified}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-slate-800">{sec.max_speed_kmh} km/h</td>
                      <td className="py-3 px-4 text-center font-mono font-bold text-blue-700">{sec.permitted_block_duration}h</td>
                      <td className="py-3 px-4 text-center"><StatusBadge status={sec.status} /></td>
                      <td className="py-3 px-4 text-right space-x-1">
                        <button
                          onClick={() => handleOpenEditSection(sec)}
                          className="p-1.5 rounded hover:bg-blue-50 text-blue-600 hover:text-blue-700 transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteSection(sec.section_id)}
                          className="p-1.5 rounded hover:bg-rose-50 text-rose-500 hover:text-rose-700 transition-colors cursor-pointer"
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
        </div>
      )}

      {/* Add / Edit Station Modal */}
      {showStationModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-xl overflow-hidden animate-fadeIn">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <Building2 className="w-4 h-4 text-blue-600" />
                <span>{editingStation ? 'Edit Station Details' : 'Add New Railway Station'}</span>
              </h3>
              <button onClick={() => setShowStationModal(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStation} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Station Code *</label>
                  <input
                    type="text"
                    required
                    disabled={!!editingStation}
                    value={stationForm.station_code}
                    onChange={(e) => setStationForm({ ...stationForm, station_code: e.target.value.toUpperCase() })}
                    placeholder="e.g. SC"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-mono font-bold uppercase focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Station Name *</label>
                  <input
                    type="text"
                    required
                    value={stationForm.station_name}
                    onChange={(e) => setStationForm({ ...stationForm, station_name: e.target.value })}
                    placeholder="e.g. Secunderabad"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Station Type</label>
                  <select
                    value={stationForm.station_type}
                    onChange={(e) => setStationForm({ ...stationForm, station_type: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-medium"
                  >
                    <option value="Major">Major</option>
                    <option value="Junction">Junction</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Terminal">Terminal</option>
                    <option value="Halt">Halt</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Division</label>
                  <input
                    type="text"
                    value={stationForm.division}
                    onChange={(e) => setStationForm({ ...stationForm, division: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Zone</label>
                  <input
                    type="text"
                    value={stationForm.zone}
                    onChange={(e) => setStationForm({ ...stationForm, zone: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Location / City Description</label>
                <input
                  type="text"
                  value={stationForm.location || ''}
                  onChange={(e) => setStationForm({ ...stationForm, location: e.target.value })}
                  placeholder="e.g. Hyderabad, Telangana"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2"
                />
              </div>

              <div className="grid grid-cols-4 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Platforms</label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={stationForm.platforms}
                    onChange={(e) => setStationForm({ ...stationForm, platforms: parseInt(e.target.value) || 1 })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Lines</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={stationForm.lines}
                    onChange={(e) => setStationForm({ ...stationForm, lines: parseInt(e.target.value) || 1 })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Electrified</label>
                  <select
                    value={stationForm.electrified}
                    onChange={(e) => setStationForm({ ...stationForm, electrified: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-medium"
                  >
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Status</label>
                  <select
                    value={stationForm.status}
                    onChange={(e) => setStationForm({ ...stationForm, status: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-medium"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowStationModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-xs cursor-pointer"
                >
                  {editingStation ? 'Save Changes' : 'Create Station'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit Section Modal */}
      {showSectionModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-xl overflow-hidden animate-fadeIn">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <Layers className="w-4 h-4 text-blue-600" />
                <span>{editingSection ? 'Edit Railway Section' : 'Create Railway Section'}</span>
              </h3>
              <button onClick={() => setShowSectionModal(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSection} className="p-6 space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Section ID *</label>
                <input
                  type="text"
                  required
                  disabled={!!editingSection}
                  value={sectionForm.section_id}
                  onChange={(e) => setSectionForm({ ...sectionForm, section_id: e.target.value.toUpperCase() })}
                  placeholder="e.g. SC-KZJ"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-mono font-bold uppercase focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">From Station *</label>
                  <input
                    type="text"
                    required
                    value={sectionForm.from_station}
                    onChange={(e) => setSectionForm({ ...sectionForm, from_station: e.target.value })}
                    placeholder="Secunderabad"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-medium"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">To Station *</label>
                  <input
                    type="text"
                    required
                    value={sectionForm.to_station}
                    onChange={(e) => setSectionForm({ ...sectionForm, to_station: e.target.value })}
                    placeholder="Kazipet"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Distance (km)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    value={sectionForm.distance_km}
                    onChange={(e) => setSectionForm({ ...sectionForm, distance_km: parseFloat(e.target.value) || 1.0 })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Tracks Count</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={sectionForm.tracks_count}
                    onChange={(e) => setSectionForm({ ...sectionForm, tracks_count: parseInt(e.target.value) || 2 })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Max Speed (kmph)</label>
                  <input
                    type="number"
                    min="50"
                    max="160"
                    value={sectionForm.max_speed_kmh}
                    onChange={(e) => setSectionForm({ ...sectionForm, max_speed_kmh: parseInt(e.target.value) || 130 })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Electrified</label>
                  <select
                    value={sectionForm.electrified}
                    onChange={(e) => setSectionForm({ ...sectionForm, electrified: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2"
                  >
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Max Block (hrs)</label>
                  <input
                    type="number"
                    step="0.5"
                    min="1"
                    max="8"
                    value={sectionForm.permitted_block_duration}
                    onChange={(e) => setSectionForm({ ...sectionForm, permitted_block_duration: parseFloat(e.target.value) || 4.0 })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Status</label>
                  <select
                    value={sectionForm.status}
                    onChange={(e) => setSectionForm({ ...sectionForm, status: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowSectionModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-xs cursor-pointer"
                >
                  {editingSection ? 'Save Changes' : 'Create Section'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
