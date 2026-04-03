import { View, Text, StyleSheet, TouchableOpacity, Modal, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Theme, CURRENCIES, type CurrencyInfo } from '@/constants/theme';
import { useState } from 'react';

interface WelcomeCurrencyModalProps {
  visible: boolean;
  onSelect: (currency: CurrencyInfo) => void;
}

export function WelcomeCurrencyModal({ visible, onSelect }: WelcomeCurrencyModalProps) {
  const [selected, setSelected] = useState<CurrencyInfo>(CURRENCIES[0]);

  return (
    <Modal visible={visible} animationType="fade" presentationStyle="fullScreen">
      <View style={styles.container}>
        <View style={styles.header}>
          <Ionicons name="wallet-outline" size={48} color={Theme.accent} />
          <Text style={styles.title}>Welcome to Finvy</Text>
          <Text style={styles.subtitle}>
            Choose your currency. All amounts will be displayed in this currency.
          </Text>
        </View>

        <FlatList
          data={CURRENCIES}
          keyExtractor={(item) => item.code}
          style={styles.list}
          renderItem={({ item }) => {
            const isSelected = item.code === selected.code;
            return (
              <TouchableOpacity
                style={[styles.row, isSelected && styles.rowSelected]}
                onPress={() => setSelected(item)}
              >
                <Text style={styles.flag}>{item.flag}</Text>
                <View style={styles.info}>
                  <Text style={styles.code}>{item.code}</Text>
                  <Text style={styles.name}>{item.name}</Text>
                </View>
                <Text style={styles.symbol}>{item.symbol}</Text>
                {isSelected && (
                  <Ionicons name="checkmark-circle" size={20} color={Theme.accent} style={{ marginLeft: 8 }} />
                )}
              </TouchableOpacity>
            );
          }}
        />

        <View style={styles.footer}>
          <TouchableOpacity style={styles.continueBtn} onPress={() => onSelect(selected)}>
            <Text style={styles.continueText}>Continue with {selected.code}</Text>
            <Ionicons name="arrow-forward" size={18} color="#FFF" />
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.bg,
  },
  header: {
    alignItems: 'center',
    paddingTop: 80,
    paddingBottom: 24,
    paddingHorizontal: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Theme.textPrimary,
    marginTop: 16,
  },
  subtitle: {
    fontSize: 15,
    color: Theme.textMuted,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 22,
  },
  list: {
    flex: 1,
    marginHorizontal: 20,
    borderRadius: Theme.borderRadius.card,
    backgroundColor: Theme.cardBg,
    borderWidth: 1,
    borderColor: Theme.cardBorder,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Theme.separator,
  },
  rowSelected: {
    backgroundColor: Theme.accent + '12',
  },
  flag: {
    fontSize: 22,
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
  footer: {
    padding: 20,
    paddingBottom: 40,
  },
  continueBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Theme.accent,
    borderRadius: Theme.borderRadius.button,
    paddingVertical: 16,
  },
  continueText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
});
