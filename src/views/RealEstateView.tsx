import React, { useState, useEffect } from 'react';
import {
  Building2,
  Home,
  MapPin,
  Plus,
  Search,
  DollarSign,
  FileText,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Wrench,
  User,
  Phone,
  Trash2,
  Edit,
  Grid,
  List,
  Check,
  ShieldCheck,
  Layers,
  ArrowUpRight,
  TrendingUp,
  Tag,
  Clock,
  Download,
  Share2,
  ExternalLink,
} from 'lucide-react';
import { PropertyListing, MaintenanceRequest } from '../types/erp';
import { DataService } from '../services/dataService';
import { useAuth } from '../context/AuthContext';
import { Modal } from '../components/common/Modal';

interface RealEstateViewProps {
  initialTab?: 'all' | 'sale' | 'rent' | 'maintenance';
}

export const RealEstateView: React.FC<RealEstateViewProps> = ({ initialTab = 'all' }) => {
  const { currentUser, hasPermission } = useAuth();
  const [properties, setProperties] = useState<PropertyListing[]>(() => DataService.getProperties());
  const [maintenance, setMaintenance] = useState<MaintenanceRequest[]>(() => DataService.getMaintenanceRequests());
  
  const [activeTab, setActiveTab] = useState<'all' | 'sale' | 'rent' | 'maintenance'>(initialTab);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [countyFilter, setCountyFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Synchronize with initialTab if it changes from sidebar navigation
  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Add / Edit Property Modal State
  const [isPropertyModalOpen, setIsPropertyModalOpen] = useState(false);
  const [editPropertyId, setEditPropertyId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formType, setFormType] = useState<'land_plot' | 'house_rental' | 'commercial' | 'apartment'>('land_plot');
  const [formCategory, setFormCategory] = useState<'sale' | 'rent'>('sale');
  const [formLocation, setFormLocation] = useState('');
  const [formCounty, setFormCounty] = useState('Kiambu');
  const [formSize, setFormSize] = useState('50x100 ft');
  const [formPrice, setFormPrice] = useState(850000);
  const [formDeposit, setFormDeposit] = useState(0);
  const [formTitleDeed, setFormTitleDeed] = useState('');
  const [formStatus, setFormStatus] = useState<'available' | 'reserved' | 'sold' | 'occupied' | 'maintenance'>('available');
  const [formDescription, setFormDescription] = useState('');
  const [formTenantName, setFormTenantName] = useState('');
  const [formTenantPhone, setFormTenantPhone] = useState('');
  const [formLeaseStart, setFormLeaseStart] = useState('');
  const [formLeaseEnd, setFormLeaseEnd] = useState('');
  const [formImage, setFormImage] = useState('https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&q=80&w=800');

  // Maintenance Modal State
  const [isMaintModalOpen, setIsMaintModalOpen] = useState(false);
  const [maintPropertyId, setMaintPropertyId] = useState('');
  const [maintTenant, setMaintTenant] = useState('');
  const [maintIssue, setMaintIssue] = useState('');
  const [maintPriority, setMaintPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [maintCost, setMaintCost] = useState(0);

  // Inquiry / Site Visit Modal State
  const [isInquiryModalOpen, setIsInquiryModalOpen] = useState(false);
  const [inquiryProperty, setInquiryProperty] = useState<PropertyListing | null>(null);
  const [inquiryClientName, setInquiryClientName] = useState('');
  const [inquiryClientPhone, setInquiryClientPhone] = useState('');
  const [inquiryDate, setInquiryDate] = useState(new Date().toISOString().split('T')[0]);
  const [inquirySuccessMsg, setInquirySuccessMsg] = useState('');

  // Collect Rent Modal State
  const [isRentModalOpen, setIsRentModalOpen] = useState(false);
  const [rentProperty, setRentProperty] = useState<PropertyListing | null>(null);
  const [rentPaymentMethod, setRentPaymentMethod] = useState('mpesa');
  const [rentReference, setRentReference] = useState('MP-' + Date.now().toString().slice(-6));
  const [rentSuccessMsg, setRentSuccessMsg] = useState('');

  const refreshData = () => {
    setProperties(DataService.getProperties());
    setMaintenance(DataService.getMaintenanceRequests());
  };

  // Metrics Calculations
  const saleProperties = properties.filter((p) => p.category === 'sale');
  const rentProperties = properties.filter((p) => p.category === 'rent');
  const totalSaleValue = saleProperties.reduce((sum, p) => sum + (p.price || 0), 0);
  const totalMonthlyRentPotential = rentProperties.reduce((sum, p) => sum + (p.price || 0), 0);
  const occupiedRentalsCount = rentProperties.filter((p) => p.status === 'occupied').length;
  const occupancyRate = rentProperties.length > 0 ? Math.round((occupiedRentalsCount / rentProperties.length) * 100) : 0;
  const pendingMaintenanceCount = maintenance.filter((m) => m.status !== 'resolved').length;

  const handleOpenAddProperty = (categoryPref?: 'sale' | 'rent') => {
    resetPropertyForm();
    if (categoryPref) {
      setFormCategory(categoryPref);
      setFormType(categoryPref === 'sale' ? 'land_plot' : 'house_rental');
      setFormPrice(categoryPref === 'sale' ? 850000 : 45000);
      setFormSize(categoryPref === 'sale' ? '50x100 ft' : '2 Bedroom');
      setFormImage(
        categoryPref === 'sale'
          ? 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&q=80&w=800'
          : 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&q=80&w=800'
      );
    }
    setIsPropertyModalOpen(true);
  };

  const handleEditProperty = (prop: PropertyListing) => {
    setEditPropertyId(prop.id);
    setFormTitle(prop.title);
    setFormType(prop.propertyType);
    setFormCategory(prop.category);
    setFormLocation(prop.location);
    setFormCounty(prop.county);
    setFormSize(prop.size);
    setFormPrice(prop.price);
    setFormDeposit(prop.deposit || 0);
    setFormTitleDeed(prop.titleDeedNumber || '');
    setFormStatus(prop.status);
    setFormDescription(prop.description);
    setFormTenantName(prop.tenantName || '');
    setFormTenantPhone(prop.tenantPhone || '');
    setFormLeaseStart(prop.leaseStart || '');
    setFormLeaseEnd(prop.leaseEnd || '');
    setFormImage(prop.image);
    setIsPropertyModalOpen(true);
  };

  const handleSaveProperty = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    const newProp: PropertyListing = {
      id: editPropertyId || `PROP-${Date.now().toString().slice(-4)}`,
      title: formTitle,
      propertyType: formType,
      category: formCategory,
      location: formLocation,
      county: formCounty,
      size: formSize,
      price: Number(formPrice),
      deposit: formCategory === 'rent' ? Number(formDeposit) : undefined,
      titleDeedNumber: formCategory === 'sale' ? formTitleDeed : undefined,
      status: formStatus,
      description: formDescription,
      features:
        formCategory === 'sale'
          ? ['Ready Title Deed', 'Beacons Placed', 'Freehold Transfer', 'Access Road']
          : ['Borehole Water', 'Ample Parking', 'Security Guards', 'Prepaid Electricity'],
      image: formImage,
      tenantName: formCategory === 'rent' ? formTenantName : undefined,
      tenantPhone: formCategory === 'rent' ? formTenantPhone : undefined,
      leaseStart: formCategory === 'rent' ? formLeaseStart : undefined,
      leaseEnd: formCategory === 'rent' ? formLeaseEnd : undefined,
      createdAt: editPropertyId ? properties.find((p) => p.id === editPropertyId)?.createdAt || new Date().toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    };

    DataService.saveProperty(newProp, currentUser);
    refreshData();
    setIsPropertyModalOpen(false);
    resetPropertyForm();
  };

  const resetPropertyForm = () => {
    setEditPropertyId(null);
    setFormTitle('');
    setFormType('land_plot');
    setFormCategory('sale');
    setFormLocation('');
    setFormCounty('Kiambu');
    setFormSize('50x100 ft');
    setFormPrice(850000);
    setFormDeposit(0);
    setFormTitleDeed('');
    setFormStatus('available');
    setFormDescription('');
    setFormTenantName('');
    setFormTenantPhone('');
    setFormLeaseStart('');
    setFormLeaseEnd('');
    setFormImage('https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&q=80&w=800');
  };

  const handleDeleteProperty = (id: string) => {
    if (!currentUser || !window.confirm('Are you sure you want to delete this property listing?')) return;
    DataService.deleteProperty(id, currentUser);
    refreshData();
  };

  const handleSaveMaintenance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    const prop = properties.find((p) => p.id === maintPropertyId);

    const newReq: MaintenanceRequest = {
      id: `MAINT-${Date.now().toString().slice(-4)}`,
      propertyId: maintPropertyId,
      propertyTitle: prop?.title || 'General Property',
      tenantName: maintTenant || prop?.tenantName || 'Tenant',
      issue: maintIssue,
      priority: maintPriority,
      status: 'pending',
      cost: Number(maintCost),
      dateReported: new Date().toISOString().split('T')[0],
    };

    DataService.saveMaintenanceRequest(newReq, currentUser);
    refreshData();
    setIsMaintModalOpen(false);
    setMaintIssue('');
    setMaintCost(0);
  };

  const handleBookInquiry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inquiryProperty || !currentUser) return;

    setInquirySuccessMsg(
      `Site visit & purchase inquiry booked for ${inquiryClientName} on ${inquiryDate}. Our sales team has been notified.`
    );
    setTimeout(() => {
      setIsInquiryModalOpen(false);
      setInquirySuccessMsg('');
      setInquiryClientName('');
      setInquiryClientPhone('');
    }, 2500);
  };

  const handleRecordRentPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rentProperty || !currentUser) return;

    setRentSuccessMsg(
      `Rent payment of KES ${rentProperty.price.toLocaleString()} recorded for ${rentProperty.tenantName || 'Tenant'} via ${rentPaymentMethod.toUpperCase()} (Ref: ${rentReference}).`
    );
    setTimeout(() => {
      setIsRentModalOpen(false);
      setRentSuccessMsg('');
    }, 2500);
  };

  // Filter properties
  const filteredProperties = properties.filter((p) => {
    if (activeTab === 'sale' && p.category !== 'sale') return false;
    if (activeTab === 'rent' && p.category !== 'rent') return false;
    if (typeFilter !== 'all' && p.propertyType !== typeFilter) return false;
    if (statusFilter !== 'all' && p.status !== statusFilter) return false;
    if (countyFilter !== 'all' && p.county.toLowerCase() !== countyFilter.toLowerCase()) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        p.title.toLowerCase().includes(q) ||
        p.location.toLowerCase().includes(q) ||
        p.county.toLowerCase().includes(q) ||
        (p.titleDeedNumber && p.titleDeedNumber.toLowerCase().includes(q)) ||
        (p.tenantName && p.tenantName.toLowerCase().includes(q)) ||
        (p.tenantPhone && p.tenantPhone.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-teal-900 via-emerald-900 to-slate-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div
          className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 bg-no-repeat bg-cover pointer-events-none"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&q=80&w=800')`,
          }}
        />
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Property & Real Estate Module
              </span>
              <span className="text-xs text-slate-300">
                {activeTab === 'all'
                  ? 'Overview & Property Portfolio'
                  : activeTab === 'sale'
                  ? 'Land & Plots for Sale'
                  : activeTab === 'rent'
                  ? 'House & Apartment Rentals'
                  : 'Property Maintenance'}
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight mt-1">
              {activeTab === 'all' && 'Property Management Portfolio'}
              {activeTab === 'sale' && 'Land & Plots for Sale (Titled Parcels)'}
              {activeTab === 'rent' && 'House & Apartment Rentals (Tenancy & Leases)'}
              {activeTab === 'maintenance' && 'Maintenance & Tenant Repair Tickets'}
            </h1>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl">
              Unified real estate management for DAVETECH ERP. Manage titled land and plots for sale, execute tenant leases and house rentals, track monthly rent collection, and resolve maintenance tickets.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleOpenAddProperty('sale')}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-lg transition"
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Add Land Plot</span>
            </button>
            <button
              onClick={() => handleOpenAddProperty('rent')}
              className="px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-lg transition"
            >
              <Home className="w-3.5 h-3.5" />
              <span>Add House Rental</span>
            </button>
            <button
              onClick={() => setIsMaintModalOpen(true)}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-slate-700 shadow-lg transition"
            >
              <Wrench className="w-3.5 h-3.5 text-amber-400" />
              <span>Log Ticket</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Portfolio */}
        <div
          onClick={() => setActiveTab('all')}
          className={`p-5 rounded-2xl bg-white dark:bg-slate-900 border transition cursor-pointer ${
            activeTab === 'all'
              ? 'border-emerald-500 shadow-md ring-2 ring-emerald-500/20'
              : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Total Properties
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-2 font-mono">
            {properties.length}
          </p>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
            <span>{saleProperties.length} Plots • {rentProperties.length} Rentals</span>
            <span className="text-emerald-600 font-semibold">Active</span>
          </div>
        </div>

        {/* Card 2: Land & Plots for Sale */}
        <div
          onClick={() => setActiveTab('sale')}
          className={`p-5 rounded-2xl bg-white dark:bg-slate-900 border transition cursor-pointer ${
            activeTab === 'sale'
              ? 'border-emerald-500 shadow-md ring-2 ring-emerald-500/20'
              : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Land & Plots for Sale
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <MapPin className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-2 font-mono">
            {saleProperties.length}{' '}
            <span className="text-xs font-normal text-slate-400">plots</span>
          </p>
          <div className="mt-2 flex items-center justify-between text-[11px] text-amber-600 dark:text-amber-400">
            <span>Valuation: KES {totalSaleValue.toLocaleString()}</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Card 3: House Rentals & Tenancy */}
        <div
          onClick={() => setActiveTab('rent')}
          className={`p-5 rounded-2xl bg-white dark:bg-slate-900 border transition cursor-pointer ${
            activeTab === 'rent'
              ? 'border-emerald-500 shadow-md ring-2 ring-emerald-500/20'
              : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              House Rentals & Tenancy
            </span>
            <div className="w-8 h-8 rounded-xl bg-teal-50 dark:bg-teal-950 text-teal-600 dark:text-teal-400 flex items-center justify-center">
              <Home className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-2 font-mono">
            {occupancyRate}%{' '}
            <span className="text-xs font-normal text-slate-400">occupancy</span>
          </p>
          <div className="mt-2 flex items-center justify-between text-[11px] text-teal-600 dark:text-teal-400">
            <span>KES {totalMonthlyRentPotential.toLocaleString()} / mo</span>
            <span>{occupiedRentalsCount}/{rentProperties.length} occupied</span>
          </div>
        </div>

        {/* Card 4: Maintenance Tickets */}
        <div
          onClick={() => setActiveTab('maintenance')}
          className={`p-5 rounded-2xl bg-white dark:bg-slate-900 border transition cursor-pointer ${
            activeTab === 'maintenance'
              ? 'border-emerald-500 shadow-md ring-2 ring-emerald-500/20'
              : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Maintenance & Repairs
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <Wrench className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-2 font-mono">
            {maintenance.length}{' '}
            <span className="text-xs font-normal text-slate-400">tickets</span>
          </p>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
            <span className={pendingMaintenanceCount > 0 ? 'text-amber-500 font-semibold' : 'text-emerald-500'}>
              {pendingMaintenanceCount} pending resolution
            </span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>

      {/* Main Tabs Navigation & Filter Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2 overflow-x-auto">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
                activeTab === 'all'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Property Management ({properties.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('sale')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
                activeTab === 'sale'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Land & Plots for Sale ({saleProperties.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('rent')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
                activeTab === 'rent'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <Home className="w-3.5 h-3.5" />
              <span>House Rentals ({rentProperties.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('maintenance')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
                activeTab === 'maintenance'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>Maintenance & Repairs ({maintenance.length})</span>
            </button>
          </div>

          {activeTab !== 'maintenance' && (
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg text-xs font-medium transition ${
                  viewMode === 'grid'
                    ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
                title="Grid View"
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg text-xs font-medium transition ${
                  viewMode === 'table'
                    ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
                title="Table View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Filter Controls Bar */}
        {activeTab !== 'maintenance' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search plot, title, tenant, area..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium"
            >
              <option value="all">All Property Types</option>
              <option value="land_plot">Land & Plots</option>
              <option value="house_rental">House Rentals</option>
              <option value="apartment">Apartments</option>
              <option value="commercial">Commercial Redevelopment</option>
            </select>

            <select
              value={countyFilter}
              onChange={(e) => setCountyFilter(e.target.value)}
              className="py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium"
            >
              <option value="all">All Counties</option>
              <option value="kiambu">Kiambu County</option>
              <option value="kajiado">Kajiado County</option>
              <option value="nairobi">Nairobi County</option>
              <option value="machakos">Machakos County</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium"
            >
              <option value="all">All Statuses</option>
              <option value="available">Available</option>
              <option value="occupied">Occupied (Rentals)</option>
              <option value="reserved">Reserved</option>
              <option value="sold">Sold Out</option>
            </select>
          </div>
        )}
      </div>

      {/* Content Rendering */}
      {activeTab !== 'maintenance' ? (
        viewMode === 'grid' ? (
          /* GRID VIEW */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProperties.map((prop) => (
              <div
                key={prop.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs hover:shadow-md transition flex flex-col justify-between"
              >
                <div>
                  <div className="relative h-48 bg-slate-200 dark:bg-slate-800 overflow-hidden group">
                    <img
                      src={prop.image}
                      alt={prop.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&q=80&w=800';
                      }}
                    />
                    <div className="absolute top-3 left-3 flex flex-wrap gap-1">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          prop.category === 'sale'
                            ? 'bg-amber-500 text-white'
                            : 'bg-teal-600 text-white'
                        }`}
                      >
                        {prop.category === 'sale' ? 'Land / Plot for Sale' : 'House Rental'}
                      </span>
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          prop.status === 'available'
                            ? 'bg-emerald-500 text-white'
                            : prop.status === 'occupied'
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-600 text-white'
                        }`}
                      >
                        {prop.status}
                      </span>
                    </div>
                    <div className="absolute bottom-3 right-3 bg-slate-900/90 backdrop-blur-xs px-3 py-1 rounded-lg text-white font-bold text-sm font-mono shadow-sm">
                      {prop.category === 'sale'
                        ? `KES ${prop.price.toLocaleString()}`
                        : `KES ${prop.price.toLocaleString()} / mo`}
                    </div>
                  </div>

                  <div className="p-5 space-y-3">
                    <div>
                      <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium mb-1">
                        <MapPin className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">
                          {prop.location}, {prop.county}
                        </span>
                      </div>
                      <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 line-clamp-1">
                        {prop.title}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                        {prop.description}
                      </p>
                    </div>

                    <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                      <div className="flex justify-between text-slate-600 dark:text-slate-400">
                        <span>Dimensions / Size:</span>
                        <span className="font-semibold text-slate-900 dark:text-slate-200">
                          {prop.size}
                        </span>
                      </div>

                      {prop.titleDeedNumber && (
                        <div className="flex justify-between text-slate-600 dark:text-slate-400">
                          <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                            <ShieldCheck className="w-3.5 h-3.5" /> Title Deed:
                          </span>
                          <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                            {prop.titleDeedNumber}
                          </span>
                        </div>
                      )}

                      {prop.category === 'rent' && prop.deposit ? (
                        <div className="flex justify-between text-slate-600 dark:text-slate-400">
                          <span>Security Deposit:</span>
                          <span className="font-mono text-slate-900 dark:text-slate-200">
                            KES {prop.deposit.toLocaleString()}
                          </span>
                        </div>
                      ) : null}

                      {prop.tenantName && (
                        <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 space-y-1">
                          <div className="flex justify-between font-semibold text-slate-800 dark:text-slate-200">
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3 text-teal-500" /> {prop.tenantName}
                            </span>
                            <span className="text-[10px] text-emerald-500 font-mono">Active Lease</span>
                          </div>
                          {prop.tenantPhone && (
                            <div className="text-[11px] text-slate-500 flex items-center gap-1">
                              <Phone className="w-3 h-3 text-slate-400" /> {prop.tenantPhone}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-1 pt-1">
                      {(prop.features || []).slice(0, 3).map((f, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] text-slate-600 dark:text-slate-300 font-medium"
                        >
                          {f}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="p-5 pt-0">
                  <div className="flex justify-between items-center pt-3 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] text-slate-400">ID: {prop.id}</span>
                    <div className="flex items-center gap-2">
                      {prop.category === 'rent' && prop.status === 'occupied' ? (
                        <button
                          onClick={() => {
                            setRentProperty(prop);
                            setIsRentModalOpen(true);
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300 font-semibold text-xs hover:bg-teal-100 transition flex items-center gap-1"
                        >
                          <DollarSign className="w-3 h-3" />
                          <span>Collect Rent</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            setInquiryProperty(prop);
                            setIsInquiryModalOpen(true);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 font-semibold text-xs hover:bg-emerald-100 transition"
                        >
                          Inquire
                        </button>
                      )}

                      <button
                        onClick={() => handleEditProperty(prop)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                        title="Edit Listing"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>

                      {hasPermission('settings.*') && (
                        <button
                          onClick={() => handleDeleteProperty(prop.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition"
                          title="Delete Listing"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* TABLE VIEW */
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-400 uppercase tracking-wider text-[10px]">
                    <th className="p-3 font-semibold">Ref ID</th>
                    <th className="p-3 font-semibold">Listing Title</th>
                    <th className="p-3 font-semibold">Category</th>
                    <th className="p-3 font-semibold">Location / County</th>
                    <th className="p-3 font-semibold">Size</th>
                    <th className="p-3 font-semibold">Price / Rent</th>
                    <th className="p-3 font-semibold">Title Deed / Tenant</th>
                    <th className="p-3 font-semibold">Status</th>
                    <th className="p-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredProperties.map((prop) => (
                    <tr
                      key={prop.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition"
                    >
                      <td className="p-3 font-mono font-bold text-emerald-600">{prop.id}</td>
                      <td className="p-3 font-semibold text-slate-900 dark:text-slate-100 max-w-xs truncate">
                        {prop.title}
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            prop.category === 'sale'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                              : 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300'
                          }`}
                        >
                          {prop.category === 'sale' ? 'Sale' : 'Rent'}
                        </span>
                      </td>
                      <td className="p-3 text-slate-600 dark:text-slate-300">
                        {prop.location}, {prop.county}
                      </td>
                      <td className="p-3 font-medium text-slate-800 dark:text-slate-200">
                        {prop.size}
                      </td>
                      <td className="p-3 font-mono font-bold text-slate-900 dark:text-slate-100">
                        KES {prop.price.toLocaleString()}
                        {prop.category === 'rent' && <span className="text-[10px] text-slate-400 font-normal"> / mo</span>}
                      </td>
                      <td className="p-3 text-slate-600 dark:text-slate-300">
                        {prop.titleDeedNumber ? (
                          <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                            {prop.titleDeedNumber}
                          </span>
                        ) : prop.tenantName ? (
                          <span>{prop.tenantName}</span>
                        ) : (
                          <span className="text-slate-400 italic">—</span>
                        )}
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            prop.status === 'available'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : prop.status === 'occupied'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                              : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                          }`}
                        >
                          {prop.status}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleEditProperty(prop)}
                            className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                            title="Edit"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          {hasPermission('settings.*') && (
                            <button
                              onClick={() => handleDeleteProperty(prop.id)}
                              className="p-1 rounded text-slate-400 hover:text-rose-600"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      ) : (
        /* MAINTENANCE TABLE VIEW */
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                Property Maintenance & Tenant Repair Tickets
              </h3>
              <p className="text-xs text-slate-500">
                Plumbing, electrical, structural, and fixture work orders.
              </p>
            </div>
            <button
              onClick={() => setIsMaintModalOpen(true)}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Log Maintenance Ticket</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-400 uppercase tracking-wider text-[10px]">
                  <th className="p-3 font-semibold">Ticket ID</th>
                  <th className="p-3 font-semibold">Property</th>
                  <th className="p-3 font-semibold">Tenant</th>
                  <th className="p-3 font-semibold">Issue Description</th>
                  <th className="p-3 font-semibold">Priority</th>
                  <th className="p-3 font-semibold">Cost (KES)</th>
                  <th className="p-3 font-semibold">Status</th>
                  <th className="p-3 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {maintenance.map((m) => (
                  <tr
                    key={m.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition"
                  >
                    <td className="p-3 font-mono font-bold text-emerald-600">{m.id}</td>
                    <td className="p-3 font-medium text-slate-900 dark:text-slate-100">
                      {m.propertyTitle}
                    </td>
                    <td className="p-3 text-slate-600 dark:text-slate-300">{m.tenantName}</td>
                    <td className="p-3 text-slate-700 dark:text-slate-200 max-w-sm">{m.issue}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          m.priority === 'urgent'
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                            : m.priority === 'high'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                        }`}
                      >
                        {m.priority}
                      </span>
                    </td>
                    <td className="p-3 font-mono font-semibold">
                      KES {m.cost.toLocaleString()}
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          m.status === 'resolved'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        }`}
                      >
                        {m.status}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => {
                          m.status = m.status === 'resolved' ? 'pending' : 'resolved';
                          DataService.saveMaintenanceRequest(m, currentUser!);
                          refreshData();
                        }}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-950/40 transition font-medium text-[11px]"
                      >
                        {m.status === 'resolved' ? 'Reopen' : 'Mark Resolved'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT PROPERTY LISTING */}
      <Modal
        isOpen={isPropertyModalOpen}
        onClose={() => setIsPropertyModalOpen(false)}
        title={editPropertyId ? 'Edit Property Listing' : 'Add Property, Land Plot or Rental'}
        subtitle="Manage land for sale, house rentals, or commercial listings."
        maxWidth="lg"
      >
        <form onSubmit={handleSaveProperty} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Listing Title
            </label>
            <input
              type="text"
              required
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              placeholder="e.g. Kitengela Prime 50x100 Plot with Ready Title"
              className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Category
              </label>
              <select
                value={formCategory}
                onChange={(e) => {
                  const cat = e.target.value as 'sale' | 'rent';
                  setFormCategory(cat);
                  if (cat === 'sale') {
                    setFormType('land_plot');
                    setFormPrice(850000);
                  } else {
                    setFormType('house_rental');
                    setFormPrice(45000);
                  }
                }}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              >
                <option value="sale">For Sale (Land & Plots)</option>
                <option value="rent">For Rent (Houses & Apartments)</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Property Type
              </label>
              <select
                value={formType}
                onChange={(e) => setFormType(e.target.value as any)}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              >
                <option value="land_plot">Land / Plot</option>
                <option value="house_rental">House Rental</option>
                <option value="apartment">Apartment</option>
                <option value="commercial">Commercial Redevelopment</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Location / Neighborhood
              </label>
              <input
                type="text"
                required
                value={formLocation}
                onChange={(e) => setFormLocation(e.target.value)}
                placeholder="e.g. Kitengela Acacia / Ruaka"
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                County
              </label>
              <input
                type="text"
                required
                value={formCounty}
                onChange={(e) => setFormCounty(e.target.value)}
                placeholder="e.g. Kiambu / Kajiado / Nairobi"
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Size / Dimensions
              </label>
              <input
                type="text"
                required
                value={formSize}
                onChange={(e) => setFormSize(e.target.value)}
                placeholder="50x100 ft or 3 Bed"
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {formCategory === 'sale' ? 'Sale Price (KES)' : 'Monthly Rent (KES)'}
              </label>
              <input
                type="number"
                required
                value={formPrice}
                onChange={(e) => setFormPrice(Number(e.target.value))}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Status
              </label>
              <select
                value={formStatus}
                onChange={(e) => setFormStatus(e.target.value as any)}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              >
                <option value="available">Available</option>
                <option value="occupied">Occupied</option>
                <option value="reserved">Reserved</option>
                <option value="sold">Sold Out</option>
              </select>
            </div>
          </div>

          {formCategory === 'sale' ? (
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Title Deed Number (Land Registry)
              </label>
              <input
                type="text"
                value={formTitleDeed}
                onChange={(e) => setFormTitleDeed(e.target.value)}
                placeholder="e.g. KJD/KTG/2024/89421"
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono outline-none"
              />
            </div>
          ) : (
            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-3 border border-slate-200 dark:border-slate-700">
              <span className="font-bold text-[11px] text-teal-600 uppercase tracking-wider block">
                Tenant & Lease Information
              </span>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Security Deposit (KES)
                  </label>
                  <input
                    type="number"
                    value={formDeposit}
                    onChange={(e) => setFormDeposit(Number(e.target.value))}
                    className="w-full p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Tenant Name
                  </label>
                  <input
                    type="text"
                    value={formTenantName}
                    onChange={(e) => setFormTenantName(e.target.value)}
                    placeholder="e.g. Grace Achieng"
                    className="w-full p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Tenant Phone
                  </label>
                  <input
                    type="text"
                    value={formTenantPhone}
                    onChange={(e) => setFormTenantPhone(e.target.value)}
                    placeholder="+254 722 000 000"
                    className="w-full p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Lease Expiry Date
                  </label>
                  <input
                    type="date"
                    value={formLeaseEnd}
                    onChange={(e) => setFormLeaseEnd(e.target.value)}
                    className="w-full p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  />
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Image URL
            </label>
            <input
              type="text"
              required
              value={formImage}
              onChange={(e) => setFormImage(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Description & Features
            </label>
            <textarea
              rows={3}
              required
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              placeholder="Describe access roads, water, electricity, beacons, fencing..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsPropertyModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-md transition"
            >
              {editPropertyId ? 'Save Changes' : 'Publish Listing'}
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: INQUIRY & SITE VISIT BOOKING */}
      <Modal
        isOpen={isInquiryModalOpen}
        onClose={() => setIsInquiryModalOpen(false)}
        title="Inquire / Schedule Site Visit"
        subtitle={inquiryProperty?.title || 'Property Inquiry'}
        maxWidth="md"
      >
        {inquirySuccessMsg ? (
          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-500 rounded-xl text-emerald-800 dark:text-emerald-200 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{inquirySuccessMsg}</span>
          </div>
        ) : (
          <form onSubmit={handleBookInquiry} className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div>
                <p className="font-semibold text-slate-900 dark:text-slate-100">{inquiryProperty?.title}</p>
                <p className="text-slate-500 text-[11px]">{inquiryProperty?.location}, {inquiryProperty?.county}</p>
              </div>
              <span className="font-mono font-bold text-emerald-600 text-sm">
                KES {inquiryProperty?.price.toLocaleString()}
              </span>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Client / Buyer Full Name
              </label>
              <input
                type="text"
                required
                value={inquiryClientName}
                onChange={(e) => setInquiryClientName(e.target.value)}
                placeholder="e.g. Samuel Karanja"
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Phone Number
                </label>
                <input
                  type="text"
                  required
                  value={inquiryClientPhone}
                  onChange={(e) => setInquiryClientPhone(e.target.value)}
                  placeholder="+254 7..."
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Preferred Visit Date
                </label>
                <input
                  type="date"
                  required
                  value={inquiryDate}
                  onChange={(e) => setInquiryDate(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsInquiryModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
              >
                Confirm Site Visit
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* MODAL: COLLECT RENT */}
      <Modal
        isOpen={isRentModalOpen}
        onClose={() => setIsRentModalOpen(false)}
        title="Record Monthly Rent Payment"
        subtitle={rentProperty?.title || 'House Rental'}
        maxWidth="md"
      >
        {rentSuccessMsg ? (
          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-500 rounded-xl text-emerald-800 dark:text-emerald-200 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{rentSuccessMsg}</span>
          </div>
        ) : (
          <form onSubmit={handleRecordRentPayment} className="space-y-4 text-xs">
            <div className="p-3 bg-teal-50 dark:bg-teal-950/50 rounded-xl border border-teal-200 dark:border-teal-800 flex items-center justify-between">
              <div>
                <p className="font-semibold text-slate-900 dark:text-slate-100">
                  Tenant: {rentProperty?.tenantName || 'Authorized Tenant'}
                </p>
                <p className="text-slate-500 text-[11px]">{rentProperty?.location}</p>
              </div>
              <span className="font-mono font-bold text-teal-600 dark:text-teal-400 text-base">
                KES {rentProperty?.price.toLocaleString()}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Payment Method
                </label>
                <select
                  value={rentPaymentMethod}
                  onChange={(e) => setRentPaymentMethod(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                >
                  <option value="mpesa">M-Pesa Paybill</option>
                  <option value="bank">Bank Transfer / EFT</option>
                  <option value="cash">Cash at Counter</option>
                  <option value="cheque">Banker's Cheque</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Transaction Reference
                </label>
                <input
                  type="text"
                  required
                  value={rentReference}
                  onChange={(e) => setRentReference(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsRentModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold"
              >
                Post Rent Payment
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* MODAL: LOG MAINTENANCE */}
      <Modal
        isOpen={isMaintModalOpen}
        onClose={() => setIsMaintModalOpen(false)}
        title="Log Maintenance or Repair Ticket"
        subtitle="Track plumbing, electrical, or structural repairs."
        maxWidth="md"
      >
        <form onSubmit={handleSaveMaintenance} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Select Property
            </label>
            <select
              value={maintPropertyId}
              onChange={(e) => setMaintPropertyId(e.target.value)}
              required
              className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            >
              <option value="">-- Choose Rental Property --</option>
              {properties
                .filter((p) => p.category === 'rent')
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title} ({p.tenantName || 'Vacant'})
                  </option>
                ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Priority
              </label>
              <select
                value={maintPriority}
                onChange={(e) => setMaintPriority(e.target.value as any)}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Estimated Cost (KES)
              </label>
              <input
                type="number"
                value={maintCost}
                onChange={(e) => setMaintCost(Number(e.target.value))}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Issue Description
            </label>
            <textarea
              rows={3}
              required
              value={maintIssue}
              onChange={(e) => setMaintIssue(e.target.value)}
              placeholder="e.g. Water heater leakage in master bathroom, pipe replacement needed..."
              className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsMaintModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
            >
              Submit Ticket
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
