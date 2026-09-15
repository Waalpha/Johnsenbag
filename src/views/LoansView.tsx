/**
 * DAVETECH ERP - Active Loans Portfolio & Facility Management
 * Disbursal workflows, detailed amortization schedules, loan restructuring,
 * and official legal contract generation.
 */

import React, { useState, useEffect } from 'react';
import {
  Coins,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Printer,
  RotateCcw,
  Eye,
  FileSpreadsheet,
  Wallet,
  ArrowUpRight,
  ShieldCheck,
  Send,
} from 'lucide-react';
import { DataService } from '../services/dataService';
import { Loan, LoanScheduleItem, Customer, Collateral } from '../types/erp';
import { LoanEngine } from '../services/loanEngine';
import { useAuth } from '../context/AuthContext';
import { Modal } from '../components/common/Modal';
import { PrintTemplate, PrintableDocType } from '../components/common/PrintTemplate';

export const LoansView: React.FC = () => {
  const { currentUser, hasPermission } = useAuth();

  const [loans, setLoans] = useState<Loan[]>(() => DataService.getLoans());
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Selected Loan for Modals
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isRestructureModalOpen, setIsRestructureModalOpen] = useState(false);
  const [isDisburseModalOpen, setIsDisburseModalOpen] = useState(false);

  // Print engine state
  const [printDoc, setPrintDoc] = useState<{
    open: boolean;
    type: PrintableDocType;
    loan?: Loan;
    customer?: Customer;
    collateral?: Collateral;
  }>({ open: false, type: 'loan_agreement' });

  // Restructure form state
  const [newTenure, setNewTenure] = useState(18);
  const [newRate, setNewRate] = useState(3.0);
  const [capitalizeArrears, setCapitalizeArrears] = useState(true);
  const [restructureReason, setRestructureReason] = useState('Borrower requested extended repayment period due to economic cashflow strain.');

  // Disburse form state
  const [disburseMethod, setDisburseMethod] = useState<'bank_transfer' | 'mpesa' | 'cash'>('bank_transfer');
  const [disburseRef, setDisburseRef] = useState('FT2026/DISB/998123');
  const [disburseSourceAccount, setDisburseSourceAccount] = useState('ACC-1002 - KCB Operating Account');

  const customers = DataService.getCustomers();
  const collaterals = DataService.getCollaterals();

  const refreshData = () => {
    setLoans(DataService.getLoans());
  };

  useEffect(() => {
    const unsub = DataService.subscribe(() => {
      setLoans(DataService.getLoans());
    });
    return unsub;
  }, []);

  const filteredLoans = loans.filter((l) => {
    if (statusFilter !== 'all' && l.status !== statusFilter) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        l.loanNumber.toLowerCase().includes(q) ||
        l.customerId.toLowerCase().includes(q) ||
        l.collateralId?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleRestructureSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLoan) return;

    try {
      DataService.restructureLoan(
        selectedLoan.id,
        currentUser,
        Number(newTenure),
        Number(newRate),
        capitalizeArrears,
        restructureReason
      );

      setIsRestructureModalOpen(false);
      setSelectedLoan(null);
      refreshData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDisburseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLoan) return;

    try {
      DataService.disburseLoan(
        selectedLoan.id,
        currentUser,
        disburseMethod,
        disburseRef,
        disburseSourceAccount
      );

      setIsDisburseModalOpen(false);
      setSelectedLoan(null);
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
              Active Loans Portfolio
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
              {loans.length} Active Accounts
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time loan ledger, interest accrual, repayment schedules, and loan restructuring engine.
          </p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search loan number, customer, collateral ref..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 outline-none text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:border-emerald-500"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-2.5 py-1.5 rounded-lg text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 outline-none"
        >
          <option value="all">All Loan Statuses</option>
          <option value="active">Active & Performing</option>
          <option value="approved">Approved (Awaiting Disbursal)</option>
          <option value="restructured">Restructured Facilities</option>
          <option value="in_recovery">In Recovery / Impounded</option>
          <option value="closed">Fully Repaid / Closed</option>
        </select>
      </div>

      {/* Main Loans Table */}
      <div className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="p-3.5 font-semibold">Loan Facility</th>
                <th className="p-3.5 font-semibold">Borrower</th>
                <th className="p-3.5 font-semibold text-right">Principal</th>
                <th className="p-3.5 font-semibold text-right">Total Outstanding</th>
                <th className="p-3.5 font-semibold text-right">Monthly Installment</th>
                <th className="p-3.5 font-semibold text-center">Arrears</th>
                <th className="p-3.5 font-semibold text-center">Status</th>
                <th className="p-3.5 font-semibold text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 font-mono">
              {filteredLoans.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400 font-sans">
                    No active loan records match criteria.
                  </td>
                </tr>
              ) : (
                filteredLoans.map((loan) => {
                  const cust = customers.find((c) => c.id === loan.customerId);
                  const col = collaterals.find((c) => c.id === loan.collateralId);

                  return (
                    <tr
                      key={loan.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-750/50 transition font-sans"
                    >
                      <td className="p-3.5 font-mono">
                        <span className="font-bold text-slate-900 dark:text-slate-100">
                          {loan.loanNumber}
                        </span>
                        <span className="block text-[10px] text-slate-400 font-sans">
                          {loan.durationMonths} Mo • {loan.interestRatePerMonth}%/mo
                        </span>
                      </td>
                      <td className="p-3.5">
                        <p className="font-semibold text-slate-900 dark:text-slate-100">
                          {cust?.fullName || loan.customerId}
                        </p>
                        <p className="text-[10px] text-slate-400 font-mono">{cust?.phone}</p>
                      </td>
                      <td className="p-3.5 text-right font-mono font-bold text-slate-900 dark:text-slate-100">
                        {LoanEngine.formatKES(loan.principal)}
                      </td>
                      <td className="p-3.5 text-right font-mono font-bold text-rose-600 dark:text-rose-400">
                        {LoanEngine.formatKES(loan.totalOutstanding)}
                      </td>
                      <td className="p-3.5 text-right font-mono font-semibold text-slate-800 dark:text-slate-200">
                        {LoanEngine.formatKES(loan.installmentAmount)}
                      </td>
                      <td className="p-3.5 text-center">
                        {loan.daysInArrears > 0 ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 font-mono">
                            {loan.daysInArrears} Days
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-mono">
                            Current
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 text-center">
                        <span
                          className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase ${
                            loan.status === 'active'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : loan.status === 'in_recovery'
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                              : loan.status === 'restructured'
                              ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                              : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                          }`}
                        >
                          {loan.status}
                        </span>
                      </td>
                      <td className="p-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Schedule Preview */}
                          <button
                            onClick={() => {
                              setSelectedLoan(loan);
                              setIsScheduleModalOpen(true);
                            }}
                            className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition"
                            title="View Amortization Schedule"
                          >
                            <FileSpreadsheet className="w-4 h-4" />
                          </button>

                          {/* Print Sanction Agreement */}
                          <button
                            onClick={() => {
                              setPrintDoc({
                                open: true,
                                type: 'loan_agreement',
                                loan,
                                customer: cust,
                                collateral: col,
                              });
                            }}
                            className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition"
                            title="Print Credit Agreement & Sanction"
                          >
                            <Printer className="w-4 h-4" />
                          </button>

                          {/* Restructure Action */}
                          {hasPermission('loans.approve') && (loan.status === 'active' || loan.status === 'in_recovery') && (
                            <button
                              onClick={() => {
                                setSelectedLoan(loan);
                                setNewTenure(loan.durationMonths + 6);
                                setNewRate(loan.interestRatePerMonth);
                                setIsRestructureModalOpen(true);
                              }}
                              className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 text-purple-600 dark:text-purple-400 transition"
                              title="Restructure Loan Terms"
                            >
                              <RotateCcw className="w-4 h-4" />
                            </button>
                          )}

                          {/* Disburse Action (if approved) */}
                          {hasPermission('loans.disburse') && loan.status === 'approved' && (
                            <button
                              onClick={() => {
                                setSelectedLoan(loan);
                                setIsDisburseModalOpen(true);
                              }}
                              className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-[10px] font-semibold transition"
                            >
                              Disburse
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: AMORTIZATION SCHEDULE */}
      {selectedLoan && (
        <Modal
          isOpen={isScheduleModalOpen}
          onClose={() => setIsScheduleModalOpen(false)}
          title={`Amortization Schedule: ${selectedLoan.loanNumber}`}
          subtitle={`Tenure: ${selectedLoan.durationMonths} Months • Interest: ${selectedLoan.interestRatePerMonth}%/mo (${selectedLoan.interestMethod})`}
          maxWidth="3xl"
        >
          <div className="space-y-4 text-xs font-mono">
            <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 block">TOTAL PRINCIPAL</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">
                  {LoanEngine.formatKES(selectedLoan.principal)}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">TOTAL INTEREST</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">
                  {LoanEngine.formatKES(selectedLoan.totalInterest)}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">OUTSTANDING BALANCE</span>
                <span className="font-bold text-rose-600">
                  {LoanEngine.formatKES(selectedLoan.totalOutstanding)}
                </span>
              </div>
            </div>

            <div className="max-h-96 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-xl">
              <table className="w-full text-left text-[11px]">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 sticky top-0">
                  <tr>
                    <th className="p-2.5">#</th>
                    <th className="p-2.5">Due Date</th>
                    <th className="p-2.5 text-right">Principal</th>
                    <th className="p-2.5 text-right">Interest</th>
                    <th className="p-2.5 text-right">Installment</th>
                    <th className="p-2.5 text-right">Paid</th>
                    <th className="p-2.5 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {selectedLoan.schedule.map((item) => (
                    <tr
                      key={item.installmentNumber}
                      className={item.status === 'paid' ? 'bg-emerald-50/40 dark:bg-emerald-950/20' : ''}
                    >
                      <td className="p-2.5 font-bold">{item.installmentNumber}</td>
                      <td className="p-2.5">{item.dueDate}</td>
                      <td className="p-2.5 text-right">{LoanEngine.formatKES(item.principalDue, false)}</td>
                      <td className="p-2.5 text-right">{LoanEngine.formatKES(item.interestDue, false)}</td>
                      <td className="p-2.5 text-right font-bold">{LoanEngine.formatKES(item.totalInstallment, false)}</td>
                      <td className="p-2.5 text-right font-semibold text-emerald-600">{LoanEngine.formatKES(item.totalPaid, false)}</td>
                      <td className="p-2.5 text-center">
                        <span
                          className={`px-1.5 py-0.5 text-[9px] font-bold rounded uppercase ${
                            item.status === 'paid'
                              ? 'bg-emerald-100 text-emerald-800'
                              : item.status === 'overdue'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between items-center pt-2 font-sans">
              <button
                onClick={() => {
                  const cust = customers.find((c) => c.id === selectedLoan.customerId);
                  setPrintDoc({
                    open: true,
                    type: 'repayment_schedule',
                    loan: selectedLoan,
                    customer: cust,
                  });
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Schedule / Statement</span>
              </button>
              <button
                onClick={() => setIsScheduleModalOpen(false)}
                className="px-4 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-lg text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL 2: RESTRUCTURE LOAN */}
      {selectedLoan && (
        <Modal
          isOpen={isRestructureModalOpen}
          onClose={() => setIsRestructureModalOpen(false)}
          title={`Restructure Facility: ${selectedLoan.loanNumber}`}
          subtitle="Recalculates amortization, capitalizes accrued arrears, or extends loan tenure."
          maxWidth="xl"
        >
          <form onSubmit={handleRestructureSubmit} className="space-y-4 text-xs">
            <div className="p-3 bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900 rounded-xl space-y-1">
              <p className="font-semibold text-purple-900 dark:text-purple-300">Current Outstanding Position:</p>
              <p className="text-purple-800 dark:text-purple-200 font-mono text-xs">
                Principal: {LoanEngine.formatKES(selectedLoan.outstandingPrincipal)} | Accrued Arrears & Penalties: {LoanEngine.formatKES(selectedLoan.outstandingPenalties + selectedLoan.outstandingInterest)}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  New Revised Tenure (Months)
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  max={60}
                  value={newTenure}
                  onChange={(e) => setNewTenure(Number(e.target.value))}
                  className="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  New Monthly Interest Rate (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={newRate}
                  onChange={(e) => setNewRate(Number(e.target.value))}
                  className="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono font-bold"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700">
              <input
                type="checkbox"
                id="capArrears"
                checked={capitalizeArrears}
                onChange={(e) => setCapitalizeArrears(e.target.checked)}
                className="rounded text-purple-600"
              />
              <label htmlFor="capArrears" className="font-semibold text-slate-800 dark:text-slate-200 cursor-pointer">
                Capitalize accrued penalties & interest into new loan principal
              </label>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Restructuring Justification & Credit Committee Minute
              </label>
              <textarea
                rows={3}
                required
                value={restructureReason}
                onChange={(e) => setRestructureReason(e.target.value)}
                className="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsRestructureModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-semibold"
              >
                Confirm Restructure & Generate Schedule
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* MODAL 3: DISBURSE LOAN */}
      {selectedLoan && (
        <Modal
          isOpen={isDisburseModalOpen}
          onClose={() => setIsDisburseModalOpen(false)}
          title={`Disburse Facility: ${selectedLoan.loanNumber}`}
          subtitle="Debits loan portfolio asset and credits company cash/bank account with automated GL posting."
          maxWidth="lg"
        >
          <form onSubmit={handleDisburseSubmit} className="space-y-4 text-xs">
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 rounded-xl">
              <span className="text-[10px] text-emerald-800 dark:text-emerald-300 uppercase block font-bold">
                Net Disbursement Amount
              </span>
              <p className="text-xl font-mono font-extrabold text-emerald-900 dark:text-emerald-200 mt-0.5">
                {LoanEngine.formatKES(selectedLoan.principal)}
              </p>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Disbursement Channel
              </label>
              <select
                value={disburseMethod}
                onChange={(e) => setDisburseMethod(e.target.value as any)}
                className="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              >
                <option value="bank_transfer">Electronic Funds Transfer (RTGS / PESALINK)</option>
                <option value="mpesa">Safaricom M-Pesa B2C Paybill</option>
                <option value="cash">Branch Cashier Petty Cash</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Funding Bank Account (General Ledger Credit)
              </label>
              <input
                type="text"
                value={disburseSourceAccount}
                onChange={(e) => setDisburseSourceAccount(e.target.value)}
                className="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Bank Transfer Reference / M-Pesa Code
              </label>
              <input
                type="text"
                required
                value={disburseRef}
                onChange={(e) => setDisburseRef(e.target.value)}
                className="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsDisburseModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
              >
                Release Funds & Activate Loan
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* PRINT ENGINE */}
      {printDoc.open && (
        <PrintTemplate
          docType={printDoc.type}
          loan={printDoc.loan}
          customer={printDoc.customer}
          collateral={printDoc.collateral}
          onClose={() => setPrintDoc({ open: false, type: 'loan_agreement' })}
        />
      )}
    </div>
  );
};
