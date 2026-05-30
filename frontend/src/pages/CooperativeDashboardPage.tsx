import { useEffect, useRef, useState } from "react";
import { api } from "../api/http";
import { useToast } from "../context/ToastContext";
import { formatDate } from "../utils/format";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Cooperative {
  id: string;
  name: string;
  registrationNumber?: string | null;
  description?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  province?: string | null;
  district?: string | null;
  sector?: string | null;
  status: string;
  createdAt: string;
  _count: { members: number; managers: number };
}

interface Member {
  id: string;
  cooperativeId: string;
  farmerId: string;
  status: string;
  joinedAt: string;
  leftAt?: string | null;
  farmer: {
    id: string;
    user: { id: string; fullName: string; email: string };
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const statusColor: Record<string, string> = {
  ACTIVE: "bg-brand-100 text-brand-700",
  PENDING: "bg-yellow-100 text-yellow-700",
  REMOVED: "bg-stone-100 text-stone-500",
  LEFT: "bg-orange-100 text-orange-700",
};

const coopStatusColor: Record<string, string> = {
  ACTIVE: "bg-brand-100 text-brand-700",
  PENDING: "bg-yellow-100 text-yellow-700",
  SUSPENDED: "bg-red-100 text-red-700",
  DEACTIVATED: "bg-stone-100 text-stone-500",
};

const errMsg = (err: unknown, fallback: string) =>
  err &&
  typeof err === "object" &&
  "response" in err
    ? (err as { response?: { data?: { message?: string } } }).response?.data
        ?.message ?? fallback
    : fallback;

// ─── Create Cooperative Modal ─────────────────────────────────────────────────

interface CreateModalProps {
  onClose: () => void;
  onCreated: (created: Cooperative) => void;
}

const CreateCooperativeModal = ({ onClose, onCreated }: CreateModalProps) => {
  const { showToast } = useToast();
  const overlayRef = useRef<HTMLDivElement>(null);

  const [form, setForm] = useState({
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
  const [saving, setSaving] = useState(false);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const body: Record<string, string> = { name: form.name.trim() };
      Object.entries(form).forEach(([k, v]) => {
        if (k !== "name" && v.trim()) body[k] = v.trim();
      });
      const r = await api.post("/cooperatives", body);
      onCreated(r.data.data as Cooperative);
      showToast("Cooperative created successfully.", "success");
      onClose();
    } catch (err) {
      showToast(errMsg(err, "Failed to create cooperative."), "error");
    } finally {
      setSaving(false);
    }
  };

  const inputCls =
    "rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-all w-full";

  return (
    <div
      ref={overlayRef}
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4 py-8 overflow-y-auto"
    >
      <div className="bg-white rounded-2xl shadow-xl border border-stone-100 w-full max-w-md p-6 space-y-5 my-auto max-h-[90vh] overflow-y-auto">
        <div>
          <h2 className="text-base font-black text-stone-900">Create cooperative</h2>
          <p className="text-xs text-stone-400 mt-0.5">Register your cooperative's details</p>
        </div>

        <form onSubmit={handleCreate} className="space-y-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-stone-500 uppercase tracking-wide">
              Name <span className="text-red-400">*</span>
            </label>
            <input className={inputCls} value={form.name} onChange={set("name")} required placeholder="e.g. Kigali Farmers Cooperative" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-stone-500 uppercase tracking-wide">
              Registration number
            </label>
            <input className={inputCls} value={form.registrationNumber} onChange={set("registrationNumber")} placeholder="Optional" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-stone-500 uppercase tracking-wide">
              Description
            </label>
            <textarea
              className={`${inputCls} resize-none`}
              rows={3}
              value={form.description}
              onChange={set("description")}
              placeholder="Brief description of your cooperative"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-stone-500 uppercase tracking-wide">Email</label>
              <input type="email" className={inputCls} value={form.email} onChange={set("email")} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-stone-500 uppercase tracking-wide">Phone</label>
              <input className={inputCls} value={form.phone} onChange={set("phone")} />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-stone-500 uppercase tracking-wide">Address</label>
            <input className={inputCls} value={form.address} onChange={set("address")} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-stone-500 uppercase tracking-wide">Province</label>
              <input className={inputCls} value={form.province} onChange={set("province")} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-stone-500 uppercase tracking-wide">District</label>
              <input className={inputCls} value={form.district} onChange={set("district")} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-stone-500 uppercase tracking-wide">Sector</label>
              <input className={inputCls} value={form.sector} onChange={set("sector")} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-stone-500 uppercase tracking-wide">Cell</label>
              <input className={inputCls} value={form.cell} onChange={set("cell")} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-stone-500 uppercase tracking-wide">Village</label>
              <input className={inputCls} value={form.village} onChange={set("village")} />
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-full border border-stone-200 text-sm font-semibold text-stone-600 hover:bg-stone-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 rounded-full bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white text-sm font-semibold transition-colors"
            >
              {saving ? "Creating…" : "Create cooperative"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Edit Cooperative Modal ───────────────────────────────────────────────────

interface EditModalProps {
  cooperative: Cooperative;
  onClose: () => void;
  onSaved: (updated: Cooperative) => void;
}

const EditCooperativeModal = ({
  cooperative,
  onClose,
  onSaved,
}: EditModalProps) => {
  const { showToast } = useToast();
  const overlayRef = useRef<HTMLDivElement>(null);

  const [form, setForm] = useState({
    name: cooperative.name,
    description: cooperative.description ?? "",
    email: cooperative.email ?? "",
    phone: cooperative.phone ?? "",
    address: cooperative.address ?? "",
    province: cooperative.province ?? "",
    district: cooperative.district ?? "",
    sector: cooperative.sector ?? "",
  });
  const [saving, setSaving] = useState(false);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const body: Record<string, string> = {};
      Object.entries(form).forEach(([k, v]) => {
        if (v.trim()) body[k] = v.trim();
      });
      const r = await api.patch(`/cooperatives/${cooperative.id}`, body);
      onSaved(r.data.data);
      showToast("Cooperative updated.", "success");
      onClose();
    } catch (err) {
      showToast(errMsg(err, "Failed to update cooperative."), "error");
    } finally {
      setSaving(false);
    }
  };

  const inputCls =
    "rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-all w-full";

  return (
    <div
      ref={overlayRef}
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4 py-8 overflow-y-auto"
    >
      <div className="bg-white rounded-2xl shadow-xl border border-stone-100 w-full max-w-md p-6 space-y-5 my-auto">
        <h2 className="text-base font-black text-stone-900">Edit cooperative</h2>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-stone-500 uppercase tracking-wide">
              Name *
            </label>
            <input className={inputCls} value={form.name} onChange={set("name")} required />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-stone-500 uppercase tracking-wide">
              Description
            </label>
            <textarea
              className={`${inputCls} resize-none`}
              rows={3}
              value={form.description}
              onChange={set("description")}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-stone-500 uppercase tracking-wide">
                Email
              </label>
              <input type="email" className={inputCls} value={form.email} onChange={set("email")} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-stone-500 uppercase tracking-wide">
                Phone
              </label>
              <input className={inputCls} value={form.phone} onChange={set("phone")} />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-stone-500 uppercase tracking-wide">
              Address
            </label>
            <input className={inputCls} value={form.address} onChange={set("address")} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-stone-500 uppercase tracking-wide">
                Province
              </label>
              <input className={inputCls} value={form.province} onChange={set("province")} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-stone-500 uppercase tracking-wide">
                District
              </label>
              <input className={inputCls} value={form.district} onChange={set("district")} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-stone-500 uppercase tracking-wide">
                Sector
              </label>
              <input className={inputCls} value={form.sector} onChange={set("sector")} />
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-full border border-stone-200 text-sm font-semibold text-stone-600 hover:bg-stone-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 rounded-full bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white text-sm font-semibold transition-colors"
            >
              {saving ? "Saving…" : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Page ─────────────────────────────────────────────────────────────────────

type Tab = "overview" | "members";

export const CooperativeDashboardPage = () => {
  const { showToast } = useToast();
  const [tab, setTab] = useState<Tab>("overview");

  const [cooperative, setCooperative] = useState<Cooperative | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const docInputRef = useRef<HTMLInputElement>(null);
  const [docUploading, setDocUploading] = useState(false);
  const [docUploads, setDocUploads] = useState<{ url: string; name: string }[]>([]);

  useEffect(() => {
    Promise.all([
      api.get("/cooperative-members?limit=100"),
      api.get("/cooperatives?limit=20"),
    ])
      .then(([membersRes, coopsRes]) => {
        const fetchedMembers: Member[] = membersRes.data.data ?? [];
        const coops: Cooperative[] = coopsRes.data.data ?? [];
        setMembers(fetchedMembers);

        // Match cooperative to the one the manager belongs to
        const myCoopId = fetchedMembers[0]?.cooperativeId;
        const myCoop = myCoopId
          ? (coops.find((c) => c.id === myCoopId) ?? coops[0] ?? null)
          : (coops[0] ?? null);
        setCooperative(myCoop);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleRemoveMember = async (member: Member) => {
    setRemovingId(member.id);
    try {
      await api.delete(`/cooperative-members/${member.id}`);
      setMembers((prev) =>
        prev.map((m) =>
          m.id === member.id ? { ...m, status: "REMOVED" } : m
        )
      );
      showToast(`${member.farmer.user.fullName} removed.`, "success");
    } catch (err) {
      showToast(errMsg(err, "Failed to remove member."), "error");
    } finally {
      setRemovingId(null);
    }
  };

  const handleDocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !cooperative) return;
    if (file.size > 10 * 1024 * 1024) {
      showToast("File must be under 10 MB.", "error");
      return;
    }
    const fd = new FormData();
    fd.append("document", file);
    setDocUploading(true);
    try {
      const { data } = await api.post(
        `/uploads/cooperatives/${cooperative.id}/documents`,
        fd,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      setDocUploads((prev) => [...prev, { url: data.data.url, name: file.name }]);
      showToast("Document uploaded.", "success");
    } catch (err) {
      showToast(errMsg(err, "Failed to upload."), "error");
    } finally {
      setDocUploading(false);
      if (docInputRef.current) docInputRef.current.value = "";
    }
  };

  const activeMembers = members.filter((m) => m.status === "ACTIVE");
  const filteredMembers = members.filter(
    (m) =>
      m.farmer.user.fullName.toLowerCase().includes(search.toLowerCase()) ||
      m.farmer.user.email.toLowerCase().includes(search.toLowerCase())
  );

  const tabs: { id: Tab; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "members", label: `Members (${activeMembers.length})` },
  ];

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-stone-400 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-stone-900 tracking-tight">
          Cooperative Dashboard
        </h1>
        <p className="text-stone-500 text-sm mt-0.5">
          {cooperative?.name ?? "Manage your cooperative"}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-stone-100 p-1 rounded-2xl w-fit">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-5 py-2 rounded-xl text-sm font-semibold transition-colors ${
              tab === t.id
                ? "bg-white text-stone-900 shadow-sm"
                : "text-stone-500 hover:text-stone-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Overview ─────────────────────────────────────────────────── */}
      {tab === "overview" && (
        <>
          {/* Stat cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5">
              <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide">
                Active Members
              </p>
              <p className="text-2xl font-black text-stone-900 mt-1">
                {activeMembers.length}
              </p>
            </div>
            <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5">
              <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide">
                Total Members
              </p>
              <p className="text-2xl font-black text-stone-900 mt-1">
                {members.length}
              </p>
            </div>
            <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5">
              <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide">
                Status
              </p>
              <div className="mt-2">
                <span
                  className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                    coopStatusColor[cooperative?.status ?? ""] ??
                    "bg-stone-100 text-stone-500"
                  }`}
                >
                  {cooperative?.status ?? "—"}
                </span>
              </div>
            </div>
          </div>

          {/* Cooperative detail card + document upload */}
          {cooperative ? (
            <>
            <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-6 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-black text-stone-900">
                    {cooperative.name}
                  </h2>
                  {cooperative.registrationNumber && (
                    <p className="text-xs text-stone-400 mt-0.5">
                      Reg. {cooperative.registrationNumber}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => setEditing(true)}
                  className="text-xs font-semibold text-stone-500 hover:text-brand-600 hover:bg-brand-50 px-3 py-1.5 rounded-full border border-stone-200 hover:border-brand-200 transition-colors shrink-0"
                >
                  Edit
                </button>
              </div>

              {cooperative.description && (
                <p className="text-sm text-stone-600">{cooperative.description}</p>
              )}

              <div className="grid grid-cols-2 gap-x-6 gap-y-2 pt-2 border-t border-stone-50">
                {cooperative.email && (
                  <div>
                    <p className="text-xs text-stone-400">Email</p>
                    <p className="text-sm font-medium text-stone-700">
                      {cooperative.email}
                    </p>
                  </div>
                )}
                {cooperative.phone && (
                  <div>
                    <p className="text-xs text-stone-400">Phone</p>
                    <p className="text-sm font-medium text-stone-700">
                      {cooperative.phone}
                    </p>
                  </div>
                )}
                {cooperative.address && (
                  <div>
                    <p className="text-xs text-stone-400">Address</p>
                    <p className="text-sm font-medium text-stone-700">
                      {cooperative.address}
                    </p>
                  </div>
                )}
                {(cooperative.province || cooperative.district) && (
                  <div>
                    <p className="text-xs text-stone-400">Location</p>
                    <p className="text-sm font-medium text-stone-700">
                      {[cooperative.district, cooperative.province]
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-stone-400">Registered</p>
                  <p className="text-sm font-medium text-stone-700">
                    {formatDate(cooperative.createdAt)}
                  </p>
                </div>
              </div>
            </div>

            {/* Cooperative documents */}
            <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-6 space-y-4">
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
            </>
          ) : (
            <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center shadow-sm flex flex-col items-center gap-3">
              <div className="w-14 h-14 rounded-full bg-stone-100 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <p className="font-semibold text-stone-700">No cooperative yet</p>
              <p className="text-stone-400 text-sm max-w-xs">
                Create your cooperative to start managing farmers and accessing group services.
              </p>
              <button
                onClick={() => setCreating(true)}
                className="mt-1 px-6 py-2.5 bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold rounded-full transition-colors"
              >
                Create Cooperative
              </button>
            </div>
          )}
        </>
      )}

      {/* ── Members ──────────────────────────────────────────────────── */}
      {tab === "members" && (
        <>
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm text-stone-500">
              {activeMembers.length} active
              {members.length !== activeMembers.length &&
                `, ${members.length} total`}
            </p>
            <input
              type="text"
              placeholder="Search members…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-2 text-sm outline-none focus:border-stone-400 focus:ring-2 focus:ring-stone-100 w-52 transition-all"
            />
          </div>

          <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
            {filteredMembers.length === 0 ? (
              <p className="text-stone-400 text-sm text-center py-12">
                {members.length === 0
                  ? "No members have joined yet."
                  : "No results found."}
              </p>
            ) : (
              <table className="w-full text-sm">
                <thead className="border-b border-stone-100">
                  <tr>
                    {["Name", "Email", "Status", "Joined", ""].map((h, i) => (
                      <th
                        key={i}
                        className="text-left text-xs font-semibold text-stone-400 px-5 py-3"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredMembers.map((m) => (
                    <tr
                      key={m.id}
                      className="border-b border-stone-50 last:border-0 hover:bg-stone-50 transition-colors"
                    >
                      <td className="px-5 py-3 font-medium text-stone-900">
                        {m.farmer.user.fullName}
                      </td>
                      <td className="px-5 py-3 text-stone-500">
                        {m.farmer.user.email}
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                            statusColor[m.status] ?? "bg-stone-100 text-stone-600"
                          }`}
                        >
                          {m.status}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-stone-400">
                        {formatDate(m.joinedAt)}
                      </td>
                      <td className="px-5 py-3 text-right">
                        {m.status === "ACTIVE" && (
                          <button
                            onClick={() => handleRemoveMember(m)}
                            disabled={removingId === m.id}
                            className="text-xs font-semibold text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded-full border border-red-200 hover:border-red-300 disabled:opacity-50 transition-colors"
                          >
                            {removingId === m.id ? "Removing…" : "Remove"}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {editing && cooperative && (
        <EditCooperativeModal
          cooperative={cooperative}
          onClose={() => setEditing(false)}
          onSaved={(updated) => setCooperative(updated)}
        />
      )}

      {creating && (
        <CreateCooperativeModal
          onClose={() => setCreating(false)}
          onCreated={(created) => setCooperative(created)}
        />
      )}
    </div>
  );
};
