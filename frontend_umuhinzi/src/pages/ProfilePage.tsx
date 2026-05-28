import { useEffect, useState } from "react";
import { api } from "../api/http";

type FarmerProfile = {
  id: string;
  nationalId: string;
  dateOfBirth: string | null;
  gender: "MALE" | "FEMALE" | "OTHER" | null;
  farmingExperienceYears: number;
  primaryCrop: string | null;
  status: string;
  credibilityStatus: string;
  user: {
    fullName: string;
    email: string;
    phoneNumber: string | null;
  };
};

export const ProfilePage = () => {
  const [profile, setProfile] = useState<FarmerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    nationalId: "",
    dateOfBirth: "",
    gender: "",
    farmingExperienceYears: 0,
    primaryCrop: "",
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get("/farmers/me");
        const data = res.data.data;
        setProfile(data);
        setForm({
          nationalId: data.nationalId ?? "",
          dateOfBirth: data.dateOfBirth ? data.dateOfBirth.split("T")[0] : "",
          gender: data.gender ?? "",
          farmingExperienceYears: data.farmingExperienceYears ?? 0,
          primaryCrop: data.primaryCrop ?? "",
        });
      } catch {
        setError("Failed to load profile.");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === "farmingExperienceYears" ? Number(value) : value,
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const res = await api.patch("/farmers/me", {
        nationalId: form.nationalId || undefined,
        dateOfBirth: form.dateOfBirth || undefined,
        gender: form.gender || undefined,
        farmingExperienceYears: form.farmingExperienceYears,
        primaryCrop: form.primaryCrop || undefined,
      });
      setProfile(res.data.data);
      setSuccess("Profile updated successfully!");
      setEditing(false);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-green-500 border-t-transparent" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-6 text-center text-red-500">
        {error || "Profile not found."}
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-800">My Profile</h1>
          <p className="text-sm text-gray-500 mt-1">View and update your farmer profile</p>
        </div>
        {!editing ? (
          <button
            onClick={() => setEditing(true)}
            className="px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 transition"
          >
            Edit Profile
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={() => { setEditing(false); setError(""); }}
              className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-200 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 transition disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        )}
      </div>

      {/* Alerts */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">{error}</div>
      )}
      {success && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-600 text-sm">{success}</div>
      )}

      {/* Account Info (read-only) */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Account Information</h2>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-sm text-gray-500">Full Name</span>
            <span className="text-sm font-semibold text-gray-800">{profile.user.fullName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-500">Email</span>
            <span className="text-sm font-semibold text-gray-800">{profile.user.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-500">Phone</span>
            <span className="text-sm font-semibold text-gray-800">{profile.user.phoneNumber ?? "—"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-500">Status</span>
            <span className={`text-xs font-bold px-2 py-1 rounded-full ${
              profile.status === "VERIFIED" ? "bg-green-100 text-green-700" :
              profile.status === "SUSPENDED" ? "bg-red-100 text-red-700" :
              "bg-yellow-100 text-yellow-700"
            }`}>{profile.status}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-500">Credibility</span>
            <span className={`text-xs font-bold px-2 py-1 rounded-full ${
              profile.credibilityStatus === "TRUSTED" ? "bg-green-100 text-green-700" :
              profile.credibilityStatus === "HIGH" ? "bg-blue-100 text-blue-700" :
              profile.credibilityStatus === "MEDIUM" ? "bg-yellow-100 text-yellow-700" :
              "bg-red-100 text-red-700"
            }`}>{profile.credibilityStatus}</span>
          </div>
        </div>
      </div>

      {/* Farmer Info (editable) */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Farmer Details</h2>
        <div className="space-y-4">

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">National ID</label>
            {editing ? (
              <input
                name="nationalId"
                value={form.nationalId}
                onChange={handleChange}
                placeholder="16-digit national ID"
                maxLength={16}
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
              />
            ) : (
              <p className="text-sm text-gray-800 font-medium">{profile.nationalId}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Date of Birth</label>
            {editing ? (
              <input
                type="date"
                name="dateOfBirth"
                value={form.dateOfBirth}
                onChange={handleChange}
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
              />
            ) : (
              <p className="text-sm text-gray-800 font-medium">
                {profile.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString() : "—"}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Gender</label>
            {editing ? (
              <select
                name="gender"
                value={form.gender}
                onChange={handleChange}
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
              >
                <option value="">Select gender</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            ) : (
              <p className="text-sm text-gray-800 font-medium">{profile.gender ?? "—"}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Farming Experience (years)</label>
            {editing ? (
              <input
                type="number"
                name="farmingExperienceYears"
                value={form.farmingExperienceYears}
                onChange={handleChange}
                min={0}
                max={80}
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
              />
            ) : (
              <p className="text-sm text-gray-800 font-medium">{profile.farmingExperienceYears} years</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Primary Crop</label>
            {editing ? (
              <input
                name="primaryCrop"
                value={form.primaryCrop}
                onChange={handleChange}
                placeholder="e.g. Maize, Coffee, Rice"
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
              />
            ) : (
              <p className="text-sm text-gray-800 font-medium">{profile.primaryCrop ?? "—"}</p>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};