/**
 * DAVETECH ERP - Comprehensive Type Definitions
 * Property, Asset, Collateral & Secured Lending ERP
 * Davetech Solutions
 */

export type UserRole =
  | 'super_admin'
  | 'administrator'
  | 'branch_manager'
  | 'loan_officer'
  | 'credit_officer'
  | 'valuation_officer'
  | 'asset_officer'
  | 'cashier'
  | 'accountant'
  | 'recovery_officer'
  | 'custody_officer'
  | 'auditor'
  | 'customer';

export type UserStatus = 'active' | 'suspended' | 'disabled';

export interface UserProfile {
  id: string;
  fullName: string;
  username: string;
  email: string;
  phone: string;
  employeeNumber: string;
  role: UserRole;
  branchId: string; // 'all' for super_admin
  status: UserStatus;
  profilePhoto?: string;
  lastLogin?: string;
  createdAt: string;
}

export interface Branch {
  id: string;
  name: string;
  code: string;
  county: string;
  town?: string;
  address: string;
  phone: string;
  email?: string;
  managerId?: string;
  managerName?: string;
  status?: 'active' | 'inactive';
  active?: boolean;
}

export type CustomerType = 'individual' | 'business' | 'company' | 'organization';
export type RiskClassification = 'low' | 'medium' | 'high' | 'very_high';
export type CustomerStatus = 'active' | 'inactive' | 'blacklisted' | 'pending_kyc' | 'verified';

export interface CustomerDocument {
  id: string;
  docType: 'national_id' | 'passport' | 'kra_pin' | 'bank_statement' | 'utility_bill' | 'business_permit' | 'other';
  docNumber: string;
  docTitle: string;
  fileUrl?: string;
  uploadedAt: string;
  expiryDate?: string;
  verificationStatus: 'missing' | 'submitted' | 'under_review' | 'verified' | 'rejected' | 'expired';
  verifiedBy?: string;
  verificationNotes?: string;
}

export interface Customer {
  id: string; // e.g. CUS-2026-000001
  customerNumber: string;
  type: CustomerType;
  customerType?: CustomerType;
  fullName: string;
  idNumber: string; // National ID / Passport
  kraPin: string;
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other';
  phone: string;
  email: string;
  address: string;
  county: string;
  town: string;
  occupation: string;
  employer?: string;
  monthlyIncome: number;
  monthlyDeclaredIncome?: number;
  monthlyExpenses: number;
  businessName?: string;
  businessRegistrationNumber?: string;
  nextOfKinName?: string;
  nextOfKinPhone?: string;
  nextOfKinRelation?: string;
  idType?: string;
  subCounty?: string;
  maritalStatus?: string;
  kycStatus?: CustomerStatus;
  riskRating?: RiskClassification;
  kycDocuments?: any[];
  nextOfKin?: any[];
  bankDetails?: any;
  status: CustomerStatus;
  riskClassification: RiskClassification;
  branchId: string;
  creditScore: number;
  notes?: string;
  profilePhoto?: string;
  documents: CustomerDocument[];
  createdAt: string;
}

export type AssetCategory =
  | 'motor_vehicle'
  | 'land'
  | 'residential_property'
  | 'commercial_property'
  | 'machinery'
  | 'equipment'
  | 'electronics'
  | 'household_goods'
  | 'furniture'
  | 'agricultural_asset'
  | 'business_asset'
  | 'inventory'
  | 'other';

export type AssetStatus =
  | 'available'
  | 'verified'
  | 'under_verification'
  | 'pledged'
  | 'active_collateral'
  | 'released'
  | 'under_recovery'
  | 'recovered'
  | 'sold'
  | 'rejected'
  | 'archived';

