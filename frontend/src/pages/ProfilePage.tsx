import { useEffect, useRef, useState } from "react";
import { api } from "../api/http";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { getInitials } from "../utils/format";

interface FarmerProfile {
  nationalId?: string;
  dateOfBirth?: string;
  gender?: string;
  farmingExperienceYears?: number;
  primaryCrop?: string;
  credibilityStatus?: string;
}

export const ProfilePage = () => {
  const { user, setUser } = useAuth();
  const { showToast } = useToast();
  const [profile, setProfile] = useState<FarmerProfile>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<FarmerProfile>({});
  const [avatarUploading, setAvatarUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);
  const [docUploading, setDocUploading] = useState(false);
  const [docUploads, setDocUploads] = useState<{ url: string; name: string }[]>([]);

  useEffect(() => {
    api
      .get("/farmers/me")
      .then((r) => {
        const f = r.data.data;
        setProfile(f);
        setForm({
          nationalId: f.nationalId ?? "",
          dateOfBirth: f.dateOfBirth ? f.dateOfBirth.split("T")[0] : "",
          gender: f.gender ?? "",
          farmingExperienceYears: f.farmingExperienceYears ?? "",
          primaryCrop: f.primaryCrop ?? "",
        });
      })
      .catch(() => showToast("Failed to load profile.", "error"))
      .finally(() => setLoading(false));
  }, [showToast]);

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
      const newUrl: string | undefined =
        updated?.profileImageUrl ?? undefined;
      setUser({ ...user, ...(newUrl ? { profileImageUrl: newUrl } : {}) });
      showToast("Profile photo updated!", "success");
    } catch (err: unknown) {
      const msg =
        err &&
        typeof err === "object" &&
        "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response
              ?.data?.message ?? "Failed to upload photo."
          : "Failed to upload photo.";
      showToast(msg, "error");
    } finally {
      setAvatarUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      showToast("File must be under 10 MB.", "error");
      return;
    }
    const fd = new FormData();
    fd.append("document", file);
    setDocUploading(true);
    try {
      const { data } = await api.post("/uploads/farmer/documents", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setDocUploads((prev) => [...prev, { url: data.data.url, name: file.name }]);
      showToast("Document uploaded.", "success");
    } catch (err) {
      showToast(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
          "Failed to upload.",
        "error"
      );
    } finally {
      setDocUploading(false);
      if (docInputRef.current) docInputRef.current.value = "";
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await api.patch("/farmers/me", {
        nationalId: form.nationalId || undefined,
        dateOfBirth: form.dateOfBirth || undefined,
        gender: form.gender || undefined,
        farmingExperienceYears: form.farmingExperienceYears
          ? Number(form.farmingExperienceYears)
          : undefined,
        primaryCrop: form.primaryCrop || undefined,
      });
      setProfile(data.data);
      setEditing(false);
      showToast("Profile updated!", "success");
      if (user) {
        setUser({ ...user });
      }
    } catch {
      showToast("Failed to update profile.", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-black text-stone-900 tracking-tight">Profile</h1>

      {/* Account info */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm">
        <div className="flex items-center gap-4 mb-6">
          {/* Avatar with upload */}
          <div className="relative flex-shrink-0">
            <button
              type="button"
              onClick={() => !avatarUploading && fileInputRef.current?.click()}
              disabled={avatarUploading}
              className="group relative w-16 h-16 rounded-full overflow-hidden focus:outline-none focus:ring-2 focus:ring-brand-400 focus:ring-offset-2"
              title="Change profile photo"
            >
              {user?.profileImageUrl ? (
                <img
                  src={user.profileImageUrl}
                  alt={user.fullName}
                  className="w-16 h-16 rounded-full object-cover"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 text-2xl font-black">
                  {user ? getInitials(user.fullName) : "?"}
                </div>
              )}

              {/* Hover overlay */}
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

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>

          <div>
            <h2 className="font-bold text-stone-900 text-lg">{user?.fullName}</h2>
            <p className="text-stone-500 text-sm">{user?.email}</p>
            <span className="inline-block mt-1 text-xs font-semibold bg-brand-100 text-brand-700 px-2.5 py-0.5 rounded-full">
              {user?.role}
            </span>
            <p className="text-xs text-stone-400 mt-1.5">
              Click photo to change
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 border-t border-stone-100 pt-4">
          <div>
            <p className="text-xs text-stone-400 font-medium">Phone</p>
            <p className="text-sm font-semibold text-stone-800 mt-0.5">{user?.phone ?? "—"}</p>
          </div>
          {profile.credibilityStatus && (
            <div>
              <p className="text-xs text-stone-400 font-medium">Credibility</p>
              <p className="text-sm font-semibold text-stone-800 mt-0.5">{profile.credibilityStatus}</p>
            </div>
          )}
        </div>
      </div>

      {/* Farmer details */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-bold text-stone-900">Farmer Details</h2>
          <button
            onClick={() => setEditing((v) => !v)}
            className="text-sm font-semibold text-brand-600 hover:underline"
          >
            {editing ? "Cancel" : "Edit"}
          </button>
        </div>

        {editing ? (
          <form onSubmit={handleSave} className="flex flex-col gap-4">
            {[
              { key: "nationalId", label: "National ID", placeholder: "1 XXXX X XXXXXXX X XX" },
              { key: "dateOfBirth", label: "Date of birth", type: "date" },
              { key: "farmingExperienceYears", label: "Farming experience (years)", type: "number", placeholder: "5" },
              { key: "primaryCrop", label: "Primary crop", placeholder: "Maize" },
            ].map((f) => (
              <div key={f.key} className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-stone-700">{f.label}</label>
                <input
                  type={f.type ?? "text"}
                  value={String(form[f.key as keyof FarmerProfile] ?? "")}
                  onChange={(e) => setForm((prev) => ({ ...prev, [f.key]: e.target.value }))}
                  placeholder={f.placeholder}
                  className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-all"
                />
              </div>
            ))}

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-stone-700">Gender</label>
              <select
                value={form.gender ?? ""}
                onChange={(e) => setForm((prev) => ({ ...prev, gender: e.target.value }))}
                className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-all"
              >
                <option value="">Select gender</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div className="flex justify-end gap-3 mt-2">
              <button type="button" onClick={() => setEditing(false)} className="px-5 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-sm font-semibold rounded-full">
                Cancel
              </button>
              <button type="submit" disabled={saving} className="px-5 py-2.5 bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white text-sm font-semibold rounded-full">
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </form>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "National ID", value: profile.nationalId ?? "—" },
              { label: "Gender", value: profile.gender ?? "—" },
              { label: "Date of birth", value: profile.dateOfBirth ? profile.dateOfBirth.split("T")[0] : "—" },
              { label: "Experience", value: profile.farmingExperienceYears != null ? `${profile.farmingExperienceYears} years` : "—" },
              { label: "Primary crop", value: profile.primaryCrop ?? "—" },
            ].map((item) => (
              <div key={item.label}>
                <p className="text-xs text-stone-400 font-medium">{item.label}</p>
                <p className="text-sm font-semibold text-stone-800 mt-0.5">{item.value}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Documents upload */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-bold text-stone-900">Documents</h2>
            <p className="text-xs text-stone-400 mt-0.5">PDF or Word · max 10 MB</p>
          </div>
          <button
            onClick={() => docInputRef.current?.click()}
            disabled={docUploading}
            className="px-4 py-2 bg-stone-900 hover:bg-stone-800 disabled:opacity-60 text-white text-sm font-semibold rounded-full transition-colors flex items-center gap-2"
          >
            {docUploading ? (
              <span className="inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
            )}
            {docUploading ? "Uploading…" : "Upload"}
          </button>
          <input
            ref={docInputRef}
            type="file"
            accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            className="hidden"
            onChange={handleDocUpload}
          />
        </div>
        {docUploads.length === 0 ? (
          <p className="text-stone-400 text-sm">No documents uploaded this session.</p>
        ) : (
          <ul className="space-y-2">
            {docUploads.map((u, i) => (
              <li key={i} className="flex items-center justify-between bg-stone-50 rounded-xl px-4 py-2.5 border border-stone-100">
                <span className="text-sm font-medium text-stone-800 truncate max-w-[70%]">{u.name}</span>
                <a href={u.url} target="_blank" rel="noopener noreferrer" className="text-brand-600 text-xs font-semibold shrink-0 hover:underline">
                  View
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};
