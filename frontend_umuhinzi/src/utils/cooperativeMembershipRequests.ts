type CooperativeMembershipRequest = {
  userId: string;
  fullName: string;
  phone?: string | null;
  village?: string | null;
  cooperativeId: string;
  cooperativeName: string;
  requestedAt: string;
};

const REQUESTS_KEY = "umuhinzi_pending_cooperative_membership_requests";

const readJson = <T>(key: string, fallback: T): T => {
  const raw = localStorage.getItem(key);
  if (!raw) return fallback;

  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

const writeJson = (key: string, value: unknown) => {
  localStorage.setItem(key, JSON.stringify(value));
};

const notifyRequestsChanged = () => {
  window.dispatchEvent(new Event("umuhinzi:cooperative-membership-requests-changed"));
};

export const getPendingCooperativeMembershipRequests = (): CooperativeMembershipRequest[] => {
  return readJson<CooperativeMembershipRequest[]>(REQUESTS_KEY, []);
};

export const upsertPendingCooperativeMembershipRequest = (
  request: Omit<CooperativeMembershipRequest, "requestedAt">
) => {
  const existing = getPendingCooperativeMembershipRequests();
  const remaining = existing.filter((item) => item.userId !== request.userId || item.cooperativeId !== request.cooperativeId);

  writeJson(REQUESTS_KEY, [
    {
      ...request,
      requestedAt: new Date().toISOString(),
    },
    ...remaining,
  ]);
  notifyRequestsChanged();
};

export const removePendingCooperativeMembershipRequest = (userId: string, cooperativeId: string) => {
  const existing = getPendingCooperativeMembershipRequests();
  writeJson(
    REQUESTS_KEY,
    existing.filter((item) => item.userId !== userId || item.cooperativeId !== cooperativeId)
  );
  notifyRequestsChanged();
};

export type { CooperativeMembershipRequest };