import { useEffect, useState } from "react";
import { institutionApi, type InstitutionProfile, type InstitutionStatus } from "../api/institutions";
import { useToast } from "../context/ToastContext";

export const AdminInstitutionsPage = () => {
  const { showToast } = useToast();
  const [institutions, setInstitutions] = useState<InstitutionProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    void load();
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const list = await institutionApi.getAllInstitutions();
      setInstitutions(list);
    } catch (err) {
      showToast("Failed to fetch institutions", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: InstitutionStatus) => {
    setSavingId(id);
    try {
      const updated = await institutionApi.updateInstitutionStatus(id, status);
      setInstitutions((prev) => prev.map((p) => (p.id === id ? updated : p)));
      showToast(`Institution status updated to ${status}`, "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to update status", "error");
    } finally {
      setSavingId(null);
    }
  };

  if (loading) return <div className="p-6 text-sm text-stone-500">Loading institutions...</div>;

  return (
    <div className="min-h-[calc(100vh-4rem)] px-6 py-8">
      <div className="mx-auto max-w-[1200px]">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-stone-900">Institution Approvals</h1>
            <p className="mt-1 text-sm text-stone-500">Review and activate institution profiles so they can approve loans.</p>
          </div>
        </div>

        <div className="space-y-4">
          {institutions.length === 0 && <div className="rounded-2xl border border-stone-200 bg-white p-6 text-sm text-stone-500">No institutions found.</div>}

          {institutions.map((inst) => (
            <div key={inst.id} className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-stone-900">{inst.name}</h3>
                  <div className="mt-2 text-sm text-stone-600">{inst.type} • {inst.email || inst.phone || "No contact"}</div>
                  <div className="mt-3 text-sm text-stone-500">Created: {inst.createdAt ? new Date(inst.createdAt).toLocaleString() : "-"}</div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-sm text-stone-500">Status</div>
                    <div className="mt-1 text-lg font-semibold text-stone-900">{inst.status || "PENDING"}</div>
                  </div>

                  <div className="flex flex-col gap-2">
                    {inst.status === "PENDING" && (
                      <button disabled={!!savingId} onClick={() => void handleUpdateStatus(inst.id, "ACTIVE")} className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white">{savingId === inst.id ? "Saving..." : "Approve"}</button>
                    )}
                    {inst.status !== "DEACTIVATED" && (
                      <button disabled={!!savingId} onClick={() => void handleUpdateStatus(inst.id, "DEACTIVATED")} className="rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-rose-600">Deactivate</button>
                    )}
                    {inst.status === "ACTIVE" && (
                      <button disabled={!!savingId} onClick={() => void handleUpdateStatus(inst.id, "SUSPENDED")} className="rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-amber-700">Suspend</button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminInstitutionsPage;
