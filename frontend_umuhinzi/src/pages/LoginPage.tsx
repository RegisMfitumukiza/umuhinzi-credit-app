import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login, loading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email.trim() || !password.trim()) {
      setError("Enter your email and password.");
      return;
    }
    try {
      await login(email.trim(), password.trim());
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Invalid email or password.");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,#f0faf0_0%,#f8faf7_50%,#fff_100%)] p-6">
      <form onSubmit={handleSubmit} className="w-full max-w-sm rounded-xl border border-stone-100 bg-white p-8 shadow-lg">
        <div className="flex flex-col items-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500 text-white text-xl">🌱</div>
          <h1 className="mt-4 text-2xl font-semibold text-stone-900">Welcome Back</h1>
          <p className="mt-2 text-sm text-stone-600 text-center">Access your farm dashboard and financial services.</p>
        </div>

        {error && <p className="mt-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">{error}</p>}

        <label className="mt-6 block text-sm font-medium text-stone-700">
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-2 w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm outline-none focus:border-emerald-400"
            placeholder="name@example.com"
          />
        </label>

        <label className="mt-4 block text-sm font-medium text-stone-700">
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-2 w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm outline-none focus:border-emerald-400"
            placeholder="Enter your password"
          />
        </label>

        <div className="mt-3 flex justify-end">
          <button type="button" onClick={() => navigate("/forgot-password")} className="text-sm text-emerald-600 hover:underline">
            Forgot password?
          </button>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-6 w-full rounded-full bg-emerald-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-600 disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {loading ? "Signing in..." : <>Login to Dashboard <span aria-hidden>→</span></>}
        </button>

        <div className="my-4 flex items-center">
          <div className="h-px flex-1 bg-stone-200" />
          <div className="mx-3 text-xs text-stone-400">OR</div>
          <div className="h-px flex-1 bg-stone-200" />
        </div>

        <p className="text-center text-sm text-stone-600">
          New to Umuhinzi Credit?{" "}
          <button type="button" onClick={() => navigate("/register")} className="font-semibold text-emerald-500 hover:underline">
            Create an account
          </button>
        </p>
      </form>
    </div>
  );
};
