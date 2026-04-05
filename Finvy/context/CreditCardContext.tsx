import React, { createContext, useContext, useEffect, useReducer, useCallback, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { CreditCard, CreditCardPayment } from '@/constants/theme';
import { useCurrency } from './CurrencyContext';

const STORAGE_KEY = '@finvy_credit_cards';

const SAMPLE_DATA: CreditCard[] = [];

// ── Reducer ──

type Action =
  | { type: 'LOAD'; payload: CreditCard[] }
  | { type: 'ADD'; payload: CreditCard }
  | { type: 'UPDATE'; payload: CreditCard }
  | { type: 'DELETE'; payload: string }
  | { type: 'TOGGLE_ACTIVE'; payload: string }
  | { type: 'ADD_PAYMENT'; payload: { cardId: string; payment: CreditCardPayment } }
  | { type: 'DELETE_PAYMENT'; payload: { cardId: string; paymentId: string } }
  | { type: 'ADD_CHARGE'; payload: { cardId: string; amount: number; note?: string } }
  | { type: 'UPDATE_BALANCE'; payload: { cardId: string; balance: number } }
  | { type: 'CONVERT_ALL'; payload: (amount: number) => number };

function reducer(state: CreditCard[], action: Action): CreditCard[] {
  switch (action.type) {
    case 'LOAD':
      return action.payload;
    case 'ADD':
      return [...state, action.payload];
    case 'UPDATE':
      return state.map((c) => (c.id === action.payload.id ? action.payload : c));
    case 'DELETE':
      return state.filter((c) => c.id !== action.payload);
    case 'TOGGLE_ACTIVE':
      return state.map((c) =>
        c.id === action.payload ? { ...c, active: !c.active } : c,
      );
    case 'ADD_PAYMENT':
      return state.map((c) => {
        if (c.id !== action.payload.cardId) return c;
        return {
          ...c,
          currentBalance: Math.max(0, c.currentBalance - action.payload.payment.amount),
          payments: [action.payload.payment, ...c.payments],
        };
      });
    case 'DELETE_PAYMENT':
      return state.map((c) => {
        if (c.id !== action.payload.cardId) return c;
        const payment = c.payments.find((p) => p.id === action.payload.paymentId);
        return {
          ...c,
          currentBalance: payment ? c.currentBalance + payment.amount : c.currentBalance,
          payments: c.payments.filter((p) => p.id !== action.payload.paymentId),
        };
      });
    case 'ADD_CHARGE':
      return state.map((c) => {
        if (c.id !== action.payload.cardId) return c;
        return {
          ...c,
          currentBalance: c.currentBalance + action.payload.amount,
        };
      });
    case 'UPDATE_BALANCE':
      return state.map((c) => {
        if (c.id !== action.payload.cardId) return c;
        return {
          ...c,
          currentBalance: Math.max(0, action.payload.balance),
        };
      });
    case 'CONVERT_ALL': {
      const conv = action.payload;
      const round = (n: number) => Math.round(conv(n) * 100) / 100;
      return state.map((c) => ({
        ...c,
        creditLimit: round(c.creditLimit),
        currentBalance: round(c.currentBalance),
        statementBalance: round(c.statementBalance ?? 0),
        minimumPayment: round(c.minimumPayment),
        payments: c.payments.map((p) => ({ ...p, amount: round(p.amount) })),
      }));
    }
    default:
      return state;
  }
}

// ── Context ──

interface CreditCardContextValue {
  creditCards: CreditCard[];
  isLoading: boolean;
  addCreditCard: (card: Omit<CreditCard, 'id' | 'payments'>) => void;
  updateCreditCard: (card: CreditCard) => void;
  deleteCreditCard: (id: string) => void;
  toggleActive: (id: string) => void;
  addPayment: (cardId: string, payment: Omit<CreditCardPayment, 'id'>) => void;
  deletePayment: (cardId: string, paymentId: string) => void;
  addCharge: (cardId: string, amount: number, note?: string) => void;
  updateBalance: (cardId: string, balance: number) => void;
}

const CreditCardContext = createContext<CreditCardContextValue | null>(null);

export function CreditCardProvider({ children }: { children: React.ReactNode }) {
  const [creditCards, dispatch] = useReducer(reducer, []);
  const [isLoading, setIsLoading] = useState(true);
  const { onCurrencyChange } = useCurrency();

  // Listen for currency changes and convert all amounts
  useEffect(() => {
    return onCurrencyChange((_from, _to, convert) => {
      dispatch({
        type: 'CONVERT_ALL',
        payload: convert,
      });
    });
  }, [onCurrencyChange]);

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          const cards = JSON.parse(stored).map((c: CreditCard) => ({
            ...c,
            statementBalance: c.statementBalance ?? 0,
          }));
          dispatch({ type: 'LOAD', payload: cards });
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

  useEffect(() => {
    if (!isLoading) {
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(creditCards));
    }
  }, [creditCards, isLoading]);

  const addCreditCard = useCallback(
    (card: Omit<CreditCard, 'id' | 'payments'>) => {
      const id = Date.now().toString(36) + Math.random().toString(36).slice(2);
      dispatch({ type: 'ADD', payload: { ...card, id, payments: [] } });
    },
    [],
  );

  const updateCreditCard = useCallback(
    (card: CreditCard) => dispatch({ type: 'UPDATE', payload: card }),
    [],
  );

  const deleteCreditCard = useCallback(
    (id: string) => dispatch({ type: 'DELETE', payload: id }),
    [],
  );

  const toggleActive = useCallback(
    (id: string) => dispatch({ type: 'TOGGLE_ACTIVE', payload: id }),
    [],
  );

  const addPayment = useCallback(
    (cardId: string, payment: Omit<CreditCardPayment, 'id'>) => {
      const id = Date.now().toString(36) + Math.random().toString(36).slice(2);
      dispatch({ type: 'ADD_PAYMENT', payload: { cardId, payment: { ...payment, id } } });
    },
    [],
  );

  const deletePayment = useCallback(
    (cardId: string, paymentId: string) =>
      dispatch({ type: 'DELETE_PAYMENT', payload: { cardId, paymentId } }),
    [],
  );

  const addCharge = useCallback(
    (cardId: string, amount: number, note?: string) =>
      dispatch({ type: 'ADD_CHARGE', payload: { cardId, amount, note } }),
    [],
  );

  const updateBalance = useCallback(
    (cardId: string, balance: number) =>
      dispatch({ type: 'UPDATE_BALANCE', payload: { cardId, balance } }),
    [],
  );

  return (
    <CreditCardContext.Provider
      value={{ creditCards, isLoading, addCreditCard, updateCreditCard, deleteCreditCard, toggleActive, addPayment, deletePayment, addCharge, updateBalance }}
    >
      {children}
    </CreditCardContext.Provider>
  );
}

export function useCreditCards() {
  const ctx = useContext(CreditCardContext);
  if (!ctx) throw new Error('useCreditCards must be used within CreditCardProvider');
  return ctx;
}
