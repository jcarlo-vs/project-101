import { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { useLoans } from '@/context/LoanContext';
import { useCurrency } from '@/context/CurrencyContext';
import { ConfirmModal } from '@/components/confirm-modal';
import { SelectionBar } from '@/components/selection-bar';
import { useBulkSelect } from '@/hooks/use-bulk-select';
import { Theme, LoanTypeColors, LoanTypeIcons, Fonts, type Loan } from '@/constants/theme';
import { formatCurrency } from '@/utils/calculations';
import { getLoanProgress, getDaysUntilDue, getPayoffDate, getMissedPayments } from '@/utils/loan-calculations';

export default function LoansScreen() {
  const { top } = useSafeAreaInsets();
  const router = useRouter();
  const { loans, deleteLoan } = useLoans();
  const { currency } = useCurrency();
  const sym = currency.symbol;
  const bulk = useBulkSelect();

  const [deleteTarget, setDeleteTarget] = useState<Loan | null>(null);
  const [showBulkDelete, setShowBulkDelete] = useState(false);

  const renderItem = useCallback(
    ({ item: loan }: { item: Loan }) => {
      const progress = getLoanProgress(loan);
      const days = getDaysUntilDue(loan);
      const payoff = getPayoffDate(loan);
      const missedCount = getMissedPayments(loan).length;
      const isSelected = bulk.selectedIds.has(loan.id);

      return (
        <TouchableOpacity
          style={[styles.card, isSelected && styles.cardSelected]}
          onLongPress={() => bulk.startSelecting(loan.id)}
          onPress={() => bulk.isSelecting ? bulk.toggleItem(loan.id) : router.push({ pathname: '/loan-detail', params: { id: loan.id } })}
          activeOpacity={bulk.isSelecting ? 0.7 : 1}
        >
          <View style={styles.cardTop}>
            {bulk.isSelecting ? (
              <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                {isSelected && <Ionicons name="checkmark" size={16} color="#FFF" />}
              </View>
            ) : (
              <View style={[styles.typeIcon, { backgroundColor: LoanTypeColors[loan.type] + '22' }]}>
                <Ionicons name={LoanTypeIcons[loan.type] as any} size={22} color={LoanTypeColors[loan.type]} />
              </View>
            )}
            <View style={styles.cardInfo}>
              <Text style={styles.cardName}>{loan.name}</Text>
              <Text style={styles.cardSub}>{loan.lender} · {loan.type} · Due in {days}d</Text>
            </View>
            <View style={styles.cardRight}>
              <Text style={styles.cardPayment}>{formatCurrency(loan.monthlyPayment, sym)}/mo</Text>
              <Text style={styles.payoffText}>Payoff: {payoff}</Text>
            </View>
          </View>

          {/* Balance + Progress */}
          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <Text style={styles.balanceLabel}>Remaining</Text>
              <Text style={styles.balanceAmount}>{formatCurrency(loan.currentBalance, sym)}</Text>
            </View>
            <View style={styles.barTrack}>
              <View style={[styles.barFill, { width: `${progress}%`, backgroundColor: LoanTypeColors[loan.type] }]} />
            </View>
            <View style={styles.progressFooter}>
              <Text style={styles.progressText}>{progress.toFixed(0)}% paid</Text>
              <Text style={styles.progressText}>of {formatCurrency(loan.principalAmount, sym)}</Text>
            </View>
          </View>

          {missedCount > 0 && !bulk.isSelecting && (
            <View style={styles.missedBadge}>
              <Ionicons name="alert-circle" size={14} color="#FFB347" />
              <Text style={styles.missedBadgeText}>
                {missedCount} unpaid month{missedCount !== 1 ? 's' : ''} — tap to review
              </Text>
            </View>
          )}

          {!bulk.isSelecting && (
            <View style={styles.actions}>
              <TouchableOpacity style={styles.actionBtn} onPress={() => router.push({ pathname: '/loan-detail', params: { id: loan.id } })}>
                <Ionicons name="eye-outline" size={16} color={Theme.textMuted} />
                <Text style={styles.actionText}>Details</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn} onPress={() => setDeleteTarget(loan)}>
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
        <Text style={styles.title}>Loans</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => router.push('/add-loan')}>
          <Ionicons name="add" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={loans}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="cash-outline" size={48} color={Theme.textMuted} />
            <Text style={styles.emptyText}>No loans yet. Tap + to add one.</Text>
          </View>
        }
      />

      {bulk.isSelecting && (
        <SelectionBar
          count={bulk.selectedCount}
          totalCount={loans.length}
          onSelectAll={() => bulk.selectedCount === loans.length ? bulk.cancelSelection() : bulk.selectAll(loans.map((l) => l.id))}
          onDelete={() => setShowBulkDelete(true)}
          onCancel={bulk.cancelSelection}
        />
      )}

      <ConfirmModal
        visible={showBulkDelete}
        icon="trash-outline"
        iconColor={Theme.accentSecondary}
        title={`Delete ${bulk.selectedCount} loan${bulk.selectedCount !== 1 ? 's' : ''}?`}
        message="Payment history will be lost."
        confirmText="Delete All"
        confirmColor={Theme.accentSecondary}
        onConfirm={() => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          for (const id of bulk.selectedIds) deleteLoan(id);
          bulk.clearAfterAction();
          setShowBulkDelete(false);
        }}
        onCancel={() => setShowBulkDelete(false)}
      />

      <ConfirmModal
        visible={!!deleteTarget}
        icon="trash-outline"
        iconColor={Theme.accentSecondary}
        title="Delete Loan"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? Payment history will be lost.`}
        confirmText="Delete"
        confirmColor={Theme.accentSecondary}
        onConfirm={() => {
          if (deleteTarget) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            deleteLoan(deleteTarget.id);
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
  list: { paddingHorizontal: 20, paddingBottom: 100 },
  card: {
    backgroundColor: Theme.cardBg, borderWidth: 1, borderColor: Theme.cardBorder,
    borderRadius: Theme.borderRadius.card, padding: 16, marginBottom: 12,
  },
  cardSelected: { borderColor: Theme.accent + '66', backgroundColor: Theme.accent + '08' },
  checkbox: {
    width: 44, height: 44, borderRadius: 13, borderWidth: 2, borderColor: Theme.cardBorder,
    justifyContent: 'center', alignItems: 'center',
  },
  checkboxSelected: { backgroundColor: Theme.accent, borderColor: Theme.accent },
  cardTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  typeIcon: { width: 44, height: 44, borderRadius: 13, justifyContent: 'center', alignItems: 'center' },
  cardInfo: { flex: 1, marginLeft: 12 },
  cardName: { fontSize: 15, fontWeight: '600', color: Theme.textPrimary },
  cardSub: { fontSize: 11, color: Theme.textMuted, marginTop: 2 },
  cardRight: { alignItems: 'flex-end' },
  cardPayment: { fontSize: 15, fontWeight: '700', fontFamily: Fonts?.mono, color: Theme.textPrimary },
  payoffText: { fontSize: 10, color: Theme.textMuted, marginTop: 2 },
  progressSection: { marginBottom: 12 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  balanceLabel: { fontSize: 11, color: Theme.textMuted },
  balanceAmount: { fontSize: 14, fontWeight: '600', fontFamily: Fonts?.mono, color: Theme.textPrimary },
  barTrack: { height: 6, backgroundColor: Theme.cardBorder, borderRadius: 3 },
  barFill: { height: 6, borderRadius: 3 },
  progressFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  progressText: { fontSize: 10, color: Theme.textMuted },
  missedBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#FFB34710', borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 6, marginBottom: 10,
  },
  missedBadgeText: { fontSize: 11, color: '#FFB347', fontWeight: '500' },
  actions: {
    flexDirection: 'row', gap: 16, paddingTop: 12,
    borderTopWidth: 1, borderTopColor: Theme.separator,
  },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  actionText: { fontSize: 12, color: Theme.textMuted },
  empty: { alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 12 },
  emptyText: { fontSize: 14, color: Theme.textMuted, textAlign: 'center' },
});
