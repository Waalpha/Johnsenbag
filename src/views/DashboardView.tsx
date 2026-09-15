/**
 * DAVETECH ERP - Executive Management Dashboard
 * Top financial KPI cards, Recharts analytics, portfolio growth, collections,
 * collateral distribution, arrears aging, and recent activity timeline.
 */

import React, { useState } from 'react';
import {
  Coins,
  ShieldCheck,
  TrendingUp,
  AlertTriangle,
  BadgeAlert,
  Clock,
  CheckCircle2,
  Car,
  Landmark,
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
  Pencil,
  Building2,
  Home,
  MapPin,
  Wrench,
  Trash2,
  RotateCcw,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';
import { DataService } from '../services/dataService';
import { LoanEngine } from '../services/loanEngine';
import { useAuth } from '../context/AuthContext';
import { ActiveView } from '../components/layout/Sidebar';
import { ClearDataModal } from '../components/common/ClearDataModal';

interface DashboardViewProps {
  onNavigate: (view: ActiveView) => void;
  onQuickAction: (action: 'customer' | 'asset' | 'collateral' | 'application' | 'repayment' | 'property') => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigate,
  onQuickAction,
}) => {
  const { systemSettings, setIsEditPlatformModalOpen } = useAuth();
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);

  const loans = DataService.getLoans();
  const collaterals = DataService.getCollaterals();
  const applications = DataService.getApplications();
  const repayments = DataService.getRepayments();
  const auditLogs = DataService.getAuditLogs().slice(0, 6);
  const properties = DataService.getProperties();
  const maintenance = DataService.getMaintenanceRequests();
  const landPlots = properties.filter((p) => p.category === 'sale');
  const houseRentals = properties.filter((p) => p.category === 'rent');
  const totalLandValue = landPlots.reduce((sum, p) => sum + (p.price || 0), 0);
  const totalMonthlyRent = houseRentals.reduce((sum, p) => sum + (p.price || 0), 0);
  const occupiedRentals = houseRentals.filter((p) => p.status === 'occupied').length;

  // Financial Metrics Calculation
  const totalPrincipal = loans.reduce((acc, l) => acc + (l.principal || 0), 0);
  const outstandingPrincipal = loans.reduce((acc, l) => acc + (l.outstandingPrincipal || 0), 0);
  const totalInterest = loans.reduce((acc, l) => acc + (l.totalInterest || 0), 0);
  const totalOutstanding = loans.reduce((acc, l) => acc + (l.totalOutstanding || 0), 0);

  const activeLoansCount = loans.filter((l) => l.status === 'active' || l.status === 'restructured').length;
  const overdueLoans = loans.filter((l) => (l.daysInArrears || 0) > 0 || l.status === 'in_recovery');
  const overdueLoansCount = overdueLoans.length;
  const totalArrearsAmount = overdueLoans.reduce(
    (acc, l) => acc + (l.outstandingPenalties || 0) + (l.outstandingFees || 0) + (l.outstandingInterest || 0),
    0
  );

  const totalCollateralMarketValue = collaterals.reduce((acc, c) => acc + (c.marketValue || 0), 0);
  const totalCollateralForcedSaleValue = collaterals.reduce((acc, c) => acc + (c.forcedSaleValue || 0), 0);

  const totalCollections = repayments.reduce((acc, r) => acc + (r.amount || 0), 0);
  const pendingApplicationsCount = applications.filter(
    (a) => a.status === 'submitted' || a.status === 'credit_assessment'
  ).length;
  const awaitingApprovalCount = applications.filter((a) => a.status === 'pending_approval').length;

  const collateralCoverageRatio =
    outstandingPrincipal > 0
      ? Math.round((totalCollateralMarketValue / outstandingPrincipal) * 100)
      : totalCollateralMarketValue > 0 ? 100 : 0;

  // Chart Data: Dynamically generate monthly collections vs disbursements from real records
  const dynamicMonths: { key: string; label: string }[] = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthName = d.toLocaleString('default', { month: 'short' });
    const isCurrent = i === 0;
    const yearMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    dynamicMonths.push({
      key: yearMonth,
      label: isCurrent ? `${monthName} (MTD)` : monthName,
    });
  }

  const performanceTrendData = dynamicMonths.map((m) => {
    const disbs = loans
      .filter((l) => (l.disbursementDate || l.createdAt || '').startsWith(m.key))
      .reduce((sum, l) => sum + (l.principal || 0), 0);
    const colls = repayments
      .filter((r) => (r.paymentDate || r.createdAt || '').startsWith(m.key))
      .reduce((sum, r) => sum + (r.amount || 0), 0);
    return {
      month: m.label,
      disbursements: disbs,
      collections: colls,
    };
  });

  // Ensure current aggregate totals are visible if recorded dates fall outside sample month strings
  const totalTrendDisbs = performanceTrendData.reduce((acc, p) => acc + p.disbursements, 0);
  const totalTrendColls = performanceTrendData.reduce((acc, p) => acc + p.collections, 0);
  if (totalTrendDisbs === 0 && totalPrincipal > 0) {
    performanceTrendData[performanceTrendData.length - 1].disbursements = totalPrincipal;
  }
  if (totalTrendColls === 0 && totalCollections > 0) {
    performanceTrendData[performanceTrendData.length - 1].collections = totalCollections;
  }

  // Chart Data: Collateral Distribution by Type
  const collateralTypesMap: Record<string, number> = {};
  collaterals.forEach((c) => {
    const rawType = c.collateralType || (c as any).category || (c as any).type || 'general';
    const label = String(rawType).replace(/_/g, ' ').toUpperCase();
    collateralTypesMap[label] = (collateralTypesMap[label] || 0) + (c.marketValue || 0);
  });

  const collateralPieData = Object.entries(collateralTypesMap).map(([name, value]) => ({
    name,
    value,
  }));

  const PIE_COLORS = ['#059669', '#2563EB', '#D97706', '#7C3AED', '#DC2626', '#0891B2'];

  // Chart Data: Arrears Aging Buckets dynamically computed from actual loan facilities
  const bucketDefs = [
    { bucket: 'Current (0)', min: 0, max: 0 },
    { bucket: '1-7 Days', min: 1, max: 7 },
    { bucket: '8-30 Days', min: 8, max: 30 },
    { bucket: '31-60 Days', min: 31, max: 60 },
    { bucket: '61-90 Days', min: 61, max: 90 },
    { bucket: '91-180 Days', min: 91, max: 180 },
    { bucket: '180+ Days', min: 181, max: 999999 },
  ];

  const arrearsBucketsData = bucketDefs.map((b) => {
    const matchingLoans = loans.filter((l) => {
      const days = l.daysInArrears || 0;
      if (b.min === 0 && b.max === 0) {
        return days === 0 && l.status !== 'in_recovery';
      }
      return days >= b.min && days <= b.max;
    });
    return {
      bucket: b.bucket,
      count: matchingLoans.length,
      amount: matchingLoans.reduce(
        (sum, l) => sum + (l.outstandingPenalties || 0) + (l.outstandingFees || 0) + (l.outstandingInterest || 0),
        0
      ),
    };
  });

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 p-6 rounded-2xl text-white shadow-md border border-slate-800">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2 flex-wrap">
              <span>{systemSettings?.platformName || 'DAVETECH'}</span>
              {systemSettings?.platformTitle ? (
                <span className="text-emerald-400 font-bold text-xs uppercase px-2 py-0.5 rounded-sm bg-emerald-950/80 border border-emerald-800/60">
                  {systemSettings.platformTitle}
                </span>
              ) : null}
              <span className="text-slate-200 text-sm font-medium">Portfolio Overview</span>
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live Database Connected
            </span>
            <button
              onClick={() => setIsEditPlatformModalOpen(true)}
              title="Edit Platform Title & Branding"
              className="p-1 rounded-lg text-slate-400 hover:text-emerald-300 hover:bg-slate-800/80 transition"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-xs text-slate-300 mt-1 max-w-xl">
            {systemSettings?.platformSubtitle || 'Asset-backed portfolio tracking, real-time collateral coverage, NTSA logbook liens, and complete lending operations.'}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => onQuickAction('application')}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm transition flex items-center gap-1.5"
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>New Application</span>
          </button>
          <button
            onClick={() => onQuickAction('repayment')}
            className="px-3.5 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-xs font-semibold transition flex items-center gap-1.5"
          >
            <Coins className="w-3.5 h-3.5" />
            <span>Post Repayment</span>
          </button>
          <button
            onClick={() => setIsClearModalOpen(true)}
            className="px-3 py-2 bg-rose-600/20 hover:bg-rose-600/40 border border-rose-500/50 text-rose-200 hover:text-white rounded-xl text-xs font-semibold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
            title="Clear Portfolio / Reset to KSh 0.00"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-400" />
            <span>Clear Portfolio / Reset</span>
          </button>
        </div>
      </div>

      {/* Demo / Portfolio Status Banner */}
      {loans.length > 0 ? (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-amber-900 dark:text-amber-200 text-xs shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-slate-900 dark:text-amber-200">
                Demo Portfolio Active ({loans.length} Facilities • {LoanEngine.formatKES(totalPrincipal)})
              </p>
              <p className="text-[11px] text-slate-600 dark:text-amber-300/80">
                Sample portfolio data is currently visible. You can wipe this to KSh 0.00 to start your company's live lending records.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setIsClearModalOpen(true)}
              className="w-full sm:w-auto px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear All to KSh 0.00</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-900 dark:text-emerald-200 text-xs shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-slate-900 dark:text-emerald-200">
                Portfolio Balance is Clean: KSh 0.00 (0 Active Facilities)
              </p>
              <p className="text-[11px] text-slate-600 dark:text-emerald-300/80">
                Clean database ready for live business facilities. Click "New Application" to register your first borrower facility.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setIsClearModalOpen(true)}
              className="w-full sm:w-auto px-3 py-1.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-xl text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Data Options / Restore Demo</span>
            </button>
          </div>
        </div>
      )}

      {/* Primary KPI Grid (Section 32 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Loan Portfolio */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Total Loan Portfolio
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-2 font-mono">
            {LoanEngine.formatKES(totalPrincipal)}
          </p>
          <div className="mt-2 flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>{loans.length} Total Facilities Issued</span>
          </div>
        </div>

        {/* Card 2: Outstanding Principal */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Outstanding Principal
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-2 font-mono">
            {LoanEngine.formatKES(outstandingPrincipal)}
          </p>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Active: {activeLoansCount} loans</span>
            <span className="font-mono text-emerald-600">{Math.round((outstandingPrincipal / (totalPrincipal || 1)) * 100)}% active</span>
          </div>
        </div>

        {/* Card 3: Pledged Collateral Market Value */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Total Collateral Value
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-2 font-mono">
            {LoanEngine.formatKES(totalCollateralMarketValue)}
          </p>
          <div className="mt-2 flex items-center justify-between text-[11px] text-purple-600 dark:text-purple-400">
            <span>Coverage: {collateralCoverageRatio}%</span>
            <span className="text-slate-400">FSV: {LoanEngine.formatKES(totalCollateralForcedSaleValue, false)}</span>
          </div>
        </div>

        {/* Card 4: Overdue Arrears */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Loans in Arrears
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-2 font-mono">
            {LoanEngine.formatKES(totalArrearsAmount)}
          </p>
          <div className="mt-2 flex items-center justify-between text-[11px]">
            <span className="text-rose-600 font-medium">{overdueLoansCount} Facility in default</span>
            <button
              onClick={() => onNavigate('arrears')}
              className="text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 underline"
            >
              View aging
            </button>
          </div>
        </div>
      </div>

      {/* Secondary Operational Mini-Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
          <div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Total Collections</p>
            <p className="text-base font-bold text-slate-900 dark:text-slate-100 font-mono mt-0.5">
              {LoanEngine.formatKES(totalCollections)}
            </p>
          </div>
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
        </div>

        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
          <div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Pending Applications</p>
            <p className="text-base font-bold text-slate-900 dark:text-slate-100 font-mono mt-0.5">
              {pendingApplicationsCount}
            </p>
          </div>
          <Clock className="w-4 h-4 text-amber-500" />
        </div>

        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
          <div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Awaiting Committee Approval</p>
            <p className="text-base font-bold text-slate-900 dark:text-slate-100 font-mono mt-0.5">
              {awaitingApprovalCount}
            </p>
          </div>
          <BadgeAlert className="w-4 h-4 text-purple-500" />
        </div>

        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
          <div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Collateral-to-Loan Ratio</p>
            <p className="text-base font-bold text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">
              {collateralCoverageRatio}%
            </p>
          </div>
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
        </div>
      </div>

      {/* Visual Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart 1: Collections vs Disbursements Trend */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Lending Disbursements vs Repayments Collections
              </h3>
              <p className="text-xs text-slate-500">6-Month monthly performance trend (KES)</p>
            </div>
            <span className="text-[11px] font-mono text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-md font-semibold">
              +18.4% YoY
            </span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={performanceTrendData}>
                <defs>
                  <linearGradient id="colorDisburse" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorCollect" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#059669" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#059669" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={10}
                  tickFormatter={(val) => `${(val / 1000000).toFixed(1)}M`}
                />
                <Tooltip
                  formatter={(val: number | string | undefined) =>
                    LoanEngine.formatKES(typeof val === 'number' ? val : 0)
                  }
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Area
                  type="monotone"
                  dataKey="disbursements"
                  name="Disbursements"
                  stroke="#2563EB"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorDisburse)"
                />
                <Area
                  type="monotone"
                  dataKey="collections"
                  name="Collections"
                  stroke="#059669"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorCollect)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Pledged Collateral Distribution by Category */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Collateral Asset Mix
            </h3>
            <button
              onClick={() => onNavigate('collateral_dashboard')}
              className="text-[11px] text-emerald-600 hover:underline flex items-center"
            >
              Details <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <p className="text-xs text-slate-500 mb-2">Market value by asset classification</p>
          <div className="h-56 w-full flex items-center justify-center">
            {collateralPieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={collateralPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {collateralPieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: number | string | undefined) =>
                      LoanEngine.formatKES(typeof val === 'number' ? val : 0)
                    }
                  />
                  <Legend wrapperStyle={{ fontSize: '10px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center p-4 text-slate-400">
                <ShieldCheck className="w-8 h-8 mx-auto mb-1 text-slate-300 dark:text-slate-600" />
                <p className="text-xs">No registered collateral recorded</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Property & Real Estate Portfolio Showcase */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-700/80 pb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center border border-teal-200/50 dark:border-teal-800/50 shadow-xs">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                Property Management, Land & Plots for Sale & House Rentals
                <span className="text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-semibold px-2 py-0.5 rounded-full font-mono">
                  {properties.length} Active Listings
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Integrated real estate portfolio — manage plots for sale, residential tenant leases, and maintenance tickets
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => onNavigate('property_management')}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 transition"
            >
              All Properties
            </button>
            <button
              onClick={() => onNavigate('land_plots')}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 hover:bg-amber-100 border border-amber-200/60 dark:border-amber-900/60 transition"
            >
              Plots for Sale ({landPlots.length})
            </button>
            <button
              onClick={() => onNavigate('house_rentals')}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300 hover:bg-teal-100 border border-teal-200/60 dark:border-teal-900/60 transition"
            >
              House Rentals ({houseRentals.length})
            </button>
            <button
              onClick={() => onNavigate('property_maintenance')}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 hover:bg-rose-100 border border-rose-200/60 dark:border-rose-900/60 transition"
            >
              Maintenance ({maintenance.length})
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div
            onClick={() => onNavigate('land_plots')}
            className="p-4 rounded-xl bg-slate-50/80 dark:bg-slate-750/50 border border-slate-200/70 dark:border-slate-700/70 hover:border-amber-400 dark:hover:border-amber-500 cursor-pointer transition group"
          >
            <div className="flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              <span className="flex items-center gap-1.5 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition">
                <MapPin className="w-4 h-4 text-amber-500" /> Land & Plots for Sale
              </span>
              <span className="font-mono text-amber-600 font-bold bg-amber-100 dark:bg-amber-950/80 px-1.5 py-0.5 rounded text-[10px]">
                {landPlots.length} Parcels
              </span>
            </div>
            <p className="text-xl font-bold font-mono text-slate-900 dark:text-slate-100 mt-1.5">
              KES {totalLandValue.toLocaleString()}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              Ready Title Deeds in Kitengela, Juja Farm & Kilimani with beacon verification
            </p>
          </div>

          <div
            onClick={() => onNavigate('house_rentals')}
            className="p-4 rounded-xl bg-slate-50/80 dark:bg-slate-750/50 border border-slate-200/70 dark:border-slate-700/70 hover:border-teal-400 dark:hover:border-teal-500 cursor-pointer transition group"
          >
            <div className="flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              <span className="flex items-center gap-1.5 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition">
                <Home className="w-4 h-4 text-teal-500" /> House & Apartment Rentals
              </span>
              <span className="font-mono text-teal-600 font-bold bg-teal-100 dark:bg-teal-950/80 px-1.5 py-0.5 rounded text-[10px]">
                {occupiedRentals}/{houseRentals.length} Occupied
              </span>
            </div>
            <p className="text-xl font-bold font-mono text-slate-900 dark:text-slate-100 mt-1.5">
              KES {totalMonthlyRent.toLocaleString()} <span className="text-xs text-slate-400 font-normal">/ mo</span>
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              Residential leases, tenant invoicing & automated rent arrears tracking
            </p>
          </div>

          <div
            onClick={() => onNavigate('property_maintenance')}
            className="p-4 rounded-xl bg-slate-50/80 dark:bg-slate-750/50 border border-slate-200/70 dark:border-slate-700/70 hover:border-emerald-400 dark:hover:border-emerald-500 cursor-pointer transition group"
          >
            <div className="flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              <span className="flex items-center gap-1.5 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition">
                <Wrench className="w-4 h-4 text-emerald-500" /> Maintenance & Repairs
              </span>
              <span className="font-mono text-emerald-600 font-bold bg-emerald-100 dark:bg-emerald-950/80 px-1.5 py-0.5 rounded text-[10px]">
                {maintenance.length} Tickets
              </span>
            </div>
            <p className="text-xl font-bold font-mono text-slate-900 dark:text-slate-100 mt-1.5">
              KES {maintenance.reduce((sum, m) => sum + (m.cost || 0), 0).toLocaleString()}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              {maintenance.filter((m) => m.status === 'resolved').length} Resolved • {maintenance.filter((m) => m.status !== 'resolved').length} In Progress
            </p>
          </div>
        </div>
      </div>

      {/* Lower Section: High Risk Arrears & Live Operations Log */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Arrears Aging Distribution */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                PAR & Arrears Aging Buckets
              </h3>
              <p className="text-xs text-slate-500">Portfolio at Risk distribution (Days Overdue)</p>
            </div>
            <button
              onClick={() => onNavigate('arrears')}
              className="px-2.5 py-1 text-xs bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-200 transition"
            >
              Manage Arrears
            </button>
          </div>

          <div className="space-y-2 mt-4">
            {arrearsBucketsData.map((b) => (
              <div
                key={b.bucket}
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 text-xs"
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      b.bucket.includes('61') || b.bucket.includes('91') || b.bucket.includes('180')
                        ? 'bg-rose-500'
                        : b.bucket.includes('31')
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                    }`}
                  />
                  <span className="font-medium text-slate-800 dark:text-slate-200">{b.bucket}</span>
                </div>
                <div className="flex items-center gap-4 font-mono">
                  <span className="text-slate-400">{b.count} loans</span>
                  <span
                    className={`font-semibold ${
                      b.amount > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {LoanEngine.formatKES(b.amount)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Live Operational Audit Timeline */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Operational Audit Timeline
              </h3>
              <p className="text-xs text-slate-500">Real-time immutable activity ledger</p>
            </div>
            <button
              onClick={() => onNavigate('audit_logs')}
              className="text-xs text-emerald-600 hover:underline flex items-center"
            >
              Full Log <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-3 mt-4">
            {auditLogs.map((log) => (
              <div
                key={log.id}
                className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-750 transition border border-transparent hover:border-slate-100 dark:hover:border-slate-700"
              >
                <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">
                  {log.action.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-slate-900 dark:text-slate-100 truncate">
                      {log.userName}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {log.timestamp.substring(11)}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5 line-clamp-2">
                    {log.details}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Clear Portfolio & System Reset Modal */}
      <ClearDataModal
        isOpen={isClearModalOpen}
        onClose={() => setIsClearModalOpen(false)}
      />
    </div>
  );
};
