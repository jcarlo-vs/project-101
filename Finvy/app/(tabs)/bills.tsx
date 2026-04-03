import { useState, useMemo, useCallback } from 'react';
import { View, Text, FlatList, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { useBills } from '@/context/BillContext';
import { useCurrency } from '@/context/CurrencyContext';
import { ConfirmModal } from '@/components/confirm-modal';
import { SelectionBar } from '@/components/selection-bar';
import { useBulkSelect } from '@/hooks/use-bulk-select';
import {
  Theme, BillCategoryColors, BillCategoryIcons, BILL_CATEGORIES, Fonts,
  type BillCategory, type Bill,
} from '@/constants/theme';
import { formatCurrency } from '@/utils/calculations';
import { getDaysUntilDue, frequencyLabel } from '@/utils/bill-calculations';

type FilterType = 'all' | 'active' | 'inactive';

export default function BillsScreen() {
  const { top } = useSafeAreaInsets();
  const router = useRouter();
  const { bills, deleteBill } = useBills();
  const { currency } = useCurrency();
  const sym = currency.symbol;
  const bulk = useBulkSelect();

  const [filter, setFilter] = useState<FilterType>('all');
  const [categoryFilter, setCategoryFilter] = useState<BillCategory | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Bill | null>(null);
  const [showBulkDelete, setShowBulkDelete] = useState(false);

  const filtered = useMemo(() => {
    let result = bills;
    if (filter === 'active') result = result.filter((b) => b.active);
    if (filter === 'inactive') result = result.filter((b) => !b.active);
    if (categoryFilter) result = result.filter((b) => b.category === categoryFilter);
    return result;
  }, [bills, filter, categoryFilter]);

  const renderItem = useCallback(
    ({ item: bill }: { item: Bill }) => {
      const days = getDaysUntilDue(bill);
      const freq = frequencyLabel(bill.frequency);
      const isSelected = bulk.selectedIds.has(bill.id);

      return (
        <TouchableOpacity
          style={[styles.card, !bill.active && styles.cardInactive, isSelected && styles.cardSelected]}
          onLongPress={() => bulk.startSelecting(bill.id)}
          onPress={() => bulk.isSelecting ? bulk.toggleItem(bill.id) : router.push({ pathname: '/add-bill', params: { id: bill.id } })}
          activeOpacity={bulk.isSelecting ? 0.7 : 1}
        >
          <View style={styles.cardTop}>
            {bulk.isSelecting ? (
              <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                {isSelected && <Ionicons name="checkmark" size={16} color="#FFF" />}
              </View>
            ) : (
              <View style={[styles.catIcon, { backgroundColor: BillCategoryColors[bill.category] + '22' }]}>
                <Ionicons name={BillCategoryIcons[bill.category] as any} size={22} color={BillCategoryColors[bill.category]} />
              </View>
            )}
            <View style={styles.cardInfo}>
              <View style={styles.nameRow}>
                <Text style={[styles.cardName, !bill.active && styles.textInactive]}>{bill.name}</Text>
                {bill.autoPay && (
                  <View style={styles.autoPayBadge}><Text style={styles.autoPayText}>AUTO</Text></View>
                )}
              </View>
              <Text style={styles.cardSub}>
                {bill.category} · {bill.frequency}{bill.active ? ` · Due in ${days}d` : ''}
              </Text>
            </View>
            <Text style={[styles.cardCost, !bill.active && styles.textInactive]} numberOfLines={1}>
              {formatCurrency(bill.amount, sym)}{freq}
            </Text>
          </View>
          {!bulk.isSelecting && (
            <View style={styles.actions}>
              <TouchableOpacity style={styles.actionBtn} onPress={() => router.push({ pathname: '/add-bill', params: { id: bill.id } })}>
                <Ionicons name="pencil-outline" size={16} color={Theme.textMuted} />
                <Text style={styles.actionText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn} onPress={() => setDeleteTarget(bill)}>
                <Ionicons name="trash-outline" size={16} color={Theme.accentSecondary} />
                <Text style={[styles.actionText, { color: Theme.accentSecondary }]}>Delete</Text>
              </TouchableOpacity>
            </View>
          )}
        </TouchableOpacity>
      );
    },
    [router, sym, bulk],
  );

  return (
    <View style={[styles.container, { paddingTop: top + 16 }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Bills</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => router.push('/add-bill')}>
          <Ionicons name="add" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
          {(['all', 'active', 'inactive'] as FilterType[]).map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.pill, filter === f && !categoryFilter && styles.pillActive]}
              onPress={() => { setFilter(f); setCategoryFilter(null); }}
            >
              <Text style={[styles.pillText, filter === f && !categoryFilter && styles.pillTextActive]}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
          <View style={styles.pillSpacer} />
          {BILL_CATEGORIES.filter((c) => bills.some((b) => b.category === c)).map((c) => (
            <TouchableOpacity
              key={c}
              style={[styles.pill, categoryFilter === c && styles.pillActive]}
              onPress={() => setCategoryFilter(categoryFilter === c ? null : c)}
            >
              <View style={[styles.pillDot, { backgroundColor: BillCategoryColors[c] }]} />
              <Text style={[styles.pillText, categoryFilter === c && styles.pillTextActive]}>{c}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="receipt-outline" size={48} color={Theme.textMuted} />
            <Text style={styles.emptyText}>
              {bills.length === 0 ? 'No bills yet. Tap + to add one.' : 'No bills match this filter.'}
            </Text>
          </View>
        }
      />

      {bulk.isSelecting && (
        <SelectionBar
          count={bulk.selectedCount}
          totalCount={filtered.length}
          onSelectAll={() => bulk.selectedCount === filtered.length ? bulk.cancelSelection() : bulk.selectAll(filtered.map((b) => b.id))}
          onDelete={() => setShowBulkDelete(true)}
          onCancel={bulk.cancelSelection}
        />
      )}

      <ConfirmModal
        visible={showBulkDelete}
        icon="trash-outline"
        iconColor={Theme.accentSecondary}
        title={`Delete ${bulk.selectedCount} bill${bulk.selectedCount !== 1 ? 's' : ''}?`}
        message="Payment history will be lost."
        confirmText="Delete All"
        confirmColor={Theme.accentSecondary}
        onConfirm={() => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          for (const id of bulk.selectedIds) deleteBill(id);
          bulk.clearAfterAction();
          setShowBulkDelete(false);
        }}
        onCancel={() => setShowBulkDelete(false)}
      />

      <ConfirmModal
        visible={!!deleteTarget}
        icon="trash-outline"
        iconColor={Theme.accentSecondary}
        title="Delete Bill"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? Payment history will be lost.`}
        confirmText="Delete"
        confirmColor={Theme.accentSecondary}
        onConfirm={() => {
          if (deleteTarget) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            deleteBill(deleteTarget.id);
          }
          setDeleteTarget(null);
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.bg },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, marginBottom: 16,
  },
  title: { fontSize: 26, fontWeight: '700', color: Theme.textPrimary },
  addButton: {
    width: 44, height: 44, borderRadius: Theme.borderRadius.button,
    backgroundColor: Theme.accent, justifyContent: 'center', alignItems: 'center',
  },
  filterContainer: { height: 48 },
  filters: { paddingHorizontal: 20, gap: 8, alignItems: 'center', height: 48 },
  pill: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
  },
  pillActive: { backgroundColor: 'rgba(255,255,255,0.08)' },
  pillText: { fontSize: 13, color: '#555' },
  pillTextActive: { color: Theme.textPrimary },
  pillDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  pillSpacer: { width: 1, height: 24, backgroundColor: Theme.cardBorder, marginHorizontal: 4 },
  list: { paddingHorizontal: 20, paddingBottom: 100 },
  card: {
    backgroundColor: Theme.cardBg, borderWidth: 1, borderColor: Theme.cardBorder,
    borderRadius: Theme.borderRadius.card, padding: 16, marginBottom: 12,
  },
  cardInactive: { opacity: 0.45 },
  cardSelected: { borderColor: Theme.accent + '66', backgroundColor: Theme.accent + '08' },
  checkbox: {
    width: 44, height: 44, borderRadius: 13, borderWidth: 2, borderColor: Theme.cardBorder,
    justifyContent: 'center', alignItems: 'center',
  },
  checkboxSelected: { backgroundColor: Theme.accent, borderColor: Theme.accent },
  cardTop: { flexDirection: 'row', alignItems: 'center' },
  catIcon: { width: 44, height: 44, borderRadius: 13, justifyContent: 'center', alignItems: 'center' },
  cardInfo: { flex: 1, marginLeft: 12 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardName: { fontSize: 15, fontWeight: '600', color: Theme.textPrimary },
  autoPayBadge: {
    backgroundColor: '#6BCB7722', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4,
  },
  autoPayText: { fontSize: 9, fontWeight: '700', color: '#6BCB77', letterSpacing: 0.5 },
  textInactive: { opacity: 0.7 },
  cardSub: { fontSize: 11, color: Theme.textMuted, marginTop: 2 },
  cardCost: { fontSize: 16, fontWeight: '700', fontFamily: Fonts?.mono, color: Theme.textPrimary, textAlign: 'right' },
  actions: {
    flexDirection: 'row', gap: 16, marginTop: 12, paddingTop: 12,
    borderTopWidth: 1, borderTopColor: Theme.separator,
  },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  actionText: { fontSize: 12, color: Theme.textMuted },
  empty: { alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 12 },
  emptyText: { fontSize: 14, color: Theme.textMuted, textAlign: 'center' },
});
