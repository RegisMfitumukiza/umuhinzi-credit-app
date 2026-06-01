import { Outlet } from "react-router-dom";
import { AdminSidebar } from "../components/AdminSidebar";
import { useAuth } from "../context/AuthContext";

export const AdminLayout = () => {
  const { logout } = useAuth();

  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <div className="flex-1 bg-[#f7f8fa]">
        <header className="border-b border-stone-100 bg-white p-4">
          <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-4">
            <div className="text-sm text-stone-600">Admin Panel</div>
            <div className="flex items-center gap-3 text-sm text-stone-600">
              <div>{new Date().toLocaleDateString()}</div>
              <button
                type="button"
                onClick={logout}
                className="rounded-full border border-stone-200 px-4 py-2 font-semibold text-stone-700 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700"
              >
                Logout
              </button>
            </div>
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
