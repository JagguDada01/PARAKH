import React, { useState, useEffect } from 'react';
import {
  X, IndianRupee, ArrowDownRight, Building2, UserCheck,
  Calendar, Hash, CheckCircle, Clock, ShieldCheck, Download,
  ExternalLink, FileText
} from 'lucide-react';
import { FinancialRecord, Project } from '../types';
import { api } from '../services/api';

interface TransactionLedgerModalProps {
  projectId: string;
  onClose: () => void;
  onSelectProject?: (projectId: string) => void;
}

export const TransactionLedgerModal: React.FC<TransactionLedgerModalProps> = ({
  projectId,
  onClose,
  onSelectProject
}) => {
  const [transactions, setTransactions] = useState<FinancialRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState<any>(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.getProjectTransactions(projectId),
      api.getProjectDetail(projectId).catch(() => null)
    ])
      .then(([txList, projData]) => {
        setTransactions(txList);
        setProject(projData);
      })
      .catch((err) => console.error('Failed to fetch transactions', err))
      .finally(() => setLoading(false));
  }, [projectId]);

  const totalDisbursed = transactions.reduce((acc, t) => {
    if (t.transaction_type !== 'ADMINISTRATIVE_SANCTION') {
      return acc + t.amount;
    }
    return acc;
  }, 0);

  const getStageBadge = (type: string) => {
    switch (type) {
      case 'ADMINISTRATIVE_SANCTION':
        return { label: 'Sanction Approval', color: 'bg-purple-50 text-purple-700 border-purple-200' };
      case 'CENTRAL_RELEASE_INST_1':
        return { label: 'Central Fund Release (Inst 1)', color: 'bg-blue-50 text-blue-700 border-blue-200' };
      case 'CONTRACTOR_MOBILIZATION':
        return { label: 'Contractor Advance', color: 'bg-amber-50 text-amber-800 border-amber-200' };
      case 'RUNNING_BILL_MILESTONE_1':
        return { label: 'Milestone Progress Bill', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
      case 'MATERIALS_DISBURSEMENT':
        return { label: 'Direct Materials Supply', color: 'bg-teal-50 text-teal-700 border-teal-200' };
      case 'FINAL_SETTLEMENT':
        return { label: 'Final Handover Clearance', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      default:
        return { label: type.replace(/_/g, ' '), color: 'bg-slate-100 text-slate-700 border-slate-200' };
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-4xl max-h-[85vh] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="p-1.5 bg-blue-50 border border-blue-200 rounded-lg text-blue-600">
                <IndianRupee className="w-4 h-4" />
              </span>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                Fund Transaction Ledger & Payee Trail
              </h2>
              <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded border border-blue-200">
                {projectId}
              </span>
            </div>
            {project && (
              <p className="text-xs text-slate-500 line-clamp-1">
                {project.description} &bull; <span className="text-slate-700 font-medium">{project.district}, {project.state}</span>
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Overview Banner */}
        {project && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-50/40 border-b border-slate-200 text-xs">
            <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] text-slate-400 block uppercase font-medium">Sanctioned Amount</span>
              <span className="font-bold font-mono text-sm text-blue-700">₹{project.sanctioned_amount.toFixed(2)}L</span>
            </div>
            <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] text-slate-400 block uppercase font-medium">Total Disbursed</span>
              <span className="font-bold font-mono text-sm text-emerald-700">₹{project.expenditure.toFixed(2)}L</span>
            </div>
            <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] text-slate-400 block uppercase font-medium">Responsible MP</span>
              <span className="font-semibold text-slate-800 truncate block" title={project.mp_id}>{project.mp_id}</span>
            </div>
            <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] text-slate-400 block uppercase font-medium">Holding Agency</span>
              <span className="font-semibold text-slate-800 truncate block" title={project.implementing_agency}>{project.implementing_agency}</span>
            </div>
          </div>
        )}

        {/* Transactions Table Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center space-y-3">
              <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-slate-500">Retrieving official transaction vouchers & recipient payees...</p>
            </div>
          ) : transactions.length === 0 ? (
            <div className="py-16 text-center space-y-2">
              <p className="text-sm font-semibold text-slate-800">No transaction records found for this work</p>
              <p className="text-xs text-slate-500">All disbursements are tracked once initial sanction release is cleared.</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-600">
                <span>Verified Audit Trail ({transactions.length} Transactions)</span>
                <span className="font-mono text-emerald-700 font-bold">Total Vouchers Logged: ₹{totalDisbursed.toFixed(2)} Lakhs</span>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-3.5">Date & Voucher Ref</th>
                      <th className="py-3 px-3.5">Whom It Was Given (Payee / Recipient)</th>
                      <th className="py-3 px-3.5">Disbursement Stage</th>
                      <th className="py-3 px-3.5 text-right">Amount (₹ Lakhs)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {transactions.map((tx) => {
                      const stage = getStageBadge(tx.transaction_type);
                      const isSanction = tx.transaction_type === 'ADMINISTRATIVE_SANCTION';

                      return (
                        <tr key={tx.id} className="hover:bg-slate-50/70 transition">
                          {/* Date & Ref */}
                          <td className="py-3 px-3.5">
                            <div className="font-mono font-semibold text-slate-800">
                              {new Date(tx.date).toLocaleDateString('en-IN', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric'
                              })}
                            </div>
                            <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                              {tx.reference_number || `REF-${tx.id}`}
                            </div>
                          </td>

                          {/* Payee / Recipient */}
                          <td className="py-3 px-3.5">
                            <div className="flex items-start space-x-1.5">
                              <Building2 className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                              <div>
                                <div className="font-semibold text-slate-900">{tx.payee || 'Authorized Executing Agency'}</div>
                                {tx.description && (
                                  <div className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                                    {tx.description}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Stage */}
                          <td className="py-3 px-3.5">
                            <span className={`inline-block px-2.5 py-0.5 rounded-md border text-[10px] font-bold ${stage.color}`}>
                              {stage.label}
                            </span>
                          </td>

                          {/* Amount */}
                          <td className="py-3 px-3.5 text-right font-mono">
                            <div className={`font-bold text-sm ${isSanction ? 'text-purple-700' : 'text-emerald-700'}`}>
                              ₹{tx.amount.toFixed(2)}L
                            </div>
                            <span className="text-[10px] text-slate-400 font-sans">
                              {isSanction ? 'Sanctioned' : 'Disbursed'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50/80 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-xs text-slate-600">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Public Financial Management System (PFMS) & Escrow Verified</span>
          </div>
          {onSelectProject && (
            <button
              onClick={() => {
                onClose();
                onSelectProject(projectId);
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition shadow-sm"
            >
              <span>Open Full Project File</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
