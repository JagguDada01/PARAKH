import React, { useState, useEffect } from 'react';
import {
  Cpu, Award, RefreshCw, Layers, BarChart3, CheckCircle,
  AlertCircle, ShieldCheck, Zap
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell
} from 'recharts';
import { ModelComparisonResponse, ModelRun } from '../types';
import { api } from '../services/api';

export const ModelAnalyticsPage: React.FC = () => {
  const [data, setData] = useState<ModelComparisonResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [training, setTraining] = useState(false);
  const [selectedModel, setSelectedModel] = useState<ModelRun | null>(null);

  const fetchModels = async () => {
    setLoading(true);
    try {
      const res = await api.getModelBenchmarks();
      setData(res);
      if (res.models.length > 0) {
        const active = res.models.find(m => m.is_active) || res.models[0];
        setSelectedModel(active);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModels();
  }, []);

  const handleTrainModels = async () => {
    setTraining(true);
    try {
      const res = await api.trainModels();
      setData(res);
      if (res.models.length > 0) {
        const active = res.models.find(m => m.is_active) || res.models[0];
        setSelectedModel(active);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setTraining(false);
    }
  };

  if (loading || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-semibold text-slate-500">Benchmarking ML Classifiers & Anomaly Detectors...</p>
      </div>
    );
  }

  const bestModel = data.models.find(m => m.model_name === data.best_model_name) || data.models[0];
  const cm = selectedModel?.confusion_matrix || { tn: 0, fp: 0, fn: 0, tp: 0 };
  const totalSamples = cm.tn + cm.fp + cm.fn + cm.tp || 1;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Machine Learning Model Analytics</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Cross-validation benchmarking of Supervised Risk Classifiers (LR, RF, XGB, LGBM) & Unsupervised Isolation Forest.
          </p>
        </div>

        <button
          onClick={handleTrainModels}
          disabled={training}
          className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2.5 rounded-xl text-xs font-semibold shadow-xs transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${training ? 'animate-spin' : ''}`} />
          <span>{training ? 'Training & Evaluating...' : 'Re-Train & Benchmark All Models'}</span>
        </button>
      </div>

      {/* Responsible AI & Dataset Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-start space-x-3 text-xs text-blue-900">
        <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-bold text-blue-950">Model Methodology & Ethical Constraints:</span>
          <p className="text-blue-900/90 leading-relaxed">{data.disclaimer}</p>
        </div>
      </div>

      {/* Best Model Selection Highlight Card */}
      {bestModel && (
        <div className="bg-gradient-to-r from-blue-50/80 via-indigo-50/50 to-white border border-blue-200 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center space-x-2">
              <span className="p-1.5 bg-blue-600 rounded-lg text-white">
                <Award className="w-4 h-4" />
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-blue-700">
                Optimal Supervised Classifier
              </span>
            </div>
            <h3 className="text-2xl font-black text-slate-900">{bestModel.model_name}</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              {data.evaluation_criteria_notes}
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] text-slate-500 block font-medium">F1-Score</span>
              <span className="text-lg font-bold font-mono text-emerald-700">
                {bestModel.f1_score !== undefined ? (bestModel.f1_score * 100).toFixed(1) : 0}%
              </span>
            </div>
            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] text-slate-500 block font-medium">ROC-AUC</span>
              <span className="text-lg font-bold font-mono text-blue-700">
                {bestModel.roc_auc !== undefined ? (bestModel.roc_auc * 100).toFixed(1) : 0}%
              </span>
            </div>
            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] text-slate-500 block font-medium">Precision</span>
              <span className="text-lg font-bold font-mono text-purple-700">
                {bestModel.precision !== undefined ? (bestModel.precision * 100).toFixed(1) : 0}%
              </span>
            </div>
            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] text-slate-500 block font-medium">Recall</span>
              <span className="text-lg font-bold font-mono text-amber-700">
                {bestModel.recall !== undefined ? (bestModel.recall * 100).toFixed(1) : 0}%
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Model Benchmark Comparison Table */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
          Cross-Validated Candidate Model Comparison
        </h3>

        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 uppercase font-semibold">
              <tr>
                <th className="py-3 px-4">Algorithm Name</th>
                <th className="py-3 px-4">Model Type</th>
                <th className="py-3 px-4 text-center">F1-Score</th>
                <th className="py-3 px-4 text-center">ROC-AUC</th>
                <th className="py-3 px-4 text-center">Precision</th>
                <th className="py-3 px-4 text-center">Recall</th>
                <th className="py-3 px-4 text-center">Accuracy</th>
                <th className="py-3 px-4 text-center">Active Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {data.models.map((m) => {
                const isSelected = selectedModel?.model_name === m.model_name;
                return (
                  <tr
                    key={m.model_name}
                    onClick={() => setSelectedModel(m)}
                    className={`cursor-pointer transition hover:bg-slate-50 ${
                      isSelected ? 'bg-blue-50/80 text-blue-900 font-semibold' : 'text-slate-700'
                    }`}
                  >
                    <td className="py-3.5 px-4 font-sans font-bold flex items-center space-x-2">
                      <span>{m.model_name}</span>
                      {m.is_active && (
                        <span className="bg-blue-600 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full font-mono">
                          BEST
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-sans text-slate-500">{m.model_type}</td>
                    <td className="py-3.5 px-4 text-center font-bold text-emerald-700">
                      {m.f1_score !== undefined ? (m.f1_score * 100).toFixed(1) : 0}%
                    </td>
                    <td className="py-3.5 px-4 text-center text-blue-700 font-bold">
                      {m.roc_auc !== undefined ? (m.roc_auc * 100).toFixed(1) : 0}%
                    </td>
                    <td className="py-3.5 px-4 text-center text-purple-700 font-semibold">
                      {m.precision !== undefined ? (m.precision * 100).toFixed(1) : 0}%
                    </td>
                    <td className="py-3.5 px-4 text-center text-amber-700 font-semibold">
                      {m.recall !== undefined ? (m.recall * 100).toFixed(1) : 0}%
                    </td>
                    <td className="py-3.5 px-4 text-center text-slate-700">
                      {m.accuracy !== undefined ? (m.accuracy * 100).toFixed(1) : 0}%
                    </td>
                    <td className="py-3.5 px-4 text-center font-sans">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        m.is_active ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {m.is_active ? 'SELECTED' : 'CANDIDATE'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Selected Model Deep Dive: Confusion Matrix + Feature Importance */}
      {selectedModel && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 2x2 Confusion Matrix */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                Confusion Matrix: {selectedModel.model_name}
              </h3>
              <p className="text-xs text-slate-500">
                Evaluation on {totalSamples} validation samples
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl text-center space-y-1">
                <span className="text-[11px] font-semibold text-emerald-800 uppercase">True Negatives (TN)</span>
                <div className="text-3xl font-extrabold font-mono text-emerald-900">{cm.tn}</div>
                <p className="text-[10px] text-slate-500">Normal correctly predicted as Normal</p>
              </div>

              <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl text-center space-y-1">
                <span className="text-[11px] font-semibold text-rose-800 uppercase">False Positives (FP)</span>
                <div className="text-3xl font-extrabold font-mono text-rose-900">{cm.fp}</div>
                <p className="text-[10px] text-slate-500">Normal incorrectly flagged as Anomaly</p>
              </div>

              <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl text-center space-y-1">
                <span className="text-[11px] font-semibold text-amber-800 uppercase">False Negatives (FN)</span>
                <div className="text-3xl font-extrabold font-mono text-amber-900">{cm.fn}</div>
                <p className="text-[10px] text-slate-500">Anomaly missed by classifier</p>
              </div>

              <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl text-center space-y-1">
                <span className="text-[11px] font-semibold text-blue-800 uppercase">True Positives (TP)</span>
                <div className="text-3xl font-extrabold font-mono text-blue-900">{cm.tp}</div>
                <p className="text-[10px] text-slate-500">Anomaly correctly identified</p>
              </div>
            </div>
          </div>

          {/* Feature Importance Bar Chart */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                Feature Importances ({selectedModel.model_name})
              </h3>
              <p className="text-xs text-slate-500">Relative contribution to anomaly risk prediction</p>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={selectedModel.feature_importance.slice(0, 6)}
                  layout="vertical"
                  margin={{ left: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.7} />
                  <XAxis type="number" stroke="#64748b" fontSize={11} />
                  <YAxis dataKey="feature" type="category" stroke="#64748b" fontSize={11} width={130} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderColor: '#e2e8f0',
                      borderRadius: '0.5rem',
                      color: '#0f172a',
                      fontSize: '12px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    }}
                  />
                  <Bar dataKey="importance" name="Relative Weight" fill="#2563EB" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
