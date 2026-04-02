import React, { createContext, useContext, useEffect, useCallback, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { IncomeSource } from '@/constants/theme';
import { useCurrency } from './CurrencyContext';

const INCOME_KEY = '@finvy_income';

const SAMPLE_INCOME: IncomeSource[] = [];

interface BudgetContextValue {
  incomeSources: IncomeSource[];
  isLoading: boolean;
  addIncome: (source: Omit<IncomeSource, 'id'>) => void;
  updateIncome: (source: IncomeSource) => void;
  deleteIncome: (id: string) => void;
}

const BudgetContext = createContext<BudgetContextValue | null>(null);

export function BudgetProvider({ children }: { children: React.ReactNode }) {
  const [incomeSources, setIncomeSources] = useState<IncomeSource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { onCurrencyChange } = useCurrency();

  useEffect(() => {
    return onCurrencyChange((_from, _to, convert) => {
      setIncomeSources((prev) => prev.map((s) => ({ ...s, amount: Math.round(convert(s.amount) * 100) / 100 })));
    });
  }, [onCurrencyChange]);

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(INCOME_KEY);
        setIncomeSources(stored ? JSON.parse(stored) : SAMPLE_INCOME);
        if (!stored) await AsyncStorage.setItem(INCOME_KEY, JSON.stringify(SAMPLE_INCOME));
      } catch {
        setIncomeSources(SAMPLE_INCOME);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!isLoading) AsyncStorage.setItem(INCOME_KEY, JSON.stringify(incomeSources));
  }, [incomeSources, isLoading]);

  const addIncome = useCallback((source: Omit<IncomeSource, 'id'>) => {
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2);
    setIncomeSources((prev) => [...prev, { ...source, id }]);
  }, []);

  const updateIncome = useCallback((source: IncomeSource) => {
    setIncomeSources((prev) => prev.map((s) => (s.id === source.id ? source : s)));
  }, []);

  const deleteIncome = useCallback((id: string) => {
    setIncomeSources((prev) => prev.filter((s) => s.id !== id));
  }, []);

  return (
    <BudgetContext.Provider value={{ incomeSources, isLoading, addIncome, updateIncome, deleteIncome }}>
      {children}
    </BudgetContext.Provider>
  );
}

export function useBudget() {
  const ctx = useContext(BudgetContext);
  if (!ctx) throw new Error('useBudget must be used within BudgetProvider');
  return ctx;
}
