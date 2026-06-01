import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { registerRequest } from "../api/auth";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { homeRouteByRole } from "../utils/auth";
import type { BackendRole } from "../types/auth";

export const RegisterFarmPage = () => {
  const navigate = useNavigate();
  const [farmName, setFarmName] = useState("");
  const [landSize, setLandSize] = useState("");
  const [province, setProvince] = useState("");
  const [district, setDistrict] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const { showToast } = useToast();

  const handleFinish = async () => {
    const reg = JSON.parse(localStorage.getItem("umuhinzi_registration") || "{}");
    const next = { ...reg, farm: { name: farmName, landSize, province, district } };
    localStorage.setItem("umuhinzi_registration", JSON.stringify(next));

    const fullName = String(next.fullName || "").trim();
    const email = String(next.email || "").trim();
    const password = String(next.password || "").trim();
    const phone = String(next.phone || "").trim();

    if (!fullName || !email || !password) {
      showToast("Complete your personal information first.", "error");
      return;
    }

    setIsSubmitting(true);

    try {
      const session = await registerRequest({
        fullName,
        email,
        phone: phone || undefined,
        password,
        role: (next.role || "FARMER") as BackendRole,
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
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-10">
      <div className="w-full max-w-2xl rounded-3xl border border-stone-200 bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.06)] sm:p-8">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-stone-900">Farm Details</h2>
          <p className="mt-2 text-sm text-stone-500">Provide basic information about your primary farm.</p>
        </div>

        <div className="mt-8 space-y-4">
          <label className="block">
            <span className="text-sm font-medium text-stone-900">Farm name</span>
            <input
              value={farmName}
              onChange={(e) => setFarmName(e.target.value)}
              className="mt-2 w-full rounded-2xl border border-stone-200 px-4 py-3 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-stone-900">Land size (ha)</span>
            <input
              value={landSize}
              onChange={(e) => setLandSize(e.target.value)}
              className="mt-2 w-full rounded-2xl border border-stone-200 px-4 py-3 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
            />
          </label>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="text-sm font-medium text-stone-900">Province</span>
              <input
                value={province}
                onChange={(e) => setProvince(e.target.value)}
                className="mt-2 w-full rounded-2xl border border-stone-200 px-4 py-3 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-stone-900">District</span>
              <input
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="mt-2 w-full rounded-2xl border border-stone-200 px-4 py-3 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
              />
            </label>
          </div>

          <div className="flex justify-center pt-2">
            <button onClick={() => void handleFinish()} disabled={isSubmitting} className="rounded-full bg-brand-500 px-6 py-3 text-sm font-semibold text-white disabled:opacity-70">
              {isSubmitting ? "Creating account..." : "Register"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
