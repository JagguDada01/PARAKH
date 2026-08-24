import React from 'react';
import { LucideIcon } from 'lucide-react';

export interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  badge?: string;
  icon: LucideIcon;
  colorScheme?: 'blue' | 'emerald' | 'indigo' | 'amber' | 'orange' | 'rose' | 'purple';
  valueColor?: string;
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  badge,
  icon: Icon,
  colorScheme = 'blue',
  valueColor,
  onClick,
}) => {
  const schemeMap = {
    blue: {
      cardBorder: 'border-slate-200/90 hover:border-blue-300',
      iconBox: 'bg-blue-50 text-blue-600 border border-blue-100',
      badgeStyle: 'bg-blue-50 text-blue-700 border border-blue-100',
      defaultValColor: 'text-slate-900',
    },
    emerald: {
      cardBorder: 'border-slate-200/90 hover:border-emerald-300',
      iconBox: 'bg-emerald-50 text-emerald-600 border border-emerald-100',
      badgeStyle: 'bg-emerald-50 text-emerald-700 border border-emerald-100',
      defaultValColor: 'text-slate-900',
    },
    indigo: {
      cardBorder: 'border-slate-200/90 hover:border-indigo-300',
      iconBox: 'bg-indigo-50 text-indigo-600 border border-indigo-100',
      badgeStyle: 'bg-indigo-50 text-indigo-700 border border-indigo-100',
      defaultValColor: 'text-slate-900',
    },
    amber: {
      cardBorder: 'border-slate-200/90 hover:border-amber-300',
      iconBox: 'bg-amber-50 text-amber-600 border border-amber-100',
      badgeStyle: 'bg-amber-50 text-amber-800 border border-amber-100',
      defaultValColor: 'text-amber-600',
    },
    orange: {
      cardBorder: 'border-slate-200/90 hover:border-orange-300',
      iconBox: 'bg-orange-50 text-orange-600 border border-orange-100',
      badgeStyle: 'bg-orange-50 text-orange-800 border border-orange-100',
      defaultValColor: 'text-orange-600',
    },
    rose: {
      cardBorder: 'border-slate-200/90 hover:border-rose-300',
      iconBox: 'bg-rose-50 text-rose-600 border border-rose-100',
      badgeStyle: 'bg-rose-50 text-rose-700 border border-rose-100',
      defaultValColor: 'text-rose-600',
    },
    purple: {
      cardBorder: 'border-slate-200/90 hover:border-purple-300',
      iconBox: 'bg-purple-50 text-purple-600 border border-purple-100',
      badgeStyle: 'bg-purple-50 text-purple-700 border border-purple-100',
      defaultValColor: 'text-purple-600',
    },
  };

  const scheme = schemeMap[colorScheme] || schemeMap.blue;
  const finalValColor = valueColor || scheme.defaultValColor;

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-2xl p-5 border transition-all duration-200 shadow-xs hover:shadow-md flex flex-col justify-between ${scheme.cardBorder} ${
        onClick ? 'cursor-pointer' : ''
      }`}
    >
      {/* Top Row: Icon Container on Left, Pill Badge on Right */}
      <div className="flex items-center justify-between mb-3">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-2xs ${scheme.iconBox}`}>
          <Icon className="w-4 h-4" />
        </div>
        {badge && (
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md tracking-wider uppercase ${scheme.badgeStyle}`}>
            {badge}
          </span>
        )}
      </div>

      {/* Metric Content */}
      <div className="space-y-1">
        <span className="text-xs font-semibold text-slate-500 block leading-tight">
          {title}
        </span>
        <div className={`text-2xl font-black tracking-tight ${finalValColor}`}>
          {typeof value === 'number' ? value.toLocaleString('en-IN') : value}
        </div>
      </div>

      {/* Subtitle / Telemetry Details */}
      {subtitle && (
        <p className="mt-2 text-[11px] text-slate-400 font-normal leading-snug">
          {subtitle}
        </p>
      )}
    </div>
  );
};