export interface VehicleDetails {
  registrationNumber: string; // e.g. KCA 123A
  make: string; // Toyota
  model: string; // Probox / Fielder
  year?: number;
  yearOfManufacture?: number;
  color?: string;
  chassisVin?: string;
  chassisNumber?: string;
  engineNumber?: string;
  logbookNumber?: string;
  mileageKm?: number;
  mileage?: string | number;
  fuelType?: 'petrol' | 'diesel' | 'hybrid' | 'electric' | string;
  transmission?: 'automatic' | 'manual' | string;
  vehicleCategory?: 'sedan' | 'suv' | 'commercial' | 'pickup' | 'motorcycle' | 'truck' | 'van' | string;
  insuranceCompany?: string;
  insurancePolicyNumber?: string;
  insuranceExpiry?: string;
  trackingUnitInstalled?: boolean;
  trackingProvider?: string;
  jointOwnershipWithLender?: boolean;
  // Verification checklist items
  logbookSubmitted?: boolean;
  idOwnerVerified?: boolean;
  ownershipCheckedNtsa?: boolean;
  vehicleDetailsChecked?: boolean;
  valuationCompleted?: boolean;
  insuranceChecked?: boolean;
  existingChargesChecked?: boolean;
  finalVerificationPassed?: boolean;
}

export interface PropertyDetails {
  propertyType?: 'residential' | 'commercial' | 'agricultural' | 'industrial' | 'vacant_land' | 'apartment' | 'house' | 'office' | 'warehouse' | string;
  titleNumber?: string;
  titleDeedNumber?: string;
  parcelLrNumber?: string;
  parcelNumber?: string;
  approximateSize?: string;
  county?: string;
  subCounty?: string;
  town?: string;
  areaLocation?: string;
  sizeAcreage?: string;
  tenure?: 'freehold' | 'leasehold' | string;
  tenureType?: string;
  landUseType?: string;
  occupancyStatus?: 'owner_occupied' | 'tenanted' | 'vacant' | string;
  encumbrances?: string;
  existingEncumbrances?: string;
  registrySearchRef?: string;
  spousalConsentObtained?: boolean;
  titleVerificationPassed?: boolean;
  ratesClearancePassed?: boolean;
  ratesClearanceValid?: boolean;
  landControlBoardConsentPassed?: boolean;
  lcbConsentObtained?: boolean;
}

export interface Asset {
  id: string; // AST-2026-000001
  category: AssetCategory;
  customerId: string;
  ownerName: string;
  titleOrName: string;
  description?: string;
  location?: string;
  condition?: 'excellent' | 'good' | 'fair' | 'poor';
  marketValue: number;
  forcedSaleValue: number;
  purchaseValue?: number;
  acquisitionDate?: string;
  status: AssetStatus;
  branchId: string;
  photos?: string[];
  documents?: any[];
  valuationReports?: any[];
  verificationChecklist?: any;
  vehicleDetails?: VehicleDetails;
  propertyDetails?: PropertyDetails;
  itemDetails?: ItemDetails;
  notes?: string;
  createdAt: string;
}

export type CollateralStatus =
  | 'draft'
  | 'pending_verification'
  | 'verified'
  | 'pledged'
  | 'active'
  | 'released'
  | 'recovery'
  | 'sold'
  | 'rejected';

export interface CollateralDocument {
  id: string;
  name: string;
  type: 'logbook' | 'title_deed' | 'search_certificate' | 'valuation_report' | 'insurance_certificate' | 'security_agreement' | 'spousal_consent' | 'photo';
  fileUrl?: string;
  status: 'missing' | 'submitted' | 'under_review' | 'verified' | 'rejected';
  verifiedBy?: string;
  verifiedAt?: string;
  notes?: string;
}

export interface Collateral {
  id: string; // COL-2026-000001
  customerId: string;
  assetId: string;
  activeLoanId?: string;
  collateralType: AssetCategory;
  description: string;
  marketValue: number;
  forcedSaleValue: number;
  approvedCollateralValue: number;
  loanToValuePct: number; // e.g. 70%
  eligibleCollateralValue: number; // marketValue * (loanToValuePct / 100)
  status: CollateralStatus;
  custodian: string;
  storageLocation: string; // Safe box / Yard / Branch vault
  registrationSecurityRef?: string; // Security register / NTSA caveat reference / Land Registry charge ref
  verificationStatus: 'pending' | 'under_review' | 'verified' | 'rejected' | 'expired';
  verifiedBy?: string;
  verifiedAt?: string;
  pledgeDate?: string;
  releaseDate?: string;
  releasedBy?: string;
  customerAcknowledgementRef?: string;
  documents: CollateralDocument[];
  branchId: string;
  notes?: string;
  createdAt: string;
}

