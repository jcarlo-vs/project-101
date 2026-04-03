import type { Bill, BillCategory } from '@/constants/theme';
import { BillCategoryColors } from '@/constants/theme';

export function getMonthlyBillCost(bill: Bill): number {
  if (bill.frequency === 'quarterly') return bill.amount / 3;
  if (bill.frequency === 'yearly') return bill.amount / 12;
  if (bill.frequency === 'one-time') return 0;
  return bill.amount;
}

export function getTotalMonthlyBills(bills: Bill[]): number {
  return bills.filter((b) => b.active).reduce((sum, b) => sum + getMonthlyBillCost(b), 0);
}

export function getTotalYearlyBills(bills: Bill[]): number {
  return bills.filter((b) => b.active).reduce((sum, b) => {
    if (b.frequency === 'monthly') return sum + b.amount * 12;
    if (b.frequency === 'quarterly') return sum + b.amount * 4;
    if (b.frequency === 'yearly') return sum + b.amount;
    return sum + b.amount; // one-time
  }, 0);
}

export function getNextDueDate(bill: Bill): Date {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const day = Math.min(bill.dueDate, new Date(year, month + 1, 0).getDate());

  let next = new Date(year, month, day);
  if (next.getTime() <= now.getTime()) {
    const nextMonth = month + 1;
    const nextDay = Math.min(bill.dueDate, new Date(year, nextMonth + 1, 0).getDate());
    next = new Date(year, nextMonth, nextDay);
  }
  return next;
}

export function getDaysUntilDue(bill: Bill): number {
  const next = getNextDueDate(bill);
  return Math.ceil((next.getTime() - Date.now()) / 86400000);
}

export function getUpcomingBills(bills: Bill[], withinDays = 7): Bill[] {
  return bills
    .filter((b) => b.active && !b.autoPay)
    .filter((b) => getDaysUntilDue(b) <= withinDays)
    .sort((a, b) => getDaysUntilDue(a) - getDaysUntilDue(b));
}

export interface BillCategoryBreakdown {
  category: BillCategory;
  total: number;
  percentage: number;
  count: number;
  color: string;
}

export function getBillCategoryBreakdown(bills: Bill[]): BillCategoryBreakdown[] {
  const active = bills.filter((b) => b.active);
  const totalMonthly = getTotalMonthlyBills(active);
  if (totalMonthly === 0) return [];

  const map = new Map<BillCategory, { total: number; count: number }>();
  for (const bill of active) {
    const existing = map.get(bill.category) ?? { total: 0, count: 0 };
    existing.total += getMonthlyBillCost(bill);
    existing.count += 1;
    map.set(bill.category, existing);
  }

  return Array.from(map.entries())
    .map(([category, { total, count }]) => ({
      category,
      total,
      percentage: (total / totalMonthly) * 100,
      count,
      color: BillCategoryColors[category],
    }))
    .sort((a, b) => b.total - a.total);
}

export function frequencyLabel(freq: Bill['frequency']): string {
  if (freq === 'monthly') return '/mo';
  if (freq === 'quarterly') return '/qtr';
  if (freq === 'yearly') return '/yr';
  return '';
}
