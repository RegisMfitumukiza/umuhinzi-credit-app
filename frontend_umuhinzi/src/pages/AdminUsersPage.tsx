import { useEffect, useState } from "react";
import { getUsers, updateUserStatus, deleteUser, type AdminUser } from "../api/users";
import { farmerApi, type AdminFarmer } from "../api/farmer";
import { useToast } from "../context/ToastContext";

export const AdminUsersPage = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [farmers, setFarmers] = useState<AdminFarmer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    void (async () => {
      try {
        const [u, farmerList] = await Promise.all([getUsers(), farmerApi.getAllFarmers().catch(() => [] as AdminFarmer[])]);
        setUsers(u);
        setFarmers(farmerList);
      } catch {
        showToast("Unable to fetch users", "error");
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const farmerSeasonByUserId = new Map(
    farmers.map((farmer) => {
      const season = farmer.productivityRecords?.[0]?.season;
      const seasonLabel = season ? `${season.name || "Season"}${season.year ? ` ${season.year}` : ""}` : "-";
      return [farmer.userId, seasonLabel];
    })
  );

  const toggleEnable = async (id: string, enabled: boolean) => {
    const nextStatus = enabled ? "SUSPENDED" : "ACTIVE";

    try {
      const updatedUser = await updateUserStatus(id, nextStatus);
      setUsers((prev) => prev.map((u) => (u.id === id ? updatedUser : u)));
      showToast("User status updated", "success");
    } catch {
      showToast("Unable to update user status", "error");
    }
  };

  const handleDelete = async (id: string, name: string) => {
    const confirmed = window.confirm(`Delete ${name}? This cannot be undone.`);
    if (!confirmed) return;

    try {
      await deleteUser(id);
      setUsers((prev) => prev.filter((u) => u.id !== id));
      setFarmers((prev) => prev.filter((farmer) => farmer.userId !== id));
      showToast("User deleted", "success");
    } catch {
      showToast("Unable to delete user", "error");
    }
  };

  if (isLoading) {
    return <div className="p-6 text-sm text-stone-500">Loading users...</div>;
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] px-6 py-8">
      <div className="mx-auto max-w-[1200px]">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-stone-900">User Management</h1>
            <p className="mt-1 text-sm text-stone-500">Enable or disable platform users.</p>
          </div>
        </div>

        <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
          <table className="min-w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-[0.12em] text-stone-400">
              <tr>
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2">Email</th>
                <th className="px-3 py-2">Role</th>
                <th className="px-3 py-2">Season</th>
                <th className="px-3 py-2 text-right">Status</th>
                <th className="px-3 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-t border-stone-100">
                  <td className="px-3 py-3 font-medium text-stone-900">{u.fullName}</td>
                  <td className="px-3 py-3 text-stone-600">{u.email}</td>
                  <td className="px-3 py-3 text-stone-600">{u.role}</td>
                  <td className="px-3 py-3 text-stone-600">{u.role === "FARMER" ? (farmerSeasonByUserId.get(u.id) || "-") : "-"}</td>
                  <td className="px-3 py-3 text-right">
                    <button onClick={() => void toggleEnable(u.id, u.enabled)} className={`rounded-full px-3 py-2 text-sm ${u.enabled ? 'bg-emerald-500 text-white' : 'border border-stone-200 text-stone-700'}`}>
                      {u.enabled ? 'Enabled' : 'Disabled'}
                    </button>
                  </td>
                  <td className="px-3 py-3 text-right">
                    <button onClick={() => void handleDelete(u.id, u.fullName)} className="rounded-full border border-rose-200 px-3 py-2 text-sm font-medium text-rose-700 hover:bg-rose-50">
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminUsersPage;
