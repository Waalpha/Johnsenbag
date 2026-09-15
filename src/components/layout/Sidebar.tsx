/**
 * DAVETECH ERP - Navigation Sidebar
 * Property, Asset, Collateral & Secured Lending ERP
 * Davetech Solutions
 */

import React, { useState } from 'react';
import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  Building2,
  Car,
  FileSpreadsheet,
  Coins,
  AlertTriangle,
  BadgeAlert,
  Landmark,
  FileText,
  History,
  UserCog,
  Settings,
  ChevronDown,
  ChevronRight,
  Calculator,
  Gavel,
  Briefcase,
  UserCheck,
  ExternalLink,
  ShieldAlert,
  Wallet,
  Pencil,
  MapPin,
  Home,
  Wrench,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export type ActiveView =
  | 'dashboard'
  | 'collateral_dashboard'
  | 'customers'
  | 'assets'
  | 'collateral'
  | 'valuations'
  | 'property_management'
  | 'land_plots'
  | 'house_rentals'
  | 'property_maintenance'
  | 'real_estate'
  | 'loan_products'
  | 'applications'
  | 'credit_assessment'
  | 'approvals'
  | 'loans'
  | 'repayments'
  | 'arrears'
  | 'recovery'
  | 'auctions'
  | 'accounting'
  | 'reports'
  | 'documents'
  | 'audit_logs'
  | 'users'
  | 'branches'
  | 'settings'
  | 'customer_portal';

interface SidebarProps {
  activeView: ActiveView;
  setActiveView: (view: ActiveView) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
}

