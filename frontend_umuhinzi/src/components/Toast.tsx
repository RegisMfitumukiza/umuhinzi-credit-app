import { useEffect } from "react";
import { useToast } from "../context/ToastContext";

export const Toast = () => {
  const { toast, clearToast } = useToast();

  useEffect(() => {
    if (!toast) return;

    const timeout = window.setTimeout(() => clearToast(), 2500);
    return () => window.clearTimeout(timeout);
  }, [toast, clearToast]);

  if (!toast) {
    return null;
  }

  const tone =
    toast.type === "success"
      ? "border-emerald-500 bg-emerald-50 text-emerald-900"
      : toast.type === "error"
        ? "border-red-500 bg-red-50 text-red-900"
        : "border-brand-500 bg-brand-50 text-brand-900";

  return (
    <div className="fixed right-4 top-4 z-50 rounded-2xl border px-4 py-3 shadow-panel backdrop-blur-sm transition-all">
      <div className={`rounded-xl border-l-4 p-3 ${tone}`}>{toast.message}</div>
    </div>
  );
};
