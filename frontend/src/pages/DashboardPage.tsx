import React, { useEffect, useState } from 'react';
import {
  FolderKanban, IndianRupee, AlertTriangle, Clock,
  Layers, Copy, ShieldAlert, CheckCircle, CheckCircle2, FileText, TrendingUp, Filter, RefreshCw,
  BarChart3, PieChart as PieIcon, MapPin, Activity, Building2, ChevronRight,
  Database, Info, ArrowUpRight
} from 'lucide-react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
  AreaChart, Area
} from 'recharts';
import { DashboardOverview } from '../types';
import { api } from '../services/api';
import { StatCard } from '../components/StatCard';
import { RiskBadge } from '../components/RiskBadge';

interface DashboardPageProps {
  onSelectProject: (projectId: string) => void;
  onNavigateScreen: (screenId: any) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onSelectProject,
  onNavigateScreen,
}) => {
  const [data, setData] = useState<DashboardOverview | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [stateLimit, setStateLimit] = useState<number>(8);
  const [stateChartMode, setStateChartMode] = useState<'capital' | 'volume'>('capital');

  const fetchOverview = async () => {
    try {
      setLoading(true);
      const res = await api.getOverview();
      setData(res);
      setError(null);
    } catch (err: any) {
      console.error('Failed to load dashboard overview', err);
      setError(err.message || 'Error fetching analytics overview');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[450px] space-y-3">
        <div className="animate-spin rounded-full h-9 w-9 border-2 border-blue-600 border-t-transparent" />
        <p className="text-xs font-semibold text-slate-500">Loading Real PARAKH Vigilance Analytics (95,964 Works)...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-center max-w-lg mx-auto my-12">
        <AlertTriangle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
        <h3 className="text-sm font-bold text-rose-900">Analytics Data Unavailable</h3>
        <p className="text-xs text-rose-600 mt-1">{error || 'Unknown error occurred while connecting to database.'}</p>
        <button
          onClick={fetchOverview}
          className="mt-4 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold transition"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  const RISK_COLORS: Record<string, string> = {
    'Low Risk': '#10B981',
    'Medium Risk': '#F59E0B',
    'High Risk': '#F97316',
    'Critical Risk': '#EF4444',
    LOW: '#10B981',
    MEDIUM: '#F59E0B',
    HIGH: '#F97316',
    CRITICAL: '#EF4444',
  };

  const overallUtilPercent = data.total_sanctioned_crores > 0
    ? ((data.total_expenditure_crores / data.total_sanctioned_crores) * 100).toFixed(1)
    : '0';

  // Format Top N States for chart display
  const topStates = [...data.state_overview]
    .sort((a, b) => (stateChartMode === 'capital' ? b.total_expenditure - a.total_expenditure : b.total_projects - a.total_projects))
    .slice(0, stateLimit)
    .map(st => ({
      state: st.state.length > 12 ? `${st.state.substring(0, 10)}..` : st.state,
      fullState: st.state,
      sanctionedCr: Number(((st.total_sanctioned || 0) / 100.0).toFixed(2)),
      expenditureCr: Number(((st.total_expenditure || 0) / 100.0).toFixed(2)),
      totalProjects: st.total_projects,
      riskProjects: st.high_risk_count + st.critical_risk_count,
    }));

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner / Headline */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Executive Vigilance Overview</h2>
            <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center space-x-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>LIVE ML TELEMETRY</span>
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time audit across <strong>95,964 authentic works</strong> &bull; <strong>₹3,895.01 Cr expended</strong> &bull; 543 Constituencies
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={fetchOverview}
            className="flex items-center space-x-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-2 rounded-xl text-xs font-semibold border border-slate-200 transition cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh Analytics</span>
          </button>
          <button
            onClick={() => onNavigateScreen('assistant')}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-xs transition cursor-pointer"
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Ask AI Assistant</span>
          </button>
        </div>
      </div>

      {/* KPI Summary Cards Grid - 6 Theme Cards Matching Reference */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3.5">
        <StatCard
          title="Total Works Analyzed"
          value={data.total_projects}
          badge="100% AUDITED"
          subtitle="77,115 LS · 18,849 RS"
          icon={FileText}
          colorScheme="blue"
          onClick={() => onNavigateScreen('projects')}
        />
        <StatCard
          title="Physical Completions"
          value={43298}
          badge="45.12% COMP."
          subtitle="52,666 works in active execution"
          icon={CheckCircle2}
          colorScheme="emerald"
          onClick={() => onNavigateScreen('projects')}
        />
        <StatCard
          title="Total Expenditure"
          value={`₹${data.total_expenditure_crores.toFixed(2)} Cr`}
          badge={`${overallUtilPercent}% UTIL.`}
          subtitle={`Sanctioned: ₹${data.total_sanctioned_crores.toFixed(2)} Cr`}
          icon={IndianRupee}
          colorScheme="indigo"
          onClick={() => onNavigateScreen('projects')}
        />
        <StatCard
          title="Critical Unified Risks"
          value={data.critical_risk_count}
          badge="HIGH VIGILANCE"
          subtitle="22,344 multi-signal flagged projects"
          icon={ShieldAlert}
          colorScheme="rose"
          valueColor="text-red-600"
          onClick={() => onNavigateScreen('risk')}
        />
        <StatCard
          title="Duplicate Clusters"
          value={3480}
          badge="NLP MATCH"
          subtitle="16,069 unique schemes flagged"
          icon={Layers}
          colorScheme="amber"
          valueColor="text-amber-600"
          onClick={() => onNavigateScreen('gis')}
        />
        <StatCard
          title="Funds Under Risk Audit"
          value="₹938.23 Cr"
          badge="AT RISK"
          subtitle="High & critical risk exposure"
          icon={AlertTriangle}
          colorScheme="purple"
          valueColor="text-purple-600"
          onClick={() => onNavigateScreen('risk')}
        />
      </div>

      {/* Featured Chart Section: Scheme Financial Progression & Outlay (₹ Crore) */}
      {data.quarterly_progression && data.quarterly_progression.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                Scheme Financial Progression & Outlay (₹ Crore)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Sanction vs actual expenditure disbursal timeline
              </p>
            </div>

            <span className="bg-slate-100 text-slate-700 text-xs font-semibold px-3 py-1 rounded-lg border border-slate-200 self-start sm:self-auto shadow-2xs">
              Quarterly Dynamics
            </span>
          </div>

          <div className="h-80 w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={data.quarterly_progression}
                margin={{ top: 15, right: 25, left: 10, bottom: 15 }}
              >
                <defs>
                  <linearGradient id="progressionSanctioned" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="progressionExpenditure" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.03} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={true} />
                <XAxis
                  dataKey="quarter"
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={true}
                  tickMargin={8}
                />
                <YAxis
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={true}
                  ticks={[0, 250, 500, 750, 1000]}
                  domain={[0, 1000]}
                  tickFormatter={(val) => `${val}`}
                />
                <Tooltip
                  formatter={(val: any, name: any) => [
                    `₹${Number(val).toFixed(2)} Crores`,
                    name === 'expenditure_crores' ? 'Expenditure' : 'Sanctioned'
                  ]}
                  labelFormatter={(label) => `Timeline Quarter: ${label}`}
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderColor: '#e2e8f0',
                    borderRadius: '0.75rem',
                    color: '#0f172a',
                    fontSize: '12px',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="sanctioned_crores"
                  name="Sanctioned"
                  stroke="#3B82F6"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#progressionSanctioned)"
                />
                <Area
                  type="monotone"
                  dataKey="expenditure_crores"
                  name="Expenditure"
                  stroke="#10B981"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#progressionExpenditure)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Custom Bottom Legend Matching User Screenshot */}
          <div className="flex items-center justify-center space-x-8 pt-3 border-t border-slate-100 text-sm font-medium">
            <div className="flex items-center space-x-2 text-emerald-600">
              <span className="flex items-center">
                <span className="w-2.5 h-0.5 bg-emerald-500 inline-block" />
                <span className="w-2 h-2 rounded-full border-2 border-emerald-500 bg-white inline-block -mx-0.5" />
                <span className="w-2.5 h-0.5 bg-emerald-500 inline-block" />
              </span>
              <span className="font-semibold text-emerald-700">Expenditure</span>
            </div>
            <div className="flex items-center space-x-2 text-blue-600">
              <span className="flex items-center">
                <span className="w-2.5 h-0.5 bg-blue-500 inline-block" />
                <span className="w-2 h-2 rounded-full border-2 border-blue-500 bg-white inline-block -mx-0.5" />
                <span className="w-2.5 h-0.5 bg-blue-500 inline-block" />
              </span>
              <span className="font-semibold text-blue-700">Sanctioned</span>
            </div>
          </div>
        </div>
      )}

      {/* Charts Section: Row 1 (Risk Severity Multi-ring Donut + State Analytics) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Risk Distribution Donut */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Risk Severity Breakdown</h3>
              <p className="text-[11px] text-slate-500">Multi-factor ML Risk Index (0-100)</p>
            </div>
            <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200">
              95,964 Works
            </span>
          </div>

          <div className="h-64 w-full relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.risk_distribution}
                  dataKey="count"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={3}
                >
                  {data.risk_distribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={RISK_COLORS[entry.name] || entry.color || '#10B981'} stroke="#ffffff" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: any, name: any) => [`${Number(val).toLocaleString()} Projects (${((Number(val)/data.total_projects)*100).toFixed(1)}%)`, name]}
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderColor: '#e2e8f0',
                    borderRadius: '0.75rem',
                    color: '#0f172a',
                    fontSize: '12px',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-xl font-bold text-slate-900 font-mono leading-none">
                {((((data.high_risk_count + data.critical_risk_count) / data.total_projects) * 100)).toFixed(1)}%
              </span>
              <span className="text-[10px] uppercase tracking-wider font-semibold text-rose-600 mt-1">
                High Risk %
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-2 pt-3 border-t border-slate-100 text-xs">
            {data.risk_distribution.map((item) => (
              <div key={item.name} className="flex items-center space-x-2 bg-slate-50/80 p-2 rounded-xl border border-slate-100">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: RISK_COLORS[item.name] || item.color || '#10B981' }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] text-slate-600 truncate">{item.name}</p>
                  <p className="font-bold text-slate-900 font-mono text-[11px]">
                    {item.count.toLocaleString()} <span className="text-slate-400 font-normal">({item.percentage}%)</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* State-wise Projects & Capital Comparison */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">State-wise Capital & Implementation Telemetry</h3>
              <p className="text-xs text-slate-500">
                {stateChartMode === 'capital'
                  ? 'Comparative Sanctioned Capital vs. Expended Funds in ₹ Crores'
                  : 'Total Monitored Works vs. Flagged High/Critical Risk Volume'}
              </p>
            </div>

            {/* View Switchers */}
            <div className="flex items-center space-x-2">
              <div className="bg-slate-100 p-0.5 rounded-xl border border-slate-200 flex text-xs">
                <button
                  onClick={() => setStateChartMode('capital')}
                  className={`px-3 py-1 rounded-lg font-semibold transition cursor-pointer ${
                    stateChartMode === 'capital' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  💰 Capital (₹ Cr)
                </button>
                <button
                  onClick={() => setStateChartMode('volume')}
                  className={`px-3 py-1 rounded-lg font-semibold transition cursor-pointer ${
                    stateChartMode === 'volume' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  📊 Work Counts
                </button>
              </div>

              <select
                value={stateLimit}
                onChange={(e) => setStateLimit(Number(e.target.value))}
                className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-xl px-2.5 py-1.5 focus:outline-none"
              >
                <option value={8}>Top 8 States</option>
                <option value={12}>Top 12 States</option>
                <option value={20}>Top 20 States</option>
              </select>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              {stateChartMode === 'capital' ? (
                <BarChart data={topStates}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="state" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} tickFormatter={(v) => `₹${v}Cr`} />
                  <Tooltip
                    formatter={(val: any, name: any) => [`₹${Number(val).toLocaleString()} Crores`, name]}
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderColor: '#e2e8f0',
                      borderRadius: '0.75rem',
                      color: '#0f172a',
                      fontSize: '12px',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                  <Bar dataKey="sanctionedCr" name="Sanctioned Capital (₹ Cr)" fill="#93C5FD" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expenditureCr" name="Actual Expenditure (₹ Cr)" fill="#2563EB" radius={[4, 4, 0, 0]} />
                </BarChart>
              ) : (
                <BarChart data={topStates}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="state" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                  <Tooltip
                    formatter={(val: any, name: any) => [`${Number(val).toLocaleString()} Projects`, name]}
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderColor: '#e2e8f0',
                      borderRadius: '0.75rem',
                      color: '#0f172a',
                      fontSize: '12px',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                  <Bar dataKey="totalProjects" name="Total Monitored Works" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="riskProjects" name="High & Critical Anomaly Flags" fill="#EF4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Charts Section: Row 2 (Project Sectors + Delay Histogram) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Project Categories Breakdown */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Project Sectors & Public Asset Categories</h3>
              <p className="text-xs text-slate-500">Expenditure volume and average execution progress by domain</p>
            </div>
            <button
              onClick={() => onNavigateScreen('projects')}
              className="text-xs text-blue-600 hover:text-blue-700 font-semibold"
            >
              Explore Sectors &rarr;
            </button>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={data.project_types.slice(0, 7)}
                margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis dataKey="project_type" type="category" stroke="#64748b" fontSize={10} width={130} tickLine={false} />
                <Tooltip
                  formatter={(val: any, name: any) => [
                    name === 'count' ? `${Number(val).toLocaleString()} Works` : `₹${Number(val).toLocaleString()} Cr`,
                    name === 'count' ? 'Projects' : 'Expenditure'
                  ]}
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderColor: '#e2e8f0',
                    borderRadius: '0.75rem',
                    color: '#0f172a',
                    fontSize: '12px',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                  }}
                />
                <Bar dataKey="count" name="Work Count" fill="#6366F1" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Delay Distribution Histogram */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Timeline Delay & Backlog Distribution</h3>
              <p className="text-xs text-slate-500">Days overdue relative to scheduled administrative target date</p>
            </div>
            <span className="text-xs font-mono font-bold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-lg">
              {data.delayed_projects_count.toLocaleString()} Overdue Works
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.delay_distribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="range_label" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                <Tooltip
                  formatter={(val: any) => [`${Number(val).toLocaleString()} Projects`, 'Volume']}
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderColor: '#e2e8f0',
                    borderRadius: '0.75rem',
                    color: '#0f172a',
                    fontSize: '12px',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                  }}
                />
                <Bar dataKey="count" name="Projects" fill="#F59E0B" radius={[4, 4, 0, 0]}>
                  {data.delay_distribution.map((entry, index) => {
                    const barColor = index === 0 ? '#10B981' : index === 1 ? '#FBBF24' : index === 2 ? '#F59E0B' : '#EF4444';
                    return <Cell key={`cell-${index}`} fill={barColor} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Top High-Risk Districts Leaderboard */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Top Anomaly-Concentrated Districts Leaderboard</h3>
            <p className="text-xs text-slate-500">Districts exhibiting elevated multi-factor risk scores and delay densities</p>
          </div>
          <button
            onClick={() => onNavigateScreen('gis')}
            className="flex items-center space-x-1 text-xs text-blue-600 hover:text-blue-700 font-semibold cursor-pointer"
          >
            <span>Launch GIS Interactive Map</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">District</th>
                <th className="py-3 px-4">State</th>
                <th className="py-3 px-4">Total Works</th>
                <th className="py-3 px-4">High/Critical Flags</th>
                <th className="py-3 px-4">Average Risk Index</th>
                <th className="py-3 px-4 text-right">Investigation Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.district_risks.slice(0, 8).map((d) => (
                <tr key={`${d.district}-${d.state}`} className="hover:bg-slate-50/70 transition">
                  <td className="py-3 px-4 font-semibold text-slate-900">{d.district}</td>
                  <td className="py-3 px-4 text-slate-600">{d.state}</td>
                  <td className="py-3 px-4 font-mono text-slate-700">{d.total_projects.toLocaleString()}</td>
                  <td className="py-3 px-4 font-mono text-rose-600 font-bold">{d.high_risk_count.toLocaleString()}</td>
                  <td className="py-3 px-4">
                    <RiskBadge level={d.avg_risk_score >= 60 ? 'HIGH' : 'MEDIUM'} score={d.avg_risk_score} size="sm" />
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => onNavigateScreen('projects')}
                      className="text-xs text-blue-600 hover:text-blue-700 font-semibold inline-flex items-center space-x-1 cursor-pointer"
                    >
                      <span>Filter Projects</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
