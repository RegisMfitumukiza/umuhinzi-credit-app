import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

type ToastType = "success" | "error" | "info";

type ToastState = {
  message: string;
  type: ToastType;
};

type ToastContextValue = {
  toast: ToastState | null;
  showToast: (message: string, type?: ToastType) => void;
  clearToast: () => void;
};

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toast, setToast] = useState<ToastState | null>(null);

  const showToast = useCallback((message: string, type: ToastType = "info") => {
    setToast({ message, type });
  }, []);

  const clearToast = useCallback(() => {
    setToast(null);
  }, []);

  const value = useMemo<ToastContextValue>(
    () => ({
      toast,
      showToast,
      clearToast,
    }),
    [toast, showToast, clearToast]
  );

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
};

export const useToast = () => {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }

  return context;
};
