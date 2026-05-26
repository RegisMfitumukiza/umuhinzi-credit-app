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
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Personal Info</h2>
      <p className="text-sm text-stone-500">Provide basic account details.</p>

      <div className="space-y-4">
        <label className="block">
          <span className="text-sm font-medium">Full name</span>
          <input value={fullName} onChange={(e) => setFullName(e.target.value)} className="mt-2 w-full rounded-2xl border border-stone-200 px-4 py-3" />
        </label>

        <label className="block">
          <span className="text-sm font-medium">Email</span>
          <input value={email} onChange={(e) => setEmail(e.target.value)} className="mt-2 w-full rounded-2xl border border-stone-200 px-4 py-3" />
        </label>

        <label className="block">
          <span className="text-sm font-medium">Phone</span>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-2 w-full rounded-2xl border border-stone-200 px-4 py-3" />
        </label>

        <label className="block">
          <span className="text-sm font-medium">Password</span>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-2 w-full rounded-2xl border border-stone-200 px-4 py-3" />
        </label>

        <div className="flex justify-end">
          <button onClick={handleNext} className="rounded-full bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white">Next</button>
        </div>
      </div>
    </div>
  );
};
