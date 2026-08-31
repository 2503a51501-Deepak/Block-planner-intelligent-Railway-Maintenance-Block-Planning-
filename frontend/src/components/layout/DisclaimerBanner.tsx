import React from 'react';
import { AlertTriangle, Train, ShieldCheck } from 'lucide-react';

export const DisclaimerBanner: React.FC = () => {
  return (
    <div className="bg-amber-950/70 border-b border-amber-800/80 px-4 py-2 text-xs text-amber-200 flex items-center justify-between shadow-inner">
      <div className="flex items-center space-x-2">
        <span className="bg-amber-600/30 text-amber-300 font-semibold px-2 py-0.5 rounded border border-amber-600/50 uppercase tracking-wider text-[10px]">
          Hackathon Prototype
        </span>
        <span className="font-medium">
          Decision Support System using Simulated Railway Data. Not connected to real Indian Railways operational control systems.
        </span>
      </div>
      <div className="hidden md:flex items-center space-x-2 text-amber-300/80">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
        <span>Safety Constraints Non-Overridable</span>
      </div>
    </div>
  );
};
