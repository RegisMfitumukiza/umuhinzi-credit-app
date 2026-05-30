import { useEffect, useRef, useState } from "react";
import { api } from "../api/http";
import { useToast } from "../context/ToastContext";
import { formatDate } from "../utils/format";

type InstitutionType =
  | "SACCO"
  | "MICROFINANCE"
  | "BANK"
  | "NGO"
  | "GOVERNMENT_PROGRAM"
  | "OTHER";

type InstitutionStatus = "PENDING" | "ACTIVE" | "SUSPENDED" | "DEACTIVATED";

interface Institution {
  id: string;
  name: string;
  type: InstitutionType;
  status: InstitutionStatus;
  registrationNumber: string | null;
  licenseNumber: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  province: string | null;
  district: string | null;
  sector: string | null;
  cell: string | null;
  village: string | null;
  createdAt: string;
  updatedAt: string;
  user: { fullName: string; email: string } | null;
}

interface InstitutionForm {
  name: string;
  type: InstitutionType;
  registrationNumber: string;
  licenseNumber: string;
  email: string;
  phone: string;
  address: string;
  province: string;
  district: string;
  sector: string;
  cell: string;
  village: string;
}

const EMPTY_FORM: InstitutionForm = {
  name: "",
  type: "SACCO",
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
};

const STATUS_BADGE: Record<InstitutionStatus, string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  ACTIVE: "bg-brand-100 text-brand-700",
  SUSPENDED: "bg-red-100 text-red-700",
  DEACTIVATED: "bg-stone-100 text-stone-500",
};

const INSTITUTION_TYPES: InstitutionType[] = [
  "SACCO",
  "MICROFINANCE",
  "BANK",
  "NGO",
  "GOVERNMENT_PROGRAM",
  "OTHER",
];

const typeLabel = (t: InstitutionType) =>
  t === "GOVERNMENT_PROGRAM" ? "Government Program" : t.charAt(0) + t.slice(1).toLowerCase().replace("_", " ");

const toForm = (inst: Institution): InstitutionForm => ({
  name: inst.name,
  type: inst.type,
  registrationNumber: inst.registrationNumber ?? "",
  licenseNumber: inst.licenseNumber ?? "",
  email: inst.email ?? "",
  phone: inst.phone ?? "",
  address: inst.address ?? "",
  province: inst.province ?? "",
  district: inst.district ?? "",
  sector: inst.sector ?? "",
  cell: inst.cell ?? "",
  village: inst.village ?? "",
});

/* ─── Row in the detail view ─── */
const Row = ({ label, value }: { label: string; value: string | null }) => (
  <div>
    <p className="text-xs text-stone-400 font-medium">{label}</p>
    <p className="text-sm font-semibold text-stone-800 mt-0.5">{value || "—"}</p>
  </div>
);

/* ─── Reusable text input ─── */
const Field = ({
  label,
  value,
  onChange,
  required,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  type?: string;
}) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-sm font-medium text-stone-700">
      {label}
      {required && <span className="text-red-400 ml-0.5">*</span>}
    </label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required={required}
      className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-all"
    />
  </div>
);

