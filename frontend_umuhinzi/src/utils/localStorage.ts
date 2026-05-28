export type Application = {
  id: string;
  farmer: string;
  location: string;
  crop: string;
  amount: string;
  scoreLabel: string;
  scoreValue: string;
  date: string;
  status: string;
};

const APP_KEY = "umuhinzi_applications";

export function loadApplications(defaults: Application[]) {
  try {
    const raw = localStorage.getItem(APP_KEY);
    if (!raw) {
      localStorage.setItem(APP_KEY, JSON.stringify(defaults));
      return defaults;
    }
    return JSON.parse(raw) as Application[];
  } catch (e) {
    console.error("loadApplications", e);
    return defaults;
  }
}

export function saveApplications(apps: Application[]) {
  try {
    localStorage.setItem(APP_KEY, JSON.stringify(apps));
  } catch (e) {
    console.error("saveApplications", e);
  }
}

export function updateApplicationStatus(id: string, status: string) {
  const apps = loadApplications([]);
  const idx = apps.findIndex((a) => a.id === id);
  if (idx === -1) return null;
  apps[idx].status = status;
  saveApplications(apps);
  return apps[idx];
}

export function disburseApplication(id: string) {
  // mark as Disbursed
  return updateApplicationStatus(id, "Disbursed");
}

export function exportApplicationsCSV(apps: Application[]) {
  const header = ["id", "farmer", "location", "crop", "amount", "score", "date", "status"];
  const rows = apps.map((a) => [a.id, a.farmer, a.location, a.crop, a.amount, a.scoreValue, a.date, a.status]);
  const csv = [header, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
  return csv;
}
