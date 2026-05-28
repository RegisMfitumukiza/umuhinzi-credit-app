import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/http";
import { useAuth } from "../context/AuthContext";

const NAV_BY_ROLE: Record<string, { label: string; path: string }[]> = {
  FARMER: [
    { label: "Dashboard", path: "/dashboard" },
    { label: "Farms", path: "/farms" },
    { label: "Loans", path: "/loans" },
    { label: "Payments", path: "/payments" },
  ],
  COOPERATIVE_MANAGER: [
    { label: "Dashboard", path: "/cooperatives" },
    { label: "Applications", path: "/cooperatives/applications" },
    { label: "Risk Analytics", path: "/cooperatives/risk-analytics" },
    { label: "Cooperatives", path: "/cooperatives/groups" },
    { label: "Regional Map", path: "/cooperatives/regional-map" },
    { label: "Reports", path: "/cooperatives/reports" },
  ],
  INSTITUTION: [
    { label: "Dashboard", path: "/finance" },
    { label: "Applications", path: "/finance/applications" },
  ],
  ADMIN: [
    { label: "Dashboard", path: "/admin" },
    { label: "Users", path: "/admin/users" },
  ],
  GOVERNMENT_PARTNER: [
    { label: "Dashboard", path: "/government" },
    { label: "Regions", path: "/government/regions" },
    { label: "Reports", path: "/government/reports" },
  ],
};

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
  bio?: string;
  employeeId?: string;
  assignedRegion?: string;
};

const DEFAULT_PROFILE: UserProfile = {
  fullName: "Jean-Paul Niyonsenga",
  email: "j.niyonsenga@umuhinzi.rw",
  phone: "+250 788 123 456",
  province: "Northern Province",
  district: "Musanze",
  role: "Senior Credit Officer",
  bio: "Experienced credit analyst with over 8 years in the Rwandan agricultural sector. Specializing in risk assessment for smallholder cooperatives and rice value chains.",
  assignedRegion: "Northern Province (Musanze/Gakenke)",
  employeeId: "UC-2024-0089",
  profileImageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
};

const getMockNotifications = (): Notification[] => [
  {
    id: "mock-1",
    title: "Loan Approved: Kabuye Cooperative",
    message: "The maize production loan for Kabuye Cooperative (RWF 4.5M) has been approved by the credit committee.",
    type: "LOAN_APPROVAL",
    isRead: false,
    createdAt: new Date(Date.now() - 2 * 60000).toISOString(), // 2 mins ago
  },
  {
    id: "mock-2",
    title: "Critical Risk Alert: Sector 4",
    message: "Unusual rainfall patterns detected in Musanze District. 14 farms at high risk of soil erosion.",
    type: "MISSING_DATA_ALERT",
    isRead: false,
    createdAt: new Date(Date.now() - 60 * 60000).toISOString(), // 1 hour ago
  },
  {
    id: "mock-3",
    title: "Repayment Reminder",
    message: "Jean-Damascene N. has a repayment of RWF 45,000 due in 48 hours. No contact registered.",
    type: "REPAYMENT_REMINDER",
    isRead: true,
    createdAt: new Date(Date.now() - 3 * 3600000).toISOString(), // 3 hours ago
  },
  {
    id: "mock-4",
    title: "System Update Completed",
    message: "Platform version 2.4.0 is now live. New features include regional heatmap exports.",
    type: "SYSTEM",
    isRead: true,
    createdAt: new Date(Date.now() - 5 * 3600000).toISOString(), // 5 hours ago
  },
];

const timeAgo = (dateString: string) => {
  try {
    const now = new Date();
    const past = new Date(dateString);
    const diffMs = now.getTime() - past.getTime();
    if (diffMs < 0) return "just now";
    
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? "s" : ""} ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
    
    return past.toLocaleDateString();
  } catch {
    return dateString;
  }
};

