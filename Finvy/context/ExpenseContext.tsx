import React, { createContext, useContext, useEffect, useReducer, useCallback, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Expense } from '@/constants/theme';
import { useCurrency } from './CurrencyContext';

const STORAGE_KEY = '@finvy_expenses';

const SAMPLE_DATA: Expense[] = [];

type Action =
  | { type: 'LOAD'; payload: Expense[] }
  | { type: 'ADD'; payload: Expense }
  | { type: 'DELETE'; payload: string }
  | { type: 'CONVERT_ALL'; payload: (amount: number) => number };

function reducer(state: Expense[], action: Action): Expense[] {
  switch (action.type) {
    case 'LOAD':
      return action.payload;
    case 'ADD':
      return [action.payload, ...state];
    case 'DELETE':
      return state.filter((e) => e.id !== action.payload);
    case 'CONVERT_ALL': {
      const conv = action.payload;
      return state.map((e) => ({
        ...e,
        amount: Math.round(conv(e.amount) * 100) / 100,
      }));
    }
    default:
      return state;
  }
}

interface ExpenseContextValue {
  expenses: Expense[];
  isLoading: boolean;
  addExpense: (expense: Omit<Expense, 'id'>) => void;
  deleteExpense: (id: string) => void;
}

const ExpenseContext = createContext<ExpenseContextValue | null>(null);

export function ExpenseProvider({ children }: { children: React.ReactNode }) {
  const [expenses, dispatch] = useReducer(reducer, []);
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
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
    }
  }, [expenses, isLoading]);

  const addExpense = useCallback((expense: Omit<Expense, 'id'>) => {
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2);
    dispatch({ type: 'ADD', payload: { ...expense, id } });
  }, []);

  const deleteExpense = useCallback((id: string) => {
    dispatch({ type: 'DELETE', payload: id });
  }, []);

  return (
    <ExpenseContext.Provider value={{ expenses, isLoading, addExpense, deleteExpense }}>
      {children}
    </ExpenseContext.Provider>
  );
}

export function useExpenses() {
  const ctx = useContext(ExpenseContext);
  if (!ctx) throw new Error('useExpenses must be used within ExpenseProvider');
  return ctx;
}