export interface Valuation {
  id: string; // VAL-2026-000001
  assetId: string;
  customerId: string;
  valuerName: string;
  valuerCompany: string;
  valuationDate: string;
  marketValue: number;
  forcedSaleValue: number;
  replacementValue?: number;
  distressValue?: number;
  recommendedLendingValue: number;
  status: 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected';
  approvedBy?: string;
  reportUrl?: string;
  photos: string[];
  notes: string;
  createdAt: string;
}

export type InterestMethod = 'flat_rate' | 'reducing_balance' | 'simple_interest';
export type RepaymentFrequency = 'weekly' | 'bi_weekly' | 'monthly';

export interface LoanProduct {
  id: string;
  name: string;
  code: string;
  description: string;
  minAmount: number;
  maxAmount: number;
  interestRatePerMonth: number; // e.g. 3.5%
  interestMethod: InterestMethod;
  processingFeePct?: number; // e.g. 3%
  processingFeePercentage?: number;
  insuranceFeePct?: number; // e.g. 1.5%
  insuranceFeePercentage?: number;
  legalFeePct?: number;
  penaltyRatePerMonth?: number; // e.g. 5%
  gracePeriodDays?: number;
  minDurationMonths?: number;
  maxDurationMonths?: number;
  minTenureMonths?: number;
  maxTenureMonths?: number;
  repaymentFrequency?: RepaymentFrequency;
  maxLtvPct?: number; // e.g. 70%
  maxLtvPercentage?: number;
  collateralType?: AssetCategory;
  requiredCollateralCategory?: AssetCategory[];
  approvalLevels?: number; // 1 to 4
  status?: 'active' | 'inactive';
  active?: boolean;
}

export type LoanApplicationStatus =
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'credit_assessment'
  | 'pending_approval'
  | 'approved'
  | 'rejected'
  | 'cancelled'
  | 'disbursed';

export interface LoanApplication {
  id: string; // APP-2026-000001
  applicationNumber: string;
  customerId: string;
  loanProductId: string;
  productId?: string;
  productName?: string;
  requestedAmount: number;
  proposedDurationMonths: number;
  requestedTenureMonths?: number;
  interestRatePerMonth?: number;
  interestMethod?: InterestMethod;
  purpose: string;
  collateralId?: string;
  repaymentFrequency?: RepaymentFrequency;
  debtServiceRatio?: number;
  loanToValuePct?: number;
  calculatedInstallment?: number;
  processingFee?: number;
  insuranceFee?: number;
  loanOfficerId: string;
  loanOfficerName?: string;
  branchId: string;
  status: LoanApplicationStatus;
  monthlyDeclaredIncome?: number;
  monthlyDeclaredExpenses?: number;
  existingLiabilities?: number;
  documents?: any[];
  creditAssessment?: any;
  source?: 'in_branch' | 'online_whatsapp' | 'agent_referral' | 'portal';
  applicationDate?: string;
  applicantDetails?: {
    fullName: string;
    idNumber: string;
    phone: string;
    alternatePhone?: string;
    email?: string;
    county?: string;
    physicalAddress?: string;
    employmentType?: string;
    employerOrBusiness?: string;
    monthlyIncome?: number;
    monthlyExpenses?: number;
    nextOfKinName?: string;
    nextOfKinPhone?: string;
    nextOfKinRelation?: string;
  };
  proposedCollateralDetails?: {
    category: AssetCategory;
    title: string;
    brand?: string;
    model?: string;
    serialOrRegNumber?: string;
    condition?: string;
    estimatedValue: number;
    description?: string;
    photos?: string[];
  };
  submissionIp?: string;
  clientSignature?: string;
  whatsappConfirmationSent?: boolean;
  statusHistory: {
    status: LoanApplicationStatus;
    changedBy: string;
    changedAt: string;
    comment: string;
  }[];
  createdAt: string;
}

export interface OnlineApplicationSubmission {
  // Step 1: Loan Requirements
  loanProductId: string;
  requestedAmount: number;
  durationMonths: number;
  repaymentFrequency: RepaymentFrequency;
  purpose: string;

  // Step 2: Personal KYC
  fullName: string;
  idNumber: string;
  phone: string;
  alternatePhone?: string;
  email?: string;
  county: string;
  physicalAddress: string;

  // Step 3: Income Profile
  employmentType: 'salaried' | 'business_owner' | 'informal_jua_kali' | 'agriculture' | 'freelancer';
  employerOrBusiness: string;
  monthlyIncome: number;
  monthlyExpenses: number;

