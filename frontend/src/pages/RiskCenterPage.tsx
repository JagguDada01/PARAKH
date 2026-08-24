import React, { useState, useEffect } from 'react';
import {
  ShieldAlert, Sliders, RefreshCw, AlertTriangle, CheckCircle,
  TrendingUp, Activity, Layers, ArrowUpRight
} from 'lucide-react';
import { Project } from '../types';
import { api } from '../services/api';
import { RiskBadge } from '../components/RiskBadge';

interface RiskCenterPageProps {
  onSelectProject: (projectId: string) => void;
}

export const RiskCenterPage: React.FC<RiskCenterPageProps> = ({ onSelectProject }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [recalculating, setRecalculating] = useState(false);
  const [recalculatedSuccess, setRecalculatedSuccess] = useState<string | null>(null);

  // Configurable thresholds
  const [costCritPct, setCostCritPct] = useState(50);
  const [progressGapCritPct, setProgressGapCritPct] = useState(40);
  const [delayCritDays, setDelayCritDays] = useState(180);

  const fetchRiskProjects = async () => {
    setLoading(true);
    try {
      const data = await api.listProjects({ sort_by: 'risk_desc', limit: 100 });
      setProjects(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRiskProjects();
  }, []);

  const handleRecalculate = async () => {
    setRecalculating(true);
    setRecalculatedSuccess(null);
    try {
      const res = await api.recalculateRisk({
        cost_overrun_crit_pct: costCritPct,
        progress_gap_crit_pct: progressGapCritPct,
        delay_crit_days: delayCritDays,
      });
      setRecalculatedSuccess(res.message);
      await fetchRiskProjects();
    } catch (err) {
      console.error(err);
    } finally {
      setRecalculating(false);
    }
  };

  const criticalProjects = projects.filter(p => p.risk_score?.risk_level === 'CRITICAL');
  const highProjects = projects.filter(p => p.risk_score?.risk_level === 'HIGH');
  const mediumProjects = projects.filter(p => p.risk_score?.risk_level === 'MEDIUM');
  const lowProjects = projects.filter(p => p.risk_score?.risk_level === 'LOW');

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Risk Intelligence Center</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Transparent, multi-dimensional risk scoring engine with configurable threshold simulation & anomaly auditing.
          </p>
        </div>

        <button
          onClick={fetchRiskProjects}
          className="flex items-center space-x-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-3.5 py-2 rounded-xl text-xs font-semibold shadow-xs transition"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Scores</span>
        </button>
      </div>

      {/* Threshold Sandbox & Simulator */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <Sliders className="w-5 h-5 text-blue-600" />
            <div>
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                Configurable Anomaly Threshold Sandbox
              </h3>
              <p className="text-xs text-slate-500">
                Adjust sensitivity parameters to simulate and re-score project risks across the nationwide database.
              </p>
            </div>
          </div>

          <button
            onClick={handleRecalculate}
            disabled={recalculating}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-xs font-semibold shadow-xs transition"
          >
            <Activity className="w-3.5 h-3.5" />
            <span>{recalculating ? 'Recalculating...' : 'Apply & Recalculate Scores'}</span>
          </button>
        </div>

        {recalculatedSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{recalculatedSuccess}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
          {/* Cost Escalation Slider */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-slate-700">Critical Cost Overrun Threshold</span>
              <span className="font-mono text-rose-600 font-bold">{costCritPct}% Escalation</span>
            </div>
            <input
              type="range"
              min="20"
              max="100"
              step="5"
              value={costCritPct}
              onChange={(e) => setCostCritPct(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-rose-600"
            />
            <span className="text-[11px] text-slate-500 block">Flag projects with expenditure exceeding sanctioned amount</span>
          </div>

          {/* Progress Gap Slider */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-slate-700">Critical Progress Mismatch Gap</span>
              <span className="font-mono text-orange-600 font-bold">{progressGapCritPct}% Gap</span>
            </div>
            <input
              type="range"
              min="15"
              max="80"
              step="5"
              value={progressGapCritPct}
              onChange={(e) => setProgressGapCritPct(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-orange-600"
            />
            <span className="text-[11px] text-slate-500 block">Financial progress % minus Physical progress %</span>
          </div>

          {/* Delay Days Slider */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-slate-700">Critical Timeline Delay Cutoff</span>
              <span className="font-mono text-amber-600 font-bold">{delayCritDays} Days</span>
            </div>
            <input
              type="range"
              min="60"
              max="365"
              step="15"
              value={delayCritDays}
              onChange={(e) => setDelayCritDays(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-600"
            />
            <span className="text-[11px] text-slate-500 block">Days delayed beyond scheduled completion target</span>
          </div>
        </div>
      </div>

      {/* Risk Tiers Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-800 uppercase">Critical Tier (81-100)</span>
            <span className="w-2 h-2 rounded-full bg-rose-600" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-rose-900">{criticalProjects.length} Works</div>
          <p className="text-[11px] text-rose-700 mt-1">Severe concurrent cost, progress, or delay anomalies</p>
        </div>

        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-orange-800 uppercase">High Risk Tier (61-80)</span>
            <span className="w-2 h-2 rounded-full bg-orange-600" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-orange-900">{highProjects.length} Works</div>
          <p className="text-[11px] text-orange-700 mt-1">High single-factor variance requiring field verification</p>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-800 uppercase">Medium Tier (31-60)</span>
            <span className="w-2 h-2 rounded-full bg-amber-600" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-amber-900">{mediumProjects.length} Works</div>
          <p className="text-[11px] text-amber-700 mt-1">Moderate delay or minor progress pace mismatch</p>
        </div>

        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-800 uppercase">Low Risk Tier (0-30)</span>
            <span className="w-2 h-2 rounded-full bg-emerald-600" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-emerald-900">{lowProjects.length} Works</div>
          <p className="text-[11px] text-emerald-700 mt-1">Nominal progress within expected tolerances</p>
        </div>
      </div>

      {/* High and Critical Risk Projects Priority Queue */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-2">
              <ShieldAlert className="w-4 h-4 text-rose-600" />
              <span>Priority Vigilance Triage Queue (High & Critical Risk)</span>
            </h3>
            <p className="text-xs text-slate-500">
              Ranked by composite multi-factor risk index across all parliamentary constituencies
            </p>
          </div>
        </div>

        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 uppercase font-semibold">
              <tr>
                <th className="py-3 px-4">Project ID & Title</th>
                <th className="py-3 px-4">Constituency / State</th>
                <th className="py-3 px-4">Cost Overrun</th>
                <th className="py-3 px-4">Progress Gap</th>
                <th className="py-3 px-4">Delay</th>
                <th className="py-3 px-4">Risk Rating</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {projects.filter(p => (p.risk_score?.overall_score || 0) >= 60).map((p) => {
                const r = p.risk_score;
                return (
                  <tr
                    key={p.project_id}
                    className="hover:bg-slate-50/70 transition cursor-pointer"
                    onClick={() => onSelectProject(p.project_id)}
                  >
                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="font-mono font-bold text-blue-700">{p.project_id}</div>
                      <p className="text-slate-800 font-medium truncate mt-0.5" title={p.description}>
                        {p.description}
                      </p>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="text-slate-900 font-medium">{p.district}, {p.state}</div>
                      <div className="text-[11px] text-slate-500 font-mono">{p.constituency}</div>
                    </td>

                    <td className="py-3.5 px-4 font-mono">
                      {p.cost_escalation_pct > 0 ? (
                        <span className="text-rose-700 font-bold">+{p.cost_escalation_pct}%</span>
                      ) : (
                        <span className="text-slate-400">0%</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 font-mono">
                      {p.progress_gap_pct > 0 ? (
                        <span className="text-orange-700 font-bold">+{p.progress_gap_pct}%</span>
                      ) : (
                        <span className="text-slate-400">0%</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 font-mono">
                      {p.delay_days > 0 ? (
                        <span className="text-amber-700 font-bold">{p.delay_days} days</span>
                      ) : (
                        <span className="text-emerald-700">On Track</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <RiskBadge level={r?.risk_level || 'HIGH'} score={r?.overall_score} size="sm" />
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectProject(p.project_id);
                        }}
                        className="px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg border border-blue-200 text-xs font-semibold transition"
                      >
                        Inspect &rarr;
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