interface NavGroup {
  label: string;
  items: {
    id: ActiveView;
    label: string;
    icon: React.ElementType;
    badge?: string;
    badgeColor?: string;
  }[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  setActiveView,
  isMobileOpen,
  setIsMobileOpen,
}) => {
  const { currentUser, isSingleOperatorMode, systemSettings, setIsEditPlatformModalOpen } = useAuth();
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  const toggleGroup = (label: string) => {
    setCollapsedGroups((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const navGroups: NavGroup[] = [
    {
      label: 'Core Dashboards',
      items: [
        { id: 'dashboard', label: 'Executive Dashboard', icon: LayoutDashboard },
        { id: 'collateral_dashboard', label: 'Collateral Dashboard', icon: ShieldCheck, badge: 'New', badgeColor: 'bg-emerald-500 text-white' },
      ],
    },
    {
      label: 'Borrowers & Collateral Assets',
      items: [
        { id: 'customers', label: 'Customer 360', icon: Users },
        { id: 'assets', label: 'Asset Management', icon: Car },
        { id: 'collateral', label: 'Collateral Register', icon: ShieldCheck },
        { id: 'valuations', label: 'Asset Valuations', icon: Calculator },
      ],
    },
    {
      label: 'Property & Real Estate',
      items: [
        { id: 'property_management', label: 'Property Management', icon: Building2, badge: '5 Total', badgeColor: 'bg-emerald-600 text-white' },
        { id: 'land_plots', label: 'Land & Plots for Sale', icon: MapPin },
        { id: 'house_rentals', label: 'House Rentals', icon: Home },
        { id: 'property_maintenance', label: 'Property Maintenance', icon: Wrench },
      ],
    },
    {
      label: 'Secured Lending Operations',
      items: [
        { id: 'loan_products', label: 'Loan Products', icon: Briefcase },
        { id: 'applications', label: 'Loan Applications', icon: FileSpreadsheet },
        { id: 'credit_assessment', label: 'Credit Assessment', icon: UserCheck },
        { id: 'approvals', label: 'Approval Workflow', icon: ShieldAlert, badge: '1 Pending', badgeColor: 'bg-amber-500 text-white' },
        { id: 'loans', label: 'Active Loans Portfolio', icon: Coins },
        { id: 'repayments', label: 'Collections & Repayments', icon: Wallet },
        { id: 'arrears', label: 'Arrears & Aging Buckets', icon: AlertTriangle, badge: '68d', badgeColor: 'bg-rose-500 text-white' },
      ],
    },
    {
      label: 'Recovery & Realization',
      items: [
        { id: 'recovery', label: 'Recovery & Repossession', icon: BadgeAlert },
        { id: 'auctions', label: 'Auctions & Disposals', icon: Gavel },
      ],
    },
    {
      label: 'Financial Governance',
      items: [
        { id: 'accounting', label: 'Accounting & Cash Accounts', icon: Landmark },
        { id: 'reports', label: 'Reports & Analytics', icon: FileText },
        { id: 'documents', label: 'Document Generator', icon: FileSpreadsheet },
        { id: 'audit_logs', label: 'Immutable Audit Logs', icon: History },
      ],
    },
    {
      label: 'System Administration',
      items: [
        { id: 'users', label: 'Users & Roles', icon: UserCog },
        { id: 'settings', label: 'System Settings', icon: Settings },
      ],
    },
    {
      label: 'Self-Service Portal',
      items: [
        { id: 'customer_portal', label: 'Customer Portal View', icon: ExternalLink, badge: 'Client', badgeColor: 'bg-teal-600 text-white' },
      ],
    },
  ];

  // Auto-expand group containing the active view so it is never hidden
  React.useEffect(() => {
    const parentGroup = navGroups.find((g) => g.items.some((i) => i.id === activeView));
    if (parentGroup && collapsedGroups[parentGroup.label]) {
      setCollapsedGroups((prev) => ({ ...prev, [parentGroup.label]: false }));
    }
  }, [activeView]);

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        id="davetech-sidebar"
        className={`fixed top-0 left-0 z-50 h-screen w-72 flex-col bg-slate-900 text-slate-100 border-r border-slate-800 transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 flex ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-emerald-900/40 shrink-0 overflow-hidden">
              {systemSettings?.logoUrl && systemSettings?.logoType === 'image' ? (
                <img
                  src={systemSettings.logoUrl}
                  alt={systemSettings.platformName || 'DAVETECH'}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-contain p-1"
                />
              ) : (
                systemSettings?.platformInitials || (systemSettings?.platformName ? systemSettings.platformName.charAt(0) : 'D')
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-extrabold tracking-tight text-base sm:text-lg text-white leading-tight">
                  {systemSettings?.platformName || 'DAVETECH'}
                </span>
                {systemSettings?.platformTitle ? (
                  <span className="text-emerald-400 font-bold text-[10px] uppercase px-1.5 py-0.5 rounded-sm bg-emerald-950/90 border border-emerald-700/60 shrink-0">
                    {systemSettings.platformTitle}
                  </span>
                ) : null}
              </div>
              <p className="text-[11px] text-slate-400 font-medium tracking-wide truncate mt-0.5">
                {systemSettings?.platformSubtitle || 'Property & Secured Lending'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => setIsEditPlatformModalOpen(true)}
              title="Edit Platform Name & Branding"
              className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-slate-800/80 transition"
              aria-label="Edit Platform Name and Branding"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setIsMobileOpen(false)}
              className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
            >
              ✕
            </button>
          </div>
        </div>

        {/* User Quick Info */}
        <div className="px-4 py-3 bg-slate-950/50 border-b border-slate-800/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-emerald-700/60 border border-emerald-500/30 flex items-center justify-center text-xs font-semibold text-emerald-200 shrink-0">
              {currentUser?.fullName ? currentUser.fullName.charAt(0) : 'D'}
            </div>
            <div className="truncate">
              <div className="flex items-center gap-1.5">
                <p className="text-xs font-semibold text-slate-200 truncate">{currentUser?.fullName || 'David K. Munene'}</p>
                {isSingleOperatorMode && (
                  <span className="text-[9px] bg-emerald-950 text-emerald-300 border border-emerald-700/60 px-1 rounded-xs font-mono font-bold">
                    SOLO
                  </span>
                )}
              </div>
              <p className="text-[10px] text-emerald-400 uppercase tracking-wider font-mono">
                {isSingleOperatorMode ? 'Sole Operator & MD' : String(currentUser?.role || 'authorized_user').replace(/_/g, ' ')}
              </p>
            </div>
          </div>
          <span className="w-2 h-2 rounded-full bg-emerald-500 ring-4 ring-emerald-500/20" title="System Online" />
        </div>

        {/* Scrollable Navigation Groups */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5 scrollbar-thin scrollbar-thumb-slate-800">
          {navGroups.map((group) => {
            const isCollapsed = collapsedGroups[group.label];
            return (
              <div key={group.label} className="space-y-1">
                <button
                  onClick={() => toggleGroup(group.label)}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 text-[11px] font-bold text-slate-400 tracking-wider uppercase hover:text-slate-200 hover:bg-slate-800/40 rounded-md transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>{group.label}</span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-mono">
                      {group.items.length}
                    </span>
                  </div>
                  {isCollapsed ? (
                    <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  )}
                </button>

                {!isCollapsed && (
                  <div className="space-y-1 mt-1">
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      const isActive = activeView === item.id || (item.id === 'property_management' && activeView === 'real_estate');
                      return (
                        <button
                          key={item.id}
                          id={`nav-${item.id}`}
                          onClick={() => {
                            setActiveView(item.id);
                            setIsMobileOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all group ${
                            isActive
                              ? 'bg-emerald-600 text-white font-semibold shadow-md shadow-emerald-950/50 ring-1 ring-emerald-400/50'
                              : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span
                              className={`w-1 h-3.5 rounded-full transition-all shrink-0 ${
                                isActive ? 'bg-white' : 'bg-transparent'
                              }`}
                            />
                            <Icon
                              className={`w-4 h-4 shrink-0 ${
                                isActive ? 'text-white' : 'text-slate-400 group-hover:text-emerald-400'
                              }`}
                            />
                            <span className="truncate">{item.label}</span>
                          </div>
                          {item.badge && (
                            <span
                              className={`px-1.5 py-0.5 text-[10px] font-bold rounded-sm shrink-0 ${
                                item.badgeColor || 'bg-slate-700 text-slate-200'
                              }`}
                            >
                              {item.badge}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer Brand Slogan */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 text-center">
          <p className="text-[10px] text-slate-400 font-medium tracking-wide truncate">
            {systemSettings?.companyName || 'Davetech Solutions'}
          </p>
          <p className="text-[9px] text-emerald-500/80 font-mono mt-0.5 truncate">
            {systemSettings?.brandTagline || 'Technology • Innovation • Efficiency'}
          </p>
        </div>
      </aside>
    </>
  );
};
