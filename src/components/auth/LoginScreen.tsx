/**
 * DAVETECH ERP - Enterprise Login & Sign-In Portal
 * Secure authentication gateway supporting staff roles, branch selection,
 * quick demo user switching, and new account registration.
 */

import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  User,
  KeyRound,
  ArrowRight,
  Building2,
  CheckCircle2,
  Sparkles,
  UserPlus,
  Eye,
  EyeOff,
  Briefcase,
  AlertCircle,
  MessageCircle,
  FileCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types/erp';
import { DataService } from '../../services/dataService';

export const LoginScreen: React.FC = () => {
  const { allUsers, loginAsUser, registerNewUser, systemSettings } = useAuth();
  
  const [selectedUserId, setSelectedUserId] = useState<string>(allUsers[0]?.id || 'USR-001');
  const [password, setPassword] = useState('davetech2026');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);

  // New User Registration Form State
  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regRole, setRegRole] = useState<UserRole>('loan_officer');
  const [regBranchId, setRegBranchId] = useState('BR-001');
  const [regPhone, setRegPhone] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!selectedUserId) {
      setErrorMsg('Please select a user account to sign in.');
      return;
    }
    const success = loginAsUser(selectedUserId, password);
    if (!success) {
      setErrorMsg('Invalid credentials or inactive user account.');
    }
  };

  const handleQuickLogin = (userId: string) => {
    setSelectedUserId(userId);
    loginAsUser(userId, 'davetech2026');
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regFullName.trim() || !regEmail.trim()) {
      alert('Please fill in required fields.');
      return;
    }
    try {
      const newUser = DataService.registerUser({
        fullName: regFullName,
        email: regEmail,
        role: regRole,
        branchId: regBranchId,
        phone: regPhone || '+254 700 000 000',
        status: 'active',
      });
      setIsRegisterOpen(false);
      loginAsUser(newUser.id, 'davetech2026');
    } catch (err: any) {
      alert(err?.message || 'Registration failed');
    }
  };

  const roleColors: Record<UserRole, string> = {
    super_admin: 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-emerald-300',
    administrator: 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border-blue-300',
    branch_manager: 'bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 border-indigo-300',
    loan_officer: 'bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 border-purple-300',
    credit_officer: 'bg-violet-100 dark:bg-violet-950 text-violet-800 dark:text-violet-300 border-violet-300',
    valuation_officer: 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border-amber-300',
    asset_officer: 'bg-orange-100 dark:bg-orange-950 text-orange-800 dark:text-orange-300 border-orange-300',
    cashier: 'bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 border-teal-300',
    accountant: 'bg-cyan-100 dark:bg-cyan-950 text-cyan-800 dark:text-cyan-300 border-cyan-300',
    recovery_officer: 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border-rose-300',
    custody_officer: 'bg-pink-100 dark:bg-pink-950 text-pink-800 dark:text-pink-300 border-pink-300',
    auditor: 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-300 border-slate-300',
    customer: 'bg-emerald-50 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 border-emerald-200',
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Background Decorative Gradient Orbs */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-teal-600/20 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-slate-800/90 backdrop-blur-xl border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden relative z-10 p-8">
        {/* Header Branding */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 mx-auto flex items-center justify-center text-white font-extrabold text-2xl shadow-lg mb-4">
            {systemSettings?.logoUrl && systemSettings?.logoType === 'image' ? (
              <img
                src={systemSettings.logoUrl}
                alt={systemSettings.platformName || 'DAVETECH'}
                className="w-full h-full object-contain p-2"
              />
            ) : (
              systemSettings?.platformInitials || 'DT'
            )}
          </div>
          <h1 className="text-xl font-extrabold text-white tracking-tight">
            {systemSettings?.platformName || 'DAVETECH'} <span className="text-emerald-400">{systemSettings?.platformTitle || 'ERP'}</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Enterprise Secured Lending, Collateral & Real Estate Portal
          </p>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Select User Account / Staff Profile
            </label>
            <div className="relative">
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-3 text-sm text-slate-100 outline-none focus:border-emerald-500 transition appearance-none"
              >
                {allUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.fullName} — {u.role.replace('_', ' ').toUpperCase()} ({u.employeeNumber || u.email})
                  </option>
                ))}
              </select>
              <User className="absolute right-3.5 top-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Secure PIN / Password
            </label>
            <div className="relative flex items-center">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password (default: davetech2026)"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-3.5 pr-10 py-3 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-emerald-500 transition font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 text-slate-400 hover:text-slate-200"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg transition flex items-center justify-center gap-2 text-sm mt-2"
          >
            <span>Sign In to ERP Workspace</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Quick Demo Role Selectors */}
        <div className="mt-6 pt-6 border-t border-slate-700/80">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2.5">
            Quick Demo Staff Sign-In:
          </p>
          <div className="grid grid-cols-2 gap-2">
            {allUsers.slice(0, 4).map((u) => (
              <button
                key={u.id}
                onClick={() => handleQuickLogin(u.id)}
                className="p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-900 border border-slate-700/80 text-left transition group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200 group-hover:text-emerald-400 truncate">
                    {u.fullName.split(' ')[0]}
                  </span>
                  <span className="text-[9px] font-mono px-1 py-0.5 rounded bg-slate-800 text-slate-400">
                    {u.role.substring(0, 5)}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 capitalize mt-0.5 truncate">
                  {u.role.replace('_', ' ')}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Public WhatsApp Online Application & Agreement Links */}
        <div className="mt-5 pt-5 border-t border-slate-700/60 text-center space-y-2">
          <a
            href="#apply"
            onClick={() => {
              window.location.hash = '#apply';
            }}
            className="w-full py-2.5 px-3 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 rounded-xl text-xs font-bold text-emerald-300 flex items-center justify-center gap-2 transition"
          >
            <MessageCircle className="w-4 h-4 text-emerald-400" />
            <span>Apply for Loan Online (Client WhatsApp Form)</span>
          </a>

          <a
            href="#agreement"
            onClick={() => {
              window.location.hash = '#agreement';
            }}
            className="w-full py-2.5 px-3 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 rounded-xl text-xs font-bold text-indigo-300 flex items-center justify-center gap-2 transition"
          >
            <FileCheck className="w-4 h-4 text-indigo-400" />
            <span>Client Agreement Portal (Digital e-Signature)</span>
          </a>
        </div>

        {/* Register New Account Link */}
        <div className="mt-4 text-center">
          <button
            onClick={() => setIsRegisterOpen(true)}
            className="text-xs text-slate-400 hover:text-emerald-400 hover:underline font-semibold inline-flex items-center gap-1.5 transition"
          >
            <UserPlus className="w-3.5 h-3.5" /> Register New Staff or Customer Account
          </button>
        </div>
      </div>

      {/* Register Modal */}
      {isRegisterOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-800 border border-slate-700 rounded-3xl p-6 shadow-2xl text-slate-100">
            <div className="flex items-center justify-between mb-4 border-b border-slate-700 pb-3">
              <h3 className="text-base font-bold flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-emerald-400" /> Register New Account
              </h3>
              <button
                onClick={() => setIsRegisterOpen(false)}
                className="text-slate-400 hover:text-slate-200 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRegisterSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={regFullName}
                  onChange={(e) => setRegFullName(e.target.value)}
                  placeholder="e.g. Dr. Jane Omondi"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-slate-100 outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="jane@davetech.co.ke"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-slate-100 outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Assigned Role</label>
                  <select
                    value={regRole}
                    onChange={(e) => setRegRole(e.target.value as UserRole)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-slate-100 outline-none focus:border-emerald-500 capitalize"
                  >
                    <option value="loan_officer">Loan Officer</option>
                    <option value="branch_manager">Branch Manager</option>
                    <option value="cashier">Cashier</option>
                    <option value="accountant">Accountant</option>
                    <option value="recovery_officer">Recovery Officer</option>
                    <option value="customer">Customer Portal</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    placeholder="+254 712..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-slate-100 outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsRegisterOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-700 text-slate-300 hover:bg-slate-600 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition shadow-md"
                >
                  Create Account & Sign In
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
