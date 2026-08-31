import React, { useState } from 'react';
import { Settings as SettingsIcon, Sliders, ShieldCheck, Cpu, Info } from 'lucide-react';

export const Settings: React.FC = () => {
  const [wSeverity, setWSeverity] = useState(0.35);
  const [wCriticality, setWCriticality] = useState(0.25);
  const [wOverdue, setWOverdue] = useState(0.20);
  const [wTrainImpact, setWTrainImpact] = useState(0.20);

  return (
    <div className="space-y-5 animate-fadeIn pb-12">
      {/* Header */}
      <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-xs flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
            <SettingsIcon className="w-5 h-5 text-blue-600" />
            <span>System Settings & Optimization Parameters</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Configure multi-factor priority weights, safety thresholds, and system integration options.
          </p>
        </div>
      </div>

      {/* Priority Scoring Weight Tuner */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
          <Sliders className="w-4 h-4 text-blue-600" />
          <span>Priority Scoring Engine Weights (Normalized to 100%)</span>
        </h3>
        <p className="text-xs text-slate-500">
          Adjust the relative weight factors used to score maintenance urgency across departments.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div>
            <div className="flex justify-between text-xs text-slate-700 mb-1">
              <span className="font-semibold">Defect Severity Weight</span>
              <span className="font-mono text-blue-700 font-bold">{Math.round(wSeverity * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="0.6"
              step="0.05"
              value={wSeverity}
              onChange={(e) => setWSeverity(parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600 border border-slate-200"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs text-slate-700 mb-1">
              <span className="font-semibold">Asset Criticality Weight</span>
              <span className="font-mono text-purple-700 font-bold">{Math.round(wCriticality * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="0.6"
              step="0.05"
              value={wCriticality}
              onChange={(e) => setWCriticality(parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-purple-600 border border-slate-200"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs text-slate-700 mb-1">
              <span className="font-semibold">Overdue Factor Weight</span>
              <span className="font-mono text-amber-700 font-bold">{Math.round(wOverdue * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="0.6"
              step="0.05"
              value={wOverdue}
              onChange={(e) => setWOverdue(parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-amber-600 border border-slate-200"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs text-slate-700 mb-1">
              <span className="font-semibold">Corridor Traffic Impact Weight</span>
              <span className="font-mono text-emerald-700 font-bold">{Math.round(wTrainImpact * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="0.6"
              step="0.05"
              value={wTrainImpact}
              onChange={(e) => setWTrainImpact(parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-emerald-600 border border-slate-200"
            />
          </div>
        </div>
      </div>

      {/* Safety Policy & Hard Constraints */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
        <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Safety & Hard Constraint Rules</span>
        </h3>
        <p className="text-xs text-slate-500">
          Under railway operating rules, the following constraints are strictly enforced as hard rules and cannot be relaxed by optimization:
        </p>

        <ul className="space-y-2 text-xs text-slate-700">
          <li className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 flex items-start space-x-2">
            <span className="text-blue-600 font-bold">1.</span>
            <span><strong>Zero Protected Train Overlap:</strong> Maintenance blocks cannot overlap with Priority 1 passenger movements (e.g. Vande Bharat / Rajdhani Express).</span>
          </li>
          <li className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 flex items-start space-x-2">
            <span className="text-blue-600 font-bold">2.</span>
            <span><strong>Team Exclusivity:</strong> A single P-Way gang, Tower Wagon crew, or S&T unit cannot be assigned to overlapping parallel tasks.</span>
          </li>
          <li className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 flex items-start space-x-2">
            <span className="text-blue-600 font-bold">3.</span>
            <span><strong>Section Boundaries:</strong> Tasks can only be scheduled within their verified corridor section.</span>
          </li>
        </ul>
      </div>

      {/* About & Disclaimer Note */}
      <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1">
        <div className="font-bold text-slate-900 flex items-center space-x-1.5">
          <Info className="w-4 h-4 text-slate-500" />
          <span>About Block Planner</span>
        </div>
        <p className="text-[11px] text-slate-500 leading-relaxed">
          Block Planner is an intelligent railway decision-support application. It models corridor assets, train schedules, and maintenance demands to recommend optimized multi-department block windows.
        </p>
      </div>
    </div>
  );
};
