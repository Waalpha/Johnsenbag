/**
 * DAVETECH ERP - Central Loan Calculation & Business Engine
 * Deterministic financial calculations, repayment schedules,
 * allocation waterfall, arrears aging buckets, and LTV validations.
 */

import {
  InterestMethod,
  RepaymentFrequency,
  InstallmentScheduleItem,
  Repayment,
} from '../types/erp';

export interface LoanCalculationInput {
  principal: number;
  interestRatePerMonth: number; // e.g. 3.5 for 3.5% per month
  durationMonths: number;
  interestMethod: InterestMethod;
  repaymentFrequency: RepaymentFrequency;
  processingFeePct: number;
  insuranceFeePct: number;
  startDate?: Date;
}

export interface LoanCalculationResult {
  principal: number;
  totalInterest: number;
  processingFee: number;
  insuranceFee: number;
  totalFees: number;
  totalPayable: number;
  installmentAmount: number;
  numberOfInstallments: number;
  schedule: InstallmentScheduleItem[];
}

export class LoanEngine {
  /**
   * Formats an amount as Kenyan Shillings
   * e.g. KSh 1,250,000.00
   */
  static formatKES(amount: number | undefined | null, includeSymbol = true): string {
    const val = typeof amount === 'number' && !isNaN(amount) ? amount : 0;
    const formatted = new Intl.NumberFormat('en-KE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(val);
    return includeSymbol ? `KSh ${formatted}` : formatted;
  }

  /**
   * Calculate total loan details and installment schedule
   */
  static calculateLoan(input: LoanCalculationInput): LoanCalculationResult {
    const principal = Math.max(0, input.principal);
    const monthlyRate = Math.max(0, input.interestRatePerMonth) / 100;
    const durationMonths = Math.max(1, input.durationMonths);

    // Repayment multiplier
    let installmentsPerMonth = 1;
    if (input.repaymentFrequency === 'weekly') installmentsPerMonth = 4;
    else if (input.repaymentFrequency === 'bi_weekly') installmentsPerMonth = 2;

    const numberOfInstallments = durationMonths * installmentsPerMonth;
    const ratePerInstallment = monthlyRate / installmentsPerMonth;

    // Fees
    const processingFee = Math.round(principal * (input.processingFeePct / 100));
    const insuranceFee = Math.round(principal * (input.insuranceFeePct / 100));
    const totalFees = processingFee + insuranceFee;

    let totalInterest = 0;
    let installmentAmount = 0;
    const schedule: InstallmentScheduleItem[] = [];

    const baseDate = input.startDate ? new Date(input.startDate) : new Date();

    if (input.interestMethod === 'flat_rate' || input.interestMethod === 'simple_interest') {
      // Flat Rate: Total Interest = Principal * MonthlyRate * DurationMonths
      totalInterest = Math.round(principal * monthlyRate * durationMonths);
      const totalPayable = principal + totalInterest;
      installmentAmount = Math.round(totalPayable / numberOfInstallments);

      let balance = principal;
      const principalPerInstallment = Math.round(principal / numberOfInstallments);
      const interestPerInstallment = Math.round(totalInterest / numberOfInstallments);

      for (let i = 1; i <= numberOfInstallments; i++) {
        const dueDate = new Date(baseDate);
        if (input.repaymentFrequency === 'weekly') {
          dueDate.setDate(baseDate.getDate() + i * 7);
        } else if (input.repaymentFrequency === 'bi_weekly') {
          dueDate.setDate(baseDate.getDate() + i * 14);
        } else {
          dueDate.setMonth(baseDate.getMonth() + i);
        }

        const isLast = i === numberOfInstallments;
        const princ = isLast ? balance : Math.min(balance, principalPerInstallment);
        balance = Math.max(0, balance - princ);

        schedule.push({
          installmentNumber: i,
          dueDate: dueDate.toISOString().split('T')[0],
          principalDue: princ,
          interestDue: interestPerInstallment,
          feesDue: i === 1 ? totalFees : 0,
          totalInstallment: princ + interestPerInstallment + (i === 1 ? totalFees : 0),
          principalPaid: 0,
          interestPaid: 0,
          feesPaid: 0,
          penaltiesPaid: 0,
          totalPaid: 0,
          outstandingBalance: balance,
          status: 'pending',
          daysOverdue: 0,
        });
      }

      return {
        principal,
        totalInterest,
        processingFee,
        insuranceFee,
        totalFees,
        totalPayable: totalPayable + totalFees,
        installmentAmount,
        numberOfInstallments,
        schedule,
      };
    } else {
      // Reducing Balance / Amortized formula:
      // PMT = [P * r * (1+r)^n] / [(1+r)^n - 1]
      let pmt = 0;
      if (ratePerInstallment > 0) {
        const factor = Math.pow(1 + ratePerInstallment, numberOfInstallments);
        pmt = Math.round((principal * ratePerInstallment * factor) / (factor - 1));
      } else {
        pmt = Math.round(principal / numberOfInstallments);
      }

      installmentAmount = pmt;
      let balance = principal;

      for (let i = 1; i <= numberOfInstallments; i++) {
        const dueDate = new Date(baseDate);
        if (input.repaymentFrequency === 'weekly') {
          dueDate.setDate(baseDate.getDate() + i * 7);
        } else if (input.repaymentFrequency === 'bi_weekly') {
          dueDate.setDate(baseDate.getDate() + i * 14);
        } else {
          dueDate.setMonth(baseDate.getMonth() + i);
        }

        const interestDue = Math.round(balance * ratePerInstallment);
        totalInterest += interestDue;
        const isLast = i === numberOfInstallments;
        let principalDue = isLast ? balance : Math.round(pmt - interestDue);
        if (principalDue > balance) principalDue = balance;
        balance = Math.max(0, balance - principalDue);

        schedule.push({
          installmentNumber: i,
          dueDate: dueDate.toISOString().split('T')[0],
          principalDue,
          interestDue,
          feesDue: i === 1 ? totalFees : 0,
          totalInstallment: principalDue + interestDue + (i === 1 ? totalFees : 0),
          principalPaid: 0,
          interestPaid: 0,
          feesPaid: 0,
          penaltiesPaid: 0,
          totalPaid: 0,
          outstandingBalance: balance,
          status: 'pending',
          daysOverdue: 0,
        });
      }

      return {
        principal,
        totalInterest,
        processingFee,
        insuranceFee,
        totalFees,
        totalPayable: principal + totalInterest + totalFees,
        installmentAmount,
        numberOfInstallments,
        schedule,
      };
    }
  }

  /**
   * Waterfalls an incoming repayment amount according to allocation order
   * Default order: 1. Penalties -> 2. Fees -> 3. Interest -> 4. Principal
   */
  static allocatePayment(
    paymentAmount: number,
    outstanding: {
      penalties: number;
      fees: number;
      interest: number;
      principal: number;
    },
    order: ('penalties' | 'fees' | 'interest' | 'principal')[] = ['penalties', 'fees', 'interest', 'principal']
  ): {
    penaltyAllocation: number;
    feesAllocation: number;
    interestAllocation: number;
    principalAllocation: number;
    penaltyPaid: number;
    feesPaid: number;
    interestPaid: number;
    principalPaid: number;
    penalties: number;
    fees: number;
    interest: number;
    principal: number;
    unallocated: number;
  } {
    let remaining = Math.max(0, paymentAmount);
    const allocation = {
      penalties: 0,
      fees: 0,
      interest: 0,
      principal: 0,
    };

    for (const bucket of order) {
      if (remaining <= 0) break;
      const due = Math.max(0, outstanding[bucket]);
      const pay = Math.min(remaining, due);
      allocation[bucket] += pay;
      remaining -= pay;
    }

    // If there's still money left, allocate towards remaining principal
    if (remaining > 0) {
      allocation.principal += remaining;
      remaining = 0;
    }

    return {
      penaltyAllocation: allocation.penalties,
      feesAllocation: allocation.fees,
      interestAllocation: allocation.interest,
      principalAllocation: allocation.principal,
      penaltyPaid: allocation.penalties,
      feesPaid: allocation.fees,
      interestPaid: allocation.interest,
      principalPaid: allocation.principal,
      penalties: allocation.penalties,
      fees: allocation.fees,
      interest: allocation.interest,
      principal: allocation.principal,
      unallocated: remaining,
    };
  }

  /**
   * Classify arrears days into standard aging buckets
   */
  static getAgingBucket(daysOverdue: number): {
    bucket: 'Current (0)' | '1-7 Days' | '8-30 Days' | '31-60 Days' | '61-90 Days' | '91-180 Days' | '180+ Days';
    riskClass: 'low' | 'medium' | 'high' | 'very_high';
  } {
    if (daysOverdue <= 0) return { bucket: 'Current (0)', riskClass: 'low' };
    if (daysOverdue <= 7) return { bucket: '1-7 Days', riskClass: 'low' };
    if (daysOverdue <= 30) return { bucket: '8-30 Days', riskClass: 'medium' };
    if (daysOverdue <= 60) return { bucket: '31-60 Days', riskClass: 'high' };
    if (daysOverdue <= 90) return { bucket: '61-90 Days', riskClass: 'high' };
    if (daysOverdue <= 180) return { bucket: '91-180 Days', riskClass: 'very_high' };
    return { bucket: '180+ Days', riskClass: 'very_high' };
  }

  /**
   * Calculate LTV (Loan to Value) percentage
   */
  static calculateLTV(loanAmount: number, collateralMarketValue: number): number {
    if (!collateralMarketValue || collateralMarketValue <= 0) return 100;
    return Math.round((loanAmount / collateralMarketValue) * 100);
  }

  /**
   * Verify whether an asset's valuation satisfies the product's max LTV
   */
  static validateCollateralEligibility(
    loanAmount: number,
    collateralForcedSaleValue: number,
    maxLtvPct: number = 70
  ): {
    eligible: boolean;
    maxEligibleLoan: number;
    currentLtv: number;
    message: string;
  } {
    const maxLoan = Math.round(collateralForcedSaleValue * (maxLtvPct / 100));
    const currentLtv = Math.round((loanAmount / collateralForcedSaleValue) * 100);

    if (loanAmount <= maxLoan) {
      return {
        eligible: true,
        maxEligibleLoan: maxLoan,
        currentLtv,
        message: `Collateral is eligible. Current LTV is ${currentLtv}% (Max allowed: ${maxLtvPct}%).`,
      };
    } else {
      return {
        eligible: false,
        maxEligibleLoan: maxLoan,
        currentLtv,
        message: `Requested loan exceeds maximum collateral capacity! Maximum loan based on ${maxLtvPct}% LTV is ${this.formatKES(maxLoan)}.`,
      };
    }
  }

  /**
   * Calculate Debt-Service-Ratio (DSR)
   */
  static calculateDSR(
    monthlyNetIncome: number,
    proposedMonthlyInstallment: number,
    existingMonthlyLiabilities: number
  ): {
    dsrPct: number;
    riskRating: 'low' | 'medium' | 'high' | 'very_high';
    isAcceptable: boolean;
  } {
    if (monthlyNetIncome <= 0) {
      return { dsrPct: 100, riskRating: 'very_high', isAcceptable: false };
    }
    const totalObligations = proposedMonthlyInstallment + existingMonthlyLiabilities;
    const dsrPct = Math.round((totalObligations / monthlyNetIncome) * 100);

    let riskRating: 'low' | 'medium' | 'high' | 'very_high' = 'low';
    let isAcceptable = true;

    if (dsrPct <= 40) {
      riskRating = 'low';
      isAcceptable = true;
    } else if (dsrPct <= 55) {
      riskRating = 'medium';
      isAcceptable = true;
    } else if (dsrPct <= 65) {
      riskRating = 'high';
      isAcceptable = false;
    } else {
      riskRating = 'very_high';
      isAcceptable = false;
    }

    return { dsrPct, riskRating, isAcceptable };
  }

  /**
   * Helper alias for calculateSchedule
   */
  static calculateSchedule(
    principal: number,
    interestRatePerMonth: number,
    durationMonths: number,
    interestMethod: InterestMethod = 'reducing_balance',
    repaymentFrequency: RepaymentFrequency = 'monthly'
  ): InstallmentScheduleItem[] {
    const res = this.calculateLoan({
      principal,
      interestRatePerMonth,
      durationMonths,
      interestMethod,
      repaymentFrequency,
      processingFeePct: 0,
      insuranceFeePct: 0,
    });
    return res.schedule;
  }

  /**
   * Helper alias for allocatePayment
   */
  static allocateRepayment(
    paymentAmount: number | string,
    balances: any,
    order?: ('penalties' | 'fees' | 'interest' | 'principal')[]
  ) {
    const numAmount = Number(paymentAmount) || 0;
    const normBalances = {
      penalties: Number(balances.penalties ?? balances.outstandingPenalties) || 0,
      fees: Number(balances.fees ?? balances.outstandingFees) || 0,
      interest: Number(balances.interest ?? balances.outstandingInterest) || 0,
      principal: Number(balances.principal ?? balances.outstandingPrincipal) || 0,
    };
    return this.allocatePayment(numAmount, normBalances, order);
  }
}
