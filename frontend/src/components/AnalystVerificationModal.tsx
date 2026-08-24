import React, { useState } from 'react';
import { X, Activity, ShieldAlert, Cpu, CheckCircle2, ArrowUpRight, FileCheck, Sliders } from 'lucide-react';
import { ProjectDetail } from '../types';
import { api } from '../services/api';

interface AnalystVerificationModalProps {
  project: ProjectDetail;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AnalystVerificationModal: React.FC<AnalystVerificationModalProps> = ({
  project,
  isOpen,
  onClose,
  onSuccess,
}) => {
  if (!isOpen) return null;

  const [assessment, setAssessment] = useState('');
  const [confidence, setConfidence] = useState<number>(0.92);
  const [escalationReason, setEscalationReason] = useState('');
  const [recommendedAction, setRecommendedAction] = useState('Withhold 3rd installment release & order detailed technical measurement audit');
  const [analystName, setAnalystName] = useState('Chief Data Analyst / ML Cell');
  const [selectedIndicators, setSelectedIndicators] = useState<string[]>([
    'Isolation Forest anomaly score in top 5% risk tail',
    'Financial vs Physical progress gap >20%',
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const indicatorOptions = [
    'Isolation Forest anomaly score in top 5% risk tail',
    'Financial vs Physical progress gap >20%',
    'Timeline delay exceeds 90th percentile across sector',
    'Geographic cluster density (≥3 works in 500m radius)',
    'High NLP semantic similarity duplicate candidate (>85%)',
    'Disproportionate single-contractor capital allocation',
  ];

  const toggleIndicator = (ind: string) => {
    if (selectedIndicators.includes(ind)) {
      setSelectedIndicators(selectedIndicators.filter(i => i !== ind));
    } else {
      setSelectedIndicators([...selectedIndicators, ind]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assessment.trim() || !escalationReason.trim()) {
      setError('Please provide statistical assessment and escalation reason');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await api.submitAnalystVerification(project.project_id, {
        statistical_risk_assessment: assessment,
        confidence_score: Number(confidence),
        anomaly_indicators: selectedIndicators,
        escalation_reason: escalationReason,
        recommended_admin_action: recommendedAction,
        analyst_name: analystName,
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to submit analyst verification');
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
            <div className="p-2 bg-purple-50 border border-purple-200 rounded-xl text-purple-700">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">ML Data Analysis & Nodal Escalation</h3>
              <p className="text-xs text-slate-500">
                Quantitative ML Verification & Admin Action Referral &bull; {project.project_id}
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

          {/* ML Telemetry Metric Box */}
          <div className="grid grid-cols-3 gap-3 p-3.5 bg-purple-50/60 border border-purple-200 rounded-2xl text-center">
            <div className="bg-white p-2.5 rounded-xl border border-purple-100">
              <span className="text-[10px] text-slate-500 block">Isolation Forest ML</span>
              <span className="text-sm font-bold font-mono text-purple-700">{project.risk_score?.ml_risk || 78}/100</span>
            </div>
            <div className="bg-white p-2.5 rounded-xl border border-purple-100">
              <span className="text-[10px] text-slate-500 block">Progress Discrepancy</span>
              <span className="text-sm font-bold font-mono text-rose-700">+{project.progress_gap_pct}%</span>
            </div>
            <div className="bg-white p-2.5 rounded-xl border border-purple-100">
              <span className="text-[10px] text-slate-500 block">Composite Risk Rating</span>
              <span className="text-sm font-bold font-mono text-slate-900">{project.risk_score?.overall_score || 0}/100</span>
            </div>
          </div>

          {/* Confidence Score Slider */}
          <div className="space-y-1.5 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-700">Statistical Anomaly Confidence Rating</span>
              <span className="font-mono font-bold text-purple-700 bg-white border border-purple-200 px-2 py-0.5 rounded-lg text-xs">
                {(confidence * 100).toFixed(0)}% Confidence
              </span>
            </div>
            <input
              type="range"
              min="0.5"
              max="1.0"
              step="0.01"
              value={confidence}
              onChange={(e) => setConfidence(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
            />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>50% Moderate Anomaly</span>
              <span>75% High Significance</span>
              <span>100% Deterministic Outlier</span>
            </div>
          </div>

          {/* Checklist of Anomaly Vectors */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700">
              Quantitative Anomaly Vectors Validated
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {indicatorOptions.map((ind, idx) => {
                const checked = selectedIndicators.includes(ind);
                return (
                  <div
                    key={idx}
                    onClick={() => toggleIndicator(ind)}
                    className={`p-2.5 rounded-xl border text-xs cursor-pointer transition flex items-start space-x-2 ${
                      checked
                        ? 'bg-purple-50 border-purple-300 text-purple-900 font-medium'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleIndicator(ind)}
                      className="mt-0.5 rounded text-purple-600 focus:ring-purple-500"
                    />
                    <span className="text-[11px] leading-snug">{ind}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Statistical Risk Assessment */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Statistical Risk & Correlation Assessment
            </label>
            <textarea
              rows={3}
              value={assessment}
              onChange={(e) => setAssessment(e.target.value)}
              placeholder="e.g. Multivariate statistical testing confirms that expenditure pace (+38% ahead of baseline) strongly deviates from normal physical curve (p < 0.01). Cross-referencing nearby spatial vectors shows 7 other sanctions on the same coordinate grid."
              required
              className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-purple-500 shadow-2xs resize-none"
            />
          </div>

          {/* Escalation Rationale & Recommended Admin Action */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Escalation Rationale to Nodal Administrator
              </label>
              <textarea
                rows={2}
                value={escalationReason}
                onChange={(e) => setEscalationReason(e.target.value)}
                placeholder="e.g. Probability of work splitting or duplicate asset sanctioning exceeds 85%. Formal nodal intervention required before further fund disbursement."
                required
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-purple-500 shadow-2xs resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Recommended Nodal Administrative Directive
              </label>
              <input
                type="text"
                value={recommendedAction}
                onChange={(e) => setRecommendedAction(e.target.value)}
                placeholder="e.g. Issue show-cause notice and freeze installment release"
                required
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-purple-500 shadow-2xs"
              />
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
              className="px-5 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center space-x-2"
            >
              <FileCheck className="w-4 h-4" />
              <span>{submitting ? 'Escalating...' : 'Submit ML Validation & Escalate to Admin'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
