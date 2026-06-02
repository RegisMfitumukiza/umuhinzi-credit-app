import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { forgotPasswordRequest } from "../api/auth";
import { useToast } from "../context/ToastContext";

export const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsSubmitting(true);
    try {
      await forgotPasswordRequest(email.trim());
      setSent(true);
    } catch {
      showToast("Failed to send reset email. Please check the address.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,#f0faf0_0%,#f8faf7_50%,#fff_100%)] p-6">
      <div className="w-full max-w-sm rounded-xl border border-stone-100 bg-white p-8 shadow-lg">
        <button onClick={() => navigate("/login")} className="mb-4 text-sm text-stone-500">
          ← Back to Login
        </button>

        <div className="flex flex-col items-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 text-xl">🔑</div>
          <h1 className="mt-4 text-xl font-semibold text-stone-900">Forgot Password</h1>
          <p className="mt-2 text-sm text-stone-600 text-center">
            Enter your email and we'll send you a reset link.
          </p>
        </div>

        {sent ? (
          <div className="mt-6 rounded-xl bg-emerald-50 p-4 text-center text-sm text-emerald-700">
            ✅ Reset link sent! Check your email inbox.
          </div>
        ) : (
          <form onSubmit={(e) => void handleSubmit(e)} className="mt-6">
            <label className="block text-sm font-medium text-stone-700">
              Email Address
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-2 w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm outline-none focus:border-emerald-400"
                placeholder="name@example.com"
              />
            </label>

            <button
              disabled={isSubmitting}
              className="mt-6 w-full rounded-full bg-emerald-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-600 disabled:opacity-70"
            >
              {isSubmitting ? "Sending..." : "Send Reset Link"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
