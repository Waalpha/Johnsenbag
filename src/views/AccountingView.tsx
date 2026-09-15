/**
 * DAVETECH ERP - Double-Entry General Ledger & Chart of Accounts
 * Financial journals, automated loan accounting postings, trial balance verification,
 * and standard IFRS / CBK chart of accounts.
 */

import React, { useState } from 'react';
import {
  BookOpen,
  Plus,
  Search,
  Scale,
  DollarSign,
  TrendingUp,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { DataService } from '../services/dataService';
import { ChartOfAccount, JournalEntry, JournalLine } from '../types/erp';
import { LoanEngine } from '../services/loanEngine';
import { useAuth } from '../context/AuthContext';
import { Modal } from '../components/common/Modal';

export const AccountingView: React.FC = () => {
  const { currentUser, activeBranchId, hasPermission } = useAuth();

  const [activeTab, setActiveTab] = useState<'journals' | 'accounts' | 'trial_balance'>('journals');
  const [accounts, setAccounts] = useState<ChartOfAccount[]>(() => DataService.getAccounts());
  const [journals, setJournals] = useState<JournalEntry[]>(() => DataService.getJournals());
  const [searchTerm, setSearchTerm] = useState('');

  // Manual Journal Modal
  const [isJournalModalOpen, setIsJournalModalOpen] = useState(false);
  const [entryDescription, setEntryDescription] = useState('Quarterly asset valuation audit fees.');
  const [entryReference, setEntryReference] = useState('MAN/2026/001');
  const [debitAccountCode, setDebitAccountCode] = useState('5003');
  const [creditAccountCode, setCreditAccountCode] = useState('1002');
  const [manualAmount, setManualAmount] = useState(35000);
  const [manualError, setManualError] = useState('');

  const refreshData = () => {
    setAccounts(DataService.getAccounts());
    setJournals(DataService.getJournals());
  };

  const filteredJournals = journals.filter((j) => {
    if (activeBranchId !== 'all' && j.branchId !== activeBranchId) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        j.entryNumber.toLowerCase().includes(q) ||
        j.description.toLowerCase().includes(q) ||
        j.reference.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Trial Balance Totals
  const totalDebits = accounts.reduce((sum, a) => sum + (a.debitBalance || 0), 0);
  const totalCredits = accounts.reduce((sum, a) => sum + (a.creditBalance || 0), 0);
  const isBalanced = totalDebits === totalCredits;

  const handlePostManualJournal = (e: React.FormEvent) => {
    e.preventDefault();
    setManualError('');

    if (debitAccountCode === creditAccountCode) {
      setManualError('Debit and Credit accounts must be distinct');
      return;
    }

    const debitAcc = accounts.find((a) => a.code === debitAccountCode);
    const creditAcc = accounts.find((a) => a.code === creditAccountCode);

    if (!debitAcc || !creditAcc) {
      setManualError('Invalid accounts specified');
      return;
    }

    const lines: JournalLine[] = [
      {
        id: `jl-1-${Date.now()}`,
        accountId: debitAcc.id,
        accountCode: debitAcc.code,
        accountName: debitAcc.name,
        debit: Number(manualAmount),
        credit: 0,
        description: entryDescription,
      },
      {
        id: `jl-2-${Date.now()}`,
        accountId: creditAcc.id,
        accountCode: creditAcc.code,
        accountName: creditAcc.name,
        debit: 0,
        credit: Number(manualAmount),
        description: entryDescription,
      },
    ];

    try {
      DataService.postJournal(
        {
          date: new Date().toISOString().split('T')[0],
          entryDate: new Date().toISOString().split('T')[0],
          description: entryDescription,
          reference: entryReference,
          branchId: 'BR-001',
          lines,
          isReversed: false,
        },
        currentUser
      );

      setIsJournalModalOpen(false);
      refreshData();
    } catch (err: any) {
      setManualError(err.message || 'Journal posting failed');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              General Ledger & Financial Accounting
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
              Double-Entry Standard
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Automated double-entry loan event journaling, CBK standard chart of accounts, and real-time trial balance.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setActiveTab('journals')}
              className={`px-3 py-1.5 rounded-lg transition ${
                activeTab === 'journals'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              General Journals
            </button>
            <button
              onClick={() => setActiveTab('accounts')}
              className={`px-3 py-1.5 rounded-lg transition ${
                activeTab === 'accounts'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Chart of Accounts
            </button>
            <button
              onClick={() => setActiveTab('trial_balance')}
              className={`px-3 py-1.5 rounded-lg transition ${
                activeTab === 'trial_balance'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Trial Balance
            </button>
          </div>

          {hasPermission('accounting.*') && (
            <button
              onClick={() => setIsJournalModalOpen(true)}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm transition flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Manual Journal</span>
            </button>
          )}
        </div>
      </div>

      {/* TAB 1: GENERAL JOURNALS */}
      {activeTab === 'journals' && (
        <div className="space-y-4">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search entry number, reference, memo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-lg text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:border-emerald-500"
            />
          </div>

          <div className="space-y-3">
            {filteredJournals.map((j) => (
              <div
                key={j.id}
                className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs p-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-100 dark:border-slate-700/80">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded">
                      {j.entryNumber}
                    </span>
                    <span className="text-xs text-slate-500 font-mono">{j.entryDate}</span>
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      {j.description}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
                    <span>Ref: {j.reference}</span>
                  </div>
                </div>

                <div className="mt-2.5 overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead>
                      <tr className="text-slate-400 text-[10px] uppercase">
                        <th className="py-1">Account Code & Name</th>
                        <th className="py-1 text-right">Debit (KES)</th>
                        <th className="py-1 text-right">Credit (KES)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {j.lines.map((line, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="py-1.5 text-slate-700 dark:text-slate-300">
                            <span className="font-bold">{line.accountCode}</span> - {line.accountName}
                          </td>
                          <td className="py-1.5 text-right font-bold text-slate-900 dark:text-slate-100">
                            {line.debit > 0 ? LoanEngine.formatKES(line.debit, false) : '-'}
                          </td>
                          <td className="py-1.5 text-right font-bold text-slate-900 dark:text-slate-100">
                            {line.credit > 0 ? LoanEngine.formatKES(line.credit, false) : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: CHART OF ACCOUNTS */}
      {activeTab === 'accounts' && (
        <div className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="p-3.5 font-semibold">Account Code</th>
                <th className="p-3.5 font-semibold">Account Title</th>
                <th className="p-3.5 font-semibold">Category</th>
                <th className="p-3.5 font-semibold text-right">Debit Balance</th>
                <th className="p-3.5 font-semibold text-right">Credit Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 font-mono">
              {accounts.map((acc) => (
                <tr key={acc.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-750/50">
                  <td className="p-3.5 font-bold text-emerald-600 dark:text-emerald-400">
                    {acc.code}
                  </td>
                  <td className="p-3.5 font-sans font-semibold text-slate-900 dark:text-slate-100">
                    {acc.name}
                  </td>
                  <td className="p-3.5 font-sans">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                      {acc.type}
                    </span>
                  </td>
                  <td className="p-3.5 text-right font-bold text-slate-900 dark:text-slate-100">
                    {LoanEngine.formatKES(acc.debitBalance, false)}
                  </td>
                  <td className="p-3.5 text-right font-bold text-slate-900 dark:text-slate-100">
                    {LoanEngine.formatKES(acc.creditBalance, false)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 3: TRIAL BALANCE */}
      {activeTab === 'trial_balance' && (
        <div className="space-y-4">
          <div
            className={`p-4 rounded-xl border flex items-center justify-between ${
              isBalanced
                ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 text-emerald-800 dark:text-emerald-300'
                : 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 text-rose-800 dark:text-rose-300'
            }`}
          >
            <div className="flex items-center gap-2 text-xs font-semibold">
              <Scale className="w-4 h-4" />
              <span>
                {isBalanced
                  ? 'Trial Balance is strictly balanced! Debits match Credits according to double-entry rules.'
                  : 'Trial Balance Out of Balance Warning!'}
              </span>
            </div>
            <div className="flex items-center gap-4 text-xs font-mono font-bold">
              <span>Total Debits: {LoanEngine.formatKES(totalDebits)}</span>
              <span>Total Credits: {LoanEngine.formatKES(totalCredits)}</span>
            </div>
          </div>

          <div className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="p-3.5 font-sans font-semibold">Account</th>
                  <th className="p-3.5 font-sans font-semibold text-right">Debit (KES)</th>
                  <th className="p-3.5 font-sans font-semibold text-right">Credit (KES)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {accounts.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50/50">
                    <td className="p-3.5">
                      <span className="font-bold">{a.code}</span> - {a.name}
                    </td>
                    <td className="p-3.5 text-right font-bold">
                      {a.debitBalance > 0 ? LoanEngine.formatKES(a.debitBalance, false) : '-'}
                    </td>
                    <td className="p-3.5 text-right font-bold">
                      {a.creditBalance > 0 ? LoanEngine.formatKES(a.creditBalance, false) : '-'}
                    </td>
                  </tr>
                ))}
                <tr className="bg-slate-100 dark:bg-slate-900 font-bold text-sm">
                  <td className="p-3.5 font-sans uppercase">Total Trial Balance</td>
                  <td className="p-3.5 text-right text-emerald-600">{LoanEngine.formatKES(totalDebits)}</td>
                  <td className="p-3.5 text-right text-emerald-600">{LoanEngine.formatKES(totalCredits)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: MANUAL JOURNAL ENTRY */}
      <Modal
        isOpen={isJournalModalOpen}
        onClose={() => setIsJournalModalOpen(false)}
        title="Post Manual Journal Entry"
        subtitle="Enforces double-entry balance check and creates audit trail."
        maxWidth="lg"
      >
        <form onSubmit={handlePostManualJournal} className="space-y-4 text-xs">
          {manualError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{manualError}</span>
            </div>
          )}

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Transaction Memo / Description
            </label>
            <input
              type="text"
              required
              value={entryDescription}
              onChange={(e) => setEntryDescription(e.target.value)}
              className="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Debit Account (Increase Asset / Expense)
              </label>
              <select
                value={debitAccountCode}
                onChange={(e) => setDebitAccountCode(e.target.value)}
                className="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono"
              >
                {accounts.map((a) => (
                  <option key={a.code} value={a.code}>
                    {a.code} - {a.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Credit Account (Decrease Asset / Increase Liability / Revenue)
              </label>
              <select
                value={creditAccountCode}
                onChange={(e) => setCreditAccountCode(e.target.value)}
                className="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono"
              >
                {accounts.map((a) => (
                  <option key={a.code} value={a.code}>
                    {a.code} - {a.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Amount (KES)
            </label>
            <input
              type="number"
              required
              value={manualAmount}
              onChange={(e) => setManualAmount(Number(e.target.value))}
              className="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono font-bold"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsJournalModalOpen(false)}
              className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
            >
              Commit Journal to Ledger
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
