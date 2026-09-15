/**
 * DAVETECH ERP - Data Access & Business Service Layer
 * Interacts with Firebase Firestore with local resilience and deterministic ID generation.
 * Handles full transactions, validations, audit logging, and state synchronization.
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  limit,
  onSnapshot,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, testFirestoreConnection } from './firebase';
import {
  Customer,
  Asset,
  Collateral,
  Valuation,
  LoanProduct,
  LoanApplication,
  CreditAssessment,
  Loan,
  Repayment,
  RecoveryCase,
  AuctionDisposal,
  CashAccount,
  ChartOfAccount,
  JournalEntry,
  Branch,
  UserProfile,
  AuditLog,
  SystemSettings,
  NotificationItem,
  UserRole,
  AssetCategory,
  PropertyListing,
  MaintenanceRequest,
} from '../types/erp';
import {
  SEED_BRANCHES,
  SEED_USERS,
  SEED_CUSTOMERS,
  SEED_ASSETS,
  SEED_COLLATERALS,
  SEED_VALUATIONS,
  SEED_LOAN_PRODUCTS,
  SEED_APPLICATIONS,
  SEED_LOANS,
  SEED_REPAYMENTS,
  SEED_RECOVERY_CASES,
  SEED_CASH_ACCOUNTS,
  SEED_SETTINGS,
  SEED_AUDIT_LOGS,
  SEED_PROPERTIES,
  SEED_MAINTENANCE_REQUESTS,
} from './seedData';
import { LoanEngine } from './loanEngine';

const STORAGE_PREFIX = 'davetech_erp_';

function getLocal<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(STORAGE_PREFIX + key);
    return item ? JSON.parse(item) : fallback;
  } catch (e) {
    return fallback;
  }
}

function setLocal<T>(key: string, data: T): void {
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(data));
  } catch (e) {
    console.warn('Local storage write failed', e);
  }

  // Automatic asynchronous background persistence to Firestore database
  try {
    if (key === 'settings') {
      const clean = JSON.parse(JSON.stringify(data));
      setDoc(doc(db, 'system_settings', 'config'), clean, { merge: true }).catch((err) => {
        handleFirestoreError(err, OperationType.WRITE, 'system_settings/config');
      });
    } else if (Array.isArray(data)) {
      const collectionMapping: Record<string, string> = {
        customers: 'customers',
        loans: 'loans',
        assets: 'assets',
        collaterals: 'collateral',
        repayments: 'repayments',
        properties: 'properties',
        maintenance_requests: 'maintenance_requests',
        recovery_cases: 'recovery_cases',
        audit_logs: 'audit_logs',
      };
      const colName = collectionMapping[key];
      if (colName) {
        // Sync items with an 'id' property
        const itemsToSync = (data as any[]).slice(0, 30);
        itemsToSync.forEach((item) => {
          if (item && item.id) {
            const clean = JSON.parse(JSON.stringify(item));
            setDoc(doc(db, colName, item.id), clean, { merge: true }).catch((err) => {
              handleFirestoreError(err, OperationType.WRITE, `${colName}/${item.id}`);
            });
          }
        });
      }
    }
  } catch (err) {
    // Non-blocking
  }
}

export class DataService {
  private static listeners: (() => void)[] = [];
  private static isConnectedToFirestore = false;

  static subscribe(fn: () => void): () => void {
    this.listeners.push(fn);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== fn);
    };
  }

  private static notify() {
    this.listeners.forEach((fn) => fn());
  }

  static isFirestoreLive(): boolean {
    return this.isConnectedToFirestore;
  }

  /**
   * Persist a document directly to Firestore with error resilience
   */
  static async persistDocToFirestore(collectionName: string, docId: string, data: any): Promise<void> {
    try {
      const cleanData = JSON.parse(JSON.stringify(data));
      await setDoc(doc(db, collectionName, docId), cleanData, { merge: true });
      this.isConnectedToFirestore = true;
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `${collectionName}/${docId}`);
    }
  }

  // --- Initialize & Seed ---
  static async initializeSystem(): Promise<void> {
    // 1. Check Firestore database connection
    try {
      const live = await testFirestoreConnection();
      this.isConnectedToFirestore = live;
    } catch (e) {
      this.isConnectedToFirestore = false;
    }

    // 2. Real-time Firestore synchronization for System Settings & Branding
    try {
      const settingsRef = doc(db, 'system_settings', 'config');

      // Immediate fetch to avoid waiting
      getDoc(settingsRef).then((snap) => {
        if (snap.exists()) {
          const remote = snap.data() as SystemSettings;
          if (remote) {
            const current = getLocal<SystemSettings>('settings', SEED_SETTINGS);
            setLocal('settings', { ...current, ...remote });
            this.notify();
          }
        } else {
          // Document does not exist in Firestore: save seed settings permanently
          const current = getLocal<SystemSettings>('settings', SEED_SETTINGS);
          setDoc(settingsRef, JSON.parse(JSON.stringify(current)), { merge: true }).catch((err) => {
            handleFirestoreError(err, OperationType.WRITE, 'system_settings/config');
          });
        }
      }).catch((err) => {
        handleFirestoreError(err, OperationType.GET, 'system_settings/config');
      });

      // Real-time listener: any updates to branding/logo/settings in Firestore propagate immediately
      onSnapshot(
        settingsRef,
        (snapshot) => {
          if (snapshot.exists()) {
            const remote = snapshot.data() as SystemSettings;
            if (remote) {
              const current = getLocal<SystemSettings>('settings', SEED_SETTINGS);
              setLocal('settings', { ...current, ...remote });
              this.isConnectedToFirestore = true;
              this.notify();
            }
          }
        },
        (error) => {
          handleFirestoreError(error, OperationType.GET, 'system_settings/config');
        }
      );
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, 'system_settings/config');
    }

    // 3. Hydrate core collections from Firestore
    const collectionsToSync: { key: string; col: string; fallback: any[] }[] = [
      { key: 'customers', col: 'customers', fallback: SEED_CUSTOMERS },
      { key: 'loans', col: 'loans', fallback: SEED_LOANS },
      { key: 'properties', col: 'properties', fallback: SEED_PROPERTIES },
      { key: 'collaterals', col: 'collateral', fallback: SEED_COLLATERALS },
      { key: 'assets', col: 'assets', fallback: SEED_ASSETS },
    ];

    collectionsToSync.forEach(({ key, col, fallback }) => {
      getDocs(collection(db, col))
        .then((snap) => {
          if (!snap.empty) {
            const remoteItems: any[] = [];
            snap.forEach((docSnap) => {
              remoteItems.push({ ...docSnap.data(), id: docSnap.id });
            });
            if (remoteItems.length > 0) {
              const current = getLocal<any[]>(key, fallback);
              const map = new Map<string, any>();
              current.forEach((x) => x.id && map.set(x.id, x));
              remoteItems.forEach((x) => x.id && map.set(x.id, x));
              const merged = Array.from(map.values());
              try {
                localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(merged));
              } catch (e) {}
              this.isConnectedToFirestore = true;
              this.notify();
            }
          } else {
            // Seed initial records to Firestore
            const initial = getLocal<any[]>(key, fallback);
            initial.slice(0, 10).forEach((item) => {
              if (item && item.id) {
                setDoc(doc(db, col, item.id), JSON.parse(JSON.stringify(item)), { merge: true }).catch(() => {});
              }
            });
          }
        })
        .catch((err) => {
          handleFirestoreError(err, OperationType.LIST, col);
        });
    });

    const hasInitialized = localStorage.getItem(STORAGE_PREFIX + 'initialized');
    if (!hasInitialized) {
      this.resetToSeedData();
      localStorage.setItem(STORAGE_PREFIX + 'initialized', 'true');
    }
  }

  static resetToSeedData(): void {
    setLocal('branches', SEED_BRANCHES);
    setLocal('users', SEED_USERS);
    setLocal('customers', SEED_CUSTOMERS);
    setLocal('assets', SEED_ASSETS);
    setLocal('collaterals', SEED_COLLATERALS);
    setLocal('valuations', SEED_VALUATIONS);
    setLocal('loan_products', SEED_LOAN_PRODUCTS);
    setLocal('loan_applications', SEED_APPLICATIONS);
    setLocal('loans', SEED_LOANS);
    setLocal('repayments', SEED_REPAYMENTS);
    setLocal('recovery_cases', SEED_RECOVERY_CASES);
    setLocal('cash_accounts', SEED_CASH_ACCOUNTS);
    setLocal('settings', SEED_SETTINGS);
    setLocal('audit_logs', SEED_AUDIT_LOGS);
    setLocal('properties', SEED_PROPERTIES);
    setLocal('maintenance_requests', SEED_MAINTENANCE_REQUESTS);
    setLocal('auctions', []);
    setLocal('notifications', [
      {
        id: 'NOTIF-01',
        title: 'Pending Credit Approval',
        message: 'Application APP-2026-000003 for Apex Hardware (KES 12M) requires Senior Management review.',
        type: 'warning',
        module: 'loans',
        targetId: 'APP-2026-000003',
        read: false,
        timestamp: '2026-09-14 09:30',
      },
      {
        id: 'NOTIF-02',
        title: 'Arrears Action Required',
        message: 'Loan LOG-2026-000003 is 68 days overdue. Impounded asset Isuzu D-Max is in Nakuru Yard.',
        type: 'error',
        module: 'recovery',
        targetId: 'LOG-2026-000003',
        read: false,
        timestamp: '2026-09-14 11:00',
      },
    ]);
    this.notify();
  }

  // --- Audit Logging ---
  static async logAudit(
    userId: string,
    userName: string,
    userRole: UserRole,
    action: string,
    module: AuditLog['module'],
    recordId: string,
    branchId: string,
    details: string
  ): Promise<void> {
    const logs = getLocal<AuditLog[]>('audit_logs', SEED_AUDIT_LOGS);
    const newLog: AuditLog = {
      id: `LOG-${Date.now()}`,
      userId,
      userName,
      userRole,
      action,
      module,
      recordId,
      branchId: branchId || 'BR-001',
      details,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
    };
    logs.unshift(newLog);
    setLocal('audit_logs', logs.slice(0, 500)); // retain last 500
    this.notify();
  }

  // --- Customers ---
  static getCustomers(): Customer[] {
    return getLocal<Customer[]>('customers', SEED_CUSTOMERS);
  }

  static getCustomerById(id: string): Customer | undefined {
    return this.getCustomers().find((c) => c.id === id);
  }

  static saveCustomer(
    customer: any,
    user: UserProfile
  ): Customer {
    const customers = this.getCustomers();
    if (customer.id) {
      // Edit
      const index = customers.findIndex((c) => c.id === customer.id);
      if (index === -1) throw new Error('Customer not found');
      const updated: Customer = {
        ...customers[index],
        ...customer,
      };
      customers[index] = updated;
      setLocal('customers', customers);
      this.logAudit(
        user.id,
        user.fullName,
        user.role,
        'UPDATE_CUSTOMER',
        'customers',
        updated.id,
        updated.branchId,
        `Updated details for customer ${updated.fullName} (${updated.customerNumber})`
      );
      this.notify();
      return updated;
    } else {
      // Create new
      const nextNum = (customers.length + 1).toString().padStart(6, '0');
      const id = `CUS-2026-${nextNum}`;
      const newCustomer: Customer = {
        type: customer.type || customer.customerType || 'individual',
        fullName: customer.fullName,
        idNumber: customer.idNumber || '00000000',
        kraPin: customer.kraPin || 'A000000000Z',
        phone: customer.phone || '0700000000',
        email: customer.email || '',
        address: customer.address || 'Nairobi, Kenya',
        county: customer.county || 'Nairobi',
        town: customer.town || 'Nairobi',
        occupation: customer.occupation || 'Self Employed',
        monthlyIncome: customer.monthlyIncome || customer.monthlyDeclaredIncome || 50000,
        monthlyExpenses: customer.monthlyExpenses || 20000,
        status: customer.status || 'active',
        riskClassification: customer.riskClassification || customer.riskRating || 'low',
        branchId: customer.branchId || 'BR-001',
        creditScore: customer.creditScore || 700,
        documents: customer.documents || [],
        ...customer,
        id,
        customerNumber: id,
        createdAt: new Date().toISOString().split('T')[0],
      };
      customers.unshift(newCustomer);
      setLocal('customers', customers);
      this.logAudit(
        user.id,
        user.fullName,
        user.role,
        'CREATE_CUSTOMER',
        'customers',
        id,
        newCustomer.branchId,
        `Created new customer ${newCustomer.fullName} (${id})`
      );
      this.notify();
      return newCustomer;
    }
  }

  // --- Assets ---
  static getAssets(): Asset[] {
    return getLocal<Asset[]>('assets', SEED_ASSETS);
  }

  static getAssetById(id: string): Asset | undefined {
    return this.getAssets().find((a) => a.id === id);
  }

  static saveAsset(
    assetData: any,
    user: UserProfile
  ): Asset {
    const assets = this.getAssets();
    if (assetData.id) {
      const idx = assets.findIndex((a) => a.id === assetData.id);
      if (idx === -1) throw new Error('Asset not found');
      const updated: Asset = {
        ...assets[idx],
        ...assetData,
      };
      assets[idx] = updated;
      setLocal('assets', assets);
      this.logAudit(
        user.id,
        user.fullName,
        user.role,
        'UPDATE_ASSET',
        'assets',
        updated.id,
        updated.branchId,
        `Updated asset ${updated.titleOrName} (${updated.id})`
      );
      this.notify();
      return updated;
    } else {
      const nextNum = (assets.length + 1).toString().padStart(6, '0');
      const id = `AST-2026-${nextNum}`;
      const newAsset: Asset = {
        ownerName: 'Valued Customer',
        titleOrName: 'Pledged Asset',
        marketValue: 0,
        forcedSaleValue: 0,
        status: 'available',
        branchId: 'BR-001',
        ...assetData,
        id,
        createdAt: new Date().toISOString().split('T')[0],
      };
      assets.unshift(newAsset);
      setLocal('assets', assets);
      this.logAudit(
        user.id,
        user.fullName,
        user.role,
        'CREATE_ASSET',
        'assets',
        id,
        newAsset.branchId,
        `Registered new asset ${newAsset.titleOrName} (${id})`
      );
      this.notify();
      return newAsset;
    }
  }

  // --- Collateral ---
  static getCollaterals(): Collateral[] {
    return getLocal<Collateral[]>('collaterals', SEED_COLLATERALS);
  }

  static getCollateralById(id: string): Collateral | undefined {
    return this.getCollaterals().find((c) => c.id === id);
  }

  static saveCollateral(
    colData: Omit<Collateral, 'id' | 'createdAt'> & { id?: string },
    user: UserProfile
  ): Collateral {
    const collaterals = this.getCollaterals();

    // Prevent duplicate active pledge of the same asset unless authorized
    if (!colData.id) {
      const existing = collaterals.find(
        (c) => c.assetId === colData.assetId && (c.status === 'active' || c.status === 'pledged')
      );
      if (existing) {
        throw new Error(
          `Asset is already pledged to an active collateral record (${existing.id}). Cannot pledge twice!`
        );
      }
    }

    if (colData.id) {
      const idx = collaterals.findIndex((c) => c.id === colData.id);
      if (idx === -1) throw new Error('Collateral record not found');
      const updated: Collateral = {
        ...collaterals[idx],
        ...colData,
      };
      collaterals[idx] = updated;
      setLocal('collaterals', collaterals);
      this.logAudit(
        user.id,
        user.fullName,
        user.role,
        'UPDATE_COLLATERAL',
        'collateral',
        updated.id,
        updated.branchId,
        `Updated collateral ${updated.id} (${updated.description})`
      );
      this.notify();
      return updated;
    } else {
      const nextNum = (collaterals.length + 145).toString().padStart(6, '0');
      const id = `COL-2026-${nextNum}`;
      const newCol: Collateral = {
        ...colData,
        id,
        createdAt: new Date().toISOString().split('T')[0],
      };
      collaterals.unshift(newCol);
      setLocal('collaterals', collaterals);

      // Update asset status to pledged/active_collateral
      const assets = this.getAssets();
      const aIdx = assets.findIndex((a) => a.id === colData.assetId);
      if (aIdx !== -1) {
        assets[aIdx].status = 'active_collateral';
        setLocal('assets', assets);
      }

      this.logAudit(
        user.id,
        user.fullName,
        user.role,
        'CREATE_COLLATERAL',
        'collateral',
        id,
        newCol.branchId,
        `Pledged collateral ${id} for asset ${colData.assetId} with approved value KES ${newCol.approvedCollateralValue}`
      );
      this.notify();
      return newCol;
    }
  }

  static verifyCollateral(
    collateralId: string,
    user: UserProfile,
    status: 'verified' | 'rejected',
    notes: string
  ): Collateral {
    const collaterals = this.getCollaterals();
    const idx = collaterals.findIndex((c) => c.id === collateralId);
    if (idx === -1) throw new Error('Collateral not found');

    const col = collaterals[idx];
    col.verificationStatus = status;
    col.verifiedBy = user.id;
    col.verifiedAt = new Date().toISOString().split('T')[0];
    col.notes = (col.notes ? col.notes + ' | ' : '') + `Verification: ${notes}`;

    collaterals[idx] = col;
    setLocal('collaterals', collaterals);

    this.logAudit(
      user.id,
      user.fullName,
      user.role,
      status === 'verified' ? 'VERIFY_COLLATERAL' : 'REJECT_COLLATERAL',
      'collateral',
      collateralId,
      col.branchId,
      `Verification status changed to ${status} by ${user.fullName}. Notes: ${notes}`
    );
    this.notify();
    return col;
  }

  static releaseCollateral(
    collateralId: string,
    user: UserProfile,
    acknowledgementRef: string,
    notes: string
  ): Collateral {
    const collaterals = this.getCollaterals();
    const idx = collaterals.findIndex((c) => c.id === collateralId);
    if (idx === -1) throw new Error('Collateral record not found');

    const col = collaterals[idx];

    // Check if linked loan is still active
    if (col.activeLoanId) {
      const loans = this.getLoans();
      const loan = loans.find((l) => l.id === col.activeLoanId);
      if (loan && loan.status !== 'paid_off' && loan.status !== 'closed') {
        throw new Error(
          `Security violation: Collateral cannot be released while active loan ${loan.loanNumber} has outstanding balance of ${LoanEngine.formatKES(
            loan.totalOutstanding
          )}!`
        );
      }
    }

    col.status = 'released';
    col.releaseDate = new Date().toISOString().split('T')[0];
    col.releasedBy = user.fullName;
    col.customerAcknowledgementRef = acknowledgementRef;
    col.notes = (col.notes ? col.notes + ' | ' : '') + `Released: ${notes}`;

    collaterals[idx] = col;
    setLocal('collaterals', collaterals);

    // Update asset status to released
    const assets = this.getAssets();
    const aIdx = assets.findIndex((a) => a.id === col.assetId);
    if (aIdx !== -1) {
      assets[aIdx].status = 'released';
      setLocal('assets', assets);
    }

    this.logAudit(
      user.id,
      user.fullName,
      user.role,
      'RELEASE_COLLATERAL',
      'collateral',
      collateralId,
      col.branchId,
      `Released collateral ${collateralId}. Customer ack ref: ${acknowledgementRef}. Released by: ${user.fullName}`
    );
    this.notify();
    return col;
  }

  // --- Valuations ---
  static getValuations(): Valuation[] {
    return getLocal<Valuation[]>('valuations', SEED_VALUATIONS);
  }

  static saveValuation(valData: Omit<Valuation, 'id' | 'createdAt'>, user: UserProfile): Valuation {
    const valuations = this.getValuations();
    const nextNum = (valuations.length + 1).toString().padStart(6, '0');
    const id = `VAL-2026-${nextNum}`;
    const newVal: Valuation = {
      ...valData,
      id,
      createdAt: new Date().toISOString().split('T')[0],
    };
    valuations.unshift(newVal);
    setLocal('valuations', valuations);

    // Update asset values if higher or fresh
    const assets = this.getAssets();
    const aIdx = assets.findIndex((a) => a.id === valData.assetId);
    if (aIdx !== -1) {
      assets[aIdx].marketValue = valData.marketValue;
      assets[aIdx].forcedSaleValue = valData.forcedSaleValue;
      setLocal('assets', assets);
    }

    this.logAudit(
      user.id,
      user.fullName,
      user.role,
      'RECORD_VALUATION',
      'assets',
      id,
      'BR-001',
      `Valuation completed for asset ${valData.assetId} by ${valData.valuerName}. Market Value: KES ${valData.marketValue}`
    );
    this.notify();
    return newVal;
  }

  // --- Loan Products ---
  static getLoanProducts(): LoanProduct[] {
    return getLocal<LoanProduct[]>('loan_products', SEED_LOAN_PRODUCTS);
  }

  static saveLoanProduct(product: LoanProduct, user: UserProfile): void {
    const products = this.getLoanProducts();
    const idx = products.findIndex((p) => p.id === product.id);
    if (idx !== -1) {
      products[idx] = product;
    } else {
      products.push(product);
    }
    setLocal('loan_products', products);
    this.logAudit(
      user.id,
      user.fullName,
      user.role,
      'SAVE_LOAN_PRODUCT',
      'loans',
      product.id,
      'all',
      `Configured loan product ${product.name} (${product.code})`
    );
    this.notify();
  }

  // --- Loan Applications & Approvals ---
  static getApplications(): LoanApplication[] {
    return getLocal<LoanApplication[]>('loan_applications', SEED_APPLICATIONS);
  }

  static saveApplication(
    appData: Omit<LoanApplication, 'id' | 'applicationNumber' | 'createdAt' | 'statusHistory'> & {
      id?: string;
    },
    user: UserProfile
  ): LoanApplication {
    const apps = this.getApplications();
    if (appData.id) {
      const idx = apps.findIndex((a) => a.id === appData.id);
      if (idx === -1) throw new Error('Application not found');
      const updated: LoanApplication = {
        ...apps[idx],
        ...appData,
      };
      apps[idx] = updated;
      setLocal('loan_applications', apps);
      this.logAudit(
        user.id,
        user.fullName,
        user.role,
        'UPDATE_APPLICATION',
        'loans',
        updated.id,
        updated.branchId,
        `Updated loan application ${updated.applicationNumber}`
      );
      this.notify();
      return updated;
    } else {
      const nextNum = (apps.length + 1).toString().padStart(6, '0');
      const id = `APP-2026-${nextNum}`;
      const newApp: LoanApplication = {
        ...appData,
        id,
        applicationNumber: id,
        status: 'submitted',
        statusHistory: [
          {
            status: 'submitted',
            changedBy: user.fullName,
            changedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
            comment: 'Application submitted successfully',
          },
        ],
        createdAt: new Date().toISOString().split('T')[0],
      };
      apps.unshift(newApp);
      setLocal('loan_applications', apps);
      this.logAudit(
        user.id,
        user.fullName,
        user.role,
        'SUBMIT_APPLICATION',
        'loans',
        id,
        newApp.branchId,
        `New loan application ${id} created for customer ${newApp.customerId} requesting ${LoanEngine.formatKES(
          newApp.requestedAmount
        )}`
      );
      this.notify();
      return newApp;
    }
  }

  static approveApplication(
    applicationId: string,
    user: UserProfile,
    decision: 'approved' | 'rejected',
    approvedAmount: number,
    commentOrConditions: string = '',
    optionalNotes?: string
  ): LoanApplication {
    const apps = this.getApplications();
    const idx = apps.findIndex((a) => a.id === applicationId);
    if (idx === -1) throw new Error('Application not found');

    const app = apps[idx];
    const newStatus = decision === 'approved' ? 'approved' : 'rejected';
    const combinedNotes = optionalNotes
      ? `${commentOrConditions ? 'Conditions: ' + commentOrConditions + '. ' : ''}${optionalNotes}`
      : commentOrConditions;

    app.status = newStatus;
    app.statusHistory.push({
      status: newStatus,
      changedBy: `${user.fullName} (${user.role})`,
      changedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      comment: `Decision: ${decision.toUpperCase()} (Approved Amount: ${LoanEngine.formatKES(
        approvedAmount
      )}). Notes: ${combinedNotes}`,
    });

    apps[idx] = app;
    setLocal('loan_applications', apps);

    this.logAudit(
      user.id,
      user.fullName,
      user.role,
      decision === 'approved' ? 'APPROVE_LOAN' : 'REJECT_LOAN',
      'approvals',
      applicationId,
      app.branchId,
      `${decision.toUpperCase()} application ${applicationId} by ${user.fullName}. Amount: ${LoanEngine.formatKES(
        approvedAmount
      )}`
    );
    this.notify();
    return app;
  }

  static submitCreditAssessment(
    appIdOrData: any,
    user: UserProfile,
    dataIfThirdArg?: any,
    optionalFourthArg?: any
  ): CreditAssessment {
    let assessmentData: any;
    if (dataIfThirdArg) {
      assessmentData = {
        ...dataIfThirdArg,
        applicationId: appIdOrData,
        customerId: dataIfThirdArg.customerId || 'CUS-001',
        customerIncome: dataIfThirdArg.customerIncome || 100000,
        businessIncome: 0,
        monthlyExpenses: 30000,
        netDisposableIncome: 70000,
        existingLoansRepayment: 0,
        debtServiceRatioPct: dataIfThirdArg.dsrPercentage || 30,
        creditScore: dataIfThirdArg.creditScore || 720,
        riskRating: dataIfThirdArg.riskRating || 'low',
        collateralValue: dataIfThirdArg.collateralValue || 1500000,
        collateralCoveragePct: 150,
        eligibleLtvPct: dataIfThirdArg.ltvPercentage || 65,
        maxAffordableInstallment: 45000,
        recommendedAmount: dataIfThirdArg.recommendedAmount || 500000,
        creditOfficerId: user.id,
        creditOfficerRecommendation:
          optionalFourthArg || dataIfThirdArg.recommendation || 'recommend_approval',
        notes: dataIfThirdArg.notes || '',
      };
    } else {
      assessmentData = appIdOrData;
    }

    const assessments = getLocal<CreditAssessment[]>('credit_assessments', []);
    const id = assessmentData.id || `CA-${Date.now()}`;
    const newAssessment: CreditAssessment = {
      ...assessmentData,
      id,
      assessedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
    };
    assessments.unshift(newAssessment);
    setLocal('credit_assessments', assessments);

    // Update application status to credit_assessment or pending_approval
    const apps = this.getApplications();
    const aIdx = apps.findIndex((a) => a.id === assessmentData.applicationId);
    if (aIdx !== -1) {
      apps[aIdx].status = 'pending_approval';
      apps[aIdx].statusHistory.push({
        status: 'pending_approval',
        changedBy: `${user.fullName} (${user.role})`,
        changedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
        comment: `Credit Assessment completed. Recommendation: ${assessmentData.creditOfficerRecommendation}`,
      });
      setLocal('loan_applications', apps);
    }

    this.logAudit(
      user.id,
      user.fullName,
      user.role,
      'SUBMIT_ASSESSMENT',
      'loans',
      assessmentData.applicationId,
      'BR-001',
      `Credit assessment submitted for application ${assessmentData.applicationId}. Score: ${assessmentData.creditScore || 700}, DSR: ${assessmentData.debtServiceRatioPct || 0}%`
    );
    this.notify();
    return newAssessment;
  }

  // --- Loans & Disbursements ---
  static getLoans(): Loan[] {
    return getLocal<Loan[]>('loans', SEED_LOANS);
  }

  static getLoanById(id: string): Loan | undefined {
    return this.getLoans().find((l) => l.id === id);
  }

  static disburseLoan(
    applicationId: string,
    user: UserProfile,
    disbursementMethod: 'cash' | 'bank' | 'mobile_money' | 'cheque',
    disbursementReference: string,
    notes?: string
  ): Loan {
    const apps = this.getApplications();
    const aIdx = apps.findIndex((a) => a.id === applicationId);
    if (aIdx === -1) throw new Error('Application not found');
    const app = apps[aIdx];

    if (app.status !== 'approved') {
      throw new Error(`Cannot disburse loan in status "${app.status}". Loan must be approved first!`);
    }

    const products = this.getLoanProducts();
    const product = products.find((p) => p.id === app.loanProductId) || products[0];

    // Compute loan parameters and schedule
    const calcResult = LoanEngine.calculateLoan({
      principal: app.requestedAmount,
      interestRatePerMonth: product.interestRatePerMonth,
      durationMonths: app.proposedDurationMonths,
      interestMethod: product.interestMethod,
      repaymentFrequency: app.repaymentFrequency,
      processingFeePct: product.processingFeePct,
      insuranceFeePct: product.insuranceFeePct,
      startDate: new Date(),
    });

    const loans = this.getLoans();
    const prefix = product.code.startsWith('TITLE') ? 'PROP' : 'LOG';
    const nextNum = (loans.length + 1).toString().padStart(6, '0');
    const loanNumber = `${prefix}-2026-${nextNum}`;

    const maturityDate = new Date();
    maturityDate.setMonth(maturityDate.getMonth() + app.proposedDurationMonths);

    const nextPaymentDate = new Date();
    if (app.repaymentFrequency === 'weekly') nextPaymentDate.setDate(nextPaymentDate.getDate() + 7);
    else if (app.repaymentFrequency === 'bi_weekly') nextPaymentDate.setDate(nextPaymentDate.getDate() + 14);
    else nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);

    const newLoan: Loan = {
      id: loanNumber,
      loanNumber,
      applicationId: app.id,
      customerId: app.customerId,
      loanProductId: product.id,
      collateralId: app.collateralId,
      branchId: app.branchId,
      principal: app.requestedAmount,
      interestRatePerMonth: product.interestRatePerMonth,
      interestMethod: product.interestMethod,
      durationMonths: app.proposedDurationMonths,
      repaymentFrequency: app.repaymentFrequency,
      installmentAmount: calcResult.installmentAmount,
      totalInterest: calcResult.totalInterest,
      processingFee: calcResult.processingFee,
      insuranceFee: calcResult.insuranceFee,
      totalPayable: calcResult.totalPayable,
      totalPaid: 0,
      outstandingPrincipal: app.requestedAmount,
      outstandingInterest: calcResult.totalInterest,
      outstandingFees: calcResult.totalFees,
      outstandingPenalties: 0,
      totalOutstanding: calcResult.totalPayable,
      disbursementDate: new Date().toISOString().split('T')[0],
      disbursementMethod,
      disbursementReference,
      maturityDate: maturityDate.toISOString().split('T')[0],
      nextPaymentDate: nextPaymentDate.toISOString().split('T')[0],
      status: 'active',
      daysInArrears: 0,
      loanOfficerId: app.loanOfficerId,
      schedule: calcResult.schedule,
      createdAt: new Date().toISOString().split('T')[0],
    };

    loans.unshift(newLoan);
    setLocal('loans', loans);

    // Update application status
    app.status = 'disbursed';
    app.statusHistory.push({
      status: 'disbursed',
      changedBy: `${user.fullName} (${user.role})`,
      changedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      comment: `Disbursed via ${disbursementMethod.toUpperCase()} (Ref: ${disbursementReference}). Notes: ${notes || ''}`,
    });
    apps[aIdx] = app;
    setLocal('loan_applications', apps);

    // Link collateral to active loan
    if (app.collateralId) {
      const collaterals = this.getCollaterals();
      const cIdx = collaterals.findIndex((c) => c.id === app.collateralId);
      if (cIdx !== -1) {
        collaterals[cIdx].activeLoanId = loanNumber;
        collaterals[cIdx].status = 'active';
        setLocal('collaterals', collaterals);
      }
    }

    this.logAudit(
      user.id,
      user.fullName,
      user.role,
      'DISBURSE_LOAN',
      'loans',
      loanNumber,
      app.branchId,
      `Disbursed loan ${loanNumber} of ${LoanEngine.formatKES(
        newLoan.principal
      )} via ${disbursementMethod} (Ref: ${disbursementReference})`
    );
    this.notify();
    return newLoan;
  }

  // --- Repayments & Collections ---
  static getRepayments(): Repayment[] {
    return getLocal<Repayment[]>('repayments', SEED_REPAYMENTS);
  }

  static postRepayment(
    loanIdOrData:
      | string
      | {
          loanId: string;
          customerId?: string;
          amount: number;
          paymentDate?: string;
          paymentMethod: any;
          transactionReference: string;
          notes?: string;
          branchId?: string;
        },
    amountOrUser?: number | UserProfile,
    paymentMethodArg?: any,
    transactionReferenceArg?: string,
    userArg?: UserProfile,
    notesArg?: string
  ): Repayment {
    let loanId: string;
    let amount: number;
    let paymentMethod: any;
    let transactionReference: string;
    let user: UserProfile;
    let notes: string | undefined;

    if (typeof loanIdOrData === 'object') {
      loanId = loanIdOrData.loanId;
      amount = loanIdOrData.amount;
      paymentMethod = loanIdOrData.paymentMethod;
      transactionReference = loanIdOrData.transactionReference;
      notes = loanIdOrData.notes;
      user = (amountOrUser as UserProfile) || (this.getUsers()[0] as UserProfile);
    } else {
      loanId = loanIdOrData;
      amount = amountOrUser as number;
      paymentMethod = paymentMethodArg;
      transactionReference = transactionReferenceArg!;
      user = userArg || (this.getUsers()[0] as UserProfile);
      notes = notesArg;
    }

    const loans = this.getLoans();
    const lIdx = loans.findIndex((l) => l.id === loanId);
    if (lIdx === -1) throw new Error('Loan not found');

    const loan = loans[lIdx];
    if (loan.status === 'paid_off' || loan.status === 'closed') {
      throw new Error(`Cannot post payment to loan ${loan.loanNumber} because it is already fully settled!`);
    }

    // Allocate payment using business allocation engine
    const allocation = LoanEngine.allocatePayment(
      amount,
      {
        penalties: loan.outstandingPenalties,
        fees: loan.outstandingFees,
        interest: loan.outstandingInterest,
        principal: loan.outstandingPrincipal,
      },
      SEED_SETTINGS.paymentAllocationOrder
    );

    // Update loan outstanding balances
    loan.outstandingPenalties = Math.max(0, loan.outstandingPenalties - allocation.penaltyAllocation);
    loan.outstandingFees = Math.max(0, loan.outstandingFees - allocation.feesAllocation);
    loan.outstandingInterest = Math.max(0, loan.outstandingInterest - allocation.interestAllocation);
    loan.outstandingPrincipal = Math.max(0, loan.outstandingPrincipal - allocation.principalAllocation);
    loan.totalPaid += amount;
    loan.totalOutstanding =
      loan.outstandingPrincipal +
      loan.outstandingInterest +
      loan.outstandingFees +
      loan.outstandingPenalties;

    // Update schedule installments
    let remainingPrincipalToApply = allocation.principalAllocation;
    let remainingInterestToApply = allocation.interestAllocation;

    loan.schedule = loan.schedule.map((item) => {
      if (item.status === 'paid') return item;

      let princPay = 0;
      let intPay = 0;

      if (remainingInterestToApply > 0) {
        const intDue = item.interestDue - item.interestPaid;
        intPay = Math.min(remainingInterestToApply, intDue);
        item.interestPaid += intPay;
        remainingInterestToApply -= intPay;
      }

      if (remainingPrincipalToApply > 0) {
        const princDue = item.principalDue - item.principalPaid;
        princPay = Math.min(remainingPrincipalToApply, princDue);
        item.principalPaid += princPay;
        remainingPrincipalToApply -= princPay;
      }

      item.totalPaid = item.principalPaid + item.interestPaid + item.feesPaid + item.penaltiesPaid;
      if (item.totalPaid >= item.totalInstallment) {
        item.status = 'paid';
        item.daysOverdue = 0;
      } else if (item.totalPaid > 0) {
        item.status = 'partial';
      }

      return item;
    });

    // Check if loan is fully paid off
    if (loan.totalOutstanding <= 0) {
      loan.status = 'paid_off';
      loan.clearedDate = new Date().toISOString().split('T')[0];
    }

    loans[lIdx] = loan;
    setLocal('loans', loans);

    // Create Repayment Receipt
    const repayments = this.getRepayments();
    const nextNum = (repayments.length + 1).toString().padStart(6, '0');
    const receiptNumber = `REC-2026-${nextNum}`;

    const newRepayment: Repayment = {
      id: receiptNumber,
      receiptNumber,
      loanId: loan.id,
      customerId: loan.customerId,
      branchId: loan.branchId,
      amount,
      paymentDate: new Date().toISOString().replace('T', ' ').substring(0, 16),
      paymentMethod,
      transactionReference,
      principalAllocation: allocation.principalAllocation,
      interestAllocation: allocation.interestAllocation,
      feesAllocation: allocation.feesAllocation,
      penaltyAllocation: allocation.penaltyAllocation,
      receivedById: user.id,
      receivedByName: `${user.fullName} (${user.role})`,
      notes: notes || 'Repayment posted successfully',
      status: 'posted',
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
    };

    repayments.unshift(newRepayment);
    setLocal('repayments', repayments);

    this.logAudit(
      user.id,
      user.fullName,
      user.role,
      'POST_REPAYMENT',
      'repayments',
      receiptNumber,
      loan.branchId,
      `Posted repayment ${receiptNumber} of ${LoanEngine.formatKES(
        amount
      )} for loan ${loan.loanNumber} via ${paymentMethod} (Ref: ${transactionReference})`
    );
    this.notify();
    return newRepayment;
  }

  static reverseRepayment(receiptNumber: string, user: UserProfile, reason: string): void {
    const repayments = this.getRepayments();
    const rIdx = repayments.findIndex((r) => r.receiptNumber === receiptNumber);
    if (rIdx === -1) throw new Error('Receipt not found');

    const rep = repayments[rIdx];
    if (rep.status === 'reversed') throw new Error('Payment has already been reversed');

    rep.status = 'reversed';
    rep.reversalReason = reason;
    rep.reversedBy = user.fullName;
    rep.reversedAt = new Date().toISOString().replace('T', ' ').substring(0, 16);

    repayments[rIdx] = rep;
    setLocal('repayments', repayments);

    // Rollback loan balances
    const loans = this.getLoans();
    const lIdx = loans.findIndex((l) => l.id === rep.loanId);
    if (lIdx !== -1) {
      const loan = loans[lIdx];
      loan.outstandingPrincipal += rep.principalAllocation;
      loan.outstandingInterest += rep.interestAllocation;
      loan.outstandingFees += rep.feesAllocation;
      loan.outstandingPenalties += rep.penaltyAllocation;
      loan.totalPaid = Math.max(0, loan.totalPaid - rep.amount);
      loan.totalOutstanding =
        loan.outstandingPrincipal +
        loan.outstandingInterest +
        loan.outstandingFees +
        loan.outstandingPenalties;
      if (loan.status === 'paid_off') {
        loan.status = 'active';
        loan.clearedDate = undefined;
      }
      loans[lIdx] = loan;
      setLocal('loans', loans);
    }

    this.logAudit(
      user.id,
      user.fullName,
      user.role,
      'REVERSE_REPAYMENT',
      'repayments',
      receiptNumber,
      rep.branchId,
      `Reversed payment ${receiptNumber} (${LoanEngine.formatKES(
        rep.amount
      )}) for loan ${rep.loanId}. Reason: ${reason}`
    );
    this.notify();
  }

  static clearAllRepayments(user: UserProfile): void {
    setLocal('repayments', []);
    this.logAudit(
      user.id,
      user.fullName,
      user.role,
      'CLEAR_ALL_REPAYMENTS',
      'repayments',
      'ALL',
      'BR-001',
      `Cleared all repayment ledger records by ${user.fullName}`
    );
    this.notify();
  }

  // --- Restructuring ---
  static restructureLoan(
    loanId: string,
    arg2: number | UserProfile,
    arg3: string | number,
    arg4?: UserProfile | number,
    arg5?: boolean,
    arg6?: string
  ): Loan {
    let user: UserProfile;
    let newDurationMonths: number;
    let reason: string;
    let newRate: number | undefined;
    let capitalizeArrears = false;

    if (typeof arg2 === 'object') {
      // (loanId, currentUser, newTenure, newRate, capitalizeArrears, restructureReason)
      user = arg2;
      newDurationMonths = Number(arg3);
      newRate = typeof arg4 === 'number' ? arg4 : undefined;
      capitalizeArrears = !!arg5;
      reason = arg6 || 'Loan terms restructuring';
    } else {
      // (loanId, newDurationMonths, reason, user)
      newDurationMonths = arg2;
      reason = String(arg3);
      user = arg4 as UserProfile;
    }

    const loans = this.getLoans();
    const idx = loans.findIndex((l) => l.id === loanId);
    if (idx === -1) throw new Error('Loan not found');

    const loan = loans[idx];
    let principalToFinance = loan.outstandingPrincipal;
    if (capitalizeArrears) {
      principalToFinance += loan.outstandingInterest + loan.outstandingFees + loan.outstandingPenalties;
      loan.outstandingFees = 0;
      loan.outstandingPenalties = 0;
    }

    const effectiveRate = newRate !== undefined ? newRate : loan.interestRatePerMonth;

    // Recalculate schedule for remaining duration
    const newCalc = LoanEngine.calculateLoan({
      principal: principalToFinance,
      interestRatePerMonth: effectiveRate,
      durationMonths: newDurationMonths,
      interestMethod: loan.interestMethod,
      repaymentFrequency: loan.repaymentFrequency,
      processingFeePct: 0,
      insuranceFeePct: 0,
      startDate: new Date(),
    });

    loan.isRestructured = true;
    loan.restructureReason = reason;
    loan.restructuredDate = new Date().toISOString().split('T')[0];
    loan.durationMonths = newDurationMonths;
    loan.interestRatePerMonth = effectiveRate;
    loan.outstandingPrincipal = principalToFinance;
    loan.installmentAmount = newCalc.installmentAmount;
    loan.outstandingInterest = newCalc.totalInterest;
    loan.totalOutstanding = principalToFinance + newCalc.totalInterest;
    loan.schedule = newCalc.schedule;
    loan.status = 'restructured';

    loans[idx] = loan;
    setLocal('loans', loans);

    this.logAudit(
      user.id,
      user.fullName,
      user.role,
      'RESTRUCTURE_LOAN',
      'loans',
      loan.loanNumber,
      loan.branchId,
      `Restructured loan ${loan.loanNumber} to ${newDurationMonths} months. Reason: ${reason}`
    );
    this.notify();
    return loan;
  }

  // --- Recovery & Auctions ---
  static getRecoveryCases(): RecoveryCase[] {
    return getLocal<RecoveryCase[]>('recovery_cases', SEED_RECOVERY_CASES);
  }

  static addRecoveryAction(
    caseId: string,
    actionType: RecoveryCase['actions'][0]['actionType'],
    description: string,
    outcome: string,
    user: UserProfile
  ): void {
    const cases = this.getRecoveryCases();
    const idx = cases.findIndex((c) => c.id === caseId);
    if (idx === -1) throw new Error('Recovery case not found');

    const rc = cases[idx];
    rc.actions.unshift({
      id: `ACT-${Date.now()}`,
      actionType,
      description,
      outcome,
      officerName: user.fullName,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
    });
    rc.lastFollowUpDate = new Date().toISOString().split('T')[0];

    cases[idx] = rc;
    setLocal('recovery_cases', cases);

    this.logAudit(
      user.id,
      user.fullName,
      user.role,
      'RECOVERY_ACTION',
      'recovery',
      caseId,
      rc.branchId,
      `Added recovery action (${actionType}) on case ${caseId} by ${user.fullName}`
    );
    this.notify();
  }

  static getAuctions(): AuctionDisposal[] {
    return getLocal<AuctionDisposal[]>('auctions', []);
  }

  static saveAuction(
    auctionData: Omit<AuctionDisposal, 'id'> & { id?: string },
    user: UserProfile
  ): AuctionDisposal {
    const auctions = this.getAuctions();
    const id = auctionData.id || `AUC-2026-${(auctions.length + 1).toString().padStart(4, '0')}`;
    const newAuction: AuctionDisposal = {
      ...auctionData,
      id,
    };
    const idx = auctions.findIndex((a) => a.id === id);
    if (idx !== -1) auctions[idx] = newAuction;
    else auctions.unshift(newAuction);
    setLocal('auctions', auctions);

    this.logAudit(
      user.id,
      user.fullName,
      user.role,
      'RECORD_AUCTION',
      'recovery',
      id,
      'BR-001',
      `Auction disposal recorded for asset ${newAuction.assetId}. Sale Price: ${LoanEngine.formatKES(
        newAuction.salePrice
      )}`
    );
    this.notify();
    return newAuction;
  }

  static addRecoveryFollowup(
    caseId: string,
    actionType: any,
    description: string,
    outcome: string,
    user: UserProfile
  ): void {
    this.addRecoveryAction(caseId, actionType, description, outcome, user);
  }

  static concludeAuction(
    auctionId: string,
    arg2: UserProfile | number,
    arg3?: number | string,
    arg4?: number | string,
    arg5?: string,
    arg6?: UserProfile
  ): AuctionDisposal {
    let user: UserProfile;
    let salePrice: number;
    let disposalCosts = 0;
    let buyerName = 'Purchaser';
    let buyerContact = '';
    let notes = '';

    if (typeof arg2 === 'object') {
      // (auctionId, user, soldPrice, auctionFees, buyerName)
      user = arg2;
      salePrice = Number(arg3) || 0;
      disposalCosts = Number(arg4) || 0;
      buyerName = (arg5 as string) || 'Purchaser';
    } else {
      // (auctionId, salePrice, buyerName, buyerContact, notes, user)
      salePrice = arg2;
      buyerName = String(arg3 || 'Purchaser');
      buyerContact = String(arg4 || '');
      notes = arg5 || '';
      user = arg6 || (this.getUsers()[0] as UserProfile);
    }

    const auctions = this.getAuctions();
    let auction = auctions.find((a) => a.id === auctionId);
    if (!auction) {
      auction = {
        id: auctionId,
        recoveryCaseId: 'RC-001',
        assetId: 'AST-001',
        loanId: 'LOG-001',
        customerId: 'CUS-001',
        reservePrice: salePrice * 0.9,
        auctionDate: new Date().toISOString().split('T')[0],
        auctionVenue: 'Central Auctioneer Yard, Nairobi',
        valuerName: 'Apex Valuers',
        buyerName,
        buyerContact,
        salePrice,
        disposalCosts: disposalCosts || salePrice * 0.05,
        netProceeds: salePrice - (disposalCosts || salePrice * 0.05),
        outstandingBalanceAtSale: salePrice * 0.8,
        surplusShortfall: salePrice * 0.95 - salePrice * 0.8,
        status: 'sold',
        notes,
      };
      auctions.unshift(auction);
    } else {
      auction.salePrice = salePrice;
      auction.buyerName = buyerName;
      auction.buyerContact = buyerContact;
      auction.disposalCosts = disposalCosts || auction.disposalCosts;
      auction.netProceeds = salePrice - auction.disposalCosts;
      auction.surplusShortfall = auction.netProceeds - auction.outstandingBalanceAtSale;
      auction.status = 'sold';
      auction.notes = notes || auction.notes;
    }
    setLocal('auctions', auctions);
    this.logAudit(
      user.id,
      user.fullName,
      user.role,
      'CONCLUDE_AUCTION',
      'recovery',
      auctionId,
      'BR-001',
      `Concluded auction ${auctionId} for KES ${salePrice} to ${buyerName}`
    );
    this.notify();
    return auction;
  }

  // --- Cash & Accounting ---
  static getAccounts(): ChartOfAccount[] {
    return getLocal<ChartOfAccount[]>('chart_of_accounts', [
      { id: '1001', code: '1001', name: 'Cash on Hand (Branch Vault)', category: 'asset', debitBalance: 1250000, creditBalance: 0, active: true },
      { id: '1002', code: '1002', name: 'NCBA Commercial Bank Account', category: 'asset', debitBalance: 4850000, creditBalance: 0, active: true },
      { id: '1003', code: '1003', name: 'Safaricom M-Pesa Paybill (247247)', category: 'asset', debitBalance: 1980000, creditBalance: 0, active: true },
      { id: '1004', code: '1004', name: 'Active Secured Loans Portfolio (Asset)', category: 'asset', debitBalance: 42000000, creditBalance: 0, active: true },
      { id: '2001', code: '2001', name: 'Customer Security Deposits', category: 'liability', debitBalance: 0, creditBalance: 2400000, active: true },
      { id: '3001', code: '3001', name: 'Shareholders Equity Capital', category: 'equity', debitBalance: 0, creditBalance: 35000000, active: true },
      { id: '4001', code: '4001', name: 'Interest Income on Secured Loans', category: 'revenue', debitBalance: 0, creditBalance: 1850000, active: true },
      { id: '4002', code: '4002', name: 'Loan Origination & Processing Fees', category: 'revenue', debitBalance: 0, creditBalance: 480000, active: true },
      { id: '4004', code: '4004', name: 'Late Repayment Penalty Charges', category: 'revenue', debitBalance: 0, creditBalance: 125000, active: true },
      { id: '5001', code: '5001', name: 'Bad Debt Provision & Impairment', category: 'expense', debitBalance: 195000, creditBalance: 0, active: true },
      { id: '5003', code: '5003', name: 'Legal & Asset Recovery Costs', category: 'expense', debitBalance: 85000, creditBalance: 0, active: true },
      { id: '5004', code: '5004', name: 'Administrative & General Expenses', category: 'expense', debitBalance: 340000, creditBalance: 0, active: true },
    ]);
  }

  static getJournals(): JournalEntry[] {
    return getLocal<JournalEntry[]>('journals', [
      {
        id: 'JRN-2026-0001',
        date: '2026-09-12',
        reference: 'DISB-REC-001',
        description: 'Loan facility disbursement to Peter Kamau (LOG-2026-000001)',
        debitAccount: '1004',
        creditAccount: '1002',
        amount: 1200000,
        branchId: 'BR-001',
        createdBy: 'David Mwai (MD)',
        transactionType: 'disbursement',
      },
      {
        id: 'JRN-2026-0002',
        date: '2026-09-13',
        reference: 'REC-2026-000001',
        description: 'Borrower installment collection via M-Pesa (Peter Kamau)',
        debitAccount: '1003',
        creditAccount: '1004',
        amount: 54600,
        branchId: 'BR-001',
        createdBy: 'Joyce Wambui (Cashier)',
        transactionType: 'repayment',
      },
    ]);
  }

  static postJournal(
    entry: Omit<JournalEntry, 'id'> & { id?: string },
    user: UserProfile
  ): JournalEntry {
    const journals = this.getJournals();
    const id = entry.id || `JRN-2026-${(journals.length + 1).toString().padStart(4, '0')}`;
    const newJournal: JournalEntry = {
      ...entry,
      id,
    };
    journals.unshift(newJournal);
    setLocal('journals', journals);

    this.logAudit(
      user.id,
      user.fullName,
      user.role,
      'POST_JOURNAL',
      'accounting',
      id,
      entry.branchId || 'BR-001',
      `Posted journal entry ${id}: ${entry.description} (KES ${entry.amount})`
    );
    this.notify();
    return newJournal;
  }

  // --- Cash & Accounting Accounts List ---
  static getCashAccounts(): CashAccount[] {
    return getLocal<CashAccount[]>('cash_accounts', SEED_CASH_ACCOUNTS);
  }

  static saveCashAccount(account: CashAccount, user: UserProfile): void {
    const accounts = this.getCashAccounts();
    const idx = accounts.findIndex((a) => a.id === account.id);
    if (idx !== -1) accounts[idx] = account;
    else accounts.push(account);
    setLocal('cash_accounts', accounts);
    this.logAudit(
      user.id,
      user.fullName,
      user.role,
      'SAVE_CASH_ACCOUNT',
      'accounting',
      account.id,
      account.branchId,
      `Saved cash account ${account.accountName} (${account.accountNumber})`
    );
    this.notify();
  }

  // --- Branches & Users ---
  static getBranches(): Branch[] {
    return getLocal<Branch[]>('branches', SEED_BRANCHES);
  }

  static saveBranch(branch: Branch, user: UserProfile): void {
    const branches = this.getBranches();
    const idx = branches.findIndex((b) => b.id === branch.id);
    if (idx !== -1) branches[idx] = branch;
    else branches.push(branch);
    setLocal('branches', branches);
    this.logAudit(
      user.id,
      user.fullName,
      user.role,
      'SAVE_BRANCH',
      'settings',
      branch.id,
      branch.id,
      `Saved branch ${branch.name} (${branch.code})`
    );
    this.notify();
  }

  static getUsers(): UserProfile[] {
    return getLocal<UserProfile[]>('users', SEED_USERS);
  }

  static saveUser(userData: UserProfile, actingUser: UserProfile): void {
    const users = this.getUsers();
    const idx = users.findIndex((u) => u.id === userData.id);
    if (idx !== -1) users[idx] = userData;
    else users.push(userData);
    setLocal('users', users);
    this.logAudit(
      actingUser.id,
      actingUser.fullName,
      actingUser.role,
      'SAVE_USER',
      'settings',
      userData.id,
      userData.branchId,
      `Updated user account for ${userData.fullName} (${userData.role})`
    );
    this.notify();
  }

  static registerUser(userData: Partial<UserProfile>): UserProfile {
    const users = this.getUsers();
    const newUser: UserProfile = {
      id: `USR-${Date.now().toString().slice(-4)}`,
      fullName: userData.fullName || 'New Staff',
      username: userData.email?.split('@')[0] || `user${Date.now().toString().slice(-4)}`,
      email: userData.email || 'user@davetech.co.ke',
      phone: userData.phone || '+254 700 000 000',
      employeeNumber: `DT-EMP-${Date.now().toString().slice(-3)}`,
      role: userData.role || 'loan_officer',
      branchId: userData.branchId || 'BR-001',
      status: 'active',
      lastLogin: new Date().toISOString().replace('T', ' ').substring(0, 19),
      createdAt: new Date().toISOString().substring(0, 10),
    };
    users.unshift(newUser);
    setLocal('users', users);
    this.logAudit(
      newUser.id,
      newUser.fullName,
      newUser.role,
      'REGISTER_USER',
      'settings',
      newUser.id,
      newUser.branchId,
      `Registered new user account ${newUser.fullName} (${newUser.role})`
    );
    this.notify();
    return newUser;
  }

  // --- System Settings ---
  static getSettings(): SystemSettings {
    const raw = getLocal<SystemSettings>('settings', SEED_SETTINGS);
    return {
      ...SEED_SETTINGS,
      ...raw,
      platformName: (raw && typeof raw.platformName === 'string' && raw.platformName.trim() !== '') ? raw.platformName.trim() : SEED_SETTINGS.platformName,
      platformTitle: (raw && typeof raw.platformTitle === 'string') ? raw.platformTitle.trim() : SEED_SETTINGS.platformTitle,
      platformSubtitle: (raw && typeof raw.platformSubtitle === 'string') ? raw.platformSubtitle.trim() : SEED_SETTINGS.platformSubtitle,
      platformInitials: (raw && typeof raw.platformInitials === 'string' && raw.platformInitials.trim() !== '') ? raw.platformInitials.trim() : SEED_SETTINGS.platformInitials,
      logoUrl: (raw && typeof raw.logoUrl === 'string') ? raw.logoUrl : SEED_SETTINGS.logoUrl,
      logoType: (raw && raw.logoType) ? raw.logoType : (raw?.logoUrl ? 'image' : 'monogram'),
      companyName: (raw && typeof raw.companyName === 'string' && raw.companyName.trim() !== '') ? raw.companyName.trim() : SEED_SETTINGS.companyName,
      brandTagline: (raw && typeof raw.brandTagline === 'string') ? raw.brandTagline.trim() : SEED_SETTINGS.brandTagline,
      companyAddress: (raw && typeof raw.companyAddress === 'string') ? raw.companyAddress : SEED_SETTINGS.companyAddress,
      companyPhone: (raw && typeof raw.companyPhone === 'string') ? raw.companyPhone : SEED_SETTINGS.companyPhone,
      companyEmail: (raw && typeof raw.companyEmail === 'string') ? raw.companyEmail : SEED_SETTINGS.companyEmail,
      companyWebsite: (raw && typeof raw.companyWebsite === 'string') ? raw.companyWebsite : SEED_SETTINGS.companyWebsite,
      currencyCode: (raw && typeof raw.currencyCode === 'string') ? raw.currencyCode : SEED_SETTINGS.currencyCode,
      currencySymbol: (raw && typeof raw.currencySymbol === 'string') ? raw.currencySymbol : SEED_SETTINGS.currencySymbol,
      financialYearStart: (raw && typeof raw.financialYearStart === 'string') ? raw.financialYearStart : (SEED_SETTINGS.financialYearStart || 'January 1'),
      financialYearEnd: (raw && typeof raw.financialYearEnd === 'string') ? raw.financialYearEnd : (SEED_SETTINGS.financialYearEnd || 'December 31'),
      sessionTimeoutMinutes: (raw && typeof raw.sessionTimeoutMinutes === 'number') ? raw.sessionTimeoutMinutes : (SEED_SETTINGS.sessionTimeoutMinutes || 60),
      twoFactorAuthRequired: Boolean(raw?.twoFactorAuthRequired),
      autoBackupEnabled: raw?.autoBackupEnabled !== false,
      lastBackupDate: raw?.lastBackupDate || SEED_SETTINGS.lastBackupDate,
    };
  }

  static saveSettings(settings: SystemSettings, user: UserProfile): void {
    const normalized: SystemSettings = {
      ...settings,
      platformName: settings.platformName?.trim() || 'DAVETECH',
      platformTitle: settings.platformTitle !== undefined ? settings.platformTitle.trim() : 'ERP',
      platformSubtitle: settings.platformSubtitle !== undefined ? settings.platformSubtitle.trim() : 'Property, Asset & Secured Lending',
      platformInitials: (settings.platformInitials?.trim() || settings.platformName?.trim().charAt(0) || 'D').toUpperCase(),
      logoUrl: settings.logoUrl || '',
      logoType: settings.logoType || (settings.logoUrl ? 'image' : 'monogram'),
      companyName: settings.companyName?.trim() || 'Davetech Solutions Limited',
      brandTagline: settings.brandTagline !== undefined ? settings.brandTagline.trim() : 'Technology • Innovation • Efficiency',
      companyAddress: settings.companyAddress?.trim() || 'Davetech Towers, Upper Hill Road, Nairobi, Kenya',
      companyPhone: settings.companyPhone?.trim() || '+254 700 000 111 / +254 722 000 222',
      companyEmail: settings.companyEmail?.trim() || 'info@davetech.co.ke',
      companyWebsite: settings.companyWebsite?.trim() || 'https://davetech.co.ke',
      currencyCode: settings.currencyCode?.trim() || 'KES',
      currencySymbol: settings.currencySymbol?.trim() || 'KSh',
      financialYearStart: settings.financialYearStart?.trim() || 'January 1',
      financialYearEnd: settings.financialYearEnd?.trim() || 'December 31',
      sessionTimeoutMinutes: Number(settings.sessionTimeoutMinutes) || 60,
      twoFactorAuthRequired: Boolean(settings.twoFactorAuthRequired),
      autoBackupEnabled: settings.autoBackupEnabled !== false,
      lastBackupDate: settings.lastBackupDate || new Date().toISOString().replace('T', ' ').slice(0, 19),
    };

    // 1. Permanent Firestore Persistence
    try {
      const cleanData = JSON.parse(JSON.stringify(normalized));
      setDoc(doc(db, 'system_settings', 'config'), cleanData, { merge: true })
        .then(() => {
          this.isConnectedToFirestore = true;
        })
        .catch((err) => {
          handleFirestoreError(err, OperationType.WRITE, 'system_settings/config');
        });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'system_settings/config');
    }

    // 2. Local cache for instant zero-latency UI re-rendering
    setLocal('settings', normalized);

    // 3. Audit trail
    this.logAudit(
      user.id,
      user.fullName,
      user.role,
      'UPDATE_SYSTEM_SETTINGS',
      'settings',
      'SYS-SETTINGS',
      'all',
      `Updated platform branding ("${normalized.platformName}"), logo & corporate settings in database`
    );
    this.notify();
  }

  // --- Backup & Data Portability ---
  static exportAllData(): string {
    const backup = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      platform: this.getSettings().platformName || 'DAVETECH',
      companyName: this.getSettings().companyName,
      data: {
        settings: this.getSettings(),
        branches: this.getBranches(),
        users: this.getUsers(),
        customers: this.getCustomers(),
        assets: this.getAssets(),
        collaterals: this.getCollaterals(),
        valuations: this.getValuations(),
        loanProducts: this.getLoanProducts(),
        loanApplications: this.getApplications(),
        loans: this.getLoans(),
        repayments: this.getRepayments(),
        recoveryCases: this.getRecoveryCases(),
        properties: this.getProperties(),
        maintenanceRequests: this.getMaintenanceRequests(),
        cashAccounts: this.getCashAccounts(),
        auditLogs: this.getAuditLogs().slice(0, 200),
      },
    };
    return JSON.stringify(backup, null, 2);
  }

  static async importBackupData(jsonString: string, user: UserProfile): Promise<{ success: boolean; message: string }> {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed || !parsed.data) {
        throw new Error('Invalid backup file format: missing "data" node.');
      }
      const d = parsed.data;
      if (d.settings) {
        this.saveSettings(d.settings, user);
      }
      if (Array.isArray(d.branches)) setLocal('branches', d.branches);
      if (Array.isArray(d.users)) setLocal('users', d.users);
      if (Array.isArray(d.customers)) setLocal('customers', d.customers);
      if (Array.isArray(d.assets)) setLocal('assets', d.assets);
      if (Array.isArray(d.collaterals)) setLocal('collaterals', d.collaterals);
      if (Array.isArray(d.valuations)) setLocal('valuations', d.valuations);
      if (Array.isArray(d.loanProducts)) setLocal('loan_products', d.loanProducts);
      if (Array.isArray(d.loanApplications)) setLocal('loan_applications', d.loanApplications);
      if (Array.isArray(d.loans)) setLocal('loans', d.loans);
      if (Array.isArray(d.repayments)) setLocal('repayments', d.repayments);
      if (Array.isArray(d.recoveryCases)) setLocal('recovery_cases', d.recoveryCases);
      if (Array.isArray(d.properties)) setLocal('properties', d.properties);
      if (Array.isArray(d.maintenanceRequests)) setLocal('maintenance_requests', d.maintenanceRequests);

      // Persist restored settings to Firestore
      if (d.settings) {
        await this.persistDocToFirestore('system_settings', 'config', d.settings);
      }

      this.logAudit(
        user.id,
        user.fullName,
        user.role,
        'IMPORT_DATABASE_BACKUP',
        'settings',
        'BACKUP-RESTORE',
        'all',
        `Restored complete ERP database from backup created at ${parsed.exportedAt || 'unknown'}`
      );
      this.notify();
      return { success: true, message: 'Database successfully restored from backup.' };
    } catch (err: any) {
      return { success: false, message: err?.message || 'Failed to parse backup JSON.' };
    }
  }

  // --- Audit Logs & Notifications ---
  static getAuditLogs(): AuditLog[] {
    return getLocal<AuditLog[]>('audit_logs', SEED_AUDIT_LOGS);
  }

  static getNotifications(): NotificationItem[] {
    return getLocal<NotificationItem[]>('notifications', []);
  }

  static markNotificationRead(id: string): void {
    const notifs = this.getNotifications();
    const idx = notifs.findIndex((n) => n.id === id);
    if (idx !== -1) {
      notifs[idx].read = true;
      setLocal('notifications', notifs);
      this.notify();
    }
  }

  // --- Global Search ---
  static searchGlobal(queryStr: string): {
    customers: Customer[];
    assets: Asset[];
    loans: Loan[];
    collaterals: Collateral[];
    properties: PropertyListing[];
  } {
    const q = queryStr.trim().toLowerCase();
    if (!q) return { customers: [], assets: [], loans: [], collaterals: [], properties: [] };

    const customers = this.getCustomers().filter(
      (c) =>
        c.customerNumber?.toLowerCase().includes(q) ||
        c.fullName?.toLowerCase().includes(q) ||
        c.phone?.toLowerCase().includes(q) ||
        c.idNumber?.toLowerCase().includes(q) ||
        c.kraPin?.toLowerCase().includes(q)
    );

    const assets = this.getAssets().filter(
      (a) =>
        a.id?.toLowerCase().includes(q) ||
        a.titleOrName?.toLowerCase().includes(q) ||
        a.ownerName?.toLowerCase().includes(q) ||
        a.vehicleDetails?.registrationNumber?.toLowerCase().includes(q) ||
        a.vehicleDetails?.logbookNumber?.toLowerCase().includes(q) ||
        a.propertyDetails?.titleNumber?.toLowerCase().includes(q) ||
        a.propertyDetails?.parcelLrNumber?.toLowerCase().includes(q)
    );

    const loans = this.getLoans().filter(
      (l) =>
        l.loanNumber?.toLowerCase().includes(q) ||
        l.applicationId?.toLowerCase().includes(q) ||
        l.customerId?.toLowerCase().includes(q) ||
        l.disbursementReference?.toLowerCase().includes(q)
    );

    const collaterals = this.getCollaterals().filter(
      (c) =>
        c.id?.toLowerCase().includes(q) ||
        c.description?.toLowerCase().includes(q) ||
        c.storageLocation?.toLowerCase().includes(q) ||
        c.registrationSecurityRef?.toLowerCase().includes(q)
    );

    const properties = this.getProperties().filter(
      (p) =>
        p.id?.toLowerCase().includes(q) ||
        p.title?.toLowerCase().includes(q) ||
        p.location?.toLowerCase().includes(q) ||
        p.county?.toLowerCase().includes(q) ||
        p.titleDeedNumber?.toLowerCase().includes(q) ||
        p.tenantName?.toLowerCase().includes(q) ||
        p.tenantPhone?.toLowerCase().includes(q)
    );

    return { customers, assets, loans, collaterals, properties };
  }

  // --- Real Estate & Property Management ---
  static getProperties(): PropertyListing[] {
    return getLocal<PropertyListing[]>('properties', SEED_PROPERTIES);
  }

  static saveProperty(prop: PropertyListing, user: UserProfile): void {
    const list = this.getProperties();
    const idx = list.findIndex((p) => p.id === prop.id);
    if (idx !== -1) {
      list[idx] = prop;
    } else {
      list.unshift(prop);
    }
    setLocal('properties', list);
    this.logAudit(
      user.id,
      user.fullName,
      user.role,
      idx !== -1 ? 'UPDATE_PROPERTY' : 'CREATE_PROPERTY',
      'real_estate',
      prop.id,
      'BR-001',
      `Saved property listing: ${prop.title} (${prop.category.toUpperCase()})`
    );
    this.notify();
  }

  static deleteProperty(id: string, user: UserProfile): void {
    const list = this.getProperties().filter((p) => p.id !== id);
    setLocal('properties', list);
    this.logAudit(user.id, user.fullName, user.role, 'DELETE_PROPERTY', 'real_estate', id, 'BR-001', `Deleted property listing ${id}`);
    this.notify();
  }

  static getMaintenanceRequests(): MaintenanceRequest[] {
    return getLocal<MaintenanceRequest[]>('maintenance_requests', SEED_MAINTENANCE_REQUESTS);
  }

  static saveMaintenanceRequest(req: MaintenanceRequest, user: UserProfile): void {
    const list = this.getMaintenanceRequests();
    const idx = list.findIndex((m) => m.id === req.id);
    if (idx !== -1) {
      list[idx] = req;
    } else {
      list.unshift(req);
    }
    setLocal('maintenance_requests', list);
    this.logAudit(
      user.id,
      user.fullName,
      user.role,
      idx !== -1 ? 'UPDATE_MAINTENANCE' : 'CREATE_MAINTENANCE',
      'real_estate',
      req.id,
      'BR-001',
      `Saved maintenance request for ${req.propertyTitle}`
    );
    this.notify();
  }
}

