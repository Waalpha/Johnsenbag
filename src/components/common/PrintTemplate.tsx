/**
 * DAVETECH ERP - Printable Document Engine & Standard Legal Templates
 * Uses system settings for company header and provides standard Kenyan legal compliance layouts.
 */

import React from 'react';
import { Printer, Download, X } from 'lucide-react';
import { DataService } from '../../services/dataService';
import { LoanEngine } from '../../services/loanEngine';
import { Customer, Loan, Repayment, Collateral, Asset } from '../../types/erp';

export type PrintableDocType =
  | 'payment_receipt'
  | 'loan_agreement'
  | 'repayment_schedule'
  | 'customer_statement'
  | 'collateral_release'
  | 'demand_notice';

interface PrintTemplateProps {
  docType: PrintableDocType;
  customer?: Customer;
  loan?: Loan;
  repayment?: Repayment;
  collateral?: Collateral;
  asset?: Asset;
  onClose: () => void;
}

export const PrintTemplate: React.FC<PrintTemplateProps> = ({
  docType,
  customer,
  loan,
  repayment,
  collateral,
  asset,
  onClose,
}) => {
  const settings = DataService.getSettings();

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-white text-slate-900 rounded-2xl shadow-2xl overflow-hidden my-8">
        {/* Top Control Bar (Hidden when printing) */}
        <div className="print:hidden px-6 py-3 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm tracking-wide">Document Preview</span>
            <span className="text-xs text-slate-400 font-mono uppercase bg-slate-800 px-2 py-0.5 rounded-sm">
              {String(docType || 'document').replace(/_/g, ' ')}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm transition"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save as PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Paper Area */}
        <div className="p-8 sm:p-12 print:p-6 bg-white min-h-[700px] text-slate-800 font-sans text-xs leading-relaxed">
          {/* Header */}
          <div className="border-b-2 border-slate-900 pb-4 mb-6 flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-lg bg-emerald-700 text-white font-bold text-sm flex items-center justify-center shrink-0">
                  {settings?.platformInitials || (settings?.platformName ? settings.platformName.charAt(0) : 'D')}
                </span>
                <h1 className="text-2xl font-black tracking-tight text-slate-900">
                  {(settings?.companyName || `${settings?.platformName || 'DAVETECH'} SOLUTIONS`).toUpperCase()}
                </h1>
              </div>
              <p className="text-xs text-emerald-800 font-semibold tracking-wider uppercase mt-1">
                {settings?.brandTagline || `${settings?.platformName || 'Davetech'} • ${settings?.platformSubtitle || 'Enterprise Lending & Asset Collateral Management'}`}
              </p>
              <p className="text-[11px] text-slate-600 mt-1 max-w-md">
                {settings?.companyAddress || ''} • Tel: {settings?.companyPhone || ''}
              </p>
              <p className="text-[11px] text-slate-600">
                Email: {settings?.companyEmail || ''} • Web: {settings?.companyWebsite || ''}
              </p>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-mono text-slate-400 block">KRA PIN</span>
              <span className="font-mono font-bold text-xs text-slate-800">{settings.kraPin}</span>
              <span className="text-[10px] font-mono text-slate-400 block mt-1">REGISTRATION NO</span>
              <span className="font-mono font-bold text-xs text-slate-800">{settings.registrationNumber}</span>
              <span className="text-[10px] font-mono text-slate-400 block mt-1">DATE ISSUED</span>
              <span className="font-semibold text-xs text-slate-800">
                {new Date().toISOString().split('T')[0]}
              </span>
            </div>
          </div>

          {/* TEMPLATE 1: PAYMENT RECEIPT */}
          {docType === 'payment_receipt' && repayment && (
            <div className="space-y-6">
              <div className="text-center border-b border-slate-200 pb-3">
                <h2 className="text-lg font-bold text-slate-900 tracking-wide uppercase">
                  Official Repayment Receipt
                </h2>
                <p className="text-xs text-slate-500 font-mono font-semibold">
                  RECEIPT NO: {repayment.receiptNumber}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-500 block text-[11px]">Received From:</span>
                  <span className="font-bold text-sm text-slate-900">{customer?.fullName || 'Valued Customer'}</span>
                  <p className="text-slate-600 text-[11px]">Customer ID: {repayment.customerId}</p>
                  <p className="text-slate-600 text-[11px]">Phone: {customer?.phone || 'N/A'}</p>
                </div>
                <div className="text-right">
                  <span className="text-slate-500 block text-[11px]">Payment Details:</span>
                  <p className="text-slate-700 text-[11px]">
                    Method: <span className="font-semibold uppercase">{String(repayment?.paymentMethod || 'mpesa').replace(/_/g, ' ')}</span>
                  </p>
                  <p className="text-slate-700 text-[11px]">
                    Reference: <span className="font-mono font-bold">{repayment.transactionReference}</span>
                  </p>
                  <p className="text-slate-700 text-[11px]">Date: {repayment.paymentDate}</p>
                </div>
              </div>

              {/* Amount Box */}
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
                <p className="text-xs text-emerald-800 font-semibold uppercase tracking-wider">Total Amount Paid</p>
                <p className="text-3xl font-extrabold text-emerald-900 mt-1 font-mono">
                  {LoanEngine.formatKES(repayment.amount)}
                </p>
              </div>

              {/* Allocation Waterfall Breakdown */}
              <div>
                <h3 className="font-bold text-slate-900 mb-2 uppercase text-[11px]">
                  Accounting Payment Allocation Waterfall
                </h3>
                <table className="w-full border border-slate-200 text-left">
                  <thead className="bg-slate-100 font-semibold text-slate-700">
                    <tr>
                      <th className="p-2.5 border-b">Allocation Item</th>
                      <th className="p-2.5 border-b text-right">Amount Allocated</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-mono">
                    <tr>
                      <td className="p-2.5">Principal Deduction</td>
                      <td className="p-2.5 text-right">{LoanEngine.formatKES(repayment.principalAllocation)}</td>
                    </tr>
                    <tr>
                      <td className="p-2.5">Interest Charge</td>
                      <td className="p-2.5 text-right">{LoanEngine.formatKES(repayment.interestAllocation)}</td>
                    </tr>
                    <tr>
                      <td className="p-2.5">Processing / Administrative Fees</td>
                      <td className="p-2.5 text-right">{LoanEngine.formatKES(repayment.feesAllocation)}</td>
                    </tr>
                    <tr>
                      <td className="p-2.5">Late Payment Penalties</td>
                      <td className="p-2.5 text-right">{LoanEngine.formatKES(repayment.penaltyAllocation)}</td>
                    </tr>
                    <tr className="bg-slate-50 font-bold">
                      <td className="p-2.5">Total Processed</td>
                      <td className="p-2.5 text-right">{LoanEngine.formatKES(repayment.amount)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {loan && (
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-[11px] text-slate-600 flex justify-between">
                  <span>Loan Number: <strong className="font-mono">{loan.loanNumber}</strong></span>
                  <span>Remaining Outstanding Balance: <strong className="font-mono text-rose-700">{LoanEngine.formatKES(loan.totalOutstanding)}</strong></span>
                </div>
              )}

              <div className="pt-6 border-t border-slate-200 flex justify-between text-center">
                <div>
                  <div className="h-10 border-b border-slate-400 w-44 mx-auto mb-1"></div>
                  <p className="text-[10px] text-slate-500">Authorized Cashier: {repayment.receivedByName}</p>
                </div>
                <div>
                  <div className="h-10 border-b border-slate-400 w-44 mx-auto mb-1"></div>
                  <p className="text-[10px] text-slate-500">Customer Signature & Date</p>
                </div>
              </div>
            </div>
          )}

          {/* TEMPLATE 2: LOAN AGREEMENT & SANCTION LETTER */}
          {docType === 'loan_agreement' && loan && (
            <div className="space-y-5">
              <div className="text-center border-b border-slate-200 pb-3">
                <h2 className="text-lg font-bold text-slate-900 tracking-wide uppercase">
                  Secured Credit Agreement & Chattel Mortgage
                </h2>
                <p className="text-xs text-slate-500 font-mono font-semibold">
                  LOAN FACILITY NO: {loan.loanNumber}
                </p>
              </div>

              <p className="text-[11px] text-slate-600 leading-relaxed">
                This Secured Lending Agreement is entered between <strong>{settings.companyName}</strong> (the "Lender")
                and <strong>{customer?.fullName || 'Borrower'}</strong> (ID No: <strong>{customer?.idNumber}</strong>, KRA PIN: <strong>{customer?.kraPin}</strong>,
                residing at {customer?.address || 'N/A'}, {customer?.county}) (the "Borrower").
              </p>

              <div className="grid grid-cols-2 gap-3 text-xs border border-slate-200 rounded-xl p-4 bg-slate-50 font-mono">
                <div>
                  <p className="text-slate-500 text-[10px]">PRINCIPAL SANCTIONED</p>
                  <p className="font-bold text-sm text-slate-900">{LoanEngine.formatKES(loan.principal)}</p>
                </div>
                <div>
                  <p className="text-slate-500 text-[10px]">TOTAL PAYABLE (PRINCIPAL + INTEREST + FEES)</p>
                  <p className="font-bold text-sm text-slate-900">{LoanEngine.formatKES(loan.totalPayable)}</p>
                </div>
                <div>
                  <p className="text-slate-500 text-[10px]">INTEREST METHOD & RATE</p>
                  <p className="font-semibold text-slate-800">
                    {loan?.interestRatePerMonth}% per month ({String(loan?.interestMethod || 'flat_rate').replace(/_/g, ' ')})
                  </p>
                </div>
                <div>
                  <p className="text-slate-500 text-[10px]">MONTHLY INSTALLMENT</p>
                  <p className="font-semibold text-slate-800">{LoanEngine.formatKES(loan.installmentAmount)} / month</p>
                </div>
                <div>
                  <p className="text-slate-500 text-[10px]">TENURE & MATURITY</p>
                  <p className="font-semibold text-slate-800">{loan.durationMonths} Months (Matures {loan.maturityDate})</p>
                </div>
                <div>
                  <p className="text-slate-500 text-[10px]">PLEDGED SECURITY / COLLATERAL</p>
                  <p className="font-semibold text-slate-800">{loan.collateralId || 'As Registered'}</p>
                </div>
              </div>

              {collateral && (
                <div className="border border-slate-200 p-3 rounded-lg text-[11px] bg-white">
                  <h4 className="font-bold uppercase text-slate-900 mb-1">Pledged Asset Details:</h4>
                  <p className="text-slate-700">{collateral.description}</p>
                  <p className="text-slate-600 mt-1">
                    Market Value: {LoanEngine.formatKES(collateral.marketValue)} | Forced Sale Value: {LoanEngine.formatKES(collateral.forcedSaleValue)} | Approved LTV: {collateral.loanToValuePct}%
                  </p>
                  <p className="text-slate-500 text-[10px] mt-1">
                    Security Register Ref: {collateral.registrationSecurityRef || 'NTSA / Registry Joint Charge'}
                  </p>
                </div>
              )}

              <div className="space-y-2 text-[10px] text-slate-600 border-t border-slate-200 pt-3">
                <h4 className="font-bold text-slate-800 uppercase">Principal Terms & Undertakings:</h4>
                <p>
                  1. The Borrower covenants to make scheduled installment payments without deduction or set-off on or before each monthly due date.
                </p>
                <p>
                  2. Default: Failure to pay any installment within the {settings.defaultGracePeriodDays}-day grace period will incur penalty interest at {settings.defaultPenaltyRateMonthly}% per month.
                </p>
                <p>
                  3. Security & Repossession: The Lender holds legal lien/mortgage over the pledged collateral. In the event of persistent default exceeding 30 days, the Lender reserves statutory power to impound and realize the security through court-approved auction.
                </p>
              </div>

              <div className="pt-8 flex justify-between text-center text-[10px]">
                <div>
                  <div className="h-10 border-b border-slate-400 w-44 mx-auto mb-1"></div>
                  <p className="font-semibold">{customer?.fullName}</p>
                  <p className="text-slate-500">Borrower Signature</p>
                </div>
                <div>
                  <div className="h-10 border-b border-slate-400 w-44 mx-auto mb-1"></div>
                  <p className="font-semibold">Kevin Kiprop (Branch Manager)</p>
                  <p className="text-slate-500">For {settings?.companyName || `${settings?.platformName || 'Davetech'} Solutions`}</p>
                </div>
              </div>
            </div>
          )}

          {/* TEMPLATE 3: COLLATERAL RELEASE FORM */}
          {docType === 'collateral_release' && collateral && (
            <div className="space-y-6">
              <div className="text-center border-b border-slate-200 pb-3">
                <h2 className="text-lg font-bold text-slate-900 tracking-wide uppercase">
                  Collateral Release & Discharge of Charge
                </h2>
                <p className="text-xs text-slate-500 font-mono font-semibold">
                  COLLATERAL REF: {collateral.id}
                </p>
              </div>

              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
                <p className="text-xs text-emerald-800 font-semibold uppercase">Discharge Certification</p>
                <p className="text-sm font-bold text-emerald-950 mt-1">
                  Loan Facility fully satisfied. All encumbrances released.
                </p>
              </div>

              <div className="space-y-3 text-xs">
                <p>
                  This certifies that all outstanding financial obligations of borrower <strong>{customer?.fullName}</strong> (ID: {customer?.idNumber})
                  under loan facility <strong>{collateral.activeLoanId || 'N/A'}</strong> have been settled in full.
                </p>
                <div className="border border-slate-200 p-4 rounded-xl bg-slate-50 font-mono">
                  <p className="text-slate-500 text-[10px]">RELEASED COLLATERAL SPECIFICATION</p>
                  <p className="font-bold text-slate-900 mt-0.5">{collateral.description}</p>
                  <p className="text-[11px] text-slate-600 mt-2">
                    Security Registration Reference: {collateral.registrationSecurityRef || 'N/A'}
                  </p>
                  <p className="text-[11px] text-slate-600">
                    Storage Vault Origin: {collateral.storageLocation}
                  </p>
                </div>
                <p className="text-[11px] text-slate-600">
                  The original ownership documents (logbook / title deed / chattel discharge certificate) are hereby returned to the borrower in good order.
                </p>
              </div>

              <div className="pt-8 flex justify-between text-center text-[10px]">
                <div>
                  <div className="h-10 border-b border-slate-400 w-44 mx-auto mb-1"></div>
                  <p className="font-semibold">{collateral.releasedBy || 'Esther Njeri (Custody Officer)'}</p>
                  <p className="text-slate-500">Released By (Lender Custodian)</p>
                </div>
                <div>
                  <div className="h-10 border-b border-slate-400 w-44 mx-auto mb-1"></div>
                  <p className="font-semibold">{customer?.fullName || 'Borrower'}</p>
                  <p className="text-slate-500">Customer Document Acknowledgement</p>
                </div>
              </div>
            </div>
          )}

          {/* TEMPLATE 4: DEMAND NOTICE */}
          {docType === 'demand_notice' && loan && (
            <div className="space-y-5">
              <div className="text-center border-b border-rose-200 pb-3">
                <h2 className="text-lg font-black text-rose-900 tracking-wide uppercase">
                  Formal 14-Day Demand Notice Before Legal Realization
                </h2>
                <p className="text-xs text-rose-600 font-mono font-semibold">
                  LOAN DEFAULT NOTICE • LOAN NO: {loan.loanNumber}
                </p>
              </div>

              <div className="text-xs space-y-1">
                <p><strong>TO:</strong> {customer?.fullName}</p>
                <p><strong>ADDRESS:</strong> {customer?.address}, {customer?.county}</p>
                <p><strong>PHONE:</strong> {customer?.phone}</p>
              </div>

              <p className="text-xs leading-relaxed text-slate-800">
                TAKE NOTICE that you are in default of your loan repayment obligations under facility <strong>{loan.loanNumber}</strong>.
                As of today, your loan account has accumulated arrears of <strong>{loan.daysInArrears} days</strong> with a total overdue amount of{' '}
                <strong className="text-rose-800 font-mono">{LoanEngine.formatKES(loan.outstandingPenalties + loan.outstandingFees + loan.outstandingInterest)}</strong>.
              </p>

              <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl font-mono text-xs">
                <p className="text-rose-800 font-semibold uppercase text-[10px]">Total Outstanding Balance Demanded</p>
                <p className="text-2xl font-bold text-rose-900 mt-1">{LoanEngine.formatKES(loan.totalOutstanding)}</p>
                <p className="text-[11px] text-slate-600 mt-1">Secured Collateral: {loan.collateralId}</p>
              </div>

              <p className="text-xs leading-relaxed text-slate-800">
                You are hereby required to pay the demanded overdue sum within <strong>FOURTEEN (14) DAYS</strong> from the date of this notice, failing which
                {' '}{settings?.companyName || `${settings?.platformName || 'Davetech'} Solutions`} will instruct court bailiffs and auctioneers to seize, impound, and sell by public auction the pledged collateral to satisfy the debt.
              </p>

              <div className="pt-8 flex justify-between text-center text-[10px]">
                <div>
                  <div className="h-10 border-b border-slate-400 w-44 mx-auto mb-1"></div>
                  <p className="font-semibold">Michael Wafula</p>
                  <p className="text-slate-500">Recovery & Legal Enforcement Officer</p>
                </div>
                <div>
                  <div className="h-10 border-b border-slate-400 w-44 mx-auto mb-1"></div>
                  <p className="font-semibold">Head of Credit Operations</p>
                  <p className="text-slate-500">{settings?.companyName || `${settings?.platformName || 'Davetech'} Solutions`}</p>
                </div>
              </div>
            </div>
          )}

          {/* TEMPLATE 5: REPAYMENT SCHEDULE / CUSTOMER STATEMENT */}
          {(docType === 'repayment_schedule' || docType === 'customer_statement') && loan && (
            <div className="space-y-5">
              <div className="text-center border-b border-slate-200 pb-3">
                <h2 className="text-lg font-bold text-slate-900 tracking-wide uppercase">
                  Loan Amortization Schedule & Account Statement
                </h2>
                <p className="text-xs text-slate-500 font-mono font-semibold">
                  LOAN NO: {loan.loanNumber} • CUSTOMER: {customer?.fullName}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs font-mono bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div>
                  <span className="text-slate-500 text-[10px]">PRINCIPAL:</span>
                  <p className="font-bold">{LoanEngine.formatKES(loan.principal)}</p>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px]">TOTAL INTEREST:</span>
                  <p className="font-bold">{LoanEngine.formatKES(loan.totalInterest)}</p>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px]">OUTSTANDING:</span>
                  <p className="font-bold text-rose-700">{LoanEngine.formatKES(loan.totalOutstanding)}</p>
                </div>
              </div>

              <table className="w-full border border-slate-200 text-left text-[10px] font-mono">
                <thead className="bg-slate-100 text-slate-700">
                  <tr>
                    <th className="p-2 border-b">#</th>
                    <th className="p-2 border-b">Due Date</th>
                    <th className="p-2 border-b text-right">Principal</th>
                    <th className="p-2 border-b text-right">Interest</th>
                    <th className="p-2 border-b text-right">Total Due</th>
                    <th className="p-2 border-b text-right">Paid</th>
                    <th className="p-2 border-b text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {loan.schedule.map((item) => (
                    <tr key={item.installmentNumber} className={item.status === 'paid' ? 'bg-emerald-50/40' : ''}>
                      <td className="p-2 font-bold">{item.installmentNumber}</td>
                      <td className="p-2">{item.dueDate}</td>
                      <td className="p-2 text-right">{LoanEngine.formatKES(item.principalDue, false)}</td>
                      <td className="p-2 text-right">{LoanEngine.formatKES(item.interestDue, false)}</td>
                      <td className="p-2 text-right font-semibold">{LoanEngine.formatKES(item.totalInstallment, false)}</td>
                      <td className="p-2 text-right">{LoanEngine.formatKES(item.totalPaid, false)}</td>
                      <td className="p-2 text-center">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[9px] uppercase font-bold ${
                            item.status === 'paid'
                              ? 'bg-emerald-100 text-emerald-800'
                              : item.status === 'overdue'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-slate-100 text-slate-600'
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
          )}

          {/* Footer Note */}
          <div className="mt-12 pt-4 border-t border-slate-200 text-center text-[10px] text-slate-400">
            <p>Generated by {settings?.platformName || 'Davetech'} {settings?.platformTitle || 'ERP'} • Computer generated document requiring authorized digital signature.</p>
            <p className="font-mono text-[9px] mt-0.5">Confidential Lending Record • {settings?.companyName || 'Davetech Solutions Ltd'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
