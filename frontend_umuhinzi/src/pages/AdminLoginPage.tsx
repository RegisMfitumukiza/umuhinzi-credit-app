import { useState } from "react";
import { useAuth } from "../context/AuthContext";

export const AdminLoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login, loading } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await login(email.trim(), password.trim());
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Invalid credentials.");
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-[#f7f8fa] px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-stone-900">Admin Login</h1>
        <p className="mt-2 text-sm text-stone-500">Sign in with your administrator account.</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="text-xs text-stone-500">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 w-full rounded-xl border border-stone-200 px-3 py-2 outline-none focus:border-emerald-400" placeholder="admin@umuhinzi.rw" />
          </div>
          <div>
            <label className="text-xs text-stone-500">Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 w-full rounded-xl border border-stone-200 px-3 py-2 outline-none focus:border-emerald-400" />
          </div>
          {error && <p className="text-sm text-rose-600">{error}</p>}
          <button type="submit" disabled={loading} className="w-full rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminLoginPage;
