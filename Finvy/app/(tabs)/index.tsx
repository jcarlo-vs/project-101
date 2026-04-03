import { useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useSubscriptions } from '@/context/SubscriptionContext';
import { useCreditCards } from '@/context/CreditCardContext';
import { useBills } from '@/context/BillContext';
import { useLoans } from '@/context/LoanContext';
import { useExpenses } from '@/context/ExpenseContext';
import { useBudget } from '@/context/BudgetContext';
import { useCurrency } from '@/context/CurrencyContext';
import { CurrencyPicker } from '@/components/currency-picker';
import { Theme, CategoryColors, CategoryIcons, ExpenseCategoryColors, ExpenseCategoryIcons, Fonts } from '@/constants/theme';
import {
  getTotalMonthlyCost, getCategoryBreakdown, getMostExpensive, getMonthlyCost, formatCurrency,
} from '@/utils/calculations';
import { getTotalMinimumPayments, getAverageUtilization, getUpcomingDueDates, getDaysUntilDue } from '@/utils/credit-card-calculations';
import { getTotalMonthlyBills, getUpcomingBills, getDaysUntilDue as getBillDaysUntilDue } from '@/utils/bill-calculations';
import { getTotalMonthlyLoanPayments, getUpcomingLoanPayments, getDaysUntilDue as getLoanDaysUntilDue } from '@/utils/loan-calculations';
import { getTotalMonthlyObligations, getTotalDebt } from '@/utils/dashboard-calculations';
import {
  getTotalExpensesThisMonth, getCategorySpending, getTotalBudgetLimit,
  getMonthlyIncome, getFixedMonthlyOutflow, getDisposableIncome, getSavingsRate,
  getExpensesByDate, formatDateLabel,
} from '@/utils/budget-calculations';

type DashboardView = 'overview' | 'budget' | 'income';

