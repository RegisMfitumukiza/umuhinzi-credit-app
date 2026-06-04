import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { registerRequest } from "../api/auth";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { homeRouteByRole, normalizeRole } from "../utils/auth";
import type { BackendRole } from "../types/auth";

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
  const [reg, setReg] = useState<Record<string, unknown> | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const { showToast } = useToast();

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("umuhinzi_registration") || "null");
    setReg(stored);
  }, []);

  const handleVerify = async () => {
    // In a real app we'd verify the OTP. For now accept any 4-6 digit code.
    if (!code || code.trim().length < 4) return;

    const r = reg || {};
    const fullName = String(r.fullName || "").trim();
    const email = String(r.email || "").trim();
    const password = String(r.password || "").trim();
    const phone = String(r.phone || "").trim();
    const role = normalizeRole(String(r.role || "FARMER")) as BackendRole;

    if (!fullName || !email || !password) {
      showToast("Complete all required registration steps first.", "error");
      return;
    }

    setIsSubmitting(true);

    try {
      const session = await registerRequest({
        fullName,
        email,
        password,
        phone: phone || undefined,
        role,
      });

      login(session);
      if (session.refreshToken) {
        localStorage.setItem("umuhinzi_refresh_token", session.refreshToken);
      }

      localStorage.removeItem("umuhinzi_registration");
      showToast("Registration successful", "success");
      navigate(homeRouteByRole(session.user.role), { replace: true });
    } catch {
      showToast("Registration failed. Please check your details.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,#f0faf0_0%,#f8faf7_50%,#fff_100%)] p-6">
      <div className="w-full max-w-md rounded-xl border border-stone-100 bg-white p-8 shadow-lg">
        <button onClick={() => navigate('/register')} className="mb-4 text-sm text-stone-500">← Back to Registration</button>

        <div className="flex flex-col items-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 text-xl">📱</div>
          <h2 className="mt-4 text-xl font-semibold text-stone-900">Verify Your Identity</h2>
          <p className="mt-2 text-sm text-stone-600 text-center">We've sent a 6-digit verification code to</p>
          <p className="mt-1 font-medium text-stone-900">{maskPhone(typeof reg?.phone === 'string' ? reg.phone : undefined)}</p>
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
          <button disabled={isSubmitting} onClick={() => void handleVerify()} className="w-full rounded-full bg-emerald-500 px-6 py-3 text-sm font-semibold text-white disabled:opacity-70">
            {isSubmitting ? "Creating account..." : "Verify & Continue"}
          </button>
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
