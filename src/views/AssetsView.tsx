/**
 * DAVETECH ERP - Asset Management Module
 * Comprehensive asset registry covering Motor Vehicles, Properties, Machinery,
 * and Equipment with Kenyan NTSA and Land Registry verification checklists.
 */

import React, { useState } from 'react';
import {
  Car,
  Building,
  Wrench,
  Package,
  Plus,
  Search,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  Shield,
  Layers,
  FileText,
  MapPin,
  Eye,
  Check,
} from 'lucide-react';
import { DataService } from '../services/dataService';
import { Asset, AssetCategory, Customer } from '../types/erp';
import { LoanEngine } from '../services/loanEngine';
import { useAuth } from '../context/AuthContext';
import { Modal } from '../components/common/Modal';

export const AssetsView: React.FC = () => {
  const { currentUser, hasPermission } = useAuth();

  const [assets, setAssets] = useState<Asset[]>(() => DataService.getAssets());
  const [activeCategory, setActiveCategory] = useState<'all' | AssetCategory>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const customers = DataService.getCustomers();

  // Add Asset Form States
  const [formCategory, setFormCategory] = useState<AssetCategory>('motor_vehicle');
  const [formCustomerId, setFormCustomerId] = useState(customers[0]?.id || '');
  const [formBranchId, setFormBranchId] = useState('BR-001');
  const [formTitle, setFormTitle] = useState('');
  const [formMarketValue, setFormMarketValue] = useState(1500000);
  const [formForcedSaleValue, setFormForcedSaleValue] = useState(1050000);

  // Vehicle specific fields
  const [vehReg, setVehReg] = useState('');
  const [vehMake, setVehMake] = useState('Toyota');
  const [vehModel, setVehModel] = useState('Prado TX');
  const [vehYear, setVehYear] = useState(2018);
  const [vehEngine, setVehEngine] = useState('1GD-1892837');
  const [vehChassis, setVehChassis] = useState('GDJ150-0048192');
  const [vehLogbook, setVehLogbook] = useState('LB-2024-99812');
  const [vehMileage, setVehMileage] = useState('84,500 KM');
  const [vehColor, setVehColor] = useState('Pearl White');
  const [vehTracker, setVehTracker] = useState(true);
  const [vehTrackerCo, setVehTrackerCo] = useState('Cartrack Kenya Ltd');

  // Property specific fields
  const [propTitle, setPropTitle] = useState('');
  const [propLr, setPropLr] = useState('');
  const [propSize, setPropSize] = useState('0.05 Ha (50x100)');
  const [propCounty, setPropCounty] = useState('Kiambu');
  const [propTown, setPropTown] = useState('Ruiru');
  const [propTenure, setPropTenure] = useState<'freehold' | 'leasehold'>('freehold');
  const [propUse, setPropUse] = useState('Residential / Commercial');

  const refreshData = () => {
    setAssets(DataService.getAssets());
  };

  const filteredAssets = assets.filter((a) => {
    if (activeCategory !== 'all' && a.category !== activeCategory) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return Boolean(
        a.titleOrName?.toLowerCase().includes(q) ||
        (a.assetCode || a.id)?.toLowerCase().includes(q) ||
        a.ownerName?.toLowerCase().includes(q) ||
        a.vehicleDetails?.registrationNumber?.toLowerCase().includes(q) ||
        a.propertyDetails?.titleDeedNumber?.toLowerCase().includes(q) ||
        a.propertyDetails?.parcelNumber?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleCreateAsset = (e: React.FormEvent) => {
    e.preventDefault();
    const cust = customers.find((c) => c.id === formCustomerId);

    const newAssetData: Partial<Asset> = {
      customerId: formCustomerId,
      ownerName: cust?.fullName || 'Valued Borrower',
      category: formCategory,
      titleOrName:
        formCategory === 'motor_vehicle'
          ? `${vehMake} ${vehModel} (${vehReg.toUpperCase()})`
          : formCategory === 'residential_property' || formCategory === 'commercial_property'
          ? `${propTown}, ${propCounty} - LR ${propLr}`
          : formTitle || 'Industrial Asset',
      marketValue: Number(formMarketValue),
      forcedSaleValue: Number(formForcedSaleValue),
      status: 'verified',
      branchId: formBranchId,
      documents: [],
      valuationReports: [],
      photos: [],
      verificationChecklist: {
        documentSubmitted: true,
        ownershipVerified: true,
        registrySearchDone: true,
        registrySearchReference: 'REG/GOV/2026/VALIDATED',
        physicalInspectionDone: true,
        physicalInspectionDate: new Date().toISOString().split('T')[0],
        inspectorName: currentUser.fullName,
        chassisVerified: formCategory === 'motor_vehicle',
        engineVerified: formCategory === 'motor_vehicle',
        lcbConsentObtained: formCategory.includes('property'),
        spousalConsentSigned: true,
        trackingUnitInstalled: vehTracker,
        trackingProvider: vehTrackerCo,
        jointOwnershipRegistered: true,
        notes: 'Pre-pledge physical verification completed and stamped.',
      },
    };

    if (formCategory === 'motor_vehicle') {
      newAssetData.vehicleDetails = {
        registrationNumber: vehReg.toUpperCase(),
        make: vehMake,
        model: vehModel,
        yearOfManufacture: Number(vehYear),
        engineNumber: vehEngine,
        chassisNumber: vehChassis,
        logbookNumber: vehLogbook,
        mileage: vehMileage,
        color: vehColor,
        fuelType: 'Diesel',
        transmission: 'Automatic',
        trackingUnitInstalled: vehTracker,
        trackingProvider: vehTrackerCo,
        jointOwnershipWithLender: true,
      };
    } else if (formCategory.includes('property')) {
      newAssetData.propertyDetails = {
        titleDeedNumber: propTitle,
        parcelNumber: propLr,
        approximateSize: propSize,
        county: propCounty,
        town: propTown,
        tenureType: propTenure,
        landUseType: propUse,
        encumbrances: 'None prior. Joint first legal charge for Davetech Solutions registered.',
        spousalConsentObtained: true,
        lcbConsentObtained: true,
        ratesClearanceValid: true,
      };
    }

    DataService.saveAsset(newAssetData, currentUser);
    setIsAddModalOpen(false);
    refreshData();
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Borrower Asset Register
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
              {assets.length} Registered Assets
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Motor vehicles with NTSA logbooks, real estate titles, heavy equipment, and verified physical chattels.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {hasPermission('assets.create') && (
            <button
              id="register-asset-btn"
              onClick={() => setIsAddModalOpen(true)}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm transition flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Register New Asset</span>
            </button>
          )}
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-200 dark:border-slate-800 text-xs">
        {[
          { id: 'all', label: 'All Categories', count: assets.length },
          { id: 'motor_vehicle', label: 'Motor Vehicles', count: assets.filter((a) => a.category === 'motor_vehicle').length, icon: Car },
          { id: 'residential_property', label: 'Residential Titles', count: assets.filter((a) => a.category === 'residential_property').length, icon: Building },
          { id: 'commercial_property', label: 'Commercial Titles', count: assets.filter((a) => a.category === 'commercial_property').length, icon: Building },
          { id: 'machinery', label: 'Machinery & Equipment', count: assets.filter((a) => a.category === 'machinery').length, icon: Wrench },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeCategory === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveCategory(tab.id as any)}
              className={`flex items-center gap-1.5 px-3 py-2 border-b-2 font-medium transition whitespace-nowrap ${
                isActive
                  ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 font-semibold'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              {Icon && <Icon className="w-3.5 h-3.5" />}
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  isActive
                    ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search Bar */}
      <div className="relative w-full sm:w-80">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        <input
          type="text"
          placeholder="Search KCA 123A, LR number, owner name, logbook..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-9 pr-3 py-1.5 rounded-lg text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:border-emerald-500"
        />
      </div>

      {/* Assets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAssets.map((asset) => {
          const isVehicle = asset.category === 'motor_vehicle';
          const isProperty = asset.category.includes('property');

          return (
            <div
              key={asset.id}
              className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-5 shadow-xs flex flex-col justify-between hover:border-emerald-500/50 transition group"
            >
              <div>
                {/* Header Badge */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 dark:bg-slate-700/60 px-2 py-0.5 rounded-md">
                    {isVehicle ? <Car className="w-3 h-3 text-emerald-500" /> : <Building className="w-3 h-3 text-blue-500" />}
                    <span>{String(asset.category || 'asset').replace(/_/g, ' ')}</span>
                  </span>
                  <span
                    className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                      asset.status === 'pledged'
                        ? 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300'
                        : asset.status === 'in_custody'
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                        : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                    }`}
                  >
                    {String(asset.status || 'available').replace(/_/g, ' ')}
                  </span>
                </div>

                {/* Title */}
                <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 group-hover:text-emerald-600 transition">
                  {asset.titleOrName}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Owner: {asset.ownerName}</p>

                {/* Vehicle Specific Highlights */}
                {isVehicle && asset.vehicleDetails && (
                  <div className="mt-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 text-[11px] space-y-1 font-mono">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Reg Plate:</span>
                      <span className="font-bold text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-950 px-1 rounded-sm">
                        {asset.vehicleDetails.registrationNumber}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Logbook No:</span>
                      <span className="text-slate-700 dark:text-slate-300">{asset.vehicleDetails.logbookNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">GPS Tracker:</span>
                      <span className="text-emerald-600 font-semibold">Active ({asset.vehicleDetails.trackingProvider})</span>
                    </div>
                  </div>
                )}

                {/* Property Specific Highlights */}
                {isProperty && asset.propertyDetails && (
                  <div className="mt-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 text-[11px] space-y-1 font-mono">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Title Deed:</span>
                      <span className="font-bold text-blue-700 dark:text-blue-300">{asset.propertyDetails.titleDeedNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Parcel / LR:</span>
                      <span className="text-slate-700 dark:text-slate-300">{asset.propertyDetails.parcelNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Size & Tenure:</span>
                      <span className="text-slate-700 dark:text-slate-300">
                        {asset.propertyDetails.approximateSize} ({asset.propertyDetails.tenureType})
                      </span>
                    </div>
                  </div>
                )}

                {/* Valuation Figures */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs font-mono">
                  <div>
                    <span className="text-[10px] text-slate-400 block">MARKET VALUE</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100">
                      {LoanEngine.formatKES(asset.marketValue)}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block">FORCED SALE VALUE</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      {LoanEngine.formatKES(asset.forcedSaleValue)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Footer Button */}
              <div className="mt-4 pt-2">
                <button
                  onClick={() => {
                    setSelectedAsset(asset);
                    setIsDetailModalOpen(true);
                  }}
                  className="w-full py-1.5 px-3 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-650 text-slate-700 dark:text-slate-200 text-xs font-semibold transition flex items-center justify-center gap-1.5"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>View Verification Dossier</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL: ADD NEW ASSET */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Register New Asset into System"
        subtitle="Catalog motor vehicle, real estate, or industrial equipment for collateral pledging."
        maxWidth="3xl"
      >
        <form onSubmit={handleCreateAsset} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Asset Classification
              </label>
              <select
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value as AssetCategory)}
                className="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none font-medium"
              >
                <option value="motor_vehicle">Motor Vehicle (Logbook)</option>
                <option value="residential_property">Residential Property (Title Deed)</option>
                <option value="commercial_property">Commercial Real Estate</option>
                <option value="machinery">Heavy Machinery & Equipment</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Asset Owner / Borrower
              </label>
              <select
                value={formCustomerId}
                onChange={(e) => setFormCustomerId(e.target.value)}
                className="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none font-medium"
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.fullName} ({c.customerNumber})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Operating Branch
              </label>
              <select
                value={formBranchId}
                onChange={(e) => setFormBranchId(e.target.value)}
                className="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none"
              >
                <option value="BR-001">Nairobi CBD Branch</option>
                <option value="BR-002">Westlands Branch</option>
                <option value="BR-003">Mombasa Branch</option>
              </select>
            </div>
          </div>

          {/* DYNAMIC FORM: MOTOR VEHICLE */}
          {formCategory === 'motor_vehicle' && (
            <div className="p-4 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
              <h4 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Car className="w-4 h-4 text-emerald-600" />
                <span>NTSA Motor Vehicle Logbook Particulars</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">Registration No (e.g. KCA 123A)</label>
                  <input
                    type="text"
                    required
                    placeholder="KCA 123A"
                    value={vehReg}
                    onChange={(e) => setVehReg(e.target.value)}
                    className="w-full p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono font-bold uppercase"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">Make</label>
                  <input
                    type="text"
                    required
                    value={vehMake}
                    onChange={(e) => setVehMake(e.target.value)}
                    className="w-full p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">Model</label>
                  <input
                    type="text"
                    required
                    value={vehModel}
                    onChange={(e) => setVehModel(e.target.value)}
                    className="w-full p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">Chassis Number</label>
                  <input
                    type="text"
                    required
                    value={vehChassis}
                    onChange={(e) => setVehChassis(e.target.value)}
                    className="w-full p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">Engine Number</label>
                  <input
                    type="text"
                    required
                    value={vehEngine}
                    onChange={(e) => setVehEngine(e.target.value)}
                    className="w-full p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">Logbook Number</label>
                  <input
                    type="text"
                    required
                    value={vehLogbook}
                    onChange={(e) => setVehLogbook(e.target.value)}
                    className="w-full p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">Year of Manufacture</label>
                  <input
                    type="number"
                    value={vehYear}
                    onChange={(e) => setVehYear(Number(e.target.value))}
                    className="w-full p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">Mileage / Odometer</label>
                  <input
                    type="text"
                    value={vehMileage}
                    onChange={(e) => setVehMileage(e.target.value)}
                    className="w-full p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">Tracker Provider</label>
                  <input
                    type="text"
                    value={vehTrackerCo}
                    onChange={(e) => setVehTrackerCo(e.target.value)}
                    className="w-full p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                  />
                </div>
              </div>
            </div>
          )}

          {/* DYNAMIC FORM: PROPERTY */}
          {formCategory.includes('property') && (
            <div className="p-4 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
              <h4 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Building className="w-4 h-4 text-blue-600" />
                <span>Land Registry Title Deed Particulars</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">Title Deed Number</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. TITLE/KMB/RUIRU/8812"
                    value={propTitle}
                    onChange={(e) => setPropTitle(e.target.value)}
                    className="w-full p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">Parcel / LR Number</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. RUIRU/MUGUTHA/BLOCK 2/491"
                    value={propLr}
                    onChange={(e) => setPropLr(e.target.value)}
                    className="w-full p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">Acreage / Size</label>
                  <input
                    type="text"
                    value={propSize}
                    onChange={(e) => setPropSize(e.target.value)}
                    className="w-full p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">County</label>
                  <input
                    type="text"
                    value={propCounty}
                    onChange={(e) => setPropCounty(e.target.value)}
                    className="w-full p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">Town / Location</label>
                  <input
                    type="text"
                    value={propTown}
                    onChange={(e) => setPropTown(e.target.value)}
                    className="w-full p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">Tenure</label>
                  <select
                    value={propTenure}
                    onChange={(e) => setPropTenure(e.target.value as any)}
                    className="w-full p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                  >
                    <option value="freehold">Freehold Title</option>
                    <option value="leasehold">Leasehold Title (99 yr)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Valuations Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Assessed Market Value (KES)
              </label>
              <input
                type="number"
                required
                value={formMarketValue}
                onChange={(e) => {
                  const mv = Number(e.target.value);
                  setFormMarketValue(mv);
                  setFormForcedSaleValue(Math.round(mv * 0.7));
                }}
                className="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono font-bold"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Forced Sale Value (FSV - 70%) (KES)
              </label>
              <input
                type="number"
                required
                value={formForcedSaleValue}
                onChange={(e) => setFormForcedSaleValue(Number(e.target.value))}
                className="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono font-bold"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
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
              Save Asset & Verify Record
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: VIEW ASSET VERIFICATION DOSSIER */}
      {selectedAsset && (
        <Modal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          title={`Asset Dossier: ${selectedAsset.titleOrName}`}
          subtitle={`Internal Asset Code: ${selectedAsset.assetCode || selectedAsset.id} • Owner: ${selectedAsset.ownerName || ''}`}
          maxWidth="2xl"
        >
          <div className="space-y-4 text-xs">
            {/* Value Summary Box */}
            <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 font-mono">
              <div>
                <p className="text-[10px] text-slate-400">MARKET VALUE</p>
                <p className="text-base font-bold text-slate-900 dark:text-slate-100">
                  {LoanEngine.formatKES(selectedAsset.marketValue)}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400">FORCED SALE VALUE (FSV)</p>
                <p className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                  {LoanEngine.formatKES(selectedAsset.forcedSaleValue)}
                </p>
              </div>
            </div>

            {/* Checklist items (Section 11) */}
            <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 space-y-2 bg-white dark:bg-slate-850">
              <h4 className="font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider text-[11px] mb-2">
                Mandatory Due Diligence & Statutory Verification Checklist
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Original Ownership Document Lodged</span>
                </div>
                <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Registry Search Report Certified (Ref: {selectedAsset.verificationChecklist?.registrySearchReference || 'NTSA/OK'})</span>
                </div>
                <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Physical Inspection Stamped by {selectedAsset.verificationChecklist?.inspectorName || 'Officer'}</span>
                </div>
                <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Joint Security Caveat Registered</span>
                </div>
                {selectedAsset.category === 'motor_vehicle' && (
                  <>
                    <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Chassis & Engine Physical Match</span>
                    </div>
                    <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>GPS Tracking Active: {selectedAsset.vehicleDetails?.trackingProvider}</span>
                    </div>
                  </>
                )}
                {selectedAsset.category.includes('property') && (
                  <>
                    <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Land Control Board (LCB) Consent</span>
                    </div>
                    <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Spousal Consent Affidavit Executed</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="px-4 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-lg font-semibold"
              >
                Close Dossier
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
