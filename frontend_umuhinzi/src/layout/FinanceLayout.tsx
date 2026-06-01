import { Outlet } from "react-router-dom";
import { FinanceSidebar } from "../components/FinanceSidebar";
import { useAuth } from "../context/AuthContext";

export const FinanceLayout = () => {
  const { logout } = useAuth();

  return (
    <div className="flex min-h-screen">
      <FinanceSidebar />
      <div className="flex-1 bg-[#f7f8fa]">
        <header className="border-b border-stone-100 bg-white p-4">
          <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-4">
            <div className="text-sm text-stone-600">Finance Dashboard</div>
            <div className="flex items-center gap-3">
              <div className="text-sm text-stone-600">RWF Portfolio Review</div>
              <button
                type="button"
                onClick={logout}
                className="rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-stone-700 shadow-sm transition hover:bg-stone-50"
              >
                Logout
              </button>
            </div>
          </div>
        </header>
        <main><Outlet /></main>
      </div>
    </div>
  );
};

export default FinanceLayout;
