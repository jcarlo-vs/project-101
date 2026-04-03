import type { Expense, IncomeSource, ExpenseCategory, Subscription, CreditCard, Bill, Loan } from '@/constants/theme';
import { getTotalMonthlyCost } from './calculations';
import { getTotalMinimumPayments } from './credit-card-calculations';
import { getTotalMonthlyBills, getMonthlyBillCost } from './bill-calculations';
import { getTotalMonthlyLoanPayments } from './loan-calculations';

function getCurrentMonthStart(): string {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
}

export function getThisMonthExpenses(expenses: Expense[]): Expense[] {
  const start = getCurrentMonthStart();
  return expenses.filter((e) => e.date >= start);
}

export function getTotalExpensesThisMonth(expenses: Expense[]): number {
  return getThisMonthExpenses(expenses).reduce((sum, e) => sum + e.amount, 0);
}

export interface CategorySpending {
  category: ExpenseCategory;
  spent: number;
  limit: number;
  percentage: number;
  overBudget: boolean;
}

// Derives budget limits from bills with trackSpending=true
export function getCategorySpending(expenses: Expense[], bills: Bill[]): CategorySpending[] {
  const thisMonth = getThisMonthExpenses(expenses);
  const spendingMap = new Map<ExpenseCategory, number>();

  for (const e of thisMonth) {
    spendingMap.set(e.category, (spendingMap.get(e.category) ?? 0) + e.amount);
  }

  const result: CategorySpending[] = [];

  // Budget categories from bills with trackSpending=true
  const budgetBills = bills.filter((b) => b.active && b.trackSpending);
  for (const bill of budgetBills) {
    const cat = bill.category as ExpenseCategory;
    const spent = spendingMap.get(cat) ?? 0;
    const limit = getMonthlyBillCost(bill);
    result.push({
      category: cat,
      spent,
      limit,
      percentage: limit > 0 ? (spent / limit) * 100 : 0,
      overBudget: spent > limit,
    });
    spendingMap.delete(cat);
  }

  // Unbudgeted categories with spending
  for (const [category, spent] of spendingMap) {
    result.push({
      category,
      spent,
      limit: 0,
      percentage: 0,
      overBudget: false,
    });
  }

  return result.sort((a, b) => b.spent - a.spent);
}

export function getTotalBudgetLimit(bills: Bill[]): number {
  return bills
    .filter((b) => b.active && b.trackSpending)
    .reduce((sum, b) => sum + getMonthlyBillCost(b), 0);
}

export function getMonthlyIncome(sources: IncomeSource[]): number {
  return sources.filter((s) => s.active).reduce((sum, s) => {
    if (s.frequency === 'yearly') return sum + s.amount / 12;
    if (s.frequency === 'one-time') return sum;
    return sum + s.amount;
  }, 0);
}

export function getFixedMonthlyOutflow(subs: Subscription[], cards: CreditCard[], bills: Bill[], loans: Loan[]): number {
  const fixedBills = bills.filter((b) => !b.trackSpending);
  return getTotalMonthlyCost(subs) + getTotalMinimumPayments(cards) + getTotalMonthlyBills(fixedBills) + getTotalMonthlyLoanPayments(loans);
}

export function getDisposableIncome(
  income: number,
  fixedOutflow: number,
  variableSpending: number,
): number {
  return income - fixedOutflow - variableSpending;
}

export function getSavingsRate(income: number, totalSpending: number): number {
  if (income <= 0) return 0;
  return Math.max(0, ((income - totalSpending) / income) * 100);
}

export function getExpensesByDate(expenses: Expense[]): Map<string, Expense[]> {
  const map = new Map<string, Expense[]>();
  for (const e of getThisMonthExpenses(expenses)) {
    const existing = map.get(e.date) ?? [];
    existing.push(e);
    map.set(e.date, existing);
  }
  return new Map([...map].sort((a, b) => b[0].localeCompare(a[0])));
}

export function formatDateLabel(dateStr: string): string {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (dateStr === today.toISOString().split('T')[0]) return 'Today';
  if (dateStr === yesterday.toISOString().split('T')[0]) return 'Yesterday';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
