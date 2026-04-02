import { useState } from 'react';
import {
  View, Text, TextInput, ScrollView, StyleSheet, TouchableOpacity, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { useBudget } from '@/context/BudgetContext';
import { useCurrency } from '@/context/CurrencyContext';
import { ConfirmModal } from '@/components/confirm-modal';
import { Theme, Fonts, type IncomeFrequency } from '@/constants/theme';
import { formatCurrency } from '@/utils/calculations';
import { getMonthlyIncome } from '@/utils/budget-calculations';

const FREQUENCIES: { value: IncomeFrequency; label: string }[] = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
  { value: 'one-time', label: 'One-time' },
];

export default function ManageIncomeScreen() {
  const { top } = useSafeAreaInsets();
  const router = useRouter();
  const { incomeSources, addIncome, updateIncome, deleteIncome } = useBudget();
  const { currency } = useCurrency();
  const sym = currency.symbol;

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [frequency, setFrequency] = useState<IncomeFrequency>('monthly');
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const monthlyTotal = getMonthlyIncome(incomeSources);

  const openAdd = () => {
    setEditingId(null);
    setName('');
    setAmount('');
    setFrequency('monthly');
    setShowForm(true);
  };

  const openEdit = (id: string) => {
    const source = incomeSources.find((s) => s.id === id);
    if (!source) return;
    setEditingId(source.id);
    setName(source.name);
    setAmount(source.amount.toString());
    setFrequency(source.frequency);
    setShowForm(true);
  };

  const handleSave = () => {
    if (!name.trim()) { Alert.alert('Name required'); return; }
    const parsed = parseFloat(amount);
    if (!amount || isNaN(parsed) || parsed <= 0) { Alert.alert('Invalid amount'); return; }

    if (editingId) {
      updateIncome({ id: editingId, name: name.trim(), amount: parsed, frequency, active: true });
    } else {
      addIncome({ name: name.trim(), amount: parsed, frequency, active: true });
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setEditingId(null);
    setName('');
    setAmount('');
    setFrequency('monthly');
    setShowForm(false);
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditingId(null);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingTop: top + 12, paddingBottom: 40 }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color={Theme.textMuted} />
        </TouchableOpacity>
        <Text style={styles.title}>Income Sources</Text>
        <TouchableOpacity onPress={() => showForm ? cancelForm() : openAdd()}>
          <Ionicons name={showForm ? 'close' : 'add-circle-outline'} size={26} color={Theme.accent} />
        </TouchableOpacity>
      </View>

      <View style={styles.totalCard}>
        <Text style={styles.totalLabel}>MONTHLY INCOME</Text>
        <Text style={styles.totalAmount}>{formatCurrency(monthlyTotal, sym)}</Text>
      </View>

      {showForm && (
        <View style={styles.addForm}>
          <Text style={styles.formTitle}>{editingId ? 'Edit Income Source' : 'Add Income Source'}</Text>
          <Text style={styles.formLabel}>Source Name</Text>
          <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="e.g. Salary" placeholderTextColor={Theme.textMuted} />

          <Text style={styles.formLabel}>Amount</Text>
          <View style={styles.costRow}>
            <Text style={styles.dollarSign}>{sym}</Text>
            <TextInput style={[styles.input, { flex: 1 }]} value={amount} onChangeText={setAmount} placeholder="0.00" placeholderTextColor={Theme.textMuted} keyboardType="decimal-pad" />
          </View>

          <Text style={styles.formLabel}>Frequency</Text>
          <View style={styles.segmented}>
            {FREQUENCIES.map((f) => (
              <TouchableOpacity key={f.value} style={[styles.segment, frequency === f.value && styles.segmentActive]} onPress={() => setFrequency(f.value)}>
                <Text style={[styles.segmentText, frequency === f.value && styles.segmentTextActive]}>{f.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={styles.addButton} onPress={handleSave}>
            <Text style={styles.addButtonText}>{editingId ? 'Save Changes' : 'Add Income Source'}</Text>
          </TouchableOpacity>
        </View>
      )}

      {incomeSources.map((source) => (
        <TouchableOpacity key={source.id} style={styles.sourceRow} onPress={() => openEdit(source.id)}>
          <Ionicons name="cash-outline" size={20} color="#6BCB77" />
          <View style={styles.sourceInfo}>
            <Text style={styles.sourceName}>{source.name}</Text>
            <Text style={styles.sourceFreq}>{source.frequency}</Text>
          </View>
          <Text style={styles.sourceAmount}>{formatCurrency(source.amount, sym)}</Text>
          <TouchableOpacity onPress={() => setDeleteTarget(source.id)} style={styles.deleteBtn}>
            <Ionicons name="close-circle-outline" size={20} color={Theme.textMuted} />
          </TouchableOpacity>
        </TouchableOpacity>
      ))}

      {incomeSources.length === 0 && !showForm && (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No income sources. Tap + to add one.</Text>
        </View>
      )}

      <ConfirmModal
        visible={!!deleteTarget}
        icon="cash-outline"
        iconColor={Theme.accentSecondary}
        title="Remove Income Source"
        message="Are you sure you want to remove this income source?"
        confirmText="Remove"
        confirmColor={Theme.accentSecondary}
        onConfirm={() => {
          if (deleteTarget) deleteIncome(deleteTarget);
          setDeleteTarget(null);
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.bg },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, marginBottom: 20,
  },
  title: { fontSize: 18, fontWeight: '600', color: Theme.textPrimary },
  totalCard: {
    backgroundColor: '#6BCB7712', borderWidth: 1, borderColor: '#6BCB7733',
    borderRadius: Theme.borderRadius.card, padding: 20, marginHorizontal: 20, marginBottom: 20,
    alignItems: 'center',
  },
  totalLabel: { fontSize: 11, fontFamily: Fonts?.mono, color: '#6BCB77', letterSpacing: 1, marginBottom: 6 },
  totalAmount: { fontSize: 28, fontWeight: '700', fontFamily: Fonts?.mono, color: '#6BCB77' },
  addForm: {
    backgroundColor: Theme.cardBg, borderWidth: 1, borderColor: Theme.cardBorder,
    borderRadius: Theme.borderRadius.card, padding: 16, marginHorizontal: 20, marginBottom: 20,
  },
  formTitle: { fontSize: 15, fontWeight: '600', color: Theme.textPrimary, marginBottom: 6 },
  formLabel: { fontSize: 12, fontWeight: '500', color: Theme.textMuted, marginBottom: 4, marginTop: 10 },
  input: {
    backgroundColor: Theme.inputBg, borderWidth: 1, borderColor: Theme.inputBorder,
    borderRadius: Theme.borderRadius.input, paddingHorizontal: 12, paddingVertical: 10,
    fontSize: 14, color: Theme.textPrimary,
  },
  costRow: { flexDirection: 'row', alignItems: 'center' },
  dollarSign: { fontSize: 16, fontWeight: '600', color: Theme.textMuted, marginRight: 8 },
  segmented: {
    flexDirection: 'row', backgroundColor: Theme.inputBg, borderRadius: Theme.borderRadius.input,
    borderWidth: 1, borderColor: Theme.inputBorder, overflow: 'hidden',
  },
  segment: { flex: 1, paddingVertical: 8, alignItems: 'center' },
  segmentActive: { backgroundColor: Theme.accent + '33' },
  segmentText: { fontSize: 12, color: Theme.textMuted },
  segmentTextActive: { color: Theme.accent, fontWeight: '600' },
  addButton: {
    marginTop: 14, backgroundColor: '#6BCB77', borderRadius: Theme.borderRadius.button,
    paddingVertical: 12, alignItems: 'center',
  },
  addButtonText: { fontSize: 14, fontWeight: '700', color: '#FFF' },
  sourceRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    marginHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: Theme.separator,
  },
  sourceInfo: { flex: 1 },
  sourceName: { fontSize: 15, fontWeight: '600', color: Theme.textPrimary },
  sourceFreq: { fontSize: 11, color: Theme.textMuted, marginTop: 2 },
  sourceAmount: { fontSize: 15, fontWeight: '600', fontFamily: Fonts?.mono, color: '#6BCB77' },
  deleteBtn: { padding: 4 },
  empty: { alignItems: 'center', paddingTop: 40 },
  emptyText: { fontSize: 14, color: Theme.textMuted },
});
