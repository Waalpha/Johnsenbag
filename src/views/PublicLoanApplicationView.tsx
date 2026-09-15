/**
 * DAVETECH ERP - Public Client Online Loan Application Portal
 * Mobile-first, customer-facing self-service loan application form.
 * Can be shared with clients via WhatsApp link, SMS, or QR code.
 * Clients fill it out online on their phone, attach photos of their ID and
 * collateral (e.g. TV, Fridge, Woofer, Car Logbook), and submit it directly
 * back to the loan officer and ERP pipeline with 1-click WhatsApp confirmation!
 */

import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  DollarSign,
  Calendar,
  User,
  Phone,
  Mail,
  MapPin,
  Briefcase,
  Tv,
  Car,
  Home,
  UploadCloud,
  FileText,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  MessageCircle,
  Copy,
  Printer,
  Sparkles,
  Lock,
  ChevronRight,
  X,
  Camera,
  Layers
} from 'lucide-react';
import { DataService } from '../services/dataService';
import { LoanEngine } from '../services/loanEngine';
import { OnlineApplicationSubmission, LoanProduct, AssetCategory } from '../types/erp';

interface PublicLoanApplicationViewProps {
  onBackToPortal?: () => void;
}

export const PublicLoanApplicationView: React.FC<PublicLoanApplicationViewProps> = ({
  onBackToPortal,
}) => {
  const products = DataService.getLoanProducts();
  const settings = DataService.getSettings();

  // URL search params for pre-selecting product or referral officer
  const [activeStep, setActiveStep] = useState<number>(1);
  const totalSteps = 5;

  // Form States
  const [selectedProductId, setSelectedProductId] = useState<string>(products[0]?.id || 'LP-001');
  const [requestedAmount, setRequestedAmount] = useState<number>(50000);
  const [durationMonths, setDurationMonths] = useState<number>(6);
  const [repaymentFrequency, setRepaymentFrequency] = useState<'monthly' | 'weekly' | 'bi_weekly'>('monthly');
  const [loanPurpose, setLoanPurpose] = useState<string>('Household item financing & working capital');

  // Step 2: Personal KYC
  const [fullName, setFullName] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [alternatePhone, setAlternatePhone] = useState('');
  const [email, setEmail] = useState('');
  const [county, setCounty] = useState('Nairobi');
  const [physicalAddress, setPhysicalAddress] = useState('');

  // Step 3: Income & Employment
  const [employmentType, setEmploymentType] = useState<OnlineApplicationSubmission['employmentType']>('business_owner');
  const [employerOrBusiness, setEmployerOrBusiness] = useState('');
  const [monthlyIncome, setMonthlyIncome] = useState<number>(45000);
  const [monthlyExpenses, setMonthlyExpenses] = useState<number>(18000);

  // Step 4: Security / Collateral Pledged
  const [hasCollateral, setHasCollateral] = useState<boolean>(true);
  const [collateralCategory, setCollateralCategory] = useState<AssetCategory>('household_items');
  const [collateralTitle, setCollateralTitle] = useState('Samsung 55" 4K Smart TV');
  const [collateralBrand, setCollateralBrand] = useState('Samsung');
  const [collateralModel, setCollateralModel] = useState('AU7000 / Crystal UHD');
  const [collateralSerialOrReg, setCollateralSerialOrReg] = useState('');
  const [collateralCondition, setCollateralCondition] = useState('good');
  const [collateralEstimatedValue, setCollateralEstimatedValue] = useState<number>(65000);
  const [collateralDescription, setCollateralDescription] = useState('Comes with magic remote, wall bracket, and power cable. Perfect condition.');
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([]);

  // Step 5: Next of Kin
  const [nextOfKinName, setNextOfKinName] = useState('');
  const [nextOfKinRelation, setNextOfKinRelation] = useState('Spouse');
  const [nextOfKinPhone, setNextOfKinPhone] = useState('');

  // Step 6: Consent & Signature
  const [agreedToCrbCheck, setAgreedToCrbCheck] = useState<boolean>(false);
  const [signatureText, setSignatureText] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Success state
  const [submittedApp, setSubmittedApp] = useState<{
    applicationNumber: string;
    requestedAmount: number;
    productName: string;
    applicantName: string;
    phone: string;
    installment: number;
    collateralDesc: string;
  } | null>(null);

  // Auto pre-populate from URL hash or query params if provided
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      const prodParam = url.searchParams.get('prod');
      if (prodParam && products.some((p) => p.id === prodParam)) {
        setSelectedProductId(prodParam);
      }
    }
  }, [products]);

  const selectedProduct = products.find((p) => p.id === selectedProductId) || products[0];

  // Live Loan Calculation
  const loanCalc = selectedProduct
    ? LoanEngine.calculateLoan({
        principal: Number(requestedAmount),
        interestRatePerMonth: selectedProduct.interestRatePerMonth,
        durationMonths: Number(durationMonths),
        interestMethod: selectedProduct.interestMethod,
        repaymentFrequency,
        processingFeePct: selectedProduct.processingFeePct || 3,
        insuranceFeePct: selectedProduct.insuranceFeePct || 1.5,
      })
    : { installmentAmount: 0, totalPayable: 0, totalInterest: 0, processingFee: 0, insuranceFee: 0 };

  // Handle Photo / File Upload
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file: File) => {
      if (file.size > 5 * 1024 * 1024) {
        alert('File is too large. Please select an image under 5MB.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setUploadedPhotos((prev) => [...prev, event.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemovePhoto = (idx: number) => {
    setUploadedPhotos((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleNext = () => {
    setErrorMsg('');
    if (activeStep === 1) {
      if (requestedAmount < 1000) {
        setErrorMsg('Requested loan amount must be at least KES 1,000.');
        return;
      }
      setActiveStep(2);
    } else if (activeStep === 2) {
      if (!fullName.trim()) {
        setErrorMsg('Please enter your full legal name as it appears on your National ID.');
        return;
      }
      if (!idNumber.trim()) {
        setErrorMsg('Please enter your National ID / Passport number.');
        return;
      }
      if (!phone.trim()) {
        setErrorMsg('Please enter your active M-Pesa phone number.');
        return;
      }
      setActiveStep(3);
    } else if (activeStep === 3) {
      if (!employerOrBusiness.trim()) {
        setErrorMsg('Please enter your employer or business name.');
        return;
      }
      if (monthlyIncome <= 0) {
        setErrorMsg('Please enter your estimated monthly net income.');
        return;
      }
      setActiveStep(4);
    } else if (activeStep === 4) {
      if (hasCollateral && !collateralTitle.trim()) {
        setErrorMsg('Please specify the pledged collateral item (e.g. Smart TV, Fridge, Car Logbook).');
        return;
      }
      setActiveStep(5);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!agreedToCrbCheck) {
      setErrorMsg('You must agree to the credit reference verification & terms to proceed.');
      return;
    }
    if (!signatureText.trim()) {
      setErrorMsg('Please type your full legal name as an electronic signature.');
      return;
    }

    setIsSubmitting(true);
    try {
      const submission: OnlineApplicationSubmission = {
        loanProductId: selectedProductId,
        requestedAmount: Number(requestedAmount),
        durationMonths: Number(durationMonths),
        repaymentFrequency,
        purpose: loanPurpose,
        fullName: fullName.trim(),
        idNumber: idNumber.trim(),
        phone: phone.trim(),
        alternatePhone: alternatePhone.trim(),
        email: email.trim(),
        county,
        physicalAddress: physicalAddress.trim() || 'Nairobi',
        employmentType,
        employerOrBusiness: employerOrBusiness.trim(),
        monthlyIncome: Number(monthlyIncome),
        monthlyExpenses: Number(monthlyExpenses),
        hasCollateral,
        collateralCategory,
        collateralTitle: collateralTitle.trim(),
        collateralBrand: collateralBrand.trim(),
        collateralModel: collateralModel.trim(),
        collateralSerialOrReg: collateralSerialOrReg.trim(),
        collateralCondition,
        collateralEstimatedValue: Number(collateralEstimatedValue),
        collateralDescription: collateralDescription.trim(),
        photos: uploadedPhotos,
        nextOfKinName: nextOfKinName.trim(),
        nextOfKinRelation,
        nextOfKinPhone: nextOfKinPhone.trim(),
        agreedToCrbCheck,
        signatureText: signatureText.trim(),
      };

      const result = DataService.submitOnlineApplication(submission);

      setSubmittedApp({
        applicationNumber: result.application.applicationNumber,
        requestedAmount: result.application.requestedAmount,
        productName: selectedProduct?.name || 'Secured Loan',
        applicantName: fullName.trim(),
        phone: phone.trim(),
        installment: result.application.calculatedInstallment || loanCalc.installmentAmount,
        collateralDesc: hasCollateral ? collateralTitle : 'Unsecured Facility',
      });
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred while submitting your application.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // WhatsApp Send-Back Link construction
  const getWhatsAppSendBackUrl = () => {
    if (!submittedApp) return '#';
    const compPhone = settings?.companyPhone || '+254 700 000 111';
    let cleanDestPhone = compPhone.replace(/[\s\-+]/g, '');
    if (cleanDestPhone.startsWith('0')) cleanDestPhone = '254' + cleanDestPhone.slice(1);

    const message = `Hello ${settings?.companyName || 'Davetech Solutions Limited'}! 🌟

I have completed and submitted my online loan application on your portal.

📄 *Application Ref:* ${submittedApp.applicationNumber}
👤 *Name:* ${submittedApp.applicantName}
📱 *M-Pesa Phone:* ${submittedApp.phone}
💰 *Loan Requested:* KES ${submittedApp.requestedAmount.toLocaleString()}
📅 *Duration:* ${durationMonths} Months (KES ${submittedApp.installment.toLocaleString()} / mo)
📦 *Product:* ${submittedApp.productName}
🛡️ *Pledged Security:* ${submittedApp.collateralDesc}

Please review my application and advise on approval. Thank you!`;

    return `https://wa.me/${cleanDestPhone}?text=${encodeURIComponent(message)}`;
  };

  // If submitted, show confirmation receipt
  if (submittedApp) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 py-10 px-4 flex items-center justify-center">
        <div className="max-w-lg w-full bg-slate-800 border border-slate-700 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 text-center">
          {/* Green Check Animation */}
          <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-2xl mx-auto flex items-center justify-center shadow-lg">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
              Application Submitted Successfully
            </span>
            <h2 className="text-2xl font-bold mt-2 text-white">
              Thank You, {submittedApp.applicantName}!
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Your online loan application has been registered into our underwriting desk.
            </p>
          </div>

          {/* Reference Card */}
          <div className="p-4 bg-slate-900/80 rounded-2xl border border-slate-700 text-left space-y-2.5">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <span className="text-xs text-slate-400">Application Reference</span>
              <span className="text-sm font-mono font-bold text-emerald-400">
                {submittedApp.applicationNumber}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">Requested Amount:</span>
              <span className="font-mono font-bold text-white">
                KES {submittedApp.requestedAmount.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">Est. Monthly Installment:</span>
              <span className="font-mono font-bold text-emerald-400">
                KES {submittedApp.installment.toLocaleString()} / mo
              </span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">Loan Facility:</span>
              <span className="text-slate-200">{submittedApp.productName}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">Pledged Collateral:</span>
              <span className="text-slate-200">{submittedApp.collateralDesc}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">Disbursement M-Pesa:</span>
              <span className="font-mono text-slate-300">{submittedApp.phone}</span>
            </div>
          </div>

          {/* CRITICAL USER ACTION: Send Back to Loan Officer via WhatsApp */}
          <div className="space-y-3 pt-2">
            <a
              href={getWhatsAppSendBackUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-bold text-sm shadow-lg hover:shadow-emerald-600/30 flex items-center justify-center gap-2 transition"
            >
              <MessageCircle className="w-5 h-5 fill-white" />
              <span>Send Application to Officer on WhatsApp</span>
            </a>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Tap the button above to send your reference directly to Davetech's WhatsApp credit line for fast-track processing!
            </p>
          </div>

          {/* Secondary Actions */}
          <div className="flex items-center justify-center gap-3 pt-2 border-t border-slate-700">
            <button
              type="button"
              onClick={() => window.print()}
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Application Copy</span>
            </button>
            <span className="text-slate-600">•</span>
            <button
              type="button"
              onClick={() => {
                setSubmittedApp(null);
                setActiveStep(1);
              }}
              className="text-xs text-emerald-400 hover:underline"
            >
              Submit Another Application
            </button>
          </div>

          {onBackToPortal && (
            <button
              type="button"
              onClick={onBackToPortal}
              className="text-xs text-slate-500 hover:text-slate-300 block w-full text-center"
            >
              Back to Davetech Portal
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between">
      {/* Top Header */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white font-black text-base shadow-md">
              {settings?.platformInitials || 'D'}
            </div>
            <div>
              <h1 className="font-bold text-sm tracking-tight text-white flex items-center gap-2">
                {settings?.companyName || `${settings?.platformName || 'DAVETECH'} SOLUTIONS`}
              </h1>
              <p className="text-[10px] text-slate-400">
                Secured Digital Lending & Asset Financing Portal
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={`https://wa.me/${(settings?.companyPhone || '254700000111').replace(/[\s\-+]/g, '')}?text=${encodeURIComponent('Hello Davetech, I need help with my loan application.')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 bg-emerald-950/70 border border-emerald-700/60 hover:bg-emerald-900 text-emerald-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">WhatsApp Help</span>
            </a>

            {onBackToPortal && (
              <button
                type="button"
                onClick={onBackToPortal}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium transition"
              >
                Staff Login
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Form Container */}
      <main className="max-w-3xl w-full mx-auto px-4 py-6 sm:py-8 space-y-6">
        {/* Title & Trust Badges */}
        <div className="text-center space-y-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">
            <Sparkles className="w-3 h-3" /> Instant Online Application • Fast WhatsApp Disbursal
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Apply for a Secured Loan Online
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto">
            Get instant funding backed by your household electronics (Smart TV, Woofer, Fridge, Laptop) or vehicle logbook in 30 minutes.
          </p>
        </div>

        {/* Step Progress Indicator */}
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-3 sm:p-4">
          <div className="flex items-center justify-between text-xs font-semibold mb-2 text-slate-300">
            <span>Step {activeStep} of {totalSteps}</span>
            <span className="text-emerald-400">
              {activeStep === 1 && 'Loan Requirements & Calculator'}
              {activeStep === 2 && 'Personal Identification & KYC'}
              {activeStep === 3 && 'Income & Employment'}
              {activeStep === 4 && 'Pledged Collateral & Photos'}
              {activeStep === 5 && 'Declaration & Submission'}
            </span>
          </div>
          <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full transition-all duration-300 ease-out rounded-full"
              style={{ width: `${(activeStep / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {/* Error Notification */}
        {errorMsg && (
          <div className="p-3.5 bg-rose-950/80 border border-rose-800 rounded-xl text-xs text-rose-300 flex items-start gap-2 animate-shake">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* STEP 1: Loan Requirements & Live Calculator */}
        {activeStep === 1 && (
          <div className="bg-slate-800/90 border border-slate-700 rounded-3xl p-5 sm:p-7 space-y-6">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-400" />
                Select Loan Product & Requested Amount
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Choose the facility matching your financing needs and calculate your exact monthly installment.
              </p>
            </div>

            {/* Product Selector */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300">Loan Facility Type</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {products.map((p) => {
                  const isSelected = p.id === selectedProductId;
                  return (
                    <div
                      key={p.id}
                      onClick={() => setSelectedProductId(p.id)}
                      className={`p-3.5 rounded-2xl border cursor-pointer transition flex items-start gap-3 ${
                        isSelected
                          ? 'bg-emerald-950/40 border-emerald-500 text-white shadow-md'
                          : 'bg-slate-900/60 border-slate-700 text-slate-300 hover:border-slate-600'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                        isSelected ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {p.code === 'LP-ITEM' ? <Tv className="w-4 h-4" /> : <Layers className="w-4 h-4" />}
                      </div>
                      <div className="text-xs">
                        <span className="font-bold block text-sm">{p.name}</span>
                        <span className="text-[11px] text-slate-400 block mt-0.5">
                          {p.interestRatePerMonth}% per month • Max LTV {p.maxLtvPercentage || 70}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Amount Slider & Input */}
            <div className="space-y-3 pt-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-slate-300">
                  How much money do you need?
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs font-mono text-slate-400">KES</span>
                  <input
                    type="number"
                    value={requestedAmount}
                    onChange={(e) => setRequestedAmount(Math.max(0, Number(e.target.value)))}
                    className="w-44 pl-12 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-right font-mono font-bold text-white text-base outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Slider */}
              <input
                type="range"
                min={5000}
                max={500000}
                step={5000}
                value={requestedAmount}
                onChange={(e) => setRequestedAmount(Number(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer"
              />

              {/* Quick Amount Chips */}
              <div className="flex flex-wrap gap-2">
                {[15000, 30000, 50000, 80000, 120000, 200000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setRequestedAmount(amt)}
                    className={`px-3 py-1 rounded-xl text-xs font-mono font-semibold transition ${
                      requestedAmount === amt
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-900 text-slate-300 hover:bg-slate-700 border border-slate-700'
                    }`}
                  >
                    KES {amt.toLocaleString()}
                  </button>
                ))}
              </div>
            </div>

            {/* Duration Selector */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300">
                  Repayment Duration (Months)
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[1, 3, 6, 12].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setDurationMonths(m)}
                      className={`py-2 text-xs font-bold rounded-xl border transition ${
                        durationMonths === m
                          ? 'bg-emerald-600 text-white border-emerald-500'
                          : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-600'
                      }`}
                    >
                      {m} Mo
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300">
                  Repayment Schedule
                </label>
                <select
                  value={repaymentFrequency}
                  onChange={(e) => setRepaymentFrequency(e.target.value as any)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-xs outline-none focus:border-emerald-500"
                >
                  <option value="monthly">Monthly Installments</option>
                  <option value="weekly">Weekly Installments</option>
                  <option value="bi_weekly">Bi-Weekly (Every 2 Weeks)</option>
                </select>
              </div>
            </div>

            {/* Purpose */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300">Loan Purpose</label>
              <input
                type="text"
                value={loanPurpose}
                onChange={(e) => setLoanPurpose(e.target.value)}
                placeholder="e.g. Business stock inventory, school fees, electronics purchase"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-xs outline-none focus:border-emerald-500"
              />
            </div>

            {/* Live Calculation Summary Card */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-950 to-slate-900 border border-emerald-500/30 space-y-3">
              <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                <span className="text-xs text-slate-400">Estimated Monthly Installment:</span>
                <span className="text-lg font-mono font-extrabold text-emerald-400">
                  KES {loanCalc.installmentAmount.toLocaleString()}
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] text-slate-400">
                <div>
                  <span>Total Repayable:</span>
                  <span className="block font-mono font-bold text-slate-200">
                    KES {loanCalc.totalPayable.toLocaleString()}
                  </span>
                </div>
                <div>
                  <span>Interest Rate:</span>
                  <span className="block font-mono font-bold text-slate-200">
                    {selectedProduct.interestRatePerMonth}% / Month
                  </span>
                </div>
                <div>
                  <span>Processing Fee:</span>
                  <span className="block font-mono font-bold text-slate-200">
                    KES {loanCalc.processingFee.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Personal Identification */}
        {activeStep === 2 && (
          <div className="bg-slate-800/90 border border-slate-700 rounded-3xl p-5 sm:p-7 space-y-5">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <User className="w-5 h-5 text-emerald-400" />
                Personal Information & Contacts
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Enter your details exactly as shown on your Kenyan National ID or Passport.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Full Legal Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. John Kamau Mwangi"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-xs outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    National ID / Passport Number <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 29384729"
                    value={idNumber}
                    onChange={(e) => setIdNumber(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-xs font-mono outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    M-Pesa Phone Number (Disbursement Destination) <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 0712 345 678"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-xs font-mono outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Email Address (Optional)
                  </label>
                  <input
                    type="email"
                    placeholder="e.g. j.mwangi@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-xs outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Alternate / WhatsApp Number
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 0722 000 111"
                    value={alternatePhone}
                    onChange={(e) => setAlternatePhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-xs font-mono outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    County of Residence <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={county}
                    onChange={(e) => setCounty(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-xs outline-none focus:border-emerald-500"
                  >
                    <option value="Nairobi">Nairobi</option>
                    <option value="Kiambu">Kiambu</option>
                    <option value="Machakos">Machakos</option>
                    <option value="Nakuru">Nakuru</option>
                    <option value="Mombasa">Mombasa</option>
                    <option value="Kisumu">Kisumu</option>
                    <option value="Uasin Gishu">Uasin Gishu (Eldoret)</option>
                    <option value="Kajiado">Kajiado</option>
                    <option value="Murang'a">Murang'a</option>
                    <option value="Meru">Meru</option>
                    <option value="Other">Other County</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Town / Estate / House Number
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Roysambu, Lumumba Drive, House 4B"
                    value={physicalAddress}
                    onChange={(e) => setPhysicalAddress(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-xs outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Income & Employment */}
        {activeStep === 3 && (
          <div className="bg-slate-800/90 border border-slate-700 rounded-3xl p-5 sm:p-7 space-y-5">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-emerald-400" />
                Employment & Financial Profile
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Help us evaluate your repayment capability for fast loan sanction.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Primary Income Source <span className="text-rose-400">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { id: 'business_owner', label: 'Business Owner / Trader' },
                    { id: 'salaried', label: 'Employed / Salaried' },
                    { id: 'informal_jua_kali', label: 'Jua Kali / Artisan' },
                    { id: 'agriculture', label: 'Farming / Agribusiness' },
                    { id: 'freelancer', label: 'Freelancer / Casual' },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setEmploymentType(item.id as any)}
                      className={`p-2.5 rounded-xl text-xs font-semibold border text-center transition ${
                        employmentType === item.id
                          ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                          : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-600'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Employer or Business Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Kamau Wholesalers Ltd / Ministry of Health"
                  value={employerOrBusiness}
                  onChange={(e) => setEmployerOrBusiness(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-xs outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Monthly Net Income (KES) <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="number"
                    value={monthlyIncome}
                    onChange={(e) => setMonthlyIncome(Math.max(0, Number(e.target.value)))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-xs font-mono font-bold outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Monthly Household Expenses (KES)
                  </label>
                  <input
                    type="number"
                    value={monthlyExpenses}
                    onChange={(e) => setMonthlyExpenses(Math.max(0, Number(e.target.value)))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-xs font-mono outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: Pledged Collateral & Uploads */}
        {activeStep === 4 && (
          <div className="bg-slate-800/90 border border-slate-700 rounded-3xl p-5 sm:p-7 space-y-5">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                Pledged Security / Collateral Details
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Pledge your household electronics (Smart TV, Woofer, Refrigerator, Laptop) or vehicle logbook for instant approval.
              </p>
            </div>

            <div className="space-y-4">
              {/* Category */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Asset Category
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'household_items', label: 'Household Item (TV, Woofer, Fridge)' },
                    { id: 'vehicles', label: 'Motor Vehicle / Logbook' },
                    { id: 'electronics', label: 'Laptop / Phone / Solar' },
                    { id: 'land_property', label: 'Title Deed / Land Plot' },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCollateralCategory(cat.id as any)}
                      className={`p-2.5 rounded-xl text-xs font-semibold border text-center transition ${
                        collateralCategory === cat.id
                          ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                          : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-600'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Item Title */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Item Description / Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Samsung 55-inch 4K UHD Smart TV / Sony MHC-V43D Home Audio"
                  value={collateralTitle}
                  onChange={(e) => setCollateralTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-xs outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Brand / Make</label>
                  <input
                    type="text"
                    placeholder="e.g. Samsung, LG, Sony, Ramtons"
                    value={collateralBrand}
                    onChange={(e) => setCollateralBrand(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-xs outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Model / Specs</label>
                  <input
                    type="text"
                    placeholder="e.g. AU7000 / 55-Inch / 4K"
                    value={collateralModel}
                    onChange={(e) => setCollateralModel(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-xs outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Serial Number / Reg</label>
                  <input
                    type="text"
                    placeholder="e.g. SN-88910293"
                    value={collateralSerialOrReg}
                    onChange={(e) => setCollateralSerialOrReg(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-xs font-mono outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Estimated Market Value (KES)
                  </label>
                  <input
                    type="number"
                    value={collateralEstimatedValue}
                    onChange={(e) => setCollateralEstimatedValue(Math.max(0, Number(e.target.value)))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-xs font-mono font-bold outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Condition</label>
                  <select
                    value={collateralCondition}
                    onChange={(e) => setCollateralCondition(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-xs outline-none focus:border-emerald-500"
                  >
                    <option value="brand_new">Brand New (In Box / Sealed)</option>
                    <option value="mint">Mint / Like New</option>
                    <option value="good">Good (Fully Functional)</option>
                    <option value="fair">Fair (Normal Wear & Tear)</option>
                  </select>
                </div>
              </div>

              {/* Photo Upload Card */}
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-700 space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-emerald-400" />
                    Attach Photos (National ID & Pledged Item)
                  </label>
                  <span className="text-[10px] text-slate-400">Up to 5MB each</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {uploadedPhotos.map((photo, i) => (
                    <div key={i} className="aspect-video relative rounded-xl overflow-hidden border border-slate-700 group bg-slate-950">
                      <img src={photo} alt={`Uploaded ${i + 1}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => handleRemovePhoto(i)}
                        className="absolute top-1 right-1 p-1 bg-rose-600 text-white rounded-full opacity-80 hover:opacity-100 transition shadow-xs"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}

                  <label className="aspect-video border-2 border-dashed border-slate-700 hover:border-emerald-500 rounded-xl flex flex-col items-center justify-center text-center cursor-pointer p-2 transition bg-slate-800/40">
                    <UploadCloud className="w-5 h-5 text-slate-400 group-hover:text-emerald-400" />
                    <span className="text-[10px] text-slate-300 font-semibold mt-1">Upload Photo</span>
                    <span className="text-[9px] text-slate-500">Take with Camera or Gallery</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 5: Next of Kin, Declaration & Signature */}
        {activeStep === 5 && (
          <div className="bg-slate-800/90 border border-slate-700 rounded-3xl p-5 sm:p-7 space-y-6">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-400" />
                Guarantor / Next of Kin & Legal Consent
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Provide an emergency contact and certify the truthfulness of your application.
              </p>
            </div>

            {/* Next of Kin */}
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-700 space-y-3">
              <h4 className="text-xs font-bold text-slate-200">Next of Kin / Emergency Contact</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Full Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Mary Wanjiku"
                    value={nextOfKinName}
                    onChange={(e) => setNextOfKinName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-xs outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Relationship</label>
                  <select
                    value={nextOfKinRelation}
                    onChange={(e) => setNextOfKinRelation(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-xs outline-none focus:border-emerald-500"
                  >
                    <option value="Spouse">Spouse</option>
                    <option value="Parent">Parent</option>
                    <option value="Sibling">Sibling</option>
                    <option value="Child">Child</option>
                    <option value="Business Partner">Business Partner</option>
                    <option value="Relative">Relative</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Mobile Phone</label>
                  <input
                    type="text"
                    placeholder="e.g. 0711 222 333"
                    value={nextOfKinPhone}
                    onChange={(e) => setNextOfKinPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-xs font-mono outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* Terms & Consent */}
            <div className="space-y-4">
              <label className="flex items-start gap-3 cursor-pointer p-3.5 rounded-2xl bg-slate-900 border border-slate-700">
                <input
                  type="checkbox"
                  checked={agreedToCrbCheck}
                  onChange={(e) => setAgreedToCrbCheck(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 accent-emerald-500"
                />
                <span className="text-xs text-slate-300 leading-relaxed">
                  I hereby declare that all information and pledged asset specifications provided in this online application are true and correct. I authorize <strong>{settings?.companyName || 'Davetech Solutions Limited'}</strong> to conduct credit verification, reference checks (CRB), and security valuation in accordance with Kenyan Law (Chattels Transfer Act Cap 28 and Data Protection Act).
                </span>
              </label>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Electronic Signature (Type Full Legal Name) <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Type your full name to execute digital signature"
                  value={signatureText}
                  onChange={(e) => setSignatureText(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-sm font-serif italic outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step Navigation Bar */}
        <div className="flex items-center justify-between gap-3 pt-2">
          {activeStep > 1 ? (
            <button
              type="button"
              onClick={() => setActiveStep((prev) => Math.max(1, prev - 1))}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
          ) : (
            <div />
          )}

          {activeStep < totalSteps ? (
            <button
              type="button"
              onClick={handleNext}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg flex items-center gap-2 transition"
            >
              <span>Continue to Step {activeStep + 1}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-8 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-extrabold shadow-lg hover:shadow-emerald-600/30 flex items-center gap-2 transition disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSubmitting ? 'Submitting Application...' : 'Submit Loan Application'}</span>
            </button>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950 py-4 text-center text-[11px] text-slate-500">
        <div className="max-w-4xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            © 2026 {settings?.companyName || 'Davetech Solutions Limited'}. All rights reserved.
          </span>
          <span className="flex items-center gap-1 text-slate-400">
            <Lock className="w-3 h-3 text-emerald-500" />
            256-Bit SSL Bank-Grade Encryption
          </span>
        </div>
      </footer>
    </div>
  );
};
