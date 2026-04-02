import { View, Text, StyleSheet, TouchableOpacity, Modal, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Theme, CURRENCIES, type CurrencyInfo } from '@/constants/theme';

interface CurrencyPickerProps {
  visible: boolean;
  current: CurrencyInfo;
  onSelect: (currency: CurrencyInfo) => void;
  onClose: () => void;
}

export function CurrencyPicker({ visible, current, onSelect, onClose }: CurrencyPickerProps) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>Choose Currency</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={Theme.textMuted} />
            </TouchableOpacity>
          </View>
          <FlatList
            data={CURRENCIES}
            keyExtractor={(item) => item.code}
            renderItem={({ item }) => {
              const selected = item.code === current.code;
              return (
                <TouchableOpacity
                  style={[styles.row, selected && styles.rowSelected]}
                  onPress={() => {
                    onSelect(item);
                    onClose();
                  }}
                >
                  <Text style={styles.flag}>{item.flag}</Text>
                  <View style={styles.info}>
                    <Text style={styles.code}>{item.code}</Text>
                    <Text style={styles.name}>{item.name}</Text>
                  </View>
                  <Text style={styles.symbol}>{item.symbol}</Text>
                  {selected && (
                    <Ionicons name="checkmark-circle" size={20} color={Theme.accent} style={{ marginLeft: 8 }} />
                  )}
                </TouchableOpacity>
              );
            }}
            contentContainerStyle={styles.list}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#1A1A22',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    borderWidth: 1,
    borderColor: Theme.cardBorder,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Theme.separator,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: Theme.textPrimary,
  },
  list: {
    paddingBottom: 40,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Theme.separator,
  },
  rowSelected: {
    backgroundColor: Theme.accent + '10',
  },
  flag: {
    fontSize: 24,
    marginRight: 14,
  },
  info: {
    flex: 1,
  },
  code: {
    fontSize: 15,
    fontWeight: '600',
    color: Theme.textPrimary,
  },
  name: {
    fontSize: 12,
    color: Theme.textMuted,
    marginTop: 1,
  },
  symbol: {
    fontSize: 16,
    fontWeight: '600',
    color: Theme.textBody,
  },
});
