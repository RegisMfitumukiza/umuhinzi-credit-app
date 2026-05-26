import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

export const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    const storedAccount = JSON.parse(localStorage.getItem("umuhinzi_account") || "null");
    const storedRole = localStorage.getItem("umuhinzi_last_role");

    if (!email.trim() || !password.trim()) {
      showToast("Enter your email and password", "error");
      return;
    }

    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    // Admin shortcut: accept admin credentials via normal login page
    if (trimmedEmail.toLowerCase() === "admin@umuhinzi.test" && trimmedPassword === "Admin123!") {
      const adminAccount = { role: "ADMIN", email: trimmedEmail, password: trimmedPassword };
      localStorage.setItem("umuhinzi_account", JSON.stringify(adminAccount));
      localStorage.setItem("umuhinzi_user", JSON.stringify({ id: `admin-1`, fullName: "Platform Admin", email: trimmedEmail, role: "admin" }));
      localStorage.setItem("umuhinzi_last_role", "admin");
      login("admin-demo-token");
      showToast("Welcome admin", "success");
      navigate("/admin");
      return;
    }

    const accountMatches = storedAccount && storedAccount.email === trimmedEmail && storedAccount.password === trimmedPassword;
    const fallbackRole = storedRole === "COOPERATIVE_MANAGER" ? "COOPERATIVE_MANAGER" : "FARMER";
    const account = accountMatches
      ? storedAccount
      : {
          role: trimmedEmail.toLowerCase().includes("coop") || trimmedEmail.toLowerCase().includes("manager") ? "COOPERATIVE_MANAGER" : fallbackRole,
          email: trimmedEmail,
          password: trimmedPassword,
        };

    localStorage.setItem("umuhinzi_account", JSON.stringify(account));
    localStorage.setItem("umuhinzi_user", JSON.stringify({
      id: `user-${Date.now()}`,
      fullName: account.fullName || "Demo User",
      email: account.email,
      phone: account.phone || "",
      password: account.password,
      role: account.role,
      farm: account.farm || { name: "Demo Farm" },
    }));

    login("demo");
    showToast("Welcome back", "success");
    if (account.role === "COOPERATIVE_MANAGER") {
      navigate("/cooperatives");
      return;
    }

    navigate("/farms");
  };

  const handleDemo = () => {
    // Start a demo session using local storage (not a JWT)
    login("demo");
    showToast("Demo session started", "success");
    navigate("/farms");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,#f0faf0_0%,#f8faf7_50%,#fff_100%)] p-6">
      <form onSubmit={handleSubmit} className="w-full max-w-sm rounded-xl border border-stone-100 bg-white p-8 shadow-lg">
        <div className="flex flex-col items-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500 text-white text-xl">🌱</div>
          <h1 className="mt-4 text-2xl font-semibold text-stone-900">Welcome Back</h1>
          <p className="mt-2 text-sm text-stone-600 text-center">Access your farm dashboard and financial services.</p>
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

        <button className="mt-6 w-full rounded-full bg-emerald-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-600 flex items-center justify-center gap-2">
          Login to Dashboard <span aria-hidden>→</span>
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
