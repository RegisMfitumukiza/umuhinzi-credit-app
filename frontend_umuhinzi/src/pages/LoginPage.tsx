import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { loginRequest } from "../api/auth";
import { homeRouteByRole, needsEmailVerification } from "../utils/auth";

export const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const autoLoginTriggered = useRef(false);
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const routeState = (location.state || {}) as { email?: string; password?: string; autoLogin?: boolean };
    const cached = JSON.parse(localStorage.getItem("umuhinzi_post_register_login") || "null") as { email?: string; password?: string; autoLogin?: boolean } | null;
    const nextEmail = routeState.email || cached?.email;
    const nextPassword = routeState.password || cached?.password;
    const shouldAutoLogin = Boolean(routeState.autoLogin || cached?.autoLogin);

    if (nextEmail) setEmail(nextEmail);
    if (nextPassword) setPassword(nextPassword);

    if (shouldAutoLogin && nextEmail && nextPassword && !autoLoginTriggered.current) {
      autoLoginTriggered.current = true;
      window.setTimeout(() => {
        void performLogin(nextEmail, nextPassword);
        localStorage.removeItem("umuhinzi_post_register_login");
      }, 0);
    }
  }, [location.state]);

  const performLogin = async (loginEmail: string, loginPassword: string) => {
    if (!loginEmail.trim() || !loginPassword.trim()) {
      showToast("Enter your email and password", "error");
      return;
    }

    setIsSubmitting(true);

    try {
      const session = await loginRequest({
        email: loginEmail.trim(),
        password: loginPassword.trim(),
      });

      login(session);
      if (session.refreshToken) {
        localStorage.setItem("umuhinzi_refresh_token", session.refreshToken);
      }

      showToast("Welcome back", "success");
      navigate(needsEmailVerification(session.user) ? "/verify-email" : homeRouteByRole(session.user.role), {
        state: { email: session.user.email },
      });
    } catch {
      showToast("Login failed. Check your credentials and account status.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    void performLogin(email, password);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,#f0faf0_0%,#f8faf7_50%,#fff_100%)] p-6">
      <form onSubmit={handleSubmit} className="w-full max-w-sm rounded-xl border border-stone-100 bg-white p-8 shadow-lg">
        <div className="flex flex-col items-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500 text-white text-xl">🌱</div>
          <h1 className="mt-4 text-2xl font-semibold text-stone-900">Welcome Back</h1>
          <p className="mt-2 text-sm text-stone-600 text-center">Sign in to access your account.</p>
        </div>

        <label className="mt-6 block text-sm font-medium text-stone-700">
          Email or Phone Number
          <input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm outline-none focus:border-emerald-400"
            placeholder="e.g. name@farm.com or +250..."
          />
        </label>

        <label className="mt-4 block text-sm font-medium text-stone-700">
          Password
          <div className="mt-2 relative">
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm outline-none focus:border-emerald-400"
              placeholder="Enter your password"
            />
            <button type="button" onClick={() => {}} className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-emerald-600">Forgot password?</button>
          </div>
        </label>

        <div className="mt-3 flex items-center justify-between text-sm text-stone-600">
          <label className="inline-flex items-center gap-2">
            <input type="checkbox" className="h-4 w-4 rounded border-stone-300 text-emerald-500" />
            <span>Remember me</span>
          </label>
          <div>Need help?</div>
        </div>

        <button
          disabled={isSubmitting}
          className="mt-6 w-full rounded-full bg-emerald-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-600 disabled:opacity-70 flex items-center justify-center gap-2"
        >
          {isSubmitting ? "Signing in..." : "Login"} <span aria-hidden>→</span>
        </button>

        <div className="my-4 flex items-center">
          <div className="h-px flex-1 bg-stone-200" />
          <div className="mx-3 text-xs text-stone-400">OR</div>
          <div className="h-px flex-1 bg-stone-200" />
        </div>

        <p className="text-center text-sm text-stone-600">New to Umuhinzi Credit? <a href="/register" className="font-semibold text-emerald-500">Create an account</a></p>

      </form>
    </div>
  );
};
