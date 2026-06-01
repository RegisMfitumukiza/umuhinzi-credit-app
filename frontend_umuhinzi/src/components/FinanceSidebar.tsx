import { NavLink } from "react-router-dom";

const navClass = ({ isActive }: { isActive: boolean }) =>
  [
    "flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition",
    isActive ? "bg-emerald-500 text-white shadow" : "text-stone-700 hover:bg-stone-100",
  ].join(" ");

export const FinanceSidebar = () => {
  return (
    <aside className="hidden w-72 flex-col border-r border-stone-200 bg-white px-5 py-6 shadow-[0_10px_40px_rgba(15,23,42,0.05)] lg:flex">
      <div className="mb-8 flex items-center gap-3 px-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-600 text-white shadow">
          <span className="text-sm font-bold">F</span>
        </div>
        <div>
          <p className="text-sm font-semibold text-emerald-700">Finance Institution</p>
          <p className="text-xs text-stone-500">Loan Review & Portfolio</p>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        <NavLink to="/finance" end className={navClass}>Overview</NavLink>
        <NavLink to="/finance/applications" className={navClass}>Applications</NavLink>
        <NavLink to="/finance/portfolio" className={navClass}>Portfolio</NavLink>
        <NavLink to="/finance/reports" className={navClass}>Reports</NavLink>
        <NavLink to="/finance/profile" className={navClass}>Profile</NavLink>
      </nav>
    </aside>
  );
};

export default FinanceSidebar;
