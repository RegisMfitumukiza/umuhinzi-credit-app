import { Outlet, useNavigate } from "react-router-dom";
import { AdminSidebar } from "../components/AdminSidebar";

export const AdminLayout = () => {
  const navigate = useNavigate();
  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <div className="flex-1 bg-[#f7f8fa]">
        <header className="border-b border-stone-100 bg-white p-4">
          <div className="mx-auto max-w-[1400px] flex items-center justify-between">
            <div className="text-sm text-stone-600">Admin Panel</div>
            <button onClick={() => navigate("/account")} className="rounded-full p-2 text-stone-500 hover:bg-stone-100 transition">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
            </button>
          </div>
        </header>
        <main>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
