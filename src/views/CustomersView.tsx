/**
 * DAVETECH ERP - Customer 360 & KYC Management
 * Borrower directory, detailed KYC profiles, linked assets, active loan portfolios,
 * and next-of-kin / guarantor undertakings.
 */

import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Phone,
  Mail,
  MapPin,
  ShieldCheck,
  Coins,
  Car,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Eye,
  FileText,
  Building,
} from 'lucide-react';
import { DataService } from '../services/dataService';
import { Customer, CustomerType, RiskRating, KycStatus, Loan, Asset, Collateral } from '../types/erp';
import { LoanEngine } from '../services/loanEngine';
import { useAuth } from '../context/AuthContext';
import { Modal } from '../components/common/Modal';

export const CustomersView: React.FC = () => {
  const { currentUser, hasPermission } = useAuth();

  const [customers, setCustomers] = useState<Customer[]>(() => DataService.getCustomers());
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(customers[0] || null);

  // Active Tab in Customer 360 profile
  const [activeProfileTab, setActiveProfileTab] = useState<'overview' | 'loans' | 'assets' | 'collateral' | 'guarantors'>('overview');

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Add Customer Form States
  const [formType, setFormType] = useState<CustomerType>('individual');
  const [formFullName, setFormFullName] = useState('');
  const [formIdNumber, setFormIdNumber] = useState('');
  const [formKraPin, setFormKraPin] = useState('');
  const [formPhone, setFormPhone] = useState('2547');
  const [formEmail, setFormEmail] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formCounty, setFormCounty] = useState('Nairobi');
  const [formIncome, setFormIncome] = useState(120000);
  const [formKinName, setFormKinName] = useState('');
  const [formKinPhone, setFormKinPhone] = useState('2547');
  const [formKinRelation, setFormKinRelation] = useState('Spouse');

  const refreshData = () => {
    setCustomers(DataService.getCustomers());
  };

  const filteredCustomers = customers.filter((c) => {
    if (typeFilter !== 'all' && c.customerType !== typeFilter) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        c.fullName.toLowerCase().includes(q) ||
        c.customerNumber.toLowerCase().includes(q) ||
        c.idNumber.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        c.kraPin.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();

    const newCust: Partial<Customer> = {
      customerType: formType,
      fullName: formFullName,
      idNumber: formIdNumber,
      idType: 'national_id',
      kraPin: formKraPin.toUpperCase(),
      phone: formPhone,
      email: formEmail,
      address: formAddress,
      county: formCounty,
      subCounty: 'Central',
      town: formCounty,
      gender: 'male',
      maritalStatus: 'married',
      occupation: 'Business Enterprise / Transport Operator',
      monthlyDeclaredIncome: Number(formIncome),
      branchId: 'main',
      kycStatus: 'verified',
      riskRating: 'low',
      kycDocuments: [],
      nextOfKin: [
        {
          fullName: formKinName || 'Next of Kin',
          relationship: formKinRelation,
          phone: formKinPhone,
          idNumber: '30491823',
          address: formAddress,
        },
      ],
      bankDetails: {
        bankName: 'Equity Bank Kenya',
        branch: 'Community Supreme Branch',
        accountNumber: '0810293847291',
        accountName: formFullName,
      },
    };

    const saved = DataService.saveCustomer(newCust, currentUser);
    setIsAddModalOpen(false);
    refreshData();
    setSelectedCustomer(saved);
  };

  // Associated records for currently selected customer
  const customerLoans = selectedCustomer
    ? DataService.getLoans().filter((l) => l.customerId === selectedCustomer.id)
    : [];
  const customerAssets = selectedCustomer
    ? DataService.getAssets().filter((a) => a.customerId === selectedCustomer.id)
    : [];
  const customerCollateral = selectedCustomer
    ? DataService.getCollaterals().filter((col) => col.customerId === selectedCustomer.id)
    : [];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Customer 360 Dossier
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
              {customers.length} Registered Borrowers
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Complete borrower profile, KYC verification history, verified collateral, and active credit facilities.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {hasPermission('customers.create') && (
            <button
              id="add-customer-btn"
              onClick={() => setIsAddModalOpen(true)}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm transition flex items-center gap-1.5"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Register New Customer</span>
            </button>
          )}
        </div>
      </div>

      {/* Two-Column Layout: Customer List Left (1/3), Customer 360 Right (2/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Customer Directory */}
        <div className="lg:col-span-5 space-y-3">
          {/* Search & Filter */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search name, phone, ID, KRA..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-lg text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:border-emerald-500"
              />
            </div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-2 py-1.5 rounded-lg text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 outline-none"
            >
              <option value="all">All Types</option>
              <option value="individual">Individual</option>
              <option value="business">Business</option>
              <option value="company">Corporate</option>
            </select>
          </div>

          {/* Customer Cards List */}
          <div className="space-y-2 max-h-[720px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
            {filteredCustomers.map((c) => {
              const isSelected = selectedCustomer?.id === c.id;
              return (
                <div
                  key={c.id}
                  onClick={() => setSelectedCustomer(c)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition ${
                    isSelected
                      ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-500/80 shadow-xs'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100">
                        {c.fullName}
                      </h4>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                        {c.customerNumber} • ID: {c.idNumber}
                      </p>
                    </div>
                    <span
                      className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-sm ${
                        c.riskRating === 'low'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                      }`}
                    >
                      {c.riskRating} risk
                    </span>
                  </div>

                  <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                    <span className="flex items-center gap-1">
                      <Phone className="w-3 h-3 text-slate-400" />
                      <span>{c.phone}</span>
                    </span>
                    <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                      {LoanEngine.formatKES(c.monthlyDeclaredIncome, false)}/mo
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Customer 360 Full Dossier */}
        <div className="lg:col-span-7">
          {selectedCustomer ? (
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs p-5 space-y-5">
              {/* Profile Top Bar */}
              <div className="flex items-start justify-between pb-4 border-b border-slate-100 dark:border-slate-700/80">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
                    {selectedCustomer.fullName.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                        {selectedCustomer.fullName}
                      </h2>
                      <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                        KYC {selectedCustomer.kycStatus}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-mono mt-0.5">
                      {selectedCustomer.customerNumber} • KRA PIN: {selectedCustomer.kraPin}
                    </p>
                  </div>
                </div>
              </div>

              {/* Tabs Navigation */}
              <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-700/80 text-xs pb-1">
                {[
                  { id: 'overview', label: 'Overview' },
                  { id: 'loans', label: `Active Loans (${customerLoans.length})` },
                  { id: 'assets', label: `Assets (${customerAssets.length})` },
                  { id: 'collateral', label: `Collateral (${customerCollateral.length})` },
                  { id: 'guarantors', label: 'Next of Kin' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveProfileTab(tab.id as any)}
                    className={`px-3 py-1.5 font-semibold transition border-b-2 ${
                      activeProfileTab === tab.id
                        ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                        : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* TAB 1: OVERVIEW */}
              {activeProfileTab === 'overview' && (
                <div className="space-y-4 text-xs">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3.5 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-100 dark:border-slate-700 font-mono">
                    <div>
                      <span className="text-[10px] text-slate-400 block">NATIONAL ID</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {selectedCustomer.idNumber}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">PRIMARY PHONE</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {selectedCustomer.phone}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">DECLARED INCOME</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        {LoanEngine.formatKES(selectedCustomer.monthlyDeclaredIncome)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">RESIDENTIAL TOWN</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {selectedCustomer.town}, {selectedCustomer.county}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">OCCUPATION</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 truncate block">
                        {selectedCustomer.occupation}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">RISK GRADING</span>
                      <span className="font-bold uppercase text-emerald-600">
                        {selectedCustomer.riskRating} Risk
                      </span>
                    </div>
                  </div>

                  {selectedCustomer.bankDetails && (
                    <div className="p-3 bg-white dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-700">
                      <h4 className="font-bold text-slate-900 dark:text-slate-100 text-[11px] uppercase mb-1.5">
                        Disbursement Bank Account
                      </h4>
                      <p className="text-slate-700 dark:text-slate-300 font-mono text-[11px]">
                        {selectedCustomer.bankDetails.bankName} • Account: {selectedCustomer.bankDetails.accountNumber} ({selectedCustomer.bankDetails.branch})
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: ACTIVE LOANS */}
              {activeProfileTab === 'loans' && (
                <div className="space-y-2 text-xs">
                  {customerLoans.length === 0 ? (
                    <p className="text-center py-6 text-slate-400">No loans found for this customer.</p>
                  ) : (
                    customerLoans.map((l) => (
                      <div
                        key={l.id}
                        className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-850 flex items-center justify-between"
                      >
                        <div>
                          <p className="font-bold font-mono text-slate-900 dark:text-slate-100">
                            {l.loanNumber}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            Sanctioned: {LoanEngine.formatKES(l.principal)} • Monthly: {LoanEngine.formatKES(l.installmentAmount)}
                          </p>
                        </div>
                        <div className="text-right font-mono">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              l.status === 'active'
                                ? 'bg-emerald-100 text-emerald-800'
                                : l.status === 'in_recovery'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {l.status}
                          </span>
                          <p className="text-[10px] text-rose-600 font-bold mt-1">
                            Balance: {LoanEngine.formatKES(l.totalOutstanding)}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* TAB 3: ASSETS */}
              {activeProfileTab === 'assets' && (
                <div className="space-y-2 text-xs">
                  {customerAssets.length === 0 ? (
                    <p className="text-center py-6 text-slate-400">No assets registered yet.</p>
                  ) : (
                    customerAssets.map((a) => (
                      <div
                        key={a.id}
                        className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-850 flex items-center justify-between"
                      >
                        <div>
                          <p className="font-bold text-slate-900 dark:text-slate-100">{a.titleOrName}</p>
                          <p className="text-[10px] text-slate-400 font-mono">
                            Category: {a.category} • Status: {a.status}
                          </p>
                        </div>
                        <div className="text-right font-mono">
                          <p className="font-bold text-emerald-600">
                            {LoanEngine.formatKES(a.marketValue)}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            FSV: {LoanEngine.formatKES(a.forcedSaleValue)}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* TAB 4: COLLATERAL */}
              {activeProfileTab === 'collateral' && (
                <div className="space-y-2 text-xs">
                  {customerCollateral.length === 0 ? (
                    <p className="text-center py-6 text-slate-400">No active collateral pledged.</p>
                  ) : (
                    customerCollateral.map((col) => (
                      <div
                        key={col.id}
                        className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-850 flex items-center justify-between"
                      >
                        <div>
                          <p className="font-bold font-mono text-slate-900 dark:text-slate-100">
                            {col.id}
                          </p>
                          <p className="text-[11px] text-slate-600">{col.description}</p>
                          <p className="text-[10px] text-slate-400">Vault: {col.storageLocation}</p>
                        </div>
                        <div className="text-right font-mono">
                          <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-purple-100 text-purple-800">
                            {col.status}
                          </span>
                          <p className="font-bold text-emerald-600 mt-1">
                            LTV {col.loanToValuePct}%
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* TAB 5: NEXT OF KIN / GUARANTORS */}
              {activeProfileTab === 'guarantors' && (
                <div className="space-y-3 text-xs">
                  {selectedCustomer.nextOfKin?.map((nok, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-850"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 dark:text-slate-100">
                          {nok.fullName}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                          {nok.relationship}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-1">
                        Phone: <strong className="font-mono">{nok.phone}</strong> • National ID: {nok.idNumber}
                      </p>
                      <p className="text-[11px] text-slate-500">Address: {nok.address}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="p-12 text-center text-slate-400">Select a customer to view details.</div>
          )}
        </div>
      </div>

      {/* MODAL: REGISTER CUSTOMER */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Register New Borrower / Customer"
        subtitle="Collect borrower KYC, KRA PIN, identity documents, declared income, and next of kin."
        maxWidth="2xl"
      >
        <form onSubmit={handleCreateCustomer} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Customer Entity Type
              </label>
              <select
                value={formType}
                onChange={(e) => setFormType(e.target.value as CustomerType)}
                className="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none font-medium"
              >
                <option value="individual">Individual Borrower</option>
                <option value="business">Sole Proprietorship / Business</option>
                <option value="company">Limited Company (Corporate)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Full Name / Registered Enterprise
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Mary Wanjiku Njuguna"
                value={formFullName}
                onChange={(e) => setFormFullName(e.target.value)}
                className="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                National ID / Passport No
              </label>
              <input
                type="text"
                required
                placeholder="e.g. 29481923"
                value={formIdNumber}
                onChange={(e) => setFormIdNumber(e.target.value)}
                className="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                KRA PIN
              </label>
              <input
                type="text"
                required
                placeholder="A012345678Z"
                value={formKraPin}
                onChange={(e) => setFormKraPin(e.target.value)}
                className="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none font-mono uppercase"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Phone Number (254...)
              </label>
              <input
                type="text"
                required
                placeholder="254712345678"
                value={formPhone}
                onChange={(e) => setFormPhone(e.target.value)}
                className="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Email Address
              </label>
              <input
                type="email"
                placeholder="borrower@example.com"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                className="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Declared Monthly Income (KES)
              </label>
              <input
                type="number"
                required
                value={formIncome}
                onChange={(e) => setFormIncome(Number(e.target.value))}
                className="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none font-mono font-bold"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                County
              </label>
              <input
                type="text"
                value={formCounty}
                onChange={(e) => setFormCounty(e.target.value)}
                className="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none"
              />
            </div>
          </div>

          {/* Next of Kin */}
          <div className="p-3 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
            <h4 className="font-bold text-slate-900 dark:text-slate-100 text-[11px] uppercase">
              Next of Kin / Guarantor Undertaking
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div>
                <label className="block text-[10px] text-slate-500 mb-0.5">Kin Name</label>
                <input
                  type="text"
                  placeholder="Full name"
                  value={formKinName}
                  onChange={(e) => setFormKinName(e.target.value)}
                  className="w-full p-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-500 mb-0.5">Relationship</label>
                <input
                  type="text"
                  value={formKinRelation}
                  onChange={(e) => setFormKinRelation(e.target.value)}
                  className="w-full p-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-500 mb-0.5">Phone Number</label>
                <input
                  type="text"
                  value={formKinPhone}
                  onChange={(e) => setFormKinPhone(e.target.value)}
                  className="w-full p-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-mono"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
            >
              Complete Customer KYC
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
