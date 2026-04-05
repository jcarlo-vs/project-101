import { useState, useEffect } from 'react';
import {
  View, Text, TextInput, ScrollView, StyleSheet, TouchableOpacity,
  Switch, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { useBills } from '@/context/BillContext';
import { useCurrency } from '@/context/CurrencyContext';
import { useToast } from '@/context/ToastContext';
import { ConfirmModal } from '@/components/confirm-modal';
import {
  Theme, BillCategoryColors, BillCategoryIcons, BILL_CATEGORIES, REMINDER_OPTIONS,
  type BillCategory, type BillFrequency, type ReminderOffset,
} from '@/constants/theme';
import { DayPickerField } from '@/components/date-picker-field';

const FREQUENCIES: { value: BillFrequency; label: string }[] = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'yearly', label: 'Yearly' },
  { value: 'one-time', label: 'One-time' },
];

export default function AddBillScreen() {
  const { top } = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { bills, addBill, updateBill, deleteBill } = useBills();
  const { currency } = useCurrency();

  const { showToast } = useToast();
  const existing = id ? bills.find((b) => b.id === id) : undefined;
  const isEdit = !!existing;

  const [name, setName] = useState('');
  const [category, setCategory] = useState<BillCategory>('Other');
  const [amount, setAmount] = useState('');
  const [frequency, setFrequency] = useState<BillFrequency>('monthly');
  const [dueDate, setDueDate] = useState('15');
  const [autoPay, setAutoPay] = useState(false);
  const [trackSpending, setTrackSpending] = useState(false);
  const [reminderOffset, setReminderOffset] = useState<ReminderOffset>(3);
  const [notes, setNotes] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    if (existing) {
      setName(existing.name);
      setCategory(existing.category);
      setAmount(existing.amount.toString());
      setFrequency(existing.frequency);
      setDueDate(existing.dueDate.toString());
      setAutoPay(existing.autoPay);
      setTrackSpending(existing.trackSpending);
      setReminderOffset(existing.reminderOffset);
      setNotes(existing.notes ?? '');
    }
  }, [existing]);

  const handleSave = () => {
    if (!name.trim()) { Alert.alert('Name required'); return; }
    const parsed = parseFloat(amount);
    if (!amount || isNaN(parsed) || parsed <= 0) { Alert.alert('Invalid amount'); return; }

    const bill = {
      name: name.trim(),
      category,
      amount: parsed,
      frequency,
      dueDate: Math.min(31, Math.max(1, parseInt(dueDate) || 1)),
      active: existing?.active ?? true,
      autoPay,
      trackSpending,
      notes: notes.trim() || undefined,
      reminderOffset,
    };

    if (isEdit && existing) {
      updateBill({ ...bill, id: existing.id, payments: existing.payments });
    } else {
      addBill(bill);
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    showToast(isEdit ? 'Bill updated' : 'Bill added');
    router.back();
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: top + 12 }]} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="close" size={28} color={Theme.textMuted} />
          </TouchableOpacity>
          <Text style={styles.title}>{isEdit ? 'Edit Bill' : 'Add Bill'}</Text>
          <View style={{ width: 28 }} />
        </View>

        <Text style={styles.label}>Bill Name</Text>
        <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="e.g. Meralco" placeholderTextColor={Theme.textMuted} />

        <Text style={styles.label}>Category</Text>
        <View style={styles.categoryGrid}>
          {BILL_CATEGORIES.map((c) => (
            <TouchableOpacity
              key={c}
              style={[styles.categoryPill, category === c && { borderColor: BillCategoryColors[c], borderWidth: 2 }]}
              onPress={() => setCategory(c)}
            >
              <Ionicons name={BillCategoryIcons[c] as any} size={16} color={BillCategoryColors[c]} />
              <Text style={styles.categoryPillText}>{c}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Amount</Text>
        <View style={styles.costRow}>
          <Text style={styles.dollarSign}>{currency.symbol}</Text>
          <TextInput style={[styles.input, { flex: 1 }]} value={amount} onChangeText={setAmount} placeholder="0.00" placeholderTextColor={Theme.textMuted} keyboardType="decimal-pad" />
        </View>

        <Text style={styles.label}>Frequency</Text>
        <View style={styles.segmented}>
          {FREQUENCIES.map((f) => (
            <TouchableOpacity key={f.value} style={[styles.segment, frequency === f.value && styles.segmentActive]} onPress={() => setFrequency(f.value)}>
              <Text style={[styles.segmentText, frequency === f.value && styles.segmentTextActive]}>{f.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <DayPickerField
          label="Due Date"
          helperText="Day of the month when this bill is due for payment."
          value={dueDate}
          onChange={setDueDate}
        />

        <View style={styles.switchRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.switchLabel}>Auto-pay enabled</Text>
            <Text style={styles.switchSub}>Bill is automatically paid</Text>
          </View>
          <Switch
            value={autoPay}
            onValueChange={setAutoPay}
            trackColor={{ false: '#333', true: Theme.accent + '88' }}
            thumbColor={autoPay ? Theme.accent : '#666'}
          />
        </View>

        <View style={styles.switchRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.switchLabel}>Track spending</Text>
            <Text style={styles.switchSub}>Log daily expenses against this amount</Text>
          </View>
          <Switch
            value={trackSpending}
            onValueChange={setTrackSpending}
            trackColor={{ false: '#333', true: '#6BCB7788' }}
            thumbColor={trackSpending ? '#6BCB77' : '#666'}
          />
        </View>

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
          <Text style={styles.saveText}>{isEdit ? 'Save Changes' : 'Add Bill'}</Text>
        </TouchableOpacity>

        {isEdit && (
          <TouchableOpacity style={styles.deleteButton} onPress={() => setShowDeleteModal(true)}>
            <Ionicons name="trash-outline" size={18} color={Theme.accentSecondary} />
            <Text style={styles.deleteText}>Delete Bill</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      <ConfirmModal
        visible={showDeleteModal}
        icon="trash-outline"
        iconColor={Theme.accentSecondary}
        title="Delete Bill"
        message={`Are you sure you want to delete "${existing?.name}"?`}
        confirmText="Delete"
        confirmColor={Theme.accentSecondary}
        onConfirm={() => {
          if (existing) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            deleteBill(existing.id);
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
  costRow: { flexDirection: 'row', alignItems: 'center' },
  dollarSign: { fontSize: 18, fontWeight: '600', color: Theme.textMuted, marginRight: 8 },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  categoryPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20,
    backgroundColor: Theme.inputBg, borderWidth: 1, borderColor: Theme.inputBorder,
  },
  categoryPillText: { fontSize: 13, color: Theme.textBody },
  segmented: { flexDirection: 'row', backgroundColor: Theme.inputBg, borderRadius: Theme.borderRadius.input, borderWidth: 1, borderColor: Theme.inputBorder, overflow: 'hidden' },
  segment: { flex: 1, paddingVertical: 10, alignItems: 'center' },
  segmentActive: { backgroundColor: Theme.accent + '33' },
  segmentText: { fontSize: 12, color: Theme.textMuted },
  segmentTextActive: { color: Theme.accent, fontWeight: '600' },
  switchRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 20,
    backgroundColor: Theme.cardBg, borderWidth: 1, borderColor: Theme.cardBorder,
    borderRadius: Theme.borderRadius.card, padding: 16, gap: 12,
  },
  switchLabel: { fontSize: 15, fontWeight: '500', color: Theme.textPrimary },
  switchSub: { fontSize: 11, color: Theme.textMuted, marginTop: 2, lineHeight: 15 },
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
