import React, { createContext, useContext, useEffect, useReducer, useCallback, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Subscription } from '@/constants/theme';
import { useCurrency } from './CurrencyContext';

const STORAGE_KEY = '@finvy_subscriptions';
const OLD_STORAGE_KEY = '@subtrackr_subscriptions';

const SAMPLE_DATA: Subscription[] = [];

// ── Reducer ──

type Action =
  | { type: 'LOAD'; payload: Subscription[] }
  | { type: 'ADD'; payload: Subscription }
  | { type: 'UPDATE'; payload: Subscription }
  | { type: 'DELETE'; payload: string }
  | { type: 'TOGGLE_ACTIVE'; payload: string }
  | { type: 'CONVERT_ALL'; payload: (amount: number) => number };

function reducer(state: Subscription[], action: Action): Subscription[] {
  switch (action.type) {
    case 'LOAD':
      return action.payload;
    case 'ADD':
      return [...state, action.payload];
    case 'UPDATE':
      return state.map((s) => (s.id === action.payload.id ? action.payload : s));
    case 'DELETE':
      return state.filter((s) => s.id !== action.payload);
    case 'TOGGLE_ACTIVE':
      return state.map((s) =>
        s.id === action.payload ? { ...s, active: !s.active } : s,
      );
    case 'CONVERT_ALL':
      return state.map((s) => ({
        ...s,
        cost: Math.round(action.payload(s.cost) * 100) / 100,
      }));
    default:
      return state;
  }
}

// ── Context ──

interface SubscriptionContextValue {
  subscriptions: Subscription[];
  isLoading: boolean;
  addSubscription: (sub: Omit<Subscription, 'id'>) => void;
  updateSubscription: (sub: Subscription) => void;
  deleteSubscription: (id: string) => void;
  toggleActive: (id: string) => void;
}

const SubscriptionContext = createContext<SubscriptionContextValue | null>(null);

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const [subscriptions, dispatch] = useReducer(reducer, []);
  const [isLoading, setIsLoading] = useState(true);
  const { onCurrencyChange } = useCurrency();

  // Listen for currency changes and convert all costs
  useEffect(() => {
    return onCurrencyChange((_from, _to, convert) => {
      dispatch({
        type: 'CONVERT_ALL',
        payload: convert,
      });
    });
  }, [onCurrencyChange]);

  // Load from storage on mount (with migration from old key)
  useEffect(() => {
    (async () => {
      try {
        let stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (!stored) {
          stored = await AsyncStorage.getItem(OLD_STORAGE_KEY);
          if (stored) {
            await AsyncStorage.setItem(STORAGE_KEY, stored);
            await AsyncStorage.removeItem(OLD_STORAGE_KEY);
          }
        }
        if (stored) {
          dispatch({ type: 'LOAD', payload: JSON.parse(stored) });
        } else {
          dispatch({ type: 'LOAD', payload: SAMPLE_DATA });
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(SAMPLE_DATA));
        }
      } catch {
        dispatch({ type: 'LOAD', payload: SAMPLE_DATA });
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  // Persist on every change (skip while loading)
  useEffect(() => {
    if (!isLoading) {
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(subscriptions));
    }
  }, [subscriptions, isLoading]);

  const addSubscription = useCallback(
    (sub: Omit<Subscription, 'id'>) => {
      const id = Date.now().toString(36) + Math.random().toString(36).slice(2);
      dispatch({ type: 'ADD', payload: { ...sub, id } });
    },
    [],
  );

  const updateSubscription = useCallback(
    (sub: Subscription) => dispatch({ type: 'UPDATE', payload: sub }),
    [],
  );

  const deleteSubscription = useCallback(
    (id: string) => dispatch({ type: 'DELETE', payload: id }),
    [],
  );

  const toggleActive = useCallback(
    (id: string) => dispatch({ type: 'TOGGLE_ACTIVE', payload: id }),
    [],
  );

  return (
    <SubscriptionContext.Provider
      value={{ subscriptions, isLoading, addSubscription, updateSubscription, deleteSubscription, toggleActive }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscriptions() {
  const ctx = useContext(SubscriptionContext);
  if (!ctx) throw new Error('useSubscriptions must be used within SubscriptionProvider');
  return ctx;
}