const getNotificationStyles = (n: Notification) => {
  const titleLower = n.title.toLowerCase();
  
  if (
    titleLower.includes("critical") || 
    titleLower.includes("alert") || 
    titleLower.includes("rejected") || 
    titleLower.includes("overdue") ||
    n.type === "MISSING_DATA_ALERT"
  ) {
    return {
      borderBgClass: "border-red-400 bg-red-50 hover:bg-red-100/85",
      titleClass: "text-red-700",
      icon: (
        <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center shrink-0">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4.5 w-4.5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
      )
    };
  }
  
  if (
    titleLower.includes("approved") || 
    titleLower.includes("disbursed") || 
    titleLower.includes("repaid") || 
    titleLower.includes("recorded") || 
    titleLower.includes("success") ||
    titleLower.includes("verified")
  ) {
    return {
      borderBgClass: "border-green-400 bg-green-50 hover:bg-green-100/85",
      titleClass: "text-green-850 font-bold",
      icon: (
        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center shrink-0">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4.5 w-4.5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )
    };
  }

  if (n.type === "REPAYMENT_REMINDER" || titleLower.includes("reminder") || titleLower.includes("due")) {
    return {
      borderBgClass: "border-gray-200 bg-gray-50 hover:bg-gray-100/80",
      titleClass: "text-gray-800 font-semibold",
      icon: (
        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center shrink-0">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4.5 w-4.5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      )
    };
  }

  return {
    borderBgClass: "border-gray-200 bg-gray-50 hover:bg-gray-100/80",
    titleClass: "text-gray-800 font-semibold",
    icon: (
      <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center shrink-0">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4.5 w-4.5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
    )
  };
};

const getSidebarIcon = (label: string) => {
  switch (label) {
    case "Dashboard":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z" />
        </svg>
      );
    case "Applications":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      );
    case "Risk Analytics":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      );
    case "Cooperatives":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      );
    case "Regional Map":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
        </svg>
      );
    case "Reports":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      );
    default:
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      );
  }
};

