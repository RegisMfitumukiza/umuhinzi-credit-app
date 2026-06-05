import { NavLink } from "react-router-dom";

const navClass = ({ isActive }: { isActive: boolean }) =>
  [
    "flex items-center rounded-xl px-4 py-3 text-sm font-medium transition",
    isActive ? "bg-brand-500 text-white shadow" : "text-stone-700 hover:bg-stone-100",
  ].join(" ");

const secondaryNavClass = ({ isActive }: { isActive: boolean }) =>
  [
    "flex items-center rounded-xl px-4 py-3 text-sm font-medium transition",
    isActive ? "bg-brand-600 text-white shadow" : "text-stone-600 hover:bg-brand-50 hover:text-brand-700",
  ].join(" ");

export const Sidebar = () => {
  return (
    <aside className="flex h-full w-72 flex-col border-r border-stone-200 bg-white px-5 py-6 shadow-sm">
      <div className="mb-8 flex items-center gap-3 px-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-600 text-white shadow">
          <span className="text-sm font-bold">U</span>
        </div>
        <div>
          <p className="text-sm font-semibold text-brand-700">Umuhinzi Credit</p>
          <p className="text-xs text-stone-500">Farmer Profile & Farm Management</p>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        <NavLink to="/farmer/dashboard" className={navClass}>Dashboard</NavLink>
        <NavLink to="/farms" className={navClass}>Farms</NavLink>
        <NavLink to="/crops" className={navClass}>Record Crops</NavLink>
        <NavLink to="/harvests" className={navClass}>Track Harvests</NavLink>
        <NavLink to="/recommendations" className={navClass}>Recommendations</NavLink>
        <NavLink to="/analytics" className={navClass}>Credit Score</NavLink>
        <NavLink to="/loans" className={navClass}>Apply for Loan</NavLink>
        <NavLink to="/payments" className={navClass}>Repayments</NavLink>

        <div className="mt-6 border-t border-stone-200 pt-4">
          <p className="px-4 pb-2 text-[11px] font-semibold uppercase tracking-[0.3em] text-stone-400">Pages</p>
          <div className="flex flex-col gap-1">
            <NavLink to="/notifications" className={secondaryNavClass}>Notifications</NavLink>
            <NavLink to="/profile" className={secondaryNavClass}>Profile</NavLink>
            {/* <NavLink to="/settings" className={secondaryNavClass}>Settings</NavLink> */}
          </div>
        </div>
      </nav>

      <div className="mt-6 rounded-2xl border border-stone-200 bg-stone-50 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-stone-400">Live mode</p>
        <p className="mt-2 text-sm text-stone-600">Tract you activity and get good score to get more loan.</p>
      </div>
    </aside>
  );
};

export default Sidebar;