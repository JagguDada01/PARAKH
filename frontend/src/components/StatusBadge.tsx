import React from 'react';
import { ProjectStatus } from '../types';

interface StatusBadgeProps {
  status: ProjectStatus | string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const norm = (status || 'IN_PROGRESS').toUpperCase();

  let styles = 'bg-blue-50 text-blue-700 border-blue-200';
  let label = norm.replace('_', ' ');

  if (norm === 'COMPLETED') {
    styles = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  } else if (norm === 'DELAYED') {
    styles = 'bg-amber-50 text-amber-800 border-amber-200';
  } else if (norm === 'STALLED') {
    styles = 'bg-rose-50 text-rose-700 border-rose-200';
  } else if (norm === 'SANCTIONED') {
    styles = 'bg-purple-50 text-purple-700 border-purple-200';
  }

  return (
    <span className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-md border ${styles}`}>
      {label}
    </span>
  );
};
