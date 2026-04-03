import type { Subscription, CategoryType } from '@/constants/theme';
import { CategoryColors } from '@/constants/theme';

export function getMonthlyCost(sub: Subscription): number {
  if (sub.cycle === 'yearly') return sub.cost / 12;
  if (sub.cycle === 'weekly') return sub.cost * (52 / 12);
  return sub.cost;
}

export function getYearlyCost(sub: Subscription): number {
  if (sub.cycle === 'monthly') return sub.cost * 12;
  if (sub.cycle === 'weekly') return sub.cost * 52;
  return sub.cost;
}

export function getTotalMonthlyCost(subs: Subscription[]): number {
  return subs.filter((s) => s.active).reduce((sum, s) => sum + getMonthlyCost(s), 0);
}

export function getTotalYearlyCost(subs: Subscription[]): number {
  return subs.filter((s) => s.active).reduce((sum, s) => sum + getYearlyCost(s), 0);
}

export function daysSinceUsed(lastUsed: string): number {
  return Math.floor((Date.now() - new Date(lastUsed).getTime()) / 86400000);
}

export function formatCurrency(amount: number, symbol = '$', compact = false): string {
  if (compact || amount >= 100_000) {
    if (amount >= 1_000_000) return `${symbol}${(amount / 1_000_000).toFixed(1)}M`;
    if (amount >= 100_000) return `${symbol}${(amount / 1_000).toFixed(0)}K`;
  }
  if (amount >= 10_000) return `${symbol}${(amount / 1_000).toFixed(1)}K`;
  return `${symbol}${amount.toFixed(2)}`;
}

export function cycleLabel(cycle: Subscription['cycle']): string {
  if (cycle === 'monthly') return '/mo';
  if (cycle === 'yearly') return '/yr';
  return '/wk';
}

export interface CategoryBreakdown {
  category: CategoryType;
  total: number;
  percentage: number;
  count: number;
  color: string;
}

export function getCategoryBreakdown(subs: Subscription[]): CategoryBreakdown[] {
  const active = subs.filter((s) => s.active);
  const totalMonthly = getTotalMonthlyCost(active);
  if (totalMonthly === 0) return [];

  const map = new Map<CategoryType, { total: number; count: number }>();
  for (const sub of active) {
    const existing = map.get(sub.category) ?? { total: 0, count: 0 };
    existing.total += getMonthlyCost(sub);
    existing.count += 1;
    map.set(sub.category, existing);
  }

  return Array.from(map.entries())
    .map(([category, { total, count }]) => ({
      category,
      total,
      percentage: (total / totalMonthly) * 100,
      count,
      color: CategoryColors[category],
    }))
    .sort((a, b) => b.total - a.total);
}

export function getMostExpensive(subs: Subscription[], limit = 4): Subscription[] {
  return subs
    .filter((s) => s.active)
    .sort((a, b) => getMonthlyCost(b) - getMonthlyCost(a))
    .slice(0, limit);
}

export interface CancelSuggestion {
  subscription: Subscription;
  score: number;
  reasons: string[];
}

export function getCancelSuggestions(subs: Subscription[], symbol = '$'): CancelSuggestion[] {
  const results: CancelSuggestion[] = [];

  for (const sub of subs.filter((s) => s.active)) {
    let score = 0;
    const reasons: string[] = [];
    const days = daysSinceUsed(sub.lastUsed);
    const monthly = getMonthlyCost(sub);

    if (days > 60) {
      score += 40;
      reasons.push(`Not used in ${days} days`);
    } else if (days > 30) {
      score += 20;
      reasons.push(`Last used ${days} days ago`);
    }

    if (monthly > 30) {
      score += 30;
      reasons.push(`High cost: ${formatCurrency(monthly, symbol)}/mo`);
    } else if (monthly > 15) {
      score += 15;
      reasons.push(`Moderate cost: ${formatCurrency(monthly, symbol)}/mo`);
    }

    if (score > 0) {
      results.push({ subscription: sub, score, reasons });
    }
  }

  return results.sort((a, b) => b.score - a.score);
}
