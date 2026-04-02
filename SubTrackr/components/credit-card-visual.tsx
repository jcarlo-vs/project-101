import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CardNetworkColors, type CreditCard, type CardNetwork } from '@/constants/theme';

interface CreditCardVisualProps {
  card: CreditCard;
  size?: 'small' | 'large';
}

function getNetworkIcon(network: CardNetwork): string {
  switch (network) {
    case 'Visa': return 'card';
    case 'Mastercard': return 'card';
    case 'Amex': return 'card';
    case 'Discover': return 'card';
    default: return 'card-outline';
  }
}

export function CreditCardVisual({ card, size = 'small' }: CreditCardVisualProps) {
  const isLarge = size === 'large';
  const width = isLarge ? '100%' : 120;
  const height = isLarge ? 200 : 76;

  return (
    <View style={[styles.card, { backgroundColor: card.color, width, height }]}>
      <View style={styles.topRow}>
        <Text style={[styles.issuer, isLarge && styles.issuerLarge]}>{card.issuer}</Text>
        <View style={styles.networkBadge}>
          <Ionicons
            name={getNetworkIcon(card.network) as any}
            size={isLarge ? 22 : 14}
            color={CardNetworkColors[card.network]}
          />
          {isLarge && <Text style={styles.networkText}>{card.network}</Text>}
        </View>
      </View>
      <View style={styles.bottomRow}>
        {isLarge && <Text style={styles.cardName}>{card.name}</Text>}
        <Text style={[styles.lastFour, isLarge && styles.lastFourLarge]}>
          •••• {card.lastFourDigits}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    padding: 12,
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  issuer: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  issuerLarge: {
    fontSize: 14,
  },
  networkBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  networkText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
  },
  bottomRow: {
    gap: 4,
  },
  cardName: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
  },
  lastFour: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 2,
  },
  lastFourLarge: {
    fontSize: 20,
    letterSpacing: 3,
  },
});
