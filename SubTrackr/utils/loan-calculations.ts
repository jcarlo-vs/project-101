import type { Loan } from '@/constants/theme';

export function getMonthlyInterest(loan: Loan): number {
  return loan.currentBalance * (loan.interestRate / 100 / 12);
}

export function getTotalMonthlyLoanPayments(loans: Loan[]): number {
  return loans.filter((l) => l.active).reduce((sum, l) => sum + l.monthlyPayment, 0);
}

export function getTotalLoanBalance(loans: Loan[]): number {
  return loans.filter((l) => l.active).reduce((sum, l) => sum + l.currentBalance, 0);
}

export function getTotalLoanInterest(loans: Loan[]): number {
  return loans.filter((l) => l.active).reduce((sum, l) => sum + getMonthlyInterest(l), 0);
}

export function getPayoffMonths(loan: Loan): number {
  if (loan.monthlyPayment <= 0 || loan.currentBalance <= 0) return 0;
  const monthlyRate = loan.interestRate / 100 / 12;
  if (monthlyRate === 0) return Math.ceil(loan.currentBalance / loan.monthlyPayment);
  const months = -Math.log(1 - (monthlyRate * loan.currentBalance) / loan.monthlyPayment) / Math.log(1 + monthlyRate);
  return isFinite(months) && months > 0 ? Math.ceil(months) : 0;
}

export function getPayoffDate(loan: Loan): string {
  const months = getPayoffMonths(loan);
  if (months === 0) return 'Paid off';
  const date = new Date();
  date.setMonth(date.getMonth() + months);
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

export function getLoanProgress(loan: Loan): number {
  if (loan.principalAmount <= 0) return 100;
  return Math.max(0, Math.min(100, ((loan.principalAmount - loan.currentBalance) / loan.principalAmount) * 100));
}

export function getNextDueDate(loan: Loan): Date {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const day = Math.min(loan.dueDate, new Date(year, month + 1, 0).getDate());
  let next = new Date(year, month, day);
  if (next.getTime() <= now.getTime()) {
    const nextMonth = month + 1;
    const nextDay = Math.min(loan.dueDate, new Date(year, nextMonth + 1, 0).getDate());
    next = new Date(year, nextMonth, nextDay);
  }
  return next;
}

export function getDaysUntilDue(loan: Loan): number {
  return Math.ceil((getNextDueDate(loan).getTime() - Date.now()) / 86400000);
}

export function getUpcomingLoanPayments(loans: Loan[], withinDays = 7): Loan[] {
  return loans
    .filter((l) => l.active && l.currentBalance > 0)
    .filter((l) => getDaysUntilDue(l) <= withinDays)
    .sort((a, b) => getDaysUntilDue(a) - getDaysUntilDue(b));
}
