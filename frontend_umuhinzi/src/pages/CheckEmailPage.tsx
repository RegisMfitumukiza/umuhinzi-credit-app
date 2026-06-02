import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { resendVerificationRequest } from "../api/auth";
import { useToast } from "../context/ToastContext";

export const CheckEmailPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const email = (location.state as { email?: string })?.email ?? "";
  const [isResending, setIsResending] = useState(false);

  const handleResend = async () => {
    if (!email) return;
    setIsResending(true);
    try {
      await resendVerificationRequest(email);
      showToast("Verification email resent! Check your inbox.", "success");
    } catch {
      showToast("Failed to resend. Please try again later.", "error");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,#f0faf0_0%,#f8faf7_50%,#fff_100%)] p-6">
      <div className="w-full max-w-sm rounded-xl border border-stone-100 bg-white p-8 shadow-lg text-center">
        <div className="flex h-14 w-14 mx-auto items-center justify-center rounded-full bg-emerald-50 text-3xl">
          📧
        </div>

        <h1 className="mt-4 text-xl font-semibold text-stone-900">Check your email</h1>

        <p className="mt-2 text-sm text-stone-600">We sent a verification link to</p>
        {email && <p className="mt-1 font-semibold text-stone-900">{email}</p>}

        <div className="mt-4 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
          ⚠️ You must verify your email before you can log in. Open your Gmail and click the verification link.
        </div>

        <div className="mt-6 space-y-3">
          <button
            onClick={() => void handleResend()}
            disabled={isResending || !email}
            className="w-full rounded-full border border-emerald-500 px-6 py-3 text-sm font-semibold text-emerald-600 hover:bg-emerald-50 disabled:opacity-50"
          >
            {isResending ? "Sending..." : "Resend verification email"}
          </button>

          <button
            onClick={() => navigate("/login")}
            className="w-full rounded-full border border-stone-200 px-6 py-3 text-sm font-medium text-stone-500 hover:bg-stone-50"
          >
            Already verified? Go to Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default CheckEmailPage;
