import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/http";
import { useAuth } from "../context/AuthContext";

export const RegisterVerifyPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resent, setResent] = useState(false);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!token.trim()) { setError("Enter the verification token from your email."); return; }
    setLoading(true);
    try {
      await api.post("/v1/auth/verify-email", { token: token.trim() });
      // redirect based on role
      const role = user?.role ?? "FARMER";
      const redirectMap: Record<string, string> = {
        ADMIN: "/admin",
        COOPERATIVE_MANAGER: "/cooperatives",
        INSTITUTION: "/finance",
        GOVERNMENT_PARTNER: "/government",
        FARMER: "/farms",
      };
      navigate(redirectMap[role] ?? "/farms");
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Invalid or expired token.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!user?.email) return;
    try {
      await api.post("/v1/auth/forgot-password", { email: user.email });
      setResent(true);
    } catch {}
  };

  const handleSkip = () => {
    const role = user?.role ?? "FARMER";
    const redirectMap: Record<string, string> = {
      ADMIN: "/admin", COOPERATIVE_MANAGER: "/cooperatives",
      INSTITUTION: "/finance", GOVERNMENT_PARTNER: "/government", FARMER: "/farms",
    };
    navigate(redirectMap[role] ?? "/farms");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,#f0faf0_0%,#f8faf7_50%,#fff_100%)] p-6">
      <div className="w-full max-w-md rounded-xl border border-stone-100 bg-white p-8 shadow-lg">
        <div className="flex flex-col items-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 text-xl">📧</div>
          <h2 className="mt-4 text-xl font-semibold text-stone-900">Verify Your Email</h2>
          <p className="mt-2 text-sm text-stone-600 text-center">
            We sent a verification link to <span className="font-medium text-stone-900">{user?.email ?? "your email"}</span>. Paste the token from the link below.
          </p>
        </div>

        {error && <p className="mt-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">{error}</p>}
        {resent && <p className="mt-4 rounded-lg bg-green-50 px-4 py-2 text-sm text-green-600">Verification email resent!</p>}

        <form onSubmit={handleVerify} className="mt-6 space-y-4">
          <input
            value={token}
            onChange={(e) => setToken(e.target.value)}
            className="w-full rounded-2xl border border-stone-200 px-4 py-3 text-sm outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
            placeholder="Paste verification token here"
          />
          <button type="submit" disabled={loading} className="w-full rounded-full bg-emerald-500 px-6 py-3 text-sm font-semibold text-white disabled:opacity-60 hover:bg-emerald-600 transition">
            {loading ? "Verifying..." : "Verify & Continue"}
          </button>
        </form>

        <div className="mt-4 flex flex-col items-center gap-2 text-sm text-stone-500">
          <button onClick={handleResend} className="text-emerald-600 hover:underline">Resend verification email</button>
          <button onClick={handleSkip} className="text-stone-400 hover:underline">Skip for now →</button>
        </div>
      </div>
    </div>
  );
};

export default RegisterVerifyPage;
