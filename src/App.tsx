/**
 * DAVETECH ERP - Property, Asset, Collateral & Secured Lending ERP
 * Main Application Shell & Layout Container
 * Davetech Solutions Limited
 */

import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Sidebar, ActiveView } from './components/layout/Sidebar';
import { TopNavbar } from './components/layout/TopNavbar';
import { GlobalSearchModal } from './components/common/GlobalSearchModal';
import { EditPlatformTitleModal } from './components/common/EditPlatformTitleModal';
import { LoginScreen } from './components/auth/LoginScreen';

// Views
import { DashboardView } from './views/DashboardView';
import { CustomersView } from './views/CustomersView';
import { AssetsView } from './views/AssetsView';
import { CollateralView } from './views/CollateralView';
import { LoanProductsView } from './views/LoanProductsView';
import { ApplicationsView } from './views/ApplicationsView';
import { ApprovalsView } from './views/ApprovalsView';
import { LoansView } from './views/LoansView';
import { RepaymentsView } from './views/RepaymentsView';
import { ArrearsRecoveryView } from './views/ArrearsRecoveryView';
import { AccountingView } from './views/AccountingView';
import { ReportsView } from './views/ReportsView';
import { SettingsView } from './views/SettingsView';
import { CustomerPortalView } from './views/CustomerPortalView';
import { RealEstateView } from './views/RealEstateView';
import { ItemLoansView } from './views/ItemLoansView';
import { PublicLoanApplicationView } from './views/PublicLoanApplicationView';
import { PublicAgreementView } from './views/PublicAgreementView';

