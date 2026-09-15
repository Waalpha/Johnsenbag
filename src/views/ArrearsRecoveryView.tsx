/**
 * DAVETECH ERP - Arrears Management, Asset Recovery & Collateral Auction Realization
 * Aging buckets, legal demand notices, repossession tracking, and auction proceeds waterfall.
 */

import React, { useState } from 'react';
import {
  AlertTriangle,
  BadgeAlert,
  Gavel,
  Clock,
  Printer,
  ShieldAlert,
  Car,
  FileText,
  DollarSign,
  Send,
  Plus,
  ArrowRight,
} from 'lucide-react';
import { DataService } from '../services/dataService';
import { RecoveryCase, AuctionDisposal, Loan, Customer, Collateral } from '../types/erp';
import { LoanEngine } from '../services/loanEngine';
import { useAuth } from '../context/AuthContext';
import { Modal } from '../components/common/Modal';
import { PrintTemplate, PrintableDocType } from '../components/common/PrintTemplate';

export const ArrearsRecoveryView: React.FC = () => {
  const { currentUser, activeBranchId, hasPermission } = useAuth();

  const [activeTab, setActiveTab] = useState<'arrears' | 'recovery' | 'auctions'>('arrears');
  const [recoveryCases, setRecoveryCases] = useState<RecoveryCase[]>(() => DataService.getRecoveryCases());
  const [auctions, setAuctions] = useState<AuctionDisposal[]>(() => DataService.getAuctions());
  const [selectedCase, setSelectedCase] = useState<RecoveryCase | null>(null);

  // Modals
  const [isFollowupModalOpen, setIsFollowupModalOpen] = useState(false);
  const [isNewAuctionModalOpen, setIsNewAuctionModalOpen] = useState(false);
  const [isConcludeAuctionModalOpen, setIsConcludeAuctionModalOpen] = useState(false);
  const [selectedAuction, setSelectedAuction] = useState<AuctionDisposal | null>(null);

  // Print engine state
  const [printDoc, setPrintDoc] = useState<{
    open: boolean;
    type: PrintableDocType;
    loan?: Loan;
    customer?: Customer;
    collateral?: Collateral;
  }>({ open: false, type: 'demand_notice' });

  // Follow-up form state
  const [followupType, setFollowupType] = useState<'call' | 'sms' | 'field_visit' | 'demand_letter' | 'repossession_order'>('call');
  const [followupNotes, setFollowupNotes] = useState('Borrower contacted by telephone. Promised to remit installment arrears before Friday.');
  const [followupPromiseDate, setFollowupPromiseDate] = useState('2026-09-20');

  // Auction Conclude Form state
  const [soldPrice, setSoldPrice] = useState(1300000);
  const [auctionFees, setAuctionFees] = useState(65000);
  const [buyerName, setBuyerName] = useState('Premier Auto Dealers Kenya Ltd');

  const loans = DataService.getLoans();
  const customers = DataService.getCustomers();
  const collaterals = DataService.getCollaterals();

  const refreshData = () => {
    setRecoveryCases(DataService.getRecoveryCases());
    setAuctions(DataService.getAuctions());
  };

  // Filter loans in arrears
  const loansInArrears = loans.filter((l) => {
    if (activeBranchId !== 'all' && l.branchId !== activeBranchId) return false;
    return l.daysInArrears > 0 || l.status === 'in_recovery';
  });

  const agingBuckets = [
    { label: 'Current (0 Days)', range: [0, 0], count: loans.filter((l) => l.daysInArrears === 0).length, color: 'bg-emerald-500' },
    { label: '1 - 7 Days (Grace)', range: [1, 7], count: loans.filter((l) => l.daysInArrears >= 1 && l.daysInArrears <= 7).length, color: 'bg-blue-500' },
    { label: '8 - 30 Days (Watch)', range: [8, 30], count: loans.filter((l) => l.daysInArrears >= 8 && l.daysInArrears <= 30).length, color: 'bg-amber-500' },
    { label: '31 - 60 Days (Substandard)', range: [31, 60], count: loans.filter((l) => l.daysInArrears >= 31 && l.daysInArrears <= 60).length, color: 'bg-orange-500' },
    { label: '61 - 90 Days (Doubtful)', range: [61, 90], count: loans.filter((l) => l.daysInArrears >= 61 && l.daysInArrears <= 90).length, color: 'bg-rose-500' },
    { label: '91 - 180 Days (Loss)', range: [91, 180], count: loans.filter((l) => l.daysInArrears >= 91 && l.daysInArrears <= 180).length, color: 'bg-rose-700' },
  ];

  const handleAddFollowup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCase) return;

    try {
      DataService.addRecoveryFollowup(
        selectedCase.id,
        currentUser,
        followupType,
        followupNotes,
        followupPromiseDate
      );
      setIsFollowupModalOpen(false);
      refreshData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleConcludeAuction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAuction) return;

    try {
      DataService.concludeAuction(
        selectedAuction.id,
        currentUser,
        Number(soldPrice),
        Number(auctionFees),
        buyerName
      );
      setIsConcludeAuctionModalOpen(false);
      setSelectedAuction(null);
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
              Arrears Aging & Recovery Realization
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300">
              {loansInArrears.length} Accounts in Default
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            PAR aging buckets, statutory 14-day demand letters, physical repossession, and auction liquidation.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setActiveTab('arrears')}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeTab === 'arrears'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Arrears Buckets
          </button>
          <button
            onClick={() => setActiveTab('recovery')}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeTab === 'recovery'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Recovery Cases ({recoveryCases.length})
          </button>
          <button
            onClick={() => setActiveTab('auctions')}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeTab === 'auctions'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Auctions & Disposals ({auctions.length})
          </button>
        </div>
      </div>

      {/* TAB 1: ARREARS BUCKETS */}
      {activeTab === 'arrears' && (
        <div className="space-y-6">
          {/* Aging Metric Tiles */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {agingBuckets.map((b) => (
              <div
                key={b.label}
                className="p-3.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs"
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <span className={`w-2 h-2 rounded-full ${b.color}`} />
                  <p className="text-[11px] font-semibold text-slate-500 truncate">{b.label}</p>
                </div>
                <p className="text-xl font-bold font-mono text-slate-900 dark:text-slate-100">
                  {b.count}
                </p>
                <p className="text-[10px] text-slate-400">Facilities</p>
              </div>
            ))}
          </div>

          {/* Overdue Accounts Table */}
          <div className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
              <h3 className="font-bold text-xs text-slate-900 dark:text-slate-100">
                Defaulting Accounts Requiring Immediate Remediation
              </h3>
              <span className="text-[11px] font-mono text-rose-600 font-bold">
                Penalty Accrual: 5.0% Monthly
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="p-3.5 font-semibold">Loan Facility</th>
                    <th className="p-3.5 font-semibold">Borrower Contact</th>
                    <th className="p-3.5 font-semibold text-center">Days Overdue</th>
                    <th className="p-3.5 font-semibold text-right">Principal Bal</th>
                    <th className="p-3.5 font-semibold text-right">Accrued Penalties</th>
                    <th className="p-3.5 font-semibold text-right">Total Demanded</th>
                    <th className="p-3.5 font-semibold">Pledged Collateral</th>
                    <th className="p-3.5 font-semibold text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 font-mono">
                  {loansInArrears.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400 font-sans">
                        No loans currently in default. Portfolio performance is green!
                      </td>
                    </tr>
                  ) : (
                    loansInArrears.map((l) => {
                      const cust = customers.find((c) => c.id === l.customerId);
                      const col = collaterals.find((c) => c.id === l.collateralId);

                      return (
                        <tr key={l.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-750/50">
                          <td className="p-3.5 font-bold text-slate-900 dark:text-slate-100 font-mono">
                            {l.loanNumber}
                          </td>
                          <td className="p-3.5 font-sans">
                            <p className="font-semibold text-slate-900 dark:text-slate-100">
                              {cust?.fullName}
                            </p>
                            <p className="text-[10px] text-slate-400 font-mono">{cust?.phone}</p>
                          </td>
                          <td className="p-3.5 text-center">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 font-mono">
                              {l.daysInArrears} Days
                            </span>
                          </td>
                          <td className="p-3.5 text-right font-bold text-slate-900 dark:text-slate-100">
                            {LoanEngine.formatKES(l.outstandingPrincipal)}
                          </td>
                          <td className="p-3.5 text-right font-bold text-rose-600">
                            {LoanEngine.formatKES(l.outstandingPenalties)}
                          </td>
                          <td className="p-3.5 text-right font-bold text-rose-700 dark:text-rose-400">
                            {LoanEngine.formatKES(l.totalOutstanding)}
                          </td>
                          <td className="p-3.5 font-sans">
                            <p className="text-slate-800 dark:text-slate-200 line-clamp-1">
                              {col?.description || 'N/A'}
                            </p>
                            <p className="text-[10px] text-slate-400 font-mono">
                              FSV: {LoanEngine.formatKES(col?.forcedSaleValue || 0)}
                            </p>
                          </td>
                          <td className="p-3.5 text-center font-sans">
                            <div className="flex items-center justify-center gap-1.5">
                              {/* Print 14-Day Demand Notice */}
                              <button
                                onClick={() => {
                                  setPrintDoc({
                                    open: true,
                                    type: 'demand_notice',
                                    loan: l,
                                    customer: cust,
                                    collateral: col,
                                  });
                                }}
                                className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-[10px] font-semibold transition flex items-center gap-1"
                                title="Issue Formal 14-Day Legal Demand Notice"
                              >
                                <Printer className="w-3 h-3" />
                                <span>Demand Notice</span>
                              </button>
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
        </div>
      )}

      {/* TAB 2: RECOVERY CASES */}
      {activeTab === 'recovery' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recoveryCases.map((rc) => {
              const cust = customers.find((c) => c.id === rc.customerId);
              const col = collaterals.find((c) => c.id === rc.collateralId);

              return (
                <div
                  key={rc.id}
                  className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="font-mono text-xs font-bold text-rose-600">
                          {rc.caseNumber}
                        </span>
                        <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 mt-1">
                          {cust?.fullName || rc.customerId}
                        </h3>
                        <p className="text-xs text-slate-500 font-mono">Loan: {rc.loanId}</p>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300">
                        {String(rc.stage || 'monitoring').replace(/_/g, ' ')}
                      </span>
                    </div>

                    <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-100 dark:border-slate-700 text-xs space-y-1">
                      <div className="flex justify-between font-mono">
                        <span className="text-slate-400">Total Demanded:</span>
                        <span className="font-bold text-rose-600">
                          {LoanEngine.formatKES(rc.totalDemandedAmount)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Pledged Asset:</span>
                        <span className="font-medium text-slate-700 dark:text-slate-300 truncate max-w-[200px]">
                          {col?.description}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Storage Yard:</span>
                        <span className="text-slate-600 dark:text-slate-300">{rc.impoundYardLocation}</span>
                      </div>
                    </div>

                    {/* Follow-up Timeline preview */}
                    <div className="mt-3 space-y-1.5">
                      <p className="text-[10px] uppercase font-bold text-slate-400">
                        Follow-Up Activity Trail ({rc.followUpLogs.length})
                      </p>
                      {rc.followUpLogs.slice(0, 2).map((log) => (
                        <div
                          key={log.id}
                          className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900/40 text-[11px] border border-slate-100 dark:border-slate-800"
                        >
                          <div className="flex justify-between font-semibold text-slate-700 dark:text-slate-300">
                            <span className="capitalize">{String(log.activityType || 'contact').replace(/_/g, ' ')}</span>
                            <span className="text-[10px] text-slate-400">{(log.timestamp || '').split('T')[0] || log.timestamp || ''}</span>
                          </div>
                          <p className="text-slate-600 dark:text-slate-400 text-[10px] mt-0.5">
                            {log.notes}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-2">
                    <button
                      onClick={() => {
                        setSelectedCase(rc);
                        setIsFollowupModalOpen(true);
                      }}
                      className="px-3 py-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold transition flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Log Follow-up</span>
                    </button>

                    <button
                      onClick={() => {
                        const targetLoan = loans.find((l) => l.id === rc.loanId);
                        setPrintDoc({
                          open: true,
                          type: 'demand_notice',
                          loan: targetLoan,
                          customer: cust,
                          collateral: col,
                        });
                      }}
                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold transition flex items-center gap-1"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Print Notice</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: AUCTIONS & DISPOSALS */}
      {activeTab === 'auctions' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {auctions.map((auc) => {
              const col = collaterals.find((c) => c.id === auc.collateralId);

              return (
                <div
                  key={auc.id}
                  className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="font-mono text-xs font-bold text-amber-600">
                          {auc.auctionNumber}
                        </span>
                        <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 mt-1">
                          {auc.assetDescription}
                        </h3>
                        <p className="text-xs text-slate-500">Firm: {auc.auctioneerName}</p>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          auc.status === 'completed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {auc.status}
                      </span>
                    </div>

                    <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-100 dark:border-slate-700 text-xs font-mono space-y-1">
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-sans">Reserve Price (FSV):</span>
                        <span className="font-bold text-slate-900 dark:text-slate-100">
                          {LoanEngine.formatKES(auc.reservePrice)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-sans">Total Debt Demanded:</span>
                        <span className="font-bold text-rose-600">
                          {LoanEngine.formatKES(auc.totalDebtDemanded)}
                        </span>
                      </div>
                      {auc.status === 'completed' && (
                        <>
                          <div className="flex justify-between border-t border-slate-200 dark:border-slate-700 pt-1">
                            <span className="text-slate-400 font-sans">Realized Hammer Price:</span>
                            <span className="font-bold text-emerald-600">
                              {LoanEngine.formatKES(auc.actualSoldPrice || 0)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400 font-sans">
                              {auc.netProceedsOutcome === 'surplus' ? 'Surplus to Borrower:' : 'Shortfall Deficit:'}
                            </span>
                            <span
                              className={`font-bold ${
                                auc.netProceedsOutcome === 'surplus' ? 'text-emerald-600' : 'text-rose-600'
                              }`}
                            >
                              {LoanEngine.formatKES(auc.shortfallOrSurplusAmount || 0)}
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700 flex justify-end">
                    {auc.status !== 'completed' && hasPermission('recovery.*') && (
                      <button
                        onClick={() => {
                          setSelectedAuction(auc);
                          setIsConcludeAuctionModalOpen(true);
                        }}
                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition"
                      >
                        Conclude Auction & Distribute Proceeds
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MODAL 1: RECOVERY FOLLOW-UP */}
      {selectedCase && (
        <Modal
          isOpen={isFollowupModalOpen}
          onClose={() => setIsFollowupModalOpen(false)}
          title={`Log Enforcement Action: ${selectedCase.caseNumber}`}
          subtitle={`Borrower ID: ${selectedCase.customerId} • Facility: ${selectedCase.loanId}`}
          maxWidth="md"
        >
          <form onSubmit={handleAddFollowup} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Enforcement Activity Type
              </label>
              <select
                value={followupType}
                onChange={(e) => setFollowupType(e.target.value as any)}
                className="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              >
                <option value="call">Borrower Phone Demand</option>
                <option value="sms">Automated Statutory SMS Alert</option>
                <option value="field_visit">Officer Physical Field Visit</option>
                <option value="demand_letter">14-Day Notice Letter Dispatched</option>
                <option value="repossession_order">Court Bailiff Repossession Warrant</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Borrower Promise-to-Pay Date
              </label>
              <input
                type="date"
                value={followupPromiseDate}
                onChange={(e) => setFollowupPromiseDate(e.target.value)}
                className="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Detailed Field Officer Notes
              </label>
              <textarea
                rows={3}
                required
                value={followupNotes}
                onChange={(e) => setFollowupNotes(e.target.value)}
                className="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsFollowupModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold"
              >
                Save to Recovery Log
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* MODAL 2: CONCLUDE AUCTION */}
      {selectedAuction && (
        <Modal
          isOpen={isConcludeAuctionModalOpen}
          onClose={() => setIsConcludeAuctionModalOpen(false)}
          title={`Conclude Auction: ${selectedAuction.auctionNumber}`}
          subtitle="Distributes auction sales proceeds according to statutory settlement waterfall."
          maxWidth="lg"
        >
          <form onSubmit={handleConcludeAuction} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Actual Winning Bid / Sale Price (KES)
              </label>
              <input
                type="number"
                required
                value={soldPrice}
                onChange={(e) => setSoldPrice(Number(e.target.value))}
                className="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono font-bold"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Auctioneer & Storage Yard Expenses (KES)
              </label>
              <input
                type="number"
                required
                value={auctionFees}
                onChange={(e) => setAuctionFees(Number(e.target.value))}
                className="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono font-bold"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Winning Buyer Name / Entity
              </label>
              <input
                type="text"
                required
                value={buyerName}
                onChange={(e) => setBuyerName(e.target.value)}
                className="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsConcludeAuctionModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
              >
                Execute Liquidation & Close Case
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
          onClose={() => setPrintDoc({ open: false, type: 'demand_notice' })}
        />
      )}
    </div>
  );
};
