import React, { useState, useEffect } from 'react';
import { Sparkles, Check, RotateCcw, Building2, Tag, ShieldCheck, Globe } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Modal } from './Modal';

interface EditPlatformTitleModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EditPlatformTitleModal: React.FC<EditPlatformTitleModalProps> = ({ isOpen, onClose }) => {
  const { systemSettings, updateSystemSettings } = useAuth();

  const [platformName, setPlatformName] = useState(systemSettings.platformName || 'DAVETECH');
  const [platformTitle, setPlatformTitle] = useState(systemSettings.platformTitle || 'ERP');
  const [platformSubtitle, setPlatformSubtitle] = useState(
    systemSettings.platformSubtitle || 'Property, Asset & Secured Lending'
  );
  const [platformInitials, setPlatformInitials] = useState(systemSettings.platformInitials || 'D');
  const [companyName, setCompanyName] = useState(systemSettings.companyName || 'Davetech Solutions');
  const [brandTagline, setBrandTagline] = useState(
    systemSettings.brandTagline || 'Technology • Innovation • Efficiency'
  );
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setPlatformName(systemSettings.platformName || 'DAVETECH');
      setPlatformTitle(systemSettings.platformTitle || 'ERP');
      setPlatformSubtitle(systemSettings.platformSubtitle || 'Property, Asset & Secured Lending');
      setPlatformInitials(systemSettings.platformInitials || 'D');
      setCompanyName(systemSettings.companyName || 'Davetech Solutions');
      setBrandTagline(systemSettings.brandTagline || 'Technology • Innovation • Efficiency');
      setSavedSuccess(false);
    }
  }, [isOpen, systemSettings]);

  // Automatically update initials if user changes platform name and initials are default
  const handleNameChange = (val: string) => {
    setPlatformName(val);
    if (!platformInitials || platformInitials === platformName.charAt(0).toUpperCase()) {
      setPlatformInitials(val.trim().charAt(0).toUpperCase() || 'D');
    }
  };

  const handleApplyPreset = (preset: {
    name: string;
    title: string;
    subtitle: string;
    initials: string;
    company: string;
    tagline: string;
  }) => {
    setPlatformName(preset.name);
    setPlatformTitle(preset.title);
    setPlatformSubtitle(preset.subtitle);
    setPlatformInitials(preset.initials);
    setCompanyName(preset.company);
    setBrandTagline(preset.tagline);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = platformName.trim() || 'DAVETECH';
    updateSystemSettings({
      platformName: cleanName,
      platformTitle: platformTitle.trim(),
      platformSubtitle: platformSubtitle.trim(),
      platformInitials: (platformInitials.trim() || cleanName.charAt(0) || 'D').toUpperCase(),
      logoType: systemSettings.logoType,
      logoUrl: systemSettings.logoUrl,
      companyName: companyName.trim() || `${cleanName} Solutions`,
      brandTagline: brandTagline.trim(),
    });
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 800);
  };

  const handleResetToDefault = () => {
    handleApplyPreset({
      name: 'DAVETECH',
      title: 'ERP',
      subtitle: 'Property, Asset & Secured Lending',
      initials: 'D',
      company: 'Davetech Solutions',
      tagline: 'Technology • Innovation • Efficiency',
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Platform Name & Title"
      subtitle="Customize platform branding, edition suffix, tagline, and corporate identity across all modules."
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5 text-xs">
        {savedSuccess && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200 rounded-xl flex items-center gap-2 font-medium">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>Platform branding and title updated successfully!</span>
          </div>
        )}

        {/* Live Visual Preview Card */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              Live Visual Preview
            </span>
            <span className="text-[10px] text-emerald-400 font-mono">Real-time Render</span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-emerald-900/40 shrink-0 overflow-hidden">
                {systemSettings.logoType === 'image' && systemSettings.logoUrl ? (
                  <img
                    src={systemSettings.logoUrl}
                    alt="Logo"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-contain p-0.5"
                  />
                ) : (
                  platformInitials || 'D'
                )}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-extrabold tracking-tight text-lg text-white truncate">
                    {platformName || 'PLATFORM'}
                  </span>
                  <span className="text-emerald-400 font-bold text-xs uppercase px-1.5 py-0.5 rounded-sm bg-emerald-950/80 border border-emerald-800/60">
                    {platformTitle || 'ERP'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-medium tracking-wide truncate max-w-[280px]">
                  {platformSubtitle || 'Property, Asset & Secured Lending'}
                </p>
              </div>
            </div>

            <div className="hidden sm:block text-right pl-3 border-l border-slate-800">
              <p className="text-[10px] text-slate-500 font-medium">Browser Tab Title</p>
              <p className="text-[11px] text-slate-300 font-mono truncate max-w-[180px]">
                {platformName || 'Platform'} {platformTitle || 'ERP'} • Lending
              </p>
            </div>
          </div>
        </div>

        {/* Quick Presets */}
        <div>
          <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1.5 text-[11px] uppercase tracking-wider">
            Quick One-Click Presets
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() =>
                handleApplyPreset({
                  name: 'DAVETECH',
                  title: 'ERP',
                  subtitle: 'Property, Asset & Secured Lending',
                  initials: 'D',
                  company: 'Davetech Solutions',
                  tagline: 'Technology • Innovation • Efficiency',
                })
              }
              className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-medium border border-slate-200 dark:border-slate-700 transition"
            >
              Davetech ERP (Default)
            </button>
            <button
              type="button"
              onClick={() =>
                handleApplyPreset({
                  name: 'BREAKTHROUGH',
                  title: 'CREDIT ERP',
                  subtitle: 'Secured Asset & Commercial Lending Platform',
                  initials: 'BT',
                  company: 'Breakthrough Capital Ltd',
                  tagline: 'Financing Progress • Securing Assets',
                })
              }
              className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-medium border border-slate-200 dark:border-slate-700 transition"
            >
              Breakthrough Credit ERP
            </button>
            <button
              type="button"
              onClick={() =>
                handleApplyPreset({
                  name: 'APEX',
                  title: 'FINANCE OS',
                  subtitle: 'Asset-Backed Microfinance & Collateral Custody',
                  initials: 'APX',
                  company: 'Apex Financial Services Ltd',
                  tagline: 'Secure Lending • Rapid Realization',
                })
              }
              className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-medium border border-slate-200 dark:border-slate-700 transition"
            >
              Apex Finance OS
            </button>
            <button
              type="button"
              onClick={() =>
                handleApplyPreset({
                  name: 'KILIMA',
                  title: 'LENDING PRO',
                  subtitle: 'Logbook & Title Deed Secured Facilities',
                  initials: 'K',
                  company: 'Kilima Credit Microfinance',
                  tagline: 'Empowering Growth • Reliable Credit',
                })
              }
              className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-medium border border-slate-200 dark:border-slate-700 transition"
            >
              Kilima Lending Pro
            </button>
          </div>
        </div>

        {/* Input Fields */}
        <div className="space-y-3 pt-1">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Platform Primary Name / Brand <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={platformName}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g. DAVETECH, BREAKTHROUGH, APEX"
                  className="w-full p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-slate-100 text-sm uppercase tracking-wide focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">Displayed prominently on the top of the sidebar and documents.</p>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Title Tag / Edition <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={platformTitle}
                onChange={(e) => setPlatformTitle(e.target.value)}
                placeholder="e.g. ERP, PRO, OS"
                className="w-full p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono font-bold text-slate-900 dark:text-slate-100 text-sm uppercase focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
              <p className="text-[10px] text-slate-400 mt-0.5">Appended badge (e.g. ERP).</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="sm:col-span-3">
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Platform Subtitle / Scope Descriptor
              </label>
              <input
                type="text"
                value={platformSubtitle}
                onChange={(e) => setPlatformSubtitle(e.target.value)}
                placeholder="e.g. Property, Asset & Secured Lending"
                className="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Logo Initial(s)
              </label>
              <input
                type="text"
                maxLength={4}
                value={platformInitials}
                onChange={(e) => setPlatformInitials(e.target.value.toUpperCase())}
                placeholder="D"
                className="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono font-bold text-center uppercase"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Registered Institution / Legal Entity Name
              </label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g. Davetech Solutions Limited"
                className="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              />
              <p className="text-[10px] text-slate-400 mt-0.5">Used on loan contracts, formal notices, and receipts.</p>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Brand Slogan / Tagline
              </label>
              <input
                type="text"
                value={brandTagline}
                onChange={(e) => setBrandTagline(e.target.value)}
                placeholder="e.g. Technology • Innovation • Efficiency"
                className="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              />
              <p className="text-[10px] text-slate-400 mt-0.5">Appears in footer and print headers.</p>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={handleResetToDefault}
            className="px-3 py-2 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 flex items-center gap-1.5 transition text-[11px]"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset to Davetech Default</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold flex items-center gap-1.5 shadow-sm transition"
            >
              <Check className="w-4 h-4" />
              <span>Save & Apply Platform Title</span>
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
