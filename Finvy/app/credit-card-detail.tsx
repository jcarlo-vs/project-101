import { useState } from 'react';
import {
  View, Text, TextInput, ScrollView, StyleSheet, TouchableOpacity, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { useCreditCards } from '@/context/CreditCardContext';
import { useCurrency } from '@/context/CurrencyContext';
import { ConfirmModal } from '@/components/confirm-modal';
import { CreditCardVisual } from '@/components/credit-card-visual';
import { Theme, Fonts } from '@/constants/theme';
import { formatCurrency } from '@/utils/calculations';
import { getUtilizationRate, getMonthlyInterest, getDaysUntilDue, getUtilizationColor } from '@/utils/credit-card-calculations';

function todayISO(): string {
  return new Date().toISOString().split('T')[0];
}

type ActiveForm = null | 'payment' | 'charge' | 'updateBalance';

export default function CreditCardDetailScreen() {
  const { top } = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { creditCards, addPayment, deletePayment, addCharge, updateBalance } = useCreditCards();
  const { currency } = useCurrency();
  const sym = currency.symbol;

  const card = creditCards.find((c) => c.id === id);

  const [activeForm, setActiveForm] = useState<ActiveForm>(null);
  const [formAmount, setFormAmount] = useState('');
  const [formNote, setFormNote] = useState('');
  const [deletePaymentTarget, setDeletePaymentTarget] = useState<string | null>(null);

  if (!card) {
    return (
      <View style={[styles.container, { paddingTop: top + 16, alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={styles.emptyText}>Card not found</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.linkText}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const util = getUtilizationRate(card);
  const interest = getMonthlyInterest(card);
  const daysUntilDue = getDaysUntilDue(card);
  const utilColor = getUtilizationColor(util);
  const available = Math.max(0, card.creditLimit - card.currentBalance);
  const statementBal = card.statementBalance ?? 0;

  const resetForm = () => {
    setFormAmount('');
    setFormNote('');
    setActiveForm(null);
  };

  const toggleForm = (form: ActiveForm) => {
    if (activeForm === form) {
      resetForm();
    } else {
      setFormAmount('');
      setFormNote('');
      setActiveForm(form);
    }
  };

  const handleAddPayment = () => {
    const amount = parseFloat(formAmount);
    if (!formAmount || isNaN(amount) || amount <= 0) {
      Alert.alert('Invalid amount', 'Please enter a valid payment amount.');
      return;
    }
    addPayment(card.id, { date: todayISO(), amount, note: formNote.trim() || undefined });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    resetForm();
  };

  const handleAddCharge = () => {
    const amount = parseFloat(formAmount);
    if (!formAmount || isNaN(amount) || amount <= 0) {
      Alert.alert('Invalid amount', 'Please enter a valid amount.');
      return;
    }
    addCharge(card.id, amount, formNote.trim() || undefined);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    resetForm();
  };

  const handleUpdateBalance = () => {
    const amount = parseFloat(formAmount);
    if (!formAmount || isNaN(amount)) {
      Alert.alert('Invalid amount', 'Please enter your current balance.');
      return;
    }
    updateBalance(card.id, amount);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    resetForm();
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingTop: top + 12, paddingBottom: 40 }}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color={Theme.textMuted} />
        </TouchableOpacity>
        <Text style={styles.title}>{card.name}</Text>
        <TouchableOpacity onPress={() => router.push({ pathname: '/add-credit-card', params: { id: card.id } })}>
          <Ionicons name="pencil-outline" size={22} color={Theme.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Visual Card */}
      <View style={styles.cardContainer}>
        <CreditCardVisual card={card} size="large" />
      </View>

      {/* Balance Summary */}
      <View style={styles.balanceSummary}>
        <View style={styles.balanceMain}>
          <Text style={styles.balanceLabel}>Current Balance</Text>
          <Text style={styles.balanceAmount}>{formatCurrency(card.currentBalance, sym)}</Text>
        </View>
        <View style={styles.balanceRow}>
          <View style={styles.balanceItem}>
            <Text style={styles.balanceItemLabel}>Available</Text>
            <Text style={[styles.balanceItemValue, { color: '#6BCB77' }]}>{formatCurrency(available, sym)}</Text>
          </View>
          <View style={styles.balanceDivider} />
          <View style={styles.balanceItem}>
            <Text style={styles.balanceItemLabel}>Statement Due</Text>
            <Text style={[styles.balanceItemValue, statementBal > 0 ? { color: '#FFB347' } : {}]}>
              {statementBal > 0 ? formatCurrency(statementBal, sym) : '—'}
            </Text>
          </View>
          <View style={styles.balanceDivider} />
          <View style={styles.balanceItem}>
            <Text style={styles.balanceItemLabel}>Limit</Text>
            <Text style={styles.balanceItemValue}>{formatCurrency(card.creditLimit, sym)}</Text>
          </View>
        </View>
        {/* Utilization bar */}
        <View style={styles.utilSection}>
          <View style={styles.utilHeader}>
            <Text style={styles.utilLabel}>Utilization</Text>
            <Text style={[styles.utilPercent, { color: utilColor }]}>{util.toFixed(0)}%</Text>
          </View>
          <View style={styles.barTrack}>
            <View style={[styles.barFill, { width: `${Math.min(util, 100)}%`, backgroundColor: utilColor }]} />
          </View>
        </View>
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>APR</Text>
          <Text style={styles.statValue}>{card.apr}%</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Min Payment</Text>
          <Text style={styles.statValue}>{formatCurrency(card.minimumPayment, sym)}</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Est. Interest/mo</Text>
          <Text style={[styles.statValue, { color: Theme.accentSecondary }]}>{formatCurrency(interest, sym)}</Text>
        </View>
      </View>

      {/* Due Date Banner */}
      <View style={[styles.dueBanner, daysUntilDue <= 3 && styles.dueBannerUrgent]}>
        <Ionicons name="calendar" size={20} color={daysUntilDue <= 3 ? '#FF6B6B' : Theme.accent} />
        <View style={styles.dueInfo}>
          <Text style={styles.dueText}>Payment due in {daysUntilDue} day{daysUntilDue !== 1 ? 's' : ''}</Text>
          {statementBal > 0 && (
            <Text style={styles.dueSubText}>{formatCurrency(statementBal, sym)} statement balance</Text>
          )}
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity
          style={[styles.quickBtn, styles.quickBtnPayment, activeForm === 'payment' && styles.quickBtnActive]}
          onPress={() => toggleForm('payment')}
        >
          <Ionicons name="arrow-down-circle-outline" size={20} color="#6BCB77" />
          <Text style={styles.quickBtnText}>Pay</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.quickBtn, styles.quickBtnCharge, activeForm === 'charge' && styles.quickBtnActive]}
          onPress={() => toggleForm('charge')}
        >
          <Ionicons name="cart-outline" size={20} color="#FF6B6B" />
          <Text style={styles.quickBtnText}>Charge</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.quickBtn, activeForm === 'updateBalance' && styles.quickBtnActive]}
          onPress={() => toggleForm('updateBalance')}
        >
          <Ionicons name="refresh-outline" size={20} color={Theme.accent} />
          <Text style={styles.quickBtnText}>Update</Text>
        </TouchableOpacity>
      </View>

      {/* Active Form */}
      {activeForm && (
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>
            {activeForm === 'payment' ? 'Record Payment' : activeForm === 'charge' ? 'Log Purchase' : 'Update Balance'}
          </Text>
          {activeForm === 'updateBalance' && (
            <Text style={styles.formHint}>Set your balance to match your statement or app</Text>
          )}
          <View style={styles.formRow}>
            <Text style={styles.dollarSign}>{sym}</Text>
            <TextInput
              style={[styles.formInput, { flex: 1 }]}
              value={formAmount}
              onChangeText={setFormAmount}
              placeholder={activeForm === 'updateBalance' ? card.currentBalance.toFixed(2) : '0.00'}
              placeholderTextColor={Theme.textMuted}
              keyboardType="decimal-pad"
              autoFocus
            />
          </View>
          {activeForm !== 'updateBalance' && (
            <TextInput
              style={styles.formInput}
              value={formNote}
              onChangeText={setFormNote}
              placeholder={activeForm === 'charge' ? 'What did you buy?' : 'Note (optional)'}
              placeholderTextColor={Theme.textMuted}
            />
          )}
          <TouchableOpacity
            style={[styles.formSubmit, {
              backgroundColor: activeForm === 'payment' ? '#6BCB77' : activeForm === 'charge' ? '#FF6B6B' : Theme.accent,
            }]}
            onPress={activeForm === 'payment' ? handleAddPayment : activeForm === 'charge' ? handleAddCharge : handleUpdateBalance}
          >
            <Text style={styles.formSubmitText}>
              {activeForm === 'payment' ? 'Record Payment' : activeForm === 'charge' ? 'Log Purchase' : 'Update Balance'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Payment History */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Payment history</Text>
        {card.payments.length === 0 ? (
          <Text style={styles.emptyText}>No payments recorded yet.</Text>
        ) : (
          card.payments.map((p) => (
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
            deletePayment(card.id, deletePaymentTarget);
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
  cardContainer: { paddingHorizontal: 20, marginBottom: 20 },

  // Balance summary
  balanceSummary: {
    marginHorizontal: 20, marginBottom: 16, padding: 18,
    backgroundColor: Theme.cardBg, borderWidth: 1, borderColor: Theme.cardBorder,
    borderRadius: Theme.borderRadius.card,
  },
  balanceMain: { alignItems: 'center', marginBottom: 16 },
  balanceLabel: { fontSize: 11, color: Theme.textMuted, textTransform: 'uppercase', letterSpacing: 1 },
  balanceAmount: { fontSize: 32, fontWeight: '700', fontFamily: Fonts?.mono, color: Theme.textPrimary, marginTop: 4 },
  balanceRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 14 },
  balanceItem: { alignItems: 'center', flex: 1 },
  balanceItemLabel: { fontSize: 10, color: Theme.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  balanceItemValue: { fontSize: 14, fontWeight: '600', fontFamily: Fonts?.mono, color: Theme.textPrimary, marginTop: 2 },
  balanceDivider: { width: 1, backgroundColor: Theme.separator, marginVertical: 2 },
  utilSection: { paddingTop: 12, borderTopWidth: 1, borderTopColor: Theme.separator },
  utilHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  utilLabel: { fontSize: 11, color: Theme.textMuted },
  utilPercent: { fontSize: 12, fontWeight: '700', fontFamily: Fonts?.mono },
  barTrack: { height: 6, backgroundColor: Theme.cardBorder, borderRadius: 3 },
  barFill: { height: 6, borderRadius: 3 },

  // Stats
  statsGrid: {
    flexDirection: 'row', paddingHorizontal: 20, gap: 10, marginBottom: 16,
  },
  statBox: {
    flex: 1, backgroundColor: Theme.cardBg, borderWidth: 1, borderColor: Theme.cardBorder,
    borderRadius: 14, padding: 12,
  },
  statLabel: { fontSize: 10, color: Theme.textMuted, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  statValue: { fontSize: 15, fontWeight: '700', fontFamily: Fonts?.mono, color: Theme.textPrimary },

  // Due banner
  dueBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginHorizontal: 20, marginBottom: 16, padding: 14,
    backgroundColor: Theme.accent + '12', borderWidth: 1, borderColor: Theme.accent + '33',
    borderRadius: Theme.borderRadius.card,
  },
  dueBannerUrgent: {
    backgroundColor: '#FF6B6B12', borderColor: '#FF6B6B33',
  },
  dueInfo: { flex: 1 },
  dueText: { fontSize: 14, fontWeight: '500', color: Theme.textBody },
  dueSubText: { fontSize: 11, color: Theme.textMuted, marginTop: 2, fontFamily: Fonts?.mono },

  // Quick actions
  quickActions: {
    flexDirection: 'row', paddingHorizontal: 20, gap: 10, marginBottom: 16,
  },
  quickBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 12, borderRadius: 12,
    backgroundColor: Theme.cardBg, borderWidth: 1, borderColor: Theme.cardBorder,
  },
  quickBtnPayment: {},
  quickBtnCharge: {},
  quickBtnActive: { borderColor: Theme.accent + '66', backgroundColor: Theme.accent + '08' },
  quickBtnText: { fontSize: 13, fontWeight: '600', color: Theme.textBody },

  // Form
  formCard: {
    marginHorizontal: 20, marginBottom: 16, padding: 16,
    backgroundColor: Theme.cardBg, borderWidth: 1, borderColor: Theme.cardBorder,
    borderRadius: Theme.borderRadius.card, gap: 10,
  },
  formTitle: { fontSize: 15, fontWeight: '600', color: Theme.textPrimary },
  formHint: { fontSize: 11, color: Theme.textMuted, marginTop: -4 },
  formRow: { flexDirection: 'row', alignItems: 'center' },
  dollarSign: { fontSize: 18, fontWeight: '600', color: Theme.textMuted, marginRight: 8 },
  formInput: {
    backgroundColor: Theme.inputBg, borderWidth: 1, borderColor: Theme.inputBorder,
    borderRadius: Theme.borderRadius.input, paddingHorizontal: 12, paddingVertical: 10,
    fontSize: 14, color: Theme.textPrimary,
  },
  formSubmit: { borderRadius: Theme.borderRadius.button, paddingVertical: 12, alignItems: 'center' },
  formSubmitText: { fontSize: 14, fontWeight: '700', color: '#FFF' },

  // Payments
  section: { paddingHorizontal: 20 },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: '#999', marginBottom: 14 },
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
