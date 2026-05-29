type PendingFarmerRequest = {
  userId: string;
  fullName: string;
  phone?: string | null;
  village?: string | null;
  requestedAt: string;
};

const PENDING_KEY = "umuhinzi_pending_farmer_requests";
const APPROVED_KEY = "umuhinzi_approved_farmer_ids";

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

export const getPendingFarmerRequests = (): PendingFarmerRequest[] => {
  return readJson<PendingFarmerRequest[]>(PENDING_KEY, []);
};

export const upsertPendingFarmerRequest = (request: Omit<PendingFarmerRequest, "requestedAt">) => {
  const existing = getPendingFarmerRequests();
  const withoutCurrent = existing.filter((item) => item.userId !== request.userId);

  writeJson(PENDING_KEY, [
    {
      ...request,
      requestedAt: new Date().toISOString(),
    },
    ...withoutCurrent,
  ]);
};

export const removePendingFarmerRequest = (userId: string) => {
  const existing = getPendingFarmerRequests();
  writeJson(
    PENDING_KEY,
    existing.filter((item) => item.userId !== userId)
  );
};

export const getApprovedFarmerIds = (): string[] => {
  return readJson<string[]>(APPROVED_KEY, []);
};

export const markFarmerApproved = (userId: string) => {
  const approved = new Set(getApprovedFarmerIds());
  approved.add(userId);
  writeJson(APPROVED_KEY, Array.from(approved));
  removePendingFarmerRequest(userId);
};

export const markFarmerDeclined = (userId: string) => {
  const approved = getApprovedFarmerIds().filter((id) => id !== userId);
  writeJson(APPROVED_KEY, approved);
  removePendingFarmerRequest(userId);
};

export const isFarmerFrontendApproved = (userId?: string) => {
  if (!userId) return false;
  return getApprovedFarmerIds().includes(userId);
};
