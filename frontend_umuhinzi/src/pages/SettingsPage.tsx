import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/http";
import { useAuth } from "../context/AuthContext";

const Section = ({ title, description, children }: { title: string; description: string; children: React.ReactNode }) => (
  <div className="bg-white rounded-xl border border-gray-100 p-6">
    <h3 className="text-base font-semibold text-gray-800 mb-1">{title}</h3>
    <p className="text-sm text-gray-400 mb-5">{description}</p>
    {children}
  </div>
);

const Toggle = ({ label, sub, checked, onChange }: { label: string; sub: string; checked: boolean; onChange: () => void }) => (
  <div className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
    <div>
      <p className="text-sm font-medium text-gray-700">{label}</p>
      <p className="text-xs text-gray-400">{sub}</p>
    </div>
    <button onClick={onChange} className={`relative w-10 h-5 rounded-full transition-colors ${checked ? "bg-green-500" : "bg-gray-200"}`}>
      <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${checked ? "translate-x-5" : "translate-x-0.5"}`} />
    </button>
  </div>
);

export const SettingsPage = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const [notifs, setNotifs] = useState({ loanUpdates: true, repaymentReminders: true, creditScoreAlerts: true, systemAnnouncements: false });
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [resetStatus, setResetStatus] = useState("");
  const [resetError, setResetError] = useState("");
  const [resetting, setResetting] = useState(false);

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== "DELETE") { setDeleteError('Type "DELETE" to confirm.'); return; }
    setDeleting(true);
    setDeleteError("");
    try {
      await api.delete("/v1/users/me");
      await logout();
    } catch (err: any) {
      setDeleteError(err?.response?.data?.message ?? "Failed to delete account.");
    } finally {
      setDeleting(false);
    }
  };

  const handleResendVerification = async () => {
    setResetting(true);
    setResetStatus("");
    setResetError("");
    try {
      await api.post("/v1/auth/forgot-password", {});
      setResetStatus("Verification email sent. Check your inbox.");
    } catch (err: any) {
      setResetError(err?.response?.data?.message ?? "Failed to send email.");
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900">Settings</h2>
        <p className="mt-1 text-sm text-gray-500">Manage your notification preferences and account settings.</p>
      </div>

      <Section title="Notification Preferences" description="Choose which alerts you want to receive by email.">
        <Toggle label="Loan Updates" sub="Get notified when your loan application status changes." checked={notifs.loanUpdates} onChange={() => setNotifs((p) => ({ ...p, loanUpdates: !p.loanUpdates }))} />
        <Toggle label="Repayment Reminders" sub="Receive reminders before upcoming repayment due dates." checked={notifs.repaymentReminders} onChange={() => setNotifs((p) => ({ ...p, repaymentReminders: !p.repaymentReminders }))} />
        <Toggle label="Credit Score Alerts" sub="Be notified when your credit score changes significantly." checked={notifs.creditScoreAlerts} onChange={() => setNotifs((p) => ({ ...p, creditScoreAlerts: !p.creditScoreAlerts }))} />
        <Toggle label="System Announcements" sub="Platform updates, maintenance notices, and new features." checked={notifs.systemAnnouncements} onChange={() => setNotifs((p) => ({ ...p, systemAnnouncements: !p.systemAnnouncements }))} />
      </Section>

      <Section title="Account" description="Manage your profile and password from the account page.">
        <div className="flex flex-col gap-3">
          <button onClick={() => navigate("/account")} className="w-full text-left px-4 py-3 rounded-lg border border-gray-200 text-sm text-gray-700 hover:bg-gray-50 transition flex items-center justify-between">
            <span>Edit Profile & Notifications</span>
            <span className="text-gray-400">→</span>
          </button>
          <div>
            <button onClick={handleResendVerification} disabled={resetting} className="w-full text-left px-4 py-3 rounded-lg border border-gray-200 text-sm text-gray-700 hover:bg-gray-50 transition flex items-center justify-between disabled:opacity-60">
              <span>{resetting ? "Sending..." : "Send Password Reset Email"}</span>
              <span className="text-gray-400">→</span>
            </button>
            {resetStatus && <p className="text-xs text-green-600 mt-1 px-1">{resetStatus}</p>}
            {resetError && <p className="text-xs text-red-500 mt-1 px-1">{resetError}</p>}
          </div>
        </div>
      </Section>

      <Section title="Danger Zone" description="Irreversible actions. Please proceed with caution.">
        <div className="rounded-lg border border-red-100 bg-red-50 p-4">
          <p className="text-sm font-medium text-red-700 mb-3">Delete Account</p>
          <p className="text-xs text-red-500 mb-3">This will permanently delete your account and all associated data. This action cannot be undone.</p>
          <input
            value={deleteConfirm}
            onChange={(e) => { setDeleteConfirm(e.target.value); setDeleteError(""); }}
            placeholder='Type "DELETE" to confirm'
            className="w-full border border-red-200 rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-red-300 bg-white"
          />
          {deleteError && <p className="text-xs text-red-500 mb-2">{deleteError}</p>}
          <button onClick={handleDeleteAccount} disabled={deleting} className="px-4 py-2 text-sm bg-red-500 hover:bg-red-600 text-white rounded-lg transition disabled:opacity-60">
            {deleting ? "Deleting..." : "Delete My Account"}
          </button>
        </div>
      </Section>

      <div className="text-xs text-gray-400 text-center pb-4">© 2026 Umuhinzi Credit. All Rights Reserved.</div>
    </div>
  );
};
