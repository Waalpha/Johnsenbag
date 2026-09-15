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

const MainLayout: React.FC = () => {
  const { currentUser, isDarkMode, isEditPlatformModalOpen, setIsEditPlatformModalOpen, isLoggedIn } = useAuth();
  const [activeView, setActiveView] = useState<ActiveView>('dashboard');
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  if (!isLoggedIn) {
    return <LoginScreen />;
  }

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

  const handleQuickAction = (
    action: 'customer' | 'asset' | 'collateral' | 'application' | 'repayment' | 'property'
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
