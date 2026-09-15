/**
 * DAVETECH ERP - Repayments, Collections & Payment Allocation Waterfall
 * Real-time waterfall distribution: Penalties -> Fees -> Interest -> Principal,
 * Official receipt generator, and double-entry reversal mechanics.
 */

import React, { useState } from 'react';
import {
  Wallet,
  Plus,
  Search,
  CheckCircle2,
  Printer,
  RotateCcw,
  AlertCircle,
  FileSpreadsheet,
  Coins,
  ArrowDownLeft,
  X,
  Trash2,
} from 'lucide-react';
import { DataService } from '../services/dataService';
import { Repayment, Loan, Customer, PaymentMethod } from '../types/erp';
import { LoanEngine } from '../services/loanEngine';
import { useAuth } from '../context/AuthContext';
import { Modal } from '../components/common/Modal';
import { PrintTemplate, PrintableDocType } from '../components/common/PrintTemplate';

export const RepaymentsView: React.FC = () => {
  const { currentUser, activeBranchId, hasPermission } = useAuth();

  const [repayments, setRepayments] = useState<Repayment[]>(() => DataService.getRepayments());
  const [searchTerm, setSearchTerm] = useState('');
  const [methodFilter, setMethodFilter] = useState<string>('all');

  // Modals
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [isReversalModalOpen, setIsReversalModalOpen] = useState(false);
  const [selectedRepayment, setSelectedRepayment] = useState<Repayment | null>(null);

  // Print state
  const [printDoc, setPrintDoc] = useState<{
    open: boolean;
    type: PrintableDocType;
    repayment?: Repayment;
    loan?: Loan;
    customer?: Customer;
  }>({ open: false, type: 'payment_receipt' });

  // Post form state
  const loans = DataService.getLoans().filter((l) => l.status === 'active' || l.status === 'in_recovery');
  const customers = DataService.getCustomers();

  const [payLoanId, setPayLoanId] = useState(loans[0]?.id || '');
  const [payAmount, setPayAmount] = useState(45000);
  const [payMethod, setPayMethod] = useState<PaymentMethod>('mpesa');
  const [payRef, setPayRef] = useState('QGH9918274');
  const [payNotes, setPayNotes] = useState('Monthly scheduled installment repayment.');
  const [payError, setPayError] = useState('');

  // Reversal form state
  const [reversalReason, setReversalReason] = useState('Erroneous M-Pesa transaction reference number entered.');

  const refreshData = () => {
    setRepayments(DataService.getRepayments());
  };

  const selectedTargetLoan = loans.find((l) => l.id === payLoanId);

  // Live Simulated Waterfall preview
  const waterfallPreview = selectedTargetLoan
    ? LoanEngine.allocateRepayment(payAmount, {
        outstandingPenalties: selectedTargetLoan.outstandingPenalties,
        outstandingFees: selectedTargetLoan.outstandingFees,
        outstandingInterest: selectedTargetLoan.outstandingInterest,
        outstandingPrincipal: selectedTargetLoan.outstandingPrincipal,
      })
    : null;

  const filteredRepayments = repayments.filter((r) => {
    if (activeBranchId !== 'all' && r.branchId !== activeBranchId) return false;
    if (methodFilter !== 'all' && r.paymentMethod !== methodFilter) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return Boolean(
        r.receiptNumber?.toLowerCase().includes(q) ||
        r.transactionReference?.toLowerCase().includes(q) ||
        r.loanId?.toLowerCase().includes(q) ||
        r.customerId?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handlePostRepayment = (e: React.FormEvent) => {
    e.preventDefault();
    setPayError('');

    if (!selectedTargetLoan) {
      setPayError('Please select a valid active loan account');
      return;
    }

    try {
      const posted = DataService.postRepayment(
        {
          loanId: selectedTargetLoan.id,
          customerId: selectedTargetLoan.customerId,
          amount: Number(payAmount),
          paymentDate: new Date().toISOString().split('T')[0],
          paymentMethod: payMethod,
          transactionReference: payRef,
          notes: payNotes,
          branchId: selectedTargetLoan.branchId,
        },
        currentUser
      );

      setIsPostModalOpen(false);
      refreshData();

      // Open printable receipt automatically
      const cust = customers.find((c) => c.id === selectedTargetLoan.customerId);
      setPrintDoc({
        open: true,
        type: 'payment_receipt',
        repayment: posted,
        loan: selectedTargetLoan,
        customer: cust,
      });
    } catch (err: any) {
      setPayError(err.message || 'Payment posting failed');
    }
  };

  const handleReversalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRepayment) return;

    try {
      DataService.reverseRepayment(selectedRepayment.id, currentUser, reversalReason);
      setIsReversalModalOpen(false);
      setSelectedRepayment(null);
      refreshData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleClearAllPayments = () => {
    if (window.confirm('Are you sure you want to clear all payment records? This action cannot be undone.')) {
      try {
        DataService.clearAllRepayments(currentUser);
        refreshData();
      } catch (err: any) {
        alert(err.message || 'Failed to clear payments');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Collections & Repayment Ledger
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300">
              {repayments.length} Transactions Posted
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Automated waterfall allocation hierarchy: Penalties → Fees → Interest → Principal.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {hasPermission('repayments.post') && repayments.length > 0 && (
            <button
              onClick={handleClearAllPayments}
              className="px-3 py-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 dark:hover:bg-rose-900/50 text-rose-700 dark:text-rose-300 rounded-xl text-xs font-semibold border border-rose-200 dark:border-rose-900 transition flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear All Payments</span>
            </button>
          )}

          {hasPermission('repayments.post') && (
            <button
              id="post-repayment-btn"
              onClick={() => {
                setPayError('');
                setIsPostModalOpen(true);
              }}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm transition flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Post Repayment / Collection</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search receipt no, M-Pesa ref, loan number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 outline-none text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:border-emerald-500"
          />
        </div>

        <select
          value={methodFilter}
          onChange={(e) => setMethodFilter(e.target.value)}
          className="px-2.5 py-1.5 rounded-lg text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 outline-none"
        >
          <option value="all">All Channels</option>
          <option value="mpesa">Safaricom M-Pesa</option>
          <option value="bank_transfer">Bank Wire / RTGS</option>
          <option value="cash">Branch Cash Desk</option>
          <option value="cheque">Banker's Cheque</option>
        </select>
      </div>

      {/* Repayments Table */}
      <div className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="p-3.5 font-semibold">Receipt No</th>
                <th className="p-3.5 font-semibold">Facility / Customer</th>
                <th className="p-3.5 font-semibold text-right">Amount Paid</th>
                <th className="p-3.5 font-semibold text-right">Principal Deducted</th>
                <th className="p-3.5 font-semibold text-right">Interest Deducted</th>
                <th className="p-3.5 font-semibold text-right">Penalties / Fees</th>
                <th className="p-3.5 font-semibold">Channel & Ref</th>
                <th className="p-3.5 font-semibold text-center">Status</th>
                <th className="p-3.5 font-semibold text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 font-mono">
              {filteredRepayments.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-400 font-sans">
                    No payment collection transactions recorded.
                  </td>
                </tr>
              ) : (
                filteredRepayments.map((rep) => {
                  const cust = customers.find((c) => c.id === rep.customerId);
                  const isReversed = rep.isReversed;

                  return (
                    <tr
                      key={rep.id}
                      className={`hover:bg-slate-50/80 dark:hover:bg-slate-750/50 transition font-sans ${
                        isReversed ? 'opacity-60 bg-rose-50/20 dark:bg-rose-950/10' : ''
                      }`}
                    >
                      <td className="p-3.5 font-mono">
                        <span className="font-bold text-slate-900 dark:text-slate-100">
                          {rep.receiptNumber}
                        </span>
                        <span className="block text-[10px] text-slate-400 font-sans">
                          {rep.paymentDate}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <span className="font-bold text-emerald-700 dark:text-emerald-400 font-mono">
                          {rep.loanId}
                        </span>
                        <p className="text-[11px] text-slate-600 dark:text-slate-300">
                          {cust?.fullName || rep.customerId}
                        </p>
                      </td>
                      <td className="p-3.5 text-right font-mono font-bold text-slate-900 dark:text-slate-100">
                        {LoanEngine.formatKES(rep.amount)}
                      </td>
                      <td className="p-3.5 text-right font-mono text-emerald-600 dark:text-emerald-400">
                        {LoanEngine.formatKES(rep.principalAllocation)}
                      </td>
                      <td className="p-3.5 text-right font-mono text-blue-600 dark:text-blue-400">
                        {LoanEngine.formatKES(rep.interestAllocation)}
                      </td>
                      <td className="p-3.5 text-right font-mono text-amber-600 dark:text-amber-400">
                        {LoanEngine.formatKES(rep.penaltyAllocation + rep.feesAllocation)}
                      </td>
                      <td className="p-3.5 font-sans">
                        <span className="font-semibold text-slate-800 dark:text-slate-200 uppercase text-[10px]">
                          {String(rep.paymentMethod || 'mpesa').replace(/_/g, ' ')}
                        </span>
                        <span className="block text-[10px] text-slate-400 font-mono">
                          Ref: {rep.transactionReference}
                        </span>
                      </td>
                      <td className="p-3.5 text-center font-sans">
                        {isReversed ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 uppercase">
                            Reversed
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 uppercase">
                            Cleared
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 text-center font-sans">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => {
                              const loanObj = DataService.getLoans().find((l) => l.id === rep.loanId);
                              setPrintDoc({
                                open: true,
                                type: 'payment_receipt',
                                repayment: rep,
                                loan: loanObj,
                                customer: cust,
                              });
                            }}
                            className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition"
                            title="Print Official Payment Receipt"
                          >
                            <Printer className="w-4 h-4" />
                          </button>

                          {!isReversed && hasPermission('accounting.*') && (
                            <button
                              onClick={() => {
                                setSelectedRepayment(rep);
                                setIsReversalModalOpen(true);
                              }}
                              className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 text-rose-600 transition"
                              title="Reverse Erroneous Transaction"
                            >
                              <RotateCcw className="w-4 h-4" />
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

      {/* MODAL 1: POST REPAYMENT WITH LIVE WATERFALL ALLOCATION */}
      <Modal
        isOpen={isPostModalOpen}
        onClose={() => setIsPostModalOpen(false)}
        title="Post Customer Repayment & Issue Receipt"
        subtitle="Applies Kenya M-Pesa / Bank collection using strict statutory payment waterfall."
        maxWidth="2xl"
      >
        <form onSubmit={handlePostRepayment} className="space-y-4 text-xs">
          {payError && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{payError}</span>
            </div>
          )}

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Select Active Loan Account
            </label>
            <select
              value={payLoanId}
              onChange={(e) => setPayLoanId(e.target.value)}
              className="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none"
            >
              {loans.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.loanNumber} - Outstanding: {LoanEngine.formatKES(l.totalOutstanding)} (Customer: {l.customerId})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Amount Paid (KES)
              </label>
              <input
                type="number"
                required
                step="100"
                value={payAmount}
                onChange={(e) => setPayAmount(Number(e.target.value))}
                className="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono font-bold text-sm"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Payment Channel
              </label>
              <select
                value={payMethod}
                onChange={(e) => setPayMethod(e.target.value as PaymentMethod)}
                className="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium"
              >
                <option value="mpesa">Safaricom M-Pesa (Paybill / Till)</option>
                <option value="bank_transfer">Bank Transfer / Pesalink / RTGS</option>
                <option value="cash">Branch Cash Counter</option>
                <option value="cheque">Cheque</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Transaction Reference / M-Pesa Receipt Code
            </label>
            <input
              type="text"
              required
              placeholder="e.g. QGH829103A"
              value={payRef}
              onChange={(e) => setPayRef(e.target.value)}
              className="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono font-bold uppercase"
            />
          </div>

          {/* LIVE WATERFALL SIMULATION DISPLAY (Section 21) */}
          {waterfallPreview && (
            <div className="p-3.5 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2 font-mono">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-bold font-sans">
                Real-Time Waterfall Allocation Hierarchy:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block">1. PENALTIES</span>
                  <span className="font-bold text-rose-600 dark:text-rose-400">
                    {LoanEngine.formatKES(waterfallPreview.penaltyPaid)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">2. FEES</span>
                  <span className="font-bold text-amber-600 dark:text-amber-400">
                    {LoanEngine.formatKES(waterfallPreview.feesPaid)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">3. INTEREST</span>
                  <span className="font-bold text-blue-600 dark:text-blue-400">
                    {LoanEngine.formatKES(waterfallPreview.interestPaid)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">4. PRINCIPAL</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    {LoanEngine.formatKES(waterfallPreview.principalPaid)}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsPostModalOpen(false)}
              className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
            >
              Post Payment & Generate Official Receipt
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL 2: TRANSACTION REVERSAL */}
      {selectedRepayment && (
        <Modal
          isOpen={isReversalModalOpen}
          onClose={() => setIsReversalModalOpen(false)}
          title={`Reverse Collection: ${selectedRepayment.receiptNumber}`}
          subtitle="Restores loan balances and posts counter GL adjusting entries."
          maxWidth="lg"
        >
          <form onSubmit={handleReversalSubmit} className="space-y-4 text-xs">
            <div className="p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 rounded-xl space-y-1">
              <p className="font-semibold text-rose-900 dark:text-rose-300">Transaction Reversal Warning:</p>
              <p className="text-rose-800 dark:text-rose-200 text-[11px]">
                Reversing this payment of <strong>{LoanEngine.formatKES(selectedRepayment.amount)}</strong> will reinstate the borrower's principal and interest liabilities immediately.
              </p>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Mandatory Accounting Reversal Justification
              </label>
              <textarea
                rows={3}
                required
                value={reversalReason}
                onChange={(e) => setReversalReason(e.target.value)}
                className="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsReversalModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold"
              >
                Execute Reversal & Audit Entry
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* PRINT ENGINE */}
      {printDoc.open && (
        <PrintTemplate
          docType={printDoc.type}
          repayment={printDoc.repayment}
          loan={printDoc.loan}
          customer={printDoc.customer}
          onClose={() => setPrintDoc({ open: false, type: 'payment_receipt' })}
        />
      )}
    </div>
  );
};
