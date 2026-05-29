import { useMemo, useState } from "react";

type PendingMember = {
  id: string;
  name: string;
  phone: string;
  village: string;
  status: "Pending";
};

type CooperativeMember = {
  id: string;
  name: string;
  phone: string;
  village: string;
  role: string;
};

const initialPendingMembers: PendingMember[] = [
  { id: "REQ-001", name: "Emile Karemera", phone: "+250788111222", village: "Kacyiru", status: "Pending" },
  { id: "REQ-002", name: "Grace Uwera", phone: "+250788333444", village: "Gatsata", status: "Pending" },
  { id: "REQ-003", name: "Pascal Nkurunziza", phone: "+250788555666", village: "Remera", status: "Pending" },
];

const initialMembers: CooperativeMember[] = [
  { id: "MEM-101", name: "Alice Mutoni", phone: "+250788777888", village: "Kimironko", role: "Treasurer" },
  { id: "MEM-102", name: "Jean Gakweya", phone: "+250788999000", village: "Nyamirambo", role: "Member" },
];

export const CooperativeMemberManagementPage = () => {
  const [pendingMembers, setPendingMembers] = useState<PendingMember[]>(initialPendingMembers);
  const [members, setMembers] = useState<CooperativeMember[]>(initialMembers);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newMember, setNewMember] = useState({
    name: "",
    phone: "",
    village: "",
    role: "Member",
  });

  const summary = useMemo(
    () => ({
      total: members.length + pendingMembers.length,
      active: members.length,
      pending: pendingMembers.length,
    }),
    [members.length, pendingMembers.length]
  );

  const acceptMember = (member: PendingMember) => {
    setPendingMembers((prev) => prev.filter((item) => item.id !== member.id));
    setMembers((prev) => [
      {
        id: `MEM-${Date.now()}`,
        name: member.name,
        phone: member.phone,
        village: member.village,
        role: "Member",
      },
      ...prev,
    ]);
  };

  const handleAddMember = () => {
    if (!newMember.name.trim() || !newMember.phone.trim() || !newMember.village.trim()) {
      return;
    }

    setMembers((prev) => [
      {
        id: `MEM-${Date.now()}`,
        name: newMember.name.trim(),
        phone: newMember.phone.trim(),
        village: newMember.village.trim(),
        role: newMember.role.trim() || "Member",
      },
      ...prev,
    ]);

    setNewMember({ name: "", phone: "", village: "", role: "Member" });
    setShowAddForm(false);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#f7f8fa] px-4 py-6 lg:px-8">
      <div className="mx-auto max-w-[1400px] space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-stone-900">Cooperative Members</h1>
            <p className="mt-1 text-sm text-stone-500">Accept new members and add approved members to the cooperative list.</p>
          </div>

          <button
            onClick={() => setShowAddForm((prev) => !prev)}
            className="rounded-full bg-emerald-500 px-5 py-3 text-sm font-semibold text-white shadow-sm"
          >
            {showAddForm ? "Close Form" : "Add New Member"}
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <StatCard label="Total Members" value={summary.total} />
          <StatCard label="Active Members" value={summary.active} />
          <StatCard label="Pending Requests" value={summary.pending} />
        </div>

        {showAddForm && (
          <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-stone-900">Add New Member</h2>
              <span className="text-xs text-stone-500">Manual registration</span>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <input
                value={newMember.name}
                onChange={(e) => setNewMember((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Full name"
                className="rounded-xl border border-stone-200 px-4 py-3 text-sm outline-none focus:border-emerald-400"
              />
              <input
                value={newMember.phone}
                onChange={(e) => setNewMember((prev) => ({ ...prev, phone: e.target.value }))}
                placeholder="Phone"
                className="rounded-xl border border-stone-200 px-4 py-3 text-sm outline-none focus:border-emerald-400"
              />
              <input
                value={newMember.village}
                onChange={(e) => setNewMember((prev) => ({ ...prev, village: e.target.value }))}
                placeholder="Village"
                className="rounded-xl border border-stone-200 px-4 py-3 text-sm outline-none focus:border-emerald-400"
              />
              <input
                value={newMember.role}
                onChange={(e) => setNewMember((prev) => ({ ...prev, role: e.target.value }))}
                placeholder="Role"
                className="rounded-xl border border-stone-200 px-4 py-3 text-sm outline-none focus:border-emerald-400"
              />
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={handleAddMember}
                className="rounded-full bg-stone-900 px-5 py-3 text-sm font-semibold text-white"
              >
                Save Member
              </button>
            </div>
          </section>
        )}

        <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-stone-900">Pending New Members</h2>
              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">Awaiting approval</span>
            </div>

            <div className="space-y-3">
              {pendingMembers.map((member) => (
                <div key={member.id} className="rounded-2xl border border-stone-100 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="font-semibold text-stone-900">{member.name}</div>
                      <div className="text-sm text-stone-500">{member.phone} • {member.village}</div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => acceptMember(member)}
                        className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => setPendingMembers((prev) => prev.filter((item) => item.id !== member.id))}
                        className="rounded-full border border-stone-200 px-4 py-2 text-sm font-semibold text-stone-700"
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-stone-900">Approved Members</h2>
              <button
                onClick={() => setShowAddForm(true)}
                className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700"
              >
                + Add New Member
              </button>
            </div>

            <div className="space-y-3">
              {members.map((member) => (
                <div key={member.id} className="rounded-2xl border border-stone-100 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="font-semibold text-stone-900">{member.name}</div>
                      <div className="text-sm text-stone-500">{member.phone} • {member.village}</div>
                    </div>
                    <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">{member.role}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ label, value }: { label: string; value: number }) => (
  <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
    <div className="text-sm text-stone-500">{label}</div>
    <div className="mt-2 text-3xl font-semibold text-stone-900">{value}</div>
  </div>
);

export default CooperativeMemberManagementPage;