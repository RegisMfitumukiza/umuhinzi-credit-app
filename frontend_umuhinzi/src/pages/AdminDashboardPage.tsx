import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getLoanApplications, type LoanApplicationUi } from "../api/loanApplications";
import { getUsers, type AdminUser } from "../api/users";
import { institutionApi, type InstitutionProfile, type InstitutionStatus } from "../api/institutions";
import { cooperativeApi, type CooperativeProfile, type CooperativeStatus } from "../api/cooperatives";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

export const AdminDashboardPage = () => {
  const [adminName, setAdminName] = useState("Admin");
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [institutions, setInstitutions] = useState<InstitutionProfile[]>([]);
  const [cooperatives, setCooperatives] = useState<CooperativeProfile[]>([]);
  const [applications, setApplications] = useState<LoanApplicationUi[]>([]);
  const [savingInstitutionId, setSavingInstitutionId] = useState<string | null>(null);
  const [savingCooperativeId, setSavingCooperativeId] = useState<string | null>(null);
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
        const cooperativeList = await cooperativeApi.getAllCooperatives();
        const applicationList = await getLoanApplications().catch(() => [] as LoanApplicationUi[]);
        setUsers(userList);
        setInstitutions(institutionList);
        setCooperatives(cooperativeList);
        setApplications(applicationList);
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

  const pendingCooperatives = useMemo(
    () => cooperatives.filter((cooperative) => (cooperative.status || "PENDING") === "PENDING"),
    [cooperatives]
  );

  const totalLoans = applications.reduce((sum: number, application) => sum + Number(application.amount.replace(/,/g, "")), 0);
  const userDistribution = useMemo(
    () => [
      { label: "Farmers", value: counts.FARMER, tone: "bg-emerald-500" },
      { label: "Cooperative Managers", value: counts.COOPERATIVE_MANAGER, tone: "bg-emerald-400" },
      { label: "Institution Accounts", value: counts.INSTITUTION, tone: "bg-emerald-300" },
      { label: "Government Partners", value: counts.GOVERNMENT_PARTNER, tone: "bg-emerald-200" },
    ],
    [counts]
  );
  const maxUserCount = Math.max(...userDistribution.map((item) => item.value), 1);

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

  const handleCooperativeStatus = async (id: string, status: CooperativeStatus) => {
    setSavingCooperativeId(id);
    try {
      const updated = await cooperativeApi.updateCooperativeStatus(id, status);
      setCooperatives((prev) => prev.map((item) => (item.id === id ? updated : item)));
      showToast(`Cooperative ${status.toLowerCase()} successfully`, "success");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Unable to update cooperative", "error");
    } finally {
      setSavingCooperativeId(null);
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
            <div className="space-y-4">
              {userDistribution.map((item) => {
                const width = `${(item.value / maxUserCount) * 100}%`;

                return (
                  <div key={item.label} className="space-y-2">
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="font-medium text-stone-700">{item.label}</span>
                      <span className="font-semibold text-stone-900">{item.value}</span>
                    </div>
                    <div className="h-3 overflow-hidden rounded-full bg-stone-100">
                      <div className={`h-full rounded-full ${item.tone}`} style={{ width }} />
                    </div>
                  </div>
                );
              })}

              <div className="grid grid-cols-4 gap-3 pt-2 text-center text-xs text-stone-500">
                {userDistribution.map((item) => (
                  <div key={item.label} className="space-y-1">
                    <div className="mx-auto h-2 w-8 rounded-full bg-stone-200" />
                    <div>{item.label}</div>
                  </div>
                ))}
              </div>
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
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm text-stone-500">Cooperative Approvals</div>
                  <div className="mt-1 text-2xl font-semibold text-stone-900">{pendingCooperatives.length}</div>
                </div>
                <Link to="/cooperatives" className="rounded-full border border-stone-200 bg-white px-3 py-2 text-xs font-semibold text-stone-700">View all</Link>
              </div>

              <div className="mt-4 space-y-3">
                {pendingCooperatives.slice(0, 3).map((cooperative) => (
                  <div key={cooperative.id} className="rounded-2xl border border-stone-200 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-semibold text-stone-900">{cooperative.name}</div>
                        <div className="text-xs text-stone-500">{cooperative.registrationNumber || "No registration number"} • {cooperative.email || cooperative.phone || "No contact"}</div>
                        <div className="mt-1 text-xs text-stone-400">Status: {cooperative.status || "PENDING"}</div>
                      </div>
                      <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">Pending</span>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        onClick={() => void handleCooperativeStatus(cooperative.id, "ACTIVE")}
                        disabled={savingCooperativeId === cooperative.id}
                        className="rounded-full bg-emerald-500 px-3 py-2 text-xs font-semibold text-white disabled:opacity-70"
                      >
                        {savingCooperativeId === cooperative.id ? "Saving..." : "Approve"}
                      </button>
                      <button
                        onClick={() => void handleCooperativeStatus(cooperative.id, "DEACTIVATED")}
                        disabled={savingCooperativeId === cooperative.id}
                        className="rounded-full border border-stone-200 bg-white px-3 py-2 text-xs font-semibold text-rose-600 disabled:opacity-70"
                      >
                        Deactivate
                      </button>
                    </div>
                  </div>
                ))}

                {pendingCooperatives.length === 0 && <div className="rounded-2xl border border-dashed border-stone-200 p-4 text-sm text-stone-500">No cooperative profiles waiting for approval.</div>}
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
