import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { verifyEmailRequest } from "../api/auth";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { homeRouteByRole } from "../utils/auth";

export const RegisterVerifyPage = () => {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { token: authToken, user, setUser } = useAuth();
  const { showToast } = useToast();
  const [status, setStatus] = useState<"idle" | "verifying" | "success" | "error">("idle");
  const token = searchParams.get("token") || "";
  const stateEmail = (location.state as { email?: string } | null)?.email;
  const email = useMemo(() => stateEmail || user?.email || "your email address", [stateEmail, user?.email]);

  useEffect(() => {
    if (!token) return;

    let cancelled = false;
    setStatus("verifying");

    void verifyEmailRequest(token)
      .then((verifiedUser) => {
        if (cancelled) return;
        setUser(verifiedUser);
        setStatus("success");
        showToast("Email verified successfully", "success");
        window.setTimeout(() => {
          navigate(authToken ? homeRouteByRole(verifiedUser.role) : "/login", {
            replace: true,
            state: { email: verifiedUser.email },
          });
        }, 900);
      })
      .catch((error) => {
        if (cancelled) return;
        setStatus("error");
        showToast(error instanceof Error ? error.message : "Email verification failed", "error");
      });

    return () => {
      cancelled = true;
    };
  }, [authToken, navigate, setUser, showToast, token]);

  const title =
    status === "verifying"
      ? "Verifying your email"
      : status === "success"
        ? "Email verified"
        : status === "error"
          ? "Verification link expired"
          : "Verify your email";

  const message =
    status === "verifying"
      ? "Please wait while we confirm your verification link."
      : status === "success"
        ? authToken
          ? "Your email is verified. Taking you to your dashboard..."
          : "Your email is verified. Sign in to continue to your dashboard."
        : status === "error"
          ? "The verification link is invalid or expired. Please register again or contact support."
          : `We sent a verification link to ${email}. Open that email and click the link to continue to your account.`;

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,#f0faf0_0%,#f8faf7_50%,#fff_100%)] p-6">
      <div className="w-full max-w-md rounded-xl border border-stone-100 bg-white p-8 text-center shadow-lg">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-xl font-semibold text-emerald-600">
          @
        </div>
        <h1 className="mt-4 text-2xl font-semibold text-stone-900">{title}</h1>
        <p className="mt-3 text-sm leading-6 text-stone-600">{message}</p>

        {!token && (
          <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-left text-sm text-amber-800">
            You must verify your email before opening the farmer or cooperative manager dashboard.
          </div>
        )}

        <div className="mt-6 flex flex-col gap-3">
          {status === "error" && (
            <Link to="/register" className="rounded-full bg-emerald-500 px-6 py-3 text-sm font-semibold text-white">
              Register Again
            </Link>
          )}
          <Link to="/login" className="text-sm font-semibold text-emerald-600">
            Back to login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterVerifyPage;
