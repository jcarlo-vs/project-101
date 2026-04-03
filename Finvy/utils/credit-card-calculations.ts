import type { CreditCard } from '@/constants/theme';

export function getUtilizationRate(card: CreditCard): number {
  if (card.creditLimit <= 0) return 0;
  return (card.currentBalance / card.creditLimit) * 100;
}

export function getMonthlyInterest(card: CreditCard): number {
  return card.currentBalance * (card.apr / 100 / 12);
}

export function getNextDueDate(card: CreditCard): Date {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const day = Math.min(card.dueDate, new Date(year, month + 1, 0).getDate());

  let next = new Date(year, month, day);
  if (next.getTime() <= now.getTime()) {
    const nextMonth = month + 1;
    const nextDay = Math.min(card.dueDate, new Date(year, nextMonth + 1, 0).getDate());
    next = new Date(year, nextMonth, nextDay);
  }
  return next;
}

export function getDaysUntilDue(card: CreditCard): number {
  const next = getNextDueDate(card);
  return Math.ceil((next.getTime() - Date.now()) / 86400000);
}

export function getTotalBalance(cards: CreditCard[]): number {
  return cards.filter((c) => c.active).reduce((sum, c) => sum + c.currentBalance, 0);
}

export function getTotalCreditLimit(cards: CreditCard[]): number {
  return cards.filter((c) => c.active).reduce((sum, c) => sum + c.creditLimit, 0);
}

export function getAverageUtilization(cards: CreditCard[]): number {
  const active = cards.filter((c) => c.active);
  if (active.length === 0) return 0;
  const totalBalance = getTotalBalance(active);
  const totalLimit = getTotalCreditLimit(active);
  if (totalLimit <= 0) return 0;
  return (totalBalance / totalLimit) * 100;
}

export function getTotalMinimumPayments(cards: CreditCard[]): number {
  return cards.filter((c) => c.active).reduce((sum, c) => sum + c.minimumPayment, 0);
}

export function getTotalMonthlyInterest(cards: CreditCard[]): number {
  return cards.filter((c) => c.active).reduce((sum, c) => sum + getMonthlyInterest(c), 0);
}

export function getHighUtilizationCards(cards: CreditCard[], threshold = 70): CreditCard[] {
  return cards
    .filter((c) => c.active && getUtilizationRate(c) > threshold)
    .sort((a, b) => getUtilizationRate(b) - getUtilizationRate(a));
}

export function getUpcomingDueDates(cards: CreditCard[], withinDays = 7): CreditCard[] {
  return cards
    .filter((c) => c.active && getDaysUntilDue(c) <= withinDays)
    .sort((a, b) => getDaysUntilDue(a) - getDaysUntilDue(b));
}

export function getUtilizationColor(rate: number): string {
  if (rate < 30) return '#6BCB77';
  if (rate < 70) return '#FFB347';
  return '#FF6B6B';
}