  // Step 4: Proposed Security / Collateral
  hasCollateral: boolean;
  collateralCategory: AssetCategory;
  collateralTitle: string;
  collateralBrand?: string;
  collateralModel?: string;
  collateralSerialOrReg?: string;
  collateralCondition?: string;
  collateralEstimatedValue: number;
  collateralDescription?: string;
  photos?: string[]; // Data URLs or photo previews

  // Step 5: Next of Kin / Guarantor
  nextOfKinName: string;
  nextOfKinRelation: string;
  nextOfKinPhone: string;

  // Step 6: Consent
  agreedToCrbCheck: boolean;
  signatureText: string;
}

export interface CreditAssessment {
  id: string;
  applicationId: string;
  customerId: string;
  customerIncome: number;
  businessIncome: number;
  monthlyExpenses: number;
  netDisposableIncome: number;
  existingLoansRepayment: number;
  debtServiceRatioPct: number; // monthly debt obligations / total income * 100
  creditScore: number;
  riskRating: RiskClassification;
  collateralValue: number;
  collateralCoveragePct: number;
  eligibleLtvPct: number;
  maxAffordableInstallment: number;
  recommendedAmount: number;
  creditOfficerId: string;
  creditOfficerRecommendation: 'recommend_approval' | 'recommend_rejection' | 'request_more_collateral';
  notes: string;
  assessedAt: string;
}

export interface LoanApproval {
  id: string;
  applicationId: string;
  level: number; // 1: Loan Officer, 2: Credit Officer, 3: Branch Manager, 4: Senior Management
  approverId: string;
  approverName: string;
  approverRole: UserRole;
  approvedAmount: number;
  approvedDurationMonths: number;
  decision: 'approved' | 'rejected' | 'referred_back';
  comments: string;
  date: string;
}

export type LoanStatus =
  | 'active'
  | 'restructured'
  | 'overdue'
  | 'in_recovery'
  | 'paid_off'
  | 'closed';

export interface InstallmentScheduleItem {
  installmentNumber: number;
  dueDate: string;
  principalDue: number;
  interestDue: number;
  feesDue: number;
  totalInstallment: number;
  principalPaid: number;
  interestPaid: number;
  feesPaid: number;
  penaltiesPaid: number;
  totalPaid: number;
  outstandingBalance: number;
  status: 'pending' | 'paid' | 'partial' | 'overdue';
  daysOverdue: number;
}

export interface Loan {
  id: string; // LOAN-2026-000001
  loanNumber: string;
  applicationId: string;
  customerId: string;
  loanProductId: string;
  collateralId?: string;
  branchId: string;
  principal: number;
  interestRatePerMonth: number;
  interestMethod: InterestMethod;
  durationMonths: number;
  repaymentFrequency: RepaymentFrequency;
  installmentAmount: number;
  totalInterest: number;
  processingFee: number;
  insuranceFee: number;
  totalPayable: number;
  totalPaid: number;
  outstandingPrincipal: number;
  outstandingInterest: number;
  outstandingFees: number;
  outstandingPenalties: number;
  totalOutstanding: number;
  disbursementDate: string;
  disbursementMethod: 'cash' | 'bank' | 'mobile_money' | 'cheque';
  disbursementReference: string;
  maturityDate: string;
  nextPaymentDate: string;
  nextDueDate?: string;
  status: LoanStatus;
  daysInArrears: number;
  loanOfficerId: string;
  schedule: InstallmentScheduleItem[];
  isRestructured?: boolean;
  restructureReason?: string;
  restructuredDate?: string;
  clearedDate?: string;
  createdAt: string;
}

export type PaymentMethod = 'mobile_money' | 'bank_transfer' | 'cash' | 'cheque';

export interface Repayment {
  id: string; // REC-2026-000001
  receiptNumber: string;
  loanId: string;
  customerId: string;
  branchId: string;
  amount: number;
  paymentDate: string;
  paymentMethod: PaymentMethod;
  transactionReference: string; // M-Pesa ref or Bank slip ref
  principalAllocation: number;
  interestAllocation: number;
  feesAllocation: number;
  penaltyAllocation: number;
  receivedById: string;
  receivedByName: string;
  notes?: string;
  status: 'posted' | 'reversed';
  reversalReason?: string;
  reversedBy?: string;
  reversedAt?: string;
  createdAt: string;
}

