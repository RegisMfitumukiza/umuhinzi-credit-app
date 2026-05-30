import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/http";
import { useToast } from "../context/ToastContext";

export const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/auth/forgot-password", { email });
      setSent(true);
    } catch {
      showToast("Something went wrong. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f8faf7_0%,#eef5ef_100%)] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-full bg-brand-500 flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-lg font-black">U</span>
          </div>
          <h1 className="text-2xl font-black text-stone-900 tracking-tight">Reset password</h1>
          <p className="text-stone-500 text-sm mt-1">We'll send a reset link to your email</p>
        </div>

        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-8">
          {!sent ? (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-stone-700">Email address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                  className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-2 w-full py-3 bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white font-semibold rounded-full transition-colors text-sm"
              >
                {loading ? "Sending…" : "Send reset link"}
              </button>
            </form>
          ) : (
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="w-16 h-16 rounded-full bg-brand-50 flex items-center justify-center">
                <svg className="w-8 h-8 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                </svg>
              </div>
              <h2 className="font-bold text-stone-900 text-lg">Check your email</h2>
              <p className="text-sm text-stone-500 text-center leading-relaxed">
                If an account exists for <strong className="text-stone-700">{email}</strong>, we sent a password reset link. It expires in 15 minutes.
              </p>
              <p className="text-xs text-stone-400 text-center">Don't see it? Check your spam folder.</p>
              <button
                onClick={() => navigate("/login")}
                className="mt-2 w-full py-3 bg-brand-500 hover:bg-brand-600 text-white font-semibold rounded-full transition-colors text-sm"
              >
                Back to sign in
              </button>
            </div>
          )}
        </div>

        {!sent && (
          <p className="text-center text-sm text-stone-500 mt-6">
            Remember your password?{" "}
            <button
              onClick={() => navigate("/login")}
              className="text-brand-600 font-semibold hover:underline"
            >
              Sign in
            </button>
          </p>
        )}
      </div>
    </div>
  );
};
