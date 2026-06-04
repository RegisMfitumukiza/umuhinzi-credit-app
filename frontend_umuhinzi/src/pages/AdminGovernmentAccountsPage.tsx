import { useEffect, useState } from "react";
import { getUsers, updateUserStatus, provisionAccount, type AdminUser } from "../api/users";
import { useToast } from "../context/ToastContext";

const generatePassword = () => {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#$";
  return Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
};

export const AdminGovernmentAccountsPage = () => {
  const { showToast } = useToast();
  const [accounts, setAccounts] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ fullName: "", email: "", phone: "", password: generatePassword() });

  useEffect(() => { void load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const all = await getUsers();
      setAccounts(all.filter((u) => u.role === "GOVERNMENT_PARTNER"));
    } catch {
      showToast("Failed to load government accounts", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!form.fullName || !form.email || !form.password) {
      showToast("Full name, email, and password are required", "error");
      return;
    }
    setSubmitting(true);
    try {
      await provisionAccount({ fullName: form.fullName, email: form.email, password: form.password, phone: form.phone || undefined, role: "GOVERNMENT_PARTNER" });
      showToast(`Account created. Credentials sent to ${form.email}`, "success");
      setForm({ fullName: "", email: "", phone: "", password: generatePassword() });
      setShowForm(false);
      await load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to create account", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatus = async (id: string, status: "ACTIVE" | "SUSPENDED" | "DEACTIVATED") => {
    setSavingId(id);
    try {
      const updated = await updateUserStatus(id, status);
      setAccounts((prev) => prev.map((a) => (a.id === id ? updated : a)));
      showToast(`Account ${status.toLowerCase()} successfully`, "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to update account", "error");
    } finally {
      setSavingId(null);
    }
  };

  if (loading) return <div className="p-6 text-sm text-stone-500">Loading government accounts...</div>;

  return (
    <div className="min-h-[calc(100vh-4rem)] px-6 py-8">
      <div className="mx-auto max-w-[1200px] space-y-6">

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-stone-900">Government Accounts</h1>
            <p className="mt-1 text-sm text-stone-500">
              Create government partner accounts. Login credentials are automatically emailed on creation.
            </p>
          </div>
          <button onClick={() => setShowForm((v) => !v)} className="rounded-full bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm">
            {showForm ? "Cancel" : "+ Create Government Account"}
          </button>
        </div>

        {showForm && (
          <section className="rounded-2xl border border-emerald-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-stone-900">New Government Partner Account</h2>
            <p className="mt-1 text-sm text-stone-500">
              The user will receive an email containing their login email, temporary password, and a direct link to their dashboard.
            </p>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="text-sm font-medium text-stone-700">Full Name / Department</span>
                <input value={form.fullName} onChange={(e) => setForm((p) => ({ ...p, fullName: e.target.value }))} placeholder="e.g. Ministry of Agriculture" className="mt-2 w-full rounded-xl border border-stone-200 px-4 py-3 text-sm outline-none focus:border-emerald-500" />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-stone-700">Official Email</span>
                <input type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} placeholder="official@gov.rw" className="mt-2 w-full rounded-xl border border-stone-200 px-4 py-3 text-sm outline-none focus:border-emerald-500" />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-stone-700">Phone (optional)</span>
                <input value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} placeholder="+250..." className="mt-2 w-full rounded-xl border border-stone-200 px-4 py-3 text-sm outline-none focus:border-emerald-500" />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-stone-700">Temporary Password</span>
                <div className="mt-2 flex gap-2">
                  <input value={form.password} onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))} className="w-full rounded-xl border border-stone-200 px-4 py-3 text-sm font-mono outline-none focus:border-emerald-500" />
                  <button type="button" onClick={() => setForm((p) => ({ ...p, password: generatePassword() }))} className="rounded-xl border border-stone-200 px-4 py-3 text-sm text-stone-600 hover:bg-stone-50">New</button>
                </div>
                <p className="mt-1 text-xs text-stone-400">This will be included in the email. The user should change it after first login.</p>
              </label>
            </div>

            <div className="mt-5 rounded-xl border border-stone-100 bg-stone-50 p-4 text-sm">
              <p className="font-semibold text-stone-600">Email preview</p>
              <div className="mt-2 space-y-1 text-stone-500">
                <p>To: <span className="text-stone-800">{form.email || "official@gov.rw"}</span></p>
                <p>Subject: <span className="text-stone-800">Your Umuhinzi Credit Government Partner Account</span></p>
                <p>Contains: Login email · temporary password · link to dashboard</p>
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
          {accounts.length === 0 && (
            <div className="rounded-2xl border border-dashed border-stone-200 bg-white p-6 text-sm text-stone-500">
              No government accounts yet. Use the button above to create one.
            </div>
          )}
          {accounts.map((account) => (
            <div key={account.id} className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h3 className="font-semibold text-stone-900">{account.fullName}</h3>
                  <p className="mt-1 text-sm text-stone-500">{account.email}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className="rounded-full bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700">GOVERNMENT_PARTNER</span>
                    <span className={`rounded-full px-2 py-1 text-xs font-semibold ${account.status === "ACTIVE" ? "bg-emerald-100 text-emerald-700" : account.status === "SUSPENDED" ? "bg-amber-100 text-amber-700" : "bg-stone-100 text-stone-600"}`}>
                      {account.status || "PENDING"}
                    </span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {account.status !== "ACTIVE" && (
                    <button disabled={savingId === account.id} onClick={() => void handleStatus(account.id, "ACTIVE")} className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-70">
                      {savingId === account.id ? "Saving..." : "Activate"}
                    </button>
                  )}
                  {account.status === "ACTIVE" && (
                    <button disabled={savingId === account.id} onClick={() => void handleStatus(account.id, "SUSPENDED")} className="rounded-full border border-stone-200 px-4 py-2 text-sm font-semibold text-amber-700 disabled:opacity-70">Suspend</button>
                  )}
                  {account.status !== "DEACTIVATED" && (
                    <button disabled={savingId === account.id} onClick={() => void handleStatus(account.id, "DEACTIVATED")} className="rounded-full border border-stone-200 px-4 py-2 text-sm font-semibold text-rose-600 disabled:opacity-70">Deactivate</button>
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

export default AdminGovernmentAccountsPage;
