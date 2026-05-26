import { Outlet } from "react-router-dom";
import { AdminSidebar } from "../components/AdminSidebar";

export const AdminLayout = () => {
  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <div className="flex-1 bg-[#f7f8fa]">
        <header className="border-b border-stone-100 bg-white p-4">
          <div className="mx-auto max-w-[1400px] flex items-center justify-between">
            <div className="text-sm text-stone-600">Admin Panel</div>
            <div className="text-sm text-stone-600">{new Date().toLocaleDateString()}</div>
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
