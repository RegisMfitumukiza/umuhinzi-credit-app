import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { resetPasswordRequest } from "../api/auth";
import { useToast } from "../context/ToastContext";

export const ResetPasswordPage = () => {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      showToast("Invalid or missing reset token.", "error");
      return;
    }

    if (password.length < 8) {
      showToast("Password must be at least 8 characters.", "error");
      return;
    }

    if (password !== confirm) {
      showToast("Passwords do not match.", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      await resetPasswordRequest(token, password, confirm);
      showToast("Password reset successful. Please log in.", "success");
      navigate("/login");
    } catch {
      showToast("Reset failed. The link may have expired.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,#f0faf0_0%,#f8faf7_50%,#fff_100%)] p-6">
      <div className="w-full max-w-sm rounded-xl border border-stone-100 bg-white p-8 shadow-lg">
        <div className="flex flex-col items-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 text-xl">🔒</div>
          <h1 className="mt-4 text-xl font-semibold text-stone-900">Reset Password</h1>
          <p className="mt-2 text-sm text-stone-600 text-center">Enter your new password below.</p>
        </div>

        <form onSubmit={(e) => void handleSubmit(e)} className="mt-6 space-y-4">
          <label className="block text-sm font-medium text-stone-700">
            New Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-2 w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm outline-none focus:border-emerald-400"
              placeholder="At least 8 characters"
            />
          </label>

          <label className="block text-sm font-medium text-stone-700">
            Confirm Password
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="mt-2 w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm outline-none focus:border-emerald-400"
              placeholder="Repeat your password"
            />
          </label>

          <button
            disabled={isSubmitting}
            className="w-full rounded-full bg-emerald-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-600 disabled:opacity-70"
          >
            {isSubmitting ? "Resetting..." : "Reset Password"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
