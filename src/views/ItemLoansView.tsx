/**
 * DAVETECH ERP - Item Loans & Chattel Financing View
 * Supports loans on household goods (Smart TVs, Woofers, Living Room Chairs/Sofas, Fridges, Laptops)
 * and drafts online agreement letters that can be dispatched to clients via WhatsApp, Email, or Web Link.
 */

import React, { useState, useMemo } from 'react';
import {
  Tv,
  Speaker,
  Armchair,
  Laptop,
  Refrigerator,
  Smartphone,
  Plus,
  Send,
  Printer,
  Share2,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  DollarSign,
  Shield,
  Search,
  Filter,
  ExternalLink,
  Copy,
  Check,
  Sparkles,
  ArrowRight,
  Download,
  Trash2,
  Lock,
  UserCheck,
  ChevronRight,
  Zap,
  Info,
} from 'lucide-react';
import { DataService } from '../services/dataService';
import { LoanEngine } from '../services/loanEngine';
import { useAuth } from '../context/AuthContext';
import { ItemLoanAgreement, HouseholdItemType, Asset, Customer } from '../types/erp';
import { Modal } from '../components/common/Modal';
import { PrintTemplate } from '../components/common/PrintTemplate';

// Item Categories and icon lookup
export const ITEM_CATEGORIES: {
  type: HouseholdItemType;
  label: string;
  icon: any;
  benchmarkValue: number;
  sampleBrand: string;
  sampleModel: string;
  sampleAccessories: string[];
}[] = [
  {
    type: 'tv',
    label: 'Smart TVs & Screens',
    icon: Tv,
    benchmarkValue: 65000,
    sampleBrand: 'Sony / Samsung / LG',
    sampleModel: '55" 4K UHD Smart Android TV',
    sampleAccessories: ['Smart Voice Remote', 'Power Cable', 'Wall Bracket', 'Table Stands'],
  },
  {
    type: 'woofer',
    label: 'Woofers & Sound Systems',
    icon: Speaker,
    benchmarkValue: 28000,
    sampleBrand: 'Tagwood / Vitron / Sony',
    sampleModel: '5.1ch High-Bass Multimedia Sound System',
    sampleAccessories: ['5 Satellite Speakers', 'Audio RCA/AUX Cables', 'Remote Control', 'FM Antenna'],
  },
  {
    type: 'chair',
    label: 'Chairs & Living Room Furniture',
    icon: Armchair,
    benchmarkValue: 120000,
    sampleBrand: 'Victoria Courts / Custom Oak',
    sampleModel: 'Executive 7-Seater Recliner Living Room Sofa Set',
    sampleAccessories: ['Accent Throw Cushions', 'Manufacturer Warranty Card'],
  },
  {
    type: 'fridge',
    label: 'Refrigerators & Freezers',
    icon: Refrigerator,
    benchmarkValue: 55000,
    sampleBrand: 'Samsung / Ramtons / LG',
    sampleModel: '260L Double Door No-Frost Digital Inverter Refrigerator',
    sampleAccessories: ['Ice Box & Tray', 'Egg Shelf Rack', 'Operation Manual'],
  },
  {
    type: 'laptop',
    label: 'Laptops & Computers',
    icon: Laptop,
    benchmarkValue: 75000,
    sampleBrand: 'HP / Dell / Lenovo / Apple',
    sampleModel: 'Core i7 16GB RAM 512GB SSD Laptop',
    sampleAccessories: ['Original Fast Charger', 'Laptop Carry Bag'],
  },
  {
    type: 'phone',
    label: 'Smartphones & Tablets',
    icon: Smartphone,
    benchmarkValue: 60000,
    sampleBrand: 'Apple iPhone / Samsung Galaxy',
    sampleModel: '256GB Dual SIM Smartphone',
    sampleAccessories: ['Original Fast Charger Cable', 'Protective Armor Case'],
  },
];

