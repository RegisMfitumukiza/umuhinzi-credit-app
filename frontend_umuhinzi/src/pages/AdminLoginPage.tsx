import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { loginRequest } from "../api/auth";
import { useToast } from "../context/ToastContext";
import { homeRouteByRole } from "../utils/auth";

export const AdminLoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const session = await loginRequest({
        email: email.trim(),
        password: password.trim(),
      });

      if (session.user.role !== "ADMIN") {
        setError("This login page is only for admin accounts.");
        return;
      }

      login(session);
      if (session.refreshToken) {
        localStorage.setItem("umuhinzi_refresh_token", session.refreshToken);
      }
      setError("");
      showToast("Welcome admin", "success");
      navigate(homeRouteByRole(session.user.role));
    } catch {
      setError("Invalid credentials or account status.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-[#f7f8fa] px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-stone-900">Admin Login</h1>
        <p className="mt-2 text-sm text-stone-500">Sign in with the administrator account.</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="text-xs text-stone-500">Email</label>
            <input value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 w-full rounded-xl border border-stone-200 px-3 py-2 outline-none" placeholder="admin@umuhinzi.test" />
          </div>
          <div>
            <label className="text-xs text-stone-500">Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 w-full rounded-xl border border-stone-200 px-3 py-2 outline-none" placeholder="Admin123!" />
          </div>

          {error ? <div className="text-sm text-rose-600">{error}</div> : null}

          <div className="flex items-center justify-between">
            <button type="submit" disabled={isSubmitting} className="w-full rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-70">
              {isSubmitting ? "Signing in..." : "Sign in"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminLoginPage;