export type RecoveryCaseStatus =
  | 'watchlist'
  | 'reminder'
  | 'demand_notice'
  | 'recovery_initiated'
  | 'collateral_recovery'
  | 'legal_review'
  | 'auction_preparation'
  | 'sold'
  | 'settled'
  | 'closed';

export interface RecoveryCase {
  id: string; // RC-2026-000001
  loanId: string;
  customerId: string;
  collateralId?: string;
  branchId: string;
  daysOverdue: number;
  overdueAmount: number;
  totalOutstanding: number;
  status: RecoveryCaseStatus;
  recoveryOfficerId: string;
  lastFollowUpDate: string;
  nextActionDate: string;
  actions: {
    id: string;
    actionType: 'call' | 'visit' | 'demand_letter' | 'repossess_notice' | 'seizure' | 'auction' | 'settlement_agreement';
    description: string;
    outcome: string;
    officerName: string;
    timestamp: string;
  }[];
  createdAt: string;
}

export interface AuctionDisposal {
  id: string;
  recoveryCaseId: string;
  assetId: string;
  loanId: string;
  customerId: string;
  reservePrice: number;
  auctionDate: string;
  auctionVenue: string;
  valuerName: string;
  buyerName?: string;
  buyerContact?: string;
  salePrice: number;
  disposalCosts: number;
  netProceeds: number;
  outstandingBalanceAtSale: number;
  surplusShortfall: number; // positive = surplus returned to borrower, negative = remaining shortfall
  status: 'scheduled' | 'in_progress' | 'sold' | 'cancelled' | 'unsold';
  notes: string;
}

export interface CashAccount {
  id: string;
  accountName: string;
  accountType: 'cash_in_hand' | 'bank' | 'mobile_money_till' | 'mobile_money_paybill';
  accountNumber: string;
  bankName?: string;
  branchId: string;
  balance: number;
  status: 'active' | 'frozen';
}

export interface JournalEntry {
  id: string;
  date: string;
  entryDate?: string;
  reference: string;
  description: string;
  debitAccount?: string;
  creditAccount?: string;
  amount?: number;
  branchId: string;
  createdBy?: string;
  lines?: JournalLine[];
  isReversed?: boolean;
  transactionType?: 'disbursement' | 'repayment' | 'penalty_charge' | 'fee_charge' | 'cash_deposit' | 'cash_withdrawal' | 'reversal' | 'manual_journal';
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: string;
  module: 'customers' | 'assets' | 'collateral' | 'loans' | 'repayments' | 'approvals' | 'recovery' | 'accounting' | 'settings' | 'auth' | 'real_estate';
  recordId: string;
  branchId: string;
  details: string;
  ipAddress?: string;
  timestamp: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  module: string;
  targetId?: string;
  branchId?: string;
  read: boolean;
  timestamp: string;
}

export interface SystemSettings {
  platformName?: string; // e.g. "DAVETECH"
  platformTitle?: string; // e.g. "ERP"
  platformSubtitle?: string; // e.g. "Property, Asset & Secured Lending"
  platformInitials?: string; // e.g. "D"
  logoUrl?: string; // Base64 data URL or external image URL
  logoType?: 'monogram' | 'image'; // 'monogram' (Davetech badge) or 'image'
  companyName: string;
  brandTagline: string;
  companyAddress: string;
  companyPhone: string;
  companyEmail: string;
  companyWebsite: string;
  kraPin: string;
  registrationNumber: string;
  currencyCode: string; // KES
  currencySymbol: string; // KSh
  financialYearStart?: string; // e.g. "January 1"
  financialYearEnd?: string; // e.g. "December 31"
  defaultLtvPct: number; // e.g. 70%
  defaultGracePeriodDays: number;
  defaultPenaltyRateMonthly: number;
  paymentAllocationOrder: ('penalties' | 'fees' | 'interest' | 'principal')[];
  approvalLimits: {
    branchManager: number;
    seniorOfficer: number;
    seniorManagement: number;
  };
  smsAlertsEnabled: boolean;
  emailAlertsEnabled: boolean;
  requireCollateralVerificationBeforeApproval: boolean;
  sessionTimeoutMinutes?: number;
  twoFactorAuthRequired?: boolean;
  autoBackupEnabled?: boolean;
  lastBackupDate?: string;
}

