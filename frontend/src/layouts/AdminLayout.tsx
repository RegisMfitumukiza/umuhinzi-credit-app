import { useState } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const navItems = [
  { to: "/admin", label: "Dashboard" },
  { to: "/admin/users", label: "Users" },
  { to: "/admin/farmers", label: "Farmers" },
  { to: "/admin/institutions", label: "Institutions" },
  { to: "/admin/cooperatives", label: "Cooperatives" },
  { to: "/admin/market-prices", label: "Market Prices" },
  { to: "/admin/seasons", label: "Seasons" },
  { to: "/admin/loans", label: "Loans" },
  { to: "/admin/recommendations", label: "Recommendations" },
  { to: "/admin/analytics", label: "Analytics" },
  { to: "/admin/profile", label: "Profile" },
];

const Hamburger = ({ onClick }: { onClick: () => void }) => (
  <button onClick={onClick} className="p-1.5 text-stone-700 rounded-full hover:bg-stone-100">
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  </button>
);

const Close = ({ onClick }: { onClick: () => void }) => (
  <button onClick={onClick} className="p-1.5 text-stone-500 hover:text-stone-700 rounded-full hover:bg-stone-100">
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  </button>
);

export const AdminLayout = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const close = () => setMobileOpen(false);

  return (
    <div className="min-h-screen flex bg-stone-100">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-stone-200 py-6 px-4 gap-2">
        <div
          className="flex items-center gap-2 px-3 mb-6 cursor-pointer"
          onClick={() => navigate("/admin")}
        >
          <div className="w-8 h-8 rounded-full bg-stone-900 flex items-center justify-center">
            <span className="text-white text-xs font-bold">A</span>
          </div>
          <span className="font-black text-stone-900 tracking-tight">Admin Panel</span>
        </div>

        <nav className="flex-1 flex flex-col gap-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/admin"}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-full text-sm font-medium transition-colors ${
                  isActive ? "bg-stone-900 text-white" : "text-stone-600 hover:bg-stone-100"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-stone-100 pt-4 mt-2">
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-full text-sm font-medium text-stone-500 hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* Mobile backdrop */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/40 z-40 md:hidden" onClick={close} />
      )}

      {/* Mobile drawer */}
      <div
        className={`fixed inset-y-0 left-0 w-72 bg-white z-50 md:hidden flex flex-col py-6 px-4 gap-2 shadow-xl transition-transform duration-200 ease-out ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-3 mb-6">
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => { navigate("/admin"); close(); }}
          >
            <div className="w-8 h-8 rounded-full bg-stone-900 flex items-center justify-center">
              <span className="text-white text-xs font-bold">A</span>
            </div>
            <span className="font-black text-stone-900 tracking-tight">Admin Panel</span>
          </div>
          <Close onClick={close} />
        </div>

        <nav className="flex-1 flex flex-col gap-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/admin"}
              onClick={close}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-full text-sm font-medium transition-colors ${
                  isActive ? "bg-stone-900 text-white" : "text-stone-600 hover:bg-stone-100"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-stone-100 pt-4 mt-2">
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-full text-sm font-medium text-stone-500 hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="md:hidden flex items-center justify-between bg-white border-b border-stone-200 px-4 py-3">
          <Hamburger onClick={() => setMobileOpen(true)} />
          <span className="font-black text-stone-900 tracking-tight">Admin Panel</span>
          <div className="w-8" />
        </header>

        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
