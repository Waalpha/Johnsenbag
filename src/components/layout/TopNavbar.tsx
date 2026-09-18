/**
 * DAVETECH ERP - Top Navigation Bar
 * Header with Branch switcher, Quick Actions, Global Search, Notification Center,
 * Role Switcher, and Theme Toggle.
 */

import React, { useState } from 'react';
import {
  Menu,
  Search,
  Bell,
  Sun,
  Moon,
  UserCheck,
  PlusCircle,
  ChevronDown,
  Shield,
  FileSpreadsheet,
  Users,
  Wallet,
  CheckCircle2,
  ShieldCheck,
  Pencil,
  Sparkles,
  Building2,
  Trash2,
  Tv,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types/erp';
import { DataService } from '../../services/dataService';
import { ActiveView } from './Sidebar';

interface TopNavbarProps {
  onOpenMobileMenu: () => void;
  onOpenSearch: () => void;
  setActiveView?: (view: ActiveView) => void;
  onQuickAction?: (action: 'customer' | 'asset' | 'collateral' | 'application' | 'repayment' | 'property') => void;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({
  onOpenMobileMenu,
  onOpenSearch,
  setActiveView,
  onQuickAction,
}) => {
  const {
    currentUser,
    allUsers,
    switchUser,
    isDarkMode,
    toggleDarkMode,
    isSingleOperatorMode,
    toggleSingleOperatorMode,
    systemSettings,
    setIsEditPlatformModalOpen,
    logout,
  } = useAuth();

  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isQuickActionOpen, setIsQuickActionOpen] = useState(false);

  const notifications = DataService.getNotifications();
  const unreadCount = notifications.filter((n) => !n.read).length;

  const roleLabels: Record<UserRole, string> = {
    super_admin: 'Super Admin',
    administrator: 'Administrator',
    branch_manager: 'Credit & Operations Manager',
    loan_officer: 'Loan Officer',
    credit_officer: 'Credit Officer',
    valuation_officer: 'Valuation Officer',
    asset_officer: 'Asset Officer',
    cashier: 'Cashier',
    accountant: 'Accountant',
    recovery_officer: 'Recovery Officer',
    custody_officer: 'Custody Officer',
    auditor: 'Auditor',
    customer: 'Customer Portal',
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs px-4 lg:px-6">
      {/* Left: Mobile Toggle, Platform Title & Global Search trigger */}
      <div className="flex items-center gap-2 sm:gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
          aria-label="Open Sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Prominent Platform Title in Top Navbar */}
        <button
          onClick={() => setIsEditPlatformModalOpen(true)}
          title="Click to edit platform title & branding"
          className="flex items-center gap-2 px-2 py-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/80 transition text-left group shrink-0"
        >
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-extrabold text-xs sm:text-sm shadow-xs shrink-0 group-hover:scale-105 transition-transform overflow-hidden">
            {systemSettings?.logoUrl && systemSettings?.logoType === 'image' ? (
              <img
                src={systemSettings.logoUrl}
                alt={systemSettings.platformName || 'DAVETECH'}
                referrerPolicy="no-referrer"
                className="w-full h-full object-contain p-0.5"
              />
            ) : (
              systemSettings?.platformInitials || (systemSettings?.platformName ? systemSettings.platformName.charAt(0) : 'D')
            )}
          </div>
          <div className="flex items-center gap-1 sm:gap-1.5">
            <span className="font-extrabold tracking-tight text-xs sm:text-sm text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
              {systemSettings?.platformName || 'DAVETECH'}
            </span>
            {systemSettings?.platformTitle ? (
              <span className="text-[9px] sm:text-[10px] font-bold uppercase px-1 sm:px-1.5 py-0.5 rounded-sm bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700/60 shrink-0">
                {systemSettings.platformTitle}
              </span>
            ) : null}
            <Pencil className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity hidden sm:inline" />
          </div>
        </button>

        {/* Global Search Button */}
        <button
          id="global-search-btn"
          onClick={onOpenSearch}
          className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 hover:border-emerald-500 dark:hover:border-emerald-500 text-xs w-36 sm:w-52 md:w-64 transition-all group"
        >
          <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-500 shrink-0" />
          <span className="truncate">Search KCA 123A, Loan, Client...</span>
          <kbd className="hidden sm:inline-block ml-auto text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded-sm font-mono">
            Ctrl+K
          </kbd>
        </button>
      </div>

      {/* Right: Quick Actions, Role Switcher, Notifications, Theme, User Profile */}
      <div className="flex items-center gap-2 lg:gap-3">
        {/* Quick Action Menu */}
        <div className="relative">
          <button
            id="quick-action-btn"
            onClick={() => setIsQuickActionOpen(!isQuickActionOpen)}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">New Transaction</span>
            <ChevronDown className="w-3 h-3 opacity-80" />
          </button>

          {isQuickActionOpen && (
            <div className="absolute right-0 mt-1.5 w-56 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl py-1.5 z-50 text-xs">
              <div className="px-3 py-1.5 font-bold uppercase tracking-wider text-[10px] text-slate-400 border-b border-slate-100 dark:border-slate-700">
                Quick Actions
              </div>
              <button
                onClick={() => {
                  setIsQuickActionOpen(false);
                  onQuickAction?.('customer');
                }}
                className="w-full text-left px-3 py-2 flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200"
              >
                <Users className="w-4 h-4 text-blue-500" />
                <span>Register New Customer</span>
              </button>
              <button
                onClick={() => {
                  setIsQuickActionOpen(false);
                  onQuickAction?.('asset');
                }}
                className="w-full text-left px-3 py-2 flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200"
              >
                <Shield className="w-4 h-4 text-amber-500" />
                <span>Register Asset / Vehicle / Land</span>
              </button>
              <button
                onClick={() => {
                  setIsQuickActionOpen(false);
                  onQuickAction?.('collateral');
                }}
                className="w-full text-left px-3 py-2 flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200"
              >
                <Shield className="w-4 h-4 text-emerald-500" />
                <span>Pledge Collateral (LTV Check)</span>
              </button>
              <button
                onClick={() => {
                  setIsQuickActionOpen(false);
                  onQuickAction?.('application');
                }}
                className="w-full text-left px-3 py-2 flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200"
              >
                <FileSpreadsheet className="w-4 h-4 text-purple-500" />
                <span>New Loan Application</span>
              </button>
              <button
                onClick={() => {
                  setIsQuickActionOpen(false);
                  onQuickAction?.('repayment');
                }}
                className="w-full text-left px-3 py-2 flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200"
              >
                <Wallet className="w-4 h-4 text-teal-500" />
                <span>Post Repayment / Collection</span>
              </button>
              <button
                onClick={() => {
                  setIsQuickActionOpen(false);
                  onQuickAction?.('property');
                }}
                className="w-full text-left px-3 py-2 flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200"
              >
                <Building2 className="w-4 h-4 text-emerald-500" />
                <span>Property / Land / House Listing</span>
              </button>
              <button
                onClick={() => {
                  setIsQuickActionOpen(false);
                  onQuickAction?.('item_loan');
                }}
                className="w-full text-left px-3 py-2 flex items-center gap-2 hover:bg-indigo-50 dark:hover:bg-slate-700 text-indigo-700 dark:text-indigo-300 font-semibold"
              >
                <Tv className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Put Household Item (TV, Sofa, Audio)</span>
              </button>

              <button
                onClick={() => {
                  setIsQuickActionOpen(false);
                  setIsEditPlatformModalOpen(true);
                }}
                className="w-full text-left px-3 py-2 flex items-center gap-2 hover:bg-emerald-50 dark:hover:bg-slate-700 text-emerald-700 dark:text-emerald-300 border-t border-slate-100 dark:border-slate-700 font-semibold"
              >
                <Pencil className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Edit Platform Name & Title</span>
              </button>

              <button
                onClick={() => {
                  setIsQuickActionOpen(false);
                  if (setActiveView) setActiveView('settings');
                }}
                className="w-full text-left px-3 py-2 flex items-center gap-2 hover:bg-rose-50 dark:hover:bg-slate-700 text-rose-700 dark:text-rose-300 border-t border-slate-100 dark:border-slate-700 font-semibold"
              >
                <Trash2 className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                <span>Clear / Reset Portfolio Data</span>
              </button>
            </div>
          )}
        </div>

        {/* Operator Console (Single Person Operation Hub) */}
        <div className="relative">
          <button
            id="operator-console-btn"
            onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-emerald-500/30 bg-emerald-50/60 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 text-xs font-medium hover:bg-emerald-100/70 dark:hover:bg-emerald-900/50 transition"
            title="Single Operator Console & Authority"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <div className="text-left leading-tight hidden md:block">
              <span className="font-bold text-[11px] block text-slate-900 dark:text-slate-100">
                {currentUser?.fullName || 'David K. Munene'}
              </span>
              <span className="text-[9px] text-emerald-700 dark:text-emerald-400 font-mono flex items-center gap-1 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                {isSingleOperatorMode ? 'Sole Operator • Master Access' : roleLabels[currentUser?.role] || 'User'}
              </span>
            </div>
            <ChevronDown className="w-3 h-3 text-emerald-700 dark:text-emerald-400 opacity-70" />
          </button>

          {isRoleDropdownOpen && (
            <div className="absolute right-0 mt-1.5 w-80 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl p-3.5 z-50 text-xs">
              {/* Operator Identity Card */}
              <div className="flex items-start gap-3 pb-3 border-b border-slate-100 dark:border-slate-700">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white font-bold flex items-center justify-center text-sm shadow-md shadow-emerald-700/20 shrink-0">
                  {(currentUser?.fullName || 'D').charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-slate-900 dark:text-slate-100 text-xs truncate">
                      {currentUser?.fullName || 'David K. Munene'}
                    </p>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-sm bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 uppercase font-mono">
                      {isSingleOperatorMode ? 'Solo Operator' : 'Corporate'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 truncate">{currentUser?.email || 'adminbreakthrough76@gmail.com'}</p>
                  <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono mt-0.5 font-semibold">
                    Managing Director & Principal Operator
                  </p>
                </div>
              </div>

              {/* Single Operator Unlocked Capabilities */}
              <div className="py-2.5 space-y-1.5">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                    Consolidated Authority Matrix
                  </p>
                  <span className="text-[9px] text-emerald-600 font-semibold">14/14 Modules Unlocked</span>
                </div>
                <div className="grid grid-cols-2 gap-1.5 text-[10px] text-slate-600 dark:text-slate-300">
                  <div className="p-1.5 rounded-md bg-slate-50 dark:bg-slate-750 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span className="truncate">Direct Sanction & Approval</span>
                  </div>
                  <div className="p-1.5 rounded-md bg-slate-50 dark:bg-slate-750 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span className="truncate">Immediate Disburse</span>
                  </div>
                  <div className="p-1.5 rounded-md bg-slate-50 dark:bg-slate-750 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span className="truncate">Asset Valuation & Inspection</span>
                  </div>
                  <div className="p-1.5 rounded-md bg-slate-50 dark:bg-slate-750 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span className="truncate">Collateral Release & Caveats</span>
                  </div>
                </div>
              </div>

              {/* Operating Mode Switcher */}
              <div className="pt-2.5 border-t border-slate-100 dark:border-slate-700 space-y-2">
                <button
                  onClick={() => {
                    setIsRoleDropdownOpen(false);
                    setIsEditPlatformModalOpen(true);
                  }}
                  className="w-full text-left p-2 rounded-lg bg-slate-50 hover:bg-emerald-50/70 dark:bg-slate-750 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-medium flex items-center justify-between transition border border-slate-200/80 dark:border-slate-700 group"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Pencil className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span className="truncate text-[11px]">
                      Platform: <strong className="text-emerald-700 dark:text-emerald-300 font-bold">{systemSettings?.platformName || 'DAVETECH'} {systemSettings?.platformTitle || 'ERP'}</strong>
                    </span>
                  </div>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold group-hover:underline shrink-0">
                    Edit Title
                  </span>
                </button>

                <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40">
                  <div>
                    <p className="font-semibold text-slate-800 dark:text-slate-200 text-[11px]">Single Operator Mode</p>
                    <p className="text-[10px] text-slate-500">Operate end-to-end without role switching</p>
                  </div>
                  <button
                    id="toggle-single-operator-btn"
                    onClick={toggleSingleOperatorMode}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      isSingleOperatorMode ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-600'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                        isSingleOperatorMode ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {!isSingleOperatorMode && (
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-700">
                    <p className="text-[10px] text-slate-400 mb-1.5 font-bold uppercase font-mono">
                      Switch Role Persona (Multi-User Simulation):
                    </p>
                    <div className="max-h-36 overflow-y-auto space-y-1">
                      {allUsers.map((u) => (
                        <button
                          key={u.id}
                          onClick={() => {
                            switchUser(u.id);
                            setIsRoleDropdownOpen(false);
                          }}
                          className={`w-full text-left px-2.5 py-1.5 rounded-md text-[11px] flex items-center justify-between transition ${
                            currentUser?.id === u.id
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 font-bold'
                              : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          <span className="truncate">{u.fullName} ({roleLabels[u.role] || u.role})</span>
                          {currentUser?.id === u.id && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-3 border-t border-slate-100 dark:border-slate-700 mt-2">
                  <button
                    onClick={() => {
                      setIsRoleDropdownOpen(false);
                      logout();
                    }}
                    className="w-full text-center p-2 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/50 text-rose-700 dark:text-rose-300 text-xs font-bold transition border border-rose-200/60 dark:border-rose-900/40"
                  >
                    Sign Out / Lock ERP Session
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Notifications Bell */}
        <div className="relative">
          <button
            id="notifications-btn"
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="relative p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-rose-600 text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-white dark:ring-slate-900">
                {unreadCount}
              </span>
            )}
          </button>

          {isNotifOpen && (
            <div className="absolute right-0 mt-1.5 w-80 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl py-2 z-50 text-xs">
              <div className="px-3.5 py-1.5 flex items-center justify-between border-b border-slate-100 dark:border-slate-700 font-semibold text-slate-800 dark:text-slate-200">
                <span>Alerts & Notifications</span>
                <span className="text-[10px] bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded-sm">
                  {notifications.length} Total
                </span>
              </div>
              <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700/60">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => {
                      DataService.markNotificationRead(n.id);
                      if (n.module === 'loans') setActiveView('approvals');
                      if (n.module === 'recovery') setActiveView('recovery');
                      setIsNotifOpen(false);
                    }}
                    className={`p-3 hover:bg-slate-50 dark:hover:bg-slate-750 cursor-pointer transition ${
                      !n.read ? 'bg-amber-50/40 dark:bg-amber-950/10' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-900 dark:text-slate-100">{n.title}</span>
                      <span className="text-[9px] text-slate-400">{n.timestamp.substring(11)}</span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1">{n.message}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Theme Toggle */}
        <button
          id="theme-toggle-btn"
          onClick={toggleDarkMode}
          className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
          title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
        </button>

        {/* User Mini Avatar */}
        <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
          <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
            {currentUser.fullName.charAt(0)}
          </div>
        </div>
      </div>
    </header>
  );
};
