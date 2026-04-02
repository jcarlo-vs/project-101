import { useState, useMemo, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { useSubscriptions } from '@/context/SubscriptionContext';
import { useCurrency } from '@/context/CurrencyContext';
import { ConfirmModal } from '@/components/confirm-modal';
import { SelectionBar } from '@/components/selection-bar';
import { useBulkSelect } from '@/hooks/use-bulk-select';
import { Theme, CategoryColors, CategoryIcons, Fonts, type CategoryType, type Subscription } from '@/constants/theme';
import { formatCurrency, cycleLabel, daysSinceUsed } from '@/utils/calculations';

type FilterType = 'all' | 'active' | 'cancelled';

const CATEGORIES: CategoryType[] = [
  'Streaming', 'Music', 'Software', 'Gaming', 'Cloud', 'News', 'Fitness', 'Other',
];

export default function SubscriptionsScreen() {
  const { top } = useSafeAreaInsets();
  const router = useRouter();
  const { category: paramCategory } = useLocalSearchParams<{ category?: string }>();
  const { subscriptions, toggleActive, deleteSubscription } = useSubscriptions();
  const { currency } = useCurrency();
  const sym = currency.symbol;
  const bulk = useBulkSelect();

  const [filter, setFilter] = useState<FilterType>('all');
  const [categoryFilter, setCategoryFilter] = useState<CategoryType | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Subscription | null>(null);
  const [cancelTarget, setCancelTarget] = useState<Subscription | null>(null);
  const [showBulkDelete, setShowBulkDelete] = useState(false);

  useEffect(() => {
    if (paramCategory && CATEGORIES.includes(paramCategory as CategoryType)) {
      setCategoryFilter(paramCategory as CategoryType);
      setFilter('all');
    }
  }, [paramCategory]);

  const filtered = useMemo(() => {
    let result = subscriptions;
    if (filter === 'active') result = result.filter((s) => s.active);
    if (filter === 'cancelled') result = result.filter((s) => !s.active);
    if (categoryFilter) result = result.filter((s) => s.category === categoryFilter);
    return result;
  }, [subscriptions, filter, categoryFilter]);

  const renderItem = useCallback(
    ({ item: sub }: { item: Subscription }) => {
      const days = daysSinceUsed(sub.lastUsed);
      const isSelected = bulk.selectedIds.has(sub.id);

      return (
        <TouchableOpacity
          style={[styles.card, !sub.active && styles.cardInactive, isSelected && styles.cardSelected]}
          onLongPress={() => bulk.startSelecting(sub.id)}
          onPress={() => bulk.isSelecting ? bulk.toggleItem(sub.id) : undefined}
          activeOpacity={bulk.isSelecting ? 0.7 : 1}
        >
          <View style={styles.cardTop}>
            {bulk.isSelecting ? (
              <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                {isSelected && <Ionicons name="checkmark" size={16} color="#FFF" />}
              </View>
            ) : (
              <View style={[styles.catIcon, { backgroundColor: CategoryColors[sub.category] + '22' }]}>
                <Ionicons name={CategoryIcons[sub.category] as any} size={22} color={CategoryColors[sub.category]} />
              </View>
            )}
            <View style={styles.cardInfo}>
              <View style={styles.nameRow}>
                <Text style={[styles.cardName, !sub.active && styles.textInactive]}>{sub.name}</Text>
                {!sub.active && <Text style={styles.cancelledBadge}>CANCELLED</Text>}
              </View>
              <Text style={styles.cardSub}>{sub.category} · {sub.cycle} · Used {days}d ago</Text>
            </View>
            <Text style={[styles.cardCost, !sub.active && styles.textInactive]} numberOfLines={1}>
              {formatCurrency(sub.cost, sym)}{cycleLabel(sub.cycle)}
            </Text>
          </View>
          {!bulk.isSelecting && (
            <View style={styles.actions}>
              <TouchableOpacity style={styles.actionBtn} onPress={() => router.push({ pathname: '/add-subscription', params: { id: sub.id } })}>
                <Ionicons name="pencil-outline" size={16} color={Theme.textMuted} />
                <Text style={styles.actionText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn} onPress={() => sub.active ? setCancelTarget(sub) : (Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light), toggleActive(sub.id))}>
                <Ionicons name={sub.active ? 'close-circle-outline' : 'checkmark-circle-outline'} size={16} color={sub.active ? Theme.accentSecondary : '#6BCB77'} />
                <Text style={[styles.actionText, { color: sub.active ? Theme.accentSecondary : '#6BCB77' }]}>{sub.active ? 'Cancel' : 'Reactivate'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn} onPress={() => setDeleteTarget(sub)}>
                <Ionicons name="trash-outline" size={16} color={Theme.accentSecondary} />
                <Text style={[styles.actionText, { color: Theme.accentSecondary }]}>Delete</Text>
              </TouchableOpacity>
            </View>
          )}
        </TouchableOpacity>
      );
    },
    [router, toggleActive, sym, bulk],
  );

  return (
    <View style={[styles.container, { paddingTop: top + 16 }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Subscriptions</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push('/add-subscription')}
        >
          <Ionicons name="add" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      {/* Filters */}
      <View style={styles.filterContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filters}
        >
        {(['all', 'active', 'cancelled'] as FilterType[]).map((f) => (
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
        {CATEGORIES.filter((c) => subscriptions.some((s) => s.category === c)).map((c) => (
          <TouchableOpacity
            key={c}
            style={[styles.pill, categoryFilter === c && styles.pillActive]}
            onPress={() => setCategoryFilter(categoryFilter === c ? null : c)}
          >
            <View style={[styles.pillDot, { backgroundColor: CategoryColors[c] }]} />
            <Text style={[styles.pillText, categoryFilter === c && styles.pillTextActive]}>{c}</Text>
          </TouchableOpacity>
        ))}
        </ScrollView>
      </View>

      {/* List */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="search-outline" size={48} color={Theme.textMuted} />
            <Text style={styles.emptyText}>
              {subscriptions.length === 0
                ? 'No subscriptions yet. Tap + to add one.'
                : 'No subscriptions match this filter.'}
            </Text>
          </View>
        }
      />

      {/* Bulk Selection Bar */}
      {bulk.isSelecting && (
        <SelectionBar
          count={bulk.selectedCount}
          totalCount={filtered.length}
          onSelectAll={() => bulk.selectedCount === filtered.length ? bulk.cancelSelection() : bulk.selectAll(filtered.map((s) => s.id))}
          onDelete={() => setShowBulkDelete(true)}
          onCancel={bulk.cancelSelection}
        />
      )}

      {/* Bulk Delete Confirmation */}
      <ConfirmModal
        visible={showBulkDelete}
        icon="trash-outline"
        iconColor={Theme.accentSecondary}
        title={`Delete ${bulk.selectedCount} subscription${bulk.selectedCount !== 1 ? 's' : ''}?`}
        message="This action cannot be undone."
        confirmText="Delete All"
        confirmColor={Theme.accentSecondary}
        onConfirm={() => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          for (const id of bulk.selectedIds) deleteSubscription(id);
          bulk.clearAfterAction();
          setShowBulkDelete(false);
        }}
        onCancel={() => setShowBulkDelete(false)}
      />

      {/* Delete Confirmation */}
      <ConfirmModal
        visible={!!deleteTarget}
        icon="trash-outline"
        iconColor={Theme.accentSecondary}
        title="Delete Subscription"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        confirmColor={Theme.accentSecondary}
        onConfirm={() => {
          if (deleteTarget) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            deleteSubscription(deleteTarget.id);
          }
          setDeleteTarget(null);
        }}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* Cancel Confirmation */}
      <ConfirmModal
        visible={!!cancelTarget}
        icon="close-circle-outline"
        iconColor="#FFB347"
        title="Cancel Subscription"
        message={`Are you sure you want to cancel "${cancelTarget?.name}"? You can reactivate it later.`}
        confirmText="Cancel It"
        confirmColor="#FFB347"
        onConfirm={() => {
          if (cancelTarget) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            toggleActive(cancelTarget.id);
          }
          setCancelTarget(null);
        }}
        onCancel={() => setCancelTarget(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.bg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: Theme.textPrimary,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: Theme.borderRadius.button,
    backgroundColor: Theme.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterContainer: {
    height: 48,
  },
  filters: {
    paddingHorizontal: 20,
    gap: 8,
    alignItems: 'center',
    height: 48,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: 'transparent',
  },
  pillActive: {
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  pillText: {
    fontSize: 13,
    color: '#555',
  },
  pillTextActive: {
    color: Theme.textPrimary,
  },
  pillDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  pillSpacer: {
    width: 1,
    height: 24,
    backgroundColor: Theme.cardBorder,
    marginHorizontal: 4,
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  card: {
    backgroundColor: Theme.cardBg,
    borderWidth: 1,
    borderColor: Theme.cardBorder,
    borderRadius: Theme.borderRadius.card,
    padding: 16,
    marginBottom: 12,
  },
  cardInactive: {
    opacity: 0.45,
  },
  cardSelected: {
    borderColor: Theme.accent + '66',
    backgroundColor: Theme.accent + '08',
  },
  checkbox: {
    width: 44,
    height: 44,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: Theme.cardBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: Theme.accent,
    borderColor: Theme.accent,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  catIcon: {
    width: 44,
    height: 44,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardInfo: {
    flex: 1,
    marginLeft: 12,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardName: {
    fontSize: 15,
    fontWeight: '600',
    color: Theme.textPrimary,
  },
  cancelledBadge: {
    fontSize: 9,
    fontFamily: Fonts?.mono,
    color: Theme.accentSecondary,
    letterSpacing: 1,
    fontWeight: '700',
  },
  textInactive: {
    opacity: 0.7,
  },
  cardSub: {
    fontSize: 11,
    color: Theme.textMuted,
    marginTop: 2,
  },
  cardCost: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: Fonts?.mono,
    color: Theme.textPrimary,
    textAlign: 'right',
  },
  actions: {
    flexDirection: 'row',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Theme.separator,
    gap: 16,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionText: {
    fontSize: 12,
    color: Theme.textMuted,
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    color: Theme.textMuted,
    textAlign: 'center',
  },
});
