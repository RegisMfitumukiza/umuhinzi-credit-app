import { useNavigate } from "react-router-dom";
import { useState } from "react";

export const RegisterPersonalPage = () => {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  const handleNext = () => {
    const prev = JSON.parse(localStorage.getItem("umuhinzi_registration") || "{}");
    const next = { ...prev, fullName, email, phone, password };
    localStorage.setItem("umuhinzi_registration", JSON.stringify(next));
    navigate("/register/farm");
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-10">
      <div className="w-full max-w-2xl rounded-3xl border border-stone-200 bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.06)] sm:p-8">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-stone-900">Personal Info</h2>
          <p className="mt-2 text-sm text-stone-500">Provide basic account details.</p>
        </div>

        <div className="mt-8 space-y-4">
          <label className="block">
            <span className="text-sm font-medium text-stone-900">Full name</span>
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="mt-2 w-full rounded-2xl border border-stone-200 px-4 py-3 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-stone-900">Email</span>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-2 w-full rounded-2xl border border-stone-200 px-4 py-3 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-stone-900">Phone</span>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="mt-2 w-full rounded-2xl border border-stone-200 px-4 py-3 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-stone-900">Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-2 w-full rounded-2xl border border-stone-200 px-4 py-3 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
            />
          </label>

          <div className="flex justify-center pt-2">
            <button onClick={handleNext} className="rounded-full bg-brand-500 px-6 py-3 text-sm font-semibold text-white">
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
