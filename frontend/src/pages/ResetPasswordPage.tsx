import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../api/http";
import { useToast } from "../context/ToastContext";

export const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      showToast("Passwords do not match.", "error");
      return;
    }
    if (!token) {
      showToast("Invalid reset link.", "error");
      return;
    }
    setLoading(true);
    try {
      await api.post("/auth/reset-password", { token, password, confirmPassword });
      setDone(true);
    } catch (err: unknown) {
      const msg =
        err &&
        typeof err === "object" &&
        "response" in err &&
        (err as { response?: { data?: { message?: string } } }).response?.data?.message
          ? (err as { response: { data: { message: string } } }).response.data.message
          : "Reset failed. The link may have expired.";
      showToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-[linear-gradient(180deg,#f8faf7_0%,#eef5ef_100%)] flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-10 w-full max-w-sm text-center">
          <p className="text-stone-500 text-sm">Invalid or missing reset token.</p>
          <button
            onClick={() => navigate("/forgot-password")}
            className="mt-4 text-brand-600 font-semibold text-sm hover:underline"
          >
            Request a new link
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f8faf7_0%,#eef5ef_100%)] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-full bg-brand-500 flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-lg font-black">U</span>
          </div>
          <h1 className="text-2xl font-black text-stone-900 tracking-tight">Set new password</h1>
          <p className="text-stone-500 text-sm mt-1">Choose a strong password for your account</p>
        </div>

        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-8">
          {!done ? (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-stone-700">New password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  placeholder="••••••••"
                  className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-all"
                />
                <p className="text-xs text-stone-400">Min 8 characters, must include uppercase, lowercase and a number</p>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-stone-700">Confirm password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-2 w-full py-3 bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white font-semibold rounded-full transition-colors text-sm"
              >
                {loading ? "Saving…" : "Reset password"}
              </button>
            </form>
          ) : (
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="w-16 h-16 rounded-full bg-brand-50 flex items-center justify-center">
                <svg className="w-8 h-8 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </div>
              <h2 className="font-bold text-stone-900 text-lg">Password updated!</h2>
              <p className="text-sm text-stone-500 text-center">Your password has been reset. You can now sign in with your new password.</p>
              <button
                onClick={() => navigate("/login")}
                className="mt-2 w-full py-3 bg-brand-500 hover:bg-brand-600 text-white font-semibold rounded-full transition-colors text-sm"
              >
                Sign in
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
