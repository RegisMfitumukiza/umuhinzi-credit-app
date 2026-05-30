import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { applications } from "./CooperativeApplicationsPage";
import { getUsers, type AdminUser } from "../api/users";
import { institutionApi, type InstitutionProfile, type InstitutionStatus } from "../api/institutions";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

export const AdminDashboardPage = () => {
  const [adminName, setAdminName] = useState("Admin");
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [institutions, setInstitutions] = useState<InstitutionProfile[]>([]);
  const [savingInstitutionId, setSavingInstitutionId] = useState<string | null>(null);
  const { user } = useAuth();
  const { showToast } = useToast();

  useEffect(() => {
    setAdminName(user?.fullName || user?.email || "Admin");

    void (async () => {
      try {
        const [userList, institutionList] = await Promise.all([
          getUsers(),
          institutionApi.getAllInstitutions(),
        ]);
        setUsers(userList);
        setInstitutions(institutionList);
      } catch {
        showToast("Unable to fetch user stats", "error");
      }
    })();
  }, [showToast, user?.email, user?.fullName]);

  const counts = useMemo(() => {
    const map: Record<string, number> = { FARMER: 0, COOPERATIVE_MANAGER: 0, INSTITUTION: 0, GOVERNMENT_PARTNER: 0 };
    users.forEach((u) => {
      if (map[u.role] !== undefined) map[u.role]++;
    });
    return map;
  }, [users]);

  const pendingInstitutions = useMemo(
    () => institutions.filter((institution) => (institution.status || "PENDING") === "PENDING"),
    [institutions]
  );

  const totalLoans = applications.reduce((sum, a) => sum + Number(a.amount.replace(/,/g, "")), 0);

  const handleInstitutionStatus = async (id: string, status: InstitutionStatus) => {
    setSavingInstitutionId(id);
    try {
      const updated = await institutionApi.updateInstitutionStatus(id, status);
      setInstitutions((prev) => prev.map((item) => (item.id === id ? updated : item)));
      showToast(`Institution ${status.toLowerCase()} successfully`, "success");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Unable to update institution", "error");
    } finally {
      setSavingInstitutionId(null);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] px-6 py-8">
      <div className="mx-auto max-w-[1200px]">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-stone-900">Admin Overview</h1>
            <p className="mt-1 text-sm text-stone-500">Welcome back, {adminName}</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
          <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
            <div className="text-sm text-stone-500">Total Farmers</div>
            <div className="mt-2 text-2xl font-semibold text-stone-900">{counts.FARMER}</div>
          </div>
          <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
            <div className="text-sm text-stone-500">Cooperative Managers</div>
            <div className="mt-2 text-2xl font-semibold text-stone-900">{counts.COOPERATIVE_MANAGER}</div>
          </div>
          <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
            <div className="text-sm text-stone-500">Finance Institutions</div>
            <div className="mt-2 text-2xl font-semibold text-stone-900">{counts.INSTITUTION}</div>
          </div>
          <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
            <div className="text-sm text-stone-500">Government Accounts</div>
            <div className="mt-2 text-2xl font-semibold text-stone-900">{counts.GOVERNMENT_PARTNER}</div>
          </div>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_360px]">
          <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-stone-900">User Distribution</h3>
              <div className="text-sm text-stone-500">Live</div>
            </div>
            <div className="h-56">
              <svg viewBox="0 0 400 160" className="w-full h-full" aria-hidden>
                {/* simple bar chart */}
                {Object.entries(counts).map(([k, v], i) => (
                  <g key={k} transform={`translate(${30 + i * 90},0)`}> 
                    <rect x={0} y={120 - v * 8} width={40} height={v * 8} fill="#10b981" rx={6} />
                    <text x={20} y={138} textAnchor="middle" className="fill-stone-600 text-xs">{k.replace(/_/g, ' ')}</text>
                    <text x={20} y={112 - v * 8} textAnchor="middle" className="fill-stone-700 text-sm font-semibold">{v}</text>
                  </g>
                ))}
              </svg>
            </div>
          </div>

          <aside className="space-y-4">
            <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
              <div className="text-sm text-stone-500">Total Loan Volume (from sample apps)</div>
              <div className="mt-2 text-2xl font-semibold text-stone-900">RWF {totalLoans.toLocaleString()}</div>
            </div>

            <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm text-stone-500">Institution Approvals</div>
                  <div className="mt-1 text-2xl font-semibold text-stone-900">{pendingInstitutions.length}</div>
                </div>
                <Link to="/admin/institutions" className="rounded-full border border-stone-200 bg-white px-3 py-2 text-xs font-semibold text-stone-700">View all</Link>
              </div>

              <div className="mt-4 space-y-3">
                {pendingInstitutions.slice(0, 3).map((institution) => (
                  <div key={institution.id} className="rounded-2xl border border-stone-200 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-semibold text-stone-900">{institution.name}</div>
                        <div className="text-xs text-stone-500">{institution.type} • {institution.email || institution.phone || "No contact"}</div>
                        <div className="mt-1 text-xs text-stone-400">Status: {institution.status || "PENDING"}</div>
                      </div>
                      <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">Pending</span>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        onClick={() => void handleInstitutionStatus(institution.id, "ACTIVE")}
                        disabled={savingInstitutionId === institution.id}
                        className="rounded-full bg-emerald-500 px-3 py-2 text-xs font-semibold text-white disabled:opacity-70"
                      >
                        {savingInstitutionId === institution.id ? "Saving..." : "Approve"}
                      </button>
                      <button
                        onClick={() => void handleInstitutionStatus(institution.id, "DEACTIVATED")}
                        disabled={savingInstitutionId === institution.id}
                        className="rounded-full border border-stone-200 bg-white px-3 py-2 text-xs font-semibold text-rose-600 disabled:opacity-70"
                      >
                        Deactivate
                      </button>
                    </div>
                  </div>
                ))}

                {pendingInstitutions.length === 0 && <div className="rounded-2xl border border-dashed border-stone-200 p-4 text-sm text-stone-500">No institution profiles waiting for approval.</div>}
              </div>
            </div>

            <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
              <div className="text-sm text-stone-500">Recent Activity</div>
              <div className="mt-3 space-y-2 text-sm text-stone-600">
                <div>New cooperative registered: Abahinzi Farmers Group</div>
                <div>Loan application submitted: APP-4096</div>
                <div>Platform backup completed</div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