export const ItemLoansView: React.FC = () => {
  const { currentUser, systemSettings } = useAuth();

  // State from DataService
  const agreements = DataService.getItemAgreements();
  const customers = DataService.getCustomers();
  const assets = DataService.getAssets().filter(
    (a) => a.category === 'household_goods' || a.category === 'furniture' || a.category === 'electronics'
  );

  // Tabs
  const [activeTab, setActiveTab] = useState<'agreements' | 'drafter' | 'catalog'>('agreements');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  // Selected agreement for viewing / letter modal
  const [selectedAgreement, setSelectedAgreement] = useState<ItemLoanAgreement | null>(null);
  const [isLetterModalOpen, setIsLetterModalOpen] = useState(false);

  // Online Sign Modal
  const [isSignModalOpen, setIsSignModalOpen] = useState(false);
  const [signingName, setSigningName] = useState('');
  const [signingNationalId, setSigningNationalId] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [signatureText, setSignatureText] = useState('');

  // Share Modal (WhatsApp / Email / Link)
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Print Template Modal
  const [isPrintOpen, setIsPrintOpen] = useState(false);

  // Auto-detect online agreement token from URL hash (e.g. #item-agreement-AGR-...)
  React.useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash;
      if (hash.startsWith('#item-agreement-')) {
        const token = hash.replace('#item-agreement-', '');
        const match = agreements.find(
          (a) => a.onlineShareableToken === token || a.id === token || a.agreementNumber === token
        );
        if (match) {
          setSelectedAgreement(match);
          setIsLetterModalOpen(true);
        }
      }
    };
    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, [agreements]);

  // --- Drafter Form State ---
  const [draftCustomerId, setDraftCustomerId] = useState<string>(customers[0]?.id || '');
  const [draftCustomerName, setDraftCustomerName] = useState<string>(customers[0]?.fullName || '');
  const [draftCustomerPhone, setDraftCustomerPhone] = useState<string>(customers[0]?.phone || '');
  const [draftCustomerIdNumber, setDraftCustomerIdNumber] = useState<string>(customers[0]?.idNumber || '');
  const [draftCustomerEmail, setDraftCustomerEmail] = useState<string>(customers[0]?.email || '');
  const [draftCustomerAddress, setDraftCustomerAddress] = useState<string>(customers[0]?.address || '');

  // Item details
  const [draftItemType, setDraftItemType] = useState<HouseholdItemType>('tv');
  const [draftItemTitle, setDraftItemTitle] = useState<string>('Sony Bravia 55" 4K UHD Smart Android TV');
  const [draftItemBrand, setDraftItemBrand] = useState<string>('Sony');
  const [draftItemModel, setDraftItemModel] = useState<string>('Bravia KD-55X80K');
  const [draftItemSerial, setDraftItemSerial] = useState<string>('SN-SONY-55-98312A');
  const [draftItemCondition, setDraftItemCondition] = useState<string>('Mint working condition, screen tested with zero dead pixels');
  const [draftItemMarketValue, setDraftItemMarketValue] = useState<number>(75000);
  const [draftItemForcedSaleValue, setDraftItemForcedSaleValue] = useState<number>(52000);
  const [draftAccessories, setDraftAccessories] = useState<string>('Smart Voice Remote, Power Cable, Wall Bracket');
  const [draftCustodyType, setDraftCustodyType] = useState<'in_branch_vault' | 'held_by_borrower_chattel'>('in_branch_vault');
  const [draftCustodyLocation, setDraftCustodyLocation] = useState<string>('Nairobi Main Branch Vault (Rack B-02)');

  // Loan terms
  const [draftPrincipal, setDraftPrincipal] = useState<number>(30000);
  const [draftDurationMonths, setDraftDurationMonths] = useState<number>(3);
  const [draftInterestRateMonthly, setDraftInterestRateMonthly] = useState<number>(4.0);
  const [draftProcessingFeePct, setDraftProcessingFeePct] = useState<number>(3.0);
  const [draftGraceDays, setDraftGraceDays] = useState<number>(5);
  const [draftPenaltyRate, setDraftPenaltyRate] = useState<number>(5.0);
  const [draftNotes, setDraftNotes] = useState<string>('Client applying for instant asset chattel loan.');

  // Calculation helpers
  const calculatedCalculations = useMemo(() => {
    const totalInterest = Math.round(draftPrincipal * (draftInterestRateMonthly / 100) * draftDurationMonths);
    const totalPayable = draftPrincipal + totalInterest;
    const monthlyInstallment = Math.round(totalPayable / draftDurationMonths);
    const processingFee = Math.round((draftPrincipal * draftProcessingFeePct) / 100);
    const disbursedAmount = draftPrincipal - processingFee;
    const ltvPct = draftItemForcedSaleValue > 0 ? Math.round((draftPrincipal / draftItemForcedSaleValue) * 100) : 0;

    return {
      totalInterest,
      totalPayable,
      monthlyInstallment,
      processingFee,
      disbursedAmount,
      ltvPct,
    };
  }, [draftPrincipal, draftDurationMonths, draftInterestRateMonthly, draftProcessingFeePct, draftItemForcedSaleValue]);

  // Handle customer selection change
  const handleSelectCustomer = (cId: string) => {
    setDraftCustomerId(cId);
    const cust = customers.find((c) => c.id === cId);
    if (cust) {
      setDraftCustomerName(cust.fullName);
      setDraftCustomerPhone(cust.phone);
      setDraftCustomerIdNumber(cust.idNumber);
      setDraftCustomerEmail(cust.email || '');
      setDraftCustomerAddress(`${cust.address || ''}, ${cust.county || ''}`);
    }
  };

  // Handle category preset click
  const handleApplyCategoryPreset = (category: typeof ITEM_CATEGORIES[0]) => {
    setDraftItemType(category.type);
    setDraftItemBrand(category.sampleBrand.split('/')[0].trim());
    setDraftItemModel(category.sampleModel);
    setDraftItemTitle(`${category.sampleBrand.split('/')[0].trim()} ${category.sampleModel}`);
    setDraftItemMarketValue(category.benchmarkValue);
    setDraftItemForcedSaleValue(Math.round(category.benchmarkValue * 0.7));
    setDraftPrincipal(Math.round(category.benchmarkValue * 0.5));
    setDraftAccessories(category.sampleAccessories.join(', '));
  };

  // Save drafted agreement
  const handleSaveDraftAgreement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    const newAgreement = DataService.saveItemAgreement(
      {
        customerId: draftCustomerId,
        customerName: draftCustomerName,
        customerPhone: draftCustomerPhone,
        customerIdNumber: draftCustomerIdNumber,
        customerEmail: draftCustomerEmail,
        customerAddress: draftCustomerAddress,
        itemType: draftItemType,
        itemTitle: draftItemTitle,
        itemBrand: draftItemBrand,
        itemModel: draftItemModel,
        itemSerialNumber: draftItemSerial,
        itemCondition: draftItemCondition,
        itemMarketValue: draftItemMarketValue,
        itemForcedSaleValue: draftItemForcedSaleValue,
        accessoriesIncluded: draftAccessories.split(',').map((s) => s.trim()).filter(Boolean),
        custodyType: draftCustodyType,
        custodyLocation: draftCustodyLocation,
        principalAmount: draftPrincipal,
        durationMonths: draftDurationMonths,
        interestRateMonthly: draftInterestRateMonthly,
        interestMethod: 'flat_rate',
        monthlyInstallment: calculatedCalculations.monthlyInstallment,
        totalInterest: calculatedCalculations.totalInterest,
        totalPayable: calculatedCalculations.totalPayable,
        processingFee: calculatedCalculations.processingFee,
        disbursedAmount: calculatedCalculations.disbursedAmount,
        gracePeriodDays: draftGraceDays,
        penaltyRateMonthly: draftPenaltyRate,
        repaymentFrequency: 'monthly',
        status: 'draft',
        notes: draftNotes,
      },
      currentUser
    );

    setSelectedAgreement(newAgreement);
    setIsLetterModalOpen(true);
    setActiveTab('agreements');
  };

  // Sign online submission
  const handleOnlineSignSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAgreement) return;

    const updated = DataService.signAgreementOnline(selectedAgreement.id, {
      clientName: signingName || selectedAgreement.customerName,
      signature: signatureText || `ONLINE_SIGNED_${signingName.toUpperCase().replace(/\s+/g, '_')}_ID_${signingNationalId}`,
      ipOrDevice: `Web Client (${navigator.userAgent.substring(0, 40)}...)`,
      notes: `Digitally signed by ${signingName} (ID: ${signingNationalId}) with confirmed chattel terms.`,
    });

    setSelectedAgreement(updated);
    setIsSignModalOpen(false);
  };

  // Disburse agreement to active loan
  const handleDisburseToLoan = () => {
    if (!selectedAgreement || !currentUser) return;
    try {
      const loan = DataService.convertAgreementToLoan(selectedAgreement.id, currentUser);
      alert(`🎉 Loan ${loan.loanNumber} successfully disbursed! Principal of ${LoanEngine.formatKES(loan.principal)} sent to ${selectedAgreement.customerName} via M-Pesa B2C.`);
      setSelectedAgreement({ ...selectedAgreement, status: 'active_loan' });
    } catch (err: any) {
      alert(`Error disbursing loan: ${err.message}`);
    }
  };

  // Filtered agreements
  const filteredAgreements = useMemo(() => {
    return agreements.filter((a) => {
      const matchSearch =
        a.agreementNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.itemTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (a.itemSerialNumber && a.itemSerialNumber.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchStatus = statusFilter === 'all' || a.status === statusFilter;
      const matchType = typeFilter === 'all' || a.itemType === typeFilter;
      return matchSearch && matchStatus && matchType;
    });
  }, [agreements, searchTerm, statusFilter, typeFilter]);

  // Online URL generator for the agreement
  const getShareableUrl = (agreement: ItemLoanAgreement) => {
    const origin = window.location.origin;
    return `${origin}/#item-agreement-${agreement.onlineShareableToken || agreement.id}`;
  };

  // WhatsApp link generator
  const getWhatsAppShareUrl = (agreement: ItemLoanAgreement) => {
    const cleanPhone = agreement.customerPhone.replace(/[^0-9]/g, '');
    const phone = cleanPhone.startsWith('0') ? `254${cleanPhone.substring(1)}` : cleanPhone;
    const shareUrl = getShareableUrl(agreement);
    const message = `Hello ${agreement.customerName},\n\nYour *${systemSettings?.platformName || 'Davetech'} Item Loan Agreement* for your *${agreement.itemTitle}* is ready for your review and digital signature!\n\n📋 *Facility Details:*\n- Agreement No: ${agreement.agreementNumber}\n- Sanctioned Principal: ${LoanEngine.formatKES(agreement.principalAmount)}\n- Monthly Installment: ${LoanEngine.formatKES(agreement.monthlyInstallment)} / month\n- Tenure: ${agreement.durationMonths} Month(s)\n- Collateral Item: ${agreement.itemTitle} (${agreement.itemBrand})\n\n✍️ *Review & Sign Your Agreement Online Here:*\n${shareUrl}\n\nUpon signing, funds are instantly disbursed to your M-Pesa. Thank you for choosing ${systemSettings?.companyName || 'Davetech Solutions'}!`;
    return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  };

  // Email mailto link
  const getEmailShareUrl = (agreement: ItemLoanAgreement) => {
    const shareUrl = getShareableUrl(agreement);
    const subject = `Davetech Item Loan Agreement - ${agreement.agreementNumber} (${agreement.itemTitle})`;
    const body = `Dear ${agreement.customerName},\n\nYour chattel item loan agreement for ${agreement.itemTitle} has been drafted. Please find your loan terms below:\n\n- Principal: ${LoanEngine.formatKES(agreement.principalAmount)}\n- Monthly Repayment: ${LoanEngine.formatKES(agreement.monthlyInstallment)}\n- Tenure: ${agreement.durationMonths} Month(s)\n\nPlease review and digitally accept your agreement online at:\n${shareUrl}\n\nWarm regards,\n${systemSettings?.companyName || 'Davetech Solutions'}`;
    return `mailto:${agreement.customerEmail || ''}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-indigo-900 via-slate-900 to-slate-900 text-white shadow-lg border border-indigo-800/40">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-indigo-500/30 text-indigo-300 border border-indigo-400/30 flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Chattel Micro-Financing & Item Pledging
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Kenyan Chattels Act Cap 28
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight mt-1 text-white flex items-center gap-2">
            Loans on Household Items <span className="text-indigo-400 text-lg font-medium">(TVs, Woofers, Chairs & Electronics)</span>
          </h1>
          <p className="text-xs text-slate-300 max-w-2xl mt-1">
            Accept collateralized pledges on household goods, draft legally enforceable chattel mortgage agreements, and send online digital signing letters directly to clients via WhatsApp and Email.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('drafter')}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Draft Item Agreement
          </button>
        </div>
      </div>

      {/* Metric Cards Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Item Agreements</span>
            <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-2">{agreements.length}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {agreements.filter((a) => a.status === 'signed' || a.status === 'active_loan').length} signed & active
          </p>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Sanctioned Value</span>
            <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-2">
            {LoanEngine.formatKES(agreements.reduce((sum, a) => sum + a.principalAmount, 0))}
          </p>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5">Avg. loan {LoanEngine.formatKES(Math.round(agreements.reduce((sum, a) => sum + a.principalAmount, 0) / (agreements.length || 1)))}</p>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Pledged Asset FSV</span>
            <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">
              <Shield className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-2">
            {LoanEngine.formatKES(agreements.reduce((sum, a) => sum + a.itemForcedSaleValue, 0))}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">Over-collateralized at 60-70% LTV</p>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Awaiting Client Sign</span>
            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-2">
            {agreements.filter((a) => a.status === 'sent_to_client' || a.status === 'draft').length}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">Ready for WhatsApp link dispatch</p>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-700 gap-6">
        <button
          onClick={() => setActiveTab('agreements')}
          className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
            activeTab === 'agreements'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
          }`}
        >
          <FileText className="w-4 h-4" /> Agreements & Client Dispatch ({agreements.length})
        </button>

        <button
          onClick={() => setActiveTab('drafter')}
          className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
            activeTab === 'drafter'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
          }`}
        >
          <Zap className="w-4 h-4" /> Draft New Agreement & Calculator
        </button>

        <button
          onClick={() => setActiveTab('catalog')}
          className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
            activeTab === 'catalog'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
          }`}
        >
          <Tv className="w-4 h-4" /> Household Items Valuation Guide
        </button>
      </div>

      {/* TAB 1: AGREEMENTS LIST & CLIENT DISPATCH */}
      {activeTab === 'agreements' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search agreement #, customer, item..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-xs px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg"
              >
                <option value="all">All Statuses</option>
                <option value="draft">Draft</option>
                <option value="sent_to_client">Sent to Client</option>
                <option value="signed">Signed & Accepted</option>
                <option value="active_loan">Active Disbursed Loan</option>
              </select>

              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="text-xs px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg"
              >
                <option value="all">All Categories</option>
                <option value="tv">Smart TVs</option>
                <option value="woofer">Woofers & Audio</option>
                <option value="chair">Chairs & Sofas</option>
                <option value="fridge">Fridges</option>
                <option value="laptop">Laptops</option>
              </select>
            </div>
          </div>

          {/* Agreements Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAgreements.map((agreement) => {
              const categoryMatch = ITEM_CATEGORIES.find((c) => c.type === agreement.itemType);
              const CategoryIcon = categoryMatch?.icon || Tv;

              return (
                <div
                  key={agreement.id}
                  className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs hover:border-indigo-300 dark:hover:border-indigo-600 transition-all flex flex-col justify-between"
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2 border-b border-slate-100 dark:border-slate-700/60 pb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400">
                          <CategoryIcon className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="text-[10px] font-mono text-slate-400 font-semibold">{agreement.agreementNumber}</span>
                          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-tight">
                            {agreement.customerName}
                          </h3>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                            {agreement.customerPhone}
                          </p>
                        </div>
                      </div>

                      {/* Status badge */}
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          agreement.status === 'signed'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700'
                            : agreement.status === 'active_loan'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-300 dark:border-blue-700'
                            : agreement.status === 'sent_to_client'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-300 dark:border-amber-700'
                            : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {agreement.status.replace(/_/g, ' ')}
                      </span>
                    </div>

                    {/* Item Information */}
                    <div className="py-3 border-b border-slate-100 dark:border-slate-700/60 space-y-1.5 text-xs">
                      <div className="font-semibold text-slate-800 dark:text-slate-200 line-clamp-1">
                        {agreement.itemTitle}
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                        <span>Brand & Model:</span>
                        <span className="font-medium text-slate-700 dark:text-slate-300">{agreement.itemBrand} {agreement.itemModel}</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                        <span>Serial/Tag:</span>
                        <span>{agreement.itemSerialNumber || 'CHATTEL-TAGGED'}</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                        <span>Custody:</span>
                        <span className="font-medium text-slate-700 dark:text-slate-300">
                          {agreement.custodyType === 'in_branch_vault' ? '🏛️ Branch Vault' : '🏠 Borrower Residence'}
                        </span>
                      </div>
                    </div>

                    {/* Financial Numbers */}
                    <div className="py-3 grid grid-cols-2 gap-2 bg-slate-50 dark:bg-slate-900/60 rounded-xl p-3 my-3 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase font-semibold">Principal</span>
                        <p className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                          {LoanEngine.formatKES(agreement.principalAmount)}
                        </p>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase font-semibold">Installment</span>
                        <p className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                          {LoanEngine.formatKES(agreement.monthlyInstallment)}/mo
                        </p>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase font-semibold">Duration</span>
                        <p className="font-medium text-slate-700 dark:text-slate-300">
                          {agreement.durationMonths} Mo @ {agreement.interestRateMonthly}%
                        </p>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase font-semibold">Item FSV</span>
                        <p className="font-medium text-slate-700 dark:text-slate-300">
                          {LoanEngine.formatKES(agreement.itemForcedSaleValue)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Actions & Dispatch Bar */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 space-y-2">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          setSelectedAgreement(agreement);
                          setIsLetterModalOpen(true);
                        }}
                        className="flex-1 py-2 px-3 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5" /> View Agreement
                      </button>

                      <button
                        onClick={() => {
                          setSelectedAgreement(agreement);
                          setIsShareModalOpen(true);
                        }}
                        title="Send Agreement Link to Client"
                        className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs transition-all cursor-pointer"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => {
                          setSelectedAgreement(agreement);
                          setIsPrintOpen(true);
                        }}
                        title="Print / PDF Form"
                        className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs transition-all cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Quick WhatsApp & Sign actions */}
                    <div className="flex items-center gap-1.5">
                      <a
                        href={getWhatsAppShareUrl(agreement)}
                        target="_blank"
                        rel="noreferrer"
                        onClick={() => {
                          if (currentUser) {
                            DataService.markAgreementSent(agreement.id, 'whatsapp', currentUser);
                          }
                        }}
                        className="flex-1 py-1.5 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold flex items-center justify-center gap-1 transition-all"
                      >
                        <Send className="w-3 h-3" /> Send WhatsApp
                      </a>

                      {agreement.status !== 'signed' && agreement.status !== 'active_loan' && (
                        <button
                          onClick={() => {
                            setSelectedAgreement(agreement);
                            setSigningName(agreement.customerName);
                            setSigningNationalId(agreement.customerIdNumber);
                            setIsSignModalOpen(true);
                          }}
                          className="py-1.5 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white text-[11px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer"
                        >
                          <UserCheck className="w-3 h-3" /> Sign Online
                        </button>
                      )}

                      {agreement.status === 'signed' && (
                        <button
                          onClick={() => {
                            setSelectedAgreement(agreement);
                            handleDisburseToLoan();
                          }}
                          className="py-1.5 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer"
                        >
                          <Zap className="w-3 h-3" /> Disburse Loan
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredAgreements.length === 0 && (
            <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
              <Tv className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">No Item Agreements Found</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
                No agreements match your search. Click "Draft Item Agreement" to create a new chattel loan on a TV, woofer, sofa set, fridge, or laptop.
              </p>
              <button
                onClick={() => setActiveTab('drafter')}
                className="mt-4 px-4 py-2 bg-indigo-600 text-white font-bold text-xs rounded-xl hover:bg-indigo-500 cursor-pointer"
              >
                + Draft New Agreement
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: DRAFT AGREEMENT & CALCULATOR */}
      {activeTab === 'drafter' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Cols: Form */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Zap className="w-5 h-5 text-indigo-600" /> Draft Online Item Loan Agreement
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Select or configure the household item, assess its forced sale value, specify loan terms, and generate an enforceable digital agreement letter.
              </p>
            </div>

            <form onSubmit={handleSaveDraftAgreement} className="space-y-5">
              {/* Step 2: Client Details */}
              <div className="border-t border-slate-200 dark:border-slate-700 pt-4 space-y-3">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Step 2: Client & Borrower Information
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Select Existing Registered Customer
                    </label>
                    <select
                      value={draftCustomerId}
                      onChange={(e) => handleSelectCustomer(e.target.value)}
                      className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl"
                    >
                      {customers.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.fullName} • ID: {c.idNumber} • Phone: {c.phone}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Full Legal Name
                    </label>
                    <input
                      type="text"
                      value={draftCustomerName}
                      onChange={(e) => setDraftCustomerName(e.target.value)}
                      required
                      className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      National ID Number
                    </label>
                    <input
                      type="text"
                      value={draftCustomerIdNumber}
                      onChange={(e) => setDraftCustomerIdNumber(e.target.value)}
                      required
                      className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Client Phone (WhatsApp Enabled)
                    </label>
                    <input
                      type="text"
                      value={draftCustomerPhone}
                      onChange={(e) => setDraftCustomerPhone(e.target.value)}
                      required
                      className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Client Email Address (Optional)
                    </label>
                    <input
                      type="email"
                      value={draftCustomerEmail}
                      onChange={(e) => setDraftCustomerEmail(e.target.value)}
                      placeholder="client@example.com"
                      className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Residential Address / Estate Location
                    </label>
                    <input
                      type="text"
                      value={draftCustomerAddress}
                      onChange={(e) => setDraftCustomerAddress(e.target.value)}
                      placeholder="e.g. Ruaka Ridge Estate, House 42B, Kiambu"
                      className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl"
                    />
                  </div>
                </div>
              </div>

              {/* Step 3: Item Specifications */}
              <div className="border-t border-slate-200 dark:border-slate-700 pt-4 space-y-3">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Step 3: Pledged Item Specifications & Physical Assessment
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Item Description / Title
                    </label>
                    <input
                      type="text"
                      value={draftItemTitle}
                      onChange={(e) => setDraftItemTitle(e.target.value)}
                      required
                      placeholder="e.g. Sony Bravia 55 Inch 4K UHD Smart Android TV"
                      className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Brand / Manufacturer
                    </label>
                    <input
                      type="text"
                      value={draftItemBrand}
                      onChange={(e) => setDraftItemBrand(e.target.value)}
                      placeholder="e.g. Sony, Tagwood, LG"
                      className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Model Number / Series
                    </label>
                    <input
                      type="text"
                      value={draftItemModel}
                      onChange={(e) => setDraftItemModel(e.target.value)}
                      placeholder="e.g. Bravia KD-55X80K"
                      className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Serial Number / Chassis / Tag Ref
                    </label>
                    <input
                      type="text"
                      value={draftItemSerial}
                      onChange={(e) => setDraftItemSerial(e.target.value)}
                      placeholder="e.g. SN-SONY-55-98312A"
                      className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Working Condition & Assessment
                    </label>
                    <input
                      type="text"
                      value={draftItemCondition}
                      onChange={(e) => setDraftItemCondition(e.target.value)}
                      placeholder="e.g. Mint working condition, tested zero screen defects"
                      className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Fair Market Value (KES)
                    </label>
                    <input
                      type="number"
                      value={draftItemMarketValue}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setDraftItemMarketValue(val);
                        setDraftItemForcedSaleValue(Math.round(val * 0.7));
                      }}
                      className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Forced Sale Value / FSV (KES)
                    </label>
                    <input
                      type="number"
                      value={draftItemForcedSaleValue}
                      onChange={(e) => setDraftItemForcedSaleValue(Number(e.target.value))}
                      className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Accessories & Parts Included in Pledge
                    </label>
                    <input
                      type="text"
                      value={draftAccessories}
                      onChange={(e) => setDraftAccessories(e.target.value)}
                      placeholder="e.g. Remote control, power adapter, wall bracket, speaker cables"
                      className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Custody Mode
                    </label>
                    <select
                      value={draftCustodyType}
                      onChange={(e) => setDraftCustodyType(e.target.value as any)}
                      className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-medium"
                    >
                      <option value="in_branch_vault">🏛️ Stored in Branch Vault (Safe Storage)</option>
                      <option value="held_by_borrower_chattel">🏠 Retained by Borrower (Tagged Chattel)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Custody Location / Locker Ref
                    </label>
                    <input
                      type="text"
                      value={draftCustodyLocation}
                      onChange={(e) => setDraftCustodyLocation(e.target.value)}
                      placeholder="e.g. Vault Locker B-02 or Borrower Residence"
                      className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl"
                    />
                  </div>
                </div>
              </div>

              {/* Step 4: Loan Financial Terms */}
              <div className="border-t border-slate-200 dark:border-slate-700 pt-4 space-y-3">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Step 4: Loan Principal & Financial Parameters
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Principal Loan Amount (KES)
                    </label>
                    <input
                      type="number"
                      value={draftPrincipal}
                      onChange={(e) => setDraftPrincipal(Number(e.target.value))}
                      required
                      min={1000}
                      className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-indigo-600 dark:text-indigo-400"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Tenure (Months)
                    </label>
                    <select
                      value={draftDurationMonths}
                      onChange={(e) => setDraftDurationMonths(Number(e.target.value))}
                      className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl"
                    >
                      <option value={1}>1 Month (30 Days)</option>
                      <option value={2}>2 Months (60 Days)</option>
                      <option value={3}>3 Months (90 Days)</option>
                      <option value={6}>6 Months</option>
                      <option value={12}>12 Months</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Interest Rate (% per month)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={draftInterestRateMonthly}
                      onChange={(e) => setDraftInterestRateMonthly(Number(e.target.value))}
                      className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Processing Fee (%)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      value={draftProcessingFeePct}
                      onChange={(e) => setDraftProcessingFeePct(Number(e.target.value))}
                      className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Grace Period (Days)
                    </label>
                    <input
                      type="number"
                      value={draftGraceDays}
                      onChange={(e) => setDraftGraceDays(Number(e.target.value))}
                      className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Default Penalty Rate (%/mo)
                    </label>
                    <input
                      type="number"
                      value={draftPenaltyRate}
                      onChange={(e) => setDraftPenaltyRate(Number(e.target.value))}
                      className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3">
                <button
                  type="submit"
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2 transition-all cursor-pointer"
                >
                  <FileText className="w-4 h-4" /> Draft & Preview Agreement Letter
                </button>
              </div>
            </form>
          </div>

          {/* Right 1 Col: Live Financial Summary & Checklist */}
          <div className="space-y-4">
            <div className="p-5 rounded-2xl bg-indigo-950 text-white shadow-md border border-indigo-800/60 space-y-4">
              <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-300">
                Live Chattel Financial Preview
              </span>
              <div>
                <p className="text-xs text-indigo-200">Sanctioned Principal</p>
                <p className="text-3xl font-black text-white">{LoanEngine.formatKES(draftPrincipal)}</p>
              </div>

              <div className="space-y-2 border-t border-indigo-800/80 pt-3 text-xs">
                <div className="flex justify-between text-indigo-200">
                  <span>Monthly Installment:</span>
                  <span className="font-bold text-emerald-400 text-sm">
                    {LoanEngine.formatKES(calculatedCalculations.monthlyInstallment)} / mo
                  </span>
                </div>
                <div className="flex justify-between text-indigo-200">
                  <span>Total Interest ({draftDurationMonths} Mo @ {draftInterestRateMonthly}%):</span>
                  <span className="font-medium text-white">{LoanEngine.formatKES(calculatedCalculations.totalInterest)}</span>
                </div>
                <div className="flex justify-between text-indigo-200">
                  <span>Processing Fee ({draftProcessingFeePct}%):</span>
                  <span className="font-medium text-white">{LoanEngine.formatKES(calculatedCalculations.processingFee)}</span>
                </div>
                <div className="flex justify-between text-indigo-200">
                  <span>Net Disbursed to M-Pesa:</span>
                  <span className="font-bold text-white">{LoanEngine.formatKES(calculatedCalculations.disbursedAmount)}</span>
                </div>
                <div className="flex justify-between text-indigo-200 border-t border-indigo-800/80 pt-2 font-bold text-white">
                  <span>Total Repayable:</span>
                  <span>{LoanEngine.formatKES(calculatedCalculations.totalPayable)}</span>
                </div>
              </div>

              {/* LTV Meter */}
              <div className="border-t border-indigo-800/80 pt-3 space-y-1.5">
                <div className="flex justify-between text-[11px] text-indigo-200">
                  <span>Loan-To-Value (LTV):</span>
                  <span className={`font-bold ${calculatedCalculations.ltvPct > 70 ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {calculatedCalculations.ltvPct}% of FSV
                  </span>
                </div>
                <div className="h-2 w-full bg-indigo-900 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${calculatedCalculations.ltvPct > 70 ? 'bg-amber-400' : 'bg-emerald-400'}`}
                    style={{ width: `${Math.min(calculatedCalculations.ltvPct, 100)}%` }}
                  />
                </div>
                <p className="text-[10px] text-indigo-300">
                  {calculatedCalculations.ltvPct <= 70
                    ? '✓ Compliant with 70% chattel policy'
                    : '⚠️ Exceeds standard 70% threshold. Requires Manager Approval.'}
                </p>
              </div>
            </div>

            {/* Quick Inspection Checklist */}
            <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs space-y-2.5">
              <h4 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-indigo-600" /> Physical Inspection Mandate
              </h4>
              <ul className="space-y-1.5 text-slate-600 dark:text-slate-400 text-[11px]">
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                  <span>Power on test and functional check of all ports / accessories.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                  <span>Serial number verified and photograph stored in custody register.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                  <span>Borrower executed statutory declaration under Chattels Transfer Act.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: HOUSEHOLD VALUATION GUIDE */}
      {activeTab === 'catalog' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-indigo-50/60 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 text-xs text-indigo-900 dark:text-indigo-200 flex items-start gap-3">
            <Info className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Chattel Valuation & Lending Cap Rules (Davetech Credit Policy 2026)</p>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                Valuations are pegged against prevailing open-market replacement prices in Nairobi / Kenya electronics hubs (Jumia, Saruk, Hotpoint). Forced sale value is discounted by 30%, and maximum lending cap is 70% of forced sale value.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {ITEM_CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              return (
                <div
                  key={cat.type}
                  className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs space-y-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400">
                      <Icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">{cat.label}</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                        Benchmark: {LoanEngine.formatKES(cat.benchmarkValue)}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                    <p><strong>Approved Brands:</strong> {cat.sampleBrand}</p>
                    <p><strong>Sample Spec:</strong> {cat.sampleModel}</p>
                    <p><strong>Max 70% Loan Cap:</strong> {LoanEngine.formatKES(Math.round(cat.benchmarkValue * 0.7 * 0.7))}</p>
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-700">
                    <button
                      onClick={() => {
                        handleApplyCategoryPreset(cat);
                        setActiveTab('drafter');
                      }}
                      className="w-full py-2 bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      Draft Loan on {cat.label.split('&')[0].trim()} <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MODAL 1: FULL LEGAL AGREEMENT LETTER PREVIEW */}
      {selectedAgreement && (
        <Modal
          isOpen={isLetterModalOpen}
          onClose={() => setIsLetterModalOpen(false)}
          title={`Item Loan Agreement Letter • ${selectedAgreement.agreementNumber}`}
          maxWidth="max-w-4xl"
        >
          <div className="space-y-5">
            {/* Control Toolbar */}
            <div className="p-3 bg-slate-100 dark:bg-slate-900 rounded-xl flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full ${
                  selectedAgreement.status === 'signed'
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                    : 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                }`}>
                  Status: {selectedAgreement.status.replace(/_/g, ' ')}
                </span>
                {selectedAgreement.signedAt && (
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Signed {selectedAgreement.signedAt}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={getWhatsAppShareUrl(selectedAgreement)}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => {
                    if (currentUser) {
                      DataService.markAgreementSent(selectedAgreement.id, 'whatsapp', currentUser);
                    }
                  }}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 transition-all"
                >
                  <Send className="w-3.5 h-3.5" /> WhatsApp to Client
                </a>

                <button
                  onClick={() => {
                    setIsLetterModalOpen(false);
                    setIsShareModalOpen(true);
                  }}
                  className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-lg flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5" /> Share Options
                </button>

                <button
                  onClick={() => {
                    setIsPrintOpen(true);
                  }}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" /> Print / Save PDF
                </button>

                {selectedAgreement.status !== 'signed' && selectedAgreement.status !== 'active_loan' && (
                  <button
                    onClick={() => {
                      setSigningName(selectedAgreement.customerName);
                      setSigningNationalId(selectedAgreement.customerIdNumber);
                      setIsSignModalOpen(true);
                    }}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <UserCheck className="w-3.5 h-3.5" /> Sign Online Now
                  </button>
                )}

                {selectedAgreement.status === 'signed' && (
                  <button
                    onClick={handleDisburseToLoan}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Zap className="w-3.5 h-3.5" /> Disburse Loan
                  </button>
                )}
              </div>
            </div>

            {/* Letter Document Preview Box */}
            <div className="p-8 bg-white text-slate-900 rounded-xl border border-slate-200 shadow-inner space-y-6 font-sans">
              {/* Header Letterhead */}
              <div className="flex items-start justify-between border-b-2 border-slate-900 pb-4">
                <div>
                  <h1 className="text-xl font-black tracking-tight text-slate-900">
                    {systemSettings?.companyName || `${systemSettings?.platformName || 'DAVETECH'} SOLUTIONS LIMITED`}
                  </h1>
                  <p className="text-xs text-slate-600 mt-0.5">
                    {systemSettings?.companyAddress || 'Davetech Towers, 6th Floor, Kimathi Street, Nairobi'}
                  </p>
                  <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                    Tel: {systemSettings?.companyPhone || '+254 700 112 233'} • Email: {systemSettings?.companyEmail || 'credit@davetech.co.ke'} • KRA PIN: {systemSettings?.kraPin || 'P051928371X'}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                    Statutory Chattel Mortgage
                  </span>
                  <p className="text-xs font-mono font-bold text-slate-900 mt-1">REF: {selectedAgreement.agreementNumber}</p>
                  <p className="text-[11px] text-slate-500 font-mono">Date: {selectedAgreement.draftedAt.split(' ')[0]}</p>
                </div>
              </div>

              {/* Title */}
              <div className="text-center py-1">
                <h2 className="text-base font-bold uppercase tracking-wider text-slate-900 underline decoration-indigo-600 underline-offset-4">
                  Letter of Offer & Chattel Pledge Agreement on Household Item
                </h2>
                <p className="text-xs text-slate-600 mt-1">
                  Enforceable under the Chattels Transfer Act (Cap 28, Laws of Kenya)
                </p>
              </div>

              {/* Parties */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 leading-relaxed">
                This Legal Agreement is entered between <strong>{systemSettings?.companyName || 'Davetech Solutions Limited'}</strong> (as "<strong>Lender</strong>") and <strong>{selectedAgreement.customerName}</strong> (as "<strong>Borrower</strong>"), National ID No: <strong>{selectedAgreement.customerIdNumber}</strong>, Phone: <strong>{selectedAgreement.customerPhone}</strong>, residing at {selectedAgreement.customerAddress || 'N/A'}.
              </div>

              {/* Collateral Item Schedule */}
              <div className="border border-indigo-200 rounded-xl p-4 bg-indigo-50/40 space-y-2.5">
                <div className="flex items-center justify-between border-b border-indigo-200/60 pb-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-950">
                    Schedule 1: Pledged Collateral Item & Condition Assessment
                  </h3>
                  <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-indigo-200 text-indigo-900">
                    Category: {selectedAgreement.itemType.toUpperCase()}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 block">ITEM DESCRIPTION</span>
                    <strong className="text-slate-900">{selectedAgreement.itemTitle}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">BRAND & MODEL</span>
                    <span className="text-slate-800 font-medium">{selectedAgreement.itemBrand} {selectedAgreement.itemModel}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">SERIAL NO. / TAG</span>
                    <span className="font-mono font-bold text-slate-900">{selectedAgreement.itemSerialNumber || 'CHATTEL-TAGGED'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">PHYSICAL CONDITION</span>
                    <span className="text-slate-800">{selectedAgreement.itemCondition}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">MARKET VALUE</span>
                    <strong className="text-slate-900">{LoanEngine.formatKES(selectedAgreement.itemMarketValue)}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">FORCED SALE VALUE (FSV)</span>
                    <strong className="text-slate-900">{LoanEngine.formatKES(selectedAgreement.itemForcedSaleValue)}</strong>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[10px] text-slate-500 block">ACCESSORIES INCLUDED IN PLEDGE</span>
                    <span className="text-slate-800 text-[11px]">
                      {selectedAgreement.accessoriesIncluded?.join(', ') || 'Standard accessories as inspected'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">CUSTODY ARRANGEMENT</span>
                    <span className="text-slate-800 font-semibold text-[11px]">
                      {selectedAgreement.custodyType === 'in_branch_vault'
                        ? '🏛️ Vault Storage at Branch'
                        : '🏠 Held by Borrower under Chattel Tag'}
                    </span>
                    <p className="text-[10px] text-slate-500">{selectedAgreement.custodyLocation}</p>
                  </div>
                </div>
              </div>

              {/* Financial Terms */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs border border-slate-200 rounded-xl p-4 bg-slate-50 font-mono">
                <div>
                  <span className="text-slate-500 text-[10px] block">PRINCIPAL SANCTIONED</span>
                  <span className="font-bold text-sm text-slate-900">{LoanEngine.formatKES(selectedAgreement.principalAmount)}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block">MONTHLY INTEREST</span>
                  <span className="font-bold text-sm text-slate-900">{selectedAgreement.interestRateMonthly}% / month</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block">MONTHLY INSTALLMENT</span>
                  <span className="font-bold text-sm text-emerald-700">{LoanEngine.formatKES(selectedAgreement.monthlyInstallment)}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block">TOTAL REPAYABLE</span>
                  <span className="font-bold text-sm text-slate-900">{LoanEngine.formatKES(selectedAgreement.totalPayable)}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block">TENURE / DURATION</span>
                  <span className="font-semibold text-slate-800">{selectedAgreement.durationMonths} Month(s)</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block">PROCESSING FEE</span>
                  <span className="font-semibold text-slate-800">{LoanEngine.formatKES(selectedAgreement.processingFee)}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block">NET DISBURSED TO MPESA</span>
                  <span className="font-bold text-slate-900">{LoanEngine.formatKES(selectedAgreement.disbursedAmount)}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block">GRACE PERIOD & PENALTY</span>
                  <span className="font-semibold text-slate-800">{selectedAgreement.gracePeriodDays} Days ({selectedAgreement.penaltyRateMonthly}%/mo)</span>
                </div>
              </div>

              {/* Terms & Undertakings */}
              <div className="space-y-1.5 text-[10px] text-slate-600 border-t border-slate-200 pt-3">
                <h4 className="font-bold text-slate-800 uppercase text-[11px]">Binding Terms & Chattel Covenants:</h4>
                <p>
                  <strong>1. Ownership Warranty:</strong> The Borrower warrants that they are the absolute unencumbered owner of the pledged item without existing loans or claims.
                </p>
                <p>
                  <strong>2. Statutory Chattel Pledge:</strong> In accordance with the Chattels Transfer Act (Cap 28), Borrower hereby creates a first-charge chattel pledge in favor of {systemSettings?.companyName || 'Davetech Solutions'}.
                </p>
                <p>
                  <strong>3. Default & Repossession:</strong> In event of non-payment exceeding 7 days past due date, the Lender reserves statutory authority to repossess and realize the security through public auction or private treaty.
                </p>
                <p>
                  <strong>4. Discharge:</strong> Upon prompt settlement of the total sum of {LoanEngine.formatKES(selectedAgreement.totalPayable)}, the security pledge shall be formally discharged.
                </p>
              </div>

              {/* Signatures & Acceptance */}
              <div className="pt-4 border-t border-slate-200">
                {selectedAgreement.signedAt ? (
                  <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-emerald-800 uppercase text-[10px] tracking-wider flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Digital Signature Verified & Accepted Online
                      </span>
                      <p className="font-bold text-slate-900 mt-1">
                        Signed By: {selectedAgreement.signedByName || selectedAgreement.customerName}
                      </p>
                      <p className="text-[10px] text-slate-600 font-mono">
                        Date: {selectedAgreement.signedAt} • Ref: {selectedAgreement.clientSignatureData}
                      </p>
                    </div>
                    <div className="p-2 bg-emerald-600 text-white rounded-lg font-bold text-xs">
                      ACCEPTED
                    </div>
                  </div>
                ) : (
                  <div className="pt-6 flex justify-between text-center text-xs">
                    <div>
                      <div className="h-10 border-b border-slate-400 w-48 mx-auto mb-1"></div>
                      <p className="font-bold text-slate-900">{selectedAgreement.customerName}</p>
                      <p className="text-[10px] text-slate-500">Borrower Signature</p>
                    </div>
                    <div>
                      <div className="h-10 border-b border-slate-400 w-48 mx-auto mb-1"></div>
                      <p className="font-bold text-slate-900">{selectedAgreement.draftedBy}</p>
                      <p className="text-[10px] text-slate-500">For {systemSettings?.companyName || 'Davetech Solutions'}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL 2: SHARE (WHATSAPP, EMAIL, ONLINE LINK) */}
      {selectedAgreement && (
        <Modal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          title="Send Online Agreement Letter to Client"
          maxWidth="max-w-lg"
        >
          <div className="space-y-4">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Send this agreement link directly to <strong>{selectedAgreement.customerName}</strong> ({selectedAgreement.customerPhone}) so they can review the item loan terms and digitally accept it online.
            </p>

            {/* Direct Copyable Link */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Client Online Signing Link
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={getShareableUrl(selectedAgreement)}
                  className="flex-1 text-xs p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-slate-600 dark:text-slate-400"
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(getShareableUrl(selectedAgreement));
                    setCopiedLink(true);
                    setTimeout(() => setCopiedLink(false), 2000);
                  }}
                  className="px-3 py-2.5 bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-all"
                >
                  {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  {copiedLink ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>

            {/* Quick Share Options */}
            <div className="space-y-2 pt-2">
              <a
                href={getWhatsAppShareUrl(selectedAgreement)}
                target="_blank"
                rel="noreferrer"
                onClick={() => {
                  if (currentUser) {
                    DataService.markAgreementSent(selectedAgreement.id, 'whatsapp', currentUser);
                  }
                  setIsShareModalOpen(false);
                }}
                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center justify-between shadow-xs transition-all"
              >
                <span className="flex items-center gap-2">
                  <Send className="w-4 h-4" /> Send via WhatsApp to {selectedAgreement.customerPhone}
                </span>
                <ChevronRight className="w-4 h-4" />
              </a>

              <a
                href={getEmailShareUrl(selectedAgreement)}
                onClick={() => {
                  if (currentUser) {
                    DataService.markAgreementSent(selectedAgreement.id, 'email', currentUser);
                  }
                  setIsShareModalOpen(false);
                }}
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl flex items-center justify-between shadow-xs transition-all"
              >
                <span className="flex items-center gap-2">
                  <Share2 className="w-4 h-4" /> Send via Email ({selectedAgreement.customerEmail || 'Client Email'})
                </span>
                <ChevronRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL 3: DIGITAL SIGNATURE & CLIENT ACCEPTANCE */}
      {selectedAgreement && (
        <Modal
          isOpen={isSignModalOpen}
          onClose={() => setIsSignModalOpen(false)}
          title={`Digital Client Acceptance • ${selectedAgreement.agreementNumber}`}
          maxWidth="max-w-md"
        >
          <form onSubmit={handleOnlineSignSubmit} className="space-y-4">
            <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl text-xs text-indigo-900 dark:text-indigo-200">
              <p className="font-bold">Chattel Mortgage Pledge Acceptance</p>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                Item: <strong>{selectedAgreement.itemTitle}</strong> ({selectedAgreement.itemBrand}) • Loan: <strong>{LoanEngine.formatKES(selectedAgreement.principalAmount)}</strong>
              </p>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Signatory Legal Full Name
              </label>
              <input
                type="text"
                value={signingName}
                onChange={(e) => setSigningName(e.target.value)}
                required
                className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Confirm National ID Number
              </label>
              <input
                type="text"
                value={signingNationalId}
                onChange={(e) => setSigningNationalId(e.target.value)}
                required
                className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Type Electronic Signature
              </label>
              <input
                type="text"
                value={signatureText}
                onChange={(e) => setSignatureText(e.target.value)}
                placeholder="e.g. /s/ John Kamau Mwangi"
                required
                className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-mono"
              />
            </div>

            <div className="flex items-start gap-2 pt-2">
              <input
                type="checkbox"
                id="agree"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                required
                className="mt-0.5"
              />
              <label htmlFor="agree" className="text-[11px] text-slate-600 dark:text-slate-400 leading-tight">
                I confirm that I am the absolute unencumbered owner of <strong>{selectedAgreement.itemTitle}</strong> and agree to all terms, interest schedule, and repossession rights under the Chattels Transfer Act Cap 28.
              </label>
            </div>

            <div className="pt-3 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsSignModalOpen(false)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!agreeTerms}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-300 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" /> Submit Signed Acceptance
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* PRINT ENGINE */}
      {isPrintOpen && selectedAgreement && (
        <PrintTemplate
          docType="item_loan_agreement"
          itemAgreement={selectedAgreement}
          onClose={() => setIsPrintOpen(false)}
        />
      )}
    </div>
  );
};
