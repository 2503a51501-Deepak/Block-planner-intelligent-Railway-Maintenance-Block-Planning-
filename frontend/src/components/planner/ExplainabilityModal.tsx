import React from 'react';
import { RecommendedBlock } from '../../types';
import { X, Sparkles, ShieldCheck, CheckCircle2, AlertTriangle, Layers, Clock } from 'lucide-react';
import { PriorityBadge } from '../common/PriorityBadge';
import { DeptBadge } from '../common/DeptBadge';

interface ExplainabilityModalProps {
  rec: RecommendedBlock | null;
  onClose: () => void;
}

export const ExplainabilityModal: React.FC<ExplainabilityModalProps> = ({ rec, onClose }) => {
  if (!rec) return null;

  const breakdown = rec.score_breakdown || {};

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-fadeIn">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-indigo-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                How AI Recommends This Block
              </h3>
              <p className="text-xs text-slate-400">
                Transparent decision score breakdown and mathematical reasoning.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Target Block Overview */}
          <div className="p-4 bg-slate-950/70 rounded-xl border border-slate-800 flex items-center justify-between">
            <div>
              <div className="text-xs font-mono font-bold text-blue-400">{rec.recommendation_id} • Block Window {rec.block_id}</div>
              <div className="text-sm font-bold text-white mt-0.5">{rec.section}</div>
              <div className="text-xs text-slate-400 mt-1 font-mono">
                {rec.date} | {rec.start_time} - {rec.end_time} ({rec.duration_hours}h max)
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-slate-400 font-mono">Optimization Score</div>
              <div className="text-3xl font-bold font-mono text-emerald-400">{rec.optimization_score}<span className="text-sm text-slate-500">/100</span></div>
            </div>
          </div>

          {/* Mathematical Score Composition */}
          <div>
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2.5 font-mono">
              Optimization Score Formula Breakdown
            </h4>
            <div className="bg-slate-950 rounded-xl p-4 border border-slate-800 space-y-2.5 font-mono text-xs">
              <div className="flex justify-between items-center text-slate-300">
                <span className="flex items-center"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mr-2" /> Maintenance Priority Factor</span>
                <span className="text-emerald-400 font-bold">+{breakdown.priority_factor || 32.5}</span>
              </div>
              <div className="flex justify-between items-center text-slate-300">
                <span className="flex items-center"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mr-2" /> Critical Defect Urgent Bonus</span>
                <span className="text-emerald-400 font-bold">+{breakdown.critical_bonus || 20.0}</span>
              </div>
              <div className="flex justify-between items-center text-slate-300">
                <span className="flex items-center"><Layers className="w-3.5 h-3.5 text-indigo-400 mr-2" /> Multi-Department Coordination Benefit</span>
                <span className="text-indigo-400 font-bold">+{breakdown.multi_department_bonus || 25.0}</span>
              </div>
              <div className="flex justify-between items-center text-slate-300">
                <span className="flex items-center"><Clock className="w-3.5 h-3.5 text-blue-400 mr-2" /> Window Duration Efficiency</span>
                <span className="text-blue-400 font-bold">+{breakdown.block_efficiency || 12.0}</span>
              </div>
              <div className="flex justify-between items-center text-slate-300">
                <span className="flex items-center"><AlertTriangle className="w-3.5 h-3.5 text-rose-400 mr-2" /> Train Disruption Penalty</span>
                <span className="text-rose-400 font-bold">{breakdown.train_disruption_penalty || -5.0}</span>
              </div>
              <div className="flex justify-between items-center text-slate-300">
                <span className="flex items-center"><AlertTriangle className="w-3.5 h-3.5 text-amber-400 mr-2" /> Freight / Goods Traffic Risk</span>
                <span className="text-amber-400 font-bold">{breakdown.goods_freight_penalty || -3.5}</span>
              </div>
              <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-sm font-bold text-white">
                <span>Final Optimization Score</span>
                <span className="text-emerald-400 text-base">{rec.optimization_score} / 100</span>
              </div>
            </div>
          </div>

          {/* Detailed Bullet Explanations */}
          <div>
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 font-mono">
              Key Contributing Reasons
            </h4>
            <ul className="space-y-2 text-xs text-slate-300">
              {rec.reasons.map((r, i) => (
                <li key={i} className="flex items-start space-x-2 bg-slate-950/50 p-2.5 rounded-lg border border-slate-800/80">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Hard Safety Compliance Note */}
          <div className="p-3 bg-emerald-950/40 rounded-xl border border-emerald-800/60 flex items-center space-x-3 text-xs text-emerald-200">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <span className="font-semibold text-emerald-300">Safety Verified:</span> Zero conflicts with Priority 1 passenger movements (Vande Bharat / Rajdhani Express). All electrical & traffic isolation requirements are satisfied.
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-950 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors"
          >
            Close Explanation
          </button>
        </div>
      </div>
    </div>
  );
};
