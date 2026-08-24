import React from 'react';
import { ShieldCheck, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ResponsibleAiBanner } from './ResponsibleAiBanner';

interface NavbarProps {
  onSearchClick?: () => void;
  activeScreenTitle: string;
}

export const Navbar: React.FC<NavbarProps> = ({ activeScreenTitle }) => {
  const { user, role, logout } = useAuth();

  const roleBadgeStyles: Record<string, { bg: string; text: string; border: string }> = {
    INVESTIGATOR: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
    ADMIN: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
    ANALYST: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
    VIEWER: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  };

  const style = roleBadgeStyles[role] || roleBadgeStyles.INVESTIGATOR;

  return (
    <header className="sticky top-0 z-30 flex flex-col bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <ResponsibleAiBanner />
      
      <div className="flex items-center justify-between px-6 py-3.5">
        {/* Left: Active Screen Title & Scheme Badge */}
        <div className="flex items-center space-x-3">
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-bold tracking-tight text-slate-900">{activeScreenTitle}</h1>
              <span className="bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                PARAKH AI MONITOR
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Members of Parliament Local Area Development Scheme Monitoring System
            </p>
          </div>
        </div>

        {/* Right: Static Role Badge + User Profile + Logout */}
        <div className="flex items-center space-x-3">
          {/* Static Non-Editable Role Pill */}
          <div className={`flex items-center space-x-2 ${style.bg} border ${style.border} px-3 py-1.5 rounded-xl text-xs font-semibold ${style.text} shadow-2xs`}>
            <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
            <span className="opacity-80 font-normal">Role:</span>
            <span className="font-bold uppercase tracking-wider">{role}</span>
          </div>

          {/* User Profile info */}
          <div className="flex items-center space-x-3 pl-3 border-l border-slate-200">
            <div className="w-8 h-8 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-800 font-bold text-xs">
              {user?.full_name?.charAt(0) || user?.email?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-xs font-semibold text-slate-800 truncate max-w-[160px]" title={user?.full_name}>
                {user?.full_name || 'Vigilance Officer'}
              </p>
              <p className="text-[11px] text-slate-500 truncate max-w-[160px]" title={user?.email}>
                {user?.email || 'officer@mplads.gov.in'}
              </p>
            </div>

            <button
              onClick={logout}
              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl border border-transparent hover:border-rose-200 transition ml-1"
              title="Sign Out / Switch Account (Return to Login)"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
