import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { verifyEmailRequest, resendVerificationRequest } from "../api/auth";
import { useToast } from "../context/ToastContext";
import axios from "axios";

export const VerifyEmailPage = () => {
  const [status, setStatus] = useState<"verifying" | "success" | "already" | "error">("verifying");
  const [errorMessage, setErrorMessage] = useState("The link is invalid or has expired.");
  const [email, setEmail] = useState(() => {
    // pre-fill from localStorage if available
    const stored = localStorage.getItem("umuhinzi_verify_email") ?? "";
    return stored;
  });
  const [isResending, setIsResending] = useState(false);
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";

  useEffect(() => {
    if (!token) {
      setErrorMessage("No verification token found in the link.");
      setStatus("error");
      return;
    }

    let cancelled = false;

    verifyEmailRequest(token)
      .then(() => {
        if (cancelled) return;
        localStorage.removeItem("umuhinzi_verify_email");
        setStatus("success");
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const message = axios.isAxiosError(err)
          ? (err.response?.data?.message as string | undefined) ?? ""
          : "";

        // If already verified or token was already used → treat as success
        if (
          message.toLowerCase().includes("already verified") ||
          message.toLowerCase().includes("invalid or expired")
        ) {
          setStatus("already");
          return;
        }

        setErrorMessage(message || "The link is invalid or has expired.");
        setStatus("error");
      });

    return () => { cancelled = true; };
  }, [token]);

  const handleResend = async () => {
    if (!email.trim()) {
      showToast("Enter your email address to resend.", "error");
      return;
    }

    setIsResending(true);
    try {
      await resendVerificationRequest(email.trim());
      localStorage.setItem("umuhinzi_verify_email", email.trim());
      showToast("New verification email sent! Check your inbox.", "success");
    } catch (err: unknown) {
      const message = axios.isAxiosError(err)
        ? (err.response?.data?.message as string | undefined) ?? "Failed to resend. Please try again."
        : "Failed to resend. Please try again.";
      showToast(message, "error");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,#f0faf0_0%,#f8faf7_50%,#fff_100%)] p-6">
      <div className="w-full max-w-sm rounded-xl border border-stone-100 bg-white p-8 shadow-lg text-center">

        {status === "verifying" && (
          <>
            <div className="flex h-12 w-12 mx-auto items-center justify-center rounded-full bg-stone-100 text-xl">⏳</div>
            <h1 className="mt-4 text-xl font-semibold text-stone-900">Verifying your email...</h1>
            <p className="mt-2 text-sm text-stone-500">Please wait a moment.</p>
          </>
        )}

        {status === "already" && (
          <>
            <div className="flex h-12 w-12 mx-auto items-center justify-center rounded-full bg-emerald-50 text-emerald-600 text-2xl">✅</div>
            <h1 className="mt-4 text-xl font-semibold text-stone-900">Already Verified!</h1>
            <p className="mt-2 text-sm text-stone-600">
              Your email is already verified. You can log in now.
            </p>
            <button
              onClick={() => navigate("/login")}
              className="mt-6 w-full rounded-full bg-emerald-500 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-600"
            >
              Go to Login
            </button>
          </>
        )}

        {status === "success" && (
          <>
            <div className="flex h-12 w-12 mx-auto items-center justify-center rounded-full bg-emerald-50 text-emerald-600 text-2xl">✅</div>
            <h1 className="mt-4 text-xl font-semibold text-stone-900">Email Verified!</h1>
            <p className="mt-2 text-sm text-stone-600">
              Your account is now active. You can log in.
            </p>
            <button
              onClick={() => navigate("/login")}
              className="mt-6 w-full rounded-full bg-emerald-500 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-600"
            >
              Go to Login
            </button>
          </>
        )}

        {status === "error" && (
          <>
            <div className="flex h-12 w-12 mx-auto items-center justify-center rounded-full bg-red-50 text-red-500 text-2xl">❌</div>
            <h1 className="mt-4 text-xl font-semibold text-stone-900">Verification Failed</h1>
            <p className="mt-2 text-sm text-stone-600">{errorMessage}</p>
            <p className="mt-1 text-xs text-stone-400">
              Enter your email below to receive a fresh verification link.
            </p>

            <div className="mt-6 space-y-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm outline-none focus:border-emerald-400"
                placeholder="your@email.com"
              />
              <button
                onClick={() => void handleResend()}
                disabled={isResending}
                className="w-full rounded-full bg-emerald-500 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-600 disabled:opacity-70"
              >
                {isResending ? "Sending..." : "Resend Verification Email"}
              </button>

              <button
                onClick={() => navigate("/login")}
                className="w-full rounded-full border border-stone-200 px-6 py-3 text-sm font-medium text-stone-600 hover:bg-stone-50"
              >
                Back to Login
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default VerifyEmailPage;
