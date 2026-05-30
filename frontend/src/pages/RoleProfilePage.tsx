import { useEffect, useRef, useState } from "react";
import { api } from "../api/http";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { getInitials } from "../utils/format";

interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  role: string;
  status: string;
  province?: string;
  district?: string;
  sector?: string;
  cell?: string;
  village?: string;
  profileImageUrl?: string;
  createdAt: string;
}

interface EditForm {
  fullName: string;
  phone: string;
  province: string;
  district: string;
  sector: string;
  cell: string;
  village: string;
}

export const RoleProfilePage = () => {
  const { user, setUser } = useAuth();
  const { showToast } = useToast();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<EditForm>({
    fullName: "",
    phone: "",
    province: "",
    district: "",
    sector: "",
    cell: "",
    village: "",
  });
  const [avatarUploading, setAvatarUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api
      .get("/users/me")
      .then((r) => {
        const u: UserProfile = r.data.data.user ?? r.data.data;
        setProfile(u);
        setForm({
          fullName: u.fullName ?? "",
          phone: u.phone ?? "",
          province: u.province ?? "",
          district: u.district ?? "",
          sector: u.sector ?? "",
          cell: u.cell ?? "",
          village: u.village ?? "",
        });
      })
      .catch(() => showToast("Failed to load profile.", "error"))
      .finally(() => setLoading(false));
  }, [showToast]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const body: Record<string, string> = {};
      if (form.fullName.trim()) body.fullName = form.fullName.trim();
      if (form.phone.trim()) body.phone = form.phone.trim();
      if (form.province.trim()) body.province = form.province.trim();
      if (form.district.trim()) body.district = form.district.trim();
      if (form.sector.trim()) body.sector = form.sector.trim();
      if (form.cell.trim()) body.cell = form.cell.trim();
      if (form.village.trim()) body.village = form.village.trim();

      const { data } = await api.patch("/users/me", body);
      const updated: UserProfile = data.data.user ?? data.data;
      setProfile(updated);
      setEditing(false);

      if (user) {
        setUser({
          ...user,
          fullName: updated.fullName ?? user.fullName,
          phone: updated.phone,
        });
      }
      showToast("Profile updated.", "success");
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response
              ?.data?.message ?? "Failed to update profile."
          : "Failed to update profile.";
      showToast(msg, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast("Image must be under 5 MB.", "error");
      return;
    }

    const formData = new FormData();
    formData.append("avatar", file);
    setAvatarUploading(true);
    try {
      const { data } = await api.patch("/users/me/avatar", formData);
      const updated = data.data?.user ?? data.data;
      const newUrl: string | undefined = updated?.profileImageUrl ?? undefined;
      if (newUrl) {
        setProfile((prev) => (prev ? { ...prev, profileImageUrl: newUrl } : prev));
        setUser({ ...user, profileImageUrl: newUrl });
      }
      showToast("Profile photo updated!", "success");
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response
              ?.data?.message ?? "Failed to upload photo."
          : "Failed to upload photo.";
      showToast(msg, "error");
    } finally {
      setAvatarUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const field = (key: keyof EditForm) => (
    <input
      type="text"
      value={form[key]}
      onChange={(e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))}
      className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-all"
    />
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-stone-400 border-t-transparent" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-stone-400 text-sm">Could not load profile.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-black text-stone-900 tracking-tight">Profile</h1>

      {/* Identity card */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm">
        <div className="flex items-center gap-5">
          <div className="relative flex-shrink-0">
            <button
              type="button"
              onClick={() => !avatarUploading && fileInputRef.current?.click()}
              disabled={avatarUploading}
              className="group relative w-20 h-20 rounded-full overflow-hidden focus:outline-none focus:ring-2 focus:ring-stone-400 focus:ring-offset-2"
              title="Change profile photo"
            >
              {profile.profileImageUrl ? (
                <img
                  src={profile.profileImageUrl}
                  alt={profile.fullName}
                  className="w-20 h-20 rounded-full object-cover"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-stone-900 flex items-center justify-center text-white text-2xl font-black">
                  {getInitials(profile.fullName)}
                </div>
              )}
              <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 group-disabled:opacity-100 transition-opacity">
                {avatarUploading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-5 h-5 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                )}
              </div>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>

          <div className="min-w-0">
            <h2 className="font-bold text-stone-900 text-xl leading-tight">{profile.fullName}</h2>
            <p className="text-stone-500 text-sm mt-0.5">{profile.email}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="inline-block text-xs font-bold bg-stone-800 text-white px-2.5 py-0.5 rounded-full">
                {profile.role.replace(/_/g, " ")}
              </span>
              <span className="inline-block text-xs font-bold bg-brand-100 text-brand-700 px-2.5 py-0.5 rounded-full">
                {profile.status}
              </span>
            </div>
            <p className="text-xs text-stone-400 mt-2">Click photo to change</p>
          </div>
        </div>
      </div>

      {/* Editable info */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-bold text-stone-900">Account Details</h2>
          <button
            onClick={() => {
              if (editing) {
                setForm({
                  fullName: profile.fullName ?? "",
                  phone: profile.phone ?? "",
                  province: profile.province ?? "",
                  district: profile.district ?? "",
                  sector: profile.sector ?? "",
                  cell: profile.cell ?? "",
                  village: profile.village ?? "",
                });
              }
              setEditing((v) => !v);
            }}
            className="text-sm font-semibold text-stone-600 hover:underline"
          >
            {editing ? "Cancel" : "Edit"}
          </button>
        </div>

        {editing ? (
          <form onSubmit={handleSave} className="flex flex-col gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-stone-700">Full name</label>
                {field("fullName")}
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-stone-700">Phone</label>
                {field("phone")}
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-stone-700">Province</label>
                {field("province")}
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-stone-700">District</label>
                {field("district")}
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-stone-700">Sector</label>
                {field("sector")}
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-stone-700">Cell</label>
                {field("cell")}
              </div>
              <div className="flex flex-col gap-1.5 md:col-span-2">
                <label className="text-sm font-medium text-stone-700">Village</label>
                {field("village")}
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-2">
              <button
                type="button"
                onClick={() => {
                  setForm({
                    fullName: profile.fullName ?? "",
                    phone: profile.phone ?? "",
                    province: profile.province ?? "",
                    district: profile.district ?? "",
                    sector: profile.sector ?? "",
                    cell: profile.cell ?? "",
                    village: profile.village ?? "",
                  });
                  setEditing(false);
                }}
                className="px-5 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-sm font-semibold rounded-full"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2.5 bg-stone-900 hover:bg-stone-800 disabled:opacity-60 text-white text-sm font-semibold rounded-full transition-colors"
              >
                {saving ? "Saving…" : "Save changes"}
              </button>
            </div>
          </form>
        ) : (
          <div className="grid grid-cols-2 gap-x-8 gap-y-4">
            {[
              { label: "Full name", value: profile.fullName },
              { label: "Phone", value: profile.phone ?? "—" },
              { label: "Province", value: profile.province ?? "—" },
              { label: "District", value: profile.district ?? "—" },
              { label: "Sector", value: profile.sector ?? "—" },
              { label: "Cell", value: profile.cell ?? "—" },
              { label: "Village", value: profile.village ?? "—" },
            ].map((item) => (
              <div key={item.label}>
                <p className="text-xs text-stone-400 font-medium">{item.label}</p>
                <p className="text-sm font-semibold text-stone-800 mt-0.5">{item.value}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