const MainLayout: React.FC = () => {
  const { currentUser, isDarkMode, isEditPlatformModalOpen, setIsEditPlatformModalOpen, isLoggedIn } = useAuth();
  const [activeView, setActiveView] = useState<ActiveView>('dashboard');
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Check if unauthenticated user or direct WhatsApp URL is accessing public loan application form
  const [isApplyingOnline, setIsApplyingOnline] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash;
      const search = window.location.search;
      return hash.startsWith('#apply') || search.includes('apply=true');
    }
    return false;
  });

  // Check if unauthenticated user or direct WhatsApp link is accessing public agreement letter
  const [isViewingAgreementOnline, setIsViewingAgreementOnline] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash;
      const search = window.location.search;
      return (
        hash.startsWith('#item-agreement-') ||
        hash.startsWith('#agreement') ||
        search.includes('agreement=')
      );
    }
    return false;
  });

  useEffect(() => {
    const handleHashAndUrl = () => {
      const hash = window.location.hash;
      const search = window.location.search;

      if (hash.startsWith('#apply') || search.includes('apply=true')) {
        setIsApplyingOnline(true);
      } else {
        setIsApplyingOnline(false);
      }

      if (
        hash.startsWith('#item-agreement-') ||
        hash.startsWith('#agreement') ||
        search.includes('agreement=')
      ) {
        setIsViewingAgreementOnline(true);
      } else {
        setIsViewingAgreementOnline(false);
      }
    };
    handleHashAndUrl();
    window.addEventListener('hashchange', handleHashAndUrl);
    window.addEventListener('popstate', handleHashAndUrl);
    return () => {
      window.removeEventListener('hashchange', handleHashAndUrl);
      window.removeEventListener('popstate', handleHashAndUrl);
    };
  }, []);

  // Global Keyboard Shortcut: Ctrl+K / Cmd+K for Global Search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Detect URL hash navigation (e.g. #item_loans)
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash;
      if (hash === '#item_loans') {
        setActiveView('item_loans');
      }
    };
    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  // If accessing online agreement letter link via WhatsApp (#item-agreement-... or #agreement), render directly
  if (isViewingAgreementOnline) {
    return (
      <PublicAgreementView
        onBackToPortal={() => {
          window.location.hash = '';
          setIsViewingAgreementOnline(false);
        }}
      />
    );
  }

  // If accessing online application link via WhatsApp (#apply), render directly without requiring staff login
  if (isApplyingOnline) {
    return (
      <PublicLoanApplicationView
        onBackToPortal={() => {
          window.location.hash = '';
          setIsApplyingOnline(false);
        }}
      />
    );
  }

  if (!isLoggedIn) {
    return <LoginScreen />;
  }

  const handleQuickAction = (
    action: 'customer' | 'asset' | 'collateral' | 'application' | 'repayment' | 'property' | 'item_loan'
  ) => {
    switch (action) {
      case 'customer':
        setActiveView('customers');
        break;
      case 'asset':
        setActiveView('assets');
        break;
      case 'collateral':
        setActiveView('collateral');
        break;
      case 'application':
        setActiveView('applications');
        break;
      case 'repayment':
        setActiveView('repayments');
        break;
      case 'property':
        setActiveView('property_management');
        break;
      case 'item_loan':
        setActiveView('item_loans');
        break;
      default:
        break;
    }
  };

  const handleSelectSearchResult = (type: string, item: any) => {
    switch (type) {
      case 'customer':
        setActiveView('customers');
        break;
      case 'loan':
        setActiveView('loans');
        break;
      case 'asset':
        setActiveView('assets');
        break;
      case 'collateral':
        setActiveView('collateral');
        break;
      case 'property':
        setActiveView('property_management');
        break;
      default:
        break;
    }
  };

  return (
    <div className={`min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-150`}>
      {/* Top Navbar */}
      <TopNavbar
        onOpenMobileMenu={() => setIsMobileOpen(true)}
        onOpenSearch={() => setIsSearchOpen(true)}
        setActiveView={setActiveView}
        onQuickAction={handleQuickAction}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Navigation Sidebar */}
        <Sidebar
          activeView={activeView}
          setActiveView={(view) => {
            setActiveView(view);
            setIsMobileOpen(false);
          }}
          isMobileOpen={isMobileOpen}
          setIsMobileOpen={setIsMobileOpen}
        />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {activeView === 'dashboard' && (
              <DashboardView
                onNavigate={setActiveView}
                onQuickAction={handleQuickAction}
              />
            )}

            {activeView === 'collateral_dashboard' && <CollateralView />}

            {activeView === 'customers' && <CustomersView />}

            {activeView === 'assets' && <AssetsView />}

            {activeView === 'collateral' && <CollateralView />}

            {activeView === 'valuations' && <AssetsView />}

            {activeView === 'property_management' && <RealEstateView initialTab="all" />}

            {activeView === 'land_plots' && <RealEstateView initialTab="sale" />}

            {activeView === 'house_rentals' && <RealEstateView initialTab="rent" />}

            {activeView === 'property_maintenance' && <RealEstateView initialTab="maintenance" />}

            {activeView === 'real_estate' && <RealEstateView initialTab="all" />}

            {activeView === 'item_loans' && <ItemLoansView />}

            {activeView === 'loan_products' && <LoanProductsView />}

            {activeView === 'applications' && <ApplicationsView />}

            {activeView === 'credit_assessment' && <ApplicationsView />}

            {activeView === 'approvals' && <ApprovalsView />}

            {activeView === 'loans' && <LoansView />}

            {activeView === 'repayments' && <RepaymentsView />}

            {activeView === 'arrears' && <ArrearsRecoveryView />}

            {activeView === 'recovery' && <ArrearsRecoveryView />}

            {activeView === 'auctions' && <ArrearsRecoveryView />}

            {activeView === 'accounting' && <AccountingView />}

            {activeView === 'reports' && <ReportsView />}

            {activeView === 'documents' && <ReportsView />}

            {activeView === 'audit_logs' && <SettingsView />}

            {activeView === 'users' && <SettingsView />}

            {activeView === 'settings' && <SettingsView />}

            {activeView === 'customer_portal' && <CustomerPortalView />}

            {activeView === 'public_loan_form' && (
              <PublicLoanApplicationView
                onBackToPortal={() => setActiveView('applications')}
              />
            )}

            {activeView === 'public_agreement' && (
              <PublicAgreementView
                onBackToPortal={() => setActiveView('item_loans')}
              />
            )}
          </div>
        </main>
      </div>

      {/* Global Search Dialog */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectItem={handleSelectSearchResult}
      />

      {/* Edit Platform Title & Branding Dialog */}
      <EditPlatformTitleModal
        isOpen={isEditPlatformModalOpen}
        onClose={() => setIsEditPlatformModalOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainLayout />
    </AuthProvider>
  );
}
