import React from 'react';
import { AlertCircle, ShieldAlert } from 'lucide-react';

export const ResponsibleAiBanner: React.FC = () => {
  return (
    <div className="bg-amber-50/90 border-b border-amber-200 px-4 py-2 text-xs text-amber-900 flex items-center justify-between flex-wrap gap-2">
      <div className="flex items-center space-x-2">
        <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
        <span className="font-semibold text-amber-900">Responsible AI & Vigilance Notice:</span>
        <span className="text-amber-800">
          This system identifies potential anomalies, risk indicators, and duplicate patterns for review. It does not determine or prove fraud. Final decisions must be made through authorized human verification.
        </span>
      </div>
      <div className="flex items-center space-x-3 text-[11px] text-amber-700">
        <span>Sensitive features & MP identities excluded from risk models</span>
      </div>
    </div>
  );
};
