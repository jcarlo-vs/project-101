import { useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { useSubscriptions } from '@/context/SubscriptionContext';
import { useCreditCards } from '@/context/CreditCardContext';
import { useBills } from '@/context/BillContext';
import { useLoans } from '@/context/LoanContext';
import { useCurrency } from '@/context/CurrencyContext';
import { ConfirmModal } from '@/components/confirm-modal';
import { Theme, CategoryColors, CategoryIcons, Fonts, type Subscription } from '@/constants/theme';
import {
  getCancelSuggestions,
  getTotalMonthlyCost,
  getMonthlyCost,
  formatCurrency,
  getCategoryBreakdown,
} from '@/utils/calculations';
import { getAverageUtilization, getTotalMonthlyInterest, getHighUtilizationCards } from '@/utils/credit-card-calculations';
import { getTotalMonthlyBills } from '@/utils/bill-calculations';
import { getTotalMonthlyLoanPayments, getTotalLoanBalance, getTotalLoanInterest } from '@/utils/loan-calculations';
import { getTotalMonthlyObligations, getTotalDebt } from '@/utils/dashboard-calculations';
import { sendTestNotification } from '@/utils/notifications';

export default function InsightsScreen() {
  const { top } = useSafeAreaInsets();
  const { subscriptions, toggleActive } = useSubscriptions();
  const { creditCards } = useCreditCards();
  const { bills } = useBills();
  const { loans } = useLoans();
  const { currency } = useCurrency();
  const sym = currency.symbol;
  const [cancelTarget, setCancelTarget] = useState<Subscription | null>(null);

  const suggestions = useMemo(() => getCancelSuggestions(subscriptions, sym), [subscriptions, sym]);
  const potentialSavings = useMemo(
    () => suggestions.reduce((sum, s) => sum + getMonthlyCost(s.subscription), 0),
    [suggestions],
  );
  const totalMonthly = useMemo(() => getTotalMonthlyCost(subscriptions), [subscriptions]);
  const totalBills = useMemo(() => getTotalMonthlyBills(bills), [bills]);
  const totalLoanPayments = useMemo(() => getTotalMonthlyLoanPayments(loans), [loans]);
  const totalObligations = useMemo(() => getTotalMonthlyObligations(subscriptions, creditCards, bills, loans), [subscriptions, creditCards, bills, loans]);
  const totalDebtAll = useMemo(() => getTotalDebt(creditCards, loans), [creditCards, loans]);
  const totalLoanBalance = useMemo(() => getTotalLoanBalance(loans), [loans]);
  const loanInterest = useMemo(() => getTotalLoanInterest(loans), [loans]);
  const categories = useMemo(() => getCategoryBreakdown(subscriptions), [subscriptions]);
  const activeSubs = useMemo(() => subscriptions.filter((s) => s.active), [subscriptions]);
  const activeBills = useMemo(() => bills.filter((b) => b.active), [bills]);
  const activeLoans = useMemo(() => loans.filter((l) => l.active), [loans]);
  const avgUtil = useMemo(() => getAverageUtilization(creditCards), [creditCards]);
  const monthlyInterest = useMemo(() => getTotalMonthlyInterest(creditCards), [creditCards]);
  const highUtilCards = useMemo(() => getHighUtilizationCards(creditCards, 50), [creditCards]);

  const topCategory = categories.length > 0 ? categories[0] : null;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingTop: top + 16, paddingBottom: 40 }}
    >
      <Text style={styles.title}>Insights</Text>

      {/* Savings Banner */}
      {suggestions.length > 0 ? (
        <View style={styles.savingsBanner}>
          <Ionicons name="alert-circle" size={24} color={Theme.accentSecondary} />
          <View style={styles.savingsInfo}>
            <Text style={styles.savingsTitle}>Potential savings found</Text>
            <Text style={styles.savingsBody}>
              You could save up to {formatCurrency(potentialSavings, sym)}/mo by reviewing{' '}
              {suggestions.length} subscription{suggestions.length > 1 ? 's' : ''}.
            </Text>
          </View>
        </View>
      ) : (
        <View style={styles.goodBanner}>
          <Ionicons name="checkmark-circle" size={24} color="#6BCB77" />
          <View style={styles.savingsInfo}>
            <Text style={styles.savingsTitle}>{"You're in good shape!"}</Text>
            <Text style={styles.savingsBody}>All your subscriptions are well-used!</Text>
          </View>
        </View>
      )}

      {/* Quick Stats */}
      <View style={styles.statsCard}>
        <Text style={styles.sectionTitle}>Quick stats</Text>
        <StatRow label="Total monthly obligations" value={formatCurrency(totalObligations, sym)} />
        <StatRow label="Subscription cost/day" value={formatCurrency(totalMonthly / 30, sym)} />
        <StatRow label="Per paycheck (bi-weekly)" value={formatCurrency(totalObligations / 2, sym)} />
        <StatRow label="Most expensive category" value={topCategory ? topCategory.category : '—'} />
        <StatRow label="Active subscriptions" value={activeSubs.length.toString()} />
        <StatRow label="Active bills" value={activeBills.length.toString()} />
        <StatRow label="Active loans" value={activeLoans.length.toString()} />
        <StatRow label="Monthly bills" value={formatCurrency(totalBills, sym)} />
        <StatRow label="Monthly loan payments" value={formatCurrency(totalLoanPayments, sym)} />
        <StatRow label="Total debt (CC + loans)" value={formatCurrency(totalDebtAll, sym)} />
        <StatRow label="Avg card utilization" value={`${avgUtil.toFixed(0)}%`} last />
      </View>

      {/* Credit Card Health */}
      {creditCards.length > 0 && (
        <View style={styles.statsCard}>
          <Text style={styles.sectionTitle}>Credit card health</Text>
          <StatRow label="Est. monthly interest" value={formatCurrency(monthlyInterest, sym)} />
          <StatRow label="Est. yearly interest" value={formatCurrency(monthlyInterest * 12, sym)} />
          {highUtilCards.length > 0 ? (
            <>
              <StatRow label="High utilization cards" value={highUtilCards.length.toString()} last />
              {highUtilCards.map((card) => (
                <View key={card.id} style={styles.highUtilRow}>
                  <Ionicons name="warning" size={14} color="#FFB347" />
                  <Text style={styles.highUtilText}>
                    {card.name} — {((card.currentBalance / card.creditLimit) * 100).toFixed(0)}% used
                  </Text>
                </View>
              ))}
            </>
          ) : (
            <StatRow label="High utilization cards" value="None" last />
          )}
        </View>
      )}

      {/* Loan Health */}
      {loans.length > 0 && (
        <View style={styles.statsCard}>
          <Text style={styles.sectionTitle}>Loan health</Text>
          <StatRow label="Total loan balance" value={formatCurrency(totalLoanBalance, sym)} />
          <StatRow label="Monthly payments" value={formatCurrency(totalLoanPayments, sym)} />
          <StatRow label="Est. monthly interest" value={formatCurrency(loanInterest, sym)} />
          <StatRow label="Est. yearly interest" value={formatCurrency(loanInterest * 12, sym)} last />
        </View>
      )}

      {/* Test Notification */}
      <TouchableOpacity
        style={styles.testNotifBtn}
        onPress={() => sendTestNotification()}
      >
        <Ionicons name="notifications-outline" size={18} color={Theme.accent} />
        <Text style={styles.testNotifText}>Send test notification</Text>
      </TouchableOpacity>

      {/* Cancel Suggestions */}
      {suggestions.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Consider reviewing</Text>
          {suggestions.map(({ subscription: sub, score, reasons }) => (
            <View key={sub.id} style={styles.suggestionCard}>
              <View style={styles.suggestionTop}>
                <View style={[styles.catIcon, { backgroundColor: CategoryColors[sub.category] + '22' }]}>
                  <Ionicons
                    name={CategoryIcons[sub.category] as any}
                    size={20}
                    color={CategoryColors[sub.category]}
                  />
                </View>
                <View style={styles.suggestionInfo}>
                  <Text style={styles.suggestionName}>{sub.name}</Text>
                  <Text style={styles.suggestionCost}>
                    {formatCurrency(getMonthlyCost(sub), sym)}/mo
                  </Text>
                </View>
                <View style={[styles.badge, score > 30 ? styles.badgeHigh : styles.badgeMed]}>
                  <Text style={[styles.badgeText, score > 30 ? styles.badgeTextHigh : styles.badgeTextMed]}>
                    {score > 30 ? 'Review' : 'Consider'}
                  </Text>
                </View>
              </View>
              <View style={styles.reasons}>
                {reasons.map((r, i) => (
                  <View key={i} style={styles.reasonPill}>
                    <Text style={styles.reasonText}>{r}</Text>
                  </View>
                ))}
              </View>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setCancelTarget(sub)}
              >
                <Text style={styles.cancelBtnText}>Cancel this subscription</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {/* Cancel Confirmation */}
      <ConfirmModal
        visible={!!cancelTarget}
        icon="close-circle-outline"
        iconColor="#FFB347"
        title="Cancel Subscription"
        message={`Are you sure you want to cancel "${cancelTarget?.name}"? You can reactivate it later.`}
        confirmText="Cancel It"
        confirmColor="#FFB347"
        onConfirm={() => {
          if (cancelTarget) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            toggleActive(cancelTarget.id);
          }
          setCancelTarget(null);
        }}
        onCancel={() => setCancelTarget(null)}
      />
    </ScrollView>
  );
}

