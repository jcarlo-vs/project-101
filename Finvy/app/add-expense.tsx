import { useState, useMemo, useEffect } from 'react';
import {
  View, Text, TextInput, ScrollView, StyleSheet, TouchableOpacity,
  Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { useExpenses } from '@/context/ExpenseContext';
import { useBills } from '@/context/BillContext';
import { useCurrency } from '@/context/CurrencyContext';
import { useToast } from '@/context/ToastContext';
import { ConfirmModal } from '@/components/confirm-modal';
import {
  Theme, ExpenseCategoryColors, ExpenseCategoryIcons, EXPENSE_CATEGORIES, Fonts,
  type ExpenseCategory,
} from '@/constants/theme';
import { formatCurrency } from '@/utils/calculations';
import { getCategorySpending } from '@/utils/budget-calculations';
import { getMonthlyBillCost } from '@/utils/bill-calculations';

function todayISO(): string {
  return new Date().toISOString().split('T')[0];
}

export default function AddExpenseScreen() {
  const { top } = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { expenses, addExpense, updateExpense, deleteExpense } = useExpenses();
  const { bills } = useBills();
  const { currency } = useCurrency();
  const { showToast } = useToast();
  const sym = currency.symbol;

  const existing = id ? expenses.find((e) => e.id === id) : undefined;
  const isEdit = !!existing;

  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<ExpenseCategory | null>(null);
  const [note, setNote] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    if (existing) {
      setAmount(existing.amount.toString());
      setCategory(existing.category);
      setNote(existing.note ?? '');
    }
  }, [existing]);

  // Budget bills (trackSpending=true) with remaining amounts
  const budgetBills = useMemo(() => {
    const spending = getCategorySpending(expenses, bills);
    return bills
      .filter((b) => b.active && b.trackSpending)
      .map((b) => {
        const cat = b.category as ExpenseCategory;
        const found = spending.find((s) => s.category === cat);
        const limit = getMonthlyBillCost(b);
        const spent = found?.spent ?? 0;
        const remaining = Math.max(0, limit - spent);
        return { bill: b, category: cat, limit, spent, remaining };
      });
  }, [bills, expenses]);

  // Non-budget categories (exclude ones already covered by budget bills)
  const budgetCategories = useMemo(() => new Set(budgetBills.map((b) => b.category)), [budgetBills]);
  const otherCategories = useMemo(
    () => EXPENSE_CATEGORIES.filter((c) => !budgetCategories.has(c)),
    [budgetCategories],
  );

  const handleSave = () => {
    const parsed = parseFloat(amount);
    if (!amount || isNaN(parsed) || parsed <= 0) {
      Alert.alert('Invalid amount', 'Please enter a valid amount.');
      return;
    }
    if (!category) {
      Alert.alert('Category required', 'Please select a category.');
      return;
    }

    if (isEdit && existing) {
      updateExpense({
        ...existing,
        amount: parsed,
        category,
        note: note.trim() || undefined,
      });
    } else {
      addExpense({
        amount: parsed,
        category,
        note: note.trim() || undefined,
        date: todayISO(),
      });
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    showToast(isEdit ? 'Expense updated' : 'Expense logged');
    router.back();
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: top + 12 }]} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="close" size={28} color={Theme.textMuted} />
          </TouchableOpacity>
          <Text style={styles.title}>{isEdit ? 'Edit Expense' : 'Log Expense'}</Text>
          <View style={{ width: 28 }} />
        </View>

        {/* Amount */}
        <View style={styles.amountSection}>
          <Text style={styles.currencySymbol}>{sym}</Text>
          <TextInput
            style={styles.amountInput}
            value={amount}
            onChangeText={setAmount}
            placeholder="0"
            placeholderTextColor={Theme.textMuted}
            keyboardType="decimal-pad"
            autoFocus
          />
        </View>

        {/* Budget Categories — shown first */}
        {budgetBills.length > 0 && (
          <>
            <Text style={styles.label}>Your Budgets</Text>
            {budgetBills.map(({ bill, category: cat, remaining, limit, spent }) => {
              const isSelected = category === cat;
              const pct = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0;
              return (
                <TouchableOpacity
                  key={bill.id}
                  style={[styles.budgetRow, isSelected && styles.budgetRowSelected]}
                  onPress={() => setCategory(cat)}
                >
                  <View style={styles.budgetLeft}>
                    {isSelected ? (
                      <View style={styles.radioSelected}>
                        <View style={styles.radioDot} />
                      </View>
                    ) : (
                      <View style={styles.radio} />
                    )}
                    <Ionicons name={ExpenseCategoryIcons[cat] as any} size={18} color={ExpenseCategoryColors[cat]} />
                    <View style={styles.budgetInfo}>
                      <Text style={styles.budgetName}>{bill.name}</Text>
                      <View style={styles.budgetBarTrack}>
                        <View style={[styles.budgetBarFill, {
                          width: `${pct}%`,
                          backgroundColor: pct > 90 ? '#FF6B6B' : pct > 70 ? '#FFB347' : ExpenseCategoryColors[cat],
                        }]} />
                      </View>
                    </View>
                  </View>
                  <View style={styles.budgetRight}>
                    <Text style={[styles.budgetRemaining, remaining === 0 && { color: '#FF6B6B' }]}>
                      {formatCurrency(remaining, sym)}
                    </Text>
                    <Text style={styles.budgetLimit}>left of {formatCurrency(limit, sym)}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </>
        )}

        {/* Other Categories */}
        <Text style={styles.label}>{budgetBills.length > 0 ? 'Other Categories' : 'Category'}</Text>
        <View style={styles.categoryGrid}>
          {otherCategories.map((c) => (
            <TouchableOpacity
              key={c}
              style={[styles.categoryPill, category === c && { borderColor: ExpenseCategoryColors[c], borderWidth: 2 }]}
              onPress={() => setCategory(c)}
            >
              <Ionicons name={ExpenseCategoryIcons[c] as any} size={16} color={ExpenseCategoryColors[c]} />
              <Text style={styles.categoryPillText}>{c}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Note */}
        <Text style={styles.label}>Note (optional)</Text>
        <TextInput
          style={styles.input}
          value={note}
          onChangeText={setNote}
          placeholder="What was this for?"
          placeholderTextColor={Theme.textMuted}
        />

        <TouchableOpacity style={[styles.saveButton, !category && styles.saveButtonDisabled]} onPress={handleSave}>
          <Text style={styles.saveText}>{isEdit ? 'Save Changes' : 'Log Expense'}</Text>
        </TouchableOpacity>

        {isEdit && (
          <TouchableOpacity style={styles.deleteButton} onPress={() => setShowDeleteModal(true)}>
            <Ionicons name="trash-outline" size={18} color={Theme.accentSecondary} />
            <Text style={styles.deleteText}>Delete Expense</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      <ConfirmModal
        visible={showDeleteModal}
        icon="trash-outline"
        iconColor={Theme.accentSecondary}
        title="Delete Expense"
        message="Are you sure you want to delete this expense?"
        confirmText="Delete"
        confirmColor={Theme.accentSecondary}
        onConfirm={() => {
          if (existing) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            deleteExpense(existing.id);
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
  amountSection: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 24, gap: 4,
  },
  currencySymbol: { fontSize: 32, fontWeight: '300', color: Theme.textMuted },
  amountInput: {
    fontSize: 48, fontWeight: '700', color: Theme.textPrimary,
    minWidth: 80, textAlign: 'center',
  },
  label: { fontSize: 13, fontWeight: '500', color: Theme.textMuted, marginBottom: 8, marginTop: 20 },
  input: {
    backgroundColor: Theme.inputBg, borderWidth: 1, borderColor: Theme.inputBorder,
    borderRadius: Theme.borderRadius.input, paddingHorizontal: 14, paddingVertical: 11,
    fontSize: 15, color: Theme.textPrimary,
  },

  // Budget rows
  budgetRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Theme.cardBg, borderWidth: 1, borderColor: Theme.cardBorder,
    borderRadius: 14, padding: 14, marginBottom: 8,
  },
  budgetRowSelected: {
    borderColor: Theme.accent + '66', backgroundColor: Theme.accent + '08',
  },
  budgetLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  radio: {
    width: 20, height: 20, borderRadius: 10,
    borderWidth: 2, borderColor: Theme.cardBorder,
  },
  radioSelected: {
    width: 20, height: 20, borderRadius: 10,
    borderWidth: 2, borderColor: Theme.accent,
    justifyContent: 'center', alignItems: 'center',
  },
  radioDot: {
    width: 10, height: 10, borderRadius: 5, backgroundColor: Theme.accent,
  },
  budgetInfo: { flex: 1 },
  budgetName: { fontSize: 14, fontWeight: '600', color: Theme.textPrimary, marginBottom: 4 },
  budgetBarTrack: { height: 4, backgroundColor: Theme.cardBorder, borderRadius: 2 },
  budgetBarFill: { height: 4, borderRadius: 2 },
  budgetRight: { alignItems: 'flex-end', marginLeft: 10 },
  budgetRemaining: { fontSize: 14, fontWeight: '700', fontFamily: Fonts?.mono, color: '#6BCB77' },
  budgetLimit: { fontSize: 10, color: Theme.textMuted, marginTop: 1 },

  // Generic categories
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  categoryPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20,
    backgroundColor: Theme.inputBg, borderWidth: 1, borderColor: Theme.inputBorder,
  },
  categoryPillText: { fontSize: 12, color: Theme.textBody },

  saveButton: {
    marginTop: 24, backgroundColor: Theme.accent,
    borderRadius: Theme.borderRadius.button, paddingVertical: 16, alignItems: 'center',
  },
  saveButtonDisabled: { opacity: 0.5 },
  saveText: { fontSize: 16, fontWeight: '700', color: '#FFF' },
  deleteButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 16, paddingVertical: 12 },
  deleteText: { fontSize: 15, color: Theme.accentSecondary, fontWeight: '500' },
});
