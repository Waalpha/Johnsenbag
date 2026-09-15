/**
 * DAVETECH ERP - Clear Portfolio & System Data Modal
 * Enables loan officers & administrators to reset demo loans, wipe the portfolio
 * to KSh 0.00, or perform a complete fresh start.
 */

import React, { useState } from 'react';
import {
  Trash2,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  Coins,
  ShieldCheck,
  Database,
  Users,
} from 'lucide-react';
import { Modal } from './Modal';
import { DataService } from '../../services/dataService';
import { LoanEngine } from '../../services/loanEngine';
import { useAuth } from '../../context/AuthContext';

interface ClearDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (type: 'portfolio' | 'all' | 'restore') => void;
}

export const ClearDataModal: React.FC<ClearDataModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { currentUser } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const loans = DataService.getLoans();
  const collaterals = DataService.getCollaterals();
  const repayments = DataService.getRepayments();
  const customers = DataService.getCustomers();

  const totalPrincipal = loans.reduce((sum, l) => sum + (l.principal || 0), 0);
  const totalOutstanding = loans.reduce((sum, l) => sum + (l.outstandingPrincipal || 0), 0);
  const totalCollateral = collaterals.reduce((sum, c) => sum + (c.marketValue || 0), 0);

  const handleClearPortfolio = async () => {
    setIsProcessing(true);
    try {
      await DataService.clearPortfolioData(currentUser);
      setSuccessMessage('Loan portfolio successfully cleared! Total portfolio is now KSh 0.00.');
      if (onSuccess) onSuccess('portfolio');
      setTimeout(() => {
        setSuccessMessage(null);
        onClose();
      }, 1400);
    } catch (e) {
      console.error(e);
      alert('Failed to clear portfolio data.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClearAllSystem = async () => {
    if (!window.confirm('Are you sure you want a complete fresh start? All loans, collateral, customers, and properties will be wiped clean.')) {
      return;
    }
    setIsProcessing(true);
    try {
      await DataService.clearAllSystemData(currentUser);
      setSuccessMessage('Entire system wiped clean! Ready for live business operations.');
      if (onSuccess) onSuccess('all');
      setTimeout(() => {
        setSuccessMessage(null);
        onClose();
      }, 1400);
    } catch (e) {
      console.error(e);
      alert('Failed to clear system data.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRestoreDemo = () => {
    setIsProcessing(true);
    try {
      DataService.restoreSeedData(currentUser);
      setSuccessMessage('Demo sample portfolio (4 facilities, KSh 18.6M) successfully restored.');
      if (onSuccess) onSuccess('restore');
      setTimeout(() => {
        setSuccessMessage(null);
        onClose();
      }, 1400);
    } catch (e) {
      console.error(e);
      alert('Failed to restore demo data.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Clear Portfolio & System Data"
      subtitle="Reset sample metrics, clear loan balances to KSh 0.00, or start with a clean slate."
      maxWidth="2xl"
    >
      <div className="p-6 space-y-6">
        {/* Success Alert */}
        {successMessage && (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/40 rounded-xl text-emerald-700 dark:text-emerald-300 flex items-center gap-3 animate-in fade-in">
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-500" />
            <p className="text-xs font-bold">{successMessage}</p>
          </div>
        )}

        {/* Current Active Numbers Display */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-3">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Current Data On Screen
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200/60 dark:border-slate-700/60">
              <span className="text-[10px] text-slate-400 block">Total Portfolio</span>
              <span className="text-sm font-bold font-mono text-slate-900 dark:text-slate-100">
                {LoanEngine.formatKES(totalPrincipal)}
              </span>
              <span className="text-[10px] text-slate-400 block">{loans.length} Facilities</span>
            </div>

            <div className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200/60 dark:border-slate-700/60">
              <span className="text-[10px] text-slate-400 block">Outstanding</span>
              <span className="text-sm font-bold font-mono text-emerald-600 dark:text-emerald-400">
                {LoanEngine.formatKES(totalOutstanding)}
              </span>
              <span className="text-[10px] text-slate-400 block">{repayments.length} Payments</span>
            </div>

            <div className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200/60 dark:border-slate-700/60">
              <span className="text-[10px] text-slate-400 block">Collateral Value</span>
              <span className="text-sm font-bold font-mono text-slate-900 dark:text-slate-100">
                {LoanEngine.formatKES(totalCollateral)}
              </span>
              <span className="text-[10px] text-slate-400 block">{collaterals.length} Assets Pledged</span>
            </div>

            <div className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200/60 dark:border-slate-700/60">
              <span className="text-[10px] text-slate-400 block">Customers</span>
              <span className="text-sm font-bold font-mono text-slate-900 dark:text-slate-100">
                {customers.length} Profiles
              </span>
              <span className="text-[10px] text-slate-400 block">Active Database</span>
            </div>
          </div>
        </div>

        {/* Clear Actions */}
        <div className="space-y-4">
          {/* Action 1: Clear Loan Portfolio (Main intent of user) */}
          <div className="p-4 rounded-xl border-2 border-rose-500/30 bg-rose-50/50 dark:bg-rose-950/20 hover:border-rose-500/50 transition space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-rose-600 text-white">
                  <Trash2 className="w-4 h-4" />
                </span>
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Clear Loan Portfolio (Reset to KSh 0.00)
                </h4>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-200 dark:bg-rose-900 text-rose-800 dark:text-rose-200">
                Recommended
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Wipes the <strong>{loans.length} demo loans</strong>, <strong>{LoanEngine.formatKES(totalPrincipal)}</strong> portfolio,
              collateral assets, and repayments. The dashboard metrics will drop to <strong>KSh 0.00</strong> immediately.
              Your customer profiles and branding will remain intact.
            </p>
            <div className="pt-2">
              <button
                type="button"
                disabled={isProcessing || loans.length === 0}
                onClick={handleClearPortfolio}
                className="w-full sm:w-auto px-4 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-xs cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Clear Loans & Collateral (Reset to KSh 0.00)</span>
              </button>
            </div>
          </div>

          {/* Action 2: Complete Clean Slate */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition space-y-2">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-slate-700 text-white">
                <Database className="w-4 h-4" />
              </span>
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Complete Fresh Start (Wipe Entire Database)
              </h4>
            </div>
            <p className="text-xs text-slate-500">
              Clears everything: loans, collaterals, customer profiles, properties, and applications. Leaves a completely blank ERP ready for live corporate deployment. Company branding and admin logins are preserved.
            </p>
            <div className="pt-2">
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleClearAllSystem}
                className="w-full sm:w-auto px-4 py-2 bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Trash2 className="w-4 h-4 text-rose-400" />
                <span>Wipe Entire Database Clean</span>
              </button>
            </div>
          </div>

          {/* Action 3: Restore Demo Data */}
          <div className="p-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                <span>Restore Sample Demo Records</span>
              </h4>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Reloads the original 4 demo facilities (KES 18.6M) whenever you want to test or preview charts again.
              </p>
            </div>
            <button
              type="button"
              disabled={isProcessing}
              onClick={handleRestoreDemo}
              className="px-3.5 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 disabled:opacity-50 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-semibold transition shrink-0 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reload Demo Data</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
          >
            Cancel / Close
          </button>
        </div>
      </div>
    </Modal>
  );
};
