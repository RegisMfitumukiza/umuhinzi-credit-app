import { useEffect, useRef, useState } from "react";
import { api } from "../api/http";
import { useAuth } from "../context/AuthContext";

export const AdminProfilePage = () => {
  const { user, setUser } = useAuth();
  const [form, setForm] = useState({ fullName: "", phone: "" });
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const avatarRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) setForm({ fullName: user.fullName ?? "", phone: user.phone ?? "" });
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setSaved(false); setSaving(true);
    try {
      const res = await api.patch("/v1/users/me", { fullName: form.fullName, phone: form.phone || undefined });
      setUser({ ...user!, ...res.data.data });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Failed to save profile.");
    } finally {
      setSaving(false);
    }
  };

  const handleAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("avatar", file);
    try {
      const res = await api.patch("/v1/users/me/avatar", fd, { headers: { "Content-Type": "multipart/form-data" } });
      setUser({ ...user!, profileImageUrl: res.data.data.profileImageUrl });
    } catch {}
  };

  const initials = user?.fullName?.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase() ?? "A";

  return (
    <div className="min-h-[calc(100vh-4rem)] px-6 py-8">
      <div className="mx-auto max-w-[800px]">
        <h1 className="text-2xl font-semibold text-stone-900">Admin Profile</h1>
        <p className="mt-1 text-sm text-stone-500">Update your administrator account details.</p>

        <form onSubmit={handleSave} className="mt-6 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
          <div className="grid gap-6 md:grid-cols-3">
            {/* Avatar */}
            <div className="flex flex-col items-center gap-3">
              {user?.profileImageUrl
                ? <img src={user.profileImageUrl} className="h-28 w-28 rounded-full object-cover" alt="avatar" />
                : <div className="h-28 w-28 rounded-full bg-emerald-100 flex items-center justify-center text-3xl font-bold text-emerald-700">{initials}</div>}
              <button type="button" onClick={() => avatarRef.current?.click()} className="text-sm text-emerald-600 hover:underline">Change photo</button>
              <input ref={avatarRef} type="file" accept="image/*" className="hidden" onChange={handleAvatar} />
            </div>

            {/* Fields */}
            <div className="md:col-span-2 space-y-4">
              <div>
                <label className="text-sm font-medium text-stone-700">Full Name</label>
                <input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} className="mt-1 w-full rounded-xl border border-stone-200 px-3 py-2 text-sm outline-none focus:border-emerald-400" />
              </div>
              <div>
                <label className="text-sm font-medium text-stone-700">Email</label>
                <input value={user?.email ?? ""} readOnly className="mt-1 w-full rounded-xl border border-stone-100 bg-stone-50 px-3 py-2 text-sm text-stone-400 cursor-not-allowed" />
              </div>
              <div>
                <label className="text-sm font-medium text-stone-700">Phone</label>
                <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+250..." className="mt-1 w-full rounded-xl border border-stone-200 px-3 py-2 text-sm outline-none focus:border-emerald-400" />
              </div>
              <div>
                <label className="text-sm font-medium text-stone-700">Role</label>
                <input value={user?.role ?? ""} readOnly className="mt-1 w-full rounded-xl border border-stone-100 bg-stone-50 px-3 py-2 text-sm text-stone-400 cursor-not-allowed" />
              </div>

              {error && <p className="text-sm text-rose-600">{error}</p>}

              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving} className={`rounded-full px-5 py-2 text-sm font-semibold text-white disabled:opacity-60 ${saved ? "bg-emerald-700" : "bg-emerald-500 hover:bg-emerald-600"}`}>
                  {saving ? "Saving..." : saved ? "Saved!" : "Save Profile"}
                </button>
                <button type="button" onClick={() => setForm({ fullName: user?.fullName ?? "", phone: user?.phone ?? "" })} className="rounded-full border border-stone-200 px-5 py-2 text-sm text-stone-600 hover:bg-stone-50">
                  Reset
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminProfilePage;
