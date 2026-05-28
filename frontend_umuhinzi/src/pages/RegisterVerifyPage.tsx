import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const maskPhone = (phone?: string) => {
  if (!phone) return "+250 788 ••• ••89";
  // naive mask: keep last 2 digits
  const digits = phone.replace(/\D/g, "");
  const last = digits.slice(-2);
  return `+${digits.slice(0, 3)} ${digits.slice(3, 6)} ••• ••${last}`;
};

export const RegisterVerifyPage = () => {
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [reg, setReg] = useState<any>(null);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("umuhinzi_registration") || "null");
    setReg(stored);
  }, []);

  const handleVerify = () => {
    // In a real app we'd verify the OTP. For now accept any 4-6 digit code.
    if (!code || code.trim().length < 4) return;

    const r = reg || {};
    const user = {
      id: `user-${Date.now()}`,
      fullName: r.fullName || "Demo User",
      email: r.email || "demo@example.com",
      phone: r.phone || "+250788001189",
      password: r.password || "123456",
      role: r.role || "FARMER",
      farm: r.farm || { name: "Demo Farm" },
    };

    localStorage.setItem("umuhinzi_account", JSON.stringify(user));
    localStorage.setItem("umuhinzi_user", JSON.stringify(user));
    localStorage.setItem("umuhinzi_token", "demo");
    localStorage.setItem("umuhinzi_last_role", user.role);
    localStorage.setItem(
      "umuhinzi_post_register_login",
      JSON.stringify({ email: user.email, password: user.password, autoLogin: true }),
    );
    localStorage.removeItem("umuhinzi_registration");

    navigate("/login", { replace: true, state: { email: user.email, password: user.password, autoLogin: true } });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,#f0faf0_0%,#f8faf7_50%,#fff_100%)] p-6">
      <div className="w-full max-w-md rounded-xl border border-stone-100 bg-white p-8 shadow-lg">
        <button onClick={() => navigate('/register')} className="mb-4 text-sm text-stone-500">← Back to Registration</button>

        <div className="flex flex-col items-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 text-xl">📱</div>
          <h2 className="mt-4 text-xl font-semibold text-stone-900">Verify Your Identity</h2>
          <p className="mt-2 text-sm text-stone-600 text-center">We've sent a 6-digit verification code to</p>
          <p className="mt-1 font-medium text-stone-900">{maskPhone(reg?.phone)}</p>
        </div>

        <div className="mt-6 flex justify-center">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            className="w-60 rounded-2xl border border-stone-200 px-4 py-3 text-center text-lg tracking-[0.35em]"
            maxLength={6}
            placeholder="______"
          />
        </div>

        <div className="mt-6">
          <button onClick={handleVerify} className="w-full rounded-full bg-emerald-500 px-6 py-3 text-sm font-semibold text-white">Verify & Continue</button>
        </div>

        <div className="mt-4 text-center text-sm text-stone-500">
          Resend code in 0:59
          <div className="mt-2"><button onClick={() => { /* noop */ }} className="text-emerald-500">Use a different phone number</button></div>
        </div>
      </div>
    </div>
  );
};

export default RegisterVerifyPage;
