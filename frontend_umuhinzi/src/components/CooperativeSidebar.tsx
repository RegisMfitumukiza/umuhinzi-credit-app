import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { cooperativeApi, type CooperativeProfile } from "../api/cooperatives";
import { getCurrentUserProfile } from "../api/users";

const navClass = ({ isActive }: { isActive: boolean }) =>
  [
    "flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition",
    isActive ? "bg-emerald-500 text-white shadow" : "text-stone-700 hover:bg-stone-100",
  ].join(" ");

export const CooperativeSidebar = () => {
  const [cooperative, setCooperative] = useState<CooperativeProfile | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const currentUser = await getCurrentUserProfile().catch(() => null);
        const cooperativeId = currentUser?.cooperativeManagerProfile?.cooperativeId;

        if (!cooperativeId) {
          setCooperative(null);
          return;
        }

        const cooperatives = await cooperativeApi.getAllCooperatives().catch(() => [] as CooperativeProfile[]);
        setCooperative(cooperatives.find((item) => item.id === cooperativeId) || null);
      } catch {
        setCooperative(null);
      }
    })();
  }, []);

  return (
    <aside className="hidden w-72 flex-col border-r border-stone-200 bg-white px-5 py-6 shadow-[0_10px_40px_rgba(15,23,42,0.05)] lg:flex">
      <div className="mb-8 flex items-center gap-3 px-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-600 text-white shadow">
          <span className="text-sm font-bold">U</span>
        </div>
        <div>
          <p className="text-sm font-semibold text-emerald-700">Umuhinzi Credit</p>
          <p className="text-xs text-stone-500">Cooperative Management</p>
        </div>
      </div>

      <section className="mb-6 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-700">Current Cooperative</p>
        <p className="mt-1 text-sm font-semibold text-stone-900">{cooperative?.name || "No cooperative linked"}</p>
        <p className="mt-1 text-xs text-stone-500">{cooperative?.status || "Pending"}</p>
      </section>

      <nav className="flex flex-1 flex-col gap-1">
        <NavLink to="/cooperatives" end className={navClass}>Dashboard</NavLink>
        <NavLink to="/cooperatives/harvest-verification" className={navClass}>Harvest Verification</NavLink>
        <NavLink to="/cooperatives/members" className={navClass}>Members</NavLink>
        <NavLink to="/cooperatives/applications" className={navClass}>Loan Applications</NavLink>
        <NavLink to="/cooperatives/analytics" className={navClass}>Analytics</NavLink>
        <NavLink to="/cooperatives/reports" className={navClass}>Reports</NavLink>
        <NavLink to="/cooperatives/profile" className={navClass}>Profile</NavLink>
      </nav>
    </aside>
  );
};
