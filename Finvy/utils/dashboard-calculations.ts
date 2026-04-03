import type { Subscription, CreditCard, Bill, Loan } from '@/constants/theme';
import { getTotalMonthlyCost } from './calculations';
import { getTotalMinimumPayments, getTotalBalance } from './credit-card-calculations';
import { getTotalMonthlyBills } from './bill-calculations';
import { getTotalMonthlyLoanPayments, getTotalLoanBalance } from './loan-calculations';

export function getTotalMonthlyObligations(subs: Subscription[], cards: CreditCard[], bills: Bill[], loans: Loan[]): number {
  return getTotalMonthlyCost(subs) + getTotalMinimumPayments(cards) + getTotalMonthlyBills(bills) + getTotalMonthlyLoanPayments(loans);
}

export function getTotalDebt(cards: CreditCard[], loans: Loan[]): number {
  return getTotalBalance(cards) + getTotalLoanBalance(loans);
}
