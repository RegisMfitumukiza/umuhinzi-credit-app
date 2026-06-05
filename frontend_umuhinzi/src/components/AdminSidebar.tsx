import { NavLink } from "react-router-dom";

const navClass = ({ isActive }: { isActive: boolean }) =>
  [
    "flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition",
    isActive ? "bg-emerald-500 text-white shadow" : "text-stone-700 hover:bg-stone-100",
  ].join(" ");

export const AdminSidebar = () => {
  return (
    <aside className="hidden w-72 flex-col border-r border-stone-200 bg-white px-5 py-6 shadow-[0_10px_40px_rgba(15,23,42,0.05)] lg:flex">
      <div className="mb-8 flex items-center gap-3 px-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-600 text-white shadow">
          <span className="text-sm font-bold">U</span>
        </div>
        <div>
          <p className="text-sm font-semibold text-emerald-700">Umuhinzi Admin</p>
          <p className="text-xs text-stone-500">Platform Administration</p>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        <NavLink to="/admin" end className={navClass}>Overview</NavLink>
        <NavLink to="/admin/users" className={navClass}>User Management</NavLink>
        <NavLink to="/admin/institutions" className={navClass}>Institutions account</NavLink>
        <NavLink to="/admin/government" className={navClass}>Government Accounts</NavLink>
        <NavLink to="/admin/seasons" className={navClass}>Seasons</NavLink>
        <NavLink to="/admin/audit" className={navClass}>Audit Center</NavLink>
        <NavLink to="/admin/profile" className={navClass}>Profile</NavLink>
      </nav>
    </aside>
  );
};

export default AdminSidebar;
