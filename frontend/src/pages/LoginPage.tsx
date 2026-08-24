import React, { useState } from 'react';
import {
  Shield, ShieldAlert, Lock, Mail, ArrowRight, UserCheck,
  Bot, Sparkles, Activity, Eye, CheckCircle2, User, Key
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';

interface LoginPageProps {
  onLoginSuccess: () => void;
}

interface RoleDefinition {
  role: UserRole;
  title: string;
  badge: string;
  desc: string;
  features: string[];
  color: string;
  activeColor: string;
  icon: any;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const { prototypeLogin, demoLogin } = useAuth();
  const [email, setEmail] = useState('officer@mplads.gov.in');
  const [fullName, setFullName] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('INVESTIGATOR');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const roleDefinitions: RoleDefinition[] = [
    {
      role: 'INVESTIGATOR',
      title: 'Central Vigilance Investigator',
      badge: 'Operational Vigilance',
      desc: 'Investigate geographic clusters, progress discrepancies, and record field audit findings.',
      features: [
        'Alert triage & case management',
        'Geographic cluster & duplicate asset deep-dives',
        'Financial payee disbursement ledger verification',
        'Immutable inspector audit notes',
      ],
      color: 'border-blue-200 bg-blue-50/50 hover:bg-blue-50 text-blue-900',
      activeColor: 'border-blue-600 bg-blue-50/90 ring-2 ring-blue-500 text-blue-900',
      icon: ShieldAlert,
    },
    {
      role: 'ADMIN',
      title: 'National Nodal Administrator',
      badge: 'Nodal Governance',
      desc: 'Full administrative governance, dataset ingestion pipelines, and system configuration.',
      features: [
        'Multi-format CSV / Excel data ingestion',
        'Automated schema normalization & recalculation',
        'Full user & permission governance',
        'System health & pipeline telemetry',
      ],
      color: 'border-indigo-200 bg-indigo-50/50 hover:bg-indigo-50 text-indigo-900',
      activeColor: 'border-indigo-600 bg-indigo-50/90 ring-2 ring-indigo-500 text-indigo-900',
      icon: Shield,
    },
    {
      role: 'ANALYST',
      title: 'Chief Data Analyst / ML Engineer',
      badge: 'AI Telemetry & ML',
      desc: 'Evaluate machine learning models, benchmark ROC/AUC metrics, and calibrate anomaly thresholds.',
      features: [
        'Isolation Forest, Random Forest & XGBoost metrics',
        'ROC curves, precision-recall & confusion matrices',
        'Risk distribution curves & sensitivity tuning',
        'Model training run comparison logs',
      ],
      color: 'border-purple-200 bg-purple-50/50 hover:bg-purple-50 text-purple-900',
      activeColor: 'border-purple-600 bg-purple-50/90 ring-2 ring-purple-500 text-purple-900',
      icon: Activity,
    },
    {
      role: 'VIEWER',
      title: 'Public Oversight Auditor / Citizen',
      badge: 'Open Transparency',
      desc: 'Read-only public transparency portal, expenditure analytics, and nationwide GIS explorer.',
      features: [
        'Nationwide GIS map & spatial visualizer',
        'Constituency & sector expenditure explorer',
        'Public project files & financial milestones',
        'AI conversational transparency assistant',
      ],
      color: 'border-emerald-200 bg-emerald-50/50 hover:bg-emerald-50 text-emerald-900',
      activeColor: 'border-emerald-600 bg-emerald-50/90 ring-2 ring-emerald-500 text-emerald-900',
      icon: Eye,
    },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please enter an email address');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await prototypeLogin(email.trim(), selectedRole, fullName.trim() || undefined);
      onLoginSuccess();
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickInstantLogin = async (role: UserRole) => {
    setLoading(true);
    setError(null);
    try {
      await demoLogin(role);
      onLoginSuccess();
    } catch (err: any) {
      setError(err.message || 'Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  const activeRoleDef = roleDefinitions.find(r => r.role === selectedRole) || roleDefinitions[0];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 relative">
      {/* Ambient background styling */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-100/60 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-100/60 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-4xl w-full mx-auto space-y-6 z-10">
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <img
            src="/parakh-logo.png"
            alt="PARAKH Logo"
            className="h-16 w-auto max-w-[280px] mx-auto object-contain drop-shadow-sm mb-1"
          />
          <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto">
            Ministry of Statistics and Programme Implementation (MoSPI) &bull; Official Vigilance & Anomaly Audit Portal
          </p>
          <div className="inline-flex items-center space-x-1.5 bg-blue-50 border border-blue-200 text-blue-800 text-[11px] font-semibold px-3 py-1 rounded-full font-mono">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>Ministry of Statistics and Programme Implementation &bull; Multi-Role Security Portal</span>
          </div>
        </div>

        {/* Main Card Container */}
        <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden grid grid-cols-1 lg:grid-cols-12">
          {/* Left Column: Role Definitions & Selection */}
          <div className="lg:col-span-7 p-6 sm:p-8 space-y-5 border-b lg:border-b-0 lg:border-r border-slate-200 bg-slate-50/40">
            <div>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
                <UserCheck className="w-4 h-4 text-blue-600" />
                <span>1. Select Defined System Role</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Choose the role profile to authenticate for this session. Different roles unlock tailored views and permissions.
              </p>
            </div>

            {/* 4 Role Cards */}
            <div className="space-y-3">
              {roleDefinitions.map((r) => {
                const Icon = r.icon;
                const isSelected = selectedRole === r.role;
                return (
                  <div
                    key={r.role}
                    onClick={() => setSelectedRole(r.role)}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all duration-150 ${
                      isSelected ? r.activeColor : `${r.color} bg-white`
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start space-x-3">
                        <div className={`p-2 rounded-xl border mt-0.5 ${
                          isSelected ? 'bg-white border-blue-300 text-blue-700 shadow-2xs' : 'bg-slate-50 border-slate-200 text-slate-600'
                        }`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center space-x-2 flex-wrap">
                            <span className="text-xs font-bold text-slate-900">{r.title}</span>
                            <span className="text-[10px] font-semibold font-mono bg-white border border-slate-200 px-1.5 py-0.2 rounded text-slate-600">
                              {r.badge}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600 mt-1 leading-snug">
                            {r.desc}
                          </p>
                        </div>
                      </div>

                      <div className="shrink-0 mt-0.5">
                        <input
                          type="radio"
                          name="selected_role"
                          checked={isSelected}
                          onChange={() => setSelectedRole(r.role)}
                          className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-slate-300"
                        />
                      </div>
                    </div>

                    {/* Features list when selected */}
                    {isSelected && (
                      <div className="mt-3 pt-2.5 border-t border-slate-200/80 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                        {r.features.map((feat, idx) => (
                          <div key={idx} className="flex items-center space-x-1.5 text-[10px] text-slate-700">
                            <CheckCircle2 className="w-3 h-3 text-blue-600 shrink-0" />
                            <span className="truncate">{feat}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Login Form */}
          <div className="lg:col-span-5 p-6 sm:p-8 space-y-6 flex flex-col justify-between bg-white">
            <div className="space-y-5">
              <div>
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
                  <Key className="w-4 h-4 text-blue-600" />
                  <span>2. Official Credentials & Sign In</span>
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Enter your official email address to authenticate as <strong className="text-slate-800">{activeRoleDef.title}</strong>.
                </p>
              </div>

              {error && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center space-x-2">
                  <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Email Address Input */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Official Email ID
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. officer@nic.in or your.name@domain.gov.in"
                      required
                      className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-2xs"
                    />
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Government employee / auditor email credentials
                  </span>
                </div>

                {/* Optional Full Name / Officer Title */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Display Name / Designation <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder={`e.g. Officer ${selectedRole.charAt(0) + selectedRole.slice(1).toLowerCase()}`}
                      className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-2xs"
                    />
                  </div>
                </div>

                {/* Primary Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center justify-center space-x-2 mt-2 cursor-pointer"
                >
                  <span>{loading ? 'Authenticating...' : `Sign In as ${activeRoleDef.badge}`}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </div>

            {/* Quick Role Login Shortcuts */}
            <div className="pt-4 border-t border-slate-100 space-y-2.5">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Quick Role Login:
              </span>
              <div className="grid grid-cols-2 gap-2">
                {roleDefinitions.map(r => (
                  <button
                    key={r.role}
                    type="button"
                    onClick={() => handleQuickInstantLogin(r.role)}
                    className="p-2 bg-slate-50 hover:bg-blue-50 hover:text-blue-700 text-slate-700 rounded-xl text-[11px] font-semibold border border-slate-200 transition text-center truncate shadow-2xs"
                  >
                    {r.role === 'INVESTIGATOR' ? '★ Investigator' : r.role === 'ADMIN' ? 'Administrator' : r.role === 'ANALYST' ? 'ML Analyst' : 'Auditor / Public'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="text-center text-xs text-slate-500 space-y-1">
          <p>
            MPLADS AI Vigilance System &bull; Secure Role-Based Access Control Architecture
          </p>
          <p className="text-[11px] text-slate-400">
            Authorized access only. All activities are monitored and logged under MoSPI guidelines.
          </p>
        </div>
      </div>
    </div>
  );
};
