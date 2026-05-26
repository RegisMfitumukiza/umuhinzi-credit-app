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

    const storedUser = JSON.parse(localStorage.getItem("umuhinzi_user") || "null");

    if (!email.trim() || !password.trim()) {
      showToast("Enter your email and password", "error");
      return;
    }

    if (storedUser && storedUser.email === email.trim() && storedUser.password === password.trim()) {
      login("demo");
      showToast("Welcome back", "success");
      navigate("/farms");
      return;
    }

    showToast("No local account matched that email and password", "error");
  };

  const handleDemo = () => {
    // Start a demo session using local storage (not a JWT)
    login("demo");
    showToast("Demo session started", "success");
    navigate("/farms");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,#dff0e0_0%,#f8faf7_50%,#edf5ee_100%)] p-6">
      <form onSubmit={handleSubmit} className="w-full max-w-xl rounded-[2rem] border border-white/60 bg-white/90 p-8 shadow-panel backdrop-blur">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-brand-700">Umuhinzi Credit</p>
        <h1 className="mt-3 text-3xl font-semibold text-stone-900">Token Login</h1>
        <p className="mt-2 text-sm text-stone-600">Use the fake account you created locally or start a demo session.</p>

        <label className="mt-6 block text-sm font-medium text-stone-700">
          Email
          <input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-stone-300 bg-stone-50 p-4 text-sm outline-none focus:border-brand-500"
            placeholder="you@example.com"
          />
        </label>

        <label className="mt-4 block text-sm font-medium text-stone-700">
          Password
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-stone-300 bg-stone-50 p-4 text-sm outline-none focus:border-brand-500"
            placeholder="Your local registration password"
          />
        </label>

        <button className="mt-6 rounded-full bg-brand-700 px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-800">
          Login to farmer pages
        </button>

        <div className="mt-4 text-center">
          <button type="button" onClick={handleDemo} className="text-sm text-brand-700 underline">Start demo session (no sign-in)</button>
        </div>

        <div className="mt-4 text-center">
          <p className="text-sm text-stone-500">New here? <a href="/register" className="font-semibold text-brand-700 underline">Create an account</a></p>
        </div>
      </form>
    </div>
  );
};
