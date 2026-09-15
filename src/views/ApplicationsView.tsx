/**
 * DAVETECH ERP - Loan Applications & Credit Assessment Engine
 * Application origination, real-time DSR & LTV validation,
 * credit risk scoring, and committee submission pipeline.
 */

import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Plus,
  Search,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  UserCheck,
  ShieldCheck,
  Calculator,
  ArrowRight,
  Eye,
  Send,
  Wallet,
  MessageCircle,
  Smartphone,
  ExternalLink,
} from 'lucide-react';
import { DataService } from '../services/dataService';
import { LoanApplication, Customer, Collateral, LoanProduct } from '../types/erp';
import { LoanEngine } from '../services/loanEngine';
import { useAuth } from '../context/AuthContext';
import { Modal } from '../components/common/Modal';
import { ShareApplicationWhatsAppModal } from '../components/loans/ShareApplicationWhatsAppModal';
import { ApplicationReviewModal } from '../components/loans/ApplicationReviewModal';

export const ApplicationsView: React.FC = () => {
  const { currentUser, activeBranchId, hasPermission, isSingleOperatorMode } = useAuth();

  const [applications, setApplications] = useState<LoanApplication[]>(() => DataService.getApplications());
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<'all' | 'online_whatsapp' | 'in_branch'>('all');

  // Modals
  const [isNewAppModalOpen, setIsNewAppModalOpen] = useState(false);
  const [isAssessmentModalOpen, setIsAssessmentModalOpen] = useState(false);
  const [isDisburseModalOpen, setIsDisburseModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState<LoanApplication | null>(null);
  const [reviewApp, setReviewApp] = useState<LoanApplication | null>(null);
  const [disburseApp, setDisburseApp] = useState<LoanApplication | null>(null);
  const [disburseMethod, setDisburseMethod] = useState<'bank' | 'mobile_money' | 'cash' | 'cheque'>('mobile_money');
  const [disburseRef, setDisburseRef] = useState('');
  const [disburseSource, setDisburseSource] = useState('ACC-002');

  // New Application form states
  const customers = DataService.getCustomers();
  const products = DataService.getLoanProducts();
  const collaterals = DataService.getCollaterals();

  const [appCustomerId, setAppCustomerId] = useState(customers[0]?.id || '');
  const [appProductId, setAppProductId] = useState(products[0]?.id || '');
  const [appCollateralId, setAppCollateralId] = useState('');
  const [appAmount, setAppAmount] = useState(600000);
  const [appTenure, setAppTenure] = useState(12);
  const [appPurpose, setAppPurpose] = useState('Business working capital & stock inventory');
  const [appError, setAppError] = useState('');

  // Assessment form states
  const [assessRecommendedAmount, setAssessRecommendedAmount] = useState(500000);
  const [assessRecommendedTenure, setAssessRecommendedTenure] = useState(12);
  const [assessRiskRating, setAssessRiskRating] = useState<'low' | 'medium' | 'high'>('low');
  const [assessRecommendation, setAssessRecommendation] = useState<'recommend_approval' | 'recommend_reduction' | 'recommend_rejection'>('recommend_approval');
  const [assessNotes, setAssessNotes] = useState('');

  const refreshData = () => {
    setApplications(DataService.getApplications());
  };

  const handleQuickApprove = (app: LoanApplication) => {
    try {
      DataService.approveApplication(
        app.id,
        currentUser,
        'approved',
        app.requestedAmount,
        'Approved by Sole Operator',
        'Direct sanction under single operator master authority'
      );
      refreshData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDisburseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!disburseApp) return;
    try {
      DataService.disburseLoan(
        disburseApp.id,
        currentUser,
        disburseMethod,
        disburseRef || `MPX-${Math.floor(100000 + Math.random() * 900000)}`,
        disburseSource
      );
      setIsDisburseModalOpen(false);
      setDisburseApp(null);
      refreshData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Derived application data for selected customer
  const selectedCust = customers.find((c) => c.id === appCustomerId);
  const selectedProd = products.find((p) => p.id === appProductId);
  const availableCustomerCollateral = collaterals.filter(
    (col) => col.customerId === appCustomerId && col.status !== 'released'
  );
  const selectedCol = collaterals.find((col) => col.id === appCollateralId);

  // Live Calculations for new application modal
  const simulatedCalc = selectedProd
    ? LoanEngine.calculateLoan({
        principal: Number(appAmount),
        interestRatePerMonth: selectedProd.interestRatePerMonth,
        durationMonths: Number(appTenure),
        interestMethod: selectedProd.interestMethod,
        repaymentFrequency: selectedProd.repaymentFrequency,
        processingFeePct: selectedProd.processingFeePct || 0,
        insuranceFeePct: selectedProd.insuranceFeePct || 0,
      })
    : null;

  const estimatedMonthlyInstallment = simulatedCalc?.installmentAmount || 0;
  const liveDsr =
    selectedCust && selectedCust.monthlyDeclaredIncome > 0
      ? Math.round((estimatedMonthlyInstallment / selectedCust.monthlyDeclaredIncome) * 100)
      : 0;

  const liveLtv =
    selectedCol && selectedCol.forcedSaleValue > 0
      ? Math.round((appAmount / selectedCol.forcedSaleValue) * 100)
      : 0;

  const filteredApps = applications.filter((a) => {
    if (activeBranchId !== 'all' && a.branchId !== activeBranchId) return false;
    if (statusFilter !== 'all' && a.status !== statusFilter) return false;
    if (sourceFilter === 'online_whatsapp' && a.source !== 'online_whatsapp') return false;
    if (sourceFilter === 'in_branch' && a.source === 'online_whatsapp') return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const cust = customers.find((c) => c.id === a.customerId);
      return Boolean(
        a.applicationNumber?.toLowerCase().includes(q) ||
        a.customerId?.toLowerCase().includes(q) ||
        a.purpose?.toLowerCase().includes(q) ||
        cust?.fullName?.toLowerCase().includes(q) ||
        cust?.phone?.includes(q) ||
        a.applicantDetails?.fullName?.toLowerCase().includes(q) ||
        a.applicantDetails?.phone?.includes(q) ||
        a.proposedCollateralDetails?.title?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleCreateApplication = (e: React.FormEvent) => {
    e.preventDefault();
    setAppError('');

    if (!selectedProd) return;
    if (!appCollateralId) {
      setAppError('A verified collateral asset must be pledged to back this secured loan application.');
      return;
    }

    // LTV Check
    if (selectedCol && liveLtv > selectedProd.maxLtvPercentage) {
      setAppError(
        `Requested loan exceeds maximum allowed LTV (${liveLtv}% vs ${selectedProd.maxLtvPercentage}% max). Please reduce loan amount or pledge higher-value collateral.`
      );
      return;
    }

    try {
      const procFee = Math.round(appAmount * (selectedProd.processingFeePercentage / 100));
      const insFee = Math.round(appAmount * (selectedProd.insuranceFeePercentage / 100));

      const newApp = DataService.saveApplication(
        {
          customerId: appCustomerId,
          loanProductId: appProductId,
          productId: appProductId,
          productName: selectedProd.name,
          requestedAmount: Number(appAmount),
          proposedDurationMonths: Number(appTenure),
          requestedTenureMonths: Number(appTenure),
          interestRatePerMonth: selectedProd.interestRatePerMonth,
          interestMethod: selectedProd.interestMethod,
          repaymentFrequency: selectedProd.repaymentFrequency,
          purpose: appPurpose,
          collateralId: appCollateralId,
          debtServiceRatio: liveDsr,
          loanToValuePct: liveLtv,
          calculatedInstallment: estimatedMonthlyInstallment,
          processingFee: procFee,
          insuranceFee: insFee,
          status: 'submitted',
          branchId: selectedCust?.branchId || 'BR-001',
          loanOfficerId: currentUser.id,
          loanOfficerName: currentUser.fullName,
          monthlyDeclaredIncome: selectedCust?.monthlyIncome || 0,
          monthlyDeclaredExpenses: selectedCust?.monthlyExpenses || 0,
          existingLiabilities: 0,
          documents: [],
        },
        currentUser
      );

      setIsNewAppModalOpen(false);
      refreshData();
    } catch (err: any) {
      setAppError(err.message || 'Failed to submit application');
    }
  };

  const handleSubmitAssessment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApp) return;

    try {
      DataService.submitCreditAssessment(
        selectedApp.id,
        currentUser,
        {
          officerId: currentUser.id,
          officerName: currentUser.fullName,
          assessmentDate: new Date().toISOString().split('T')[0],
          dsrPercentage: selectedApp.debtServiceRatio,
          ltvPercentage: selectedApp.loanToValuePct,
          riskRating: assessRiskRating,
          recommendedAmount: Number(assessRecommendedAmount),
          recommendedTenureMonths: Number(assessRecommendedTenure),
          recommendation: assessRecommendation,
          notes: assessNotes,
        },
        assessRecommendation
      );

      setIsAssessmentModalOpen(false);
      setSelectedApp(null);
      refreshData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Loan Origination & Credit Assessment Pipeline
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
              {applications.length} Applications
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            End-to-end secured underwriting, live debt-service-ratio stress testing, and online WhatsApp application intake.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            id="share-whatsapp-app-btn"
            onClick={() => setIsShareModalOpen(true)}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm transition flex items-center gap-1.5"
          >
            <MessageCircle className="w-4 h-4 fill-white" />
            <span>Share Form via WhatsApp</span>
          </button>

          {hasPermission('loans.create') && (
            <button
              id="new-application-btn"
              onClick={() => {
                setAppError('');
                setIsNewAppModalOpen(true);
              }}
              className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold shadow-sm transition flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Loan Application</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
        <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full md:w-auto">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search ref, borrower, phone, purpose..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-lg text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 outline-none text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:border-emerald-500"
            />
          </div>

          {/* Source Tabs */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-900 p-0.5 rounded-lg text-[11px] font-medium border border-slate-200 dark:border-slate-700 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setSourceFilter('all')}
              className={`flex-1 sm:flex-none px-2.5 py-1 rounded-md transition ${
                sourceFilter === 'all'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold shadow-xs'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              All ({applications.length})
            </button>
            <button
              type="button"
              onClick={() => setSourceFilter('online_whatsapp')}
              className={`flex-1 sm:flex-none px-2.5 py-1 rounded-md transition flex items-center justify-center gap-1 ${
                sourceFilter === 'online_whatsapp'
                  ? 'bg-emerald-600 text-white font-bold shadow-xs'
                  : 'text-emerald-700 dark:text-emerald-400 hover:text-emerald-800'
              }`}
            >
              <MessageCircle className="w-3 h-3" />
              WhatsApp Inbound ({applications.filter((a) => a.source === 'online_whatsapp').length})
            </button>
            <button
              type="button"
              onClick={() => setSourceFilter('in_branch')}
              className={`flex-1 sm:flex-none px-2.5 py-1 rounded-md transition ${
                sourceFilter === 'in_branch'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold shadow-xs'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              In-Branch ({applications.filter((a) => a.source !== 'online_whatsapp').length})
            </button>
          </div>
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full md:w-auto px-2.5 py-1.5 rounded-lg text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 outline-none"
        >
          <option value="all">All Pipeline Stages</option>
          <option value="submitted">Submitted</option>
          <option value="credit_assessment">In Credit Assessment</option>
          <option value="pending_approval">Pending Committee Approval</option>
          <option value="approved">Approved Facilities</option>
          <option value="rejected">Rejected Facilities</option>
        </select>
      </div>

      {/* Applications Table */}
      <div className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="p-3.5 font-semibold">Application No</th>
                <th className="p-3.5 font-semibold">Borrower</th>
                <th className="p-3.5 font-semibold">Product</th>
                <th className="p-3.5 font-semibold text-right">Requested Amount</th>
                <th className="p-3.5 font-semibold text-center">Tenure</th>
                <th className="p-3.5 font-semibold text-center">DSR %</th>
                <th className="p-3.5 font-semibold text-center">LTV %</th>
                <th className="p-3.5 font-semibold text-center">Status</th>
                <th className="p-3.5 font-semibold text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
              {filteredApps.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-400">
                    No loan applications found.
                  </td>
                </tr>
              ) : (
                filteredApps.map((app) => {
                  const cust = customers.find((c) => c.id === app.customerId);
                  return (
                    <tr
                      key={app.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-750/50 transition"
                    >
                      <td className="p-3.5 font-mono font-bold text-slate-900 dark:text-slate-100">
                        {app.applicationNumber}
                        <span className="block text-[10px] text-slate-400 font-sans font-normal">
                          {app.applicationDate}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className="font-semibold text-slate-900 dark:text-slate-100">
                            {cust?.fullName || app.applicantDetails?.fullName || app.customerId}
                          </p>
                          {app.source === 'online_whatsapp' && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                              <MessageCircle className="w-2.5 h-2.5" /> WhatsApp
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400 font-mono">
                          {cust?.phone || app.applicantDetails?.phone}
                        </p>
                      </td>
                      <td className="p-3.5">
                        <span className="font-medium text-slate-800 dark:text-slate-200">
                          {app.productName}
                        </span>
                        <span className="block text-[10px] text-slate-400 font-mono truncate max-w-[140px]">
                          {app.proposedCollateralDetails?.title ? `Security: ${app.proposedCollateralDetails.title}` : `Collateral: ${app.collateralId || 'None'}`}
                        </span>
                      </td>
                      <td className="p-3.5 text-right font-mono font-bold text-slate-900 dark:text-slate-100">
                        {LoanEngine.formatKES(app.requestedAmount)}
                      </td>
                      <td className="p-3.5 text-center font-mono text-slate-600 dark:text-slate-300">
                        {app.requestedTenureMonths} Mo
                      </td>
                      <td className="p-3.5 text-center">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold font-mono ${
                            app.debtServiceRatio > 50
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                              : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          }`}
                        >
                          {app.debtServiceRatio}%
                        </span>
                      </td>
                      <td className="p-3.5 text-center">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold font-mono bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                          {app.loanToValuePct}%
                        </span>
                      </td>
                      <td className="p-3.5 text-center">
                        <span
                          className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase ${
                            app.status === 'approved'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : app.status === 'pending_approval'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                              : app.status === 'rejected'
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                              : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                          }`}
                        >
                          {String(app.status || 'submitted').replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="p-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5 flex-wrap">
                          <button
                            onClick={() => {
                              setReviewApp(app);
                              setIsReviewModalOpen(true);
                            }}
                            className="px-2 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-md text-[10px] font-semibold transition flex items-center gap-1"
                            title="View Full Application & Client Dossier"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Review</span>
                          </button>

                          {app.status === 'submitted' && (
                            <>
                              <button
                                onClick={() => {
                                  setSelectedApp(app);
                                  setAssessRecommendedAmount(app.requestedAmount);
                                  setAssessRecommendedTenure(app.requestedTenureMonths);
                                  setIsAssessmentModalOpen(true);
                                }}
                                className="px-2 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-md text-[10px] font-semibold transition"
                                title="Assess & Score Risk"
                              >
                                Assess
                              </button>
                              <button
                                onClick={() => handleQuickApprove(app)}
                                className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-[10px] font-semibold transition flex items-center gap-1"
                                title="Quick Sanction as Sole Operator"
                              >
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Approve</span>
                              </button>
                            </>
                          )}

                          {app.status === 'pending_approval' && (
                            <button
                              onClick={() => handleQuickApprove(app)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-[10px] font-semibold transition flex items-center gap-1"
                              title="Direct Sanction & Approval"
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Sanction</span>
                            </button>
                          )}

                          {app.status === 'approved' && (
                            <button
                              onClick={() => {
                                setDisburseApp(app);
                                setDisburseRef(`MPX-${Math.floor(100000 + Math.random() * 900000)}`);
                                setIsDisburseModalOpen(true);
                              }}
                              className="px-2.5 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded-md text-[10px] font-semibold transition flex items-center gap-1 shadow-xs"
                              title="Disburse Funds Directly"
                            >
                              <Wallet className="w-3 h-3" />
                              <span>Disburse</span>
                            </button>
                          )}

                          {app.status === 'disbursed' && (
                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold font-mono flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Active Loan
                            </span>
                          )}

                          {app.status === 'rejected' && (
                            <span className="text-[10px] text-rose-500 font-semibold font-mono">
                              Declined
                            </span>
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

      {/* MODAL 1: NEW LOAN APPLICATION */}
      <Modal
        isOpen={isNewAppModalOpen}
        onClose={() => setIsNewAppModalOpen(false)}
        title="Originate Secured Loan Facility"
        subtitle="Calculates DSR, checks collateral LTV compliance, and prepares loan contract."
        maxWidth="3xl"
      >
        <form onSubmit={handleCreateApplication} className="space-y-4 text-xs">
          {appError && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{appError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Select Borrower
              </label>
              <select
                value={appCustomerId}
                onChange={(e) => {
                  setAppCustomerId(e.target.value);
                  setAppCollateralId('');
                }}
                className="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none"
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.fullName} (Income: {LoanEngine.formatKES(c.monthlyDeclaredIncome)}/mo)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Lending Product
              </label>
              <select
                value={appProductId}
                onChange={(e) => setAppProductId(e.target.value)}
                className="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.interestRatePerMonth}%/mo - Max {p.maxLtvPercentage}% LTV)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Collateral Selection */}
          <div className="p-3 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
            <label className="block font-semibold text-slate-700 dark:text-slate-300">
              Pledge Verified Collateral (Required for Secured Facilities)
            </label>
            <select
              value={appCollateralId}
              onChange={(e) => setAppCollateralId(e.target.value)}
              className="w-full p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 outline-none"
            >
              <option value="">-- Choose Borrower Collateral --</option>
              {availableCustomerCollateral.map((col) => (
                <option key={col.id} value={col.id}>
                  {col.id} - {col.description} (FSV: {LoanEngine.formatKES(col.forcedSaleValue)})
                </option>
              ))}
            </select>
            {availableCustomerCollateral.length === 0 && (
              <p className="text-[10px] text-amber-600">
                This customer has no active collateral registered in the vault. Please pledge collateral first in the Collateral Register.
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Requested Loan Amount (KES)
              </label>
              <input
                type="number"
                step="5000"
                required
                value={appAmount}
                onChange={(e) => setAppAmount(Number(e.target.value))}
                className="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono font-bold text-sm"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Requested Tenure (Months)
              </label>
              <input
                type="number"
                min={1}
                max={60}
                required
                value={appTenure}
                onChange={(e) => setAppTenure(Number(e.target.value))}
                className="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono font-bold text-sm"
              />
            </div>
          </div>

          {/* Underwriting Live Metrics Dashboard */}
          <div className="p-3.5 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono">
            <div>
              <span className="text-[10px] text-slate-400 block">EST. MONTHLY PMT</span>
              <span className="font-bold text-slate-900 dark:text-slate-100">
                {LoanEngine.formatKES(estimatedMonthlyInstallment)}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">DSR (RATIO)</span>
              <span
                className={`font-bold ${
                  liveDsr > 50 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
                }`}
              >
                {liveDsr}% {liveDsr > 50 ? '(High Risk)' : '(Healthy)'}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">LTV % (CAP {selectedProd?.maxLtvPercentage}%)</span>
              <span
                className={`font-bold ${
                  liveLtv > (selectedProd?.maxLtvPercentage || 70)
                    ? 'text-rose-600 dark:text-rose-400'
                    : 'text-emerald-600 dark:text-emerald-400'
                }`}
              >
                {liveLtv}%
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">UPFRONT FEES</span>
              <span className="font-bold text-slate-700 dark:text-slate-300">
                {LoanEngine.formatKES(
                  Math.round(
                    appAmount *
                      (((selectedProd?.processingFeePercentage || 2.5) +
                        (selectedProd?.insuranceFeePercentage || 1.0)) /
                        100)
                  )
                )}
              </span>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Purpose of Loan & Repayment Source
            </label>
            <input
              type="text"
              required
              value={appPurpose}
              onChange={(e) => setAppPurpose(e.target.value)}
              className="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsNewAppModalOpen(false)}
              className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
            >
              Submit Application to Credit Assessment
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL 2: CREDIT ASSESSMENT & SCORING */}
      {selectedApp && (
        <Modal
          isOpen={isAssessmentModalOpen}
          onClose={() => setIsAssessmentModalOpen(false)}
          title={`Credit Assessment: ${selectedApp.applicationNumber}`}
          subtitle={`Applicant: ${selectedApp.customerId} • Facility: ${selectedApp.productName}`}
          maxWidth="2xl"
        >
          <form onSubmit={handleSubmitAssessment} className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-700 font-mono">
              <div>
                <span className="text-[10px] text-slate-400">REQUESTED PRINCIPAL</span>
                <p className="font-bold text-sm text-slate-900 dark:text-slate-100">
                  {LoanEngine.formatKES(selectedApp.requestedAmount)}
                </p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400">DSR & LTV RATIOS</span>
                <p className="font-bold text-sm text-emerald-600 dark:text-emerald-400">
                  DSR: {selectedApp.debtServiceRatio}% | LTV: {selectedApp.loanToValuePct}%
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Credit Officer Recommendation
                </label>
                <select
                  value={assessRecommendation}
                  onChange={(e) => setAssessRecommendation(e.target.value as any)}
                  className="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold"
                >
                  <option value="recommend_approval">Recommend for Committee Approval</option>
                  <option value="recommend_reduction">Recommend Reduced Amount</option>
                  <option value="recommend_rejection">Recommend Rejection</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Credit Risk Score Rating
                </label>
                <select
                  value={assessRiskRating}
                  onChange={(e) => setAssessRiskRating(e.target.value as any)}
                  className="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                >
                  <option value="low">Low Risk (Strong Collateral & Cashflow)</option>
                  <option value="medium">Medium Risk (Acceptable Ratios)</option>
                  <option value="high">High Risk (Borderline DSR)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Recommended Principal (KES)
                </label>
                <input
                  type="number"
                  required
                  value={assessRecommendedAmount}
                  onChange={(e) => setAssessRecommendedAmount(Number(e.target.value))}
                  className="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Recommended Tenure (Months)
                </label>
                <input
                  type="number"
                  required
                  value={assessRecommendedTenure}
                  onChange={(e) => setAssessRecommendedTenure(Number(e.target.value))}
                  className="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Credit Committee Assessment Notes
              </label>
              <textarea
                rows={3}
                required
                placeholder="Logbook verified with joint ownership caveat. Business bank statement demonstrates steady monthly cashflow of KES 120,000. Recommend approval."
                value={assessNotes}
                onChange={(e) => setAssessNotes(e.target.value)}
                className="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsAssessmentModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-semibold"
              >
                Forward to Approval Committee
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* MODAL 3: DIRECT LOAN DISBURSEMENT (SOLE OPERATOR) */}
      {disburseApp && (
        <Modal
          isOpen={isDisburseModalOpen}
          onClose={() => setIsDisburseModalOpen(false)}
          title="Direct Loan Disbursement (Sole Operator)"
          subtitle={`Disburse approved funds for application ${disburseApp.applicationNumber} to borrower.`}
          maxWidth="md"
        >
          <form onSubmit={handleDisburseSubmit} className="space-y-4 text-xs">
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Approved Sum:</span>
                <span className="font-mono font-bold text-sm text-emerald-700 dark:text-emerald-300">
                  {LoanEngine.formatKES(disburseApp.requestedAmount)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Borrower:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{disburseApp.customerId}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Executing Operator:</span>
                <span className="font-semibold text-emerald-700 dark:text-emerald-400 font-mono">
                  {currentUser.fullName} (Sole Operator)
                </span>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Disbursement Channel
              </label>
              <select
                value={disburseMethod}
                onChange={(e: any) => setDisburseMethod(e.target.value)}
                className="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold"
              >
                <option value="mobile_money">M-Pesa B2C Bulk Float</option>
                <option value="bank">Direct RTGS / EFT Bank Transfer</option>
                <option value="cash">Branch Operating Petty Cash Vault</option>
                <option value="cheque">Bankers Cheque</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Payment Reference / Transaction ID
              </label>
              <input
                type="text"
                required
                value={disburseRef}
                onChange={(e) => setDisburseRef(e.target.value)}
                className="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono font-bold text-slate-900 dark:text-slate-100"
                placeholder="e.g. QK8920914J or RTGS-2026-09"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Source Funding Account
              </label>
              <select
                value={disburseSource}
                onChange={(e) => setDisburseSource(e.target.value)}
                className="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              >
                <option value="ACC-002">ACC-002 - KCB Operating Commercial Account</option>
                <option value="ACC-003">ACC-003 - Safaricom M-Pesa B2C Disbursement Float</option>
                <option value="ACC-001">ACC-001 - Head Office Main Vault</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsDisburseModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold flex items-center gap-1.5 shadow-sm"
              >
                <Wallet className="w-4 h-4" />
                <span>Confirm & Release Funds</span>
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Share Application via WhatsApp Modal */}
      <ShareApplicationWhatsAppModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
      />

      {/* Application Review Modal */}
      <ApplicationReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => {
          setIsReviewModalOpen(false);
          setReviewApp(null);
        }}
        application={reviewApp}
        onApprove={(app) => {
          handleQuickApprove(app);
        }}
        onAssess={(app) => {
          setSelectedApp(app);
          setAssessRecommendedAmount(app.requestedAmount);
          setAssessRecommendedTenure(app.requestedTenureMonths || 12);
          setIsAssessmentModalOpen(true);
        }}
      />
    </div>
  );
};
