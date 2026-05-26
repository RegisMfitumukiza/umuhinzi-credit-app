import { useState } from "react";
import { useNavigate } from "react-router-dom";

export const AdminLoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Fake admin credentials
    const validEmail = "admin@umuhinzi.test";
    const validPassword = "Admin123!";

    if (email === validEmail && password === validPassword) {
      const adminUser = { fullName: "Platform Admin", email, role: "admin" };
      localStorage.setItem("umuhinzi_user", JSON.stringify(adminUser));
      localStorage.setItem("umuhinzi_token", "admin-demo-token");
      localStorage.setItem("umuhinzi_last_role", "admin");
      setError("");
      navigate("/admin");
    } else {
      setError("Invalid credentials. Use admin@umuhinzi.test / Admin123!");
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
            <button type="submit" className="w-full rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white">Sign in</button>
          </div>
        </form>

        <div className="mt-4 text-xs text-stone-500">Demo admin credentials: <strong>admin@umuhinzi.test</strong> / <strong>Admin123!</strong></div>
      </div>
    </div>
  );
};

export default AdminLoginPage;
