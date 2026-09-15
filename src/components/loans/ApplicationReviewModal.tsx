/**
 * DAVETECH ERP - Application Review Modal
 * Comprehensive inspection drawer/modal for loan officers to review
 * client-submitted online applications (from WhatsApp), verify collateral,
 * chat with the client, run credit checks, and approve/disburse.
 */

import React, { useState } from 'react';
import {
  FileText,
  User,
  Phone,
  Mail,
  MapPin,
  Briefcase,
  ShieldCheck,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  XCircle,
  MessageCircle,
  Printer,
  ExternalLink,
  DollarSign,
  Calendar,
  Image as ImageIcon,
  ArrowRight,
  Sparkles,
  Tv,
  Car,
  Home
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { LoanApplication, Customer, Collateral, Asset } from '../../types/erp';
import { LoanEngine } from '../../services/loanEngine';
import { DataService } from '../../services/dataService';
import { useAuth } from '../../context/AuthContext';

interface ApplicationReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  application: LoanApplication | null;
  onApprove?: (app: LoanApplication) => void;
  onAssess?: (app: LoanApplication) => void;
  onConvertToItemAgreement?: (app: LoanApplication) => void;
}

export const ApplicationReviewModal: React.FC<ApplicationReviewModalProps> = ({
  isOpen,
  onClose,
  application,
  onApprove,
  onAssess,
  onConvertToItemAgreement,
}) => {
  const { currentUser, systemSettings } = useAuth();
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  if (!application) return null;

  const customer = DataService.getCustomers().find((c) => c.id === application.customerId);
  const collateral = DataService.getCollaterals().find((c) => c.id === application.collateralId);
  const asset = collateral ? DataService.getAssets().find((a) => a.id === collateral.assetId) : null;
  const product = DataService.getLoanProducts().find((p) => p.id === application.loanProductId);

  const applicant = application.applicantDetails;
  const proposedSecurity = application.proposedCollateralDetails;

  const applicantName = applicant?.fullName || customer?.fullName || application.customerId;
  const applicantPhone = applicant?.phone || customer?.phone || '0700000000';
  const applicantIdNumber = applicant?.idNumber || customer?.idNumber || 'N/A';
  const applicantEmail = applicant?.email || customer?.email || '';
  const applicantAddress = applicant?.physicalAddress || customer?.address || 'N/A';
  const applicantCounty = applicant?.county || customer?.county || 'Nairobi';
  const declaredIncome = applicant?.monthlyIncome || customer?.monthlyIncome || application.monthlyDeclaredIncome || 0;
  const declaredExpenses = applicant?.monthlyExpenses || customer?.monthlyExpenses || application.monthlyDeclaredExpenses || 0;

  // Formatted clean WhatsApp phone
  let cleanPhone = applicantPhone.replace(/[\s\-+]/g, '');
  if (cleanPhone.startsWith('0')) cleanPhone = '254' + cleanPhone.slice(1);
  else if (cleanPhone.startsWith('7') || cleanPhone.startsWith('1')) cleanPhone = '254' + cleanPhone;

  // WhatsApp reply helpers
  const handleOpenWhatsAppChat = (template: 'under_review' | 'approved' | 'need_docs' | 'custom') => {
    let msg = '';
    const compName = systemSettings?.companyName || 'Davetech Solutions';
    const appNum = application.applicationNumber;

    if (template === 'under_review') {
      msg = `Hello ${applicantName},\n\nThank you for submitting your loan application (*${appNum}*) for *KES ${application.requestedAmount.toLocaleString()}* at ${compName}.\n\nOur credit desk is currently reviewing your documentation. We will update you shortly on disbursement terms.\n\nRegards,\nCredit Team`;
    } else if (template === 'approved') {
      msg = `Congratulations ${applicantName}! 🎉\n\nYour loan application (*${appNum}*) for *KES ${application.requestedAmount.toLocaleString()}* at ${compName} has been *APPROVED*.\n\nPlease confirm your preferred M-Pesa disbursement number and readiness to execute the security agreement.\n\nRegards,\nCredit Manager`;
    } else if (template === 'need_docs') {
      msg = `Hello ${applicantName},\n\nRegarding your loan application (*${appNum}*) at ${compName}:\n\nPlease share clear photos of your National ID (front & back) and pledged asset serial plate to expedite your approval.\n\nThank you,\nCredit Desk`;
    } else {
      msg = `Hello ${applicantName}, regarding your loan application ${appNum} at ${compName}...`;
    }

    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const handlePrintDossier = () => {
    window.print();
  };

  // Collect photos from proposed collateral or documents
  const allPhotos: string[] = [
    ...(proposedSecurity?.photos || []),
    ...(asset?.photos || []),
    ...(application.documents || []).filter((d) => d.fileUrl).map((d) => d.fileUrl),
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Loan Application Review • ${application.applicationNumber}`} size="xl">
      <div className="space-y-5">
        {/* Status & Origin Banner */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-700 rounded-2xl">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${
              application.source === 'online_whatsapp'
                ? 'bg-emerald-600 text-white'
                : 'bg-purple-600 text-white'
            }`}>
              {application.source === 'online_whatsapp' ? (
                <MessageCircle className="w-5 h-5" />
              ) : (
                <FileText className="w-5 h-5" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                  {applicantName}
                </h3>
                {application.source === 'online_whatsapp' && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 flex items-center gap-1">
                    <MessageCircle className="w-3 h-3" /> WhatsApp Inbound
                  </span>
                )}
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                  application.status === 'approved'
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    : application.status === 'rejected'
                    ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                    : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                }`}>
                  {application.status.replace(/_/g, ' ')}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-mono mt-0.5">
                Ref: {application.applicationNumber} • Submitted: {application.createdAt || application.applicationDate}
              </p>
            </div>
          </div>

          {/* Quick WhatsApp Action Strip */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => handleOpenWhatsAppChat('under_review')}
              className="px-2.5 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 rounded-lg text-xs font-semibold flex items-center gap-1 transition"
              title="Send 'Under Review' WhatsApp update"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>WhatsApp: Reviewing</span>
            </button>
            <button
              type="button"
              onClick={() => handleOpenWhatsAppChat('approved')}
              className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-xs transition"
              title="Send 'Approved' WhatsApp congratulation"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>WhatsApp: Approve</span>
            </button>
            <a
              href={`tel:${applicantPhone}`}
              className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1 transition"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Call</span>
            </a>
          </div>
        </div>

        {/* 3-Column Dossier Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1: Applicant Profile & Contacts */}
          <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
            <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
              <User className="w-4 h-4 text-purple-600" />
              Applicant Profile
            </h4>
            <div className="space-y-2 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px]">Full Legal Name</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{applicantName}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">National ID / Passport</span>
                <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">{applicantIdNumber}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Mobile / M-Pesa Number</span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{applicantPhone}</span>
              </div>
              {applicantEmail && (
                <div>
                  <span className="text-slate-400 block text-[10px]">Email Address</span>
                  <span className="text-slate-700 dark:text-slate-300">{applicantEmail}</span>
                </div>
              )}
              <div>
                <span className="text-slate-400 block text-[10px]">Location & Address</span>
                <span className="text-slate-700 dark:text-slate-300">{applicantAddress}, {applicantCounty}</span>
              </div>
              {applicant?.nextOfKinName && (
                <div className="pt-2 border-t border-slate-100 dark:border-slate-700">
                  <span className="text-slate-400 block text-[10px]">Next of Kin / Guarantor</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    {applicant.nextOfKinName} ({applicant.nextOfKinRelation}) • {applicant.nextOfKinPhone}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Card 2: Requested Facility & Metrics */}
          <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
            <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              Loan Facility Requested
            </h4>
            <div className="space-y-2 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px]">Loan Product</span>
                <span className="font-semibold text-purple-700 dark:text-purple-300">
                  {application.productName || product?.name || 'Secured Facility'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Requested Amount</span>
                <span className="text-base font-bold font-mono text-slate-900 dark:text-slate-100">
                  {LoanEngine.formatKES(application.requestedAmount)}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-slate-400 block text-[10px]">Duration</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {application.proposedDurationMonths || application.requestedTenureMonths} Months
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Frequency</span>
                  <span className="font-semibold capitalize text-slate-800 dark:text-slate-200">
                    {application.repaymentFrequency || 'Monthly'}
                  </span>
                </div>
              </div>
              <div className="p-2.5 bg-slate-50 dark:bg-slate-900/60 rounded-xl space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-500">Est. Monthly Installment:</span>
                  <span className="font-bold font-mono text-emerald-600 dark:text-emerald-400">
                    {LoanEngine.formatKES(application.calculatedInstallment || 0)}
                  </span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-500">Processing Fee:</span>
                  <span className="font-mono text-slate-700 dark:text-slate-300">
                    {LoanEngine.formatKES(application.processingFee || 0)}
                  </span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-500">Debt-Service Ratio (DSR):</span>
                  <span className={`font-mono font-bold ${
                    application.debtServiceRatio > 50 ? 'text-rose-600' : 'text-emerald-600'
                  }`}>
                    {application.debtServiceRatio}%
                  </span>
                </div>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Stated Purpose</span>
                <p className="text-slate-700 dark:text-slate-300 italic text-[11px] leading-relaxed">
                  "{application.purpose}"
                </p>
              </div>
            </div>
          </div>

          {/* Card 3: Income & Affordability Check */}
          <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
            <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
              <Briefcase className="w-4 h-4 text-blue-600" />
              Income & Underwriting
            </h4>
            <div className="space-y-2 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px]">Employment / Business</span>
                <span className="font-semibold capitalize text-slate-800 dark:text-slate-200">
                  {applicant?.employmentType?.replace(/_/g, ' ') || 'Self-Employed'}
                </span>
                {applicant?.employerOrBusiness && (
                  <span className="block text-[11px] text-slate-500">
                    {applicant.employerOrBusiness}
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-slate-400 block text-[10px]">Monthly Net Income</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                    {LoanEngine.formatKES(declaredIncome)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Monthly Expenses</span>
                  <span className="font-mono text-slate-700 dark:text-slate-300">
                    {LoanEngine.formatKES(declaredExpenses)}
                  </span>
                </div>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Net Disposable Income</span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  {LoanEngine.formatKES(Math.max(0, declaredIncome - declaredExpenses))}
                </span>
              </div>
              {application.clientSignature && (
                <div className="pt-2 border-t border-slate-100 dark:border-slate-700">
                  <span className="text-slate-400 block text-[10px]">Electronic Consent Signature</span>
                  <span className="font-serif italic font-semibold text-slate-800 dark:text-slate-200">
                    "{application.clientSignature}"
                  </span>
                  <span className="block text-[10px] text-slate-400 mt-0.5">
                    CRB check & data disclosure consent granted
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Collateral & Pledged Security Section */}
        <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Pledged Security / Collateral Details
            </h4>
            {proposedSecurity?.category === 'household_items' && onConvertToItemAgreement && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onConvertToItemAgreement(application);
                }}
                className="px-3 py-1 bg-purple-100 hover:bg-purple-200 text-purple-800 dark:bg-purple-950 dark:text-purple-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <Tv className="w-3.5 h-3.5" />
                <span>Create Household Item Agreement</span>
              </button>
            )}
          </div>

          {proposedSecurity || collateral ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px]">Security Asset Name</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                    {proposedSecurity?.title || collateral?.description || 'Registered Collateral'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Category</span>
                    <span className="font-semibold capitalize text-slate-700 dark:text-slate-300">
                      {(proposedSecurity?.category || asset?.category || 'household_items').replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Condition</span>
                    <span className="font-semibold capitalize text-slate-700 dark:text-slate-300">
                      {proposedSecurity?.condition || asset?.condition || 'Good'}
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Brand / Make</span>
                    <span className="font-mono text-slate-800 dark:text-slate-200">
                      {proposedSecurity?.brand || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Model / Serial / Reg</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                      {proposedSecurity?.serialOrRegNumber || proposedSecurity?.model || 'N/A'}
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-700">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Declared Market Value</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                      {LoanEngine.formatKES(proposedSecurity?.estimatedValue || collateral?.marketValue || 0)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Loan-To-Value (LTV)</span>
                    <span className="font-mono font-bold text-purple-600 dark:text-purple-400">
                      {application.loanToValuePct}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Photos Grid */}
              <div>
                <span className="text-slate-400 block text-[10px] mb-2">Uploaded Item & ID Photos</span>
                {allPhotos.length > 0 ? (
                  <div className="grid grid-cols-3 gap-2">
                    {allPhotos.map((photo, i) => (
                      <div
                        key={i}
                        onClick={() => setSelectedPhoto(photo)}
                        className="aspect-video rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 cursor-pointer hover:opacity-90 transition relative group"
                      >
                        <img
                          src={photo}
                          alt={`Evidence ${i + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[10px] font-semibold transition">
                          Click to View
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-1.5">
                    <ImageIcon className="w-6 h-6 opacity-50" />
                    <span>No photos attached with submission.</span>
                    <button
                      type="button"
                      onClick={() => handleOpenWhatsAppChat('need_docs')}
                      className="text-emerald-600 hover:underline text-[11px] font-semibold mt-1"
                    >
                      Request photos via WhatsApp
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic">
              Unsecured or guarantor-backed facility. No physical chattel registered.
            </p>
          )}
        </div>

        {/* Modal Actions Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrintDossier}
              className="px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl flex items-center gap-1.5 transition"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Application</span>
            </button>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap justify-end">
            <button
              type="button"
              onClick={() => handleOpenWhatsAppChat('need_docs')}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
              <span>Request Documents</span>
            </button>

            {onAssess && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onAssess(application);
                }}
                className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 transition"
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Credit Assessment</span>
              </button>
            )}

            {onApprove && application.status === 'submitted' && (
              <button
                type="button"
                onClick={() => {
                  onApprove(application);
                  onClose();
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-md hover:shadow-lg flex items-center gap-1.5 transition"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Quick Approve Facility</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Lightbox for viewing photos in large format */}
      {selectedPhoto && (
        <div
          onClick={() => setSelectedPhoto(null)}
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs"
        >
          <div className="max-w-3xl max-h-[85vh] bg-white dark:bg-slate-900 rounded-2xl overflow-hidden shadow-2xl relative">
            <img src={selectedPhoto} alt="Zoomed view" className="w-full h-auto max-h-[80vh] object-contain" />
            <div className="p-3 bg-slate-900 text-white flex justify-between items-center text-xs">
              <span>Applicant Photo Attachment</span>
              <button
                type="button"
                onClick={() => setSelectedPhoto(null)}
                className="px-3 py-1 bg-slate-700 hover:bg-slate-600 rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
};