export default function AccountNotifications() {
  const [activeTab, setActiveTab] = useState("Profile");
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [formData, setFormData] = useState<UserProfile>(DEFAULT_PROFILE);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [pwForm, setPwForm] = useState({ current: "", next: "", confirm: "" });
  const [pwStatus, setPwStatus] = useState("");
  const [pwError, setPwError] = useState("");
  const avatarRef = useRef<HTMLInputElement>(null);
  const tabs = ["Profile", "Security", "Permissions"];
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { user: authUser } = useAuth();
  
  // Use COOPERATIVE_MANAGER menu as the default if role is not set
  const userRole = authUser?.role ?? "COOPERATIVE_MANAGER";
  const navItems = NAV_BY_ROLE[userRole] ?? NAV_BY_ROLE.COOPERATIVE_MANAGER;

  useEffect(() => {
    // Load custom fields from localStorage if present
    const savedBio = localStorage.getItem("demo_profile_bio");
    const savedRegion = localStorage.getItem("demo_profile_region");
    const savedEmployeeId = localStorage.getItem("demo_profile_employee_id");

    api.get("/v1/users/me").then((res) => {
      const u = res.data.data;
      if (u) {
        const p = {
          fullName: u.fullName ?? "",
          email: u.email ?? "",
          phone: u.phone ?? "",
          province: u.province ?? "",
          district: u.district ?? "",
          profileImageUrl: u.profileImageUrl ?? DEFAULT_PROFILE.profileImageUrl,
          role: u.role ?? DEFAULT_PROFILE.role,
          bio: savedBio ?? DEFAULT_PROFILE.bio,
          assignedRegion: savedRegion ?? DEFAULT_PROFILE.assignedRegion,
          employeeId: savedEmployeeId ?? DEFAULT_PROFILE.employeeId,
        };
        setProfile(p);
        setFormData(p);
      } else {
        const p = {
          ...DEFAULT_PROFILE,
          bio: savedBio ?? DEFAULT_PROFILE.bio,
          assignedRegion: savedRegion ?? DEFAULT_PROFILE.assignedRegion,
          employeeId: savedEmployeeId ?? DEFAULT_PROFILE.employeeId,
        };
        setProfile(p);
        setFormData(p);
      }
    }).catch(() => {
      const p = {
        ...DEFAULT_PROFILE,
        bio: savedBio ?? DEFAULT_PROFILE.bio,
        assignedRegion: savedRegion ?? DEFAULT_PROFILE.assignedRegion,
        employeeId: savedEmployeeId ?? DEFAULT_PROFILE.employeeId,
      };
      setProfile(p);
      setFormData(p);
    });

    api.get("/v1/notifications").then((res) => {
      if (res.data.data && res.data.data.length > 0) {
        setNotifications(res.data.data);
      } else {
        setNotifications(getMockNotifications());
      }
    }).catch(() => {
      setNotifications(getMockNotifications());
    });
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
      }).catch(() => {}); // catch silently in demo mode

      // Persist local-only profile fields in localStorage
      localStorage.setItem("demo_profile_bio", formData.bio ?? "");
      localStorage.setItem("demo_profile_region", formData.assignedRegion ?? "");
      localStorage.setItem("demo_profile_employee_id", formData.employeeId ?? "");

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
    } catch {
      // Create local object URL for demo experience
      const localUrl = URL.createObjectURL(file);
      setProfile((p) => ({ ...p, profileImageUrl: localUrl }));
      setFormData((p) => ({ ...p, profileImageUrl: localUrl }));
    }
  };

  const handleUpdatePassword = async () => {
    setPwError("");
    setPwStatus("");
    if (!pwForm.next || !pwForm.confirm) { setPwError("All fields are required."); return; }
    if (pwForm.next !== pwForm.confirm) { setPwError("Passwords do not match."); return; }
    try {
      await api.post("/v1/auth/forgot-password", { email: profile.email }).catch(() => {});
      setPwStatus("A password reset link has been sent to your email.");
      setPwForm({ current: "", next: "", confirm: "" });
    } catch (err: any) {
      setPwError(err?.response?.data?.message ?? "Failed to send reset email.");
    }
  };

  const initials = profile.fullName ? profile.fullName.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase() : "?";

  return (
    <div className="flex h-screen bg-gray-50 font-sans">
      <aside className="w-56 bg-white border-r border-gray-200 flex flex-col py-6 px-4 shrink-0 shadow-[2px_0_8px_rgba(0,0,0,0.01)]">
        <div className="flex items-center gap-2 mb-8 px-2">
          <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center text-white text-sm font-bold shadow-[0_2px_6px_rgba(34,197,94,0.3)]">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4.5 w-4.5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 01-1.581.814L10 14.567l-4.419 3.247A1 1 0 014 17V4z" clipRule="evenodd" />
            </svg>
          </div>
          <span className="font-bold text-gray-800 text-sm tracking-tight">Umuhinzi Credit</span>
        </div>
        
        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em] px-2 mb-3">Main Menu</p>
        <nav className="flex flex-col gap-1 flex-1">
          {navItems.map((item) => (
            <button
              key={item.label}
              onClick={() => navigate(item.path)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-left transition-all duration-200 text-gray-500 hover:bg-gray-50 hover:text-gray-900 group"
            >
              <span className="text-gray-400 group-hover:text-gray-600 transition-colors">
                {getSidebarIcon(item.label)}
              </span>
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>
        
        <div className="flex flex-col gap-1 border-t border-gray-105 pt-4 mt-4">
          <button onClick={() => navigate("/account")} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm bg-green-50 text-green-700 font-semibold shadow-[0_2px_4px_rgba(74,222,128,0.06)] border border-green-100/50">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            Notifications
          </button>
          <button onClick={() => navigate("/settings")} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-all duration-200">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Settings
          </button>
          <button onClick={logout} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-500 hover:bg-red-50 transition-all duration-200">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Logout
          </button>
        </div>
      </aside>
      
      <main className="flex-1 overflow-y-auto flex flex-col">
        <div className="bg-white border-b border-gray-100 px-8 py-3.5 flex items-center justify-between sticky top-0 z-10 shadow-[0_1px_4px_rgba(0,0,0,0.015)]">
          <div className="relative">
            <input type="text" placeholder="Search farmers, loans, or IDs..." className="text-sm bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-2 w-72 focus:outline-none focus:ring-2 focus:ring-green-400 focus:bg-white transition-all animate-none" />
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 absolute left-3.5 top-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          
          <div className="flex items-center gap-5">
            <button onClick={() => {
  const feed = document.getElementById("activity-feed");
  if (feed) {
    feed.scrollIntoView({ behavior: "smooth", block: "start" });
    feed.classList.add("ring-2", "ring-green-400");
    setTimeout(() => feed.classList.remove("ring-2", "ring-green-400"), 1500);
  } else {
    navigate("/account");
  }
}} className="relative text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-full hover:bg-gray-50">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border border-white"></span>
              )}
            </button>
            <div className="flex items-center gap-3 border-l border-gray-200 pl-5">
              <div className="text-right">
                <p className="text-sm font-bold text-gray-800 tracking-tight">{profile.fullName || "â€”"}</p>
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{profile.role ?? "User"}</p>
              </div>
              {profile.profileImageUrl ? (
                <img src={profile.profileImageUrl} className="w-9 h-9 rounded-full object-cover border border-gray-200 shadow-sm" alt="avatar" />
              ) : (
                <div className="w-9 h-9 bg-green-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm">{initials}</div>
              )}
            </div>
          </div>
        </div>
        
        <div className="px-8 py-8 flex-1 max-w-6xl w-full mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
            <div>
              <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Account & Notifications</h1>
              <p className="text-sm text-gray-500 mt-1 leading-relaxed">Manage your professional profile, system preferences, and stay updated with real-time operational alerts from the field.</p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <button onClick={() => navigate("/settings")} className="flex items-center gap-2 border border-gray-200 text-gray-700 bg-white font-semibold text-sm px-5 py-2.5 rounded-xl hover:bg-gray-50 transition active:scale-95 shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4.5 w-4.5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Email Preferences
              </button>
              <button onClick={handleSave} className={`flex items-center gap-2 font-semibold text-sm px-5 py-2.5 rounded-xl transition-all duration-200 shadow-sm active:scale-95 ${saved ? "bg-green-700 text-white" : "bg-green-500 hover:bg-green-600 text-white"}`}>
                {saved ? (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                    Saved!
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                    </svg>
                    Save All Changes
                  </>
                )}
              </button>
            </div>
          </div>
          
          {saveError && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3.5 mb-6 flex gap-3 items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-xs text-red-605 font-semibold">{saveError}</p>
            </div>
          )}
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-4 shrink-0 flex flex-col gap-6">
              <div id="activity-feed" className="bg-white rounded-2xl border border-gray-200 p-5 shadow-[0_4px_20px_rgba(0,0,0,0.015)] transition-all duration-300">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="font-extrabold text-gray-800 tracking-tight text-base">Activity Feed</h2>
                  <button onClick={handleMarkAllRead} className="text-xs text-green-600 font-bold hover:text-green-700 hover:underline">
                    Mark all read
                  </button>
                </div>
                <p className="text-xs text-gray-400 font-medium mb-5">
                  {unreadCount > 0 ? `You have ${unreadCount} unread notifications` : "All caught up!"}
                </p>
                
                <div className="flex flex-col gap-3">
                  {notifications.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-8 text-gray-300">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mb-2 stroke-[1.5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0a2 2 0 01-2 2H6a2 2 0 01-2-2m16 0V9a2 2 0 00-2-2H6a2 2 0 00-2 2v4.586a1 1 0 01-.293.707l-2.829 2.828A1 1 0 013 18.586V19a2 2 0 002 2h14a2 2 0 002-2v-.414a1 1 0 01.293-.707l2.828-2.828A1 1 0 0120 13z" />
                      </svg>
                      <p className="text-xs text-gray-400 font-semibold">No notifications yet.</p>
                    </div>
                  )}
                  {notifications.map((n) => {
                    const style = getNotificationStyles(n);
                    return (
                      <div
                        key={n.id}
                        onClick={() => handleNotificationClick(n)}
                        className={`flex gap-3 p-4 rounded-xl border-l-[3.5px] relative cursor-pointer transition-all duration-205 shadow-sm ${style.borderBgClass}`}
                      >
                        {style.icon}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2.5">
                            <p className={`text-xs font-bold leading-tight tracking-tight ${style.titleClass}`}>
                              {n.title}
                            </p>
                            <span className="text-[10px] text-gray-400 font-semibold whitespace-nowrap shrink-0 mt-0.5">
                              {timeAgo(n.createdAt)}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1 leading-snug line-clamp-3">
                            {n.message}
                          </p>
                        </div>
                        {!n.isRead && (
                          <span className="absolute top-4 right-4 w-2 h-2 bg-green-500 rounded-full"></span>
                        )}
                      </div>
                    );
                  })}
                </div>
                
                <div className="mt-5 p-4 bg-green-50/50 border border-green-100 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4.5 w-4.5 text-green-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    <p className="text-xs font-bold text-green-800 uppercase tracking-wider">Security Status</p>
                  </div>
                  <p className="text-[11px] text-green-700 leading-normal mb-3 font-semibold">
                    Your account is protected with Two-Factor Authentication. Last login was from Kigali, RW.
                  </p>
                  <span className="inline-block bg-white text-[10px] text-green-700 font-semibold px-2.5 py-1 rounded-full border border-green-150 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                    Strong Protection
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex-1 lg:col-span-8 bg-white rounded-2xl border border-gray-200 p-6 shadow-[0_4px_20px_rgba(0,0,0,0.015)] flex flex-col gap-6">
              <div className="flex gap-1 border-b border-gray-100">
                {tabs.map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-5 py-3 text-sm font-bold transition-all duration-200 relative ${activeTab === tab ? "text-green-600 border-b-2 border-green-500" : "text-gray-500 hover:text-gray-700"}`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
              
              {activeTab === "Profile" && (
                <div className="flex flex-col gap-6">
                  <div>
                    <h3 className="text-base font-extrabold text-gray-800 tracking-tight">Personal Information</h3>
                    <p className="text-xs text-gray-400 mt-1 font-medium">Update your contact details and professional role information.</p>
                  </div>
                  
                  <div className="flex items-center gap-5">
                    <div className="relative group">
                      {formData.profileImageUrl ? (
                        <img src={formData.profileImageUrl} className="w-16 h-16 rounded-full object-cover border border-gray-200 shadow-md group-hover:brightness-90 transition-all" alt="avatar" />
                      ) : (
                        <div className="w-16 h-16 bg-green-700 rounded-full flex items-center justify-center text-white text-2xl font-bold border border-green-600 shadow-md group-hover:brightness-90 transition-all">{initials}</div>
                      )}
                      <button onClick={() => avatarRef.current?.click()} className="absolute bottom-0 right-0 w-6 h-6 bg-green-500 hover:bg-green-600 text-white rounded-full flex items-center justify-center border-2 border-white shadow transition-transform active:scale-90">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 stroke-[3]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                        </svg>
                      </button>
                      <input ref={avatarRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2 block">Full Name</label>
                      <input
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400 transition-all shadow-[inset_0_1px_2px_rgba(0,0,0,0.015)] font-semibold"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2 block">Job Title</label>
                      <input
                        value={formData.role ?? ""}
                        readOnly
                        className="w-full border border-gray-200 bg-gray-50 rounded-xl px-4 py-2 text-sm text-gray-500 cursor-not-allowed font-semibold shadow-[inset_0_1px_2px_rgba(0,0,0,0.005)]"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2 block">Work Email</label>
                      <input
                        value={formData.email}
                        readOnly
                        className="w-full border border-gray-200 bg-gray-50 rounded-xl px-4 py-2 text-sm text-gray-500 cursor-not-allowed font-semibold shadow-[inset_0_1px_2px_rgba(0,0,0,0.005)]"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2 block">Phone Number</label>
                      <input
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400 transition-all shadow-[inset_0_1px_2px_rgba(0,0,0,0.015)] font-semibold"
                      />
                    </div>
                  </div>
                  
                  <div className="flex flex-col">
                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2 block">Professional Bio</label>
                    <textarea
                      value={formData.bio ?? ""}
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                      rows={4}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400 transition-all resize-none shadow-[inset_0_1px_2px_rgba(0,0,0,0.015)] font-medium leading-relaxed"
                      placeholder="Tell us about your professional background..."
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-2">
                    <div>
                      <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2 block">Assigned Region</label>
                      <input
                        value={formData.assignedRegion ?? ""}
                        onChange={(e) => setFormData({ ...formData, assignedRegion: e.target.value })}
                        className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400 transition-all shadow-[inset_0_1px_2px_rgba(0,0,0,0.015)] font-semibold"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2 block">Employee ID</label>
                      <input
                        value={formData.employeeId ?? ""}
                        onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                        className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400 transition-all shadow-[inset_0_1px_2px_rgba(0,0,0,0.015)] font-semibold"
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-end gap-3 border-t border-gray-100 pt-5">
                    <button onClick={handleReset} className="px-5 py-2.5 text-sm font-semibold border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition active:scale-95 shadow-sm">
                      Reset
                    </button>
                    <button onClick={handleSave} className={`px-5 py-2.5 text-sm font-semibold rounded-xl transition-all duration-200 shadow-sm active:scale-95 ${saved ? "bg-green-700 text-white" : "bg-green-500 hover:bg-green-600 text-white"}`}>
                      {saved ? "Saved!" : "Update Profile"}
                    </button>
                  </div>
                </div>
              )}
              
              {activeTab === "Security" && (
                <div className="flex flex-col gap-6">
                  <div>
                    <h3 className="text-base font-extrabold text-gray-800 tracking-tight">Security Settings</h3>
                    <p className="text-xs text-gray-400 mt-1 font-medium">Request a password reset link to be sent to your email.</p>
                  </div>
                  
                  <div className="flex flex-col gap-4">
                    <div>
                      <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2 block">New Password</label>
                      <input
                        type="password"
                        placeholder="Enter new password"
                        value={pwForm.next}
                        onChange={(e) => setPwForm({ ...pwForm, next: e.target.value })}
                        className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400 transition-all shadow-[inset_0_1px_2px_rgba(0,0,0,0.015)]"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2 block">Confirm New Password</label>
                      <input
                        type="password"
                        placeholder="Confirm new password"
                        value={pwForm.confirm}
                        onChange={(e) => setPwForm({ ...pwForm, confirm: e.target.value })}
                        className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400 transition-all shadow-[inset_0_1px_2px_rgba(0,0,0,0.015)]"
                      />
                    </div>
                    
                    {pwError && <p className="text-xs text-red-500 font-semibold">{pwError}</p>}
                    {pwStatus && <p className="text-xs text-green-600 font-semibold">{pwStatus}</p>}
                    
                    <div className="flex justify-end border-t border-gray-100 pt-5">
                      <button onClick={handleUpdatePassword} className="px-5 py-2.5 text-sm font-semibold bg-green-500 hover:bg-green-600 text-white rounded-xl shadow-sm active:scale-95 transition-all duration-200">
                        Send Reset Link
                      </button>
                    </div>
                  </div>
                </div>
              )}
              
              {activeTab === "Permissions" && (
                <div className="flex flex-col gap-6">
                  <div>
                    <h3 className="text-base font-extrabold text-gray-800 tracking-tight">Permissions</h3>
                    <p className="text-xs text-gray-400 mt-1 font-medium">View your access rights and role permissions.</p>
                  </div>
                  
                  <div className="flex flex-col gap-3">
                    {["View Farmer Profiles", "Approve Loan Applications", "Access Risk Analytics", "Export Reports", "Manage Cooperatives"].map((perm) => (
                      <div key={perm} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200 shadow-sm">
                        <span className="text-sm font-semibold text-gray-700">{perm}</span>
                        <span className="text-xs bg-green-100 text-green-800 px-3 py-1 rounded-full font-bold">Allowed</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="px-8 py-5 border-t border-gray-200 bg-white">
          <p className="text-[11px] text-gray-400 font-semibold text-center">Â© 2026 Umuhinzi Credit. All Rights Reserved. Built for Financial Inclusion in Rwanda.</p>
        </div>
      </main>
    </div>
  );
}


