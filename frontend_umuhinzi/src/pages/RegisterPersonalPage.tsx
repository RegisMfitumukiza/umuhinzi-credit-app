import { useNavigate } from "react-router-dom";
import { useState } from "react";
import axios from "axios";
import { registerRequest } from "../api/auth";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { homeRouteByRole } from "../utils/auth";
import type { BackendRole } from "../types/auth";

export const RegisterPersonalPage = () => {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const { showToast } = useToast();

  const isValidEmail = (value: string) => /^(?:[^\s@]+)@(?:[^\s@]+)\.[^\s@]+$/.test(value);
  const isValidPhone = (value: string) => /^(\+?[0-9]{10,15})$/.test(value);
  const isStrongPassword = (value: string) =>
    value.length >= 8 &&
    /[A-Z]/.test(value) &&
    /[a-z]/.test(value) &&
    /\d/.test(value) &&
    /[!@#$%^&*(),.?":{}|<>]/.test(value);

  const handleNext = async () => {
    const prev = JSON.parse(localStorage.getItem("umuhinzi_registration") || "{}");
    const role = (prev.role || "FARMER") as BackendRole;
    const next = {
      ...prev,
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      password,
      role,
    };

    if (next.fullName.length < 2 || next.fullName.length > 100) {
      showToast("Full name must be between 2 and 100 characters", "error");
      return;
    }

    if (!isValidEmail(next.email)) {
      showToast("Enter a valid email address", "error");
      return;
    }

    if (next.phone && !isValidPhone(next.phone)) {
      showToast("Phone must be 10 to 15 digits, optionally starting with +", "error");
      return;
    }

    if (!isStrongPassword(next.password)) {
      showToast("Password must include upper, lower, number and special character", "error");
      return;
    }

    localStorage.setItem("umuhinzi_registration", JSON.stringify(next));

    setIsSubmitting(true);

    try {
      const session = await registerRequest({
        fullName: next.fullName,
        email: next.email,
        phone: next.phone,
        password: next.password,
        role: next.role,
      });

      login(session);
      if (session.refreshToken) {
        localStorage.setItem("umuhinzi_refresh_token", session.refreshToken);
      }

      localStorage.removeItem("umuhinzi_registration");
      showToast("Registration successful", "success");
      navigate(homeRouteByRole(session.user.role), { replace: true });
    } catch (error) {
      const message = axios.isAxiosError(error)
        ? error.response?.data?.message || error.message
        : error instanceof Error
          ? error.message
          : "Registration failed. Please check your details.";

      showToast(message, "error");
    } finally {
      setIsSubmitting(false);
    }
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
              <button onClick={() => void handleNext()} disabled={isSubmitting} className="rounded-full bg-brand-500 px-6 py-3 text-sm font-semibold text-white disabled:opacity-70">
                {isSubmitting ? "Creating account..." : "Create Account"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
