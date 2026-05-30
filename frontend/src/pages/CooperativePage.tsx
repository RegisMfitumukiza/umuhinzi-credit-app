import { useEffect, useState } from "react";
import { api } from "../api/http";
import { useToast } from "../context/ToastContext";

interface Cooperative {
  id: string;
  name: string;
  registrationNumber: string | null;
  description: string | null;
  email: string | null;
  phone: string | null;
  province: string | null;
  district: string | null;
  status: string;
  _count?: { members: number; managers: number };
}

interface Membership {
  id: string;
  cooperativeId: string;
  status: string;
  joinedAt: string;
}

const STATUS_BADGE: Record<string, string> = {
  ACTIVE: "bg-emerald-100 text-emerald-700",
  PENDING: "bg-yellow-100 text-yellow-700",
  SUSPENDED: "bg-red-100 text-red-700",
  DEACTIVATED: "bg-stone-100 text-stone-500",
};

export const CooperativePage = () => {
  const { showToast } = useToast();
  const [cooperatives, setCooperatives] = useState<Cooperative[]>([]);
  const [loading, setLoading] = useState(true);
  const [membership, setMembership] = useState<Membership | null>(null);
  const [joining, setJoining] = useState<string | null>(null);
  const [leaving, setLeaving] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);

  useEffect(() => {
    api
      .get("/cooperatives?limit=50")
      .then((r) => {
        const d = r.data.data;
        setCooperatives(Array.isArray(d) ? d : (d?.cooperatives ?? []));
      })
      .finally(() => setLoading(false));
  }, []);

  const handleJoin = async (cooperativeId: string) => {
    setJoining(cooperativeId);
    try {
      const { data } = await api.post("/cooperative-members", { cooperativeId });
      setMembership(data.data as Membership);
      showToast("You joined the cooperative!", "success");
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Failed to join.";
      showToast(msg, "error");
    } finally {
      setJoining(null);
    }
  };

  const handleLeave = async () => {
    if (!membership) return;
    setLeaving(true);
    try {
      await api.delete(`/cooperative-members/${membership.id}`);
      setMembership(null);
      setConfirmLeave(false);
      showToast("You left the cooperative.", "success");
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Failed to leave.";
      showToast(msg, "error");
    } finally {
      setLeaving(false);
    }
  };

  const currentCoop = membership
    ? cooperatives.find((c) => c.id === membership.cooperativeId) ?? null
    : null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black text-stone-900 tracking-tight">Cooperatives</h1>
        <p className="text-stone-500 text-sm mt-0.5">Browse and join agricultural cooperatives</p>
      </div>

      {/* Active membership banner */}
      {membership && currentCoop && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wide mb-0.5">
              Current membership
            </p>
            <p className="font-bold text-stone-900">{currentCoop.name}</p>
            {(currentCoop.district || currentCoop.province) && (
              <p className="text-xs text-stone-500 mt-0.5">
                {[currentCoop.district, currentCoop.province].filter(Boolean).join(", ")}
              </p>
            )}
          </div>
          <div className="flex-shrink-0">
            {confirmLeave ? (
              <div className="flex gap-2">
                <button
                  onClick={() => setConfirmLeave(false)}
                  className="px-3 py-1.5 bg-white border border-stone-200 text-stone-600 text-xs font-semibold rounded-full transition-colors hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleLeave}
                  disabled={leaving}
                  className="px-3 py-1.5 bg-red-500 hover:bg-red-600 disabled:opacity-60 text-white text-xs font-semibold rounded-full transition-colors"
                >
                  {leaving ? "Leaving…" : "Confirm Leave"}
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmLeave(true)}
                className="px-3 py-1.5 bg-white border border-red-200 hover:bg-red-50 text-red-600 text-xs font-semibold rounded-full transition-colors"
              >
                Leave
              </button>
            )}
          </div>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-brand-500 border-t-transparent" />
        </div>
      ) : cooperatives.length === 0 ? (
        <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center shadow-sm">
          <p className="text-stone-400 font-medium">No cooperatives found.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {cooperatives.map((coop) => {
            const isMine = membership?.cooperativeId === coop.id;
            const canJoin = coop.status === "ACTIVE" && !membership;

            return (
              <div
                key={coop.id}
                className={`bg-white rounded-2xl border shadow-sm p-5 space-y-3 ${
                  isMine ? "border-emerald-300" : "border-stone-200"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-bold text-stone-900 truncate">{coop.name}</p>
                    {coop.registrationNumber && (
                      <p className="text-xs text-stone-400 mt-0.5">
                        Reg: {coop.registrationNumber}
                      </p>
                    )}
                  </div>
                  <span
                    className={`text-xs font-bold px-2.5 py-0.5 rounded-full flex-shrink-0 ${
                      STATUS_BADGE[coop.status] ?? "bg-stone-100 text-stone-600"
                    }`}
                  >
                    {coop.status}
                  </span>
                </div>

                {coop.description && (
                  <p className="text-sm text-stone-500 line-clamp-2">{coop.description}</p>
                )}

                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-stone-400">
                  {(coop.district || coop.province) && (
                    <span>{[coop.district, coop.province].filter(Boolean).join(", ")}</span>
                  )}
                  {coop._count != null && (
                    <span>
                      {coop._count.members} member
                      {coop._count.members !== 1 ? "s" : ""}
                    </span>
                  )}
                  {coop.phone && <span>{coop.phone}</span>}
                </div>

                {canJoin && (
                  <button
                    onClick={() => handleJoin(coop.id)}
                    disabled={joining !== null}
                    className="w-full py-2 bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white text-sm font-semibold rounded-full transition-colors"
                  >
                    {joining === coop.id ? "Joining…" : "Join"}
                  </button>
                )}

                {isMine && (
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-3.5 h-3.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    Your cooperative
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
