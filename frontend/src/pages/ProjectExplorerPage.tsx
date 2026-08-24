import React, { useState, useEffect } from 'react';
import {
  Search, Filter, Download, ArrowUpDown, ChevronRight,
  RefreshCw, CheckCircle, AlertTriangle, Eye, ArrowUpRight,
  IndianRupee, Receipt
} from 'lucide-react';
import { Project } from '../types';
import { api } from '../services/api';
import { RiskBadge } from '../components/RiskBadge';
import { StatusBadge } from '../components/StatusBadge';
import { TransactionLedgerModal } from '../components/TransactionLedgerModal';

interface ProjectExplorerPageProps {
  onSelectProject: (projectId: string) => void;
}

export const ProjectExplorerPage: React.FC<ProjectExplorerPageProps> = ({ onSelectProject }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterOptions, setFilterOptions] = useState<any>(null);
  const [selectedTxProjectId, setSelectedTxProjectId] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [districtFilter, setDistrictFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [riskFilter, setRiskFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('risk_desc');

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const data = await api.listProjects({
        search: search || undefined,
        state: stateFilter || undefined,
        district: districtFilter || undefined,
        project_type: typeFilter || undefined,
        risk_level: riskFilter || undefined,
        status: statusFilter || undefined,
        sort_by: sortBy,
        limit: 150,
      });
      setProjects(data);
    } catch (err) {
      console.error('Failed to load projects', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    api.getFilterOptions().then(setFilterOptions).catch(console.error);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProjects();
    }, 200);
    return () => clearTimeout(timer);
  }, [search, stateFilter, districtFilter, typeFilter, riskFilter, statusFilter, sortBy]);

  const handleExportCSV = () => {
    if (!projects.length) return;
    const headers = [
      'Project ID', 'State', 'District', 'Constituency', 'Type', 'Description',
      'Sanctioned (Lakhs)', 'Expenditure (Lakhs)', 'Physical Progress (%)',
      'Financial Progress (%)', 'Delay (Days)', 'Cost Escalation (%)', 'Risk Level', 'Risk Score', 'Status'
    ];
    const rows = projects.map(p => [
      p.project_id, p.state, p.district, p.constituency, `"${p.project_type}"`, `"${p.description.replace(/"/g, '""')}"`,
      p.sanctioned_amount, p.expenditure, p.physical_progress, p.financial_progress,
      p.delay_days, p.cost_escalation_pct, p.risk_score?.risk_level || 'LOW', p.risk_score?.overall_score || 0, p.status
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `mplads_projects_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const stateList = filterOptions?.states || [];
  const sectorList = filterOptions?.project_types || [];

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">MPLADS Project Explorer</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Browse, filter and audit all 43,506 real parliamentary constituency development projects across India.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleExportCSV}
            className="flex items-center space-x-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-3.5 py-2 rounded-xl text-xs font-semibold shadow-xs transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={fetchProjects}
            className="flex items-center space-x-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-3.5 py-2 rounded-xl text-xs font-semibold shadow-xs transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Project ID, work description, MP Name, district or constituency..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white border border-slate-300 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition shadow-2xs"
          />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* State Filter */}
          <div>
            <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">State / UT</label>
            <select
              value={stateFilter}
              onChange={(e) => setStateFilter(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 shadow-2xs"
            >
              <option value="">All States ({stateList.length || 36})</option>
              {stateList.map((st: string) => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>
          </div>

          {/* Sector Type */}
          <div>
            <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Sector Type</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 shadow-2xs"
            >
              <option value="">All Sectors</option>
              {sectorList.map((sec: string) => (
                <option key={sec} value={sec}>{sec.length > 30 ? sec.slice(0, 30) + '...' : sec}</option>
              ))}
            </select>
          </div>

          {/* Risk Level */}
          <div>
            <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Risk Rating</label>
            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 shadow-2xs"
            >
              <option value="">All Risk Levels</option>
              <option value="CRITICAL">Critical Risk (81-100)</option>
              <option value="HIGH">High Risk (61-80)</option>
              <option value="MEDIUM">Medium Risk (31-60)</option>
              <option value="LOW">Low Risk (0-30)</option>
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 shadow-2xs"
            >
              <option value="">All Statuses</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="DELAYED">Delayed</option>
              <option value="STALLED">Stalled</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </div>

          {/* Sort By */}
          <div>
            <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Sort Order</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 shadow-2xs"
            >
              <option value="risk_desc">Highest Risk First</option>
              <option value="cost_desc">Highest Expenditure</option>
              <option value="newest">Most Recently Added</option>
            </select>
          </div>

          {/* Reset Filters */}
          <div className="flex items-end">
            <button
              onClick={() => {
                setSearch('');
                setStateFilter('');
                setDistrictFilter('');
                setTypeFilter('');
                setRiskFilter('');
                setStatusFilter('');
                setSortBy('risk_desc');
              }}
              className="w-full py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold border border-slate-200 transition"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Projects Data Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="text-xs text-slate-600">
            Showing <span className="font-bold text-slate-900">{projects.length}</span> matching projects
          </div>
          {riskFilter && (
            <span className="text-xs font-semibold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded border border-rose-200">
              Filtered: {riskFilter} Risk Only
            </span>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20 space-x-3">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-slate-500">Filtering records...</span>
          </div>
        ) : projects.length === 0 ? (
          <div className="py-20 text-center space-y-2">
            <p className="text-sm font-semibold text-slate-800">No projects match the specified filter criteria</p>
            <p className="text-xs text-slate-500">Try resetting filters or adjusting search keywords.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Project ID & Title</th>
                  <th className="py-3 px-4">Location / MP</th>
                  <th className="py-3 px-4">Sector Type</th>
                  <th className="py-3 px-4 text-right">Sanction / Spent</th>
                  <th className="py-3 px-4">Progress (Phys vs Fin)</th>
                  <th className="py-3 px-4">Risk Rating</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {projects.map((p) => {
                  const riskLevel = p.risk_score?.risk_level || 'LOW';
                  const score = p.risk_score?.overall_score || 0;
                  const isHigh = riskLevel === 'CRITICAL' || riskLevel === 'HIGH';

                  return (
                    <tr
                      key={p.project_id}
                      className={`hover:bg-slate-50/80 transition cursor-pointer ${
                        isHigh ? 'bg-rose-50/20' : ''
                      }`}
                      onClick={() => onSelectProject(p.project_id)}
                    >
                      {/* ID & Title */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="font-mono font-bold text-blue-700 flex items-center space-x-1.5">
                          <span>{p.project_id}</span>
                          {p.alerts_count > 0 && (
                            <span className="bg-rose-100 text-rose-700 border border-rose-200 text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                              {p.alerts_count}
                            </span>
                          )}
                        </div>
                        <p className="text-slate-800 font-medium truncate mt-0.5" title={p.description}>
                          {p.description}
                        </p>
                      </td>

                      {/* Location */}
                      <td className="py-3.5 px-4">
                        <div className="text-slate-900 font-medium">{p.district}, {p.state}</div>
                        <div className="text-[11px] text-slate-500 font-mono">{p.constituency} &bull; {p.mp_id}</div>
                      </td>

                      {/* Sector Type */}
                      <td className="py-3.5 px-4 text-slate-700">
                        <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200 text-[11px] font-medium">
                          {p.project_type}
                        </span>
                      </td>

                      {/* Financials */}
                      <td className="py-3.5 px-4 text-right font-mono">
                        <div className="font-bold text-slate-900">₹{p.expenditure.toFixed(2)}L</div>
                        <div className="text-[11px] text-slate-500">Sanct: ₹{p.sanctioned_amount.toFixed(2)}L</div>
                        {p.cost_escalation_pct > 0 && (
                          <div className="text-[10px] text-rose-600 font-bold font-mono">
                            +{p.cost_escalation_pct}% overrun
                          </div>
                        )}
                      </td>

                      {/* Progress Bars */}
                      <td className="py-3.5 px-4 min-w-[140px]">
                        <div className="space-y-1.5">
                          {/* Physical */}
                          <div>
                            <div className="flex justify-between text-[10px] text-slate-500 mb-0.5">
                              <span>Physical:</span>
                              <span className="font-bold text-slate-800 font-mono">{p.physical_progress.toFixed(0)}%</span>
                            </div>
                            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                              <div className="bg-blue-600 h-full rounded-full" style={{ width: `${p.physical_progress}%` }} />
                            </div>
                          </div>
                          {/* Financial */}
                          <div>
                            <div className="flex justify-between text-[10px] text-slate-500 mb-0.5">
                              <span>Financial:</span>
                              <span className="font-bold text-slate-800 font-mono">{p.financial_progress.toFixed(0)}%</span>
                            </div>
                            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  p.progress_gap_pct > 25 ? 'bg-rose-500' : 'bg-emerald-500'
                                }`}
                                style={{ width: `${p.financial_progress}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Risk Score */}
                      <td className="py-3.5 px-4">
                        <RiskBadge level={riskLevel} score={score} size="sm" />
                        {p.delay_days > 0 && (
                          <div className="text-[10px] text-amber-700 font-semibold mt-1 font-mono">
                            {p.delay_days}d delay
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <StatusBadge status={p.status} />
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center space-x-1.5">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedTxProjectId(p.project_id);
                            }}
                            className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg border border-emerald-200 transition shadow-2xs"
                            title="View Fund Transactions & Payees"
                          >
                            <Receipt className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectProject(p.project_id);
                            }}
                            className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg border border-blue-200 transition shadow-2xs"
                            title="Open Deep Dive Details"
                          >
                            <ArrowUpRight className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Transaction Ledger & Payee Modal */}
      {selectedTxProjectId && (
        <TransactionLedgerModal
          projectId={selectedTxProjectId}
          onClose={() => setSelectedTxProjectId(null)}
          onSelectProject={onSelectProject}
        />
      )}
    </div>
  );
};
