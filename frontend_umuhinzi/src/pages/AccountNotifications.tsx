import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/http";
import { useAuth } from "../context/AuthContext";

const navItems = [
  { label: "Dashboard", path: "/" },
  { label: "Applications", path: "/applications" },
  { label: "Risk Analytics", path: "/risk-analytics" },
  { label: "Cooperatives", path: "/cooperatives" },
  { label: "Regional Map", path: "/cooperatives/regional-map" },
  { label: "Reports", path: "/cooperatives/reports" },
];

type Notification = {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
};

type UserProfile = {
  fullName: string;
  email: string;
  phone: string;
  province: string;
  district: string;
  profileImageUrl?: string;
  role?: string;
};

export default function AccountNotifications() {
  const [activeTab, setActiveTab] = useState("Profile");
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [profile, setProfile] = useState<UserProfile>({ fullName: "", email: "", phone: "", province: "", district: "" });
  const [formData, setFormData] = useState<UserProfile>({ fullName: "", email: "", phone: "", province: "", district: "" });
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [pwForm, setPwForm] = useState({ current: "", next: "", confirm: "" });
  const [pwStatus, setPwStatus] = useState("");
  const [pwError, setPwError] = useState("");
  const avatarRef = useRef<HTMLInputElement>(null);
  const tabs = ["Profile", "Security", "Permissions"];
  const navigate = useNavigate();
  const { logout } = useAuth();

  useEffect(() => {
    api.get("/v1/users/me").then((res) => {
      const u = res.data.data;
      const p = { fullName: u.fullName ?? "", email: u.email ?? "", phone: u.phone ?? "", province: u.province ?? "", district: u.district ?? "", profileImageUrl: u.profileImageUrl, role: u.role };
      setProfile(p);
      setFormData(p);
    }).catch(() => {});

    api.get("/v1/notifications").then((res) => {
      setNotifications(res.data.data ?? []);
    }).catch(() => {});
  }, []);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleMarkAllRead = async () => {
    await api.patch("/v1/notifications/read-all").catch(() => {});
    setNotifications(notifications.map((n) => ({ ...n, isRead: true })));
  };

  const handleNotificationClick = async (n: Notification) => {
    if (!n.isRead) {
      await api.patch(`/v1/notifications/${n.id}/read`).catch(() => {});
      setNotifications(notifications.map((item) => item.id === n.id ? { ...item, isRead: true } : item));
    }
  };

  const handleSave = async () => {
    setSaveError("");
    try {
      await api.patch("/v1/users/me", {
        fullName: formData.fullName,
        phone: formData.phone,
        province: formData.province,
        district: formData.district,
      });
      setProfile(formData);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err: any) {
      setSaveError(err?.response?.data?.message ?? "Failed to save profile.");
    }
  };

  const handleReset = () => setFormData(profile);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("avatar", file);
    try {
      const res = await api.patch("/v1/users/me/avatar", fd, { headers: { "Content-Type": "multipart/form-data" } });
      setProfile((p) => ({ ...p, profileImageUrl: res.data.data.profileImageUrl }));
      setFormData((p) => ({ ...p, profileImageUrl: res.data.data.profileImageUrl }));
    } catch {}
  };

  const handleUpdatePassword = async () => {
    setPwError("");
    setPwStatus("");
    if (!pwForm.next || !pwForm.confirm) { setPwError("All fields are required."); return; }
    if (pwForm.next !== pwForm.confirm) { setPwError("Passwords do not match."); return; }
    try {
      // Backend change-password-while-authenticated: send forgot-password email flow
      // Since there's no direct change-password endpoint, we trigger forgot-password
      await api.post("/v1/auth/forgot-password", { email: profile.email });
      setPwStatus("A password reset link has been sent to your email.");
      setPwForm({ current: "", next: "", confirm: "" });
    } catch (err: any) {
      setPwError(err?.response?.data?.message ?? "Failed to send reset email.");
    }
  };

  const initials = profile.fullName ? profile.fullName.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase() : "?";

  return (
    <div className="flex h-screen bg-gray-50 font-sans">
      <aside className="w-52 bg-white border-r border-gray-100 flex flex-col py-6 px-4 shrink-0">
        <div className="flex items-center gap-2 mb-8 px-2">
          <div className="w-7 h-7 bg-green-500 rounded-md flex items-center justify-center text-white text-xs font-bold">U</div>
          <span className="font-bold text-gray-800 text-sm">Umuhinzi Credit</span>
        </div>
        <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider px-2 mb-3">Main Menu</p>
        <nav className="flex flex-col gap-1 flex-1">
          {navItems.map((item) => (
            <button key={item.label} onClick={() => navigate(item.path)} className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-left transition-colors text-gray-500 hover:bg-gray-50 hover:text-gray-800">{item.label}</button>
          ))}
        </nav>
        <div className="flex flex-col gap-1 border-t border-gray-100 pt-4 mt-4">
          <button onClick={() => navigate("/account")} className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm bg-green-50 text-green-700 font-medium">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
            Notifications
          </button>
          <button onClick={() => navigate("/settings")} className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-500 hover:bg-gray-50">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            Settings
          </button>
          <button onClick={logout} className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-red-500 hover:bg-red-50">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            Logout
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto flex flex-col">
        <div className="bg-white border-b border-gray-100 px-8 py-3 flex items-center justify-between sticky top-0 z-10">
          <input type="text" placeholder="Search farmers, loans, or IDs..." className="text-sm bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 w-72 focus:outline-none focus:ring-2 focus:ring-green-300" />
          <div className="flex items-center gap-4">
            <button onClick={() => navigate("/account")} className="relative text-gray-500 hover:text-gray-700 px-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
              {unreadCount > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">{unreadCount}</span>}
            </button>
            <div className="flex items-center gap-2">
              <div className="text-right"><p className="text-sm font-semibold text-gray-800">{profile.fullName || "—"}</p><p className="text-xs text-gray-400">{profile.role ?? "User"}</p></div>
              {profile.profileImageUrl
                ? <img src={profile.profileImageUrl} className="w-9 h-9 rounded-full object-cover" alt="avatar" />
                : <div className="w-9 h-9 bg-green-600 rounded-full flex items-center justify-center text-white font-bold text-sm">{initials}</div>}
            </div>
          </div>
        </div>
        <div className="px-8 py-6 flex-1">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Account & Notifications</h1>
              <p className="text-sm text-gray-500 mt-1">Manage your professional profile, system preferences, and stay updated with real-time operational alerts from the field.</p>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => navigate("/settings")} className="flex items-center gap-2 border border-gray-200 text-gray-700 text-sm px-4 py-2 rounded-lg hover:bg-gray-50 transition">Email Preferences</button>
              <button onClick={handleSave} className={`flex items-center gap-2 text-sm px-4 py-2 rounded-lg transition ${saved ? "bg-green-700 text-white" : "bg-green-500 hover:bg-green-600 text-white"}`}>{saved ? "Saved!" : "Save All Changes"}</button>
            </div>
          </div>
          {saveError && <p className="text-xs text-red-500 mb-4">{saveError}</p>}
          <div className="flex gap-6">
            <div className="w-80 shrink-0">
              <div className="bg-white rounded-xl border border-gray-100 p-4">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="font-semibold text-gray-800">Activity Feed</h2>
                  <button onClick={handleMarkAllRead} className="text-xs text-green-600 hover:underline">Mark all read</button>
                </div>
                <p className="text-xs text-gray-400 mb-4">{unreadCount > 0 ? `You have ${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}` : "All caught up!"}</p>
                <div className="flex flex-col gap-3">
                  {notifications.length === 0 && <p className="text-xs text-gray-400 text-center py-4">No notifications yet.</p>}
                  {notifications.map((n) => (
                    <div key={n.id} className={`flex gap-3 p-3 rounded-lg border-l-2 relative cursor-pointer ${n.type === "SUCCESS" ? "border-green-400 bg-green-50" : n.type === "WARNING" || n.type === "ERROR" ? "border-red-400 bg-red-50" : "border-gray-200 bg-gray-50"}`} onClick={() => handleNotificationClick(n)}>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-xs font-semibold leading-tight ${n.type === "WARNING" || n.type === "ERROR" ? "text-red-600" : "text-gray-800"}`}>{n.title}</p>
                          <span className="text-xs text-gray-400 whitespace-nowrap shrink-0">{new Date(n.createdAt).toLocaleDateString()}</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1 leading-snug line-clamp-2">{n.message}</p>
                      </div>
                      {!n.isRead && <span className="absolute top-3 right-3 w-2 h-2 bg-green-500 rounded-full"></span>}
                    </div>
                  ))}
                </div>
                <div className="mt-4 p-3 bg-green-50 border border-green-100 rounded-lg">
                  <p className="text-xs font-semibold text-gray-700 mb-1">Security Status</p>
                  <p className="text-xs text-gray-500">Your account is protected. Last login recorded in system.</p>
                </div>
              </div>
            </div>
            <div className="flex-1 bg-white rounded-xl border border-gray-100 p-6">
              <div className="flex gap-1 border-b border-gray-100 mb-6">
                {tabs.map((tab) => (
                  <button key={tab} onClick={() => setActiveTab(tab)} className={`px-5 py-2 text-sm font-medium transition-colors ${activeTab === tab ? "border-b-2 border-green-500 text-green-600" : "text-gray-500 hover:text-gray-700"}`}>{tab}</button>
                ))}
              </div>
              {activeTab === "Profile" && (
                <div>
                  <h3 className="text-base font-semibold text-gray-800 mb-1">Personal Information</h3>
                  <p className="text-sm text-gray-400 mb-6">Update your contact details and professional role information.</p>
                  <div className="flex items-center gap-4 mb-6">
                    <div className="relative">
                      {formData.profileImageUrl
                        ? <img src={formData.profileImageUrl} className="w-16 h-16 rounded-full object-cover" alt="avatar" />
                        : <div className="w-16 h-16 bg-green-700 rounded-full flex items-center justify-center text-white text-xl font-bold">{initials}</div>}
                      <button onClick={() => avatarRef.current?.click()} className="absolute bottom-0 right-0 w-5 h-5 bg-green-500 rounded-full text-white text-xs flex items-center justify-center border-2 border-white">+</button>
                      <input ref={avatarRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div><label className="text-xs font-medium text-gray-600 mb-1 block">Full Name</label><input value={formData.fullName} onChange={(e) => setFormData({ ...formData, fullName: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-300" /></div>
                    <div><label className="text-xs font-medium text-gray-600 mb-1 block">Role</label><input value={formData.role ?? ""} readOnly className="w-full border border-gray-100 bg-gray-50 rounded-lg px-3 py-2 text-sm text-gray-400 cursor-not-allowed" /></div>
                    <div><label className="text-xs font-medium text-gray-600 mb-1 block">Work Email</label><input value={formData.email} readOnly className="w-full border border-gray-100 bg-gray-50 rounded-lg px-3 py-2 text-sm text-gray-400 cursor-not-allowed" /></div>
                    <div><label className="text-xs font-medium text-gray-600 mb-1 block">Phone Number</label><input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-300" /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div><label className="text-xs font-medium text-gray-600 mb-1 block">Province</label><input value={formData.province} onChange={(e) => setFormData({ ...formData, province: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-300" /></div>
                    <div><label className="text-xs font-medium text-gray-600 mb-1 block">District</label><input value={formData.district} onChange={(e) => setFormData({ ...formData, district: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-300" /></div>
                  </div>
                  <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
                    <button onClick={handleReset} className="px-5 py-2 text-sm border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition">Reset</button>
                    <button onClick={handleSave} className={`px-5 py-2 text-sm rounded-lg transition ${saved ? "bg-green-700 text-white" : "bg-green-500 hover:bg-green-600 text-white"}`}>{saved ? "Saved!" : "Update Profile"}</button>
                  </div>
                </div>
              )}
              {activeTab === "Security" && (
                <div>
                  <h3 className="text-base font-semibold text-gray-800 mb-1">Security Settings</h3>
                  <p className="text-sm text-gray-400 mb-6">Request a password reset link to be sent to your email.</p>
                  <div className="flex flex-col gap-4">
                    <div><label className="text-xs font-medium text-gray-600 mb-1 block">New Password</label><input type="password" placeholder="Enter new password" value={pwForm.next} onChange={(e) => setPwForm({ ...pwForm, next: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-300" /></div>
                    <div><label className="text-xs font-medium text-gray-600 mb-1 block">Confirm New Password</label><input type="password" placeholder="Confirm new password" value={pwForm.confirm} onChange={(e) => setPwForm({ ...pwForm, confirm: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-300" /></div>
                    {pwError && <p className="text-xs text-red-500">{pwError}</p>}
                    {pwStatus && <p className="text-xs text-green-600">{pwStatus}</p>}
                    <div className="flex justify-end border-t border-gray-100 pt-4"><button onClick={handleUpdatePassword} className="px-5 py-2 text-sm bg-green-500 hover:bg-green-600 text-white rounded-lg transition">Send Reset Link</button></div>
                  </div>
                </div>
              )}
              {activeTab === "Permissions" && (
                <div>
                  <h3 className="text-base font-semibold text-gray-800 mb-1">Permissions</h3>
                  <p className="text-sm text-gray-400 mb-6">View your access rights and role permissions.</p>
                  <div className="flex flex-col gap-3">
                    {["View Farmer Profiles", "Approve Loan Applications", "Access Risk Analytics", "Export Reports", "Manage Cooperatives"].map((perm) => (
                      <div key={perm} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                        <span className="text-sm text-gray-700">{perm}</span>
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">Allowed</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="px-8 py-4 border-t border-gray-100">
          <p className="text-xs text-gray-400 text-center">© 2026 Umuhinzi Credit. All Rights Reserved. Built for Financial Inclusion in Rwanda.</p>
        </div>
      </main>
    </div>
  );
}
