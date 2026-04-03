import React, { createContext, useContext, useEffect, useReducer, useCallback, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Loan, LoanPayment } from '@/constants/theme';
import { useCurrency } from './CurrencyContext';

const STORAGE_KEY = '@finvy_loans';

const SAMPLE_DATA: Loan[] = [];

type Action =
  | { type: 'LOAD'; payload: Loan[] }
  | { type: 'ADD'; payload: Loan }
  | { type: 'UPDATE'; payload: Loan }
  | { type: 'DELETE'; payload: string }
  | { type: 'ADD_PAYMENT'; payload: { loanId: string; payment: LoanPayment } }
  | { type: 'DELETE_PAYMENT'; payload: { loanId: string; paymentId: string } }
  | { type: 'CONVERT_ALL'; payload: (amount: number) => number };

function reducer(state: Loan[], action: Action): Loan[] {
  switch (action.type) {
    case 'LOAD':
      return action.payload;
    case 'ADD':
      return [...state, action.payload];
    case 'UPDATE':
      return state.map((l) => (l.id === action.payload.id ? action.payload : l));
    case 'DELETE':
      return state.filter((l) => l.id !== action.payload);
    case 'ADD_PAYMENT':
      return state.map((l) => {
        if (l.id !== action.payload.loanId) return l;
        return {
          ...l,
          currentBalance: Math.max(0, l.currentBalance - action.payload.payment.amount),
          payments: [action.payload.payment, ...l.payments],
        };
      });
    case 'DELETE_PAYMENT':
      return state.map((l) => {
        if (l.id !== action.payload.loanId) return l;
        const payment = l.payments.find((p) => p.id === action.payload.paymentId);
        return {
          ...l,
          currentBalance: payment ? l.currentBalance + payment.amount : l.currentBalance,
          payments: l.payments.filter((p) => p.id !== action.payload.paymentId),
        };
      });
    case 'CONVERT_ALL': {
      const conv = action.payload;
      const round = (n: number) => Math.round(conv(n) * 100) / 100;
      return state.map((l) => ({
        ...l,
        principalAmount: round(l.principalAmount),
        currentBalance: round(l.currentBalance),
        monthlyPayment: round(l.monthlyPayment),
        payments: l.payments.map((p) => ({ ...p, amount: round(p.amount) })),
      }));
    }
    default:
      return state;
  }
}

interface LoanContextValue {
  loans: Loan[];
  isLoading: boolean;
  addLoan: (loan: Omit<Loan, 'id' | 'payments'>) => void;
  updateLoan: (loan: Loan) => void;
  deleteLoan: (id: string) => void;
  addPayment: (loanId: string, payment: Omit<LoanPayment, 'id'>) => void;
  deletePayment: (loanId: string, paymentId: string) => void;
}

const LoanContext = createContext<LoanContextValue | null>(null);

export function LoanProvider({ children }: { children: React.ReactNode }) {
  const [loans, dispatch] = useReducer(reducer, []);
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
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(loans));
    }
  }, [loans, isLoading]);

  const addLoan = useCallback((loan: Omit<Loan, 'id' | 'payments'>) => {
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2);
    dispatch({ type: 'ADD', payload: { ...loan, id, payments: [] } });
  }, []);

  const updateLoan = useCallback((loan: Loan) => dispatch({ type: 'UPDATE', payload: loan }), []);
  const deleteLoan = useCallback((id: string) => dispatch({ type: 'DELETE', payload: id }), []);

  const addPayment = useCallback((loanId: string, payment: Omit<LoanPayment, 'id'>) => {
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2);
    dispatch({ type: 'ADD_PAYMENT', payload: { loanId, payment: { ...payment, id } } });
  }, []);

  const deletePayment = useCallback(
    (loanId: string, paymentId: string) =>
      dispatch({ type: 'DELETE_PAYMENT', payload: { loanId, paymentId } }),
    [],
  );

  return (
    <LoanContext.Provider value={{ loans, isLoading, addLoan, updateLoan, deleteLoan, addPayment, deletePayment }}>
      {children}
    </LoanContext.Provider>
  );
}

export function useLoans() {
  const ctx = useContext(LoanContext);
  if (!ctx) throw new Error('useLoans must be used within LoanProvider');
  return ctx;
}
