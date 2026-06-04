import { useEffect, useState } from "react";
import { institutionApi, type InstitutionProfile, type InstitutionStatus } from "../api/institutions";
import { provisionAccount } from "../api/users";
import { useToast } from "../context/ToastContext";

const INSTITUTION_TYPES = ["SACCO", "MICROFINANCE", "BANK", "NGO", "GOVERNMENT_PROGRAM", "OTHER"];

const generatePassword = () => {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#$";
  return Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
};

export const AdminInstitutionsPage = () => {
  const { showToast } = useToast();
  const [institutions, setInstitutions] = useState<InstitutionProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ fullName: "", email: "", phone: "", type: "BANK", password: generatePassword() });

  useEffect(() => { void load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      setInstitutions(await institutionApi.getAllInstitutions());
    } catch {
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
      showToast(`Institution ${status.toLowerCase()} successfully`, "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to update status", "error");
    } finally {
      setSavingId(null);
    }
  };

  const handleCreate = async () => {
    if (!form.fullName || !form.email || !form.password) {
      showToast("Institution name, email, and password are required", "error");
      return;
    }
    setSubmitting(true);
    try {
      await provisionAccount({ fullName: form.fullName, email: form.email, password: form.password, phone: form.phone || undefined, role: "INSTITUTION" });
      showToast(`Institution account created. Credentials sent to ${form.email}`, "success");
      setShowForm(false);
      setForm({ fullName: "", email: "", phone: "", type: "BANK", password: generatePassword() });
      await load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to create institution account", "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-6 text-sm text-stone-500">Loading institutions...</div>;

  return (
    <div className="min-h-[calc(100vh-4rem)] px-6 py-8">
      <div className="mx-auto max-w-[1200px] space-y-6">

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-stone-900">Financial Institutions</h1>
            <p className="mt-1 text-sm text-stone-500">
              Create institution accounts and email credentials. Approve, suspend, or deactivate institutions.
            </p>
          </div>
          <button onClick={() => setShowForm((v) => !v)} className="rounded-full bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm">
            {showForm ? "Cancel" : "+ Create Institution Account"}
          </button>
        </div>

        {showForm && (
          <section className="rounded-2xl border border-emerald-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-stone-900">New Institution Account</h2>
            <p className="mt-1 text-sm text-stone-500">
              A login account is created immediately and the institution receives an email with their credentials and a direct link to their dashboard.
            </p>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="text-sm font-medium text-stone-700">Institution Name</span>
                <input value={form.fullName} onChange={(e) => setForm((p) => ({ ...p, fullName: e.target.value }))} placeholder="e.g. Urwego Bank Rwanda" className="mt-2 w-full rounded-xl border border-stone-200 px-4 py-3 text-sm outline-none focus:border-emerald-500" />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-stone-700">Official Email</span>
                <input type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} placeholder="loans@institution.rw" className="mt-2 w-full rounded-xl border border-stone-200 px-4 py-3 text-sm outline-none focus:border-emerald-500" />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-stone-700">Phone (optional)</span>
                <input value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} placeholder="+250..." className="mt-2 w-full rounded-xl border border-stone-200 px-4 py-3 text-sm outline-none focus:border-emerald-500" />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-stone-700">Institution Type</span>
                <select value={form.type} onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))} className="mt-2 w-full rounded-xl border border-stone-200 px-4 py-3 text-sm outline-none focus:border-emerald-500">
                  {INSTITUTION_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </label>
              <label className="block md:col-span-2">
                <span className="text-sm font-medium text-stone-700">Temporary Password</span>
                <div className="mt-2 flex gap-2">
                  <input value={form.password} onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))} className="w-full rounded-xl border border-stone-200 px-4 py-3 text-sm font-mono outline-none focus:border-emerald-500" />
                  <button type="button" onClick={() => setForm((p) => ({ ...p, password: generatePassword() }))} className="rounded-xl border border-stone-200 px-4 py-3 text-sm text-stone-600 hover:bg-stone-50">New</button>
                </div>
                <p className="mt-1 text-xs text-stone-400">Included in the email. Institution should change it after first login.</p>
              </label>
            </div>

            <div className="mt-5 rounded-xl border border-stone-100 bg-stone-50 p-4 text-sm">
              <p className="font-semibold text-stone-600">Email preview</p>
              <div className="mt-2 space-y-1 text-stone-500">
                <p>To: <span className="text-stone-800">{form.email || "loans@institution.rw"}</span></p>
                <p>Subject: <span className="text-stone-800">Your Umuhinzi Credit Institution Account</span></p>
                <p>Contains: Login email · temporary password · link to Institution Dashboard</p>
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-3">
              <button onClick={() => setShowForm(false)} className="rounded-full border border-stone-200 bg-white px-5 py-2.5 text-sm font-semibold text-stone-700">Cancel</button>
              <button onClick={() => void handleCreate()} disabled={submitting} className="rounded-full bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm disabled:opacity-70">
                {submitting ? "Creating & Sending Email..." : "Create Account & Send Credentials"}
              </button>
            </div>
          </section>
        )}

        <section className="space-y-4">
          {institutions.length === 0 && (
            <div className="rounded-2xl border border-dashed border-stone-200 bg-white p-6 text-sm text-stone-500">
              No institutions found. Create one above.
            </div>
          )}
          {institutions.map((inst) => (
            <div key={inst.id} className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-stone-900">{inst.name}</h3>
                  <div className="mt-1 flex flex-wrap gap-2">
                    <span className="rounded-full bg-stone-100 px-2 py-1 text-xs font-semibold text-stone-600">{inst.type}</span>
                    <span className={`rounded-full px-2 py-1 text-xs font-semibold ${
                      inst.status === "ACTIVE" ? "bg-emerald-100 text-emerald-700" :
                      inst.status === "SUSPENDED" ? "bg-amber-100 text-amber-700" :
                      inst.status === "DEACTIVATED" ? "bg-rose-100 text-rose-700" :
                      "bg-stone-100 text-stone-600"
                    }`}>{inst.status || "PENDING"}</span>
                  </div>
                  <p className="mt-2 text-sm text-stone-500">{inst.email || inst.phone || "No contact info"}</p>
                  <p className="mt-1 text-xs text-stone-400">Created: {inst.createdAt ? new Date(inst.createdAt).toLocaleString() : "-"}</p>
                </div>
                <div className="flex flex-col gap-2">
                  {inst.status === "PENDING" && (
                    <button disabled={savingId === inst.id} onClick={() => void handleUpdateStatus(inst.id, "ACTIVE")} className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-70">
                      {savingId === inst.id ? "Saving..." : "Approve"}
                    </button>
                  )}
                  {inst.status === "ACTIVE" && (
                    <button disabled={savingId === inst.id} onClick={() => void handleUpdateStatus(inst.id, "SUSPENDED")} className="rounded-full border border-stone-200 px-4 py-2 text-sm font-semibold text-amber-700 disabled:opacity-70">Suspend</button>
                  )}
                  {inst.status === "SUSPENDED" && (
                    <button disabled={savingId === inst.id} onClick={() => void handleUpdateStatus(inst.id, "ACTIVE")} className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-70">Reactivate</button>
                  )}
                  {inst.status !== "DEACTIVATED" && (
                    <button disabled={savingId === inst.id} onClick={() => void handleUpdateStatus(inst.id, "DEACTIVATED")} className="rounded-full border border-stone-200 px-4 py-2 text-sm font-semibold text-rose-600 disabled:opacity-70">Deactivate</button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
};

export default AdminInstitutionsPage;
