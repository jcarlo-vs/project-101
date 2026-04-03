import React, { createContext, useContext, useEffect, useCallback, useState, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CURRENCIES, type CurrencyInfo } from '@/constants/theme';
import { getExchangeRates, convertWithRates } from '@/utils/exchange-rates';

const CURRENCY_KEY = '@finvy_currency';
const OLD_CURRENCY_KEY = '@subtrackr_currency';
const DEFAULT_CURRENCY = CURRENCIES[0]; // USD

type ConversionListener = (from: CurrencyInfo, to: CurrencyInfo, convert: (amount: number) => number) => void;

interface CurrencyContextValue {
  currency: CurrencyInfo;
  isFirstLaunch: boolean;
  isLoading: boolean;
  setCurrency: (currency: CurrencyInfo) => void;
  onCurrencyChange: (listener: ConversionListener) => () => void;
}

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState<CurrencyInfo>(DEFAULT_CURRENCY);
  const [isLoading, setIsLoading] = useState(true);
  const [isFirstLaunch, setIsFirstLaunch] = useState(false);
  const listenersRef = useRef<Set<ConversionListener>>(new Set());
  const ratesRef = useRef<Record<string, number> | null>(null);

  // Load currency + fetch rates on mount
  useEffect(() => {
    (async () => {
      try {
        // Load saved currency
        let stored = await AsyncStorage.getItem(CURRENCY_KEY);
        if (!stored) {
          stored = await AsyncStorage.getItem(OLD_CURRENCY_KEY);
          if (stored) {
            await AsyncStorage.setItem(CURRENCY_KEY, stored);
            await AsyncStorage.removeItem(OLD_CURRENCY_KEY);
          }
        }
        if (stored) {
          const parsed = JSON.parse(stored);
          const match = CURRENCIES.find((c) => c.code === parsed.code);
          if (match) setCurrencyState(match);
        } else {
          setIsFirstLaunch(true);
        }

        // Fetch live rates (cached with 24h TTL)
        ratesRef.current = await getExchangeRates();
      } catch {
        setIsFirstLaunch(true);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const setCurrency = useCallback(async (newCurrency: CurrencyInfo) => {
    // Ensure we have rates before converting
    if (!ratesRef.current) {
      ratesRef.current = await getExchangeRates();
    }
    const rates = ratesRef.current;

    setCurrencyState((prev) => {
      if (prev.code !== newCurrency.code) {
        const convert = (amount: number) => convertWithRates(amount, prev.code, newCurrency.code, rates);
        for (const listener of listenersRef.current) {
          listener(prev, newCurrency, convert);
        }
      }
      return newCurrency;
    });
    await AsyncStorage.setItem(CURRENCY_KEY, JSON.stringify(newCurrency));
    setIsFirstLaunch(false);
  }, []);

  const onCurrencyChange = useCallback((listener: ConversionListener) => {
    listenersRef.current.add(listener);
    return () => { listenersRef.current.delete(listener); };
  }, []);

  return (
    <CurrencyContext.Provider value={{ currency, isFirstLaunch, isLoading, setCurrency, onCurrencyChange }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error('useCurrency must be used within CurrencyProvider');
  return ctx;
}
