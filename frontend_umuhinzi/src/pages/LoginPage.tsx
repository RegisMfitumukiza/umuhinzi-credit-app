import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

export const LoginPage = () => {
  const [token, setToken] = useState("");
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (!token.trim()) {
      showToast("Paste a valid JWT token to continue", "error");
      return;
    }

    login(token.trim());
    showToast("Session started", "success");
    navigate("/dashboard");
  };

  const handleDemo = () => {
    // Start a demo session using local storage (not a JWT)
    login("demo");
    showToast("Demo session started", "success");
    navigate("/dashboard");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,#dff0e0_0%,#f8faf7_50%,#edf5ee_100%)] p-6">
      <form onSubmit={handleSubmit} className="w-full max-w-xl rounded-[2rem] border border-white/60 bg-white/90 p-8 shadow-panel backdrop-blur">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-brand-700">Umuhinzi Credit</p>
        <h1 className="mt-3 text-3xl font-semibold text-stone-900">Token Login</h1>
        <p className="mt-2 text-sm text-stone-600">Paste a backend JWT token to unlock the farm dashboard during development.</p>

        <label className="mt-6 block text-sm font-medium text-stone-700">
          JWT token
          <textarea
            value={token}
            onChange={(event) => setToken(event.target.value)}
            rows={6}
            className="mt-2 w-full rounded-2xl border border-stone-300 bg-stone-50 p-4 text-sm outline-none focus:border-brand-500"
            placeholder="eyJhbGciOi..."
          />
        </label>

        <button className="mt-6 rounded-full bg-brand-700 px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-800">
          Enter dashboard
        </button>

        <div className="mt-4 text-center">
          <button type="button" onClick={handleDemo} className="text-sm text-brand-700 underline">Start demo session (no sign-in)</button>
        </div>
      </form>
    </div>
  );
};
