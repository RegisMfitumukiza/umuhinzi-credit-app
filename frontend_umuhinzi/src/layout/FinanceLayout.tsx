import { Outlet } from "react-router-dom";
import { FinanceSidebar } from "../components/FinanceSidebar";

export const FinanceLayout = () => {
  return (
    <div className="flex min-h-screen">
      <FinanceSidebar />
      <div className="flex-1 bg-[#f7f8fa]">
        <header className="border-b border-stone-100 bg-white p-4">
          <div className="mx-auto flex max-w-[1400px] items-center justify-between">
            <div className="text-sm text-stone-600">Finance Dashboard</div>
            <div className="text-sm text-stone-600">RWF Portfolio Review</div>
          </div>
        </header>
        <main><Outlet /></main>
      </div>
    </div>
  );
};

export default FinanceLayout;
