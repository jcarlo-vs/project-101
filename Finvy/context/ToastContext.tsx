import React, { createContext, useContext, useState, useCallback } from 'react';

interface ToastState {
  message: string;
  visible: boolean;
  icon?: string;
  color?: string;
}

interface ToastContextValue {
  toast: ToastState;
  showToast: (message: string, icon?: string, color?: string) => void;
  hideToast: () => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<ToastState>({ message: '', visible: false });

  const showToast = useCallback((message: string, icon?: string, color?: string) => {
    setToast({ message, visible: true, icon, color });
  }, []);

  const hideToast = useCallback(() => {
    setToast((prev) => ({ ...prev, visible: false }));
  }, []);

  return (
    <ToastContext.Provider value={{ toast, showToast, hideToast }}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
