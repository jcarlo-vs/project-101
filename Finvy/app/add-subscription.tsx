import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { ConfirmModal } from '@/components/confirm-modal';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { useSubscriptions } from '@/context/SubscriptionContext';
import { useCurrency } from '@/context/CurrencyContext';
import {
  Theme,
  CategoryColors,
  CategoryIcons,
  REMINDER_OPTIONS,
  type CategoryType,
  type BillingCycle,
  type ReminderOffset,
  type Subscription,
} from '@/constants/theme';
import { scheduleRenewalReminder } from '@/utils/notifications';
import { DatePickerField } from '@/components/date-picker-field';

const CATEGORIES: CategoryType[] = [
  'Streaming', 'Music', 'Software', 'Gaming', 'Cloud', 'News', 'Fitness', 'Other',
];

const CYCLES: BillingCycle[] = ['weekly', 'monthly', 'yearly'];

function todayISO(): string {
  return new Date().toISOString().split('T')[0];
}

export default function AddSubscriptionScreen() {
  const { top } = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { subscriptions, addSubscription, updateSubscription, deleteSubscription } = useSubscriptions();
  const { currency } = useCurrency();

  const existing = id ? subscriptions.find((s) => s.id === id) : undefined;
  const isEdit = !!existing;

  const [name, setName] = useState('');
  const [cost, setCost] = useState('');
  const [cycle, setCycle] = useState<BillingCycle>('monthly');
  const [category, setCategory] = useState<CategoryType>('Other');
  const [nextBillingDate, setNextBillingDate] = useState(todayISO());
  const [lastUsed, setLastUsed] = useState(todayISO());
  const [notes, setNotes] = useState('');
  const [reminderOffset, setReminderOffset] = useState<ReminderOffset>(1);

  useEffect(() => {
    if (existing) {
      setName(existing.name);
      setCost(existing.cost.toString());
      setCycle(existing.cycle);
      setCategory(existing.category);
      setNextBillingDate(existing.nextBillingDate);
      setLastUsed(existing.lastUsed);
      setNotes(existing.notes ?? '');
      setReminderOffset(existing.reminderOffset);
    }
  }, [existing]);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Name required', 'Please enter a subscription name.');
      return;
    }
    const parsedCost = parseFloat(cost);
    if (!cost || isNaN(parsedCost) || parsedCost <= 0) {
      Alert.alert('Invalid cost', 'Please enter a valid cost greater than 0.');
      return;
    }

    const sub: Omit<Subscription, 'id'> = {
      name: name.trim(),
      cost: parsedCost,
      cycle,
      category,
      startDate: existing?.startDate ?? todayISO(),
      nextBillingDate,
      lastUsed,
      active: existing?.active ?? true,
      notes: notes.trim() || undefined,
      reminderOffset,
    };

    if (isEdit && existing) {
      updateSubscription({ ...sub, id: existing.id });
    } else {
      addSubscription(sub);
    }

    if (reminderOffset !== -1) {
      const full: Subscription = isEdit && existing
        ? { ...sub, id: existing.id }
        : { ...sub, id: 'temp' };
      await scheduleRenewalReminder(full).catch(() => {});
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.back();
  };

  const [showDeleteModal, setShowDeleteModal] = useState(false);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: top + 12 }]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="close" size={28} color={Theme.textMuted} />
          </TouchableOpacity>
          <Text style={styles.title}>{isEdit ? 'Edit Subscription' : 'Add Subscription'}</Text>
          <View style={{ width: 28 }} />
        </View>

        {/* Name */}
        <Text style={styles.label}>Name</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="e.g. Netflix"
          placeholderTextColor={Theme.textMuted}
        />

        {/* Cost */}
        <Text style={styles.label}>Cost</Text>
        <View style={styles.costRow}>
          <Text style={styles.dollarSign}>{currency.symbol}</Text>
          <TextInput
            style={[styles.input, styles.costInput]}
            value={cost}
            onChangeText={setCost}
            placeholder="0.00"
            placeholderTextColor={Theme.textMuted}
            keyboardType="decimal-pad"
          />
        </View>

        {/* Billing Cycle */}
        <Text style={styles.label}>Billing Cycle</Text>
        <View style={styles.segmented}>
          {CYCLES.map((c) => (
            <TouchableOpacity
              key={c}
              style={[styles.segment, cycle === c && styles.segmentActive]}
              onPress={() => setCycle(c)}
            >
              <Text style={[styles.segmentText, cycle === c && styles.segmentTextActive]}>
                {c.charAt(0).toUpperCase() + c.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Category */}
        <Text style={styles.label}>Category</Text>
        <View style={styles.categoryGrid}>
          {CATEGORIES.map((c) => (
            <TouchableOpacity
              key={c}
              style={[
                styles.categoryPill,
                category === c && { borderColor: CategoryColors[c], borderWidth: 2 },
              ]}
              onPress={() => setCategory(c)}
            >
              <Ionicons name={CategoryIcons[c] as any} size={18} color={CategoryColors[c]} />
              <Text style={styles.categoryPillText}>{c}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Next Billing Date */}
        <DatePickerField
          label="Next Billing Date"
          helperText="When is your next payment due?"
          value={nextBillingDate}
          onChange={setNextBillingDate}
        />

        {/* Last Used */}
        <DatePickerField
          label="Last Used"
          helperText="When did you last use this subscription?"
          value={lastUsed}
          onChange={setLastUsed}
        />

        {/* Reminder */}
        <Text style={styles.label}>Remind me</Text>
        <View style={styles.reminderGrid}>
          {REMINDER_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              style={[
                styles.reminderPill,
                reminderOffset === opt.value && styles.reminderPillActive,
              ]}
              onPress={() => setReminderOffset(opt.value)}
            >
              <Ionicons
                name={opt.value === -1 ? 'notifications-off-outline' : 'notifications-outline'}
                size={16}
                color={reminderOffset === opt.value ? Theme.accent : Theme.textMuted}
              />
              <Text
                style={[
                  styles.reminderPillText,
                  reminderOffset === opt.value && styles.reminderPillTextActive,
                ]}
              >
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Notes */}
        <Text style={styles.label}>Notes (optional)</Text>
        <TextInput
          style={[styles.input, styles.notesInput]}
          value={notes}
          onChangeText={setNotes}
          placeholder="Any additional notes..."
          placeholderTextColor={Theme.textMuted}
          multiline
          textAlignVertical="top"
        />

        {/* Save Button */}
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveText}>{isEdit ? 'Save Changes' : 'Add Subscription'}</Text>
        </TouchableOpacity>

        {/* Delete Button */}
        {isEdit && (
          <TouchableOpacity style={styles.deleteButton} onPress={() => setShowDeleteModal(true)}>
            <Ionicons name="trash-outline" size={18} color={Theme.accentSecondary} />
            <Text style={styles.deleteText}>Delete Subscription</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Delete Confirmation */}
      <ConfirmModal
        visible={showDeleteModal}
        icon="trash-outline"
        iconColor={Theme.accentSecondary}
        title="Delete Subscription"
        message={`Are you sure you want to delete "${existing?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        confirmColor={Theme.accentSecondary}
        onConfirm={() => {
          if (existing) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            deleteSubscription(existing.id);
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
  container: {
    flex: 1,
    backgroundColor: Theme.bg,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: Theme.textPrimary,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    color: Theme.textMuted,
    marginBottom: 6,
    marginTop: 16,
  },
  input: {
    backgroundColor: Theme.inputBg,
    borderWidth: 1,
    borderColor: Theme.inputBorder,
    borderRadius: Theme.borderRadius.input,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 15,
    color: Theme.textPrimary,
  },
  costRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dollarSign: {
    fontSize: 18,
    fontWeight: '600',
    color: Theme.textMuted,
    marginRight: 8,
  },
  costInput: {
    flex: 1,
  },
  segmented: {
    flexDirection: 'row',
    backgroundColor: Theme.inputBg,
    borderRadius: Theme.borderRadius.input,
    borderWidth: 1,
    borderColor: Theme.inputBorder,
    overflow: 'hidden',
  },
  segment: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
  },
  segmentActive: {
    backgroundColor: Theme.accent + '33',
  },
  segmentText: {
    fontSize: 14,
    color: Theme.textMuted,
  },
  segmentTextActive: {
    color: Theme.accent,
    fontWeight: '600',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Theme.inputBg,
    borderWidth: 1,
    borderColor: Theme.inputBorder,
  },
  categoryPillText: {
    fontSize: 13,
    color: Theme.textBody,
  },
  reminderGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  reminderPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: Theme.inputBg,
    borderWidth: 1,
    borderColor: Theme.inputBorder,
  },
  reminderPillActive: {
    borderColor: Theme.accent + '66',
    backgroundColor: Theme.accent + '14',
  },
  reminderPillText: {
    fontSize: 13,
    color: Theme.textMuted,
  },
  reminderPillTextActive: {
    color: Theme.accent,
    fontWeight: '600',
  },
  notesInput: {
    height: 80,
    paddingTop: 11,
  },
  saveButton: {
    marginTop: 24,
    backgroundColor: Theme.accent,
    borderRadius: Theme.borderRadius.button,
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 16,
    paddingVertical: 12,
  },
  deleteText: {
    fontSize: 15,
    color: Theme.accentSecondary,
    fontWeight: '500',
  },
});
