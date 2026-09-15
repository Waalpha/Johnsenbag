/**
 * DAVETECH ERP - Collateral Management & Custody Module
 * Collateral Register, Verification workflows, LTV compliance checks,
 * Vault storage tracking, and Controlled Collateral Release process.
 */

import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  FileText,
  Key,
  Archive,
  Eye,
  Lock,
  Unlock,
  Printer,
  X,
  ExternalLink,
  Tv,
} from 'lucide-react';
import { DataService } from '../services/dataService';
import { Collateral, CollateralStatus, Asset, Customer } from '../types/erp';
import { LoanEngine } from '../services/loanEngine';
import { useAuth } from '../context/AuthContext';
import { Modal } from '../components/common/Modal';
import { PrintTemplate, PrintableDocType } from '../components/common/PrintTemplate';

export const CollateralView: React.FC = () => {
  const { currentUser, hasPermission } = useAuth();

  const [collaterals, setCollaterals] = useState<Collateral[]>(() => DataService.getCollaterals());
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  // Modals state
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
  const [isReleaseModalOpen, setIsReleaseModalOpen] = useState(false);
  const [selectedCollateral, setSelectedCollateral] = useState<Collateral | null>(null);

  // Print state
  const [printDoc, setPrintDoc] = useState<{
    open: boolean;
    type: PrintableDocType;
    collateral?: Collateral;
    customer?: Customer;
  }>({ open: false, type: 'collateral_release' });

  // Form states for register collateral
  const customers = DataService.getCustomers();
  const assets = DataService.getAssets();

  const [newColCustomerId, setNewColCustomerId] = useState(customers[0]?.id || '');
  const [newColAssetId, setNewColAssetId] = useState('');
  const [newColLtvPct, setNewColLtvPct] = useState(70);
  const [newColCustodian, setNewColCustodian] = useState('Esther Njeri (Custody Officer)');
  const [newColStorageLocation, setNewColStorageLocation] = useState('Head Office Strongroom Vault #04');
  const [newColSecurityRef, setNewColSecurityRef] = useState('');
  const [newColNotes, setNewColNotes] = useState('');
  const [formError, setFormError] = useState('');

  // Form states for verification
  const [verifyStatus, setVerifyStatus] = useState<'verified' | 'rejected'>('verified');
  const [verifyNotes, setVerifyNotes] = useState('');

  // Form states for release
  const [releaseAckRef, setReleaseAckRef] = useState('');
  const [releaseNotes, setReleaseNotes] = useState('');
  const [releaseError, setReleaseError] = useState('');

  const refreshData = () => {
    setCollaterals(DataService.getCollaterals());
  };

  useEffect(() => {
    const unsub = DataService.subscribe(() => {
      setCollaterals(DataService.getCollaterals());
    });
    return unsub;
  }, []);

  // Filter available assets for selected customer
  const customerAssets = assets.filter((a) => a.customerId === newColCustomerId);
  const selectedAsset = assets.find((a) => a.id === newColAssetId);

  // Calculated eligible value
  const calculatedEligibleValue = selectedAsset
    ? Math.round(selectedAsset.forcedSaleValue * (newColLtvPct / 100))
    : 0;

  // Filtered List
  const filteredCollaterals = collaterals.filter((col) => {
    if (statusFilter !== 'all' && col.status !== statusFilter) return false;
    if (typeFilter !== 'all' && col.collateralType !== typeFilter) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return Boolean(
        col.id?.toLowerCase().includes(q) ||
        col.description?.toLowerCase().includes(q) ||
        col.storageLocation?.toLowerCase().includes(q) ||
        col.registrationSecurityRef?.toLowerCase().includes(q) ||
        col.customerId?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Metrics
  const totalCollateralValue = collaterals.reduce((acc, c) => acc + c.marketValue, 0);
  const activePledgedValue = collaterals
    .filter((c) => c.status === 'active' || c.status === 'pledged')
    .reduce((acc, c) => acc + c.marketValue, 0);
  const pendingVerificationCount = collaterals.filter((c) => c.verificationStatus === 'pending').length;
  const verifiedCount = collaterals.filter((c) => c.verificationStatus === 'verified').length;
  const releasedCount = collaterals.filter((c) => c.status === 'released').length;
  const inRecoveryCount = collaterals.filter((c) => c.status === 'recovery').length;

  const handleCreateCollateral = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!newColAssetId) {
      setFormError('Please select an asset to pledge');
      return;
    }

    try {
      const asset = assets.find((a) => a.id === newColAssetId);
      if (!asset) throw new Error('Asset not found');

      DataService.saveCollateral(
        {
          customerId: newColCustomerId,
          assetId: newColAssetId,
          collateralType: asset.category,
          description: `${(asset.category || 'Asset').replace(/_/g, ' ').toUpperCase()}: ${asset.titleOrName || ''}`,
          marketValue: asset.marketValue,
          forcedSaleValue: asset.forcedSaleValue,
          approvedCollateralValue: asset.forcedSaleValue,
          loanToValuePct: Number(newColLtvPct),
          eligibleCollateralValue: calculatedEligibleValue,
          status: 'pending_verification',
          custodian: newColCustodian,
          storageLocation: newColStorageLocation,
          registrationSecurityRef: newColSecurityRef || 'PENDING_REGISTRATION',
          verificationStatus: 'pending',
          branchId: asset.branchId || 'main',
          documents: [],
          notes: newColNotes,
        },
        currentUser
      );

      setIsRegisterModalOpen(false);
      refreshData();
    } catch (err: any) {
      setFormError(err.message || 'Failed to pledge collateral');
    }
  };

  const handleVerifyCollateral = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCollateral) return;

    try {
      DataService.verifyCollateral(selectedCollateral.id, currentUser, verifyStatus, verifyNotes);
      setIsVerifyModalOpen(false);
      setSelectedCollateral(null);
      refreshData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleReleaseCollateral = (e: React.FormEvent) => {
    e.preventDefault();
    setReleaseError('');
    if (!selectedCollateral) return;

    try {
      const released = DataService.releaseCollateral(
        selectedCollateral.id,
        currentUser,
        releaseAckRef,
        releaseNotes
      );
      setIsReleaseModalOpen(false);
      refreshData();

      // Open printable release form
      const cust = customers.find((c) => c.id === released.customerId);
      setPrintDoc({
        open: true,
        type: 'collateral_release',
        collateral: released,
        customer: cust,
      });
    } catch (err: any) {
      setReleaseError(err.message || 'Release error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Collateral Register & Custody
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
              {collaterals.length} Secured Records
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Official repository of pledged title deeds, logbooks, yellow metal chattel, and safe vault custody.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <a
            href="#item_loans"
            className="px-3.5 py-2 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-xl text-xs font-semibold shadow-xs transition flex items-center gap-1.5"
          >
            <Tv className="w-3.5 h-3.5" />
            <span>Loans on Household Items (TVs, Woofers, Chairs)</span>
          </a>

          {hasPermission('collateral.create') && (
            <button
              id="pledge-collateral-btn"
              onClick={() => {
                setFormError('');
                setIsRegisterModalOpen(true);
              }}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm transition flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Pledge New Collateral</span>
            </button>
          )}
        </div>
      </div>

      {/* Metric Cards (Section 33) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-3.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs">
          <p className="text-[11px] text-slate-500">Total Collateral</p>
          <p className="text-sm font-bold text-slate-900 dark:text-slate-100 font-mono mt-1">
            {LoanEngine.formatKES(totalCollateralValue)}
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs">
          <p className="text-[11px] text-slate-500">Active Pledged</p>
          <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 font-mono mt-1">
            {LoanEngine.formatKES(activePledgedValue)}
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs">
          <p className="text-[11px] text-slate-500">Verified Assets</p>
          <p className="text-sm font-bold text-blue-600 dark:text-blue-400 font-mono mt-1">
            {verifiedCount} Records
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs">
          <p className="text-[11px] text-slate-500">Pending Inspection</p>
          <p className="text-sm font-bold text-amber-600 dark:text-amber-400 font-mono mt-1">
            {pendingVerificationCount} Pending
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs">
          <p className="text-[11px] text-slate-500">Released / Returned</p>
          <p className="text-sm font-bold text-slate-600 dark:text-slate-300 font-mono mt-1">
            {releasedCount} Released
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs">
          <p className="text-[11px] text-slate-500">Under Recovery</p>
          <p className="text-sm font-bold text-rose-600 dark:text-rose-400 font-mono mt-1">
            {inRecoveryCount} Impounded
          </p>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search collateral ID, asset, vault, NTSA ref..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 outline-none text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="pending_verification">Pending Verification</option>
            <option value="active">Active Pledged</option>
            <option value="recovery">Under Recovery</option>
            <option value="released">Released</option>
          </select>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 outline-none"
          >
            <option value="all">All Asset Types</option>
            <option value="motor_vehicle">Motor Vehicles</option>
            <option value="residential_property">Residential Property</option>
            <option value="commercial_property">Commercial Property</option>
            <option value="machinery">Machinery & Plant</option>
          </select>
        </div>
      </div>

      {/* Main Collateral Table */}
      <div className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="p-3.5 font-semibold">Collateral ID</th>
                <th className="p-3.5 font-semibold">Asset Specification</th>
                <th className="p-3.5 font-semibold">Borrower / Owner</th>
                <th className="p-3.5 font-semibold text-right">Market / FSV</th>
                <th className="p-3.5 font-semibold text-center">LTV %</th>
                <th className="p-3.5 font-semibold text-right">Eligible Loan</th>
                <th className="p-3.5 font-semibold text-center">Verification</th>
                <th className="p-3.5 font-semibold">Custody Vault</th>
                <th className="p-3.5 font-semibold text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 font-sans">
              {filteredCollaterals.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-400">
                    No collateral records found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredCollaterals.map((col) => {
                  const cust = customers.find((c) => c.id === col.customerId);
                  return (
                    <tr
                      key={col.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-750/50 transition"
                    >
                      <td className="p-3.5 font-mono font-bold text-slate-900 dark:text-slate-100">
                        {col.id}
                        {col.activeLoanId && (
                          <span className="block text-[10px] text-emerald-600 dark:text-emerald-400 font-mono">
                            Loan: {col.activeLoanId}
                          </span>
                        )}
                      </td>
                      <td className="p-3.5">
                        <p className="font-semibold text-slate-900 dark:text-slate-100 line-clamp-1">
                          {col.description}
                        </p>
                        <span className="text-[10px] text-slate-400 font-mono">
                          Ref: {col.registrationSecurityRef || 'N/A'}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <p className="font-medium text-slate-800 dark:text-slate-200">
                          {cust?.fullName || col.customerId}
                        </p>
                        <p className="text-[10px] text-slate-400">{cust?.phone}</p>
                      </td>
                      <td className="p-3.5 text-right font-mono">
                        <p className="font-semibold text-slate-900 dark:text-slate-100">
                          {LoanEngine.formatKES(col.marketValue, false)}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          FSV: {LoanEngine.formatKES(col.forcedSaleValue, false)}
                        </p>
                      </td>
                      <td className="p-3.5 text-center">
                        <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-mono font-bold text-[11px] rounded-sm">
                          {col.loanToValuePct}%
                        </span>
                      </td>
                      <td className="p-3.5 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {LoanEngine.formatKES(col.eligibleCollateralValue, false)}
                      </td>
                      <td className="p-3.5 text-center">
                        <span
                          className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase ${
                            col.verificationStatus === 'verified'
                              ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                              : col.verificationStatus === 'pending'
                              ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                              : 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
                          }`}
                        >
                          {col.verificationStatus}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <p className="text-slate-800 dark:text-slate-200 line-clamp-1">
                          {col.storageLocation}
                        </p>
                        <p className="text-[10px] text-slate-400">{col.custodian}</p>
                      </td>
                      <td className="p-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Verify Action */}
                          {hasPermission('collateral.verify') && col.verificationStatus === 'pending' && (
                            <button
                              onClick={() => {
                                setSelectedCollateral(col);
                                setIsVerifyModalOpen(true);
                              }}
                              className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-[10px] font-semibold transition"
                              title="Perform Legal Verification & NTSA/Lands check"
                            >
                              Verify
                            </button>
                          )}

                          {/* Release Action */}
                          {hasPermission('collateral.release') && col.status !== 'released' && (
                            <button
                              onClick={() => {
                                setSelectedCollateral(col);
                                setReleaseError('');
                                setIsReleaseModalOpen(true);
                              }}
                              className="px-2 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-md text-[10px] font-semibold transition"
                              title="Initiate Controlled Collateral Release"
                            >
                              Release
                            </button>
                          )}

                          {/* Print Release Certificate if released */}
                          {col.status === 'released' && (
                            <button
                              onClick={() => {
                                setPrintDoc({
                                  open: true,
                                  type: 'collateral_release',
                                  collateral: col,
                                  customer: cust,
                                });
                              }}
                              className="p-1.5 text-slate-500 hover:text-emerald-600 transition"
                              title="Print Collateral Release Certificate"
                            >
                              <Printer className="w-4 h-4" />
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

      {/* MODAL 1: REGISTER / PLEDGE COLLATERAL */}
      <Modal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        title="Pledge Asset into Collateral Registry"
        subtitle="Registers legal charge, establishes LTV threshold, and assigns vault safe box."
        maxWidth="2xl"
      >
        <form onSubmit={handleCreateCollateral} className="space-y-4 text-xs">
          {formError && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Select Borrower / Customer
              </label>
              <select
                value={newColCustomerId}
                onChange={(e) => {
                  setNewColCustomerId(e.target.value);
                  setNewColAssetId('');
                }}
                className="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none"
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.fullName} ({c.customerNumber})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Select Customer Asset to Pledge
              </label>
              <select
                value={newColAssetId}
                onChange={(e) => setNewColAssetId(e.target.value)}
                className="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none"
              >
                <option value="">-- Choose Asset --</option>
                {customerAssets.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.titleOrName} ({LoanEngine.formatKES(a.marketValue)})
                  </option>
                ))}
              </select>
              {customerAssets.length === 0 && (
                <p className="text-[10px] text-amber-600 mt-1">
                  Customer has no registered assets. Please register an asset first.
                </p>
              )}
            </div>
          </div>

          {selectedAsset && (
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 grid grid-cols-3 gap-2 font-mono">
              <div>
                <span className="text-[10px] text-slate-400 block">MARKET VALUE</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {LoanEngine.formatKES(selectedAsset.marketValue)}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">FORCED SALE VALUE</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {LoanEngine.formatKES(selectedAsset.forcedSaleValue)}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">ELIGIBLE LENDING (70% LTV)</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {LoanEngine.formatKES(calculatedEligibleValue)}
                </span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Loan-to-Value (LTV) % Cap
              </label>
              <input
                type="number"
                min={10}
                max={90}
                value={newColLtvPct}
                onChange={(e) => setNewColLtvPct(Number(e.target.value))}
                className="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Security Register / NTSA Caveat Ref
              </label>
              <input
                type="text"
                placeholder="e.g. NTSA/CAVEAT/2026/88319"
                value={newColSecurityRef}
                onChange={(e) => setNewColSecurityRef(e.target.value)}
                className="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Designated Custody Officer
              </label>
              <input
                type="text"
                value={newColCustodian}
                onChange={(e) => setNewColCustodian(e.target.value)}
                className="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Storage Vault / Yard Location
              </label>
              <input
                type="text"
                value={newColStorageLocation}
                onChange={(e) => setNewColStorageLocation(e.target.value)}
                className="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Custody Notes & Physical Document Checklist
            </label>
            <textarea
              rows={2}
              placeholder="Record original logbook received, spare keys deposited, tracking unit activated..."
              value={newColNotes}
              onChange={(e) => setNewColNotes(e.target.value)}
              className="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsRegisterModalOpen(false)}
              className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-sm"
            >
              Pledge Collateral
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL 2: VERIFY COLLATERAL WORKFLOW */}
      <Modal
        isOpen={isVerifyModalOpen}
        onClose={() => setIsVerifyModalOpen(false)}
        title="Collateral Legal Verification & Search Check"
        subtitle={`Audit record for ${selectedCollateral?.id} (${selectedCollateral?.description})`}
        maxWidth="lg"
      >
        <form onSubmit={handleVerifyCollateral} className="space-y-4 text-xs">
          <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-xl text-amber-800 dark:text-amber-200 text-[11px]">
            <p className="font-semibold">Legal & Regulatory Compliance Directive:</p>
            <p className="mt-1">
              Confirm that original title deed or vehicle logbook is verified against government registries (NTSA TIMS or ArdhiSasa Lands Portal) with zero competing encumbrances.
            </p>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Verification Outcome
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="verifyStatus"
                  value="verified"
                  checked={verifyStatus === 'verified'}
                  onChange={() => setVerifyStatus('verified')}
                  className="text-emerald-600"
                />
                <span className="font-semibold text-emerald-700 dark:text-emerald-400">Verified & Approved</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="verifyStatus"
                  value="rejected"
                  checked={verifyStatus === 'rejected'}
                  onChange={() => setVerifyStatus('rejected')}
                  className="text-rose-600"
                />
                <span className="font-semibold text-rose-700 dark:text-rose-400">Reject Security</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Verification Notes / Search Reference Number
            </label>
            <textarea
              rows={3}
              required
              placeholder="E.g. NTSA TIMS certified online search confirms zero caveats. Original logbook lodged in safe #04."
              value={verifyNotes}
              onChange={(e) => setVerifyNotes(e.target.value)}
              className="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsVerifyModalOpen(false)}
              className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
            >
              Submit Verification Decision
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL 3: CONTROLLED COLLATERAL RELEASE */}
      <Modal
        isOpen={isReleaseModalOpen}
        onClose={() => setIsReleaseModalOpen(false)}
        title="Controlled Collateral Release & Discharge"
        subtitle={`Release workflow for ${selectedCollateral?.id}`}
        maxWidth="lg"
      >
        <form onSubmit={handleReleaseCollateral} className="space-y-4 text-xs">
          {releaseError && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{releaseError}</span>
            </div>
          )}

          <div className="p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl space-y-1">
            <p className="font-semibold text-slate-800 dark:text-slate-200">
              Asset: {selectedCollateral?.description}
            </p>
            <p className="text-[11px] text-slate-500">
              Linked Active Loan: <span className="font-mono font-bold">{selectedCollateral?.activeLoanId || 'None'}</span>
            </p>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Customer Document Collection Acknowledgement Ref / ID
            </label>
            <input
              type="text"
              required
              placeholder="e.g. ACK-DOC-RECV-2026-991"
              value={releaseAckRef}
              onChange={(e) => setReleaseAckRef(e.target.value)}
              className="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Release Notes & Vault Handoff Verification
            </label>
            <textarea
              rows={3}
              required
              placeholder="Original logbook/title deed handed over to borrower in person after verifying national ID."
              value={releaseNotes}
              onChange={(e) => setReleaseNotes(e.target.value)}
              className="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsReleaseModalOpen(false)}
              className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold"
            >
              Authorize & Discharge Collateral
            </button>
          </div>
        </form>
      </Modal>

      {/* PRINT ENGINE POPUP */}
      {printDoc.open && (
        <PrintTemplate
          docType={printDoc.type}
          collateral={printDoc.collateral}
          customer={printDoc.customer}
          onClose={() => setPrintDoc({ open: false, type: 'collateral_release' })}
        />
      )}
    </div>
  );
};