/* ─── Main Page ─── */
export const InstitutionProfilePage = () => {
  const { showToast } = useToast();
  const [institution, setInstitution] = useState<Institution | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<InstitutionForm>(EMPTY_FORM);
  const docInputRef = useRef<HTMLInputElement>(null);
  const [docUploading, setDocUploading] = useState(false);
  const [docUploads, setDocUploads] = useState<{ url: string; name: string }[]>([]);

  useEffect(() => {
    api
      .get("/institutions?limit=1")
      .then((r) => {
        const list = r.data.data as Institution[];
        if (list.length > 0) {
          setInstitution(list[0]);
        }
      })
      .catch(() => showToast("Failed to load institution profile.", "error"))
      .finally(() => setLoading(false));
  }, [showToast]);

  const set = (key: keyof InstitutionForm) => (v: string) =>
    setForm((prev) => ({ ...prev, [key]: v }));

  const startEdit = () => {
    if (institution) setForm(toForm(institution));
    setEditing(true);
  };

  const cancelEdit = () => {
    setEditing(false);
    setCreating(false);
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
      const { data } = await api.post("/uploads/institution/documents", fd, {
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
    if (!form.name.trim()) return;

    const body: Record<string, string> = { name: form.name.trim(), type: form.type };
    if (form.registrationNumber.trim()) body.registrationNumber = form.registrationNumber.trim();
    if (form.licenseNumber.trim()) body.licenseNumber = form.licenseNumber.trim();
    if (form.email.trim()) body.email = form.email.trim();
    if (form.phone.trim()) body.phone = form.phone.trim();
    if (form.address.trim()) body.address = form.address.trim();
    if (form.province.trim()) body.province = form.province.trim();
    if (form.district.trim()) body.district = form.district.trim();
    if (form.sector.trim()) body.sector = form.sector.trim();
    if (form.cell.trim()) body.cell = form.cell.trim();
    if (form.village.trim()) body.village = form.village.trim();

    setSaving(true);
    try {
      if (creating) {
        const { data } = await api.post("/institutions", body);
        setInstitution(data.data as Institution);
        setCreating(false);
        showToast("Institution profile created.", "success");
      } else if (institution) {
        const { data } = await api.patch(`/institutions/${institution.id}`, body);
        setInstitution(data.data as Institution);
        setEditing(false);
        showToast("Institution profile updated.", "success");
      }
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Failed to save.";
      showToast(msg, "error");
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

  const showForm = editing || creating;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-stone-900 tracking-tight">Institution Profile</h1>
          <p className="text-stone-500 text-sm mt-0.5">Your institution's business information</p>
        </div>
        {!showForm && (
          <button
            onClick={() => {
              if (institution) {
                startEdit();
              } else {
                setForm(EMPTY_FORM);
                setCreating(true);
              }
            }}
            className="px-5 py-2.5 bg-stone-900 hover:bg-stone-800 text-white text-sm font-semibold rounded-full transition-colors"
          >
            {institution ? "Edit" : "Create Profile"}
          </button>
        )}
      </div>

      {/* No institution yet */}
      {!institution && !showForm && (
        <div className="bg-white rounded-2xl border border-stone-200 p-10 shadow-sm flex flex-col items-center gap-3 text-center">
          <div className="w-14 h-14 rounded-full bg-stone-100 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
            </svg>
          </div>
          <p className="font-semibold text-stone-700">No institution profile yet</p>
          <p className="text-stone-400 text-sm max-w-xs">Create your institution profile to register your organization's business details.</p>
          <button
            onClick={() => { setForm(EMPTY_FORM); setCreating(true); }}
            className="mt-2 px-6 py-2.5 bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold rounded-full transition-colors"
          >
            Create Institution Profile
          </button>
        </div>
      )}

      {/* Create / Edit form */}
      {showForm && (
        <form onSubmit={handleSave} className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm">
          <h2 className="font-bold text-stone-900 mb-5">
            {creating ? "Create Institution Profile" : "Edit Institution Profile"}
          </h2>

          <div className="flex flex-col gap-4">
            {/* Name + Type */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Institution name" value={form.name} onChange={set("name")} required />
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-stone-700">
                  Type <span className="text-red-400">*</span>
                </label>
                <select
                  value={form.type}
                  onChange={(e) => set("type")(e.target.value)}
                  required
                  className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-all"
                >
                  {INSTITUTION_TYPES.map((t) => (
                    <option key={t} value={t}>{typeLabel(t)}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Registration + License */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Registration number" value={form.registrationNumber} onChange={set("registrationNumber")} />
              <Field label="License number" value={form.licenseNumber} onChange={set("licenseNumber")} />
            </div>

            {/* Contact */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Contact email" value={form.email} onChange={set("email")} type="email" />
              <Field label="Contact phone" value={form.phone} onChange={set("phone")} />
            </div>

            {/* Address */}
            <Field label="Address" value={form.address} onChange={set("address")} />

            {/* Location */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Province" value={form.province} onChange={set("province")} />
              <Field label="District" value={form.district} onChange={set("district")} />
              <Field label="Sector" value={form.sector} onChange={set("sector")} />
              <Field label="Cell" value={form.cell} onChange={set("cell")} />
              <div className="md:col-span-2">
                <Field label="Village" value={form.village} onChange={set("village")} />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-2">
              <button
                type="button"
                onClick={cancelEdit}
                className="px-5 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-sm font-semibold rounded-full transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2.5 bg-stone-900 hover:bg-stone-800 disabled:opacity-60 text-white text-sm font-semibold rounded-full transition-colors"
              >
                {saving ? "Saving…" : creating ? "Create" : "Save changes"}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Read-only view */}
      {institution && !showForm && (
        <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm space-y-5">
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="font-black text-stone-900 text-xl">{institution.name}</h2>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <span className="text-xs font-bold bg-stone-800 text-white px-2.5 py-0.5 rounded-full">
                  {typeLabel(institution.type)}
                </span>
                <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${STATUS_BADGE[institution.status]}`}>
                  {institution.status}
                </span>
              </div>
            </div>
          </div>

          <div className="border-t border-stone-100 pt-5">
            <h3 className="text-xs font-semibold text-stone-400 uppercase tracking-wide mb-4">Registration</h3>
            <div className="grid grid-cols-2 gap-x-8 gap-y-4">
              <Row label="Registration number" value={institution.registrationNumber} />
              <Row label="License number" value={institution.licenseNumber} />
            </div>
          </div>

          <div className="border-t border-stone-100 pt-5">
            <h3 className="text-xs font-semibold text-stone-400 uppercase tracking-wide mb-4">Contact</h3>
            <div className="grid grid-cols-2 gap-x-8 gap-y-4">
              <Row label="Email" value={institution.email} />
              <Row label="Phone" value={institution.phone} />
              <div className="col-span-2">
                <Row label="Address" value={institution.address} />
              </div>
            </div>
          </div>

          <div className="border-t border-stone-100 pt-5">
            <h3 className="text-xs font-semibold text-stone-400 uppercase tracking-wide mb-4">Location</h3>
            <div className="grid grid-cols-2 gap-x-8 gap-y-4">
              <Row label="Province" value={institution.province} />
              <Row label="District" value={institution.district} />
              <Row label="Sector" value={institution.sector} />
              <Row label="Cell" value={institution.cell} />
              <Row label="Village" value={institution.village} />
            </div>
          </div>

          <div className="border-t border-stone-100 pt-5">
            <p className="text-xs text-stone-400">
              Created {formatDate(institution.createdAt)} · Last updated {formatDate(institution.updatedAt)}
            </p>
          </div>
        </div>
      )}

      {/* Document upload — only when institution profile exists */}
      {institution && !showForm && (
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
      )}
    </div>
  );
};
