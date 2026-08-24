import React, { useState } from 'react';
import {
  UploadCloud, FileSpreadsheet, CheckCircle, AlertTriangle,
  Download, RefreshCw, Layers, ShieldCheck, FileCheck, X
} from 'lucide-react';
import { IngestionSummary } from '../types';
import { api } from '../services/api';

export const DataIngestionPage: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [summary, setSummary] = useState<IngestionSummary | null>(null);
  const [resetting, setResetting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState<string | null>(null);

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setSummary(null);
    try {
      const res = await api.uploadFile(file);
      setSummary(res);
    } catch (err: any) {
      alert(`Upload Failed: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleResetDemo = async () => {
    if (!confirm('Reset entire database to the standard demonstration dataset?')) return;
    setResetting(true);
    setResetSuccess(null);
    try {
      const res = await api.resetDemoData();
      setResetSuccess(res.message);
    } catch (err: any) {
      alert(`Demo reset failed: ${err.message}`);
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Data Ingestion & Normalization Hub</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Ingest official CSV / Excel MPLADS expenditure reports with automated multi-field normalization, quality scoring & anomaly pipeline recalculation.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <a
            href={api.getSampleCsvUrl()}
            download="mplads_sample_template.csv"
            className="flex items-center space-x-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-3.5 py-2 rounded-xl text-xs font-semibold shadow-xs transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Sample CSV</span>
          </a>

          <button
            onClick={handleResetDemo}
            disabled={resetting}
            className="flex items-center space-x-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-3.5 py-2 rounded-xl text-xs font-semibold transition disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${resetting ? 'animate-spin' : ''}`} />
            <span>{resetting ? 'Refreshing Dataset...' : 'Reset Demo Synthetic Data'}</span>
          </button>
        </div>
      </div>

      {resetSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 flex items-center space-x-3">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{resetSuccess}</span>
        </div>
      )}

      {/* Drag & Drop Upload Container */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
            Upload MPLADS Project Spreadsheet
          </h3>
          <span className="text-[11px] text-slate-500 font-mono">Supports .csv, .xlsx, .xls</span>
        </div>

        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleFileDrop}
          className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all ${
            file
              ? 'border-blue-500 bg-blue-50/40'
              : 'border-slate-300 hover:border-slate-400 bg-slate-50/50'
          }`}
        >
          <input
            type="file"
            id="file-upload"
            accept=".csv, .xlsx, .xls"
            onChange={(e) => e.target.files && setFile(e.target.files[0])}
            className="hidden"
          />

          {file ? (
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-100 border border-blue-200 mx-auto flex items-center justify-center text-blue-600">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">{file.name}</p>
                <p className="text-xs text-slate-500 font-mono">{(file.size / 1024).toFixed(1)} KB</p>
              </div>
              <div className="flex items-center justify-center space-x-3 pt-2">
                <button
                  onClick={handleUpload}
                  disabled={uploading}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl font-semibold text-xs shadow-xs transition flex items-center space-x-2"
                >
                  <UploadCloud className="w-4 h-4" />
                  <span>{uploading ? 'Processing File...' : 'Start Ingestion & Quality Audit'}</span>
                </button>
                <button
                  onClick={() => setFile(null)}
                  className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl"
                  title="Remove File"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <label htmlFor="file-upload" className="cursor-pointer space-y-3 block">
              <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 mx-auto flex items-center justify-center text-slate-500 shadow-2xs">
                <UploadCloud className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">
                  Click to select or drag and drop MPLADS dataset file
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Automatic currency conversion (Crores/Lakhs/INR), state name standardization & geospatial validation
                </p>
              </div>
            </label>
          )}
        </div>
      </div>

      {/* Ingestion Report & Data Quality Score */}
      {summary && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-2">
              <FileCheck className="w-4 h-4 text-emerald-600" />
              <span>Data Ingestion & Quality Audit Report</span>
            </h3>
            <span className="text-xs text-emerald-700 font-semibold">{summary.message}</span>
          </div>

          {/* Quality Health Score Meter */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider block">
                Dataset Integrity & Health Score
              </span>
              <div className="text-3xl font-extrabold font-mono text-slate-900 mt-1">
                {summary.data_quality_score}%
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Computed across completeness, field constraints & standardization rules
              </p>
            </div>

            <div className="w-full sm:w-64">
              <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden p-0.5">
                <div
                  className={`h-full rounded-full ${
                    summary.data_quality_score > 80
                      ? 'bg-emerald-500'
                      : summary.data_quality_score > 60
                      ? 'bg-amber-500'
                      : 'bg-rose-500'
                  }`}
                  style={{ width: `${summary.data_quality_score}%` }}
                />
              </div>
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs">
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <span className="text-[11px] text-slate-500 block font-medium">Total Records</span>
              <span className="text-lg font-bold font-mono text-slate-900">{summary.total_records}</span>
            </div>
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <span className="text-[11px] text-slate-500 block font-medium">Valid Ingested</span>
              <span className="text-lg font-bold font-mono text-emerald-700">{summary.valid_records}</span>
            </div>
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <span className="text-[11px] text-slate-500 block font-medium">Invalid / Rejected</span>
              <span className="text-lg font-bold font-mono text-rose-700">{summary.invalid_records}</span>
            </div>
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <span className="text-[11px] text-slate-500 block font-medium">Standardized Fields</span>
              <span className="text-lg font-bold font-mono text-blue-700">
                {summary.normalized_states_count + summary.normalized_currencies_count}
              </span>
            </div>
          </div>

          {/* Validation Errors Table (if any) */}
          {summary.validation_errors && summary.validation_errors.length > 0 && (
            <div className="space-y-2 pt-2">
              <span className="text-xs font-bold text-rose-700 uppercase tracking-wider flex items-center space-x-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                <span>Rejected Row Details ({summary.validation_errors.length})</span>
              </span>
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Row #</th>
                      <th className="py-2.5 px-3">Field Name</th>
                      <th className="py-2.5 px-3">Rejected Value</th>
                      <th className="py-2.5 px-3">Rejection Reason</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {summary.validation_errors.map((err, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-700">{err.row_number}</td>
                        <td className="py-2.5 px-3 font-mono text-rose-700 font-semibold">{err.field_name}</td>
                        <td className="py-2.5 px-3 text-slate-500">{String(err.rejected_value)}</td>
                        <td className="py-2.5 px-3 text-slate-700">{err.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
