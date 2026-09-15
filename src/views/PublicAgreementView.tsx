/**
 * DAVETECH ERP - Public Online Item Loan Agreement Letter & Client Signing Portal
 * Accessible by clients via WhatsApp links (e.g. #item-agreement-<token> or #agreement).
 * Allows clients to review their item chattel loan agreement (TVs, Woofers, Chairs, etc.),
 * digitally sign online, download PDF copy, and notify lender via WhatsApp for instant M-Pesa disbursal.
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Tv,
  Speaker,
  Armchair,
  Laptop,
  Refrigerator,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  Printer,
  Send,
  Share2,
  Copy,
  Check,
  Search,
  ArrowLeft,
  Shield,
  FileText,
  Clock,
  Sparkles,
  Lock,
  ChevronRight,
  ExternalLink,
  HelpCircle,
  Home,
  RotateCcw,
} from 'lucide-react';
import { DataService } from '../services/dataService';
import { LoanEngine } from '../services/loanEngine';
import { ItemLoanAgreement, HouseholdItemType } from '../types/erp';
import { PrintTemplate } from '../components/common/PrintTemplate';

interface PublicAgreementViewProps {
  onBackToPortal?: () => void;
}

export const PublicAgreementView: React.FC<PublicAgreementViewProps> = ({ onBackToPortal }) => {
  const settings = DataService.getSettings();
  const allAgreements = DataService.getItemAgreements();

  const [currentAgreement, setCurrentAgreement] = useState<ItemLoanAgreement | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchError, setSearchError] = useState('');
  const [isPrintOpen, setIsPrintOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Digital Signing Form State
  const [clientFullName, setClientFullName] = useState('');
  const [clientIdNumber, setClientIdNumber] = useState('');
  const [hasAgreedToTerms, setHasAgreedToTerms] = useState(false);
  const [signatureMode, setSignatureMode] = useState<'draw' | 'type'>('type');
  const [typedSignature, setTypedSignature] = useState('');
  const [signSubmitting, setSignSubmitting] = useState(false);
  const [signSuccessMessage, setSignSuccessMessage] = useState(false);

  // Canvas ref for drawn signature
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawnSignature, setHasDrawnSignature] = useState(false);

  // Auto-resolve agreement from URL hash or query params
  useEffect(() => {
    const resolveFromUrl = () => {
      const hash = window.location.hash;
      const urlParams = new URLSearchParams(window.location.search);
      const queryParamId = urlParams.get('agreement') || urlParams.get('id');

      let targetIdOrToken = '';

      if (hash.startsWith('#item-agreement-')) {
        targetIdOrToken = hash.replace('#item-agreement-', '');
      } else if (hash.startsWith('#agreement=')) {
        targetIdOrToken = hash.replace('#agreement=', '');
      } else if (queryParamId && queryParamId !== 'true') {
        targetIdOrToken = queryParamId;
      }

      if (targetIdOrToken) {
        const found = allAgreements.find(
          (a) =>
            a.onlineShareableToken === targetIdOrToken ||
            a.id === targetIdOrToken ||
            a.agreementNumber === targetIdOrToken ||
            a.id.toLowerCase() === targetIdOrToken.toLowerCase()
        );
        if (found) {
          setCurrentAgreement(found);
          setClientFullName(found.customerName);
          setClientIdNumber(found.customerIdNumber);
          setTypedSignature(found.customerName);
          return;
        }
      }

      // Default to first agreement if available, or allow search
      if (!currentAgreement && allAgreements.length > 0) {
        // Pick the most recent agreement (or the second one which is 'sent_to_client')
        const sentOne = allAgreements.find((a) => a.status === 'sent_to_client') || allAgreements[0];
        setCurrentAgreement(sentOne);
        setClientFullName(sentOne.customerName);
        setClientIdNumber(sentOne.customerIdNumber);
        setTypedSignature(sentOne.customerName);
      }
    };

    resolveFromUrl();
    window.addEventListener('hashchange', resolveFromUrl);
    return () => window.removeEventListener('hashchange', resolveFromUrl);
  }, [allAgreements]);

  // Handle Search / Lookup
  const handleSearchAgreement = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchError('');
    const q = searchQuery.trim().toLowerCase();
    if (!q) {
      setSearchError('Please enter an agreement number, phone number, or national ID');
      return;
    }

    const cleanPhone = q.replace(/[^0-9]/g, '');

    const found = allAgreements.find(
      (a) =>
        a.agreementNumber.toLowerCase().includes(q) ||
        a.id.toLowerCase().includes(q) ||
        (a.customerIdNumber && a.customerIdNumber.toLowerCase() === q) ||
        (cleanPhone.length >= 6 && a.customerPhone.replace(/[^0-9]/g, '').includes(cleanPhone)) ||
        a.customerName.toLowerCase().includes(q)
    );

    if (found) {
      setCurrentAgreement(found);
      setClientFullName(found.customerName);
      setClientIdNumber(found.customerIdNumber);
      setTypedSignature(found.customerName);
      setSignSuccessMessage(false);
      setSearchQuery('');
    } else {
      setSearchError(`No agreement found matching "${searchQuery}". Please check your details.`);
    }
  };

  // Canvas drawing functions
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    setHasDrawnSignature(true);
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#1e293b';
    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawnSignature(false);
  };

  // Submit Digital Signature
  const handleDigitalSign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentAgreement) return;

    if (!clientFullName.trim()) {
      alert('Please enter your full legal name');
      return;
    }

    if (!clientIdNumber.trim()) {
      alert('Please verify your National ID number');
      return;
    }

    if (!hasAgreedToTerms) {
      alert('Please tick the checkbox agreeing to the chattel mortgage terms.');
      return;
    }

    let signatureData = '';
    if (signatureMode === 'draw') {
      if (!hasDrawnSignature || !canvasRef.current) {
        alert('Please draw your signature in the box provided');
        return;
      }
      signatureData = canvasRef.current.toDataURL('image/png');
    } else {
      if (!typedSignature.trim()) {
        alert('Please type your legal signature');
        return;
      }
      signatureData = `DIGITAL_E_SIG_${typedSignature.toUpperCase().replace(/\s+/g, '_')}_ID_${clientIdNumber}`;
    }

    setSignSubmitting(true);

    try {
      const updated = DataService.signAgreementOnline(currentAgreement.id, {
        clientName: clientFullName.trim(),
        signature: signatureData,
        ipOrDevice: `Mobile/Web Browser (${navigator.userAgent.substring(0, 45)}...)`,
        notes: `Online digital acceptance executed by ${clientFullName.trim()} (ID: ${clientIdNumber.trim()}). Collateral chattel item: ${currentAgreement.itemTitle}`,
      });

      setCurrentAgreement(updated);
      setSignSuccessMessage(true);
      setSignSubmitting(false);

      // Scroll to top smoothly
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      setSignSubmitting(false);
      alert(err.message || 'Failed to submit digital signature. Please try again.');
    }
  };

  // Format phone number for WhatsApp
  const getWhatsAppNotifyUrl = (agreement: ItemLoanAgreement) => {
    const lenderPhone = settings?.companyPhone?.replace(/[^0-9]/g, '') || '254700112233';
    const cleanLender = lenderPhone.startsWith('0') ? `254${lenderPhone.substring(1)}` : lenderPhone;
    const msg = `Hello ${settings?.companyName || 'Davetech'},\n\nI, *${agreement.customerName}* (ID: ${agreement.customerIdNumber}), have successfully reviewed and *DIGITALLY SIGNED* the Item Chattel Loan Agreement for my *${agreement.itemTitle}*.\n\n📋 *Agreement Ref:* ${agreement.agreementNumber}\n💰 *Loan Principal:* ${LoanEngine.formatKES(agreement.principalAmount)}\n📅 *Signed At:* ${agreement.signedAt || new Date().toLocaleString()}\n\nKindly proceed to disburse my loan funds of *${LoanEngine.formatKES(agreement.disbursedAmount)}* to my M-Pesa number: *${agreement.customerPhone}*.\n\nThank you!`;
    return `https://wa.me/${cleanLender}?text=${encodeURIComponent(msg)}`;
  };

  const getItemIcon = (type: HouseholdItemType) => {
    switch (type) {
      case 'tv':
        return <Tv className="w-5 h-5 text-indigo-600" />;
      case 'woofer':
        return <Speaker className="w-5 h-5 text-indigo-600" />;
      case 'chair':
      case 'furniture':
        return <Armchair className="w-5 h-5 text-indigo-600" />;
      case 'fridge':
        return <Refrigerator className="w-5 h-5 text-indigo-600" />;
      case 'laptop':
        return <Laptop className="w-5 h-5 text-indigo-600" />;
      case 'phone':
        return <Smartphone className="w-5 h-5 text-indigo-600" />;
      default:
        return <FileText className="w-5 h-5 text-indigo-600" />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans py-6 px-3 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Navigation Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-800/90 border border-slate-700/80 p-4 rounded-2xl shadow-xl backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-emerald-600 flex items-center justify-center font-bold text-white shadow-md">
              {settings?.platformInitials || (settings?.platformName ? settings.platformName.charAt(0) : 'D')}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-base tracking-tight text-white">
                  {settings?.companyName || `${settings?.platformName || 'DAVETECH'} SOLUTIONS`}
                </h1>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Client Portal
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Online Agreement Review & Digital Execution Service
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {currentAgreement && (
              <button
                onClick={() => setIsPrintOpen(true)}
                className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition"
                title="Print Official Legal Document"
              >
                <Printer className="w-3.5 h-3.5 text-indigo-300" />
                <span>Print / Save PDF</span>
              </button>
            )}

            <button
              onClick={() => {
                if (onBackToPortal) {
                  onBackToPortal();
                } else {
                  window.location.hash = '';
                  window.location.reload();
                }
              }}
              className="px-3 py-1.5 bg-slate-700/80 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
          </div>
        </div>

        {/* Success Banner when just signed */}
        {signSuccessMessage && (
          <div className="p-4 rounded-2xl bg-emerald-950/80 border border-emerald-600 text-emerald-200 shadow-xl flex items-start gap-3.5 animate-fadeIn">
            <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
            <div className="flex-1 text-xs space-y-1">
              <p className="text-sm font-bold text-emerald-100">
                Agreement Successfully Signed & Recorded!
              </p>
              <p className="text-emerald-300 leading-relaxed">
                Thank you, <strong>{clientFullName}</strong>. Your digital acceptance has been confirmed under Kenyan Law (Chattels Transfer Act Cap 28). The loan approval desk has been notified.
              </p>
              {currentAgreement && (
                <div className="pt-2 flex items-center gap-2 flex-wrap">
                  <a
                    href={getWhatsAppNotifyUrl(currentAgreement)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow transition"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Signed Confirmation on WhatsApp</span>
                  </a>
                  <button
                    onClick={() => setIsPrintOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl border border-slate-700 transition"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Download Official Signed PDF</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Agreement Search & Quick Selector */}
        <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-4 shadow-md text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <form onSubmit={handleSearchAgreement} className="flex-1 flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Lookup by Agreement No (e.g. DT/AGR/ITEM/2026/015), Phone, or National ID"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 outline-none focus:border-indigo-500 transition pr-8"
                />
                <Search className="w-4 h-4 text-slate-400 absolute right-2.5 top-2.5" />
              </div>
              <button
                type="submit"
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-xs transition shrink-0"
              >
                Find Agreement
              </button>
            </form>

            {/* Quick switcher buttons */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              <span className="text-[11px] text-slate-400 shrink-0">Sample Items:</span>
              {allAgreements.slice(0, 4).map((agr) => (
                <button
                  key={agr.id}
                  onClick={() => {
                    setCurrentAgreement(agr);
                    setClientFullName(agr.customerName);
                    setClientIdNumber(agr.customerIdNumber);
                    setTypedSignature(agr.customerName);
                    setSignSuccessMessage(false);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium shrink-0 transition flex items-center gap-1 ${
                    currentAgreement?.id === agr.id
                      ? 'bg-indigo-600 text-white font-bold'
                      : 'bg-slate-900 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <span className="uppercase text-[10px] font-mono">{agr.itemType}</span>
                  <span>({agr.agreementNumber.split('/').pop()})</span>
                </button>
              ))}
            </div>
          </div>

          {searchError && (
            <p className="text-rose-400 mt-2 text-[11px] flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5" /> {searchError}
            </p>
          )}
        </div>

        {/* If no agreement loaded */}
        {!currentAgreement ? (
          <div className="p-12 text-center bg-slate-800/60 border border-slate-700 rounded-3xl space-y-3">
            <FileText className="w-12 h-12 text-slate-500 mx-auto" />
            <h3 className="text-base font-bold text-white">No Agreement Loaded</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Please search using your Agreement Reference Number, registered Mobile Number, or National ID above.
            </p>
          </div>
        ) : (
          /* Agreement Paper Container */
          <div className="bg-white text-slate-900 rounded-3xl shadow-2xl border border-slate-200 overflow-hidden font-sans">
            {/* Status Ribbon */}
            <div className="px-6 py-3 bg-slate-100 border-b border-slate-200 flex items-center justify-between flex-wrap gap-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-700">Agreement Reference:</span>
                <span className="font-mono font-bold text-indigo-900 bg-indigo-100 px-2.5 py-0.5 rounded-md">
                  {currentAgreement.agreementNumber}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {currentAgreement.status === 'signed' || currentAgreement.status === 'active_loan' ? (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Digitally Executed & Accepted</span>
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 flex items-center gap-1.5 animate-pulse">
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                    <span>Pending Client Digital Signature</span>
                  </span>
                )}
              </div>
            </div>

            {/* Document Content */}
            <div className="p-6 sm:p-10 space-y-6 text-xs leading-relaxed text-slate-800">
              {/* Letterhead */}
              <div className="flex items-start justify-between border-b-2 border-slate-900 pb-5">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-lg bg-emerald-700 text-white font-bold text-sm flex items-center justify-center shrink-0">
                      {settings?.platformInitials || 'DT'}
                    </span>
                    <h2 className="text-xl font-black tracking-tight text-slate-900 uppercase">
                      {settings?.companyName || `${settings?.platformName || 'DAVETECH'} SOLUTIONS`}
                    </h2>
                  </div>
                  <p className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider mt-1">
                    Secured Asset Lending & Chattel Finance Department
                  </p>
                  <p className="text-[11px] text-slate-600 mt-1 max-w-md">
                    {settings?.companyAddress || 'Davetech Towers, Kimathi Street, Nairobi'} • Tel: {settings?.companyPhone || '+254 700 112 233'}
                  </p>
                  <p className="text-[11px] text-slate-600">
                    Email: {settings?.companyEmail || 'credit@davetech.co.ke'} • KRA PIN: {settings?.kraPin || 'P051928371X'}
                  </p>
                </div>

                <div className="text-right font-mono text-[11px]">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded block">
                    Cap 28 Laws of Kenya
                  </span>
                  <p className="text-slate-500 mt-1.5">DATE OF DRAFT</p>
                  <p className="font-bold text-slate-900">{currentAgreement.draftedAt.split(' ')[0]}</p>
                </div>
              </div>

              {/* Title */}
              <div className="text-center py-1">
                <h3 className="text-base font-extrabold uppercase tracking-wide text-slate-900">
                  Item Chattel Mortgage & Loan Agreement Letter of Offer
                </h3>
                <p className="text-xs text-slate-600 mt-1">
                  Enforceable under the Chattels Transfer Act (Cap 28, Laws of Kenya) for Household & Personal Assets
                </p>
              </div>

              {/* Parties Declaration */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-slate-700">
                <p>
                  This Item Chattel Loan Agreement is made on this{' '}
                  <strong>{currentAgreement.draftedAt.split(' ')[0]}</strong> between:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">THE LENDER</p>
                    <p className="font-bold text-slate-900">
                      {settings?.companyName || `${settings?.platformName || 'Davetech'} Solutions`}
                    </p>
                    <p className="text-slate-600 text-[11px]">
                      {settings?.companyAddress || 'Nairobi Main Branch'}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">THE BORROWER</p>
                    <p className="font-bold text-slate-900">{currentAgreement.customerName}</p>
                    <p className="text-slate-600 text-[11px]">
                      National ID: <strong className="font-mono">{currentAgreement.customerIdNumber}</strong> • Phone:{' '}
                      <strong className="font-mono">{currentAgreement.customerPhone}</strong>
                    </p>
                    <p className="text-slate-600 text-[11px]">
                      Residential Address: {currentAgreement.customerAddress || 'As per National ID Verification'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Schedule 1: Pledged Collateral Item */}
              <div className="border-2 border-indigo-100 rounded-2xl p-4 sm:p-5 bg-indigo-50/40 space-y-3">
                <div className="flex items-center justify-between border-b border-indigo-200 pb-2.5">
                  <div className="flex items-center gap-2">
                    {getItemIcon(currentAgreement.itemType)}
                    <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-950">
                      Schedule 1: Pledged Collateral Household Item
                    </h4>
                  </div>
                  <span className="text-[10px] font-mono font-bold uppercase px-2.5 py-0.5 rounded-full bg-indigo-200 text-indigo-900">
                    Category: {currentAgreement.itemType.toUpperCase()}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                  <div className="sm:col-span-2">
                    <span className="text-[10px] text-slate-500 font-semibold block">ITEM DESCRIPTION / TITLE</span>
                    <strong className="text-slate-900 text-sm">{currentAgreement.itemTitle}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-semibold block">BRAND & MODEL</span>
                    <span className="text-slate-800 font-medium">
                      {currentAgreement.itemBrand} {currentAgreement.itemModel}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-semibold block">SERIAL NO. / CHATTEL TAG</span>
                    <span className="font-mono font-bold text-slate-900">
                      {currentAgreement.itemSerialNumber || 'CHATTEL-TAGGED'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-semibold block">PHYSICAL & WORKING CONDITION</span>
                    <span className="text-slate-800">{currentAgreement.itemCondition}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-semibold block">ASSESSED MARKET VALUE</span>
                    <strong className="text-slate-900 font-mono">
                      {LoanEngine.formatKES(currentAgreement.itemMarketValue)}
                    </strong>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-[10px] text-slate-500 font-semibold block">ACCESSORIES INCLUDED IN PLEDGE</span>
                    <span className="text-slate-800 text-[11px]">
                      {currentAgreement.accessoriesIncluded?.join(', ') || 'Standard accessories as tested'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-semibold block">CUSTODY ARRANGEMENT</span>
                    <span className="text-slate-800 font-semibold">
                      {currentAgreement.custodyType === 'in_branch_vault'
                        ? '🏛️ Vault Storage at Branch'
                        : '🏠 Held by Borrower under Chattel Lien'}
                    </span>
                    <p className="text-[10px] text-slate-500">{currentAgreement.custodyLocation}</p>
                  </div>
                </div>
              </div>

              {/* Schedule 2: Financial Terms & Repayment Breakdown */}
              <div className="border border-slate-200 rounded-2xl p-4 sm:p-5 bg-slate-50 space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 font-sans">
                    Schedule 2: Sanctioned Loan Terms & Repayment Breakdown
                  </h4>
                  <span className="text-[10px] font-sans px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                    Direct M-Pesa B2C
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-2.5 rounded-xl bg-white border border-slate-200">
                    <span className="text-slate-400 text-[10px] block font-sans">PRINCIPAL SANCTIONED</span>
                    <strong className="text-sm text-slate-900">
                      {LoanEngine.formatKES(currentAgreement.principalAmount)}
                    </strong>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white border border-slate-200">
                    <span className="text-slate-400 text-[10px] block font-sans">MONTHLY INSTALLMENT</span>
                    <strong className="text-sm text-emerald-700">
                      {LoanEngine.formatKES(currentAgreement.monthlyInstallment)}
                    </strong>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white border border-slate-200">
                    <span className="text-slate-400 text-[10px] block font-sans">TOTAL REPAYABLE</span>
                    <strong className="text-sm text-slate-900">
                      {LoanEngine.formatKES(currentAgreement.totalPayable)}
                    </strong>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white border border-slate-200">
                    <span className="text-slate-400 text-[10px] block font-sans">NET DISBURSED TO MPESA</span>
                    <strong className="text-sm text-indigo-700">
                      {LoanEngine.formatKES(currentAgreement.disbursedAmount)}
                    </strong>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-[11px] text-slate-600 border-t border-slate-200">
                  <div>
                    <span className="text-slate-400 block font-sans">Loan Tenure:</span>
                    <strong>{currentAgreement.durationMonths} Month(s)</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-sans">Monthly Rate:</span>
                    <strong>{currentAgreement.interestRateMonthly}% / month</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-sans">Processing Fee:</span>
                    <strong>{LoanEngine.formatKES(currentAgreement.processingFee)}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-sans">Grace Period:</span>
                    <strong>{currentAgreement.gracePeriodDays} Days ({currentAgreement.penaltyRateMonthly}% penalty)</strong>
                  </div>
                </div>
              </div>

              {/* Legal Terms & Statutory Conditions */}
              <div className="border-t border-slate-200 pt-4 space-y-2 text-[11px] text-slate-600">
                <h4 className="font-bold text-slate-800 uppercase text-xs">
                  Statutory Undertakings & Chattel Lien Conditions:
                </h4>
                <ol className="list-decimal pl-4 space-y-1 leading-relaxed">
                  <li>
                    <strong>Ownership & Title:</strong> The Borrower warrants being the sole beneficial owner of the pledged household item ({currentAgreement.itemTitle}) free of any prior encumbrance, hire purchase claim, or rival security interest.
                  </li>
                  <li>
                    <strong>Repayment Covenant:</strong> The Borrower unconditionally undertakes to repay the installments of {LoanEngine.formatKES(currentAgreement.monthlyInstallment)} on or before each monthly maturity date via official M-Pesa Paybill.
                  </li>
                  <li>
                    <strong>Chattel Transfer Act Powers:</strong> Under Section 13 of Cap 28 Laws of Kenya, in the event of default exceeding thirty (30) days from due date, the Lender holds the statutory power to take possession of the pledged item and dispose of it through licensed auctioneers to recover outstanding liabilities.
                  </li>
                  <li>
                    <strong>Item Custody & Care:</strong> Where the item remains with the Borrower, the Borrower covenants not to sell, remove from declared residence, tamper with serial tag, or alter the chattel without written consent.
                  </li>
                </ol>
              </div>

              {/* Digital Signature Execution Section */}
              <div className="border-2 border-indigo-200 rounded-2xl p-5 bg-gradient-to-br from-indigo-50/50 to-white space-y-4">
                <div className="flex items-center justify-between border-b border-indigo-200/60 pb-3">
                  <div>
                    <h4 className="font-bold text-sm text-indigo-950 flex items-center gap-1.5">
                      <Lock className="w-4 h-4 text-indigo-600" />
                      Borrower Digital Acceptance & Execution
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Legally binding digital execution in accordance with the Kenya Information & Communications Act.
                    </p>
                  </div>
                </div>

                {currentAgreement.status === 'signed' || currentAgreement.status === 'active_loan' ? (
                  /* Stamped Verified Signature View */
                  <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 space-y-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      <span className="font-bold text-xs text-emerald-900 uppercase tracking-wider">
                        Digitally Signed & Verified
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-slate-500 text-[10px] block">SIGNED BY (BORROWER)</span>
                        <strong className="text-slate-900">{currentAgreement.signedByName || currentAgreement.customerName}</strong>
                        <span className="block text-[11px] text-slate-600">ID: {currentAgreement.customerIdNumber}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[10px] block">DATE & TIMESTAMP</span>
                        <strong className="text-slate-900 font-mono">{currentAgreement.signedAt}</strong>
                        <span className="block text-[10px] text-slate-500 truncate">{currentAgreement.clientIpOrDevice}</span>
                      </div>
                    </div>

                    {/* Signature Preview */}
                    <div className="pt-2 border-t border-emerald-200">
                      <span className="text-[10px] text-slate-500 block">RECORDED DIGITAL SIGNATURE</span>
                      {currentAgreement.clientSignatureData?.startsWith('data:image') ? (
                        <img
                          src={currentAgreement.clientSignatureData}
                          alt="Signature"
                          className="h-12 object-contain mt-1 border-b border-slate-400"
                        />
                      ) : (
                        <p className="font-serif italic text-base text-indigo-950 mt-1 border-b border-slate-400 inline-block pb-0.5">
                          {currentAgreement.clientSignatureData?.replace('DIGITAL_E_SIG_', '').replace(/_/g, ' ') || currentAgreement.signedByName}
                        </p>
                      )}
                    </div>

                    <div className="pt-3 flex items-center gap-2 flex-wrap">
                      <a
                        href={getWhatsAppNotifyUrl(currentAgreement)}
                        target="_blank"
                        rel="noreferrer"
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow transition flex items-center gap-1.5"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Send Confirmation via WhatsApp</span>
                      </a>

                      <button
                        onClick={() => setIsPrintOpen(true)}
                        className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs rounded-xl transition flex items-center gap-1.5"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Print Official Agreement</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Interactive Signing Form */
                  <form onSubmit={handleDigitalSign} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Borrower Full Legal Name (as on National ID)
                        </label>
                        <input
                          type="text"
                          required
                          value={clientFullName}
                          onChange={(e) => setClientFullName(e.target.value)}
                          className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-900 outline-none focus:border-indigo-600"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          National ID Number
                        </label>
                        <input
                          type="text"
                          required
                          value={clientIdNumber}
                          onChange={(e) => setClientIdNumber(e.target.value)}
                          className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono text-slate-900 outline-none focus:border-indigo-600"
                        />
                      </div>
                    </div>

                    {/* Mode Selector */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-[11px] font-bold text-slate-700">
                          Digital Signature Format:
                        </label>
                        <div className="flex items-center gap-1 text-[11px]">
                          <button
                            type="button"
                            onClick={() => setSignatureMode('type')}
                            className={`px-2.5 py-1 rounded-lg transition ${
                              signatureMode === 'type'
                                ? 'bg-indigo-600 text-white font-bold'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            Type Name Signature
                          </button>
                          <button
                            type="button"
                            onClick={() => setSignatureMode('draw')}
                            className={`px-2.5 py-1 rounded-lg transition ${
                              signatureMode === 'draw'
                                ? 'bg-indigo-600 text-white font-bold'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            Draw on Screen
                          </button>
                        </div>
                      </div>

                      {signatureMode === 'type' ? (
                        <div className="p-3 bg-white border border-slate-300 rounded-xl space-y-1.5">
                          <input
                            type="text"
                            value={typedSignature}
                            onChange={(e) => setTypedSignature(e.target.value)}
                            placeholder="Type your legal full name"
                            className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg outline-none font-medium"
                          />
                          <div className="p-2 border border-dashed border-indigo-300 bg-indigo-50/40 rounded-lg">
                            <span className="text-[10px] text-slate-400 block uppercase">Signature Preview:</span>
                            <p className="font-serif italic text-lg text-indigo-950 mt-0.5">
                              {typedSignature || 'Your Signature Will Appear Here'}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-1.5">
                          <div className="border border-slate-300 rounded-xl bg-white p-2">
                            <canvas
                              ref={canvasRef}
                              width={500}
                              height={120}
                              onMouseDown={startDrawing}
                              onMouseMove={draw}
                              onMouseUp={stopDrawing}
                              onMouseLeave={stopDrawing}
                              onTouchStart={startDrawing}
                              onTouchMove={draw}
                              onTouchEnd={stopDrawing}
                              className="w-full h-28 bg-slate-50 rounded-lg cursor-crosshair touch-none border border-dashed border-slate-300"
                            />
                          </div>
                          <div className="flex justify-between items-center text-[10px] text-slate-500">
                            <span>Draw with your finger on touchscreens or mouse on computers</span>
                            <button
                              type="button"
                              onClick={clearCanvas}
                              className="text-indigo-600 hover:underline font-semibold flex items-center gap-1"
                            >
                              <RotateCcw className="w-3 h-3" /> Clear Signature
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Legal Checkbox */}
                    <div className="p-3.5 bg-slate-100 rounded-xl space-y-2 border border-slate-200">
                      <label className="flex items-start gap-2.5 cursor-pointer text-xs">
                        <input
                          type="checkbox"
                          checked={hasAgreedToTerms}
                          onChange={(e) => setHasAgreedToTerms(e.target.checked)}
                          required
                          className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                        />
                        <span className="font-semibold text-slate-800 leading-snug">
                          I, {clientFullName || currentAgreement.customerName}, hereby accept all terms and conditions of this Chattel Loan Agreement and confirm pledging my <strong>{currentAgreement.itemTitle}</strong> as security for the facility of <strong>{LoanEngine.formatKES(currentAgreement.principalAmount)}</strong>.
                        </span>
                      </label>
                    </div>

                    <button
                      type="submit"
                      disabled={signSubmitting || !hasAgreedToTerms}
                      className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white font-extrabold text-sm rounded-xl shadow-lg transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-5 h-5" />
                      <span>{signSubmitting ? 'Recording Execution...' : 'Digitally Accept & Sign Agreement Now'}</span>
                    </button>
                  </form>
                )}
              </div>

              {/* Signatures & Execution Footnotes */}
              <div className="pt-6 border-t border-slate-300 grid grid-cols-2 text-center text-[11px] text-slate-600">
                <div>
                  <div className="h-10 border-b border-slate-400 w-48 mx-auto mb-1 flex items-end justify-center">
                    {currentAgreement.signedAt && (
                      <span className="font-serif italic text-xs text-indigo-900 font-bold">
                        {currentAgreement.signedByName || currentAgreement.customerName}
                      </span>
                    )}
                  </div>
                  <p className="font-bold text-slate-900">{currentAgreement.customerName}</p>
                  <p className="text-slate-500">Borrower / Chattel Grantor</p>
                </div>
                <div>
                  <div className="h-10 border-b border-slate-400 w-48 mx-auto mb-1 flex items-end justify-center">
                    <span className="font-serif italic text-xs text-slate-800 font-bold">Kevin Kiprop</span>
                  </div>
                  <p className="font-bold text-slate-900">Kevin Kiprop</p>
                  <p className="text-slate-500">Branch Manager / Authorized Signatory</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center text-xs text-slate-400 space-y-1">
          <p>
            {settings?.companyName || `${settings?.platformName || 'Davetech'} Solutions`} • Licensed Secured Micro-Lender
          </p>
          <p className="text-[11px] text-slate-500">
            For customer support or verification inquiries, call {settings?.companyPhone || '+254 700 112 233'} or email {settings?.companyEmail || 'support@davetech.co.ke'}.
          </p>
        </div>
      </div>

      {/* PRINT ENGINE */}
      {isPrintOpen && currentAgreement && (
        <PrintTemplate
          docType="item_loan_agreement"
          itemAgreement={currentAgreement}
          onClose={() => setIsPrintOpen(false)}
        />
      )}
    </div>
  );
};
