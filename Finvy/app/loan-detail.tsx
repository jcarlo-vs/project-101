import { useState } from 'react';
import {
  View, Text, TextInput, ScrollView, StyleSheet, TouchableOpacity, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { useLoans } from '@/context/LoanContext';
import { useCurrency } from '@/context/CurrencyContext';
import { ConfirmModal } from '@/components/confirm-modal';
import { Theme, LoanTypeColors, LoanTypeIcons, Fonts } from '@/constants/theme';
import { formatCurrency } from '@/utils/calculations';
import {
  getLoanProgress, getDaysUntilDue, getPayoffDate, getMonthlyInterest, getPayoffMonths,
  getMissedPayments, getPayableMonths,
} from '@/utils/loan-calculations';

function todayISO(): string {
  return new Date().toISOString().split('T')[0];
}

export default function LoanDetailScreen() {
  const { top } = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { loans, addPayment, deletePayment } = useLoans();
  const { currency } = useCurrency();
  const sym = currency.symbol;

  const loan = loans.find((l) => l.id === id);

  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentNote, setPaymentNote] = useState('');
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [deletePaymentTarget, setDeletePaymentTarget] = useState<string | null>(null);

  if (!loan) {
    return (
      <View style={[styles.container, { paddingTop: top + 16, alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={styles.emptyText}>Loan not found</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.linkText}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const progress = getLoanProgress(loan);
  const daysUntilDue = getDaysUntilDue(loan);
  const payoff = getPayoffDate(loan);
  const interest = getMonthlyInterest(loan);
  const payoffMonths = getPayoffMonths(loan);
  const missed = getMissedPayments(loan);
  const payable = getPayableMonths(loan, 3);

  const handleMarkPaid = (monthLabel: string, dueDate: Date) => {
    const dateStr = dueDate.toISOString().split('T')[0];
    addPayment(loan.id, {
      date: dateStr,
      amount: loan.monthlyPayment,
      note: `${monthLabel} payment`,
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleAddPayment = () => {
    const amount = parseFloat(paymentAmount);
    if (!paymentAmount || isNaN(amount) || amount <= 0) {
      Alert.alert('Invalid amount', 'Please enter a valid payment amount.');
      return;
    }
    addPayment(loan.id, {
      date: todayISO(),
      amount,
      note: paymentNote.trim() || undefined,
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setPaymentAmount('');
    setPaymentNote('');
    setShowPaymentForm(false);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingTop: top + 12, paddingBottom: 40 }}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color={Theme.textMuted} />
        </TouchableOpacity>
        <Text style={styles.title}>{loan.name}</Text>
        <TouchableOpacity onPress={() => router.push({ pathname: '/add-loan', params: { id: loan.id } })}>
          <Ionicons name="pencil-outline" size={22} color={Theme.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Loan Visual Card */}
      <View style={[styles.loanCard, { borderLeftColor: LoanTypeColors[loan.type] }]}>
        <View style={styles.loanCardTop}>
          <View style={[styles.typeIcon, { backgroundColor: LoanTypeColors[loan.type] + '22' }]}>
            <Ionicons name={LoanTypeIcons[loan.type] as any} size={24} color={LoanTypeColors[loan.type]} />
          </View>
          <View style={styles.loanCardInfo}>
            <Text style={styles.loanCardName}>{loan.name}</Text>
            <Text style={styles.loanCardSub}>{loan.lender}{loan.lender ? ' · ' : ''}{loan.type}</Text>
          </View>
        </View>
        {/* Progress bar */}
        <View style={styles.progressSection}>
          <View style={styles.barTrack}>
            <View style={[styles.barFill, { width: `${progress}%`, backgroundColor: LoanTypeColors[loan.type] }]} />
          </View>
          <View style={styles.progressFooter}>
            <Text style={styles.progressText}>{progress.toFixed(0)}% paid</Text>
            <Text style={styles.progressText}>{formatCurrency(loan.principalAmount, sym)} original</Text>
          </View>
        </View>
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Balance</Text>
          <Text style={styles.statValue}>{formatCurrency(loan.currentBalance, sym)}</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Monthly</Text>
          <Text style={styles.statValue}>{formatCurrency(loan.monthlyPayment, sym)}</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Payoff</Text>
          <Text style={styles.statValue}>{payoff}</Text>
        </View>
        {loan.interestRate > 0 && (
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Interest Rate</Text>
            <Text style={styles.statValue}>{loan.interestRate}%</Text>
          </View>
        )}
        {loan.interestRate > 0 && (
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Est. Interest/mo</Text>
            <Text style={[styles.statValue, { color: Theme.accentSecondary }]}>{formatCurrency(interest, sym)}</Text>
          </View>
        )}
        {payoffMonths > 0 && (
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Months Left</Text>
            <Text style={styles.statValue}>{payoffMonths}</Text>
          </View>
        )}
      </View>

      {/* Due Date Banner */}
      <View style={[styles.dueBanner, daysUntilDue <= 3 && styles.dueBannerUrgent]}>
        <Ionicons name="calendar" size={20} color={daysUntilDue <= 3 ? '#FF6B6B' : LoanTypeColors[loan.type]} />
        <Text style={styles.dueText}>Payment due in {daysUntilDue} day{daysUntilDue !== 1 ? 's' : ''}</Text>
      </View>

      {/* Missed Payments */}
      {missed.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Did you pay? ({missed.length} month{missed.length !== 1 ? 's' : ''})
          </Text>
          {missed.map((m) => (
            <View key={m.monthLabel} style={styles.missedCard}>
              <View style={styles.missedInfo}>
                <Ionicons name="alert-circle" size={20} color="#FFB347" />
                <View style={styles.missedTextWrap}>
                  <Text style={styles.missedMonth}>{m.monthLabel}</Text>
                  <Text style={styles.missedAmount}>{formatCurrency(loan.monthlyPayment, sym)} due</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.markPaidBtn} onPress={() => handleMarkPaid(m.monthLabel, m.dueDate)}>
                <Ionicons name="checkmark-circle" size={18} color="#FFF" />
                <Text style={styles.markPaidText}>Paid</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {/* Pay Now / Pay Ahead */}
      {payable.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {payable[0]?.isCurrent ? 'Pay now' : 'Pay ahead'}
          </Text>
          {payable.map((m) => (
            <View key={m.monthLabel} style={styles.payableCard}>
              <View style={styles.payableInfo}>
                <Ionicons
                  name={m.isCurrent ? 'time-outline' : 'arrow-forward-circle-outline'}
                  size={20}
                  color={m.isCurrent ? LoanTypeColors[loan.type] : Theme.accent}
                />
                <View style={styles.payableTextWrap}>
                  <Text style={styles.payableMonth}>{m.monthLabel}</Text>
                  <Text style={styles.payableAmount}>
                    {formatCurrency(loan.monthlyPayment, sym)}
                    {m.isCurrent ? ' — due soon' : ' — advance'}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={[styles.payNowBtn, !m.isCurrent && styles.payAheadBtn]}
                onPress={() => handleMarkPaid(m.monthLabel, m.dueDate)}
              >
                <Ionicons name="card-outline" size={16} color="#FFF" />
                <Text style={styles.payNowText}>{m.isCurrent ? 'Pay' : 'Pay ahead'}</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {/* Payment Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Payments</Text>
          <TouchableOpacity onPress={() => setShowPaymentForm(!showPaymentForm)}>
            <Ionicons name={showPaymentForm ? 'close' : 'add-circle-outline'} size={24} color={LoanTypeColors[loan.type]} />
          </TouchableOpacity>
        </View>

        {showPaymentForm && (
          <View style={styles.paymentForm}>
            <View style={styles.paymentRow}>
              <Text style={styles.dollarSign}>{sym}</Text>
              <TextInput
                style={[styles.paymentInput, { flex: 1 }]}
                value={paymentAmount}
                onChangeText={setPaymentAmount}
                placeholder="Amount"
                placeholderTextColor={Theme.textMuted}
                keyboardType="decimal-pad"
                autoFocus
              />
            </View>
            <TextInput
              style={styles.paymentInput}
              value={paymentNote}
              onChangeText={setPaymentNote}
              placeholder="Note (optional)"
              placeholderTextColor={Theme.textMuted}
            />
            <TouchableOpacity style={styles.recordBtn} onPress={handleAddPayment}>
              <Text style={styles.recordBtnText}>Record Payment</Text>
            </TouchableOpacity>
          </View>
        )}

        {loan.payments.length === 0 ? (
          <Text style={styles.emptyText}>No payments recorded yet.</Text>
        ) : (
          loan.payments.map((p) => (
            <View key={p.id} style={styles.paymentItem}>
              <View style={styles.paymentInfo}>
                <Text style={styles.paymentDate}>{p.date}</Text>
                {p.note && <Text style={styles.paymentNote}>{p.note}</Text>}
              </View>
              <Text style={styles.paymentAmount}>{formatCurrency(p.amount, sym)}</Text>
              <TouchableOpacity onPress={() => setDeletePaymentTarget(p.id)} style={styles.paymentDelete}>
                <Ionicons name="close-circle-outline" size={18} color={Theme.textMuted} />
              </TouchableOpacity>
            </View>
          ))
        )}
      </View>

      <ConfirmModal
        visible={!!deletePaymentTarget}
        icon="cash-outline"
        iconColor="#FFB347"
        title="Delete Payment"
        message="Remove this payment? The amount will be added back to the balance."
        confirmText="Delete"
        confirmColor="#FFB347"
        onConfirm={() => {
          if (deletePaymentTarget) {
            deletePayment(loan.id, deletePaymentTarget);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }
          setDeletePaymentTarget(null);
        }}
        onCancel={() => setDeletePaymentTarget(null)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.bg },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, marginBottom: 16,
  },
  title: { fontSize: 18, fontWeight: '600', color: Theme.textPrimary },

  // Loan visual card
  loanCard: {
    marginHorizontal: 20, marginBottom: 20, padding: 18,
    backgroundColor: Theme.cardBg, borderWidth: 1, borderColor: Theme.cardBorder,
    borderRadius: Theme.borderRadius.card, borderLeftWidth: 4,
  },
  loanCardTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  typeIcon: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  loanCardInfo: { flex: 1, marginLeft: 14 },
  loanCardName: { fontSize: 18, fontWeight: '700', color: Theme.textPrimary },
  loanCardSub: { fontSize: 13, color: Theme.textMuted, marginTop: 2 },
  progressSection: {},
  barTrack: { height: 8, backgroundColor: Theme.cardBorder, borderRadius: 4 },
  barFill: { height: 8, borderRadius: 4 },
  progressFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  progressText: { fontSize: 11, color: Theme.textMuted, fontFamily: Fonts?.mono },

  // Stats
  statsGrid: {
    flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 20, gap: 10, marginBottom: 16,
  },
  statBox: {
    width: '31%', backgroundColor: Theme.cardBg, borderWidth: 1, borderColor: Theme.cardBorder,
    borderRadius: 14, padding: 12,
  },
  statLabel: { fontSize: 10, color: Theme.textMuted, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  statValue: { fontSize: 15, fontWeight: '700', fontFamily: Fonts?.mono, color: Theme.textPrimary },

  // Due banner
  dueBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginHorizontal: 20, marginBottom: 20, padding: 14,
    backgroundColor: 'rgba(150,230,161,0.08)', borderWidth: 1, borderColor: 'rgba(150,230,161,0.2)',
    borderRadius: Theme.borderRadius.card,
  },
  dueBannerUrgent: {
    backgroundColor: '#FF6B6B12', borderColor: '#FF6B6B33',
  },
  dueText: { fontSize: 14, fontWeight: '500', color: Theme.textBody },

  // Missed payments
  missedCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#FFB34710', borderWidth: 1, borderColor: '#FFB34722',
    borderRadius: 14, padding: 14, marginBottom: 8,
  },
  missedInfo: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  missedTextWrap: {},
  missedMonth: { fontSize: 14, fontWeight: '600', color: Theme.textPrimary },
  missedAmount: { fontSize: 11, color: Theme.textMuted, marginTop: 1, fontFamily: Fonts?.mono },
  markPaidBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#6BCB77', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 8,
  },
  markPaidText: { fontSize: 13, fontWeight: '700', color: '#FFF' },

  // Pay now / Pay ahead
  payableCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Theme.cardBg, borderWidth: 1, borderColor: Theme.cardBorder,
    borderRadius: 14, padding: 14, marginBottom: 8,
  },
  payableInfo: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  payableTextWrap: {},
  payableMonth: { fontSize: 14, fontWeight: '600', color: Theme.textPrimary },
  payableAmount: { fontSize: 11, color: Theme.textMuted, marginTop: 1, fontFamily: Fonts?.mono },
  payNowBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#6BCB77', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 8,
  },
  payAheadBtn: {
    backgroundColor: Theme.accent,
  },
  payNowText: { fontSize: 13, fontWeight: '700', color: '#FFF' },

  // Payments
  section: { paddingHorizontal: 20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: '#999' },
  paymentForm: {
    backgroundColor: Theme.cardBg, borderWidth: 1, borderColor: Theme.cardBorder,
    borderRadius: Theme.borderRadius.card, padding: 14, marginBottom: 14, gap: 10,
  },
  paymentRow: { flexDirection: 'row', alignItems: 'center' },
  dollarSign: { fontSize: 18, fontWeight: '600', color: Theme.textMuted, marginRight: 8 },
  paymentInput: {
    backgroundColor: Theme.inputBg, borderWidth: 1, borderColor: Theme.inputBorder,
    borderRadius: Theme.borderRadius.input, paddingHorizontal: 12, paddingVertical: 10,
    fontSize: 14, color: Theme.textPrimary,
  },
  recordBtn: {
    backgroundColor: '#6BCB77', borderRadius: Theme.borderRadius.button,
    paddingVertical: 12, alignItems: 'center',
  },
  recordBtnText: { fontSize: 14, fontWeight: '700', color: '#FFF' },
  paymentItem: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: Theme.separator,
  },
  paymentInfo: { flex: 1 },
  paymentDate: { fontSize: 13, color: Theme.textBody },
  paymentNote: { fontSize: 11, color: Theme.textMuted, marginTop: 2 },
  paymentAmount: { fontSize: 14, fontWeight: '600', fontFamily: Fonts?.mono, color: '#6BCB77', marginRight: 8 },
  paymentDelete: { padding: 4 },
  emptyText: { fontSize: 13, color: Theme.textMuted, textAlign: 'center', paddingVertical: 20 },
  linkText: { fontSize: 14, color: Theme.accent, marginTop: 8 },
});
