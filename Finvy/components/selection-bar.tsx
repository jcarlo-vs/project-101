import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from '@/constants/theme';

interface SelectionBarProps {
  count: number;
  totalCount: number;
  onSelectAll: () => void;
  onDelete: () => void;
  onCancel: () => void;
}

export function SelectionBar({ count, totalCount, onSelectAll, onDelete, onCancel }: SelectionBarProps) {
  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
        <Ionicons name="close" size={20} color={Theme.textBody} />
      </TouchableOpacity>

      <Text style={styles.count}>{count} selected</Text>

      <TouchableOpacity style={styles.actionBtn} onPress={onSelectAll}>
        <Text style={styles.actionText}>{count === totalCount ? 'Deselect' : 'All'}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.deleteBtn} onPress={onDelete}>
        <Ionicons name="trash" size={18} color="#FFF" />
        <Text style={styles.deleteText}>Delete</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A22',
    borderWidth: 1,
    borderColor: Theme.cardBorder,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  cancelBtn: {
    padding: 4,
  },
  count: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: Theme.textPrimary,
  },
  actionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  actionText: {
    fontSize: 13,
    fontWeight: '600',
    color: Theme.textBody,
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: Theme.accentSecondary,
  },
  deleteText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFF',
  },
});
