import { useState, useMemo, useCallback } from 'react';
import { View, Text, FlatList, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { useCreditCards } from '@/context/CreditCardContext';
import { useCurrency } from '@/context/CurrencyContext';
import { ConfirmModal } from '@/components/confirm-modal';
import { SelectionBar } from '@/components/selection-bar';
import { CreditCardVisual } from '@/components/credit-card-visual';
import { useBulkSelect } from '@/hooks/use-bulk-select';
import { Theme, Fonts, type CreditCard } from '@/constants/theme';
import { formatCurrency } from '@/utils/calculations';
import { getUtilizationRate, getDaysUntilDue, getUtilizationColor } from '@/utils/credit-card-calculations';

type FilterType = 'all' | 'active' | 'inactive';

export default function CreditCardsScreen() {
  const { top } = useSafeAreaInsets();
  const router = useRouter();
  const { creditCards, deleteCreditCard } = useCreditCards();
  const { currency } = useCurrency();
  const sym = currency.symbol;
  const bulk = useBulkSelect();

  const [filter, setFilter] = useState<FilterType>('all');
  const [deleteTarget, setDeleteTarget] = useState<CreditCard | null>(null);
  const [showBulkDelete, setShowBulkDelete] = useState(false);

  const filtered = useMemo(() => {
    if (filter === 'active') return creditCards.filter((c) => c.active);
    if (filter === 'inactive') return creditCards.filter((c) => !c.active);
    return creditCards;
  }, [creditCards, filter]);

  const renderItem = useCallback(
    ({ item: card }: { item: CreditCard }) => {
      const util = getUtilizationRate(card);
      const daysUntilDue = getDaysUntilDue(card);
      const utilColor = getUtilizationColor(util);

      const isSelected = bulk.selectedIds.has(card.id);

      return (
        <TouchableOpacity
          style={[styles.card, !card.active && styles.cardInactive, isSelected && styles.cardSelected]}
          onLongPress={() => bulk.startSelecting(card.id)}
          onPress={() => bulk.isSelecting ? bulk.toggleItem(card.id) : router.push({ pathname: '/credit-card-detail', params: { id: card.id } })}
          activeOpacity={0.7}
        >
          <View style={styles.cardTop}>
            {bulk.isSelecting ? (
              <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                {isSelected && <Ionicons name="checkmark" size={16} color="#FFF" />}
              </View>
            ) : (
              <CreditCardVisual card={card} size="small" />
            )}
            <View style={styles.cardInfo}>
              <Text style={styles.cardName}>{card.name}</Text>
              <Text style={styles.cardIssuer}>{card.issuer} · {card.network}</Text>
              <View style={styles.dueRow}>
                <Ionicons name="calendar-outline" size={12} color={daysUntilDue <= 3 ? '#FF6B6B' : Theme.textMuted} />
                <Text style={[styles.dueText, daysUntilDue <= 3 && { color: '#FF6B6B' }]}>Due in {daysUntilDue}d</Text>
              </View>
            </View>
          </View>

          <View style={styles.balanceRow}>
            <View>
              <Text style={styles.balanceLabel}>Balance</Text>
              <Text style={styles.balanceAmount}>{formatCurrency(card.currentBalance, sym)}</Text>
            </View>
            <View style={styles.utilSection}>
              <Text style={[styles.utilPercent, { color: utilColor }]}>{util.toFixed(0)}%</Text>
              <View style={styles.utilTrack}>
                <View style={[styles.utilFill, { width: `${Math.min(util, 100)}%`, backgroundColor: utilColor }]} />
              </View>
              <Text style={styles.limitText}>of {formatCurrency(card.creditLimit, sym)}</Text>
            </View>
          </View>

          {!bulk.isSelecting && (
            <View style={styles.actions}>
              <TouchableOpacity style={styles.actionBtn} onPress={() => router.push({ pathname: '/add-credit-card', params: { id: card.id } })}>
                <Ionicons name="pencil-outline" size={16} color={Theme.textMuted} />
                <Text style={styles.actionText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn} onPress={() => router.push({ pathname: '/credit-card-detail', params: { id: card.id } })}>
                <Ionicons name="cash-outline" size={16} color="#6BCB77" />
                <Text style={[styles.actionText, { color: '#6BCB77' }]}>Pay</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn} onPress={() => setDeleteTarget(card)}>
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
        <Text style={styles.title}>Credit Cards</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push('/add-credit-card')}
        >
          <Ionicons name="add" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      {/* Filters */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
          {(['all', 'active', 'inactive'] as FilterType[]).map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.pill, filter === f && styles.pillActive]}
              onPress={() => setFilter(f)}
            >
              <Text style={[styles.pillText, filter === f && styles.pillTextActive]}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </Text>
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
            <Ionicons name="wallet-outline" size={48} color={Theme.textMuted} />
            <Text style={styles.emptyText}>
              {creditCards.length === 0
                ? 'No credit cards yet. Tap + to add one.'
                : 'No cards match this filter.'}
            </Text>
          </View>
        }
      />

      {bulk.isSelecting && (
        <SelectionBar
          count={bulk.selectedCount}
          totalCount={filtered.length}
          onSelectAll={() => bulk.selectedCount === filtered.length ? bulk.cancelSelection() : bulk.selectAll(filtered.map((c) => c.id))}
          onDelete={() => setShowBulkDelete(true)}
          onCancel={bulk.cancelSelection}
        />
      )}

      <ConfirmModal
        visible={showBulkDelete}
        icon="trash-outline"
        iconColor={Theme.accentSecondary}
        title={`Delete ${bulk.selectedCount} card${bulk.selectedCount !== 1 ? 's' : ''}?`}
        message="All payment history will be lost."
        confirmText="Delete All"
        confirmColor={Theme.accentSecondary}
        onConfirm={() => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          for (const id of bulk.selectedIds) deleteCreditCard(id);
          bulk.clearAfterAction();
          setShowBulkDelete(false);
        }}
        onCancel={() => setShowBulkDelete(false)}
      />

      <ConfirmModal
        visible={!!deleteTarget}
        icon="trash-outline"
        iconColor={Theme.accentSecondary}
        title="Delete Credit Card"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? All payment history will be lost.`}
        confirmText="Delete"
        confirmColor={Theme.accentSecondary}
        onConfirm={() => {
          if (deleteTarget) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            deleteCreditCard(deleteTarget.id);
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
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: 'transparent',
  },
  pillActive: { backgroundColor: 'rgba(255,255,255,0.08)' },
  pillText: { fontSize: 13, color: '#555' },
  pillTextActive: { color: Theme.textPrimary },
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
  cardTop: { flexDirection: 'row', gap: 14, marginBottom: 14 },
  cardInfo: { flex: 1, justifyContent: 'center' },
  cardName: { fontSize: 15, fontWeight: '600', color: Theme.textPrimary },
  cardIssuer: { fontSize: 11, color: Theme.textMuted, marginTop: 2 },
  dueRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  dueText: { fontSize: 11, color: Theme.textMuted },
  balanceRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end',
    marginBottom: 14,
  },
  balanceLabel: { fontSize: 11, color: Theme.textMuted, marginBottom: 2 },
  balanceAmount: { fontSize: 18, fontWeight: '700', fontFamily: Fonts?.mono, color: Theme.textPrimary },
  utilSection: { alignItems: 'flex-end', width: 100 },
  utilPercent: { fontSize: 14, fontWeight: '700', fontFamily: Fonts?.mono, marginBottom: 4 },
  utilTrack: { height: 4, width: '100%', backgroundColor: Theme.cardBorder, borderRadius: 2 },
  utilFill: { height: 4, borderRadius: 2 },
  limitText: { fontSize: 10, color: Theme.textMuted, marginTop: 2 },
  actions: {
    flexDirection: 'row', gap: 16, paddingTop: 12,
    borderTopWidth: 1, borderTopColor: Theme.separator,
  },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  actionText: { fontSize: 12, color: Theme.textMuted },
  empty: { alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 12 },
  emptyText: { fontSize: 14, color: Theme.textMuted, textAlign: 'center' },
});
