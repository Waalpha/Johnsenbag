/**
 * DAVETECH ERP - Authentication & Role-Based Access Control Context
 * Provides active user, role switching, branch isolation, and permission checks.
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole, Branch, SystemSettings } from '../types/erp';
import { DataService } from '../services/dataService';

export interface AuthContextType {
  currentUser: UserProfile;
  activeBranchId: string;
  isDarkMode: boolean;
  isSingleOperatorMode: boolean;
  isLoggedIn: boolean;
  systemSettings: SystemSettings;
  branches: Branch[];
  allUsers: UserProfile[];
  isEditPlatformModalOpen: boolean;
  setIsEditPlatformModalOpen: (open: boolean) => void;
  updateSystemSettings: (updates: Partial<SystemSettings>) => void;
  setActiveBranchId: (branchId: string) => void;
  toggleDarkMode: () => void;
  toggleSingleOperatorMode: () => void;
  setSingleOperatorMode: (enabled: boolean) => void;
  switchUser: (userId: string) => void;
  switchRole: (role: UserRole) => void;
  loginAsUser: (userId: string, password?: string) => boolean;
  registerNewUser: (userData: Partial<UserProfile>) => UserProfile;
  hasPermission: (permission: string) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Role to permissions mapping matrix
const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  super_admin: ['*'],
  administrator: [
    'customers.*',
    'assets.*',
    'collateral.*',
    'loans.*',
    'repayments.*',
    'reports.*',
    'settings.*',
    'users.*',
    'branches.*',
    'audit.view',
  ],
  branch_manager: [
    'customers.view',
    'customers.create',
    'customers.edit',
    'assets.view',
    'assets.create',
    'assets.edit',
    'collateral.view',
    'collateral.create',
    'collateral.verify',
    'loans.view',
    'loans.create',
    'loans.approve',
    'loans.disburse',
    'repayments.view',
    'repayments.post',
    'reports.view',
  ],
  loan_officer: [
    'customers.view',
    'customers.create',
    'customers.edit',
    'assets.view',
    'assets.create',
    'collateral.view',
    'loans.view',
    'loans.create',
    'repayments.view',
  ],
  credit_officer: [
    'customers.view',
    'assets.view',
    'collateral.view',
    'loans.view',
    'loans.assess',
    'loans.recommend',
  ],
  valuation_officer: [
    'assets.view',
    'assets.edit',
    'assets.value',
    'collateral.view',
    'collateral.verify',
    'valuations.create',
    'valuations.edit',
  ],
  asset_officer: [
    'assets.view',
    'assets.create',
    'assets.edit',
    'assets.value',
    'collateral.view',
    'collateral.verify',
    'valuations.create',
    'valuations.edit',
  ],
  cashier: [
    'customers.view',
    'loans.view',
    'repayments.view',
    'repayments.post',
    'repayments.receipt',
    'cash.view',
  ],
  accountant: [
    'accounting.*',
    'cash.*',
    'loans.view',
    'repayments.view',
    'reports.view',
    'reports.export',
  ],
  recovery_officer: [
    'customers.view',
    'loans.view',
    'collateral.view',
    'recovery.*',
    'auctions.*',
  ],
  custody_officer: [
    'assets.view',
    'collateral.view',
    'collateral.custody',
    'collateral.release',
    'documents.view',
  ],
  auditor: [
    'customers.view',
    'assets.view',
    'collateral.view',
    'loans.view',
    'repayments.view',
    'accounting.view',
    'reports.view',
    'audit.view',
  ],
  customer: [
    'portal.view',
    'portal.apply',
    'portal.repay',
    'portal.documents',
  ],
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isSingleOperatorMode, setIsSingleOperatorMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('davetech_single_operator_mode');
    return saved !== 'false'; // Defaults to TRUE: Single Operator Mode
  });
  const [currentUser, setCurrentUser] = useState<UserProfile>(() => {
    const savedMode = localStorage.getItem('davetech_single_operator_mode') !== 'false';
    const all = DataService.getUsers();
    if (savedMode) {
      // In single operator mode, default to David K. Munene (super_admin)
      return all.find((u) => u.role === 'super_admin') || all[0];
    }
    const saved = localStorage.getItem('davetech_current_user_id');
    return all.find((u) => u.id === saved) || all[0];
  });
  const [activeBranchId, setActiveBranchIdState] = useState<string>(() => {
    return localStorage.getItem('davetech_active_branch') || 'all';
  });
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('davetech_theme') === 'dark';
  });
  const [systemSettings, setSystemSettings] = useState<SystemSettings>(() => {
    DataService.initializeSystem();
    return DataService.getSettings();
  });
  const [isEditPlatformModalOpen, setIsEditPlatformModalOpen] = useState<boolean>(false);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return localStorage.getItem('davetech_is_logged_in') !== 'false';
  });

  useEffect(() => {
    DataService.initializeSystem();
    const update = () => {
      setUsers(DataService.getUsers());
      setBranches(DataService.getBranches());
      const s = DataService.getSettings();
      setSystemSettings(s);
      const title = `${s.platformName || 'Davetech'} ${s.platformTitle || 'ERP'}`;
      document.title = `${title} - Secured Lending & Collateral Platform`;
    };
    update();
    return DataService.subscribe(update);
  }, []);

  const updateSystemSettings = (updates: Partial<SystemSettings>) => {
    const current = DataService.getSettings();
    const merged: SystemSettings = { ...current, ...updates };
    setSystemSettings(merged);
    DataService.saveSettings(merged, currentUser);
    const title = `${merged.platformName || 'Davetech'} ${merged.platformTitle || 'ERP'}`;
    document.title = `${title} - Secured Lending & Collateral Platform`;
  };

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('davetech_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('davetech_theme', 'light');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => !prev);
  };

  const toggleSingleOperatorMode = () => {
    setIsSingleOperatorMode((prev) => {
      const next = !prev;
      localStorage.setItem('davetech_single_operator_mode', String(next));
      if (next) {
        const all = DataService.getUsers();
        const primary = all.find((u) => u.role === 'super_admin') || all[0];
        if (primary) {
          setCurrentUser(primary);
          localStorage.setItem('davetech_current_user_id', primary.id);
        }
      }
      return next;
    });
  };

  const setSingleOperatorMode = (enabled: boolean) => {
    setIsSingleOperatorMode(enabled);
    localStorage.setItem('davetech_single_operator_mode', String(enabled));
    if (enabled) {
      const all = DataService.getUsers();
      const primary = all.find((u) => u.role === 'super_admin') || all[0];
      if (primary) {
        setCurrentUser(primary);
        localStorage.setItem('davetech_current_user_id', primary.id);
      }
    }
  };

  const setActiveBranchId = (branchId: string) => {
    setActiveBranchIdState(branchId);
    localStorage.setItem('davetech_active_branch', branchId);
  };

  const switchUser = (userId: string) => {
    const all = DataService.getUsers();
    const target = all.find((u) => u.id === userId);
    if (target) {
      setCurrentUser(target);
      localStorage.setItem('davetech_current_user_id', target.id);
      if (target.branchId !== 'all') {
        setActiveBranchId(target.branchId);
      }
    }
  };

  const switchRole = (role: UserRole) => {
    const all = DataService.getUsers();
    const userWithRole = all.find((u) => u.role === role);
    if (userWithRole) {
      switchUser(userWithRole.id);
    } else {
      // Temporarily change current user's role for exploration
      const updated = { ...currentUser, role };
      setCurrentUser(updated);
    }
  };

  const hasPermission = (permission: string): boolean => {
    // When in single operator mode or if current user is super_admin, grant full unrestricted authority!
    if (isSingleOperatorMode) return true;
    if (!currentUser) return false;
    if (currentUser.role === 'super_admin') return true;

    const permissions = ROLE_PERMISSIONS[currentUser.role] || [];
    if (permissions.includes('*')) return true;
    if (permissions.includes(permission)) return true;

    // Check wildcard prefix e.g. "customers.*"
    const [domain] = permission.split('.');
    if (permissions.includes(`${domain}.*`)) return true;

    return false;
  };

  const logout = () => {
    setIsLoggedIn(false);
    localStorage.setItem('davetech_is_logged_in', 'false');
  };

  const loginAsUser = (userId: string, password?: string): boolean => {
    const all = DataService.getUsers();
    const target = all.find((u) => u.id === userId);
    if (target) {
      setCurrentUser(target);
      localStorage.setItem('davetech_current_user_id', target.id);
      setIsLoggedIn(true);
      localStorage.setItem('davetech_is_logged_in', 'true');
      if (target.branchId !== 'all') {
        setActiveBranchId(target.branchId);
      }
      return true;
    }
    return false;
  };

  const registerNewUser = (userData: Partial<UserProfile>): UserProfile => {
    const newUser: UserProfile = {
      id: `USR-${Date.now().toString().slice(-4)}`,
      fullName: userData.fullName || 'New User',
      username: userData.email?.split('@')[0] || 'user',
      email: userData.email || 'user@davetech.co.ke',
      phone: userData.phone || '+254 700 000 000',
      employeeNumber: `DT-EMP-${Date.now().toString().slice(-3)}`,
      role: userData.role || 'loan_officer',
      branchId: userData.branchId || 'BR-001',
      status: 'active',
      lastLogin: new Date().toISOString().substring(0, 19).replace('T', ' '),
      createdAt: new Date().toISOString().substring(0, 10),
    };
    const currentUsers = DataService.getUsers();
    const updated = [newUser, ...currentUsers];
    localStorage.setItem('davetech_users', JSON.stringify(updated));
    setUsers(updated);
    setCurrentUser(newUser);
    localStorage.setItem('davetech_current_user_id', newUser.id);
    setIsLoggedIn(true);
    localStorage.setItem('davetech_is_logged_in', 'true');
    return newUser;
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        activeBranchId,
        isDarkMode,
        isSingleOperatorMode,
        isLoggedIn,
        systemSettings,
        branches,
        allUsers: users,
        isEditPlatformModalOpen,
        setIsEditPlatformModalOpen,
        updateSystemSettings,
        setActiveBranchId,
        toggleDarkMode,
        toggleSingleOperatorMode,
        setSingleOperatorMode,
        switchUser,
        switchRole,
        loginAsUser,
        registerNewUser,
        hasPermission,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
