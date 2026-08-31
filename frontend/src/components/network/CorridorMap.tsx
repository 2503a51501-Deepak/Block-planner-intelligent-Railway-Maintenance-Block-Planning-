import React, { useState } from 'react';
import { MaintenanceTask, RecommendedBlock } from '../../types';
import { Network } from 'lucide-react';

interface CorridorMapProps {
  tasks: MaintenanceTask[];
  recommendations: RecommendedBlock[];
  onSelectSection?: (sectionId: string) => void;
}

export const CorridorMap: React.FC<CorridorMapProps> = ({
  tasks,
  recommendations,
  onSelectSection
}) => {
  const [activeSection, setActiveSection] = useState<string>('WL-BZA');

  const nodes = [
    { code: 'SC', name: 'Secunderabad', km: '0' },
    { code: 'KZJ', name: 'Kazipet', km: '132' },
    { code: 'WL', name: 'Warangal', km: '147' },
    { code: 'BZA', name: 'Vijayawada', km: '354' },
    { code: 'GNT', name: 'Guntur', km: '386' },
  ];

  const sections = [
    { id: 'SC-KZJ', from: 'SC', to: 'KZJ', name: 'Secunderabad ? Kazipet' },
    { id: 'KZJ-WL', from: 'KZJ', to: 'WL', name: 'Kazipet ? Warangal' },
    { id: 'WL-BZA', from: 'WL', to: 'BZA', name: 'Warangal ? Vijayawada' },
    { id: 'BZA-GNT', from: 'BZA', to: 'GNT', name: 'Vijayawada ? Guntur' },
  ];

  const handleSectionClick = (secId: string) => {
    setActiveSection(secId);
    if (onSelectSection) onSelectSection(secId);
  };

  const getSecTasks = (secId: string) => tasks.filter((t) => t.section === secId);
  const getSecRecs = (secId: string) => recommendations.filter((r) => r.section === secId);

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 font-mono flex items-center space-x-1.5">
            <Network className="w-4 h-4 text-blue-600" />
            <span>South Central Railway Corridor Infrastructure Schematic</span>
          </h2>
        </div>
        <span className="text-xs text-slate-500 font-mono">Double Line Electrified (386 km)</span>
      </div>

      {/* Schematic Linear Diagram */}
      <div className="py-6 overflow-x-auto">
        <div className="min-w-[600px] flex items-center justify-between relative px-6">
          {/* Connecting Track Line */}
          <div className="absolute left-10 right-10 top-1/2 -translate-y-1/2 h-1.5 bg-slate-200 z-0 rounded"></div>

          {nodes.map((node) => (
            <div key={node.code} className="relative z-10 flex flex-col items-center">
              <div className="w-7 h-7 rounded-full bg-blue-600 border-4 border-white shadow-sm flex items-center justify-center text-[10px] font-mono font-bold text-white">
                {node.code}
              </div>
              <div className="mt-2 text-center">
                <div className="text-xs font-bold text-slate-900">{node.name}</div>
                <div className="text-[10px] text-slate-400 font-mono">{node.km} km</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section Buttons & Live Defect Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
        {sections.map((sec) => {
          const secTasks = getSecTasks(sec.id);
          const critCount = secTasks.filter((t) => t.severity === 'Critical').length;
          const recCount = getSecRecs(sec.id).length;
          const isSelected = activeSection === sec.id;

          return (
            <button
              key={sec.id}
              onClick={() => handleSectionClick(sec.id)}
              className={
                isSelected
                  ? 'p-3 rounded-lg border text-left transition-all cursor-pointer bg-blue-50 border-blue-400 shadow-2xs'
                  : 'p-3 rounded-lg border text-left transition-all cursor-pointer bg-slate-50 border-slate-200 hover:bg-slate-100'
              }
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-slate-900">{sec.id}</span>
                {critCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold">
                    {critCount} Crit
                  </span>
                )}
              </div>
              <div className="text-[11px] text-slate-500 mt-1 truncate">{sec.name}</div>
              <div className="mt-2 flex items-center justify-between text-[11px] font-mono">
                <span className="text-slate-600">{secTasks.length} Tasks</span>
                <span className="text-blue-700 font-bold">{recCount} Blocks</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
