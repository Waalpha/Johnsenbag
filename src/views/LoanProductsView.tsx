/**
 * DAVETECH ERP - Secured Loan Products Catalog
 * Product definitions, interest methods, processing fees, LTV caps, and tenure rules.
 */

import React, { useState } from 'react';
import { Briefcase, Plus, CheckCircle, Percent, Shield, Clock, Landmark } from 'lucide-react';
import { DataService } from '../services/dataService';
import { LoanProduct } from '../types/erp';
import { LoanEngine } from '../services/loanEngine';
import { useAuth } from '../context/AuthContext';
import { Modal } from '../components/common/Modal';

export const LoanProductsView: React.FC = () => {
  const { hasPermission, currentUser } = useAuth();
  const [products, setProducts] = useState<LoanProduct[]>(() => DataService.getLoanProducts());
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form states
  const [code, setCode] = useState('PROD-AUTO-01');
  const [name, setName] = useState('Premium Logbook Loan');
  const [collateralType, setCollateralType] = useState('motor_vehicle');
  const [minAmount, setMinAmount] = useState(100000);
  const [maxAmount, setMaxAmount] = useState(5000000);
  const [interestRate, setInterestRate] = useState(3.5);
  const [interestMethod, setInterestMethod] = useState<'flat_rate' | 'reducing_balance'>('reducing_balance');
  const [minTenure, setMinTenure] = useState(3);
  const [maxTenure, setMaxTenure] = useState(36);
  const [maxLtv, setMaxLtv] = useState(70);
  const [procFee, setProcFee] = useState(2.5);

  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    const newProd: LoanProduct = {
      id: `lp-${Date.now()}`,
      code,
      name,
      collateralType: collateralType as any,
      minAmount: Number(minAmount),
      maxAmount: Number(maxAmount),
      interestRatePerMonth: Number(interestRate),
      interestMethod,
      minTenureMonths: Number(minTenure),
      maxTenureMonths: Number(maxTenure),
      maxLtvPercentage: Number(maxLtv),
      processingFeePercentage: Number(procFee),
      insuranceFeePercentage: 1.0,
      active: true,
      description: `Secured credit facility against ${(collateralType || 'collateral').replace(/_/g, ' ')} with up to ${maxLtv}% LTV.`,
    };

    DataService.saveLoanProduct(newProd, currentUser);
    setProducts(DataService.getLoanProducts());
    setIsAddModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Secured Loan Products
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
              {products.length} Active Configurations
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Configurable lending facilities with strict LTV limits, reducing balance / flat rates, and automated statutory fees.
          </p>
        </div>

        {hasPermission('settings.*') && (
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm transition flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Loan Product</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {products.map((p) => (
          <div
            key={p.id}
            className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-5 shadow-xs flex flex-col justify-between hover:border-emerald-500 transition group"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                  {p.code}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                  {p.active ? 'Active' : 'Archived'}
                </span>
              </div>

              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 group-hover:text-emerald-600 transition">
                {p.name}
              </h3>
              <p className="text-xs text-slate-500 mt-1">{p.description}</p>

              <div className="mt-4 space-y-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-100 dark:border-slate-700 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-400">Monthly Interest:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {p.interestRatePerMonth}% ({String(p.interestMethod || 'flat_rate').replace(/_/g, ' ')})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Maximum LTV:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    {p.maxLtvPercentage ?? (p as any).maxLtvPct ?? 70}% of FSV
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Tenure Range:</span>
                  <span className="text-slate-700 dark:text-slate-300">
                    {p.minTenureMonths ?? (p as any).minDurationMonths ?? 1} - {p.maxTenureMonths ?? (p as any).maxDurationMonths ?? 36} Months
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Facility Limits:</span>
                  <span className="text-slate-700 dark:text-slate-300">
                    {LoanEngine.formatKES(p.minAmount, false)} - {LoanEngine.formatKES(p.maxAmount, false)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Processing Fee:</span>
                  <span className="text-slate-700 dark:text-slate-300">
                    {p.processingFeePercentage ?? (p as any).processingFeePct ?? 2.5}% + {p.insuranceFeePercentage ?? (p as any).insuranceFeePct ?? 1.5}% Insurance
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700 text-[11px] text-slate-400 flex items-center justify-between">
              <span>Security: {String(p.collateralType || (p as any).requiredCollateralCategory?.[0] || 'collateral').replace(/_/g, ' ').toUpperCase()}</span>
              <span className="text-emerald-600 font-medium">Verified Security Required</span>
            </div>
          </div>
        ))}
      </div>

      {/* Add Product Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Configure New Lending Product"
        subtitle="Establish borrowing parameters, interest models, and statutory risk limits."
        maxWidth="2xl"
      >
        <form onSubmit={handleCreateProduct} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Product Code</label>
              <input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Product Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Eligible Collateral</label>
              <select
                value={collateralType}
                onChange={(e) => setCollateralType(e.target.value)}
                className="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              >
                <option value="motor_vehicle">Motor Vehicle</option>
                <option value="residential_property">Residential Property</option>
                <option value="commercial_property">Commercial Property</option>
                <option value="machinery">Machinery & Plant</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Interest Rate / Month (%)</label>
              <input
                type="number"
                step="0.1"
                value={interestRate}
                onChange={(e) => setInterestRate(Number(e.target.value))}
                className="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Interest Calculation</label>
              <select
                value={interestMethod}
                onChange={(e) => setInterestMethod(e.target.value as any)}
                className="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              >
                <option value="reducing_balance">Reducing Balance (Standard)</option>
                <option value="flat_rate">Flat Rate</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Max LTV (%)</label>
              <input
                type="number"
                value={maxLtv}
                onChange={(e) => setMaxLtv(Number(e.target.value))}
                className="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Processing Fee (%)</label>
              <input
                type="number"
                step="0.1"
                value={procFee}
                onChange={(e) => setProcFee(Number(e.target.value))}
                className="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Max Tenure (Months)</label>
              <input
                type="number"
                value={maxTenure}
                onChange={(e) => setMaxTenure(Number(e.target.value))}
                className="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
            >
              Deploy Loan Product
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
