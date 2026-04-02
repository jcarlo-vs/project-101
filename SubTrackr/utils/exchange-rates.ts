import AsyncStorage from '@react-native-async-storage/async-storage';
import { CURRENCIES } from '@/constants/theme';

const CACHE_KEY = '@finvy_exchange_rates';
const TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const API_URL = 'https://api.frankfurter.dev/v1/latest?base=USD';

interface CachedRates {
  rates: Record<string, number>;
  fetchedAt: number;
}

// Hardcoded fallback rates (from CURRENCIES array)
function getFallbackRates(): Record<string, number> {
  const rates: Record<string, number> = {};
  for (const c of CURRENCIES) {
    rates[c.code] = c.rateToUSD;
  }
  return rates;
}

let memoryCache: CachedRates | null = null;

async function loadCachedRates(): Promise<CachedRates | null> {
  if (memoryCache && Date.now() - memoryCache.fetchedAt < TTL_MS) {
    return memoryCache;
  }
  try {
    const stored = await AsyncStorage.getItem(CACHE_KEY);
    if (stored) {
      const parsed: CachedRates = JSON.parse(stored);
      if (Date.now() - parsed.fetchedAt < TTL_MS) {
        memoryCache = parsed;
        return parsed;
      }
    }
  } catch {
    // ignore
  }
  return null;
}

async function fetchAndCacheRates(): Promise<Record<string, number>> {
  try {
    const response = await fetch(API_URL);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();

    // API returns { base: "USD", date: "...", rates: { EUR: 0.92, ... } }
    const rates: Record<string, number> = { USD: 1, ...data.rates };
    const cached: CachedRates = { rates, fetchedAt: Date.now() };

    memoryCache = cached;
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(cached));

    return rates;
  } catch {
    // Network error — return fallback
    return getFallbackRates();
  }
}

export async function getExchangeRates(): Promise<Record<string, number>> {
  const cached = await loadCachedRates();
  if (cached) return cached.rates;
  return fetchAndCacheRates();
}

export function convertWithRates(
  amount: number,
  fromCode: string,
  toCode: string,
  rates: Record<string, number>,
): number {
  if (fromCode === toCode) return amount;
  const fromRate = rates[fromCode] ?? 1;
  const toRate = rates[toCode] ?? 1;
  return (amount / fromRate) * toRate;
}
