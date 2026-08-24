import React, { useState, useEffect } from 'react';
import { X, ShieldAlert, CheckCircle, Clock, XCircle, FileText, MapPin, Building, ChevronRight } from 'lucide-react';
import { Alert, AlertStatus, NearbyProject } from '../types';
import { api } from '../services/api';
import { RiskBadge } from './RiskBadge';

interface InvestigationModalProps {
  alert: Alert | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (alertId: number, status: AlertStatus, notes: string) => Promise<void>;
  onSelectProject?: (projectId: string) => void;
}

export const InvestigationModal: React.FC<InvestigationModalProps> = ({
  alert,
  isOpen,
  onClose,
  onSubmit,
  onSelectProject,
}) => {
  if (!isOpen || !alert) return null;

  const [selectedStatus, setSelectedStatus] = useState<AlertStatus>(alert.status);
  const [notes, setNotes] = useState(alert.resolution_notes || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [clusterProjects, setClusterProjects] = useState<NearbyProject[]>([]);
  const [loadingCluster, setLoadingCluster] = useState(false);

  const isGeoCluster = alert.alert_type === 'GEO_CLUSTER' ||
                       alert.title.toLowerCase().includes('geographic cluster') ||
                       alert.description.toLowerCase().includes('spatial density');

  useEffect(() => {
    if (isGeoCluster && alert.project_id) {
      setLoadingCluster(true);
      api.getNearbyProjects(alert.project_id, 1.0)
        .then(res => setClusterProjects(res.filter(p => p.distance_meters <= 500)))
        .catch(err => console.error(err))
        .finally(() => setLoadingCluster(false));
    }
  }, [alert.project_id, isGeoCluster]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit(alert.id, selectedStatus, notes);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const statusOptions: { value: AlertStatus; label: string; desc: string; icon: any }[] = [
    {
      value: 'UNDER_REVIEW',
      label: 'Under Review',
      desc: 'Active verification in progress by vigilance cell',
      icon: Clock,
    },
    {
      value: 'INVESTIGATION_RECOMMENDED',
      label: 'Investigation Recommended',
      desc: 'Formal on-site audit & contractor book verification required',
      icon: ShieldAlert,
    },
    {
      value: 'RESOLVED',
      label: 'Resolved / Mitigated',
      desc: 'Variance justified by authorized administrative sanction',
      icon: CheckCircle,
    },
    {
      value: 'DISMISSED',
      label: 'Dismissed',
      desc: 'False positive or expected project milestone adjustment',
      icon: XCircle,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in fade-in zoom-in duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/80 sticky top-0 z-10 backdrop-blur-md">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-50 border border-blue-200 rounded-lg text-blue-600">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Vigilance Case Triage</h3>
              <p className="text-xs text-slate-500">Alert #{alert.id} &bull; Project {alert.project_id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Alert Summary Box */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
                {alert.alert_type.replace(/_/g, ' ')}
              </span>
              <RiskBadge level={alert.severity} size="sm" />
            </div>
            <p className="text-sm font-semibold text-slate-900">{alert.title}</p>
            <p className="text-xs text-slate-600 leading-relaxed">{alert.description}</p>
          </div>

          {/* Special Geographic Cluster Anomaly Diagnostic Section */}
          {isGeoCluster && (
            <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 space-y-3 text-xs">
              <div className="flex items-center space-x-2 text-amber-900 font-bold">
                <MapPin className="w-4 h-4 text-amber-700 shrink-0" />
                <span>Geographic Cluster Anomaly Diagnostic Evidence</span>
              </div>
              <p className="text-slate-700 text-[11px] leading-relaxed">
                <strong>Why Flagged:</strong> High density of multiple sanctioned works (≥3 works within 500m radius). Audited to prevent <em>work splitting / tender slicing</em> (bypassing administrative approval ceilings), <em>duplicate asset claims</em> on identical GPS coordinates, or <em>contractor monopolization</em>.
              </p>

              {loadingCluster ? (
                <div className="py-3 text-center text-slate-500 text-xs">Loading cluster projects...</div>
              ) : clusterProjects.length > 0 ? (
                <div className="space-y-2 pt-1">
                  <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider block">
                    Clustered Projects at this site ({clusterProjects.length} neighboring works):
                  </span>
                  <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                    {clusterProjects.map(cp => (
                      <div
                        key={cp.project_id}
                        className="p-2 bg-white rounded-lg border border-amber-200 flex items-center justify-between text-[11px]"
                      >
                        <div className="min-w-0 pr-2">
                          <div className="flex items-center space-x-1.5">
                            <span className="font-mono font-bold text-blue-700">{cp.project_id}</span>
                            <span className="text-[10px] text-amber-800 bg-amber-100 border border-amber-300 px-1.5 py-0.2 rounded font-mono">
                              {cp.distance_meters === 0 ? '0m (Identical GPS)' : `${cp.distance_meters}m away`}
                            </span>
                          </div>
                          <p className="text-slate-800 font-medium truncate mt-0.5" title={cp.description}>
                            {cp.description}
                          </p>
                          <div className="text-[10px] text-slate-500 truncate">
                            Agency: {cp.implementing_agency} &bull; Sanctioned: ₹{cp.sanctioned_amount.toFixed(1)}L
                          </div>
                        </div>
                        {onSelectProject && (
                          <button
                            type="button"
                            onClick={() => {
                              onClose();
                              onSelectProject(cp.project_id);
                            }}
                            className="px-2 py-1 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 rounded text-[10px] font-semibold border border-slate-200 shrink-0"
                          >
                            View &rarr;
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          )}

          {/* Status Selector */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
              Update Case Status
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {statusOptions.map((opt) => {
                const Icon = opt.icon;
                const isSelected = selectedStatus === opt.value;
                return (
                  <div
                    key={opt.value}
                    onClick={() => setSelectedStatus(opt.value)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500'
                        : 'bg-white border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5">
                      <Icon
                        className={`w-4 h-4 ${
                          isSelected ? 'text-blue-600' : 'text-slate-500'
                        }`}
                      />
                      <span className={`text-xs font-semibold ${isSelected ? 'text-blue-700' : 'text-slate-800'}`}>
                        {opt.label}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 pl-6.5">{opt.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Inspector Notes */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center justify-between">
              <span>Inspector Findings & Verification Notes</span>
              <span className="text-[11px] font-normal text-slate-500">Recorded in Immutable Audit Trail</span>
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Verified revised administrative sanction approved on 14/02/2024. Physical inspection scheduled."
              className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none shadow-xs"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-sm transition flex items-center space-x-2"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Saving...' : 'Record Decision & Update'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
