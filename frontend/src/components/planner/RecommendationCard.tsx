import React from 'react';
import { RecommendedBlock } from '../../types';
import { PriorityBadge } from '../common/PriorityBadge';
import { DeptBadge } from '../common/DeptBadge';
import { StatusBadge } from '../common/StatusBadge';
import {
  Clock,
  Sparkles,
  Check,
  X,
  Info,
  ShieldCheck,
  TrendingDown,
  Layers
} from 'lucide-react';

interface RecommendationCardProps {
  rec: RecommendedBlock;
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
  onViewExplain: (rec: RecommendedBlock) => void;
}

export const RecommendationCard: React.FC<RecommendationCardProps> = ({
  rec,
  onAccept,
  onReject,
  onViewExplain
}) => {
  const isMultiDept = rec.departments.length > 1;

  return (
    <div className={`p-5 rounded-xl border transition-all duration-200 ${
      rec.status === 'Accepted'
        ? 'bg-slate-900/90 border-emerald-500/60 shadow-lg shadow-emerald-950/20'
        : rec.status === 'Rejected'
        ? 'bg-slate-900/40 border-rose-900/40 opacity-70'
        : isMultiDept
        ? 'bg-gradient-to-br from-slate-900 via-indigo-950/30 to-slate-900 border-indigo-500/40 hover:border-indigo-400 shadow-md'
        : 'bg-slate-900 border-slate-800 hover:border-slate-700 shadow-md'
    }`}>
      {/* Top Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center space-x-2">
            <span className="font-mono text-xs font-bold text-blue-400 bg-blue-950/80 px-2 py-0.5 rounded border border-blue-800/60">
              {rec.recommendation_id}
            </span>
            <span className="text-sm font-bold text-white">{rec.section}</span>
            {isMultiDept && (
              <span className="flex items-center space-x-1 text-[10px] font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded-full font-mono">
                <Layers className="w-3 h-3 text-emerald-400 mr-0.5" />
                {rec.departments.length} Depts Coordinated
              </span>
            )}
          </div>
          <div className="text-xs text-slate-400 mt-1 flex items-center space-x-2">
            <span>Date: <strong className="text-slate-300 font-mono">{rec.date}</strong></span>
            <span>•</span>
            <span className="flex items-center space-x-1 text-slate-300 font-mono">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>{rec.start_time} - {rec.end_time} ({rec.duration_hours}h)</span>
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <PriorityBadge priority={rec.priority_level} />
          <StatusBadge status={rec.status} />
        </div>
      </div>

      {/* Departments & Tasks Summary */}
      <div className="mt-4 pt-3 border-t border-slate-800/80">
        <div className="flex items-center space-x-1.5 flex-wrap gap-y-1 mb-2.5">
          <span className="text-[11px] text-slate-400 mr-1">Departments:</span>
          {rec.departments.map((d) => (
            <DeptBadge key={d} department={d} />
          ))}
        </div>

        {/* Tasks List */}
        <div className="space-y-1.5 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/60">
          <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider flex justify-between font-mono">
            <span>Bundled Maintenance Tasks ({rec.tasks.length})</span>
            <span>Est. Duration</span>
          </div>
          {rec.tasks.map((t) => (
            <div key={t.task_id} className="text-xs flex items-center justify-between text-slate-300">
              <div className="flex items-center space-x-2 truncate">
                <span className="font-mono text-blue-400 font-bold">{t.task_id}</span>
                <span className="truncate">{t.task_type}</span>
                <span className="text-[10px] text-slate-500 font-mono">({t.required_team})</span>
              </div>
              <span className="font-mono text-slate-400 font-semibold">{t.estimated_duration_hours}h</span>
            </div>
          ))}
        </div>
      </div>

      {/* Metrics Strip */}
      <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs font-mono bg-slate-950/40 p-2 rounded-lg border border-slate-800/50">
        <div>
          <div className="text-[10px] text-slate-400">Optimization Score</div>
          <div className="text-sm font-bold text-emerald-400">{rec.optimization_score}/100</div>
        </div>
        <div>
          <div className="text-[10px] text-slate-400">Train Disruption</div>
          <div className={`text-sm font-bold ${
            rec.train_impact_score < 25 ? 'text-emerald-400' :
            rec.train_impact_score < 50 ? 'text-amber-400' : 'text-rose-400'
          }`}>
            {rec.train_impact_score < 25 ? 'Low' : rec.train_impact_score < 50 ? 'Medium' : 'High'} ({Math.round(rec.train_impact_score)})
          </div>
        </div>
        <div>
          <div className="text-[10px] text-slate-400">Goods Freight Prob</div>
          <div className="text-sm font-bold text-slate-300">{Math.round(rec.goods_probability * 100)}%</div>
        </div>
      </div>

      {/* Primary Decision Reason */}
      {rec.reasons.length > 0 && (
        <div className="mt-3 text-xs text-slate-300 bg-blue-950/30 p-2.5 rounded-lg border border-blue-900/40 flex items-start space-x-2">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <p className="line-clamp-2">{rec.reasons[0]}</p>
        </div>
      )}

      {/* Action Footer */}
      <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
        <button
          onClick={() => onViewExplain(rec)}
          className="flex items-center space-x-1.5 text-xs text-blue-400 hover:text-blue-300 font-medium transition-colors"
        >
          <Info className="w-3.5 h-3.5" />
          <span>Why this block? (Explain AI)</span>
        </button>

        <div className="flex items-center space-x-2">
          {rec.status !== 'Accepted' && (
            <button
              onClick={() => onAccept(rec.recommendation_id)}
              className="flex items-center space-x-1 text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition-all active:scale-95"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Accept</span>
            </button>
          )}

          {rec.status !== 'Rejected' && (
            <button
              onClick={() => onReject(rec.recommendation_id)}
              className="flex items-center space-x-1 text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/60 text-slate-300 hover:text-rose-200 border border-slate-700 hover:border-rose-700 transition-all active:scale-95"
            >
              <X className="w-3.5 h-3.5" />
              <span>Reject</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
