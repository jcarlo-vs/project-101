import { useState, useEffect } from 'react';
import {
  View, Text, TextInput, ScrollView, StyleSheet, TouchableOpacity,
  Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { useLoans } from '@/context/LoanContext';
import { useCurrency } from '@/context/CurrencyContext';
import { ConfirmModal } from '@/components/confirm-modal';
import { DayPickerField } from '@/components/date-picker-field';
import {
  Theme, LoanTypeColors, LoanTypeIcons, LOAN_TYPES, REMINDER_OPTIONS,
  type LoanType, type ReminderOffset,
} from '@/constants/theme';

function todayISO(): string {
  return new Date().toISOString().split('T')[0];
}

export default function AddLoanScreen() {
  const { top } = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { loans, addLoan, updateLoan, deleteLoan } = useLoans();
  const { currency } = useCurrency();

  const existing = id ? loans.find((l) => l.id === id) : undefined;
  const isEdit = !!existing;

  const [name, setName] = useState('');
  const [lender, setLender] = useState('');
  const [loanType, setLoanType] = useState<LoanType>('Personal');
  const [principalAmount, setPrincipalAmount] = useState('');
  const [currentBalance, setCurrentBalance] = useState('');
  const [monthlyPayment, setMonthlyPayment] = useState('');
  const [interestRate, setInterestRate] = useState('');
  const [termMonths, setTermMonths] = useState('');
  const [startDate, setStartDate] = useState(todayISO());
  const [dueDate, setDueDate] = useState('15');
  const [reminderOffset, setReminderOffset] = useState<ReminderOffset>(3);
  const [notes, setNotes] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    if (existing) {
      setName(existing.name);
      setLender(existing.lender);
      setLoanType(existing.type);
      setPrincipalAmount(existing.principalAmount.toString());
      setCurrentBalance(existing.currentBalance.toString());
      setMonthlyPayment(existing.monthlyPayment.toString());
      setInterestRate(existing.interestRate.toString());
      setTermMonths(existing.termMonths.toString());
      setStartDate(existing.startDate);
      setDueDate(existing.dueDate.toString());
      setReminderOffset(existing.reminderOffset);
      setNotes(existing.notes ?? '');
    }
  }, [existing]);

  const handleSave = () => {
    if (!name.trim()) { Alert.alert('Name required'); return; }
    const principal = parseFloat(principalAmount);
    if (!principalAmount || isNaN(principal) || principal <= 0) { Alert.alert('Invalid principal amount'); return; }

    const loan = {
      name: name.trim(),
      lender: lender.trim(),
      type: loanType,
      principalAmount: principal,
      currentBalance: parseFloat(currentBalance) || principal,
      monthlyPayment: parseFloat(monthlyPayment) || 0,
      interestRate: parseFloat(interestRate) || 0,
      termMonths: parseInt(termMonths) || 0,
      startDate,
      dueDate: Math.min(31, Math.max(1, parseInt(dueDate) || 1)),
      active: existing?.active ?? true,
      notes: notes.trim() || undefined,
      reminderOffset,
    };

    if (isEdit && existing) {
      updateLoan({ ...loan, id: existing.id, payments: existing.payments });
    } else {
      addLoan(loan);
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
          <Text style={styles.title}>{isEdit ? 'Edit Loan' : 'Add Loan'}</Text>
          <View style={{ width: 28 }} />
        </View>

        <Text style={styles.label}>Loan Name</Text>
        <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="e.g. Car Loan" placeholderTextColor={Theme.textMuted} />

        <Text style={styles.label}>Lender / Bank</Text>
        <TextInput style={styles.input} value={lender} onChangeText={setLender} placeholder="e.g. BPI" placeholderTextColor={Theme.textMuted} />

        <Text style={styles.label}>Loan Type</Text>
        <View style={styles.typeGrid}>
          {LOAN_TYPES.map((t) => (
            <TouchableOpacity
              key={t}
              style={[styles.typePill, loanType === t && { borderColor: LoanTypeColors[t], borderWidth: 2 }]}
              onPress={() => setLoanType(t)}
            >
              <Ionicons name={LoanTypeIcons[t] as any} size={16} color={LoanTypeColors[t]} />
              <Text style={styles.typePillText}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.row}>
          <View style={styles.halfField}>
            <Text style={styles.label}>Original Amount</Text>
            <View style={styles.costRow}>
              <Text style={styles.dollarSign}>{currency.symbol}</Text>
              <TextInput style={[styles.input, { flex: 1 }]} value={principalAmount} onChangeText={setPrincipalAmount} placeholder="0.00" placeholderTextColor={Theme.textMuted} keyboardType="decimal-pad" />
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
            <Text style={styles.label}>Monthly Payment</Text>
            <View style={styles.costRow}>
              <Text style={styles.dollarSign}>{currency.symbol}</Text>
              <TextInput style={[styles.input, { flex: 1 }]} value={monthlyPayment} onChangeText={setMonthlyPayment} placeholder="0.00" placeholderTextColor={Theme.textMuted} keyboardType="decimal-pad" />
            </View>
          </View>
          <View style={styles.halfField}>
            <Text style={styles.label}>Interest Rate %</Text>
            <TextInput style={styles.input} value={interestRate} onChangeText={setInterestRate} placeholder="5.0" placeholderTextColor={Theme.textMuted} keyboardType="decimal-pad" />
          </View>
        </View>

        <Text style={styles.label}>Loan Term (months)</Text>
        <TextInput style={styles.input} value={termMonths} onChangeText={setTermMonths} placeholder="e.g. 60 for 5 years" placeholderTextColor={Theme.textMuted} keyboardType="number-pad" />

        <DayPickerField
          label="Payment Due Date"
          helperText="Day of the month when your monthly payment is due."
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
          <Text style={styles.saveText}>{isEdit ? 'Save Changes' : 'Add Loan'}</Text>
        </TouchableOpacity>

        {isEdit && (
          <TouchableOpacity style={styles.deleteButton} onPress={() => setShowDeleteModal(true)}>
            <Ionicons name="trash-outline" size={18} color={Theme.accentSecondary} />
            <Text style={styles.deleteText}>Delete Loan</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      <ConfirmModal
        visible={showDeleteModal}
        icon="trash-outline"
        iconColor={Theme.accentSecondary}
        title="Delete Loan"
        message={`Are you sure you want to delete "${existing?.name}"?`}
        confirmText="Delete"
        confirmColor={Theme.accentSecondary}
        onConfirm={() => {
          if (existing) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            deleteLoan(existing.id);
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
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  typePill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20,
    backgroundColor: Theme.inputBg, borderWidth: 1, borderColor: Theme.inputBorder,
  },
  typePillText: { fontSize: 13, color: Theme.textBody },
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
