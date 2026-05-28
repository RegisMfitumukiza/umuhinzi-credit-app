import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/http";
import { useAuth } from "../context/AuthContext";

export const RegisterPersonalPage = () => {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const role = (() => {
    try { return JSON.parse(localStorage.getItem("umuhinzi_registration") || "{}").role ?? "FARMER"; } catch { return "FARMER"; }
  })();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!fullName.trim() || !email.trim() || !password.trim()) {
      setError("Full name, email and password are required.");
      return;
    }
    setLoading(true);
    try {
      const res = await api.post("/v1/auth/register", {
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim() || undefined,
        password,
        role,
      });
      const { user, accessToken, refreshToken } = res.data.data;
      localStorage.setItem("umuhinzi_token", accessToken);
      localStorage.setItem("umuhinzi_refresh_token", refreshToken);
      localStorage.setItem("umuhinzi_user", JSON.stringify(user));
      setUser(user);
      localStorage.removeItem("umuhinzi_registration");
      navigate("/register/verify");
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-10">
      <div className="w-full max-w-2xl rounded-3xl border border-stone-200 bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.06)] sm:p-8">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-stone-900">Personal Info</h2>
          <p className="mt-2 text-sm text-stone-500">Provide basic account details.</p>
        </div>

        {error && <p className="mt-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">{error}</p>}

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <label className="block">
            <span className="text-sm font-medium text-stone-900">Full name</span>
            <input value={fullName} onChange={(e) => setFullName(e.target.value)} className="mt-2 w-full rounded-2xl border border-stone-200 px-4 py-3 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100" />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-stone-900">Email</span>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-2 w-full rounded-2xl border border-stone-200 px-4 py-3 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100" />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-stone-900">Phone <span className="text-stone-400">(optional)</span></span>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+250788..." className="mt-2 w-full rounded-2xl border border-stone-200 px-4 py-3 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100" />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-stone-900">Password</span>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-2 w-full rounded-2xl border border-stone-200 px-4 py-3 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100" />
            <p className="mt-1 text-xs text-stone-400">Min 8 chars, uppercase, lowercase, number & special character.</p>
          </label>

          <div className="flex justify-between pt-2">
            <button type="button" onClick={() => navigate("/register")} className="text-sm text-stone-500 hover:underline">← Back</button>
            <button type="submit" disabled={loading} className="rounded-full bg-emerald-500 px-6 py-3 text-sm font-semibold text-white disabled:opacity-60 hover:bg-emerald-600 transition">
              {loading ? "Registering..." : "Next →"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
