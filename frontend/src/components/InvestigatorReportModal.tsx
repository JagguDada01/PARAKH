import React, { useState } from 'react';
import { X, ShieldAlert, FileText, CheckCircle2, Upload, Camera, AlertTriangle, Calendar, User } from 'lucide-react';
import { ProjectDetail } from '../types';
import { api } from '../services/api';

interface InvestigatorReportModalProps {
  project: ProjectDetail;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const InvestigatorReportModal: React.FC<InvestigatorReportModalProps> = ({
  project,
  isOpen,
  onClose,
  onSuccess,
}) => {
  if (!isOpen) return null;

  const [verifiedPct, setVerifiedPct] = useState<number>(project.physical_progress);
  const [siteStatus, setSiteStatus] = useState('VERIFIED_NORMAL');
  const [findings, setFindings] = useState('');
  const [recommendation, setRecommendation] = useState('');
  const [inspectorName, setInspectorName] = useState('Central Vigilance Officer');
  const [documentRef, setDocumentRef] = useState('');
  const [selectedIrregularities, setSelectedIrregularities] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const irregularityOptions = [
    'Measurement Book (MB) quantity discrepancy',
    'Claimed stage % exceeds physical ground reality (>15% gap)',
    'Work splitting detected across adjacent tenders',
    'Contractor execution halted / abandoned site',
    'Suspected duplicate structure on identical GPS coordinates',
    'Sub-standard construction materials observed',
  ];

  const toggleIrregularity = (irr: string) => {
    if (selectedIrregularities.includes(irr)) {
      setSelectedIrregularities(selectedIrregularities.filter(i => i !== irr));
    } else {
      setSelectedIrregularities([...selectedIrregularities, irr]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!findings.trim() || !recommendation.trim()) {
      setError('Please provide findings summary and inspection recommendation');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await api.submitInvestigationReport(project.project_id, {
        physical_verified_pct: Number(verifiedPct),
        site_status: siteStatus,
        findings_summary: findings,
        irregularities_observed: selectedIrregularities,
        recommendation: recommendation,
        inspector_name: inspectorName,
        document_ref: documentRef || undefined,
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to submit report');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in fade-in zoom-in duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/80 sticky top-0 z-10 backdrop-blur-md">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-50 border border-blue-200 rounded-xl text-blue-700">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Upload Field Investigation Report</h3>
              <p className="text-xs text-slate-500">
                Official Vigilance Physical Audit Record &bull; {project.project_id}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
              {error}
            </div>
          )}

          {/* Project Focal Header */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-mono font-bold text-blue-700">{project.project_id}</span>
              <span className="text-slate-500">Claimed Progress: <strong>{project.physical_progress}%</strong></span>
            </div>
            <p className="text-slate-800 font-medium line-clamp-1">{project.description}</p>
            <div className="text-[11px] text-slate-500">
              Agency: {project.implementing_agency} &bull; District: {project.district} ({project.state})
            </div>
          </div>

          {/* Verification Fields: Physical Progress & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Verified Ground Physical Stage (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={verifiedPct}
                onChange={(e) => setVerifiedPct(Number(e.target.value))}
                required
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:border-blue-500"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                Compare with claimed {project.physical_progress}%
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Site Verification Status
              </label>
              <select
                value={siteStatus}
                onChange={(e) => setSiteStatus(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
              >
                <option value="VERIFIED_NORMAL">Verified Normal (Nominal Progress)</option>
                <option value="IRREGULARITY_FOUND">Irregularity Found (Variance in MB/Materials)</option>
                <option value="WORK_HALTED">Work Halted / Contractor Inaction</option>
                <option value="WORK_SPLITTING_SUSPECTED">Work Splitting Suspected across Tenders</option>
                <option value="DUPLICATE_ASSET_CONFIRMED">Duplicate Asset Confirmed on Site</option>
              </select>
            </div>
          </div>

          {/* Checklist of Irregularities */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700">
              Checklist of Irregularities Observed (Select all applicable)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {irregularityOptions.map((irr, idx) => {
                const checked = selectedIrregularities.includes(irr);
                return (
                  <div
                    key={idx}
                    onClick={() => toggleIrregularity(irr)}
                    className={`p-2.5 rounded-xl border text-xs cursor-pointer transition flex items-start space-x-2 ${
                      checked
                        ? 'bg-rose-50 border-rose-300 text-rose-900 font-medium'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleIrregularity(irr)}
                      className="mt-0.5 rounded text-rose-600 focus:ring-rose-500"
                    />
                    <span className="text-[11px] leading-snug">{irr}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Inspection Findings Summary */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Field Findings Summary & Ground Observations
            </label>
            <textarea
              rows={3}
              value={findings}
              onChange={(e) => setFindings(e.target.value)}
              placeholder="e.g. Conducted physical inspection of site on 24/08/2026. Excavation and foundation completed, superstructure masonry at 45% level. Discrepancy observed between claimed expenditure pace and on-ground curing progress."
              required
              className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 shadow-2xs resize-none"
            />
          </div>

          {/* Official Vigilance Recommendation */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Vigilance Recommendation for Nodal Collectorate
            </label>
            <textarea
              rows={2}
              value={recommendation}
              onChange={(e) => setRecommendation(e.target.value)}
              placeholder="e.g. Recommended to withhold 3rd installment release until contractor submits revised measurement book and structural validation report."
              required
              className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 shadow-2xs resize-none"
            />
          </div>

          {/* Supporting Document / Photo Reference & Inspector Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Attach Document / Photo Reference
              </label>
              <div className="relative">
                <FileText className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={documentRef}
                  onChange={(e) => setDocumentRef(e.target.value)}
                  placeholder="e.g. MB-Audit-Doc-2024.pdf / GPS-Photo-1.jpg"
                  className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500 shadow-2xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Inspecting Officer Designation
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={inspectorName}
                  onChange={(e) => setInspectorName(e.target.value)}
                  placeholder="e.g. Shri V. K. Sharma, Vigilance Officer"
                  className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500 shadow-2xs"
                />
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center space-x-2"
            >
              <Upload className="w-4 h-4" />
              <span>{submitting ? 'Recording Report...' : 'Upload & Record Official Report'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
