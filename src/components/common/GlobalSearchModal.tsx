/**
 * DAVETECH ERP - Global Quick Search Modal
 * Searches vehicles, properties, loans, customers, collaterals and receipts across the system.
 */

import React, { useState, useEffect } from 'react';
import { Search, X, Users, Car, FileSpreadsheet, ShieldCheck, ArrowRight, Building2 } from 'lucide-react';
import { DataService } from '../../services/dataService';
import { Customer, Asset, Loan, Collateral, PropertyListing } from '../../types/erp';
import { LoanEngine } from '../../services/loanEngine';
import { ActiveView } from '../layout/Sidebar';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (view: ActiveView, id?: string) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<{
    customers: Customer[];
    assets: Asset[];
    loans: Loan[];
    collaterals: Collateral[];
    properties?: PropertyListing[];
  }>({ customers: [], assets: [], loans: [], collaterals: [], properties: [] });

  useEffect(() => {
    if (searchTerm.trim().length >= 2) {
      setResults(DataService.searchGlobal(searchTerm));
    } else {
      setResults({ customers: [], assets: [], loans: [], collaterals: [], properties: [] });
    }
  }, [searchTerm]);

  if (!isOpen) return null;

  const totalHits =
    results.customers.length +
    results.assets.length +
    results.loans.length +
    results.collaterals.length +
    (results.properties?.length || 0);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-start justify-center p-4 pt-16">
      <div className="w-full max-w-2xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Search Input Bar */}
        <div className="relative flex items-center border-b border-slate-200 dark:border-slate-800 px-4 py-3.5">
          <Search className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mr-3" />
          <input
            type="text"
            placeholder="Type registration (e.g. KCA 123A), loan no, customer ID, title LR..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            autoFocus
            className="w-full bg-transparent text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 outline-none"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="ml-2 text-xs font-mono px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-md"
          >
            ESC
          </button>
        </div>

        {/* Quick Suggestion Pills */}
        <div className="px-4 py-2 bg-slate-50 dark:bg-slate-950/50 border-b border-slate-100 dark:border-slate-800/80 flex items-center gap-2 overflow-x-auto text-[11px] text-slate-500">
          <span className="font-semibold text-slate-400 shrink-0">Try searching:</span>
          {['KCA 123A', 'LOG-2026-000001', 'COL-2026-000145', 'John Kamau', '28475910', 'Kiambu'].map(
            (term) => (
              <button
                key={term}
                onClick={() => setSearchTerm(term)}
                className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition shrink-0"
              >
                {term}
              </button>
            )
          )}
        </div>

        {/* Results Container */}
        <div className="max-h-[60vh] overflow-y-auto p-4 space-y-4">
          {searchTerm.length >= 2 && totalHits === 0 && (
            <div className="text-center py-10 text-slate-400 text-xs">
              No matching records found for "{searchTerm}".
            </div>
          )}

          {/* Customers */}
          {results.customers.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                <Users className="w-3.5 h-3.5 text-blue-500" />
                <span>Borrowers / Customers ({results.customers.length})</span>
              </div>
              <div className="space-y-1">
                {results.customers.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      onClose();
                      onNavigate('customers', c.id);
                    }}
                    className="w-full text-left p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/80 flex items-center justify-between border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition"
                  >
                    <div>
                      <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                        {c.fullName}{' '}
                        <span className="text-[10px] text-slate-400 font-mono">({c.customerNumber})</span>
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Phone: {c.phone} • ID: {c.idNumber} • PIN: {c.kraPin}
                      </p>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Assets & Vehicles */}
          {results.assets.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                <Car className="w-3.5 h-3.5 text-emerald-500" />
                <span>Pledged Assets & Vehicles ({results.assets.length})</span>
              </div>
              <div className="space-y-1">
                {results.assets.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => {
                      onClose();
                      onNavigate('assets', a.id);
                    }}
                    className="w-full text-left p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/80 flex items-center justify-between border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                          {a.titleOrName}
                        </span>
                        {a.vehicleDetails?.registrationNumber && (
                          <span className="px-1.5 py-0.5 bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-mono font-bold text-[10px] rounded-sm">
                            {a.vehicleDetails.registrationNumber}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Owner: {a.ownerName} • Market Value: {LoanEngine.formatKES(a.marketValue)} • Status: {a.status}
                      </p>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Loans */}
          {results.loans.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                <FileSpreadsheet className="w-3.5 h-3.5 text-purple-500" />
                <span>Loans Portfolio ({results.loans.length})</span>
              </div>
              <div className="space-y-1">
                {results.loans.map((l) => (
                  <button
                    key={l.id}
                    onClick={() => {
                      onClose();
                      onNavigate('loans', l.id);
                    }}
                    className="w-full text-left p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/80 flex items-center justify-between border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition"
                  >
                    <div>
                      <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                        {l.loanNumber}{' '}
                        <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 ml-1">
                          {l.status}
                        </span>
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Principal: {LoanEngine.formatKES(l.principal)} • Outstanding: {LoanEngine.formatKES(l.totalOutstanding)} • Customer: {l.customerId}
                      </p>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Collateral */}
          {results.collaterals.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                <ShieldCheck className="w-3.5 h-3.5 text-teal-500" />
                <span>Collateral Register ({results.collaterals.length})</span>
              </div>
              <div className="space-y-1">
                {results.collaterals.map((col) => (
                  <button
                    key={col.id}
                    onClick={() => {
                      onClose();
                      onNavigate('collateral', col.id);
                    }}
                    className="w-full text-left p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/80 flex items-center justify-between border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition"
                  >
                    <div>
                      <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                        {col.id} — {col.description}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Custodian: {col.custodian} • Vault: {col.storageLocation} • LTV: {col.loanToValuePct}%
                      </p>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Real Estate, Land Plots & House Rentals */}
          {results.properties && results.properties.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                <Building2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>Real Estate, Land Plots & Rentals ({results.properties.length})</span>
              </div>
              <div className="space-y-1">
                {results.properties.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      onClose();
                      onNavigate(p.category === 'sale' ? 'land_plots' : 'house_rentals', p.id);
                    }}
                    className="w-full text-left p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/80 flex items-center justify-between border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                          {p.title}
                        </span>
                        <span className="px-1.5 py-0.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold text-[10px] rounded-sm">
                          {p.category === 'sale' ? 'Land / Plot' : 'Rental'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        {p.location}, {p.county} • Price: {LoanEngine.formatKES(p.price)} {p.category === 'rent' ? '/mo' : ''} • Size: {p.size}
                      </p>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
