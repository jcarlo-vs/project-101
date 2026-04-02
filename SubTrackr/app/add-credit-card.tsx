import { useState, useEffect } from 'react';
import {
  View, Text, TextInput, ScrollView, StyleSheet, TouchableOpacity,
  Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { useCreditCards } from '@/context/CreditCardContext';
import { useCurrency } from '@/context/CurrencyContext';
import { ConfirmModal } from '@/components/confirm-modal';
import {
  Theme, CARD_COLORS, CARD_NETWORKS, REMINDER_OPTIONS,
  type CardNetwork, type ReminderOffset,
} from '@/constants/theme';
import { scheduleDueDateReminder } from '@/utils/notifications';
import { DayPickerField } from '@/components/date-picker-field';

export default function AddCreditCardScreen() {
  const { top } = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { creditCards, addCreditCard, updateCreditCard, deleteCreditCard } = useCreditCards();
  const { currency } = useCurrency();

  const existing = id ? creditCards.find((c) => c.id === id) : undefined;
  const isEdit = !!existing;

  const [name, setName] = useState('');
  const [issuer, setIssuer] = useState('');
  const [lastFour, setLastFour] = useState('');
  const [network, setNetwork] = useState<CardNetwork>('Visa');
  const [color, setColor] = useState<string>(CARD_COLORS[0]);
  const [creditLimit, setCreditLimit] = useState('');
  const [currentBalance, setCurrentBalance] = useState('');
  const [minimumPayment, setMinimumPayment] = useState('');
  const [apr, setApr] = useState('');
  const [statementDate, setStatementDate] = useState('15');
  const [dueDate, setDueDate] = useState('10');
  const [reminderOffset, setReminderOffset] = useState<ReminderOffset>(3);
  const [notes, setNotes] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    if (existing) {
      setName(existing.name);
      setIssuer(existing.issuer);
      setLastFour(existing.lastFourDigits);
      setNetwork(existing.network);
      setColor(existing.color);
      setCreditLimit(existing.creditLimit.toString());
      setCurrentBalance(existing.currentBalance.toString());
      setMinimumPayment(existing.minimumPayment.toString());
      setApr(existing.apr.toString());
      setStatementDate(existing.statementDate.toString());
      setDueDate(existing.dueDate.toString());
      setReminderOffset(existing.reminderOffset);
      setNotes(existing.notes ?? '');
    }
  }, [existing]);

  const handleSave = async () => {
    if (!name.trim()) { Alert.alert('Name required'); return; }
    const limit = parseFloat(creditLimit);
    if (!creditLimit || isNaN(limit) || limit <= 0) { Alert.alert('Invalid credit limit'); return; }

    const card = {
      name: name.trim(),
      issuer: issuer.trim(),
      lastFourDigits: lastFour,
      network,
      color,
      creditLimit: limit,
      currentBalance: parseFloat(currentBalance) || 0,
      minimumPayment: parseFloat(minimumPayment) || 0,
      apr: parseFloat(apr) || 0,
      statementDate: Math.min(31, Math.max(1, parseInt(statementDate) || 1)),
      dueDate: Math.min(31, Math.max(1, parseInt(dueDate) || 1)),
      active: existing?.active ?? true,
      notes: notes.trim() || undefined,
      reminderOffset,
    };

    if (isEdit && existing) {
      updateCreditCard({ ...card, id: existing.id, payments: existing.payments });
    } else {
      addCreditCard(card);
    }

    if (reminderOffset !== -1) {
      const full = isEdit && existing
        ? { ...card, id: existing.id, payments: existing.payments }
        : { ...card, id: 'temp', payments: [] };
      await scheduleDueDateReminder(full).catch(() => {});
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.back();
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: top + 12 }]} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="close" size={28} color={Theme.textMuted} />
          </TouchableOpacity>
          <Text style={styles.title}>{isEdit ? 'Edit Card' : 'Add Credit Card'}</Text>
          <View style={{ width: 28 }} />
        </View>

        <Text style={styles.label}>Card Name</Text>
        <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="e.g. Sapphire Preferred" placeholderTextColor={Theme.textMuted} />

        <Text style={styles.label}>Issuer / Bank</Text>
        <TextInput style={styles.input} value={issuer} onChangeText={setIssuer} placeholder="e.g. Chase" placeholderTextColor={Theme.textMuted} />

        <Text style={styles.label}>Last 4 Digits</Text>
        <TextInput style={styles.input} value={lastFour} onChangeText={(t) => setLastFour(t.replace(/\D/g, '').slice(0, 4))} placeholder="1234" placeholderTextColor={Theme.textMuted} keyboardType="number-pad" maxLength={4} />

        <Text style={styles.label}>Card Network</Text>
        <View style={styles.segmented}>
          {CARD_NETWORKS.map((n) => (
            <TouchableOpacity key={n} style={[styles.segment, network === n && styles.segmentActive]} onPress={() => setNetwork(n)}>
              <Text style={[styles.segmentText, network === n && styles.segmentTextActive]}>{n}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Card Color</Text>
        <View style={styles.colorRow}>
          {CARD_COLORS.map((c) => (
            <TouchableOpacity
              key={c}
              style={[styles.colorCircle, { backgroundColor: c }, color === c && styles.colorCircleActive]}
              onPress={() => setColor(c)}
            >
              {color === c && <Ionicons name="checkmark" size={16} color="#FFF" />}
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.row}>
          <View style={styles.halfField}>
            <Text style={styles.label}>Credit Limit</Text>
            <View style={styles.costRow}>
              <Text style={styles.dollarSign}>{currency.symbol}</Text>
              <TextInput style={[styles.input, { flex: 1 }]} value={creditLimit} onChangeText={setCreditLimit} placeholder="0.00" placeholderTextColor={Theme.textMuted} keyboardType="decimal-pad" />
            </View>
          </View>
          <View style={styles.halfField}>
            <Text style={styles.label}>Current Balance</Text>
            <View style={styles.costRow}>
              <Text style={styles.dollarSign}>{currency.symbol}</Text>
              <TextInput style={[styles.input, { flex: 1 }]} value={currentBalance} onChangeText={setCurrentBalance} placeholder="0.00" placeholderTextColor={Theme.textMuted} keyboardType="decimal-pad" />
            </View>
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.halfField}>
            <Text style={styles.label}>Min Payment</Text>
            <View style={styles.costRow}>
              <Text style={styles.dollarSign}>{currency.symbol}</Text>
              <TextInput style={[styles.input, { flex: 1 }]} value={minimumPayment} onChangeText={setMinimumPayment} placeholder="0.00" placeholderTextColor={Theme.textMuted} keyboardType="decimal-pad" />
            </View>
          </View>
          <View style={styles.halfField}>
            <Text style={styles.label}>APR %</Text>
            <TextInput style={styles.input} value={apr} onChangeText={setApr} placeholder="24.99" placeholderTextColor={Theme.textMuted} keyboardType="decimal-pad" />
          </View>
        </View>

        <DayPickerField
          label="Statement Date"
          helperText="Day of the month when your billing statement is generated by your bank."
          value={statementDate}
          onChange={setStatementDate}
        />

        <DayPickerField
          label="Due Date"
          helperText="Day of the month when your minimum payment must be received to avoid late fees."
          value={dueDate}
          onChange={setDueDate}
        />

        <Text style={styles.label}>Remind me</Text>
        <View style={styles.reminderGrid}>
          {REMINDER_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              style={[styles.reminderPill, reminderOffset === opt.value && styles.reminderPillActive]}
              onPress={() => setReminderOffset(opt.value)}
            >
              <Ionicons name={opt.value === -1 ? 'notifications-off-outline' : 'notifications-outline'} size={16} color={reminderOffset === opt.value ? Theme.accent : Theme.textMuted} />
              <Text style={[styles.reminderPillText, reminderOffset === opt.value && styles.reminderPillTextActive]}>{opt.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Notes (optional)</Text>
        <TextInput style={[styles.input, styles.notesInput]} value={notes} onChangeText={setNotes} placeholder="Any additional notes..." placeholderTextColor={Theme.textMuted} multiline textAlignVertical="top" />

        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveText}>{isEdit ? 'Save Changes' : 'Add Credit Card'}</Text>
        </TouchableOpacity>

        {isEdit && (
          <TouchableOpacity style={styles.deleteButton} onPress={() => setShowDeleteModal(true)}>
            <Ionicons name="trash-outline" size={18} color={Theme.accentSecondary} />
            <Text style={styles.deleteText}>Delete Card</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      <ConfirmModal
        visible={showDeleteModal}
        icon="trash-outline"
        iconColor={Theme.accentSecondary}
        title="Delete Credit Card"
        message={`Are you sure you want to delete "${existing?.name}"? All payment history will be lost.`}
        confirmText="Delete"
        confirmColor={Theme.accentSecondary}
        onConfirm={() => {
          if (existing) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            deleteCreditCard(existing.id);
          }
          setShowDeleteModal(false);
          router.back();
        }}
        onCancel={() => setShowDeleteModal(false)}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.bg },
  content: { paddingHorizontal: 20, paddingBottom: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  title: { fontSize: 18, fontWeight: '600', color: Theme.textPrimary },
  label: { fontSize: 13, fontWeight: '500', color: Theme.textMuted, marginBottom: 6, marginTop: 16 },
  input: {
    backgroundColor: Theme.inputBg, borderWidth: 1, borderColor: Theme.inputBorder,
    borderRadius: Theme.borderRadius.input, paddingHorizontal: 14, paddingVertical: 11,
    fontSize: 15, color: Theme.textPrimary,
  },
  row: { flexDirection: 'row', gap: 12 },
  halfField: { flex: 1 },
  costRow: { flexDirection: 'row', alignItems: 'center' },
  dollarSign: { fontSize: 18, fontWeight: '600', color: Theme.textMuted, marginRight: 8 },
  segmented: { flexDirection: 'row', backgroundColor: Theme.inputBg, borderRadius: Theme.borderRadius.input, borderWidth: 1, borderColor: Theme.inputBorder, overflow: 'hidden' },
  segment: { flex: 1, paddingVertical: 10, alignItems: 'center' },
  segmentActive: { backgroundColor: Theme.accent + '33' },
  segmentText: { fontSize: 12, color: Theme.textMuted },
  segmentTextActive: { color: Theme.accent, fontWeight: '600' },
  colorRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  colorCircle: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  colorCircleActive: { borderWidth: 2, borderColor: '#FFF' },
  reminderGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  reminderPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12,
    backgroundColor: Theme.inputBg, borderWidth: 1, borderColor: Theme.inputBorder,
  },
  reminderPillActive: { borderColor: Theme.accent + '66', backgroundColor: Theme.accent + '14' },
  reminderPillText: { fontSize: 13, color: Theme.textMuted },
  reminderPillTextActive: { color: Theme.accent, fontWeight: '600' },
  notesInput: { height: 80, paddingTop: 11 },
  saveButton: { marginTop: 24, backgroundColor: Theme.accent, borderRadius: Theme.borderRadius.button, paddingVertical: 16, alignItems: 'center' },
  saveText: { fontSize: 16, fontWeight: '700', color: '#FFF' },
  deleteButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 16, paddingVertical: 12 },
  deleteText: { fontSize: 15, color: Theme.accentSecondary, fontWeight: '500' },
});
