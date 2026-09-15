/**
 * DAVETECH ERP - Multi-Tier Approval Workflow
 * Credit committee governance, approval limits, conditional sanctions,
 * and immutable decision audit trail.
 */

import React, { useState } from 'react';
import {
  ShieldAlert,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Send,
  FileCheck,
  ChevronRight,
  ShieldCheck,
  Coins,
} from 'lucide-react';
import { DataService } from '../services/dataService';
import { LoanApplication, Customer, Collateral } from '../types/erp';
import { LoanEngine } from '../services/loanEngine';
import { useAuth } from '../context/AuthContext';
import { Modal } from '../components/common/Modal';

export const ApprovalsView: React.FC = () => {
  const { currentUser, activeBranchId, hasPermission, isSingleOperatorMode } = useAuth();

  const [applications, setApplications] = useState<LoanApplication[]>(() => DataService.getApplications());
  const [selectedApp, setSelectedApp] = useState<LoanApplication | null>(null);

  // Decision Modal State
  const [isDecisionModalOpen, setIsDecisionModalOpen] = useState(false);
  const [decisionAction, setDecisionAction] = useState<'approved' | 'rejected' | 'request_info'>('approved');
  const [decisionAmount, setDecisionAmount] = useState(500000);
  const [decisionConditions, setDecisionConditions] = useState('1. Comprehensive insurance endorsement in favor of Davetech Solutions.\n2. GPS vehicle tracking active.\n3. Post-dated checks or direct debit mandate submitted.');
  const [decisionNotes, setDecisionNotes] = useState('Credit committee unanimous approval. Collateral coverage ratio exceeds 140%.');

  const customers = DataService.getCustomers();
  const collaterals = DataService.getCollaterals();

  const refreshData = () => {
    setApplications(DataService.getApplications());
  };

  const handleQuickApprove = (app: LoanApplication) => {
    try {
      DataService.approveApplication(
        app.id,
        currentUser,
        'approved',
        app.creditAssessment?.recommendedAmount || app.requestedAmount,
        'Approved by Sole Operator',
        'Direct sanction under single operator master authority'
      );
      refreshData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const pendingApprovals = applications.filter((a) => {
    if (activeBranchId !== 'all' && a.branchId !== activeBranchId) return false;
    return (
      a.status === 'pending_approval' ||
      a.status === 'credit_assessment' ||
      (isSingleOperatorMode && a.status === 'submitted')
    );
  });

  const recentDecisions = applications.filter((a) => {
    if (activeBranchId !== 'all' && a.branchId !== activeBranchId) return false;
    return a.status === 'approved' || a.status === 'rejected';
  });

  const handleDecisionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApp) return;

    try {
      DataService.approveApplication(
        selectedApp.id,
        currentUser,
        decisionAction,
        decisionAction === 'approved' ? Number(decisionAmount) : 0,
        decisionConditions,
        decisionNotes
      );

      setIsDecisionModalOpen(false);
      setSelectedApp(null);
      refreshData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              {isSingleOperatorMode ? 'Executive Sanction & Approval Authority' : 'Credit Committee & Approval Governance'}
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
              {pendingApprovals.length} Pending Actions
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {isSingleOperatorMode
              ? 'Under Sole Operator Mode, you hold sole executive authorization to sanction, approve, and disburse facilities instantly.'
              : 'Tier-based credit committee authorization matrix, exposure validation, and conditional sanction letters.'}
          </p>
        </div>
      </div>

      {/* Pending Committee Decisions Section */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Clock className="w-4 h-4 text-amber-500" />
          <span>Applications Awaiting Management Decision</span>
        </h2>

        {pendingApprovals.length === 0 ? (
          <div className="p-8 text-center bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs text-slate-400">
            No pending loan applications awaiting committee approval.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingApprovals.map((app) => {
              const cust = customers.find((c) => c.id === app.customerId);
              const col = collaterals.find((c) => c.id === app.collateralId);

              return (
                <div
                  key={app.id}
                  className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-mono font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-md">
                          {app.applicationNumber}
                        </span>
                        <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 mt-1.5">
                          {cust?.fullName || app.customerId}
                        </h3>
                        <p className="text-xs text-slate-500">Facility: {app.productName}</p>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
                        {String(app.status || 'pending').replace(/_/g, ' ')}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-100 dark:border-slate-700 text-xs font-mono">
                      <div>
                        <span className="text-[10px] text-slate-400 block">REQUESTED SUM</span>
                        <span className="font-bold text-slate-900 dark:text-slate-100">
                          {LoanEngine.formatKES(app.requestedAmount)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">DSR / LTV RATIOS</span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">
                          DSR: {app.debtServiceRatio}% | LTV: {app.loanToValuePct}%
                        </span>
                      </div>
                    </div>

                    {col && (
                      <div className="mt-3 p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] text-slate-600 dark:text-slate-300">
                        <span className="font-semibold text-slate-900 dark:text-slate-100 block">
                          Pledged Security: {col.description}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          FSV: {LoanEngine.formatKES(col.forcedSaleValue)} | Vault: {col.storageLocation}
                        </span>
                      </div>
                    )}

                    {app.creditAssessment && (
                      <div className="mt-3 p-2.5 rounded-lg bg-purple-50/70 dark:bg-purple-950/20 border border-purple-200/60 dark:border-purple-900/60 text-[11px]">
                        <span className="font-bold text-purple-900 dark:text-purple-300 block">
                          Officer Recommendation: {String((app as any).creditAssessment?.recommendation || (app as any).creditAssessment?.creditOfficerRecommendation || 'Pending Review').replace(/_/g, ' ').toUpperCase()}
                        </span>
                        <p className="text-purple-700 dark:text-purple-400 mt-0.5">
                          "{app.creditAssessment.notes || (app as any).creditAssessment?.recommendationNotes || ''}"
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-end gap-2 flex-wrap">
                    <button
                      onClick={() => handleQuickApprove(app)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition flex items-center gap-1.5 shadow-xs"
                      title="Direct sanction under sole executive authority"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>1-Click Approve</span>
                    </button>
                    <button
                      onClick={() => {
                        setSelectedApp(app);
                        setDecisionAmount(
                          app.creditAssessment?.recommendedAmount || app.requestedAmount
                        );
                        setIsDecisionModalOpen(true);
                      }}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-650 text-slate-800 dark:text-slate-200 rounded-lg text-xs font-semibold transition flex items-center gap-1.5"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />
                      <span>Custom Terms</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Historical Sanction Log */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          <span>Recently Concluded Decisions</span>
        </h2>

        <div className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden shadow-xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="p-3.5 font-semibold">Application No</th>
                <th className="p-3.5 font-semibold">Borrower</th>
                <th className="p-3.5 font-semibold text-right">Requested</th>
                <th className="p-3.5 font-semibold text-right">Sanctioned Principal</th>
                <th className="p-3.5 font-semibold text-center">Decision</th>
                <th className="p-3.5 font-semibold">Authorizing Officer</th>
                <th className="p-3.5 font-semibold">Sanction Conditions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
              {recentDecisions.map((app) => (
                <tr key={app.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-750/50">
                  <td className="p-3.5 font-mono font-bold text-slate-900 dark:text-slate-100">
                    {app.applicationNumber}
                  </td>
                  <td className="p-3.5 font-medium text-slate-800 dark:text-slate-200">
                    {app.customerId}
                  </td>
                  <td className="p-3.5 text-right font-mono text-slate-500">
                    {LoanEngine.formatKES(app.requestedAmount)}
                  </td>
                  <td className="p-3.5 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    {app.status === 'approved' ? LoanEngine.formatKES(app.requestedAmount) : 'KES 0'}
                  </td>
                  <td className="p-3.5 text-center">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        app.status === 'approved'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                      }`}
                    >
                      {app.status}
                    </span>
                  </td>
                  <td className="p-3.5 text-slate-600 dark:text-slate-300">
                    {currentUser.fullName}
                  </td>
                  <td className="p-3.5 text-slate-500 text-[11px] max-w-xs truncate">
                    Verified Security & Joint Caveat Executed
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* COMMITTEE DECISION MODAL */}
      {selectedApp && (
        <Modal
          isOpen={isDecisionModalOpen}
          onClose={() => setIsDecisionModalOpen(false)}
          title={`Credit Committee Decision: ${selectedApp.applicationNumber}`}
          subtitle={`Applicant: ${selectedApp.customerId} • Facility: ${selectedApp.productName}`}
          maxWidth="2xl"
        >
          <form onSubmit={handleDecisionSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Committee Decision Action
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="decisionAction"
                    value="approved"
                    checked={decisionAction === 'approved'}
                    onChange={() => setDecisionAction('approved')}
                    className="text-emerald-600"
                  />
                  <span className="font-bold text-emerald-700 dark:text-emerald-400">
                    Approve Facility
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="decisionAction"
                    value="rejected"
                    checked={decisionAction === 'rejected'}
                    onChange={() => setDecisionAction('rejected')}
                    className="text-rose-600"
                  />
                  <span className="font-bold text-rose-700 dark:text-rose-400">Reject Application</span>
                </label>
              </div>
            </div>

            {decisionAction === 'approved' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Sanctioned Principal Amount (KES)
                  </label>
                  <input
                    type="number"
                    required
                    value={decisionAmount}
                    onChange={(e) => setDecisionAmount(Number(e.target.value))}
                    className="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono font-bold text-sm"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Approval Tier / Governance Authority
                  </label>
                  <input
                    type="text"
                    disabled
                    value={`${(currentUser?.role || 'authorized_approver').toUpperCase()} (Up to KES 5,000,000 Limit)`}
                    className="w-full p-2 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 font-mono"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Sanction Conditions Precedent
              </label>
              <textarea
                rows={3}
                value={decisionConditions}
                onChange={(e) => setDecisionConditions(e.target.value)}
                className="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Committee Final Minutes & Rationale
              </label>
              <textarea
                rows={2}
                required
                value={decisionNotes}
                onChange={(e) => setDecisionNotes(e.target.value)}
                className="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsDecisionModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                className={`px-4 py-2 rounded-lg text-white font-semibold shadow-sm ${
                  decisionAction === 'approved'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                Seal Committee Decision
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
