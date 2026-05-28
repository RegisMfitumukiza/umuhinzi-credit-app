import { Outlet } from "react-router-dom";
import { GovernmentSidebar } from "../components/GovernmentSidebar";

export const GovernmentLayout = () => {
  return (
    <div className="flex min-h-screen">
      <GovernmentSidebar />
      <div className="flex-1 bg-[#f7f8fa]">
        <header className="border-b border-stone-100 bg-white p-4">
          <div className="mx-auto flex max-w-[1400px] items-center justify-between">
            <div className="text-sm text-stone-600">Government Dashboard</div>
            <div className="text-sm text-stone-600">Vision 2050 Rural Insights</div>
          </div>
        </header>
        <main><Outlet /></main>
      </div>
    </div>
  );
};

export default GovernmentLayout;