function StatRow({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <View style={[styles.statRow, !last && styles.statRowBorder]}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.bg,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: Theme.textPrimary,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  savingsBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Theme.accentSecondary + '12',
    borderWidth: 1,
    borderColor: Theme.accentSecondary + '33',
    borderRadius: Theme.borderRadius.card,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 20,
    gap: 12,
  },
  goodBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#6BCB7712',
    borderWidth: 1,
    borderColor: '#6BCB7733',
    borderRadius: Theme.borderRadius.card,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 20,
    gap: 12,
  },
  savingsInfo: {
    flex: 1,
  },
  savingsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Theme.textPrimary,
    marginBottom: 4,
  },
  savingsBody: {
    fontSize: 13,
    color: Theme.textBody,
    lineHeight: 18,
  },
  statsCard: {
    backgroundColor: Theme.cardBg,
    borderWidth: 1,
    borderColor: Theme.cardBorder,
    borderRadius: Theme.borderRadius.card,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#999',
    marginBottom: 14,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  statRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Theme.separator,
  },
  statLabel: {
    fontSize: 13,
    color: Theme.textMuted,
  },
  statValue: {
    fontSize: 13,
    fontWeight: '600',
    fontFamily: Fonts?.mono,
    color: Theme.textBody,
  },
  section: {
    paddingHorizontal: 20,
  },
  suggestionCard: {
    backgroundColor: Theme.cardBg,
    borderWidth: 1,
    borderColor: Theme.cardBorder,
    borderRadius: Theme.borderRadius.card,
    padding: 16,
    marginBottom: 12,
  },
  suggestionTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  catIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  suggestionInfo: {
    flex: 1,
    marginLeft: 12,
  },
  suggestionName: {
    fontSize: 15,
    fontWeight: '600',
    color: Theme.textPrimary,
  },
  suggestionCost: {
    fontSize: 14,
    fontFamily: Fonts?.mono,
    color: Theme.accentSecondary,
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeHigh: {
    backgroundColor: Theme.accentSecondary + '22',
  },
  badgeMed: {
    backgroundColor: '#FFB34722',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  badgeTextHigh: {
    color: Theme.accentSecondary,
  },
  badgeTextMed: {
    color: '#FFB347',
  },
  reasons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 12,
  },
  reasonPill: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  reasonText: {
    fontSize: 11,
    color: Theme.textBody,
  },
  cancelBtn: {
    marginTop: 14,
    borderWidth: 1,
    borderColor: Theme.accentSecondary + '44',
    borderRadius: Theme.borderRadius.button,
    paddingVertical: 10,
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: Theme.accentSecondary,
  },
  highUtilRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingLeft: 4,
  },
  highUtilText: {
    fontSize: 12,
    color: '#FFB347',
  },
  testNotifBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 20,
    marginBottom: 24,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Theme.accent + '33',
    borderRadius: Theme.borderRadius.button,
  },
  testNotifText: {
    fontSize: 13,
    fontWeight: '600',
    color: Theme.accent,
  },
});
