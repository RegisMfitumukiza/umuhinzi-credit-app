import { NavLink } from "react-router-dom";

const navClass = ({ isActive }: { isActive: boolean }) =>
  [
    "flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition",
    isActive ? "bg-emerald-500 text-white shadow" : "text-stone-700 hover:bg-stone-100",
  ].join(" ");

export const CooperativeSidebar = () => {
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

      <nav className="flex flex-1 flex-col gap-1">
        <NavLink to="/cooperatives" end className={navClass}>
          Dashboard
        </NavLink>
        <NavLink to="/cooperatives/profile" className={navClass}>
          Profile
        </NavLink>
        <NavLink to="/cooperatives/applications" className={navClass}>
          Applications
        </NavLink>
        <NavLink to="/cooperatives/members" className={navClass}>
          Members
        </NavLink>
        <NavLink to="/cooperatives/risk-analytics" className={navClass}>
          Risk Analytics
        </NavLink>
        <NavLink to="/cooperatives/regional-map" className={navClass}>
          Regional Map
        </NavLink>
        <NavLink to="/cooperatives/reports" className={navClass}>
          Reports
        </NavLink>
      </nav>
    </aside>
  );
};