export type RiskRating = RiskClassification;
export type KycStatus = CustomerStatus;
export type LoanScheduleItem = InstallmentScheduleItem;

export interface ChartOfAccount {
  id: string;
  code: string;
  name: string;
  category: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  debitBalance: number;
  creditBalance: number;
  description?: string;
  active: boolean;
}

export interface JournalLine {
  id?: string;
  accountId?: string;
  accountCode: string;
  accountName: string;
  debit: number;
  credit: number;
  description?: string;
}

export type PropertyType = 'land_plot' | 'house_rental' | 'commercial' | 'apartment';

export interface PropertyListing {
  id: string;
  title: string;
  propertyType: PropertyType;
  category: 'sale' | 'rent';
  location: string;
  county: string;
  size: string; // e.g., "50x100 ft" or "0.25 Acres" or "3 Bedroom"
  price: number; // Sale price or Monthly Rent
  deposit?: number;
  titleDeedNumber?: string;
  status: 'available' | 'reserved' | 'sold' | 'occupied' | 'maintenance';
  description: string;
  features: string[];
  image: string;
  tenantName?: string;
  tenantPhone?: string;
  leaseStart?: string;
  leaseEnd?: string;
  createdAt: string;
}

export interface MaintenanceRequest {
  id: string;
  propertyId: string;
  propertyTitle: string;
  tenantName: string;
  issue: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'resolved';
  cost: number;
  dateReported: string;
}

// ----------------------------------------------------
// Household Items & Chattel Financing Types
// ----------------------------------------------------
export type HouseholdItemType =
  | 'tv'
  | 'woofer'
  | 'chair'
  | 'fridge'
  | 'microwave'
  | 'laptop'
  | 'phone'
  | 'cooker'
  | 'furniture'
  | 'generator'
  | 'solar_system'
  | 'other';

export interface ItemDetails {
  itemType: HouseholdItemType;
  brand: string;
  model: string;
  serialNumber?: string;
  color?: string;
  screenSize?: string; // e.g. '55 Inch Smart 4K UHD'
  powerWattage?: string; // e.g. '300W RMS'
  material?: string; // e.g. 'Genuine Leather / Hardwood Mahogany'
  condition: 'brand_new' | 'mint' | 'good' | 'fair';
  accessoriesIncluded?: string[]; // e.g. ['Remote Control', 'Power Cable', 'Wall Mount']
  custodyType: 'in_branch_vault' | 'held_by_borrower_chattel';
  custodyLocation?: string;
  originalReceiptOrReceiptProof?: boolean;
}

export interface ItemLoanAgreement {
  id: string; // e.g. AGR-ITEM-2026-000001
  agreementNumber: string; // e.g. DT/AGR/ITEM/2026/014
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerIdNumber: string;
  customerEmail?: string;
  customerAddress?: string;

  // Item Information
  itemId?: string;
  itemType: HouseholdItemType;
  itemTitle: string;
  itemBrand: string;
  itemModel: string;
  itemSerialNumber?: string;
  itemCondition: string;
  itemMarketValue: number;
  itemForcedSaleValue: number;
  accessoriesIncluded: string[];
  custodyType: 'in_branch_vault' | 'held_by_borrower_chattel';
  custodyLocation?: string;

  // Loan Financials
  principalAmount: number;
  durationMonths: number;
  interestRateMonthly: number;
  interestMethod: 'flat_rate' | 'reducing_balance';
  monthlyInstallment: number;
  totalInterest: number;
  totalPayable: number;
  processingFee: number;
  insuranceFee?: number;
  disbursedAmount: number;
  gracePeriodDays: number;
  penaltyRateMonthly: number;
  repaymentFrequency: 'weekly' | 'bi_weekly' | 'monthly';

  // Agreement Workflow
  status: 'draft' | 'sent_to_client' | 'signed' | 'active_loan' | 'completed' | 'cancelled';
  draftedBy: string;
  draftedAt: string;
  sentAt?: string;
  sentVia?: 'whatsapp' | 'email' | 'direct_link' | 'printed';

  // Digital Signature & Acceptance
  signedAt?: string;
  signedByName?: string;
  clientSignatureData?: string;
  clientIpOrDevice?: string;
  witnessName?: string;
  lenderSignatoryName?: string;

  notes?: string;
  onlineShareableToken?: string;
}



