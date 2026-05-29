import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { farmerApi, type FarmerDashboardProfile, type FarmerProfilePayload } from "../api/farmer";
import { useToast } from "../context/ToastContext";

const genderOptions: Array<"MALE" | "FEMALE" | "OTHER"> = ["MALE", "FEMALE", "OTHER"];

export const ProfilePage = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [profile, setProfile] = useState<FarmerDashboardProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [form, setForm] = useState<FarmerProfilePayload>({
    nationalId: "",
    dateOfBirth: "",
    gender: undefined,
    farmingExperienceYears: undefined,
    primaryCrop: "",
    cooperativeId: null,
  });

  useEffect(() => {
    void (async () => {
      try {
        const loaded = await farmerApi.getProfile();
        setProfile(loaded);
        setIsCreating(false);
        setForm({
          nationalId: loaded.nationalId || "",
          dateOfBirth: loaded.dateOfBirth ? String(loaded.dateOfBirth).slice(0, 10) : "",
          gender: (loaded.gender as FarmerProfilePayload["gender"]) || undefined,
          farmingExperienceYears: loaded.farmingExperienceYears ?? undefined,
          primaryCrop: loaded.primaryCrop || "",
          cooperativeId: loaded.cooperativeId || null,
        });
      } catch {
        setIsCreating(true);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSubmit = async () => {
    if (!form.nationalId) {
      showToast("National ID is required to create the farmer profile", "error");
      return;
    }

    setSaving(true);
    try {
      const payload: FarmerProfilePayload = {
        nationalId: form.nationalId.trim(),
        dateOfBirth: form.dateOfBirth || undefined,
        gender: form.gender,
        farmingExperienceYears: typeof form.farmingExperienceYears === "number" ? form.farmingExperienceYears : undefined,
        primaryCrop: form.primaryCrop?.trim() || undefined,
        cooperativeId: form.cooperativeId || undefined,
      };

      const saved = isCreating ? await farmerApi.createProfile(payload) : await farmerApi.updateProfile(payload);
      setProfile(saved);
      setIsCreating(false);
      showToast(isCreating ? "Farmer profile created successfully" : "Farmer profile updated successfully", "success");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Failed to save farmer profile", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-6 text-sm text-stone-500">Loading farmer profile...</div>;
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-3xl font-semibold text-stone-900">Farmer Profile</h2>
          <p className="mt-2 text-sm text-stone-500">Create or update your backend farmer profile before applying for loans.</p>
        </div>
        <button onClick={() => navigate("/loans")} className="rounded-full border border-stone-200 bg-white px-5 py-2.5 text-sm font-semibold text-stone-700 shadow-sm">
          Back to loans
        </button>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <article className="rounded-[1.5rem] border border-stone-200 bg-white p-6 shadow-panel">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-semibold text-stone-900">{isCreating ? "Create Farmer Profile" : "Update Farmer Profile"}</h3>
              <p className="mt-1 text-sm text-stone-500">This is the profile stored in the backend /farmers table.</p>
            </div>
            <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">{isCreating ? "New profile" : "Saved profile"}</span>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <Field label="National ID" value={form.nationalId} onChange={(value) => setForm((prev) => ({ ...prev, nationalId: value }))} placeholder="16 digits" />
            <Field label="Date of Birth" type="date" value={form.dateOfBirth || ""} onChange={(value) => setForm((prev) => ({ ...prev, dateOfBirth: value }))} />
            <label className="block">
              <span className="text-sm font-medium text-stone-700">Gender</span>
              <select value={form.gender || ""} onChange={(e) => setForm((prev) => ({ ...prev, gender: e.target.value as FarmerProfilePayload["gender"] || undefined }))} className="mt-2 w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm outline-none focus:border-brand-500">
                <option value="">Select gender</option>
                {genderOptions.map((gender) => <option key={gender} value={gender}>{gender}</option>)}
              </select>
            </label>
            <Field label="Farming Experience (Years)" type="number" value={form.farmingExperienceYears === undefined ? "" : String(form.farmingExperienceYears)} onChange={(value) => setForm((prev) => ({ ...prev, farmingExperienceYears: value === "" ? undefined : Number(value) }))} placeholder="e.g. 5" />
            <Field label="Primary Crop" value={form.primaryCrop || ""} onChange={(value) => setForm((prev) => ({ ...prev, primaryCrop: value }))} placeholder="Maize, beans, potatoes..." />
            <Field label="Cooperative ID (optional)" value={form.cooperativeId || ""} onChange={(value) => setForm((prev) => ({ ...prev, cooperativeId: value || null }))} placeholder="UUID from cooperative backend" />
          </div>

          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button onClick={() => navigate("/dashboard")} className="rounded-full border border-stone-200 bg-white px-5 py-2.5 text-sm font-semibold text-stone-700">Go to dashboard</button>
            <button onClick={() => void handleSubmit()} disabled={saving} className="rounded-full bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-500/20 disabled:opacity-70">
              {saving ? "Saving..." : isCreating ? "Create Profile" : "Update Profile"}
            </button>
          </div>
        </article>

        <aside className="space-y-4">
          <article className="rounded-[1.5rem] border border-stone-200 bg-white p-5 shadow-panel">
            <h3 className="text-lg font-semibold text-stone-900">Profile Status</h3>
            <div className="mt-4 space-y-3 text-sm text-stone-600">
              <StatusRow label="Profile exists" value={profile ? "Yes" : "No"} />
              <StatusRow label="National ID" value={profile?.nationalId || form.nationalId || "Not set"} />
              <StatusRow label="Primary crop" value={profile?.primaryCrop || form.primaryCrop || "Not set"} />
              <StatusRow label="Experience" value={String(profile?.farmingExperienceYears ?? form.farmingExperienceYears ?? "Not set")} />
            </div>
          </article>

          <article className="rounded-[1.5rem] border border-amber-200 bg-amber-50 p-5 shadow-panel">
            <h3 className="text-lg font-semibold text-amber-900">Loan Access</h3>
            <p className="mt-2 text-sm text-amber-800">You must create this farmer profile first before the loan application endpoint will accept your request.</p>
            <button onClick={() => navigate("/loans")} className="mt-4 w-full rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-amber-900 shadow-sm">
              Return to loan application
            </button>
          </article>
        </aside>
      </section>
    </div>
  );
};

const Field = ({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) => (
  <label className="block">
    <span className="text-sm font-medium text-stone-700">{label}</span>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="mt-2 w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm outline-none focus:border-brand-500"
    />
  </label>
);

const StatusRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-center justify-between gap-3 rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3">
    <span className="font-medium text-stone-700">{label}</span>
    <span className="text-right text-stone-900">{value}</span>
  </div>
);

export default ProfilePage;