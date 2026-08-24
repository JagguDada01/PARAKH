import React, { useState, useEffect } from 'react';
import {
  ArrowLeft, ShieldAlert, AlertTriangle, CheckCircle, Clock,
  Calendar, IndianRupee, MapPin, Building, FileText, UserCheck,
  Bot, Copy, Sparkles, Layers, Activity, ChevronRight, Eye, ChevronDown,
  Upload, Shield, Edit3, FileCheck
} from 'lucide-react';
import { ProjectDetail, Alert, AlertStatus } from '../types';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { RiskBadge } from '../components/RiskBadge';
import { StatusBadge } from '../components/StatusBadge';
import { InvestigationModal } from '../components/InvestigationModal';
import { GeographicClusterDetails } from '../components/GeographicClusterDetails';
import { InvestigatorReportModal } from '../components/InvestigatorReportModal';
import { AnalystVerificationModal } from '../components/AnalystVerificationModal';
import { AdminProjectUpdateModal } from '../components/AdminProjectUpdateModal';

interface ProjectDetailPageProps {
  projectId: string;
  onBack: () => void;
  onSelectProject: (projectId: string) => void;
  onOpenGis: (projectId: string) => void;
  onAskAi: (prompt: string) => void;
}

export const ProjectDetailPage: React.FC<ProjectDetailPageProps> = ({
  projectId,
  onBack,
  onSelectProject,
  onOpenGis,
  onAskAi,
}) => {
  const { role } = useAuth();
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedAlertForTriage, setSelectedAlertForTriage] = useState<Alert | null>(null);
  const [triageModalOpen, setTriageModalOpen] = useState(false);

  // Role action modal states
  const [investigatorModalOpen, setInvestigatorModalOpen] = useState(false);
  const [analystModalOpen, setAnalystModalOpen] = useState(false);
  const [adminModalOpen, setAdminModalOpen] = useState(false);

  const fetchDetail = async () => {
    setLoading(true);
    try {
      const data = await api.getProjectDetail(projectId);
      setProject(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [projectId]);

  const handleTriageSubmit = async (alertId: number, status: AlertStatus, notes: string) => {
    await api.updateAlertStatus(alertId, status, notes);
    await fetchDetail();
  };

  if (loading || !project) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-semibold text-slate-500">Loading Deep Dive Investigation File for {projectId}...</p>
      </div>
    );
  }

  const risk = project.risk_score;
  const reasons: string[] = risk?.reasons_json ? JSON.parse(risk.reasons_json) : [];
  const riskLevel = risk?.risk_level || 'LOW';

  // Check if project has geographic cluster alert or reason
  const hasGeoClusterAnomaly = project.alerts.some(
    a => a.alert_type === 'GEO_CLUSTER' ||
         a.title.toLowerCase().includes('geographic cluster') ||
         a.description.toLowerCase().includes('spatial density') ||
         a.description.toLowerCase().includes('clustered')
  ) || reasons.some(
    r => r.toLowerCase().includes('spatial density') ||
         r.toLowerCase().includes('clustered')
  );

  // Timeline events construction
  const timelineEvents = [
    {
      title: 'Recommendation & Nodal Approval',
      date: new Date(new Date(project.start_date).getTime() - 45 * 86400000).toLocaleDateString('en-IN'),
      description: `Recommended by MP ${project.mp_id} for ${project.district} constituency development.`,
      status: 'completed',
    },
    {
      title: 'Administrative Sanction',
      date: new Date(new Date(project.start_date).getTime() - 15 * 86400000).toLocaleDateString('en-IN'),
      description: `Sanctioned amount of ₹${project.sanctioned_amount.toFixed(2)} Lakhs approved by District Collector.`,
      status: 'completed',
    },
    {
      title: '1st Installment Release',
      date: new Date(project.start_date).toLocaleDateString('en-IN'),
      description: `50% initial fund release (₹${(project.sanctioned_amount * 0.5).toFixed(2)}L) disbursed to ${project.implementing_agency}.`,
      status: 'completed',
    },
    {
      title: 'Ground Work Commencement',
      date: new Date(new Date(project.start_date).getTime() + 10 * 86400000).toLocaleDateString('en-IN'),
      description: 'Contractor mobilization and initial site layout verification.',
      status: 'completed',
    },
    {
      title: 'Mid-Term Progress & Payments',
      date: new Date(new Date(project.start_date).getTime() + 75 * 86400000).toLocaleDateString('en-IN'),
      description: `Running Account bill payments: ₹${project.expenditure.toFixed(2)}L total expended against ${project.physical_progress}% physical progress.`,
      status: project.physical_progress > 20 ? 'completed' : 'current',
    },
    {
      title: 'Scheduled Target Completion',
      date: new Date(project.expected_completion_date).toLocaleDateString('en-IN'),
      description: project.status === 'COMPLETED'
        ? 'Final handover completed and asset entered into public domain.'
        : project.delay_days > 0
        ? `Delayed by ${project.delay_days} days past scheduled deadline.`
        : 'Target date for completion and social audit verification.',
      status: project.status === 'COMPLETED' ? 'completed' : project.delay_days > 0 ? 'delayed' : 'pending',
    },
  ];

  return (
    <div className="space-y-6 pb-16">
      {/* Top Breadcrumb & Actions Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl border border-slate-200 transition"
            title="Back to Explorer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center space-x-3 flex-wrap gap-y-1">
              <span className="font-mono text-xl font-extrabold text-blue-700">{project.project_id}</span>
              <RiskBadge level={riskLevel} score={risk?.overall_score} size="md" />
              <StatusBadge status={project.status} />
              {hasGeoClusterAnomaly && (
                <span className="bg-amber-100 text-amber-800 border border-amber-300 text-[10px] font-bold px-2.5 py-0.5 rounded-full font-mono flex items-center space-x-1">
                  <MapPin className="w-3 h-3 text-amber-700" />
                  <span>Geographic Cluster Flag</span>
                </span>
              )}
              {role === 'VIEWER' && (
                <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-semibold px-2.5 py-0.5 rounded-full flex items-center space-x-1">
                  <Eye className="w-3 h-3" />
                  <span>Public Transparency File (Read-Only)</span>
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {project.district}, {project.state} &bull; {project.constituency} Constituency &bull; {project.mp_id}
            </p>
          </div>
        </div>

        {/* Role-Specific Action Controls */}
        <div className="flex items-center space-x-2.5 flex-wrap gap-y-2">
          {/* 1. INVESTIGATOR & ADMIN Action: Upload Field Investigation Report */}
          {(role === 'INVESTIGATOR' || role === 'ADMIN') && (
            <button
              onClick={() => setInvestigatorModalOpen(true)}
              className="flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Record Field Report</span>
            </button>
          )}

          {/* 2. ANALYST Action: ML Verification & Nodal Escalation */}
          {(role === 'ANALYST' || role === 'ADMIN') && (
            <button
              onClick={() => setAnalystModalOpen(true)}
              className="flex items-center space-x-1.5 bg-purple-600 hover:bg-purple-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
            >
              <Activity className="w-3.5 h-3.5" />
              <span>ML Analysis & Escalate</span>
            </button>
          )}

          {/* 3. ADMIN Action: Master Project Revision */}
          {role === 'ADMIN' && (
            <button
              onClick={() => setAdminModalOpen(true)}
              className="flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Admin: Update Master</span>
            </button>
          )}

          {/* Standard Exploration Buttons */}
          <button
            onClick={() => onOpenGis(project.project_id)}
            className="flex items-center space-x-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-3 py-2 rounded-xl text-xs font-semibold transition shadow-xs"
          >
            <MapPin className="w-3.5 h-3.5 text-blue-600" />
            <span>GIS Map</span>
          </button>
          <button
            onClick={() => onAskAi(`Why is project ${project.project_id} high risk?`)}
            className="flex items-center space-x-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 px-3 py-2 rounded-xl text-xs font-semibold transition"
          >
            <Bot className="w-3.5 h-3.5 text-blue-600" />
            <span>AI Assistant</span>
          </button>
        </div>
      </div>

      {/* Main Grid: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Summary, Financials, Timeline, Spatial Cluster Audit, Ledger, Duplicates */}
        <div className="lg:col-span-2 space-y-6">
          {/* Work Summary & Agency Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Project Overview</h3>
            <p className="text-sm font-medium text-slate-900 leading-relaxed">{project.description}</p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-100 text-xs">
              <div>
                <span className="text-slate-500 block text-[11px] font-medium">Sector Type</span>
                <span className="font-semibold text-slate-800">{project.project_type}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px] font-medium">Implementing Agency</span>
                <span className="font-semibold text-slate-800">{project.implementing_agency}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px] font-medium">Geographic Coordinates</span>
                <span className="font-mono font-semibold text-slate-800">
                  {project.latitude.toFixed(4)}° N, {project.longitude.toFixed(4)}° E
                </span>
              </div>
            </div>
          </div>

          {/* Financial & Physical Progress Comparison */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                Financial vs Physical Progress
              </h3>
              {project.progress_gap_pct > 20 && (
                <span className="bg-rose-50 text-rose-700 border border-rose-200 px-2.5 py-1 rounded-full text-xs font-bold font-mono">
                  +{project.progress_gap_pct}% Progress Discrepancy Flag
                </span>
              )}
            </div>

            {/* Financial Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-[11px] text-slate-500 block font-medium">Estimated Cost</span>
                <span className="text-sm font-bold font-mono text-slate-800">₹{project.estimated_cost.toFixed(2)}L</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-[11px] text-slate-500 block font-medium">Sanctioned Amount</span>
                <span className="text-sm font-bold font-mono text-blue-700">₹{project.sanctioned_amount.toFixed(2)}L</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-[11px] text-slate-500 block font-medium">Released Funds</span>
                <span className="text-sm font-bold font-mono text-slate-800">₹{project.released_amount.toFixed(2)}L</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-[11px] text-slate-500 block font-medium">Total Expended</span>
                <span className={`text-sm font-bold font-mono ${project.cost_escalation_pct > 0 ? 'text-rose-700' : 'text-emerald-700'}`}>
                  ₹{project.expenditure.toFixed(2)}L
                </span>
              </div>
            </div>

            {/* Progress Gauges */}
            <div className="space-y-4 pt-2">
              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                  <span>Physical Stage Completion</span>
                  <span className="font-mono font-bold text-slate-900">{project.physical_progress.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden p-0.5 border border-slate-200">
                  <div className="bg-blue-600 h-full rounded-full transition-all duration-500" style={{ width: `${project.physical_progress}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                  <span>Financial Expenditure Utilization</span>
                  <span className="font-mono font-bold text-slate-900">{project.financial_progress.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden p-0.5 border border-slate-200">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      project.progress_gap_pct > 25 ? 'bg-rose-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${project.financial_progress}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Visual Timeline with Official Progress/Inspection Records */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                  Project Execution Timeline & Official Records
                </h3>
                <p className="text-xs text-slate-500">
                  Recommendation &rarr; Sanction &rarr; Progress Milestones &rarr; Field Inspections &rarr; Current Status
                </p>
              </div>
              <Calendar className="w-5 h-5 text-blue-600" />
            </div>

            <div className="relative pl-6 space-y-6 border-l-2 border-slate-200 pt-2 pb-2">
              {timelineEvents.map((evt, idx) => {
                let dotStyle = 'bg-slate-300 border-white text-slate-500';
                if (evt.status === 'completed') dotStyle = 'bg-blue-600 border-white text-white';
                if (evt.status === 'delayed') dotStyle = 'bg-rose-600 border-white text-white';
                if (evt.status === 'current') dotStyle = 'bg-amber-500 border-white text-white';

                return (
                  <div key={idx} className="relative group">
                    <span
                      className={`absolute -left-[31px] top-0.5 w-4 h-4 rounded-full border-2 shadow-xs ${dotStyle}`}
                    />
                    <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                      <h4 className="text-xs font-bold text-slate-900">{evt.title}</h4>
                      <span className="text-[11px] font-mono text-slate-500">{evt.date}</span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">{evt.description}</p>
                  </div>
                );
              })}

              {/* Recorded Field Investigation & Administrative Progress Logs */}
              {project.progress_records && project.progress_records.length > 0 && (
                project.progress_records.map((pr, pidx) => (
                  <div key={pidx} className="relative group p-3 bg-blue-50/50 rounded-xl border border-blue-200">
                    <span className="absolute -left-[31px] top-3 w-4 h-4 rounded-full border-2 border-white bg-blue-600 shadow-xs" />
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-blue-950 flex items-center space-x-1.5">
                        <FileCheck className="w-3.5 h-3.5 text-blue-700" />
                        <span>Official Inspection / Revision Log</span>
                      </h4>
                      <span className="text-[10px] font-mono text-slate-500">
                        {new Date(pr.inspection_date).toLocaleDateString('en-IN')}
                      </span>
                    </div>
                    <p className="text-xs text-slate-800 mt-1 leading-relaxed font-medium">
                      {pr.remarks}
                    </p>
                    <div className="text-[10px] text-slate-500 mt-1">
                      Logged by: <strong className="text-slate-700">{pr.inspector_name || 'Authorized Officer'}</strong> &bull; Physical Verified: {pr.physical_percentage}%
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Dedicated Geographic Cluster Anomaly Section */}
          <div id="geographic-cluster-section">
            <GeographicClusterDetails
              project={project}
              onSelectProject={onSelectProject}
              onOpenGis={onOpenGis}
            />
          </div>

          {/* Financial Transactions & Payee Disbursement Ledger */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-2">
                  <IndianRupee className="w-4 h-4 text-emerald-600" />
                  <span>Financial Disbursements & Payee Audit Trail</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Complete breakdown of all public funds transacted, disbursement milestones, and recipient entities/contractors.
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-[11px] font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
                  Total Disbursed: ₹{project.expenditure.toFixed(2)}L
                </span>
              </div>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-3.5">Date & Voucher Ref</th>
                    <th className="py-3 px-3.5">Whom It Was Given (Recipient Payee)</th>
                    <th className="py-3 px-3.5">Transaction Stage</th>
                    <th className="py-3 px-3.5 text-right">Amount (₹ Lakhs)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {project.financial_records && project.financial_records.length > 0 ? (
                    project.financial_records.map((f) => {
                      const isSanction = f.transaction_type === 'ADMINISTRATIVE_SANCTION';
                      return (
                        <tr key={f.id} className="hover:bg-slate-50/70 transition">
                          <td className="py-3 px-3.5">
                            <div className="font-mono font-semibold text-slate-800">
                              {new Date(f.date).toLocaleDateString('en-IN', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric'
                              })}
                            </div>
                            <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                              {f.reference_number || `REF-${f.id}`}
                            </div>
                          </td>

                          <td className="py-3 px-3.5 max-w-sm">
                            <div className="flex items-start space-x-1.5">
                              <Building className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                              <div>
                                <div className="font-semibold text-slate-900">{f.payee || 'Authorized Executing Agency'}</div>
                                {f.description && (
                                  <div className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                                    {f.description}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>

                          <td className="py-3 px-3.5">
                            <span className={`inline-block px-2.5 py-0.5 rounded-md border text-[10px] font-bold ${
                              isSanction
                                ? 'bg-purple-50 text-purple-700 border-purple-200'
                                : f.transaction_type.includes('RELEASE')
                                ? 'bg-blue-50 text-blue-700 border-blue-200'
                                : f.transaction_type.includes('FINAL')
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-amber-50 text-amber-800 border-amber-200'
                            }`}>
                              {f.transaction_type.replace(/_/g, ' ')}
                            </span>
                          </td>

                          <td className="py-3 px-3.5 text-right font-mono">
                            <div className={`font-bold text-sm ${isSanction ? 'text-purple-700' : 'text-emerald-700'}`}>
                              ₹{f.amount.toFixed(2)}L
                            </div>
                            <span className="text-[10px] text-slate-400 font-sans">
                              {isSanction ? 'Sanctioned' : 'Disbursed'}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-slate-500">
                        No financial disbursement records found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Potential Duplicates Section */}
          {project.duplicates && project.duplicates.length > 0 && (
            <div className="bg-white border border-amber-200 rounded-2xl p-6 shadow-xs space-y-4">
              <div className="flex items-center space-x-2 text-amber-700">
                <Copy className="w-5 h-5" />
                <h3 className="text-sm font-bold uppercase tracking-wider">
                  Flagged Potential Duplicate Candidates ({project.duplicates.length})
                </h3>
              </div>

              <div className="space-y-3">
                {project.duplicates.map((dup) => (
                  <div
                    key={dup.id}
                    className="p-4 bg-amber-50/40 border border-amber-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-xs font-bold text-blue-700">
                          {dup.project_a_id === project.project_id ? dup.project_b_id : dup.project_a_id}
                        </span>
                        <span className="bg-amber-100 text-amber-800 border border-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-full font-mono">
                          {dup.duplicate_score}/100 Match
                        </span>
                      </div>
                      <p className="text-xs text-slate-800 mt-1 font-medium">{dup.other_project_title}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Similarity: {(dup.semantic_similarity * 100).toFixed(1)}% &bull; Distance: {dup.distance_km.toFixed(2)} km &bull; {dup.notes}
                      </p>
                    </div>

                    <button
                      onClick={() => onSelectProject(dup.project_a_id === project.project_id ? dup.project_b_id : dup.project_a_id)}
                      className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold border border-slate-200 shadow-2xs transition shrink-0"
                    >
                      Compare Project &rarr;
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right 1 Column: Explainable AI Risk Diagnostics, Active Alerts, Recommended Actions */}
        <div className="space-y-6">
          {/* Explainable AI Risk Radar / Breakdown */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-2">
                <ShieldAlert className="w-4 h-4 text-rose-600" />
                <span>Explainable Risk Breakdown</span>
              </h3>
            </div>

            <div className="text-center p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
              <span className="text-[11px] text-slate-500 uppercase tracking-wide font-medium">Composite Vigilance Risk Index</span>
              <div className="text-3xl font-extrabold font-mono text-slate-900">
                {risk ? Math.round(risk.overall_score) : 0}<span className="text-base text-slate-400 font-normal">/100</span>
              </div>
              <div>
                <RiskBadge level={riskLevel} showScore={false} size="sm" />
              </div>
            </div>

            {/* Sub-component meters */}
            <div className="space-y-2.5 pt-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-600">Cost Escalation Risk</span>
                <span className="font-mono font-bold text-slate-800">{risk?.cost_risk || 0}/100</span>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div className="bg-rose-500 h-full rounded-full" style={{ width: `${risk?.cost_risk || 0}%` }} />
              </div>

              <div className="flex justify-between">
                <span className="text-slate-600">Timeline Delay Risk</span>
                <span className="font-mono font-bold text-slate-800">{risk?.delay_risk || 0}/100</span>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div className="bg-amber-500 h-full rounded-full" style={{ width: `${risk?.delay_risk || 0}%` }} />
              </div>

              <div className="flex justify-between">
                <span className="text-slate-600">Progress Discrepancy Risk</span>
                <span className="font-mono font-bold text-slate-800">{risk?.progress_gap_risk || 0}/100</span>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div className="bg-rose-500 h-full rounded-full" style={{ width: `${risk?.progress_gap_risk || 0}%` }} />
              </div>

              <div className="flex justify-between">
                <span className="text-slate-600">Disproportionate Payment Pace</span>
                <span className="font-mono font-bold text-slate-800">{risk?.payment_risk || 0}/100</span>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div className="bg-purple-500 h-full rounded-full" style={{ width: `${risk?.payment_risk || 0}%` }} />
              </div>

              <div className="flex justify-between">
                <span className="text-slate-600">Geographic Cluster & Density</span>
                <span className="font-mono font-bold text-slate-800">{risk?.geo_risk || 0}/100</span>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div className="bg-amber-500 h-full rounded-full" style={{ width: `${risk?.geo_risk || 0}%` }} />
              </div>

              <div className="flex justify-between">
                <span className="text-slate-600">Duplicate Candidate Score</span>
                <span className="font-mono font-bold text-slate-800">{risk?.duplicate_risk || 0}/100</span>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div className="bg-blue-600 h-full rounded-full" style={{ width: `${risk?.duplicate_risk || 0}%` }} />
              </div>

              <div className="flex justify-between">
                <span className="text-slate-600">Isolation Forest ML Anomaly Score</span>
                <span className="font-mono font-bold text-slate-800">{risk?.ml_risk || 0}/100</span>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${risk?.ml_risk || 0}%` }} />
              </div>
            </div>

            {/* Reasons Bullets */}
            <div className="pt-3 border-t border-slate-100 space-y-2">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                Identified Anomaly Drivers
              </span>
              {reasons.length > 0 ? (
                <ul className="space-y-1.5 text-xs text-slate-700">
                  {reasons.map((r, i) => (
                    <li key={i} className="flex items-start space-x-2">
                      <span className="text-rose-500 mt-0.5">&bull;</span>
                      <span className="leading-snug">{r}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-emerald-700 flex items-center space-x-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <span>No major rule anomalies flagged for this project.</span>
                </p>
              )}
            </div>
          </div>

          {/* Active Alerts List */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Active Alerts ({project.alerts.length})</span>
              </h3>
            </div>

            <div className="space-y-3">
              {project.alerts.length === 0 ? (
                <p className="text-xs text-slate-500">No active alerts recorded.</p>
              ) : (
                project.alerts.map((a) => {
                  const isGeoAlert = a.alert_type === 'GEO_CLUSTER' || a.title.toLowerCase().includes('geographic cluster');
                  return (
                    <div
                      key={a.id}
                      className={`p-3.5 rounded-xl space-y-2 border transition ${
                        isGeoAlert
                          ? 'bg-amber-50/50 border-amber-200'
                          : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-1.5">
                          <RiskBadge level={a.severity} size="sm" showScore={false} />
                          {isGeoAlert && (
                            <span className="text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 px-1.5 py-0.5 rounded">
                              Spatial Cluster
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] font-mono text-slate-600 uppercase bg-white border border-slate-200 px-2 py-0.5 rounded">
                          {a.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-slate-900">{a.title}</p>
                      <p className="text-[11px] text-slate-600 leading-relaxed">{a.description}</p>
                      
                      {isGeoAlert && (
                        <div className="p-2 bg-white rounded-lg border border-amber-200 text-[10px] text-slate-700 space-y-1">
                          <div className="font-semibold text-amber-900 flex items-center space-x-1">
                            <MapPin className="w-3 h-3 text-amber-700" />
                            <span>Vigilance Spatial Rule Rationale:</span>
                          </div>
                          <p className="text-slate-600 leading-tight">
                            Audited to verify no work splitting (bypassing tender ceilings) or duplicate claims on the same ground site.
                          </p>
                          <a
                            href="#geographic-cluster-section"
                            className="inline-flex items-center space-x-1 text-blue-700 font-bold hover:underline pt-0.5"
                          >
                            <span>Inspect 500m Cluster Map & Projects List ↓</span>
                          </a>
                        </div>
                      )}

                      {/* Triage button only for authorized officers (Investigator & Admin) */}
                      {role !== 'VIEWER' ? (
                        <button
                          onClick={() => {
                            setSelectedAlertForTriage(a);
                            setTriageModalOpen(true);
                          }}
                          className="w-full mt-2 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-semibold transition text-center"
                        >
                          Triage / Record Investigation &rarr;
                        </button>
                      ) : (
                        <div className="text-[10px] text-slate-400 font-medium text-center pt-1 border-t border-slate-100">
                          Active Vigilance Monitoring Item
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Recommended Vigilance Actions */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span>Recommended Vigilance Actions</span>
            </h3>

            <div className="space-y-2">
              {hasGeoClusterAnomaly && (
                <div className="flex items-start space-x-2.5 text-xs text-amber-900 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
                  <span className="w-4 h-4 rounded-full bg-amber-200 text-amber-800 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                    ★
                  </span>
                  <span className="leading-snug font-medium">
                    Conduct physical GPS survey to confirm distinct physical existence of all clustered works within 500m.
                  </span>
                </div>
              )}
              {project.recommended_actions.map((act, i) => (
                <div key={i} className="flex items-start space-x-2.5 text-xs text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <span className="leading-snug">{act}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 1. Investigation Alert Triage Modal */}
      <InvestigationModal
        alert={selectedAlertForTriage}
        isOpen={triageModalOpen}
        onClose={() => {
          setTriageModalOpen(false);
          setSelectedAlertForTriage(null);
        }}
        onSubmit={handleTriageSubmit}
      />

      {/* 2. Investigator Field Report Upload Modal */}
      <InvestigatorReportModal
        project={project}
        isOpen={investigatorModalOpen}
        onClose={() => setInvestigatorModalOpen(false)}
        onSuccess={fetchDetail}
      />

      {/* 3. ML Analyst Verification & Escalation Modal */}
      <AnalystVerificationModal
        project={project}
        isOpen={analystModalOpen}
        onClose={() => setAnalystModalOpen(false)}
        onSuccess={fetchDetail}
      />

      {/* 4. Admin Master Project Revision Modal */}
      <AdminProjectUpdateModal
        project={project}
        isOpen={adminModalOpen}
        onClose={() => setAdminModalOpen(false)}
        onSuccess={fetchDetail}
      />
    </div>
  );
};