export default function DashboardScreen() {
  const { top } = useSafeAreaInsets();
  const router = useRouter();
  const { subscriptions, isLoading: subsLoading } = useSubscriptions();
  const { creditCards, isLoading: cardsLoading } = useCreditCards();
  const { bills, isLoading: billsLoading } = useBills();
  const { loans, isLoading: loansLoading } = useLoans();
  const { expenses } = useExpenses();
  const { incomeSources } = useBudget();
  const { currency, setCurrency } = useCurrency();
  const sym = currency.symbol;
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
  const [view, setView] = useState<DashboardView>('overview');

  // Overview data
  const activeSubs = useMemo(() => subscriptions.filter((s) => s.active), [subscriptions]);
  const activeCards = useMemo(() => creditCards.filter((c) => c.active), [creditCards]);
  const activeBills = useMemo(() => bills.filter((b) => b.active), [bills]);
  const activeLoans = useMemo(() => loans.filter((l) => l.active), [loans]);
  const totalMonthly = useMemo(() => getTotalMonthlyCost(subscriptions), [subscriptions]);
  const totalMonthlyBills = useMemo(() => getTotalMonthlyBills(bills), [bills]);
  const totalMonthlyLoans = useMemo(() => getTotalMonthlyLoanPayments(loans), [loans]);
  const totalObligations = useMemo(() => getTotalMonthlyObligations(subscriptions, creditCards, bills, loans), [subscriptions, creditCards, bills, loans]);
  const totalDebt = useMemo(() => getTotalDebt(creditCards, loans), [creditCards, loans]);
  const avgUtil = useMemo(() => getAverageUtilization(creditCards), [creditCards]);
  const categories = useMemo(() => getCategoryBreakdown(subscriptions), [subscriptions]);
  const topExpensive = useMemo(() => getMostExpensive(subscriptions, 4), [subscriptions]);
  const upcomingDue = useMemo(() => getUpcomingDueDates(creditCards, 7), [creditCards]);
  const upcomingBills = useMemo(() => getUpcomingBills(bills, 7), [bills]);
  const upcomingLoans = useMemo(() => getUpcomingLoanPayments(loans, 7), [loans]);

  // Budget data
  const expensesThisMonth = useMemo(() => getTotalExpensesThisMonth(expenses), [expenses]);
  const categorySpending = useMemo(() => getCategorySpending(expenses, bills), [expenses, bills]);
  const totalBudgetLimit = useMemo(() => getTotalBudgetLimit(bills), [bills]);
  const expensesByDate = useMemo(() => getExpensesByDate(expenses), [expenses]);

  // Income data
  const monthlyIncome = useMemo(() => getMonthlyIncome(incomeSources), [incomeSources]);
  const fixedOutflow = useMemo(() => getFixedMonthlyOutflow(subscriptions, creditCards, bills, loans), [subscriptions, creditCards, bills, loans]);
  const disposable = useMemo(() => getDisposableIncome(monthlyIncome, fixedOutflow, expensesThisMonth), [monthlyIncome, fixedOutflow, expensesThisMonth]);
  const savingsRate = useMemo(() => getSavingsRate(monthlyIncome, fixedOutflow + expensesThisMonth), [monthlyIncome, fixedOutflow, expensesThisMonth]);

  if (subsLoading || cardsLoading || billsLoading || loansLoading) {
    return <View style={[styles.container, { paddingTop: top }]}><Text style={styles.emptyText}>Loading...</Text></View>;
  }

  const budgetPercent = totalBudgetLimit > 0 ? Math.min((expensesThisMonth / totalBudgetLimit) * 100, 100) : 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingTop: top + 16, paddingBottom: 32 }}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.appName}>Finvy</Text>
          <TouchableOpacity style={styles.currencyBadge} onPress={() => setShowCurrencyPicker(true)}>
            <Text style={styles.currencyFlag}>{currency.flag}</Text>
            <Text style={styles.currencyCode}>{currency.code}</Text>
            <Ionicons name="chevron-down" size={12} color={Theme.textMuted} />
          </TouchableOpacity>
        </View>
        <Text style={styles.subtitle}>
          {activeSubs.length} sub{activeSubs.length !== 1 ? 's' : ''} · {activeCards.length} card{activeCards.length !== 1 ? 's' : ''} · {activeBills.length} bill{activeBills.length !== 1 ? 's' : ''} · {activeLoans.length} loan{activeLoans.length !== 1 ? 's' : ''}
        </Text>
      </View>

      {/* Segmented Control */}
      <View style={styles.segmented}>
        {(['overview', 'budget', 'income'] as DashboardView[]).map((v) => (
          <TouchableOpacity key={v} style={[styles.segment, view === v && styles.segmentActive]} onPress={() => setView(v)}>
            <Text style={[styles.segmentText, view === v && styles.segmentTextActive]}>
              {v === 'overview' ? 'Overview' : v === 'budget' ? 'Budget' : 'Income'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ─── OVERVIEW VIEW ─── */}
      {view === 'overview' && (
        <>
          <View style={styles.summaryRow}>
            <View style={[styles.card, styles.summaryCard]}>
              <Text style={styles.cardLabel}>MONTHLY</Text>
              <Text style={styles.cardAmount} numberOfLines={1} adjustsFontSizeToFit>{formatCurrency(totalObligations, sym)}</Text>
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownText}>Subs {formatCurrency(totalMonthly, sym)}</Text>
                <Text style={styles.breakdownDot}>·</Text>
                <Text style={styles.breakdownText}>Bills {formatCurrency(totalMonthlyBills, sym)}</Text>
                {totalMonthlyLoans > 0 && <><Text style={styles.breakdownDot}>·</Text><Text style={styles.breakdownText}>Loans {formatCurrency(totalMonthlyLoans, sym)}</Text></>}
              </View>
            </View>
            <View style={[styles.card, styles.summaryCard]}>
              <Text style={styles.cardLabel}>TOTAL DEBT</Text>
              <Text style={[styles.cardAmount, totalDebt > 0 && { color: Theme.accentSecondary }]} numberOfLines={1} adjustsFontSizeToFit>{formatCurrency(totalDebt, sym)}</Text>
              <Text style={styles.breakdownText} numberOfLines={1}>+ CC min {formatCurrency(getTotalMinimumPayments(creditCards), sym)}/mo</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Overview</Text>
            <TouchableOpacity style={styles.moduleRow} onPress={() => router.push('/(tabs)/subscriptions')}>
              <Ionicons name="list" size={20} color={Theme.accent} />
              <View style={styles.moduleInfo}><Text style={styles.moduleName}>Subscriptions</Text><Text style={styles.moduleStat}>{activeSubs.length} active · {formatCurrency(totalMonthly, sym)}/mo</Text></View>
              <Ionicons name="chevron-forward" size={16} color={Theme.textMuted} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.moduleRow} onPress={() => router.push('/(tabs)/credit-cards')}>
              <Ionicons name="wallet" size={20} color="#45B7D1" />
              <View style={styles.moduleInfo}><Text style={styles.moduleName}>Credit Cards</Text><Text style={styles.moduleStat}>{activeCards.length} card{activeCards.length !== 1 ? 's' : ''} · {avgUtil.toFixed(0)}% utilization</Text></View>
              <Ionicons name="chevron-forward" size={16} color={Theme.textMuted} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.moduleRow} onPress={() => router.push('/(tabs)/bills')}>
              <Ionicons name="receipt" size={20} color="#FFB347" />
              <View style={styles.moduleInfo}><Text style={styles.moduleName}>Bills & Budget</Text><Text style={styles.moduleStat}>{activeBills.length} bill{activeBills.length !== 1 ? 's' : ''} · {formatCurrency(totalMonthlyBills, sym)}/mo</Text></View>
              <Ionicons name="chevron-forward" size={16} color={Theme.textMuted} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.moduleRow} onPress={() => router.push('/(tabs)/loans')}>
              <Ionicons name="cash" size={20} color="#96E6A1" />
              <View style={styles.moduleInfo}><Text style={styles.moduleName}>Loans</Text><Text style={styles.moduleStat}>{activeLoans.length} loan{activeLoans.length !== 1 ? 's' : ''} · {formatCurrency(totalMonthlyLoans, sym)}/mo</Text></View>
              <Ionicons name="chevron-forward" size={16} color={Theme.textMuted} />
            </TouchableOpacity>
          </View>

          {(upcomingDue.length > 0 || upcomingBills.length > 0 || upcomingLoans.length > 0) && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Upcoming payments</Text>
              {upcomingBills.map((bill) => { const days = getBillDaysUntilDue(bill); return (
                <TouchableOpacity key={bill.id} style={styles.alertRow} onPress={() => router.push({ pathname: '/add-bill', params: { id: bill.id } })}>
                  <Ionicons name="receipt-outline" size={18} color={days <= 3 ? '#FF6B6B' : '#FFB347'} />
                  <Text style={styles.alertText}>{bill.name} · {formatCurrency(bill.amount, sym)} due in {days}d</Text>
                </TouchableOpacity>); })}
              {upcomingDue.map((card) => { const days = getDaysUntilDue(card); return (
                <TouchableOpacity key={card.id} style={styles.alertRow} onPress={() => router.push({ pathname: '/credit-card-detail', params: { id: card.id } })}>
                  <Ionicons name="alert-circle" size={18} color={days <= 3 ? '#FF6B6B' : '#FFB347'} />
                  <Text style={styles.alertText}>{card.name} · {formatCurrency(card.minimumPayment, sym)} due in {days}d</Text>
                </TouchableOpacity>); })}
              {upcomingLoans.map((loan) => { const days = getLoanDaysUntilDue(loan); return (
                <TouchableOpacity key={loan.id} style={styles.alertRow} onPress={() => router.push({ pathname: '/add-loan', params: { id: loan.id } })}>
                  <Ionicons name="cash-outline" size={18} color={days <= 3 ? '#FF6B6B' : '#FFB347'} />
                  <Text style={styles.alertText}>{loan.name} · {formatCurrency(loan.monthlyPayment, sym)} due in {days}d</Text>
                </TouchableOpacity>); })}
            </View>
          )}

          {categories.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Spending by category</Text>
              {categories.map((cat) => (
                <TouchableOpacity key={cat.category} style={styles.categoryRow} onPress={() => router.push({ pathname: '/(tabs)/subscriptions', params: { category: cat.category } })}>
                  <View style={styles.categoryInfo}>
                    <Ionicons name={CategoryIcons[cat.category] as any} size={18} color={cat.color} />
                    <Text style={styles.categoryName}>{cat.category} ({cat.count})</Text>
                    <Text style={styles.categoryAmount}>{formatCurrency(cat.total, sym)}</Text>
                  </View>
                  <View style={styles.barTrack}><View style={[styles.barFill, { width: `${cat.percentage}%`, backgroundColor: cat.color }]} /></View>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {topExpensive.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Most expensive subscriptions</Text>
              {topExpensive.map((sub) => (
                <TouchableOpacity key={sub.id} style={styles.expensiveRow} onPress={() => router.push({ pathname: '/add-subscription', params: { id: sub.id } })}>
                  <View style={[styles.categoryIcon, { backgroundColor: CategoryColors[sub.category] + '22' }]}><Ionicons name={CategoryIcons[sub.category] as any} size={20} color={CategoryColors[sub.category]} /></View>
                  <View style={styles.expensiveInfo}><Text style={styles.expensiveName}>{sub.name}</Text><Text style={styles.expensiveCategory}>{sub.category}</Text></View>
                  <Text style={styles.expensiveCost}>{formatCurrency(getMonthlyCost(sub), sym)}/mo</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </>
      )}

      {/* ─── BUDGET VIEW ─── */}
      {view === 'budget' && (
        <>
          {/* Quick add button */}
          <TouchableOpacity style={styles.quickAddBtn} onPress={() => router.push('/add-expense')}>
            <Ionicons name="add-circle" size={22} color="#FFF" />
            <Text style={styles.quickAddText}>Log Expense</Text>
          </TouchableOpacity>

          {/* Budget progress */}
          <View style={[styles.card, { marginHorizontal: 20, marginBottom: 20 }]}>
            <View style={styles.budgetHeader}>
              <Text style={styles.cardLabel}>THIS MONTH</Text>
              <Text style={styles.budgetPercent}>{budgetPercent.toFixed(0)}%</Text>
            </View>
            <Text style={styles.cardAmount} numberOfLines={1} adjustsFontSizeToFit>
              {formatCurrency(expensesThisMonth, sym)}
            </Text>
            <View style={styles.barTrack}>
              <View style={[styles.barFill, {
                width: `${budgetPercent}%`,
                backgroundColor: budgetPercent > 90 ? '#FF6B6B' : budgetPercent > 70 ? '#FFB347' : '#6BCB77',
              }]} />
            </View>
            <Text style={styles.breakdownText}>
              {totalBudgetLimit > 0 ? `of ${formatCurrency(totalBudgetLimit, sym)} budget` : 'No budget set'}
            </Text>
          </View>

          {/* Category budgets */}
          {categorySpending.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>By category</Text>
              {categorySpending.map((cs) => {
                const pct = cs.limit > 0 ? Math.min((cs.spent / cs.limit) * 100, 100) : 0;
                const remaining = cs.limit > 0 ? Math.max(0, cs.limit - cs.spent) : 0;
                return (
                  <View key={cs.category} style={styles.budgetCatRow}>
                    <View style={styles.budgetCatHeader}>
                      <Ionicons name={ExpenseCategoryIcons[cs.category] as any} size={16} color={ExpenseCategoryColors[cs.category]} />
                      <Text style={styles.budgetCatName}>{cs.category}</Text>
                      <Text style={[styles.budgetCatAmount, cs.overBudget && { color: '#FF6B6B' }]}>
                        {formatCurrency(cs.spent, sym)}{cs.limit > 0 ? ` / ${formatCurrency(cs.limit, sym)}` : ''}
                      </Text>
                    </View>
                    {cs.limit > 0 && (
                      <>
                        <View style={styles.barTrack}>
                          <View style={[styles.barFill, {
                            width: `${pct}%`,
                            backgroundColor: cs.overBudget ? '#FF6B6B' : pct > 70 ? '#FFB347' : ExpenseCategoryColors[cs.category],
                          }]} />
                        </View>
                        <Text style={[styles.budgetRemaining, cs.overBudget ? styles.budgetOverText : styles.budgetLeftText]}>
                          {cs.overBudget
                            ? `Over by ${formatCurrency(cs.spent - cs.limit, sym)}`
                            : `${formatCurrency(remaining, sym)} remaining`}
                        </Text>
                      </>
                    )}
                  </View>
                );
              })}
            </View>
          )}

          {/* Recent expenses */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent expenses</Text>
            {Array.from(expensesByDate.entries()).map(([date, items]) => (
              <View key={date}>
                <Text style={styles.dateLabel}>{formatDateLabel(date)}</Text>
                {items.map((e) => (
                  <View key={e.id} style={styles.expenseItem}>
                    <Ionicons name={ExpenseCategoryIcons[e.category] as any} size={16} color={ExpenseCategoryColors[e.category]} />
                    <View style={styles.expenseInfo}>
                      <Text style={styles.expenseNote}>{e.note || e.category}</Text>
                    </View>
                    <Text style={styles.expenseAmount}>{formatCurrency(e.amount, sym)}</Text>
                  </View>
                ))}
              </View>
            ))}
            {expensesByDate.size === 0 && <Text style={styles.emptyText}>No expenses logged this month.</Text>}
          </View>
        </>
      )}

      {/* ─── INCOME VIEW ─── */}
      {view === 'income' && (
        <>
          {/* Income vs Outflow */}
          <View style={styles.summaryRow}>
            <View style={[styles.card, styles.summaryCard]}>
              <Text style={styles.cardLabel}>INCOME</Text>
              <Text style={[styles.cardAmount, { color: '#6BCB77' }]} numberOfLines={1} adjustsFontSizeToFit>{formatCurrency(monthlyIncome, sym)}</Text>
            </View>
            <View style={[styles.card, styles.summaryCard]}>
              <Text style={styles.cardLabel}>REMAINING</Text>
              <Text style={[styles.cardAmount, disposable < 0 && { color: '#FF6B6B' }]} numberOfLines={1} adjustsFontSizeToFit>
                {formatCurrency(Math.abs(disposable), sym)}
              </Text>
              {disposable < 0 && <Text style={[styles.breakdownText, { color: '#FF6B6B' }]}>Over budget!</Text>}
            </View>
          </View>

          {/* Savings rate */}
          <View style={[styles.card, { marginHorizontal: 20, marginBottom: 20, alignItems: 'center' as const }]}>
            <Text style={styles.cardLabel}>SAVINGS RATE</Text>
            <Text style={[styles.savingsPercent, { color: savingsRate > 20 ? '#6BCB77' : savingsRate > 0 ? '#FFB347' : '#FF6B6B' }]}>
              {savingsRate.toFixed(0)}%
            </Text>
            <Text style={styles.breakdownText}>of income saved this month</Text>
          </View>

          {/* Breakdown */}
          <View style={[styles.card, { marginHorizontal: 20, marginBottom: 20 }]}>
            <Text style={styles.sectionTitle}>Where your money goes</Text>
            <View style={styles.incomeRow}>
              <Text style={styles.incomeLabel}>Fixed costs (subs + bills + CC)</Text>
              <Text style={styles.incomeValue}>{formatCurrency(fixedOutflow, sym)}</Text>
            </View>
            <View style={[styles.incomeRow, styles.incomeRowBorder]}>
              <Text style={styles.incomeLabel}>Variable expenses this month</Text>
              <Text style={styles.incomeValue}>{formatCurrency(expensesThisMonth, sym)}</Text>
            </View>
            <View style={styles.incomeRow}>
              <Text style={[styles.incomeLabel, { fontWeight: '600', color: Theme.textPrimary }]}>Total outflow</Text>
              <Text style={[styles.incomeValue, { fontWeight: '700', color: Theme.textPrimary }]}>{formatCurrency(fixedOutflow + expensesThisMonth, sym)}</Text>
            </View>
          </View>

          {/* Manage income */}
          <TouchableOpacity style={styles.manageIncomeBtn} onPress={() => router.push('/manage-income')}>
            <Ionicons name="settings-outline" size={18} color={Theme.accent} />
            <Text style={styles.manageIncomeText}>Manage income sources</Text>
          </TouchableOpacity>
        </>
      )}

      <CurrencyPicker visible={showCurrencyPicker} current={currency} onSelect={setCurrency} onClose={() => setShowCurrencyPicker(false)} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.bg },
  emptyText: { fontSize: 14, color: Theme.textMuted, textAlign: 'center' },
  header: { paddingHorizontal: 20, marginBottom: 12 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  appName: { fontSize: 26, fontWeight: '700', color: Theme.textPrimary },
  currencyBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Theme.cardBg, borderWidth: 1, borderColor: Theme.cardBorder,
    borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4,
  },
  currencyFlag: { fontSize: 14 },
  currencyCode: { fontSize: 12, fontWeight: '600', color: Theme.textBody },
  subtitle: { fontSize: 13, fontFamily: Fonts?.mono, color: Theme.textMuted, marginTop: 2 },

  // Segmented control
  segmented: {
    flexDirection: 'row', marginHorizontal: 20, marginBottom: 20,
    backgroundColor: Theme.cardBg, borderRadius: 12, borderWidth: 1, borderColor: Theme.cardBorder, overflow: 'hidden',
  },
  segment: { flex: 1, paddingVertical: 10, alignItems: 'center' },
  segmentActive: { backgroundColor: Theme.accent + '22' },
  segmentText: { fontSize: 13, fontWeight: '500', color: Theme.textMuted },
  segmentTextActive: { color: Theme.accent, fontWeight: '700' },

  // Shared
  summaryRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 12, marginBottom: 20 },
  card: { backgroundColor: Theme.cardBg, borderWidth: 1, borderColor: Theme.cardBorder, borderRadius: Theme.borderRadius.card, padding: 18 },
  summaryCard: { flex: 1 },
  cardLabel: { fontSize: 11, fontFamily: Fonts?.mono, color: Theme.textMuted, letterSpacing: 1, marginBottom: 6 },
  cardAmount: { fontSize: 24, fontWeight: '700', fontFamily: Fonts?.mono, color: Theme.textPrimary },
  breakdownRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 3, flexWrap: 'wrap' },
  breakdownText: { fontSize: 9, color: Theme.textMuted, fontFamily: Fonts?.mono, marginTop: 4 },
  breakdownDot: { fontSize: 9, color: Theme.textMuted },
  section: { paddingHorizontal: 20, marginBottom: 24 },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: '#999', marginBottom: 14 },
  barTrack: { height: 6, backgroundColor: Theme.cardBorder, borderRadius: 3, marginTop: 6 },
  barFill: { height: 6, borderRadius: 3 },

  // Overview
  moduleRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: Theme.cardBg, borderWidth: 1, borderColor: Theme.cardBorder,
    borderRadius: Theme.borderRadius.card, padding: 16, marginBottom: 10,
  },
  moduleInfo: { flex: 1 },
  moduleName: { fontSize: 15, fontWeight: '600', color: Theme.textPrimary },
  moduleStat: { fontSize: 12, color: Theme.textMuted, marginTop: 2 },
  alertRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#FF6B6B08', borderWidth: 1, borderColor: '#FF6B6B22',
    borderRadius: 12, padding: 12, marginBottom: 8,
  },
  alertText: { fontSize: 13, color: Theme.textBody, flex: 1 },
  categoryRow: { marginBottom: 14 },
  categoryInfo: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  categoryName: { fontSize: 13, color: Theme.textBody, marginLeft: 8, flex: 1 },
  categoryAmount: { fontSize: 13, fontFamily: Fonts?.mono, color: Theme.textPrimary, fontWeight: '600' },
  expensiveRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Theme.cardBg, borderWidth: 1, borderColor: Theme.cardBorder,
    borderRadius: Theme.borderRadius.card, padding: 14, marginBottom: 10,
  },
  categoryIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  expensiveInfo: { flex: 1, marginLeft: 12 },
  expensiveName: { fontSize: 15, fontWeight: '600', color: Theme.textPrimary },
  expensiveCategory: { fontSize: 12, color: Theme.textMuted, marginTop: 2 },
  expensiveCost: { fontSize: 16, fontWeight: '700', fontFamily: Fonts?.mono, color: Theme.textPrimary },

  // Budget view
  quickAddBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    marginHorizontal: 20, marginBottom: 20,
    backgroundColor: Theme.accent, borderRadius: Theme.borderRadius.button, paddingVertical: 14,
  },
  quickAddText: { fontSize: 15, fontWeight: '700', color: '#FFF' },
  budgetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  budgetPercent: { fontSize: 14, fontWeight: '700', fontFamily: Fonts?.mono, color: Theme.textBody },
  budgetCatRow: { marginBottom: 14 },
  budgetCatHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  budgetCatName: { flex: 1, fontSize: 13, color: Theme.textBody },
  budgetCatAmount: { fontSize: 13, fontFamily: Fonts?.mono, color: Theme.textPrimary, fontWeight: '600' },
  budgetRemaining: { fontSize: 11, fontFamily: Fonts?.mono, marginTop: 4 },
  budgetLeftText: { color: '#6BCB77' },
  budgetOverText: { color: '#FF6B6B' },
  dateLabel: { fontSize: 12, fontWeight: '600', color: Theme.textMuted, marginTop: 10, marginBottom: 8 },
  expenseItem: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Theme.separator,
  },
  expenseInfo: { flex: 1 },
  expenseNote: { fontSize: 14, color: Theme.textBody },
  expenseAmount: { fontSize: 14, fontWeight: '600', fontFamily: Fonts?.mono, color: Theme.textPrimary },

  // Income view
  savingsPercent: { fontSize: 36, fontWeight: '700', fontFamily: Fonts?.mono, marginVertical: 4 },
  incomeRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10 },
  incomeRowBorder: { borderBottomWidth: 1, borderBottomColor: Theme.separator },
  incomeLabel: { fontSize: 13, color: Theme.textMuted },
  incomeValue: { fontSize: 13, fontFamily: Fonts?.mono, fontWeight: '600', color: Theme.textBody },
  manageIncomeBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    marginHorizontal: 20, paddingVertical: 12,
    borderWidth: 1, borderColor: Theme.accent + '33', borderRadius: Theme.borderRadius.button,
  },
  manageIncomeText: { fontSize: 13, fontWeight: '600', color: Theme.accent },
});
