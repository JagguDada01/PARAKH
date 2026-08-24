import React, { useState } from 'react';
import { X, Shield, Edit3, CheckCircle2, IndianRupee, FileText, AlertCircle } from 'lucide-react';
import { ProjectDetail, ProjectStatus } from '../types';
import { api } from '../services/api';

interface AdminProjectUpdateModalProps {
  project: ProjectDetail;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AdminProjectUpdateModal: React.FC<AdminProjectUpdateModalProps> = ({
  project,
  isOpen,
  onClose,
  onSuccess,
}) => {
  if (!isOpen) return null;

  const [status, setStatus] = useState<ProjectStatus>(project.status);
  const [sanctionedAmount, setSanctionedAmount] = useState<number>(project.sanctioned_amount);
  const [expenditure, setExpenditure] = useState<number>(project.expenditure);
  const [releasedAmount, setReleasedAmount] = useState<number>(project.released_amount);
  const [physicalProgress, setPhysicalProgress] = useState<number>(project.physical_progress);
  const [orderRef, setOrderRef] = useState(`DC-GOV-ORD-${new Date().getFullYear()}/${Math.floor(100 + Math.random() * 900)}`);
  const [remarks, setRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await api.adminUpdateProject(project.project_id, {
        status,
        sanctioned_amount: Number(sanctionedAmount),
        expenditure: Number(expenditure),
        released_amount: Number(releasedAmount),
        physical_progress: Number(physicalProgress),
        order_reference: orderRef,
        administrative_remarks: remarks,
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update project master record');
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
            <div className="p-2 bg-indigo-50 border border-indigo-200 rounded-xl text-indigo-700">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Admin Master Project Revision</h3>
              <p className="text-xs text-slate-500">
                National Nodal Governance & Sanction Update &bull; {project.project_id}
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

          {/* Warning Banner */}
          <div className="bg-indigo-50/60 border border-indigo-200 rounded-xl p-3.5 flex items-start space-x-2.5 text-xs text-indigo-900">
            <AlertCircle className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">National Nodal Administrator Authority:</span>
              <p className="text-[11px] text-indigo-800 mt-0.5">
                Modifications made here directly update the master database record, recalculate progress indices across all 43,506 works, and are recorded in the official audit trail.
              </p>
            </div>
          </div>

          {/* Official Project Status & Order Reference */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Official Project Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ProjectStatus)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:border-indigo-500"
              >
                <option value="SANCTIONED">SANCTIONED (Initial Administrative Approval)</option>
                <option value="IN_PROGRESS">IN_PROGRESS (Active On-Ground Execution)</option>
                <option value="COMPLETED">COMPLETED (Handed Over to Public Domain)</option>
                <option value="SUSPENDED_FOR_INQUIRY">SUSPENDED_FOR_INQUIRY (Halted Pending Vigilance Audit)</option>
                <option value="CANCELLED">CANCELLED (Sanction Revoked / Funds Returned)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Gazette / Collector Order Reference
              </label>
              <input
                type="text"
                value={orderRef}
                onChange={(e) => setOrderRef(e.target.value)}
                placeholder="e.g. DC-REV-2024/098"
                required
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Financial Revisions Grid */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
              Financial Sanction & Progress Adjustment (₹ in Lakhs)
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Sanctioned Amount (₹L)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={sanctionedAmount}
                  onChange={(e) => setSanctionedAmount(Number(e.target.value))}
                  required
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono font-bold text-blue-700 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Released Funds (₹L)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={releasedAmount}
                  onChange={(e) => setReleasedAmount(Number(e.target.value))}
                  required
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Total Expended (₹L)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={expenditure}
                  onChange={(e) => setExpenditure(Number(e.target.value))}
                  required
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono font-bold text-emerald-700 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Physical progress slider */}
            <div className="pt-2">
              <div className="flex justify-between items-center text-xs mb-1">
                <span className="font-semibold text-slate-700">Official Physical Progress Stage (%)</span>
                <span className="font-mono font-bold text-indigo-700">{physicalProgress.toFixed(1)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="0.5"
                value={physicalProgress}
                onChange={(e) => setPhysicalProgress(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>
          </div>

          {/* Administrative Directives & Remarks */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Administrative Directives & Nodal Remarks
            </label>
            <textarea
              rows={3}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="e.g. Revised administrative sanction approved following technical committee appraisal. Unutilized savings of ₹2.4L adjusted. Project completion target updated."
              required
              className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 shadow-2xs resize-none"
            />
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
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center space-x-2"
            >
              <Edit3 className="w-4 h-4" />
              <span>{submitting ? 'Applying Revisions...' : 'Apply Official Revision & Update Master'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
