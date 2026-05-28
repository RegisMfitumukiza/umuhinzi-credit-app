import type { FarmStatus } from "../types/farm";

export const StatusBadge = ({ status }: { status: FarmStatus }) => {
  const className =
    status === "ACTIVE"
      ? "bg-emerald-100 text-emerald-800"
      : "bg-stone-200 text-stone-700";

  return <span className={`rounded-full px-3 py-1 text-xs font-semibold ${className}`}>{status}</span>;
};
