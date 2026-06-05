import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { farmerApi, type FarmerDashboardProfile, type FarmerProfilePayload } from "../api/farmer";
import { institutionApi, type CreateInstitutionPayload, type InstitutionProfile, type InstitutionType, type UpdateInstitutionPayload } from "../api/institutions";
import { cooperativeApi, type CooperativeProfile, type CreateCooperativePayload, type UpdateCooperativePayload } from "../api/cooperatives";
import { useToast } from "../context/ToastContext";
import { useAuth } from "../context/AuthContext";
import { getCurrentUserProfile } from "../api/users";
import { isFarmerFrontendApproved, upsertPendingFarmerRequest } from "../utils/farmerApprovalQueue";
import { cooperativeMembersApi } from "../api/cooperativeMembers";

const genderOptions: Array<"MALE" | "FEMALE" | "OTHER"> = ["MALE", "FEMALE", "OTHER"];
const institutionTypeOptions: InstitutionType[] = ["SACCO", "MICROFINANCE", "BANK", "NGO", "GOVERNMENT_PROGRAM", "OTHER"];

export const ProfilePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [profile, setProfile] = useState<FarmerDashboardProfile | null>(null);
  const [cooperatives, setCooperatives] = useState<CooperativeProfile[]>([]);
  const [cooperativeProfile, setCooperativeProfile] = useState<CooperativeProfile | null>(null);
  const [institutionProfile, setInstitutionProfile] = useState<InstitutionProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isCreatingCooperative, setIsCreatingCooperative] = useState(false);
  const [isCreatingInstitution, setIsCreatingInstitution] = useState(false);
  const isCooperativeManagerUser = user?.role === "COOPERATIVE_MANAGER";
  const isInstitutionUser = user?.role === "INSTITUTION";
  const selectableCooperatives = cooperatives.filter(
    (item) => item.status === "ACTIVE" && (item._count?.managers ?? 0) > 0
  );
  const [form, setForm] = useState<FarmerProfilePayload>({
    nationalId: "",
    dateOfBirth: "",
    gender: undefined,
    farmingExperienceYears: undefined,
    primaryCrop: "",
    cooperativeId: null,
  });
  const [cooperativeForm, setCooperativeForm] = useState<CreateCooperativePayload>({
    name: "",
    registrationNumber: "",
    description: "",
    email: "",
    phone: "",
    address: "",
    province: "",
    district: "",
    sector: "",
    cell: "",
    village: "",
  });
  const [institutionForm, setInstitutionForm] = useState<CreateInstitutionPayload>({
    name: "",
    type: "MICROFINANCE",
    registrationNumber: "",
    licenseNumber: "",
    email: "",
    phone: "",
    address: "",
    province: "",
    district: "",
    sector: "",
    cell: "",
    village: "",
  });

  useEffect(() => {
    void (async () => {
      try {
        const currentUser = await getCurrentUserProfile().catch(() => null);
        const allCooperatives = await cooperativeApi.getAllCooperatives().catch(() => [] as CooperativeProfile[]);
        setCooperatives(allCooperatives);

        if (isInstitutionUser) {
          const loadedInstitution = await institutionApi.getMyInstitution();
          if (loadedInstitution) {
            setInstitutionProfile(loadedInstitution);
            setIsCreatingInstitution(false);
            setInstitutionForm({
              name: loadedInstitution.name || "",
              type: loadedInstitution.type || "MICROFINANCE",
              registrationNumber: loadedInstitution.registrationNumber || "",
              licenseNumber: loadedInstitution.licenseNumber || "",
              email: loadedInstitution.email || "",
              phone: loadedInstitution.phone || "",
              address: loadedInstitution.address || "",
              province: loadedInstitution.province || "",
              district: loadedInstitution.district || "",
              sector: loadedInstitution.sector || "",
              cell: loadedInstitution.cell || "",
              village: loadedInstitution.village || "",
            });
          } else {
            setIsCreatingInstitution(true);
          }
          return;
        }

        if (isCooperativeManagerUser) {
          const currentManagerCooperativeId = currentUser?.cooperativeManagerProfile?.cooperativeId || "";
          const linkedCooperative = allCooperatives.find((item) => item.id === currentManagerCooperativeId) || null;

          if (linkedCooperative) {
            setCooperativeProfile(linkedCooperative);
            setIsCreatingCooperative(false);
            setCooperativeForm({
              name: linkedCooperative.name || "",
              registrationNumber: linkedCooperative.registrationNumber || "",
              description: linkedCooperative.description || "",
              email: linkedCooperative.email || "",
              phone: linkedCooperative.phone || "",
              address: linkedCooperative.address || "",
              province: linkedCooperative.province || "",
              district: linkedCooperative.district || "",
              sector: linkedCooperative.sector || "",
              cell: linkedCooperative.cell || "",
              village: linkedCooperative.village || "",
            });
          } else {
            setCooperativeProfile(null);
            setCooperativeForm({
              name: "",
              registrationNumber: "",
              description: "",
              email: "",
              phone: "",
              address: "",
              province: "",
              district: "",
              sector: "",
              cell: "",
              village: "",
            });
            setIsCreatingCooperative(true);
          }

          return;
        }

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
        if (isInstitutionUser) {
          setIsCreatingInstitution(true);
        } else if (isCooperativeManagerUser) {
          setIsCreatingCooperative(true);
        } else {
          setIsCreating(true);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [isCooperativeManagerUser, isInstitutionUser, user?.id]);

  useEffect(() => {
    if (isCooperativeManagerUser) return;

    if (form.cooperativeId && !selectableCooperatives.some((item) => item.id === form.cooperativeId)) {
      setForm((prev) => ({ ...prev, cooperativeId: null }));
    }
  }, [form.cooperativeId, isCooperativeManagerUser, selectableCooperatives]);

  const isPending = profile?.status === "PENDING";
  const approvedInFrontend = isFarmerFrontendApproved(user?.id);
  const canEditProfile = isCreating || !isPending || approvedInFrontend;

  useEffect(() => {
    if (!user || !isPending || approvedInFrontend) return;

    upsertPendingFarmerRequest({
      userId: user.id,
      fullName: user.fullName,
      phone: user.phone,
      village: profile?.village || null,
    });
  }, [user, isPending, approvedInFrontend, profile?.village]);

  const handleFarmerSubmit = async () => {
    if (!canEditProfile) {
      showToast("Profile is pending cooperative manager approval", "error");
      return;
    }

    if (!form.nationalId) {
      showToast("National ID is required to create the farmer profile", "error");
      return;
    }

    setSaving(true);
    try {
      const payload: FarmerProfilePayload = {
        nationalId: form.nationalId.trim(),
        dateOfBirth: form.dateOfBirth ? new Date(form.dateOfBirth).toISOString() : undefined,
        gender: form.gender,
        farmingExperienceYears: typeof form.farmingExperienceYears === "number" ? form.farmingExperienceYears : undefined,
        primaryCrop: form.primaryCrop?.trim() || undefined,
        cooperativeId: form.cooperativeId || undefined,
      };

      const saved = isCreating ? await farmerApi.createProfile(payload) : await farmerApi.updateProfile(payload);
      setProfile(saved);
      setIsCreating(false);
      if (payload.cooperativeId) {
        await cooperativeMembersApi.joinCooperative({ cooperativeId: payload.cooperativeId });
      }
      showToast(isCreating ? "Farmer profile created successfully" : "Farmer profile updated successfully", "success");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Failed to save farmer profile", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleInstitutionSubmit = async () => {
    if (!institutionForm.name.trim()) {
      showToast("Institution name is required", "error");
      return;
    }

    setSaving(true);
    try {
      const payload: CreateInstitutionPayload = {
        name: institutionForm.name.trim(),
        type: institutionForm.type,
        registrationNumber: institutionForm.registrationNumber?.trim() || undefined,
        licenseNumber: institutionForm.licenseNumber?.trim() || undefined,
        email: institutionForm.email?.trim() || undefined,
        phone: institutionForm.phone?.trim() || undefined,
        address: institutionForm.address?.trim() || undefined,
        province: institutionForm.province?.trim() || undefined,
        district: institutionForm.district?.trim() || undefined,
        sector: institutionForm.sector?.trim() || undefined,
        cell: institutionForm.cell?.trim() || undefined,
        village: institutionForm.village?.trim() || undefined,
      };

      const saved = isCreatingInstitution
        ? await institutionApi.createInstitution(payload)
        : await institutionApi.updateInstitution(institutionProfile!.id, payload as UpdateInstitutionPayload);

      setInstitutionProfile(saved);
      setIsCreatingInstitution(false);
      showToast(isCreatingInstitution ? "Institution profile created successfully" : "Institution profile updated successfully", "success");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Failed to save institution profile", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleCooperativeSubmit = async () => {
    if (!cooperativeForm.name.trim()) {
      showToast("Cooperative name is required", "error");
      return;
    }

    setSaving(true);
    try {
      const payload: CreateCooperativePayload = {
        name: cooperativeForm.name.trim(),
        registrationNumber: cooperativeForm.registrationNumber?.trim() || undefined,
        description: cooperativeForm.description?.trim() || undefined,
        email: cooperativeForm.email?.trim() || undefined,
        phone: cooperativeForm.phone?.trim() || undefined,
        address: cooperativeForm.address?.trim() || undefined,
        province: cooperativeForm.province?.trim() || undefined,
        district: cooperativeForm.district?.trim() || undefined,
        sector: cooperativeForm.sector?.trim() || undefined,
        cell: cooperativeForm.cell?.trim() || undefined,
        village: cooperativeForm.village?.trim() || undefined,
      };

      const saved = isCreatingCooperative || !cooperativeProfile
        ? await cooperativeApi.createCooperative(payload)
        : await cooperativeApi.updateCooperative(cooperativeProfile.id, payload as UpdateCooperativePayload);

      setCooperativeProfile(saved);
      setIsCreatingCooperative(false);
      showToast(isCreatingCooperative ? "Cooperative profile created successfully" : "Cooperative profile updated successfully", "success");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Failed to save cooperative profile", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-6 text-sm text-stone-500">Loading profile...</div>;
  }

  if (isInstitutionUser) {
    return (
      <div className="space-y-6">
        <section className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-3xl font-semibold text-stone-900">Institution Profile</h2>
            <p className="mt-2 text-sm text-stone-500">Create or update your finance institution profile so approvals and loan reviews can work.</p>
          </div>
          <button onClick={() => navigate("/finance")} className="rounded-full border border-stone-200 bg-white px-5 py-2.5 text-sm font-semibold text-stone-700 shadow-sm">
            Back to dashboard
          </button>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <article className="rounded-[1.5rem] border border-stone-200 bg-white p-6 shadow-panel">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-semibold text-stone-900">{isCreatingInstitution ? "Create Institution Profile" : "Update Institution Profile"}</h3>
                <p className="mt-1 text-sm text-stone-500">This is the profile stored in the institutions table.</p>
              </div>
              <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">{isCreatingInstitution ? "New profile" : "Saved profile"}</span>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <Field label="Institution Name" value={institutionForm.name} onChange={(value) => setInstitutionForm((prev) => ({ ...prev, name: value }))} placeholder="e.g. Umuhinzi Finance" />
              <label className="block">
                <span className="text-sm font-medium text-stone-700">Institution Type</span>
                <select
                  value={institutionForm.type}
                  onChange={(e) => setInstitutionForm((prev) => ({ ...prev, type: e.target.value as InstitutionType }))}
                  className="mt-2 w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm outline-none focus:border-brand-500"
                >
                  {institutionTypeOptions.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </label>

              <Field label="Registration Number" value={institutionForm.registrationNumber || ""} onChange={(value) => setInstitutionForm((prev) => ({ ...prev, registrationNumber: value }))} placeholder="Registration number" />
              <Field label="License Number" value={institutionForm.licenseNumber || ""} onChange={(value) => setInstitutionForm((prev) => ({ ...prev, licenseNumber: value }))} placeholder="License number" />

              <Field label="Email" value={institutionForm.email || ""} onChange={(value) => setInstitutionForm((prev) => ({ ...prev, email: value }))} placeholder="institution@email.com" />
              <Field label="Phone" value={institutionForm.phone || ""} onChange={(value) => setInstitutionForm((prev) => ({ ...prev, phone: value }))} placeholder="+250..." />

              <Field label="Address" value={institutionForm.address || ""} onChange={(value) => setInstitutionForm((prev) => ({ ...prev, address: value }))} placeholder="Office address" />
              <Field label="Province" value={institutionForm.province || ""} onChange={(value) => setInstitutionForm((prev) => ({ ...prev, province: value }))} />

              <Field label="District" value={institutionForm.district || ""} onChange={(value) => setInstitutionForm((prev) => ({ ...prev, district: value }))} />
              <Field label="Sector" value={institutionForm.sector || ""} onChange={(value) => setInstitutionForm((prev) => ({ ...prev, sector: value }))} />

              <Field label="Cell" value={institutionForm.cell || ""} onChange={(value) => setInstitutionForm((prev) => ({ ...prev, cell: value }))} />
              <Field label="Village" value={institutionForm.village || ""} onChange={(value) => setInstitutionForm((prev) => ({ ...prev, village: value }))} />
            </div>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button onClick={() => navigate("/finance")} className="rounded-full border border-stone-200 bg-white px-5 py-2.5 text-sm font-semibold text-stone-700">Go to dashboard</button>
              <button onClick={() => void handleInstitutionSubmit()} disabled={saving} className="rounded-full bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-500/20 disabled:opacity-70">
                {saving ? "Saving..." : isCreatingInstitution ? "Create Profile" : "Update Profile"}
              </button>
            </div>
          </article>

          <aside className="space-y-4">
            <article className="rounded-[1.5rem] border border-stone-200 bg-white p-5 shadow-panel">
              <h3 className="text-lg font-semibold text-stone-900">Institution Status</h3>
              <div className="mt-4 space-y-3 text-sm text-stone-600">
                <StatusRow label="Profile exists" value={institutionProfile ? "Yes" : "No"} />
                <StatusRow label="Institution name" value={institutionProfile?.name || institutionForm.name || "Not set"} />
                <StatusRow label="Type" value={institutionProfile?.type || institutionForm.type || "Not set"} />
                <StatusRow label="Status" value={institutionProfile?.status || "PENDING"} />
              </div>
            </article>

            <article className="rounded-[1.5rem] border border-amber-200 bg-amber-50 p-5 shadow-panel">
              <h3 className="text-lg font-semibold text-amber-900">Loan Access</h3>
              <p className="mt-2 text-sm text-amber-800">An institution profile is required before approving or reviewing farmer loan applications.</p>
            </article>
          </aside>
        </section>
      </div>
    );
  }

  if (isCooperativeManagerUser) {
    return (
      <div className="space-y-6">
        <section className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-3xl font-semibold text-stone-900">Cooperative Profile</h2>
            <p className="mt-2 text-sm text-stone-500">Create or update your cooperative profile, then the admin can approve it for farmer membership.</p>
          </div>
          <button onClick={() => navigate("/cooperatives")} className="rounded-full border border-stone-200 bg-white px-5 py-2.5 text-sm font-semibold text-stone-700 shadow-sm">
            Back to dashboard
          </button>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <article className="rounded-[1.5rem] border border-stone-200 bg-white p-6 shadow-panel">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-semibold text-stone-900">{isCreatingCooperative ? "Create Cooperative Profile" : "Update Cooperative Profile"}</h3>
                <p className="mt-1 text-sm text-stone-500">Admin approval is required before farmers can join.</p>
              </div>
              <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">{cooperativeProfile?.status || "PENDING"}</span>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <Field label="Cooperative Name" value={cooperativeForm.name} onChange={(value) => setCooperativeForm((prev) => ({ ...prev, name: value }))} placeholder="e.g. Abahinzi Cooperative" />
              <Field label="Registration Number" value={cooperativeForm.registrationNumber || ""} onChange={(value) => setCooperativeForm((prev) => ({ ...prev, registrationNumber: value }))} placeholder="Optional registration number" />
              <Field label="Email" value={cooperativeForm.email || ""} onChange={(value) => setCooperativeForm((prev) => ({ ...prev, email: value }))} placeholder="cooperative@email.com" />
              <Field label="Phone" value={cooperativeForm.phone || ""} onChange={(value) => setCooperativeForm((prev) => ({ ...prev, phone: value }))} placeholder="+250..." />
              <Field label="Address" value={cooperativeForm.address || ""} onChange={(value) => setCooperativeForm((prev) => ({ ...prev, address: value }))} placeholder="Office address" />
              <Field label="Province" value={cooperativeForm.province || ""} onChange={(value) => setCooperativeForm((prev) => ({ ...prev, province: value }))} />
              <Field label="District" value={cooperativeForm.district || ""} onChange={(value) => setCooperativeForm((prev) => ({ ...prev, district: value }))} />
              <Field label="Sector" value={cooperativeForm.sector || ""} onChange={(value) => setCooperativeForm((prev) => ({ ...prev, sector: value }))} />
              <Field label="Cell" value={cooperativeForm.cell || ""} onChange={(value) => setCooperativeForm((prev) => ({ ...prev, cell: value }))} />
              <Field label="Village" value={cooperativeForm.village || ""} onChange={(value) => setCooperativeForm((prev) => ({ ...prev, village: value }))} />
              <label className="block md:col-span-2">
                <span className="text-sm font-medium text-stone-700">Description</span>
                <textarea
                  value={cooperativeForm.description || ""}
                  onChange={(e) => setCooperativeForm((prev) => ({ ...prev, description: e.target.value }))}
                  rows={4}
                  className="mt-2 w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm outline-none focus:border-brand-500"
                  placeholder="Tell the admin what your cooperative does"
                />
              </label>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button onClick={() => navigate("/cooperatives")} className="rounded-full border border-stone-200 bg-white px-5 py-2.5 text-sm font-semibold text-stone-700">Go to dashboard</button>
              <button onClick={() => void handleCooperativeSubmit()} disabled={saving} className="rounded-full bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-500/20 disabled:opacity-70">
                {saving ? "Saving..." : isCreatingCooperative ? "Submit for Approval" : "Update Profile"}
              </button>
            </div>
          </article>

          <aside className="space-y-4">
            <article className="rounded-[1.5rem] border border-stone-200 bg-white p-5 shadow-panel">
              <h3 className="text-lg font-semibold text-stone-900">Cooperative Status</h3>
              <div className="mt-4 space-y-3 text-sm text-stone-600">
                <StatusRow label="Profile exists" value={cooperativeProfile ? "Yes" : "No"} />
                <StatusRow label="Name" value={cooperativeProfile?.name || cooperativeForm.name || "Not set"} />
                <StatusRow label="Status" value={cooperativeProfile?.status || "PENDING"} />
                <StatusRow label="Approved" value={cooperativeProfile?.status === "ACTIVE" ? "Yes" : "No"} />
              </div>
            </article>

            <article className="rounded-[1.5rem] border border-amber-200 bg-amber-50 p-5 shadow-panel">
              <h3 className="text-lg font-semibold text-amber-900">Approval Flow</h3>
              <p className="mt-2 text-sm text-amber-800">Once submitted, the cooperative stays pending until an admin approves it. Farmers can only select ACTIVE cooperatives.</p>
            </article>
          </aside>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-3xl font-semibold text-stone-900">Farmer Profile</h2>
          <p className="mt-2 text-sm text-stone-500">Create or update your farmer profile before applying for loans.</p>
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
              <p className="mt-1 text-sm text-stone-500">This is the profile stored in the farmers table.</p>
            </div>
            <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">{isCreating ? "New profile" : "Saved profile"}</span>
          </div>

          {!canEditProfile && (
            <div className="mt-4 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Your farmer profile is pending approval. A cooperative manager must accept you in Member Control before you can edit this profile.
            </div>
          )}

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <Field label="National ID" value={form.nationalId} onChange={(value) => setForm((prev) => ({ ...prev, nationalId: value }))} placeholder="16 digits" disabled={!canEditProfile} />
            <Field label="Date of Birth" type="date" value={form.dateOfBirth || ""} onChange={(value) => setForm((prev) => ({ ...prev, dateOfBirth: value }))} disabled={!canEditProfile} />
            <label className="block">
              <span className="text-sm font-medium text-stone-700">Gender</span>
              <select disabled={!canEditProfile} value={form.gender || ""} onChange={(e) => setForm((prev) => ({ ...prev, gender: e.target.value as FarmerProfilePayload["gender"] || undefined }))} className="mt-2 w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm outline-none focus:border-brand-500 disabled:cursor-not-allowed disabled:bg-stone-100">
                <option value="">Select gender</option>
                {genderOptions.map((gender) => <option key={gender} value={gender}>{gender}</option>)}
              </select>
            </label>
            <Field label="Farming Experience (Years)" type="number" value={form.farmingExperienceYears === undefined ? "" : String(form.farmingExperienceYears)} onChange={(value) => setForm((prev) => ({ ...prev, farmingExperienceYears: value === "" ? undefined : Number(value) }))} placeholder="e.g. 5" disabled={!canEditProfile} />
            <Field label="Primary Crop" value={form.primaryCrop || ""} onChange={(value) => setForm((prev) => ({ ...prev, primaryCrop: value }))} placeholder="Maize, beans, potatoes..." disabled={!canEditProfile} />
            <label className="block md:col-span-2">
              <span className="text-sm font-medium text-stone-700">Cooperative</span>
              <select
                disabled={!canEditProfile}
                value={form.cooperativeId || ""}
                onChange={(e) => setForm((prev) => ({ ...prev, cooperativeId: e.target.value || null }))}
                className="mt-2 w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm outline-none focus:border-brand-500 disabled:cursor-not-allowed disabled:bg-stone-100"
              >
                <option value="">Select an approved cooperative</option>
                {selectableCooperatives.map((cooperative) => (
                  <option key={cooperative.id} value={cooperative.id}>
                    {cooperative.name} {cooperative.district ? `• ${cooperative.district}` : ""}
                  </option>
                ))}
              </select>
              <p className="mt-2 text-xs text-stone-500">Only approved cooperatives with an active manager are available here.</p>
            </label>
          </div>

          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button onClick={() => navigate("/dashboard")} className="rounded-full border border-stone-200 bg-white px-5 py-2.5 text-sm font-semibold text-stone-700">Go to dashboard</button>
            <button onClick={() => void handleFarmerSubmit()} disabled={saving || !canEditProfile} className="rounded-full bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-500/20 disabled:opacity-70">
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
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  disabled?: boolean;
}) => (
  <label className="block">
    <span className="text-sm font-medium text-stone-700">{label}</span>
    <input
      type={type}
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="mt-2 w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm outline-none focus:border-brand-500 disabled:cursor-not-allowed disabled:bg-stone-100"
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