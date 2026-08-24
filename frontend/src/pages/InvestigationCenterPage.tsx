import React, { useState, useEffect } from 'react';
import {
  ClipboardCheck, ShieldAlert, Clock, CheckCircle, XCircle,
  AlertTriangle, Filter, Search, FileText, ArrowUpRight, RefreshCw
} from 'lucide-react';
import { Alert, AlertStatus } from '../types';
import { api } from '../services/api';
import { RiskBadge } from '../components/RiskBadge';
import { InvestigationModal } from '../components/InvestigationModal';

interface InvestigationCenterPageProps {
  onSelectProject: (projectId: string) => void;
}

export const InvestigationCenterPage: React.FC<InvestigationCenterPageProps> = ({ onSelectProject }) => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [severityFilter, setSeverityFilter] = useState<string>('');
  const [search, setSearch] = useState('');

  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const data = await api.listAlerts(statusFilter || undefined, severityFilter || undefined);
      setAlerts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [statusFilter, severityFilter]);

  const handleTriageSubmit = async (alertId: number, status: AlertStatus, notes: string) => {
    await api.updateAlertStatus(alertId, status, notes);
    await fetchAlerts();
  };

  const filteredAlerts = alerts.filter(a => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      a.project_id.toLowerCase().includes(s) ||
      a.title.toLowerCase().includes(s) ||
      a.description.toLowerCase().includes(s) ||
      (a.district && a.district.toLowerCase().includes(s)) ||
      (a.state && a.state.toLowerCase().includes(s))
    );
  });

  // Tally counts
  const newCount = alerts.filter(a => a.status === 'NEW').length;
  const underReviewCount = alerts.filter(a => a.status === 'UNDER_REVIEW').length;
  const invCount = alerts.filter(a => a.status === 'INVESTIGATION_RECOMMENDED').length;
  const resolvedCount = alerts.filter(a => a.status === 'RESOLVED' || a.status === 'DISMISSED').length;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Vigilance & Investigation Center</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Human-in-the-loop triage workflow for reviewing anomaly evidence, recording field findings, and tracking case resolution.
          </p>
        </div>

        <button
          onClick={fetchAlerts}
          className="flex items-center space-x-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-3.5 py-2 rounded-xl text-xs font-semibold shadow-xs transition"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Alerts</span>
        </button>
      </div>

      {/* Case Stage Kanban Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onClick={() => setStatusFilter(statusFilter === 'NEW' ? '' : 'NEW')}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            statusFilter === 'NEW'
              ? 'bg-rose-50 border-rose-500 ring-2 ring-rose-500 shadow-xs'
              : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-700">1. New Anomalies</span>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-slate-900">{newCount}</div>
          <p className="text-[11px] text-slate-500 mt-1">Pending initial review by analyst</p>
        </div>

        <div
          onClick={() => setStatusFilter(statusFilter === 'UNDER_REVIEW' ? '' : 'UNDER_REVIEW')}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            statusFilter === 'UNDER_REVIEW'
              ? 'bg-amber-50 border-amber-500 ring-2 ring-amber-500 shadow-xs'
              : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700">2. Under Review</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-slate-900">{underReviewCount}</div>
          <p className="text-[11px] text-slate-500 mt-1">Active site or measurement book audit</p>
        </div>

        <div
          onClick={() => setStatusFilter(statusFilter === 'INVESTIGATION_RECOMMENDED' ? '' : 'INVESTIGATION_RECOMMENDED')}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            statusFilter === 'INVESTIGATION_RECOMMENDED'
              ? 'bg-purple-50 border-purple-500 ring-2 ring-purple-500 shadow-xs'
              : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-700">3. Investigation Advised</span>
            <ShieldAlert className="w-4 h-4 text-purple-600" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-slate-900">{invCount}</div>
          <p className="text-[11px] text-slate-500 mt-1">Referred for departmental vigilance review</p>
        </div>

        <div
          onClick={() => setStatusFilter(statusFilter === 'RESOLVED' ? '' : 'RESOLVED')}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            statusFilter === 'RESOLVED'
              ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500 shadow-xs'
              : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">4. Resolved / Closed</span>
            <CheckCircle className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-slate-900">{resolvedCount}</div>
          <p className="text-[11px] text-slate-500 mt-1">Verified with administrative explanation</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search alerts by project, title, description, district..."
            className="w-full bg-white border border-slate-300 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 shadow-2xs"
          />
        </div>

        <div className="flex items-center space-x-2.5 text-xs w-full md:w-auto">
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500 shadow-2xs"
          >
            <option value="">All Severities</option>
            <option value="CRITICAL">Critical Severity</option>
            <option value="HIGH">High Severity</option>
            <option value="MEDIUM">Medium Severity</option>
          </select>

          <button
            onClick={() => {
              setSearch('');
              setStatusFilter('');
              setSeverityFilter('');
            }}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Alerts Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50 text-xs text-slate-600">
          <div>
            Showing <span className="font-bold text-slate-900">{filteredAlerts.length}</span> vigilance alerts
          </div>
          {statusFilter && (
            <span className="font-semibold text-blue-700 font-mono">
              Status Filter: {statusFilter.replace(/_/g, ' ')}
            </span>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20 space-x-3">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-slate-500">Loading vigilance alerts...</span>
          </div>
        ) : filteredAlerts.length === 0 ? (
          <div className="py-20 text-center space-y-2">
            <p className="text-sm font-semibold text-slate-800">No alerts found matching filter criteria</p>
            <p className="text-xs text-slate-500">All cases under selected criteria have been triaged or cleared.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 uppercase font-semibold">
                <tr>
                  <th className="py-3 px-4">Severity / Category</th>
                  <th className="py-3 px-4">Project ID & Title</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">Alert Description & Evidence</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Officer Assigned</th>
                  <th className="py-3 px-4 text-center">Triage Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAlerts.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-4">
                      <div className="space-y-1">
                        <RiskBadge level={a.severity} size="sm" showScore={false} />
                        <span className="text-[10px] font-mono text-slate-500 block">
                          {a.alert_type.replace(/_/g, ' ')}
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 max-w-xs">
                      <button
                        onClick={() => onSelectProject(a.project_id)}
                        className="font-mono font-bold text-blue-700 hover:underline block text-left"
                      >
                        {a.project_id}
                      </button>
                      <p className="text-slate-800 font-medium truncate mt-0.5" title={a.project_title}>
                        {a.project_title}
                      </p>
                    </td>

                    <td className="py-3.5 px-4 text-slate-700">
                      <div>{a.district}, {a.state}</div>
                    </td>

                    <td className="py-3.5 px-4 max-w-md">
                      <p className="font-semibold text-slate-900 text-xs">{a.title}</p>
                      <p className="text-[11px] text-slate-600 leading-relaxed mt-0.5">{a.description}</p>
                      {a.resolution_notes && (
                        <div className="mt-1.5 p-2 bg-slate-50 rounded text-[11px] text-blue-800 border border-slate-200">
                          <span className="font-semibold">Note:</span> {a.resolution_notes}
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase font-mono ${
                        a.status === 'NEW'
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : a.status === 'UNDER_REVIEW'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : a.status === 'INVESTIGATION_RECOMMENDED'
                          ? 'bg-purple-50 text-purple-700 border-purple-200'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}>
                        {a.status.replace(/_/g, ' ')}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                      {a.assigned_to || 'Unassigned'}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => {
                          setSelectedAlert(a);
                          setModalOpen(true);
                        }}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-xs transition shadow-xs"
                      >
                        Triage Case &rarr;
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Investigation Triage Modal */}
      <InvestigationModal
        alert={selectedAlert}
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedAlert(null);
        }}
        onSubmit={handleTriageSubmit}
      />
    </div>
  );
};
