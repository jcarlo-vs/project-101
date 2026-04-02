import React, { createContext, useContext, useEffect, useReducer, useCallback, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Bill, BillPayment } from '@/constants/theme';
import { useCurrency } from './CurrencyContext';

const STORAGE_KEY = '@finvy_bills';

const SAMPLE_DATA: Bill[] = [];

type Action =
  | { type: 'LOAD'; payload: Bill[] }
  | { type: 'ADD'; payload: Bill }
  | { type: 'UPDATE'; payload: Bill }
  | { type: 'DELETE'; payload: string }
  | { type: 'TOGGLE_ACTIVE'; payload: string }
  | { type: 'ADD_PAYMENT'; payload: { billId: string; payment: BillPayment } }
  | { type: 'DELETE_PAYMENT'; payload: { billId: string; paymentId: string } }
  | { type: 'CONVERT_ALL'; payload: (amount: number) => number };

function reducer(state: Bill[], action: Action): Bill[] {
  switch (action.type) {
    case 'LOAD':
      return action.payload;
    case 'ADD':
      return [...state, action.payload];
    case 'UPDATE':
      return state.map((b) => (b.id === action.payload.id ? action.payload : b));
    case 'DELETE':
      return state.filter((b) => b.id !== action.payload);
    case 'TOGGLE_ACTIVE':
      return state.map((b) =>
        b.id === action.payload ? { ...b, active: !b.active } : b,
      );
    case 'ADD_PAYMENT':
      return state.map((b) => {
        if (b.id !== action.payload.billId) return b;
        return { ...b, payments: [action.payload.payment, ...b.payments] };
      });
    case 'DELETE_PAYMENT':
      return state.map((b) => {
        if (b.id !== action.payload.billId) return b;
        return { ...b, payments: b.payments.filter((p) => p.id !== action.payload.paymentId) };
      });
    case 'CONVERT_ALL': {
      const conv = action.payload;
      const round = (n: number) => Math.round(conv(n) * 100) / 100;
      return state.map((b) => ({
        ...b,
        amount: round(b.amount),
        payments: b.payments.map((p) => ({ ...p, amount: round(p.amount) })),
      }));
    }
    default:
      return state;
  }
}

interface BillContextValue {
  bills: Bill[];
  isLoading: boolean;
  addBill: (bill: Omit<Bill, 'id' | 'payments'>) => void;
  updateBill: (bill: Bill) => void;
  deleteBill: (id: string) => void;
  toggleActive: (id: string) => void;
  addPayment: (billId: string, payment: Omit<BillPayment, 'id'>) => void;
  deletePayment: (billId: string, paymentId: string) => void;
}

const BillContext = createContext<BillContextValue | null>(null);

export function BillProvider({ children }: { children: React.ReactNode }) {
  const [bills, dispatch] = useReducer(reducer, []);
  const [isLoading, setIsLoading] = useState(true);
  const { onCurrencyChange } = useCurrency();

  useEffect(() => {
    return onCurrencyChange((_from, _to, convert) => {
      dispatch({ type: 'CONVERT_ALL', payload: convert });
    });
  }, [onCurrencyChange]);

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
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

  useEffect(() => {
    if (!isLoading) {
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(bills));
    }
  }, [bills, isLoading]);

  const addBill = useCallback((bill: Omit<Bill, 'id' | 'payments'>) => {
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2);
    dispatch({ type: 'ADD', payload: { ...bill, id, payments: [] } });
  }, []);

  const updateBill = useCallback((bill: Bill) => dispatch({ type: 'UPDATE', payload: bill }), []);
  const deleteBill = useCallback((id: string) => dispatch({ type: 'DELETE', payload: id }), []);
  const toggleActive = useCallback((id: string) => dispatch({ type: 'TOGGLE_ACTIVE', payload: id }), []);

  const addPayment = useCallback((billId: string, payment: Omit<BillPayment, 'id'>) => {
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2);
    dispatch({ type: 'ADD_PAYMENT', payload: { billId, payment: { ...payment, id } } });
  }, []);

  const deletePayment = useCallback(
    (billId: string, paymentId: string) =>
      dispatch({ type: 'DELETE_PAYMENT', payload: { billId, paymentId } }),
    [],
  );

  return (
    <BillContext.Provider value={{ bills, isLoading, addBill, updateBill, deleteBill, toggleActive, addPayment, deletePayment }}>
      {children}
    </BillContext.Provider>
  );
}

export function useBills() {
  const ctx = useContext(BillContext);
  if (!ctx) throw new Error('useBills must be used within BillProvider');
  return ctx;
}
