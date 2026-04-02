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

export default function CreditCardDetailScreen() {
  const { top } = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { creditCards, addPayment, deletePayment } = useCreditCards();
  const { currency } = useCurrency();
  const sym = currency.symbol;

  const card = creditCards.find((c) => c.id === id);

  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentNote, setPaymentNote] = useState('');
  const [showPaymentForm, setShowPaymentForm] = useState(false);
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

  const handleAddPayment = () => {
    const amount = parseFloat(paymentAmount);
    if (!paymentAmount || isNaN(amount) || amount <= 0) {
      Alert.alert('Invalid amount', 'Please enter a valid payment amount.');
      return;
    }
    addPayment(card.id, {
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
        <Text style={styles.title}>{card.name}</Text>
        <TouchableOpacity onPress={() => router.push({ pathname: '/add-credit-card', params: { id: card.id } })}>
          <Ionicons name="pencil-outline" size={22} color={Theme.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Visual Card */}
      <View style={styles.cardContainer}>
        <CreditCardVisual card={card} size="large" />
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Balance</Text>
          <Text style={styles.statValue}>{formatCurrency(card.currentBalance, sym)}</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Limit</Text>
          <Text style={styles.statValue}>{formatCurrency(card.creditLimit, sym)}</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Utilization</Text>
          <Text style={[styles.statValue, { color: utilColor }]}>{util.toFixed(1)}%</Text>
        </View>
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
        <Text style={styles.dueText}>Payment due in {daysUntilDue} day{daysUntilDue !== 1 ? 's' : ''}</Text>
      </View>

      {/* Payment Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Payments</Text>
          <TouchableOpacity onPress={() => setShowPaymentForm(!showPaymentForm)}>
            <Ionicons name={showPaymentForm ? 'close' : 'add-circle-outline'} size={24} color={Theme.accent} />
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
  statsGrid: {
    flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 20, gap: 10, marginBottom: 16,
  },
  statBox: {
    width: '31%', backgroundColor: Theme.cardBg, borderWidth: 1, borderColor: Theme.cardBorder,
    borderRadius: 14, padding: 12,
  },
  statLabel: { fontSize: 10, color: Theme.textMuted, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  statValue: { fontSize: 15, fontWeight: '700', fontFamily: Fonts?.mono, color: Theme.textPrimary },
  dueBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginHorizontal: 20, marginBottom: 20, padding: 14,
    backgroundColor: Theme.accent + '12', borderWidth: 1, borderColor: Theme.accent + '33',
    borderRadius: Theme.borderRadius.card,
  },
  dueBannerUrgent: {
    backgroundColor: '#FF6B6B12', borderColor: '#FF6B6B33',
  },
  dueText: { fontSize: 14, fontWeight: '500', color: Theme.textBody },
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
