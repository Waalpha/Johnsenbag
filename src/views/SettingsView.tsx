/**
 * DAVETECH ERP - System Settings, RBAC Governance & Audit Trail
 * Branch network configuration, role-permission matrix, regulatory thresholds,
 * and immutable system audit logs.
 */

import React, { useState, useEffect } from 'react';
import {
  Settings,
  Building2,
  Shield,
  FileClock,
  Save,
  CheckCircle2,
  Plus,
  Lock,
  Users,
  Search,
  Pencil,
  Sparkles,
  RotateCcw,
  Building,
  Globe,
  Image as ImageIcon,
  Upload,
  Trash2,
  Database,
  AlertTriangle,
  Coins,
  ShieldCheck,
} from 'lucide-react';
import { DataService } from '../services/dataService';
import { LoanEngine } from '../services/loanEngine';
import { UserRole } from '../types/erp';
import { useAuth } from '../context/AuthContext';
import { Modal } from '../components/common/Modal';
import { ClearDataModal } from '../components/common/ClearDataModal';

export const SettingsView: React.FC = () => {
  const {
    currentUser,
    hasPermission,
    isSingleOperatorMode,
    toggleSingleOperatorMode,
    systemSettings,
    updateSystemSettings,
    setIsEditPlatformModalOpen,
  } = useAuth();

  const [activeTab, setActiveTab] = useState<'company' | 'data' | 'rbac' | 'audit'>('company');
  const [auditLogs, setAuditLogs] = useState(() => DataService.getAuditLogs());
  const [searchAudit, setSearchAudit] = useState('');
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);

  // Subscribe to live DataService updates
  useEffect(() => {
    const unsub = DataService.subscribe(() => {
      setAuditLogs(DataService.getAuditLogs());
    });
    return unsub;
  }, []);

  // Platform & Company Settings
  const [platformName, setPlatformName] = useState(systemSettings?.platformName || 'DAVETECH');
  const [platformTitle, setPlatformTitle] = useState(systemSettings?.platformTitle || 'ERP');
  const [platformSubtitle, setPlatformSubtitle] = useState(systemSettings?.platformSubtitle || 'Property, Asset & Secured Lending');
  const [platformInitials, setPlatformInitials] = useState(systemSettings?.platformInitials || 'D');
  const [logoType, setLogoType] = useState<'monogram' | 'image'>(systemSettings?.logoType || 'monogram');
  const [logoUrl, setLogoUrl] = useState(systemSettings?.logoUrl || '');
  const [companyName, setCompanyName] = useState(systemSettings?.companyName || 'Davetech Solutions Limited');
  const [brandTagline, setBrandTagline] = useState(systemSettings?.brandTagline || 'Technology • Innovation • Efficiency');
  const [kraPin, setKraPin] = useState(systemSettings?.kraPin || 'P051928347X');
  const [regNo, setRegNo] = useState(systemSettings?.registrationNumber || 'CPR/2021/88492');
  const [phone, setPhone] = useState(systemSettings?.companyPhone || '+254 700 123 456');
  const [email, setEmail] = useState(systemSettings?.companyEmail || 'info@davetech.co.ke');
  const [website, setWebsite] = useState(systemSettings?.companyWebsite || 'https://davetech.co.ke');
  const [address, setAddress] = useState(systemSettings?.companyAddress || 'Davetech Plaza, Upper Hill Road, Nairobi, Kenya');
  const [defaultPenaltyRate, setDefaultPenaltyRate] = useState(systemSettings?.defaultPenaltyRateMonthly ?? 5.0);
  const [defaultLtvCap, setDefaultLtvCap] = useState(systemSettings?.defaultLtvPct ?? 70);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Sync state when systemSettings updates
  useEffect(() => {
    if (systemSettings) {
      setPlatformName(systemSettings.platformName || 'DAVETECH');
      setPlatformTitle(systemSettings.platformTitle || 'ERP');
      setPlatformSubtitle(systemSettings.platformSubtitle || 'Property, Asset & Secured Lending');
      setPlatformInitials(systemSettings.platformInitials || 'D');
      setLogoType(systemSettings.logoType || 'monogram');
      setLogoUrl(systemSettings.logoUrl || '');
      setCompanyName(systemSettings.companyName || 'Davetech Solutions Limited');
      setBrandTagline(systemSettings.brandTagline || 'Technology • Innovation • Efficiency');
      setKraPin(systemSettings.kraPin || 'P051928347X');
      setRegNo(systemSettings.registrationNumber || 'CPR/2021/88492');
      setPhone(systemSettings.companyPhone || '+254 700 123 456');
      setEmail(systemSettings.companyEmail || 'info@davetech.co.ke');
      setWebsite(systemSettings.companyWebsite || 'https://davetech.co.ke');
      setAddress(systemSettings.companyAddress || 'Davetech Plaza, Upper Hill Road, Nairobi, Kenya');
      setDefaultPenaltyRate(systemSettings.defaultPenaltyRateMonthly ?? 5.0);
      setDefaultLtvCap(systemSettings.defaultLtvPct ?? 70);
    }
  }, [systemSettings]);

  const handleLogoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 1024 * 1024 * 2) {
      alert('Logo file size must be under 2MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setLogoUrl(result);
        setLogoType('image');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveCompany = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = platformName.trim() || 'DAVETECH';
    updateSystemSettings({
      platformName: cleanName,
      platformTitle: platformTitle.trim(),
      platformSubtitle: platformSubtitle.trim(),
      platformInitials: (platformInitials.trim() || cleanName.charAt(0) || 'D').toUpperCase(),
      logoType,
      logoUrl: logoUrl.trim(),
      companyName: companyName.trim() || `${cleanName} Solutions Limited`,
      brandTagline: brandTagline.trim(),
      kraPin: kraPin.trim(),
      registrationNumber: regNo.trim(),
      companyPhone: phone.trim(),
      companyEmail: email.trim(),
      companyWebsite: website.trim(),
      companyAddress: address.trim(),
      defaultPenaltyRateMonthly: defaultPenaltyRate,
      defaultLtvPct: defaultLtvCap,
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3500);
  };

  const handleResetToDavetech = () => {
    updateSystemSettings({
      platformName: 'DAVETECH',
      platformTitle: 'ERP',
      platformSubtitle: 'Property, Asset & Secured Lending',
      platformInitials: 'D',
      logoType: 'monogram',
      logoUrl: '',
      companyName: 'Davetech Solutions Limited',
      brandTagline: 'Technology • Innovation • Efficiency',
      kraPin: 'P051928347X',
      registrationNumber: 'CPR/2021/88492',
      companyPhone: '+254 700 123 456',
      companyEmail: 'info@davetech.co.ke',
      companyWebsite: 'https://davetech.co.ke',
      companyAddress: 'Davetech Plaza, Upper Hill Road, Nairobi, Kenya',
      defaultPenaltyRateMonthly: 5.0,
      defaultLtvPct: 70,
    });
  };

  const filteredAudit = auditLogs.filter((log) => {
    if (searchAudit) {
      const q = searchAudit.toLowerCase();
      return Boolean(
        log.userName?.toLowerCase().includes(q) ||
        log.action?.toLowerCase().includes(q) ||
        log.details?.toLowerCase().includes(q) ||
        (log.module || (log as any).entityType)?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const rolesList: { role: UserRole; title: string; desc: string; perms: string[] }[] = [
    {
      role: 'super_admin',
      title: 'Super Administrator / Managing Director',
      desc: 'Full unrestricted governance, configuration, accounting, and disbursement rights.',
      perms: ['All Permissions (*)', 'Disbursement Approval', 'Credit Sanction', 'System Config'],
    },
    {
      role: 'branch_manager',
      title: 'Credit & Operations Manager',
      desc: 'Supervises portfolio, customer onboarding, and credit approvals up to sanction limits.',
      perms: ['Customer Verification', 'Loan Approval (Tier 3)', 'Collateral Custody', 'Reports'],
    },
    {
      role: 'credit_officer',
      title: 'Credit Analyst & Underwriting Officer',
      desc: 'Assesses financial capacity, DSR stress tests, and recommends approval limits.',
      perms: ['Loan Assessment', 'Credit Scoring', 'DSR Calculation', 'Application Review'],
    },
    {
      role: 'asset_officer',
      title: 'Valuation & Asset Verification Officer',
      desc: 'NTSA logbook checks, Ardhi land searches, asset registry, physical inspections.',
      perms: ['Asset Registry', 'Registry Search Verification', 'Valuation Reports', 'Caveat Lodging'],
    },
    {
      role: 'recovery_officer',
      title: 'Recovery & Auction Realization Officer',
      desc: 'Arrears enforcement, impound yard management, and auction liquidation.',
      perms: ['Demand Notices', 'Repossession Orders', 'Impound Tracking', 'Auction Realization'],
    },
    {
      role: 'cashier',
      title: 'Cashier / Accounts Officer',
      desc: 'Posts collections, M-Pesa reconciliations, and prints formal receipts.',
      perms: ['Post Repayments', 'Issue Receipts', 'Cash Reconciliations', 'View Schedules'],
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              System Administration & Governance
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
              Version 2.6.4 (Standalone)
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Standalone lending institution configuration, role-based access matrix, and regulatory audit trail.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold flex-wrap">
          <button
            onClick={() => setActiveTab('company')}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeTab === 'company'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Platform & Branding
          </button>
          <button
            onClick={() => setActiveTab('data')}
            className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
              activeTab === 'data'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Database className="w-3.5 h-3.5 text-rose-500" />
            <span>Data & Portfolio Reset</span>
          </button>
          <button
            onClick={() => setActiveTab('rbac')}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeTab === 'rbac'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            RBAC Permissions
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeTab === 'audit'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Audit Logs ({auditLogs.length})
          </button>
        </div>
      </div>

      {/* TAB 1: PLATFORM IDENTITY & COMPANY SETTINGS */}
      {activeTab === 'company' && (
        <div className="space-y-6 max-w-4xl">
          {/* Live Platform Branding Preview & Quick Action */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 text-white border border-slate-800 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-12 h-12 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold text-2xl shadow-lg shadow-emerald-950/60 shrink-0 overflow-hidden">
                {logoType === 'image' && logoUrl ? (
                  <img
                    src={logoUrl}
                    alt={platformName || 'DAVETECH'}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-contain p-1"
                  />
                ) : (
                  platformInitials || (platformName ? platformName.charAt(0) : 'D')
                )}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold tracking-tight text-xl text-white">
                    {platformName || 'DAVETECH'}
                  </span>
                  <span className="text-emerald-400 font-bold text-xs uppercase px-2 py-0.5 rounded-sm bg-emerald-950 border border-emerald-700/60">
                    {platformTitle || 'ERP'}
                  </span>
                </div>
                <p className="text-xs text-slate-300 font-medium tracking-wide mt-0.5">
                  {platformSubtitle || 'Property, Asset & Secured Lending'}
                </p>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                  Institution: {companyName} • {brandTagline}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setIsEditPlatformModalOpen(true)}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-sm transition flex items-center gap-2"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Quick Preset Modal</span>
              </button>
              <button
                type="button"
                onClick={handleResetToDavetech}
                title="Reset to default Davetech branding"
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium border border-slate-700 transition flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs p-6">
            <form onSubmit={handleSaveCompany} className="space-y-6 text-xs">
              {savedSuccess && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-emerald-800 dark:text-emerald-300 rounded-xl flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Platform title, corporate logo, and configurations saved permanently to database!</span>
                </div>
              )}

              {/* SECTION 1: LOGO & BRAND VISUAL ASSET */}
              <div>
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-2 mb-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <ImageIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span>Company Logo & Brand Visual System</span>
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Configure your company logo. Persisted directly to Firestore database and rendered across sidebar, top bar, and reports.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {/* Left: Type Selector & Upload Controls */}
                  <div className="md:col-span-2 space-y-4">
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        Logo Style System
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setLogoType('monogram')}
                          className={`p-2.5 rounded-xl border text-left transition flex items-center gap-2.5 ${
                            logoType === 'monogram'
                              ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200'
                              : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                          }`}
                        >
                          <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                            {platformInitials || 'D'}
                          </div>
                          <div>
                            <p className="font-bold text-xs">Signature Monogram</p>
                            <p className="text-[10px] text-slate-500">DAVETECH Emerald Badge</p>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => setLogoType('image')}
                          className={`p-2.5 rounded-xl border text-left transition flex items-center gap-2.5 ${
                            logoType === 'image'
                              ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200'
                              : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                          }`}
                        >
                          <div className="w-7 h-7 rounded-lg bg-slate-800 text-white font-bold text-xs flex items-center justify-center shrink-0">
                            <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />
                          </div>
                          <div>
                            <p className="font-bold text-xs">Custom Image Logo</p>
                            <p className="text-[10px] text-slate-500">PNG / SVG / JPEG Upload</p>
                          </div>
                        </button>
                      </div>
                    </div>

                    {logoType === 'image' && (
                      <div className="space-y-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-750 border border-slate-200 dark:border-slate-700">
                        <div>
                          <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            Upload Logo Image (PNG, JPG, SVG)
                          </label>
                          <div className="flex items-center gap-2">
                            <label className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold cursor-pointer transition flex items-center gap-1.5 shrink-0">
                              <Upload className="w-3.5 h-3.5" />
                              <span>Select File</span>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={handleLogoFileUpload}
                                className="hidden"
                              />
                            </label>
                            {logoUrl && (
                              <button
                                type="button"
                                onClick={() => setLogoUrl('')}
                                className="px-2.5 py-2 rounded-lg bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400 border border-rose-200 dark:border-rose-800 hover:bg-rose-100 transition flex items-center gap-1"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Remove</span>
                              </button>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-400 mt-1">Recommended size: 256x256px or transparent vector PNG. Max 2MB.</p>
                        </div>

                        <div>
                          <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            Or External Image / CDN URL
                          </label>
                          <input
                            type="url"
                            value={logoUrl}
                            onChange={(e) => setLogoUrl(e.target.value)}
                            placeholder="https://example.com/logo.png"
                            className="w-full p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-mono text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right: Live Frame Preview */}
                  <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-white flex flex-col justify-between">
                    <div>
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                        Sidebar Preview
                      </p>
                      <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold text-lg shadow-md shrink-0 overflow-hidden">
                          {logoType === 'image' && logoUrl ? (
                            <img
                              src={logoUrl}
                              alt="Logo"
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-contain p-0.5"
                            />
                          ) : (
                            platformInitials || 'D'
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-extrabold text-sm text-white truncate">{platformName || 'DAVETECH'}</p>
                          <p className="text-[10px] text-slate-400 truncate">{platformSubtitle || 'Lending ERP'}</p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-800 text-[10px] text-emerald-400 font-mono">
                      ✓ Database-backed sync active
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 2: PLATFORM TITLE & BRANDING */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-700">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-2 mb-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <Pencil className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span>Platform Name & Title Customization</span>
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Customize how the software titles itself across the top bar, sidebar, window tab, and client documents.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Platform Name / Primary Brand
                    </label>
                    <input
                      type="text"
                      required
                      value={platformName}
                      onChange={(e) => setPlatformName(e.target.value)}
                      placeholder="e.g. DAVETECH, APEX, FINSEC"
                      className="w-full p-2.5 rounded-lg bg-slate-50 dark:bg-slate-750 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">Shown prominently in sidebar & navigation.</p>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Platform Title / Edition Tag
                    </label>
                    <input
                      type="text"
                      required
                      value={platformTitle}
                      onChange={(e) => setPlatformTitle(e.target.value)}
                      placeholder="e.g. ERP, CORE, LENDING SUITE"
                      className="w-full p-2.5 rounded-lg bg-slate-50 dark:bg-slate-750 border border-slate-200 dark:border-slate-700 font-bold text-emerald-600 dark:text-emerald-400 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">Edition badge displayed next to brand name.</p>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Logo Monogram / Initials (1-3 chars)
                    </label>
                    <input
                      type="text"
                      maxLength={3}
                      value={platformInitials}
                      onChange={(e) => setPlatformInitials(e.target.value.toUpperCase())}
                      placeholder="e.g. D, DT, A"
                      className="w-full p-2.5 rounded-lg bg-slate-50 dark:bg-slate-750 border border-slate-200 dark:border-slate-700 font-mono font-bold text-center text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">Single or double letter avatar emblem.</p>
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Platform Subtitle / Operating Scope
                  </label>
                  <input
                    type="text"
                    value={platformSubtitle}
                    onChange={(e) => setPlatformSubtitle(e.target.value)}
                    placeholder="e.g. Property, Asset, Collateral & Secured Lending ERP"
                    className="w-full p-2.5 rounded-lg bg-slate-50 dark:bg-slate-750 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Displayed below the title in the sidebar and document headers.</p>
                </div>
              </div>

              {/* SECTION 2: REGISTERED CORPORATE PROFILE */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-700">
                <div className="border-b border-slate-100 dark:border-slate-700 pb-2 mb-3">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Building className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>Registered Corporate Institution</span>
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Legal company details used in formal contracts, chattel mortgage charges, and loan agreements.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Registered Legal Company Name
                    </label>
                    <input
                      type="text"
                      required
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Brand Tagline / Mission Motto
                    </label>
                    <input
                      type="text"
                      value={brandTagline}
                      onChange={(e) => setBrandTagline(e.target.value)}
                      placeholder="e.g. Technology • Innovation • Efficiency"
                      className="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Corporate KRA PIN
                    </label>
                    <input
                      type="text"
                      required
                      value={kraPin}
                      onChange={(e) => setKraPin(e.target.value)}
                      className="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Company Registration Number
                    </label>
                    <input
                      type="text"
                      value={regNo}
                      onChange={(e) => setRegNo(e.target.value)}
                      className="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Head Office Telephone
                    </label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Official Email Address
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Corporate Website
                    </label>
                    <input
                      type="text"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      className="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Headquarters Physical Address
                    </label>
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 3: CREDIT RISK & REGULATORY POLICIES */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-700">
                <div className="border-b border-slate-100 dark:border-slate-700 pb-2 mb-3">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>Lending Risk & Arrears Policies</span>
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    System-wide default margins and statutory thresholds applied during assessment.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Default Arrears Late Penalty Rate (% / Month)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      value={defaultPenaltyRate}
                      onChange={(e) => setDefaultPenaltyRate(Number(e.target.value))}
                      className="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Standard Maximum Loan-To-Value (LTV Cap %)
                    </label>
                    <input
                      type="number"
                      value={defaultLtvCap}
                      onChange={(e) => setDefaultLtvCap(Number(e.target.value))}
                      className="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={handleResetToDavetech}
                  className="px-3.5 py-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-xs font-medium flex items-center gap-1.5 transition"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restore Davetech Defaults</span>
                </button>

                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-700/20 transition flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Platform & Branding Settings</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TAB: DATA MANAGEMENT & CLEAR / RESET */}
      {activeTab === 'data' && (
        <div className="space-y-6 max-w-4xl">
          {/* Section: Live Database & Portfolio Status */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center border border-rose-200/50 dark:border-rose-800/50">
                  <Database className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    Database State & Portfolio Metrics
                  </h3>
                  <p className="text-xs text-slate-500">
                    Active records in local resilient storage and Firestore cloud database.
                  </p>
                </div>
              </div>

              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live Sync Connected
              </span>
            </div>

            {/* Metrics cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                <span className="text-[10px] text-slate-400 block">Total Portfolio</span>
                <span className="text-base font-bold font-mono text-slate-900 dark:text-slate-100">
                  {LoanEngine.formatKES(DataService.getLoans().reduce((s, l) => s + (l.principal || 0), 0))}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  {DataService.getLoans().length} Facilities Issued
                </span>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                <span className="text-[10px] text-slate-400 block">Outstanding Principal</span>
                <span className="text-base font-bold font-mono text-emerald-600 dark:text-emerald-400">
                  {LoanEngine.formatKES(DataService.getLoans().reduce((s, l) => s + (l.outstandingPrincipal || 0), 0))}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  {DataService.getRepayments().length} Repayments Recorded
                </span>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                <span className="text-[10px] text-slate-400 block">Collateral Value</span>
                <span className="text-base font-bold font-mono text-slate-900 dark:text-slate-100">
                  {LoanEngine.formatKES(DataService.getCollaterals().reduce((s, c) => s + (c.marketValue || 0), 0))}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  {DataService.getCollaterals().length} Collateral Items
                </span>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                <span className="text-[10px] text-slate-400 block">Borrower Database</span>
                <span className="text-base font-bold font-mono text-slate-900 dark:text-slate-100">
                  {DataService.getCustomers().length} Customers
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  {DataService.getProperties().length} Properties Listed
                </span>
              </div>
            </div>

            {/* Direct Clear Button Button */}
            <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-rose-50 dark:bg-rose-950/20 p-4 rounded-xl border border-rose-200 dark:border-rose-900/40">
              <div>
                <h4 className="text-xs font-bold text-rose-900 dark:text-rose-200">
                  Interactive Clear & Reset Modal
                </h4>
                <p className="text-[11px] text-rose-700 dark:text-rose-300/80 mt-0.5">
                  Clear demo figures to KSh 0.00, wipe all database tables, or reload demo facilities anytime.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsClearModalOpen(true)}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm shrink-0 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Open Clear Data Modal</span>
              </button>
            </div>
          </div>

          {/* Section: Action Cards for Quick Direct Operations */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Card 1: Clear Loan Portfolio */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="w-8 h-8 rounded-lg bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                  <Coins className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Clear Loan Portfolio (KSh 0.00)
                </h4>
                <p className="text-xs text-slate-500">
                  Wipes all loan facilities, collateral pledges, valuations, and collections. Portfolio balances reset to KSh 0.00.
                </p>
              </div>
              <button
                type="button"
                onClick={async () => {
                  if (window.confirm('Reset loan portfolio to KSh 0.00? This clears all demo loans and collateral.')) {
                    await DataService.clearPortfolioData(currentUser);
                  }
                }}
                className="w-full py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Reset to KSh 0.00</span>
              </button>
            </div>

            {/* Card 2: Complete Wipe */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center justify-center">
                  <Database className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Wipe Entire Database
                </h4>
                <p className="text-xs text-slate-500">
                  Wipes loans, collateral, customers, asset registries, properties, and applications. Clean slate for production.
                </p>
              </div>
              <button
                type="button"
                onClick={async () => {
                  if (window.confirm('Wipe the ENTIRE database clean? All records will be cleared for a complete fresh start.')) {
                    await DataService.clearAllSystemData(currentUser);
                  }
                }}
                className="w-full py-2 bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                <span>Wipe Everything</span>
              </button>
            </div>

            {/* Card 3: Restore Demo Data */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <RotateCcw className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Restore Demo Portfolio
                </h4>
                <p className="text-xs text-slate-500">
                  Reloads the sample 4 loan facilities (KSh 18.6M), sample motor vehicles, and title deeds for demonstration.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  DataService.restoreSeedData(currentUser);
                }}
                className="w-full py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reload Demo (18.6M)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: RBAC PERMISSIONS MATRIX */}
      {activeTab === 'rbac' && (
        <div className="space-y-4">
          {/* Single-Operator Master Governance Status */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-800/60 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-lg bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 shrink-0">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-100">
                    Operating Mode: {isSingleOperatorMode ? 'Single Person / Sole Operator' : 'Enterprise Multi-Role (RBAC)'}
                  </h3>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    isSingleOperatorMode ? 'bg-emerald-900/80 text-emerald-300 border border-emerald-700/60' : 'bg-slate-700 text-slate-300'
                  }`}>
                    {isSingleOperatorMode ? 'ENABLED' : 'STANDARD'}
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1 max-w-2xl">
                  {isSingleOperatorMode
                    ? 'All system functions (loan origination, collateral valuation overrides, credit sanctioning, disbursements, manual journal vouchers, and audit reporting) are unified under a single operator without multi-person sign-off bottlenecks.'
                    : 'System enforces multi-eye verification and strict segregation of duties between loan origination, credit assessment, sanction committee, and cashiers.'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={toggleSingleOperatorMode}
              className={`px-3 py-2 rounded-lg text-xs font-semibold shrink-0 transition flex items-center gap-2 ${
                isSingleOperatorMode
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
              }`}
            >
              <span>{isSingleOperatorMode ? 'Switch to Multi-Role' : 'Enable Single Operator'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {rolesList.map((r) => (
              <div
                key={r.role}
                className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs space-y-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-emerald-600" />
                    <h3 className="font-bold text-xs text-slate-900 dark:text-slate-100 uppercase">
                      {r.title}
                    </h3>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">{r.desc}</p>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {r.perms.map((p, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-mono text-[10px]"
                    >
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: AUDIT TRAIL */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search user, action, module..."
              value={searchAudit}
              onChange={(e) => setSearchAudit(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-lg text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none"
            />
          </div>

          <div className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="p-3.5 font-semibold">Timestamp</th>
                  <th className="p-3.5 font-semibold">User Officer</th>
                  <th className="p-3.5 font-semibold">Action</th>
                  <th className="p-3.5 font-semibold">Module</th>
                  <th className="p-3.5 font-semibold">Details</th>
                  <th className="p-3.5 font-semibold">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                {filteredAudit.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50">
                    <td className="p-3.5 text-slate-500 text-[11px]">{String(log.timestamp || '').replace('T', ' ').slice(0, 19)}</td>
                    <td className="p-3.5 font-sans font-semibold text-slate-800 dark:text-slate-200">{log.userName}</td>
                    <td className="p-3.5 text-emerald-600 dark:text-emerald-400 font-bold">{log.action}</td>
                    <td className="p-3.5 uppercase text-[10px] text-slate-500">{log.module || (log as any).entityType || 'SYSTEM'}</td>
                    <td className="p-3.5 font-sans text-slate-600 dark:text-slate-300 text-xs max-w-md truncate">{log.details}</td>
                    <td className="p-3.5 text-slate-400 text-[10px]">{log.ipAddress}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Clear Portfolio & System Reset Modal */}
      <ClearDataModal
        isOpen={isClearModalOpen}
        onClose={() => setIsClearModalOpen(false)}
      />
    </div>
  );
};
