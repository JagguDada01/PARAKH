import React from 'react';
import {
  LayoutDashboard, FolderKanban, ShieldAlert, MapPin,
  ClipboardCheck, Cpu, Bot, UploadCloud, ChevronLeft, ChevronRight,
  Shield, Lock
} from 'lucide-react';
import { UserRole } from '../types';
import { useAuth } from '../context/AuthContext';

export type ScreenId =
  | 'dashboard'
  | 'projects'
  | 'risk'
  | 'gis'
  | 'project-detail'
  | 'investigation'
  | 'models'
  | 'assistant'
  | 'ingestion';

interface SidebarProps {
  activeScreen: ScreenId;
  onSelectScreen: (screen: ScreenId) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  activeAlertsCount?: number;
  criticalRiskCount?: number;
}

interface NavMenuItem {
  id: ScreenId;
  label: string;
  icon: any;
  allowedRoles: UserRole[];
  badge?: number;
  badgeColor?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeScreen,
  onSelectScreen,
  collapsed,
  onToggleCollapse,
  activeAlertsCount = 0,
  criticalRiskCount = 0,
}) => {
  const { role } = useAuth();

  const allMenuItems: NavMenuItem[] = [
    {
      id: 'dashboard',
      label: 'Overview Dashboard',
      icon: LayoutDashboard,
      allowedRoles: ['ADMIN', 'INVESTIGATOR', 'ANALYST', 'VIEWER'],
    },
    {
      id: 'projects',
      label: 'Project Explorer',
      icon: FolderKanban,
      allowedRoles: ['ADMIN', 'INVESTIGATOR', 'ANALYST', 'VIEWER'],
    },
    {
      id: 'gis',
      label: 'GIS Interactive Map',
      icon: MapPin,
      allowedRoles: ['ADMIN', 'INVESTIGATOR', 'ANALYST', 'VIEWER'],
    },
    {
      id: 'assistant',
      label: 'AI Assistant',
      icon: Bot,
      allowedRoles: ['ADMIN', 'INVESTIGATOR', 'ANALYST', 'VIEWER'],
    },
    {
      id: 'risk',
      label: 'Risk Center',
      icon: ShieldAlert,
      allowedRoles: ['ADMIN', 'INVESTIGATOR', 'ANALYST'],
      badge: criticalRiskCount,
      badgeColor: 'bg-rose-100 text-rose-700 border border-rose-200',
    },
    {
      id: 'investigation',
      label: 'Investigation Center',
      icon: ClipboardCheck,
      allowedRoles: ['ADMIN', 'INVESTIGATOR'],
      badge: activeAlertsCount,
      badgeColor: 'bg-amber-100 text-amber-800 border border-amber-200',
    },
    {
      id: 'models',
      label: 'Model Analytics',
      icon: Cpu,
      allowedRoles: ['ADMIN', 'ANALYST'],
    },
    {
      id: 'ingestion',
      label: 'Data Ingestion Hub',
      icon: UploadCloud,
      allowedRoles: ['ADMIN'],
    },
  ];

  // Filter menu items strictly by the user's logged-in role
  const menuItems = allMenuItems.filter((item) => item.allowedRoles.includes(role));

  const roleNames: Record<UserRole, string> = {
    ADMIN: 'Nodal Administrator',
    INVESTIGATOR: 'Vigilance Investigator',
    ANALYST: 'Data Analyst / ML',
    VIEWER: 'Public Oversight',
  };

  return (
    <aside
      className={`relative flex flex-col bg-white border-r border-slate-200 transition-all duration-300 z-40 select-none ${
        collapsed ? 'w-18' : 'w-64'
      }`}
    >
      {/* Brand & Official Logo Header */}
      <div className="flex items-center justify-between px-3.5 py-3 border-b border-slate-200">
        <div className="flex items-center space-x-2.5 overflow-hidden">
          {collapsed ? (
            <img
              src="/parakh-icon.png"
              alt="PARAKH Icon"
              className="w-9 h-9 object-contain rounded-xl shadow-xs"
            />
          ) : (
            <img
              src="/parakh-logo.png"
              alt="PARAKH Logo"
              className="h-11 w-auto max-w-[200px] object-contain"
            />
          )}
        </div>
      </div>

      {/* Navigation Links Filtered by Role */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeScreen === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectScreen(item.id)}
                className={`w-full flex items-center ${
                  collapsed ? 'justify-center px-0' : 'justify-between px-3'
                } py-2.5 rounded-xl text-xs font-medium transition-all group cursor-pointer ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 font-bold border border-blue-200/80 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
                title={collapsed ? item.label : undefined}
              >
                <div className="flex items-center space-x-3">
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-105 ${
                      isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-700'
                    }`}
                  />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </div>

                {!collapsed && item.badge !== undefined && item.badge > 0 && (
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                      isActive
                        ? 'bg-blue-600 text-white font-bold'
                        : item.id === 'risk'
                        ? 'bg-rose-100 text-rose-700 border border-rose-200'
                        : 'bg-amber-100 text-amber-800 border border-amber-200'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Bottom Footer & Collapse Toggle */}
      <div className="p-3 border-t border-slate-200 bg-slate-50/70">
        {!collapsed && (
          <div className="px-3 py-2 mb-2 bg-white rounded-xl border border-slate-200 text-[11px] text-slate-600 shadow-2xs">
            <div className="flex items-center space-x-1.5 text-blue-700 font-semibold mb-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="truncate">{roleNames[role] || role}</span>
            </div>
            <span className="text-[10px] text-slate-400">Access Scope: {role}</span>
          </div>
        )}
        <button
          onClick={onToggleCollapse}
          className="w-full flex items-center justify-center p-2 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition shadow-2xs cursor-pointer"
          title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </aside>
  );
};
