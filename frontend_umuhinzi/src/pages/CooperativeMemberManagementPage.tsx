import { useEffect, useMemo, useState } from "react";
import { getCurrentUserProfile } from "../api/users";
import { cooperativeApi, type CooperativeProfile } from "../api/cooperatives";
import { cooperativeMembersApi, type CooperativeMemberApi } from "../api/cooperativeMembers";
import { useToast } from "../context/ToastContext";

type CooperativeMember = {
  id: string;
  name: string;
  phone: string;
  village: string;
  role: string;
  status: string;
};

export const CooperativeMemberManagementPage = () => {
  const { showToast } = useToast();
  const [members, setMembers] = useState<CooperativeMember[]>([]);
  const [cooperative, setCooperative] = useState<CooperativeProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    void (async () => {
      try {
        const currentUser = await getCurrentUserProfile();
        const cooperativeId = currentUser.cooperativeManagerProfile?.cooperativeId;

        const [allCooperatives, memberRows] = await Promise.all([
          cooperativeId ? cooperativeApi.getAllCooperatives().catch(() => [] as CooperativeProfile[]) : Promise.resolve([] as CooperativeProfile[]),
          cooperativeId ? cooperativeMembersApi.getMyCooperativeMembers().catch(() => [] as CooperativeMemberApi[]) : Promise.resolve([] as CooperativeMemberApi[]),
        ]);

        const currentCooperative = allCooperatives.find((item) => item.id === cooperativeId) || null;

        if (!mounted) return;

        setCooperative(currentCooperative);
        setMembers(
          memberRows.map((member) => ({
            id: member.id,
            name: member.farmer?.user?.fullName || "Farmer",
            phone: member.farmer?.user?.email || "-",
            village: "-",
            role: member.status || "Member",
            status: member.status || "PENDING",
          }))
        );
      } catch {
        if (!mounted) return;
        setMembers([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const summary = useMemo(
    () => ({
      total: members.length,
      active: members.filter((member) => member.status === "ACTIVE").length,
      pending: members.filter((member) => member.status === "PENDING").length,
    }),
    [members]
  );

  const handleRemoveMember = async (memberId: string) => {
    try {
      await cooperativeMembersApi.removeCooperativeMember(memberId);
      setMembers((prev) => prev.filter((member) => member.id !== memberId));
      showToast("Member removed successfully", "success");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Unable to remove member", "error");
    }
  };

  const handleApproveMember = async (memberId: string) => {
    try {
      const updated = await cooperativeMembersApi.updateCooperativeMember(memberId, { status: "ACTIVE" });
      setMembers((prev) =>
        prev.map((member) =>
          member.id === memberId
            ? {
                ...member,
                status: updated.status || "ACTIVE",
                role: "Member",
              }
            : member
        )
      );
      showToast("Member approved successfully", "success");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Unable to approve member", "error");
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#f7f8fa] px-4 py-6 lg:px-8">
      <div className="mx-auto max-w-[1400px] space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-stone-900">Cooperative Members</h1>
            <p className="mt-1 text-sm text-stone-500">Accept new members and add approved members to the cooperative list.</p>
          </div>

          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">
            Live database members only
          </span>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <StatCard label="Total Members" value={summary.total} />
          <StatCard label="Active Members" value={summary.active} />
          <StatCard label="Pending Requests" value={summary.pending} />
        </div>

        {cooperative === null && !loading && (
          <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900 shadow-sm">
            This cooperative manager does not have a cooperative profile linked yet. Create the cooperative first, then members will appear here.
          </section>
        )}

        <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-stone-900">Pending Members</h2>
                <p className="text-xs text-stone-500">For {cooperative?.name || "your cooperative"}</p>
              </div>
              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700"></span>
            </div>

            <div className="space-y-3">
              {loading && <p className="text-sm text-stone-500">Loading pending requests...</p>}
              {!loading && members.filter((member) => member.status === "PENDING").length === 0 && (
                <p className="text-sm text-stone-500">No pending member records yet.</p>
              )}
              {members.filter((member) => member.status === "PENDING").map((member) => (
                <div key={member.id} className="rounded-2xl border border-stone-100 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="font-semibold text-stone-900">{member.name}</div>
                      <div className="text-sm text-stone-500">{member.phone} • {member.village}</div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => void handleApproveMember(member.id)}
                        className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white"
                      >
                        Approve
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
                onClick={() => void (async () => { showToast("Use the profile page to invite a farmer to join your cooperative.", "info"); })()}
                className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700"
              >
                + Add New Member
              </button>
            </div>

            <div className="space-y-3">
              {loading && <p className="text-sm text-stone-500">Loading members...</p>}
              {!loading && members.length === 0 && (
                <p className="text-sm text-stone-500">No member records yet for this cooperative.</p>
              )}
              {members.filter((member) => member.status !== "PENDING").map((member) => (
                <div key={member.id} className="rounded-2xl border border-stone-100 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="font-semibold text-stone-900">{member.name}</div>
                      <div className="text-sm text-stone-500">{member.phone} • {member.village}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">{member.role}</span>
                      <button
                        onClick={() => void handleRemoveMember(member.id)}
                        className="rounded-full border border-stone-200 px-3 py-1 text-xs font-semibold text-stone-700"
                      >
                        Remove
                      </button>
                    </div>
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