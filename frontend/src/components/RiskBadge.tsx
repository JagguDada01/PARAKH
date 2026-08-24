import React from 'react';
import { RiskLevel } from '../types';

interface RiskBadgeProps {
  level: RiskLevel | string;
  score?: number;
  showScore?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({
  level,
  score,
  showScore = true,
  size = 'md',
}) => {
  const normLevel = (level || 'LOW').toUpperCase();

  let colorClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  let dotColor = 'bg-emerald-500';

  if (normLevel === 'CRITICAL') {
    colorClasses = 'bg-rose-50 text-rose-700 border-rose-200';
    dotColor = 'bg-rose-500';
  } else if (normLevel === 'HIGH') {
    colorClasses = 'bg-orange-50 text-orange-700 border-orange-200';
    dotColor = 'bg-orange-500';
  } else if (normLevel === 'MEDIUM') {
    colorClasses = 'bg-amber-50 text-amber-700 border-amber-200';
    dotColor = 'bg-amber-500';
  }

  const sizeClasses = {
    sm: 'text-[10px] px-2 py-0.5 space-x-1',
    md: 'text-xs px-2.5 py-0.5 space-x-1.5',
    lg: 'text-sm px-3 py-1 space-x-2',
  }[size];

  return (
    <span
      className={`inline-flex items-center font-semibold rounded-full border shadow-2xs ${colorClasses} ${sizeClasses}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
      <span className="tracking-wide">{normLevel}</span>
      {showScore && score !== undefined && (
        <span className="opacity-80 font-mono text-[11px]">({Math.round(score)}/100)</span>
      )}
    </span>
  );
};
