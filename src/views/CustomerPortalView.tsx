/**
 * DAVETECH ERP - Borrower Self-Service Portal
 * Dedicated borrower interface for checking loan balance, next repayment due date,
 * downloading legal statements, and executing M-Pesa repayments.
 */

import React, { useState } from 'react';
import {
  Coins,
  ShieldCheck,
  Phone,
  Printer,
  CreditCard,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  FileSpreadsheet,
  AlertTriangle,
  Tv,
  FileText,
  UserCheck,
  Shield,
  Send,
} from 'lucide-react';
import { DataService } from '../services/dataService';
import { Customer, Loan, Repayment, ItemLoanAgreement } from '../types/erp';
import { LoanEngine } from '../services/loanEngine';
import { useAuth } from '../context/AuthContext';
import { Modal } from '../components/common/Modal';
import { PrintTemplate, PrintableDocType } from '../components/common/PrintTemplate';

export const CustomerPortalView: React.FC = () => {
  const { currentUser, systemSettings } = useAuth();

  const customers = DataService.getCustomers();
  const [selectedCustomerId, setSelectedCustomerId] = useState(customers[0]?.id || 'CUST-001');

  const customer = customers.find((c) => c.id === selectedCustomerId) || customers[0];
  const customerLoans = DataService.getLoans().filter((l) => l.customerId === customer?.id);
  const customerRepayments = DataService.getRepayments().filter((r) => r.customerId === customer?.id);
  const customerCollaterals = DataService.getCollaterals().filter((c) => c.customerId === customer?.id);
  const customerItemAgreements = DataService.getItemAgreements().filter(
    (a) => a.customerId === customer?.id || a.customerIdNumber === customer?.idNumber
  );

  // M-Pesa Repay Modal
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [payAmount, setPayAmount] = useState(30000);
  const [payPhone, setPayPhone] = useState(customer?.phone || '254712345678');
  const [isProcessingStk, setIsProcessingStk] = useState(false);
  const [stkSuccess, setStkSuccess] = useState(false);

  // Signing agreement state in portal
  const [signingAgreement, setSigningAgreement] = useState<ItemLoanAgreement | null>(null);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [signingName, setSigningName] = useState('');
  const [signatureText, setSignatureText] = useState('');

  // Print engine
  const [printDoc, setPrintDoc] = useState<{
    open: boolean;
    type: PrintableDocType;
    loan?: Loan;
    customer?: Customer;
    itemAgreement?: ItemLoanAgreement;
  }>({ open: false, type: 'repayment_schedule' });

  const totalDebt = customerLoans.reduce((sum, l) => sum + l.totalOutstanding, 0);
  const activeFacility = customerLoans[0];

  const handleSimulateMpesaStk = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessingStk(true);

    setTimeout(() => {
      if (activeFacility) {
        DataService.postRepayment(
          {
            loanId: activeFacility.id,
            customerId: customer.id,
            amount: Number(payAmount),
            paymentDate: new Date().toISOString().split('T')[0],
            paymentMethod: 'mpesa',
            transactionReference: `STK${Date.now().toString().slice(-8)}`,
            notes: 'Borrower portal instant STK push payment.',
            branchId: customer.branchId,
          },
          currentUser
        );
      }
      setIsProcessingStk(false);
      setStkSuccess(true);
      setTimeout(() => {
        setStkSuccess(false);
        setIsPayModalOpen(false);
      }, 2500);
    }, 1500);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Borrower Selector & Profile Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            {systemSettings?.platformName || 'Davetech'} {systemSettings?.platformTitle || 'ERP'} Client Self-Service Portal
          </span>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-0.5">
            Welcome back, {customer?.fullName}
          </h1>
          <p className="text-xs text-slate-500 font-mono">
            ID: {customer?.idNumber} • Account: {customer?.customerNumber}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-xs font-medium text-slate-500">Simulate Borrower:</div>
          <select
            value={selectedCustomerId}
            onChange={(e) => setSelectedCustomerId(e.target.value)}
            className="p-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-semibold"
          >
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.fullName}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Hero Financial Position */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-xs">
          <span className="text-xs opacity-90 block">Total Active Exposure</span>
          <p className="text-2xl font-bold font-mono mt-1">
            {LoanEngine.formatKES(totalDebt)}
          </p>
          <p className="text-[11px] opacity-80 mt-1">
            Across {customerLoans.length} active secured loan facilities
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col justify-between">
          <div>
            <span className="text-xs text-slate-400 block font-medium">Next Scheduled Installment</span>
            <p className="text-2xl font-bold font-mono text-slate-900 dark:text-slate-100 mt-1">
              {activeFacility ? LoanEngine.formatKES(activeFacility.installmentAmount) : 'KES 0'}
            </p>
            <p className="text-[11px] text-emerald-600 font-medium mt-1 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              <span>Due: {activeFacility?.nextDueDate || 'Current'}</span>
            </p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col justify-between">
          <div>
            <span className="text-xs text-slate-400 block font-medium">Pledged Security Coverage</span>
            <p className="text-2xl font-bold font-mono text-emerald-600 mt-1">
              {customerCollaterals.length} Assets
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              Vault custody with active comprehensive insurance
            </p>
          </div>

          <button
            onClick={() => setIsPayModalOpen(true)}
            className="w-full mt-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition flex items-center justify-center gap-1.5"
          >
            <Phone className="w-3.5 h-3.5" />
            <span>Pay via M-Pesa STK Push</span>
          </button>
        </div>
      </div>

      {/* Facilities List */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs p-5 space-y-4">
        <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Coins className="w-4 h-4 text-emerald-600" />
          <span>My Secured Facilities</span>
        </h2>

        {customerLoans.map((loan) => (
          <div
            key={loan.id}
            className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-850 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-slate-900 dark:text-slate-100 text-xs">
                  {loan.loanNumber}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">
                  {loan.status}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Sanctioned Principal: <strong className="font-mono">{LoanEngine.formatKES(loan.principal)}</strong> • Tenure: {loan.durationMonths} Months
              </p>
              <p className="text-[11px] text-slate-400 font-mono">
                Security ID: {loan.collateralId} • Disbursed: {loan.disbursementDate}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right font-mono">
                <span className="text-[10px] text-slate-400 block">Balance Remaining</span>
                <span className="font-bold text-rose-600 text-sm">
                  {LoanEngine.formatKES(loan.totalOutstanding)}
                </span>
              </div>

              <button
                onClick={() => {
                  setPrintDoc({
                    open: true,
                    type: 'repayment_schedule',
                    loan,
                    customer,
                  });
                }}
                className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-slate-300 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold transition flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Statement</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Household Item Collateral Agreements (TV, Woofer, Sofa, Appliances) */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Tv className="w-4 h-4 text-indigo-600" />
            <span>My Pledged Household Items & Loan Agreements</span>
          </h2>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300">
            {customerItemAgreements.length} Agreement(s)
          </span>
        </div>

        {customerItemAgreements.length === 0 ? (
          <div className="p-6 text-center text-slate-400 font-sans border border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
            <Tv className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
            <p className="text-xs font-medium">No household item loans or pledged agreements on file for this account.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {customerItemAgreements.map((agreement) => (
              <div
                key={agreement.id}
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/40 space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-mono text-slate-400 font-semibold">{agreement.agreementNumber}</span>
                    <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100">{agreement.itemTitle}</h3>
                    <p className="text-[11px] text-slate-500">
                      {agreement.itemBrand} {agreement.itemModel} • Serial: {agreement.itemSerialNumber || 'Tagged'}
                    </p>
                  </div>
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      agreement.status === 'signed' || agreement.status === 'active_loan'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                    }`}
                  >
                    {agreement.status.replace(/_/g, ' ')}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs bg-white dark:bg-slate-800 p-2.5 rounded-lg border border-slate-100 dark:border-slate-700">
                  <div>
                    <span className="text-[10px] text-slate-500 block">Sanctioned Principal</span>
                    <strong className="text-slate-900 dark:text-slate-100 font-mono">
                      {LoanEngine.formatKES(agreement.principalAmount)}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Monthly Repayment</span>
                    <strong className="text-emerald-600 dark:text-emerald-400 font-mono">
                      {LoanEngine.formatKES(agreement.monthlyInstallment)}/mo
                    </strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Tenure</span>
                    <span className="text-slate-700 dark:text-slate-300 font-medium">
                      {agreement.durationMonths} Month(s)
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Custody Mode</span>
                    <span className="text-slate-700 dark:text-slate-300 font-medium">
                      {agreement.custodyType === 'in_branch_vault' ? '🏛️ Vault Storage' : '🏠 Held at Residence'}
                    </span>
                  </div>
                </div>

                {agreement.signedAt ? (
                  <div className="flex items-center justify-between text-[11px] text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 p-2 rounded-lg border border-emerald-200 dark:border-emerald-800">
                    <span className="flex items-center gap-1 font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Signed Digitally on {agreement.signedAt.split(' ')[0]}
                    </span>
                    <button
                      onClick={() => {
                        setPrintDoc({
                          open: true,
                          type: 'item_loan_agreement',
                          itemAgreement: agreement,
                          customer,
                        });
                      }}
                      className="text-xs underline font-bold cursor-pointer"
                    >
                      Print Agreement
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => {
                        setSigningAgreement(agreement);
                        setSigningName(customer?.fullName || agreement.customerName);
                        setSignatureText(`/s/ ${(customer?.fullName || agreement.customerName).toUpperCase()}`);
                      }}
                      className="flex-1 py-1.5 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <UserCheck className="w-3.5 h-3.5" /> Review & Sign Online
                    </button>
                    <button
                      onClick={() => {
                        setPrintDoc({
                          open: true,
                          type: 'item_loan_agreement',
                          itemAgreement: agreement,
                          customer,
                        });
                      }}
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer"
                      title="Preview / Print Agreement"
                    >
                      <Printer className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Repayments History */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs p-5 space-y-4">
        <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-emerald-600" />
          <span>My Payment Receipts</span>
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="p-3">Receipt No</th>
                <th className="p-3">Date</th>
                <th className="p-3 text-right">Amount (KES)</th>
                <th className="p-3">Method</th>
                <th className="p-3">Reference Code</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {customerRepayments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-slate-400 font-sans">
                    No payment history recorded yet.
                  </td>
                </tr>
              ) : (
                customerRepayments.map((rep) => (
                  <tr key={rep.id} className="hover:bg-slate-50/50">
                    <td className="p-3 font-bold text-slate-900 dark:text-slate-100">
                      {rep.receiptNumber}
                    </td>
                    <td className="p-3 text-slate-500">{rep.paymentDate}</td>
                    <td className="p-3 text-right font-bold text-emerald-600">
                      {LoanEngine.formatKES(rep.amount, false)}
                    </td>
                    <td className="p-3 uppercase text-[10px] text-slate-700 dark:text-slate-300">
                      {rep.paymentMethod}
                    </td>
                    <td className="p-3 text-slate-500">{rep.transactionReference}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* M-PESA STK PUSH MODAL */}
      <Modal
        isOpen={isPayModalOpen}
        onClose={() => setIsPayModalOpen(false)}
        title="Repay Loan via Safaricom M-Pesa"
        subtitle="Prompt will be delivered directly to your mobile handset (STK Push)."
        maxWidth="md"
      >
        <form onSubmit={handleSimulateMpesaStk} className="space-y-4 text-xs">
          {stkSuccess && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>STK push processed successfully! Loan balance updated.</span>
            </div>
          )}

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Repayment Amount (KES)
            </label>
            <input
              type="number"
              required
              min={100}
              value={payAmount}
              onChange={(e) => setPayAmount(Number(e.target.value))}
              className="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono font-bold text-sm"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Safaricom Phone Number (254...)
            </label>
            <input
              type="text"
              required
              value={payPhone}
              onChange={(e) => setPayPhone(e.target.value)}
              className="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono"
            />
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-[11px] space-y-1">
            <p className="font-semibold text-slate-900 dark:text-slate-100">Paybill Account: 247247</p>
            <p>Account Number: {activeFacility?.loanNumber || customer.customerNumber}</p>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsPayModalOpen(false)}
              className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isProcessingStk}
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold disabled:opacity-50 flex items-center gap-1.5"
            >
              {isProcessingStk ? 'Sending Prompt...' : 'Send M-Pesa STK Prompt'}
            </button>
          </div>
        </form>
      </Modal>

      {/* BORROWER ONLINE SIGN MODAL */}
      {signingAgreement && (
        <Modal
          isOpen={!!signingAgreement}
          onClose={() => setSigningAgreement(null)}
          title={`Sign Item Loan Agreement • ${signingAgreement.agreementNumber}`}
          maxWidth="max-w-md"
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              DataService.signAgreementOnline(signingAgreement.id, {
                clientName: signingName || customer.fullName,
                signature: signatureText,
                ipOrDevice: `Borrower Portal (${navigator.userAgent.substring(0, 30)}...)`,
                notes: 'Accepted directly by client in self-service borrower portal.',
              });
              setSigningAgreement(null);
            }}
            className="space-y-4 text-xs"
          >
            <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl text-indigo-900 dark:text-indigo-200">
              <p className="font-bold">Item Chattel Mortgage & Pledge</p>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                Item: <strong>{signingAgreement.itemTitle}</strong> • Principal: <strong>{LoanEngine.formatKES(signingAgreement.principalAmount)}</strong> • Installment: <strong>{LoanEngine.formatKES(signingAgreement.monthlyInstallment)}/mo</strong>
              </p>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Full Legal Name
              </label>
              <input
                type="text"
                required
                value={signingName}
                onChange={(e) => setSigningName(e.target.value)}
                className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Type Electronic Signature
              </label>
              <input
                type="text"
                required
                value={signatureText}
                onChange={(e) => setSignatureText(e.target.value)}
                placeholder="/s/ FULL NAME"
                className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono"
              />
            </div>

            <div className="flex items-start gap-2 pt-1">
              <input
                type="checkbox"
                id="portal-agree"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                required
                className="mt-0.5"
              />
              <label htmlFor="portal-agree" className="text-[11px] text-slate-600 dark:text-slate-400 leading-tight">
                I agree to the Chattels Transfer Act Cap 28 terms, scheduled monthly payments, and grant lender repossession rights in case of default.
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setSigningAgreement(null)}
                className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!agreeTerms}
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold"
              >
                Confirm & Sign Agreement
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
          itemAgreement={printDoc.itemAgreement}
          onClose={() => setPrintDoc({ open: false, type: 'repayment_schedule' })}
        />
      )}
    </div>
  );
};
