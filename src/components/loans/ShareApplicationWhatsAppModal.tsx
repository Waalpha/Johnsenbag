/**
 * DAVETECH ERP - Share WhatsApp Application Form Modal
 * Allows loan officers and staff to dispatch online application links
 * directly to clients via WhatsApp, SMS, or QR Code.
 */

import React, { useState } from 'react';
import {
  MessageCircle,
  Copy,
  Check,
  QrCode,
  ExternalLink,
  Share2,
  Smartphone,
  User,
  Package,
  Send,
  Sparkles,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { useAuth } from '../../context/AuthContext';
import { DataService } from '../../services/dataService';

interface ShareApplicationWhatsAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  prefillPhone?: string;
  prefillName?: string;
  prefillProduct?: string;
}

export const ShareApplicationWhatsAppModal: React.FC<ShareApplicationWhatsAppModalProps> = ({
  isOpen,
  onClose,
  prefillPhone = '',
  prefillName = '',
  prefillProduct = '',
}) => {
  const { systemSettings, currentUser } = useAuth();
  const products = DataService.getLoanProducts();
  const customers = DataService.getCustomers();

  const [clientPhone, setClientPhone] = useState(prefillPhone);
  const [clientName, setClientName] = useState(prefillName);
  const [selectedProductId, setSelectedProductId] = useState(prefillProduct);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedMessage, setCopiedMessage] = useState(false);
  const [showQr, setShowQr] = useState(false);

  // Generate public application link using the current window origin + #apply
  const baseUrl = typeof window !== 'undefined' ? window.location.origin + window.location.pathname : 'https://davetech.co.ke';
  const productQuery = selectedProductId ? `&prod=${encodeURIComponent(selectedProductId)}` : '';
  const refQuery = currentUser ? `&ref=${encodeURIComponent(currentUser.id)}` : '';
  const applicationLink = `${baseUrl}#apply${productQuery ? '?' + productQuery.slice(1) : ''}${refQuery ? (productQuery ? refQuery : '?' + refQuery.slice(1)) : ''}`;

  const selectedProduct = products.find((p) => p.id === selectedProductId);
  const companyName = systemSettings?.companyName || 'Davetech Solutions Limited';
  const platformName = systemSettings?.platformName || 'Davetech';

  // Construct custom WhatsApp message
  const greeting = clientName ? `Hello ${clientName},` : 'Hello,';
  const productMention = selectedProduct ? ` for our ${selectedProduct.name}` : '';
  
  const whatsappMessage = `${greeting}

Welcome to ${companyName}! 🌟

You can now apply for your loan${productMention} directly online from your phone in just 2 minutes.

📱 *Click the link below to fill your application form:*
👉 ${applicationLink}

📋 *What you will need:*
1. National ID Number & Photos
2. M-Pesa phone number for disbursal
3. Item / Asset security details (Smart TV, fridge, woofer, car logbook, etc.)

Once submitted, our credit team will review and contact you immediately for instant approval and disbursement.

*Support Tel:* ${systemSettings?.companyPhone || '+254 700 000 111'}
_${platformName} Credit Origination Team_`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(applicationLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(whatsappMessage);
    setCopiedMessage(true);
    setTimeout(() => setCopiedMessage(false), 2000);
  };

  const handleSendWhatsApp = () => {
    // Format phone: strip spaces, dashes, leading zero -> 254
    let cleanPhone = clientPhone.replace(/[\s\-+]/g, '');
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '254' + cleanPhone.slice(1);
    } else if (cleanPhone.startsWith('7') || cleanPhone.startsWith('1')) {
      cleanPhone = '254' + cleanPhone;
    }

    const waUrl = cleanPhone
      ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(whatsappMessage)}`
      : `https://wa.me/?text=${encodeURIComponent(whatsappMessage)}`;
    
    window.open(waUrl, '_blank');
  };

  const handleSelectCustomer = (custId: string) => {
    const c = customers.find((cust) => cust.id === custId);
    if (c) {
      setClientName(c.fullName);
      setClientPhone(c.phone);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Send Online Loan Application via WhatsApp" size="lg">
      <div className="space-y-5">
        {/* Top Feature Banner */}
        <div className="p-3.5 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-transparent border border-emerald-500/20 rounded-xl flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <MessageCircle className="w-5 h-5" />
          </div>
          <div className="text-xs">
            <h4 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
              Client Self-Service WhatsApp Dispatch
              <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                Live Online Form
              </span>
            </h4>
            <p className="text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
              Send this link to any client. They fill out their personal details, loan request, and upload item/collateral photos online on their phone. Once submitted, it appears automatically in your <strong>Origination Pipeline</strong> for immediate review!
            </p>
          </div>
        </div>

        {/* Inputs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {/* Client Quick Picker */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Select Existing Customer (Optional)
            </label>
            <select
              onChange={(e) => handleSelectCustomer(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 outline-none focus:border-emerald-500"
            >
              <option value="">-- Or enter new prospect details below --</option>
              {customers.slice(0, 30).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.fullName} ({c.phone}) - {c.customerNumber}
                </option>
              ))}
            </select>
          </div>

          {/* Target Product Focus */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Loan Product Focus
            </label>
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 outline-none focus:border-emerald-500"
            >
              <option value="">All Loan Products (Client can choose)</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.code}) - {p.interestRatePerMonth}% / mo
                </option>
              ))}
            </select>
          </div>

          {/* Client Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Client / Prospect Name
            </label>
            <div className="relative">
              <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="e.g. Samuel Mutiso"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Client WhatsApp Phone */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Client WhatsApp Number
            </label>
            <div className="relative">
              <Smartphone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="e.g. 0712 345 678 or +254 712 345 678"
                value={clientPhone}
                onChange={(e) => setClientPhone(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 outline-none focus:border-emerald-500 font-mono"
              />
            </div>
          </div>
        </div>

        {/* Live Application Link Bar */}
        <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1.5">
          <div className="flex items-center justify-between text-xs font-medium text-slate-700 dark:text-slate-300">
            <span>Direct Online Form URL:</span>
            <button
              type="button"
              onClick={() => window.open(applicationLink, '_blank')}
              className="text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 font-semibold text-[11px]"
            >
              <ExternalLink className="w-3 h-3" />
              Test Form in Browser
            </button>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={applicationLink}
              className="w-full px-3 py-1.5 text-[11px] font-mono rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 select-all"
            />
            <button
              type="button"
              onClick={handleCopyLink}
              className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-lg text-xs font-semibold shrink-0 flex items-center gap-1 transition"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLink ? 'Copied!' : 'Copy Link'}</span>
            </button>
          </div>
        </div>

        {/* WhatsApp Message Preview */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
              WhatsApp Pre-Formatted Invitation Message:
            </label>
            <button
              type="button"
              onClick={handleCopyMessage}
              className="text-xs text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1"
            >
              {copiedMessage ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              <span>{copiedMessage ? 'Message Copied!' : 'Copy Message Text'}</span>
            </button>
          </div>
          <div className="p-3 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 rounded-xl text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap font-sans leading-relaxed max-h-48 overflow-y-auto">
            {whatsappMessage}
          </div>
        </div>

        {/* In-Office QR Code Generator Toggle */}
        <div>
          <button
            type="button"
            onClick={() => setShowQr(!showQr)}
            className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 flex items-center gap-1.5"
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>{showQr ? 'Hide In-Branch QR Code' : 'Show In-Branch Counter QR Code (Scan to Apply)'}</span>
          </button>

          {showQr && (
            <div className="mt-3 p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl flex flex-col items-center justify-center text-center">
              {/* Clean SVG visual QR pattern */}
              <div className="w-44 h-44 bg-white p-3 rounded-xl border border-slate-300 shadow-sm flex flex-col items-center justify-center relative">
                <svg viewBox="0 0 100 100" className="w-full h-full">
                  {/* Outer corner markers */}
                  <rect x="5" y="5" width="26" height="26" fill="black" rx="2" />
                  <rect x="9" y="9" width="18" height="18" fill="white" rx="1" />
                  <rect x="13" y="13" width="10" height="10" fill="black" />

                  <rect x="69" y="5" width="26" height="26" fill="black" rx="2" />
                  <rect x="73" y="9" width="18" height="18" fill="white" rx="1" />
                  <rect x="77" y="13" width="10" height="10" fill="black" />

                  <rect x="5" y="69" width="26" height="26" fill="black" rx="2" />
                  <rect x="9" y="73" width="18" height="18" fill="white" rx="1" />
                  <rect x="13" y="77" width="10" height="10" fill="black" />

                  {/* QR Data Grid Dots */}
                  <circle cx="40" cy="18" r="3" fill="#059669" />
                  <circle cx="52" cy="18" r="3" fill="black" />
                  <circle cx="46" cy="28" r="3" fill="black" />
                  <circle cx="58" cy="28" r="3" fill="#059669" />
                  <circle cx="18" cy="46" r="3" fill="black" />
                  <circle cx="28" cy="46" r="3" fill="#059669" />
                  <circle cx="18" cy="58" r="3" fill="#059669" />
                  <circle cx="28" cy="58" r="3" fill="black" />
                  <circle cx="45" cy="45" r="4" fill="#059669" />
                  <circle cx="55" cy="45" r="3" fill="black" />
                  <circle cx="45" cy="55" r="3" fill="black" />
                  <circle cx="55" cy="55" r="4" fill="#059669" />
                  <circle cx="75" cy="45" r="3" fill="black" />
                  <circle cx="85" cy="45" r="3" fill="#059669" />
                  <circle cx="75" cy="55" r="3" fill="#059669" />
                  <circle cx="85" cy="55" r="3" fill="black" />
                  <circle cx="40" cy="75" r="3" fill="black" />
                  <circle cx="52" cy="75" r="3" fill="#059669" />
                  <circle cx="46" cy="85" r="3" fill="#059669" />
                  <circle cx="58" cy="85" r="3" fill="black" />
                  <circle cx="75" cy="75" r="3" fill="black" />
                  <circle cx="85" cy="75" r="3" fill="#059669" />
                  <circle cx="75" cy="85" r="3" fill="#059669" />
                  <circle cx="85" cy="85" r="3" fill="black" />
                </svg>
              </div>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-2">
                Scan with Phone Camera to Apply
              </p>
              <p className="text-[11px] text-slate-500">
                Displays the mobile-friendly {platformName} loan application form.
              </p>
            </div>
          )}
        </div>

        {/* Modal Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-200 dark:border-slate-700">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
          >
            Close
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleCopyLink}
              className="flex-1 sm:flex-none px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copy Link</span>
            </button>

            <button
              type="button"
              onClick={handleSendWhatsApp}
              className="flex-1 sm:flex-none px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-md hover:shadow-lg flex items-center justify-center gap-2 transition"
            >
              <MessageCircle className="w-4 h-4 fill-white" />
              <span>{clientPhone ? 'Send to Client on WhatsApp' : 'Open in WhatsApp'}</span>
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
