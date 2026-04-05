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

export interface MissedPayment {
  monthLabel: string;  // e.g. "Mar 2026"
  dueDate: Date;
}

/**
 * Returns months where a due date passed but no payment was recorded.
 * Compares expected monthly due dates (from startDate to today) against actual payments.
 * Capped at 6 most recent missed months.
 */
export function getMissedPayments(loan: Loan): MissedPayment[] {
  if (!loan.active || loan.currentBalance <= 0 || loan.monthlyPayment <= 0) return [];

  const now = new Date();
  const start = new Date(loan.startDate);
  const missed: MissedPayment[] = [];

  // Start from the first due date on or after the loan start
  let year = start.getFullYear();
  let month = start.getMonth();
  const day = loan.dueDate;

  // If due date is before the start date in the starting month, begin next month
  const daysInStartMonth = new Date(year, month + 1, 0).getDate();
  const startDay = Math.min(day, daysInStartMonth);
  const firstDue = new Date(year, month, startDay);
  if (firstDue < start) {
    month += 1;
  }

  // Walk through each expected due date
  for (let i = 0; i < 120; i++) { // safety cap at 10 years
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const dueDay = Math.min(day, daysInMonth);
    const dueDate = new Date(year, month, dueDay);

    if (dueDate > now) break; // haven't reached this due date yet

    // Check if any payment was recorded in this calendar month
    const hasPaid = loan.payments.some((p) => {
      const pd = new Date(p.date);
      return pd.getFullYear() === dueDate.getFullYear() && pd.getMonth() === dueDate.getMonth();
    });

    if (!hasPaid) {
      missed.push({
        monthLabel: dueDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        dueDate,
      });
    }

    month += 1;
    if (month > 11) { month = 0; year += 1; }
  }

  // Return most recent missed, capped at 6
  return missed.slice(-6);
}

export interface PayableMonth {
  monthLabel: string;  // e.g. "Apr 2026"
  dueDate: Date;
  isCurrent: boolean;  // true = this month (not yet past due), false = future month
}

/**
 * Returns the current month (if due date hasn't passed and not yet paid) plus
 * the next few future months available for advance payment.
 * Excludes months that already have a recorded payment.
 */
export function getPayableMonths(loan: Loan, count = 3): PayableMonth[] {
  if (!loan.active || loan.currentBalance <= 0 || loan.monthlyPayment <= 0) return [];

  const now = new Date();
  const day = loan.dueDate;
  const result: PayableMonth[] = [];

  // Start from current month
  let year = now.getFullYear();
  let month = now.getMonth();

  for (let i = 0; i < count + 3 && result.length < count; i++) {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const dueDay = Math.min(day, daysInMonth);
    const dueDate = new Date(year, month, dueDay);

    // Skip months whose due date has already passed (those are handled by getMissedPayments)
    if (dueDate <= now) {
      month += 1;
      if (month > 11) { month = 0; year += 1; }
      continue;
    }

    // Check if already paid for this month
    const alreadyPaid = loan.payments.some((p) => {
      const pd = new Date(p.date);
      return pd.getFullYear() === dueDate.getFullYear() && pd.getMonth() === dueDate.getMonth();
    });

    if (!alreadyPaid) {
      const isCurrent = dueDate.getMonth() === now.getMonth() && dueDate.getFullYear() === now.getFullYear();
      result.push({
        monthLabel: dueDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        dueDate,
        isCurrent,
      });
    }

    month += 1;
    if (month > 11) { month = 0; year += 1; }
  }

  return result;
}

export function getTotalMissedPayments(loans: Loan[]): number {
  return loans.filter((l) => l.active).reduce((sum, l) => sum + getMissedPayments(l).length, 0);
}

export function getUpcomingLoanPayments(loans: Loan[], withinDays = 7): Loan[] {
  return loans
    .filter((l) => l.active && l.currentBalance > 0)
    .filter((l) => getDaysUntilDue(l) <= withinDays)
    .sort((a, b) => getDaysUntilDue(a) - getDaysUntilDue(b));
}
