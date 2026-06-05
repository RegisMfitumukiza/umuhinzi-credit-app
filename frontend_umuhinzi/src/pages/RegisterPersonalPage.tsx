import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import { registerRequest } from "../api/auth";
import { updateMyProfile } from "../api/users";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { homeRouteByRole, needsEmailVerification, normalizeRole } from "../utils/auth";
import type { BackendRole } from "../types/auth";

type FieldErrors = Partial<
  Record<
    "fullName" | "email" | "phone" | "password" | "province" | "district" | "sector" | "village",
    string
  >
>;

const validatePassword = (value: string): string | null => {
  if (value.length < 8) return "Password must be at least 8 characters long.";
  if (!/[A-Z]/.test(value)) return "Password must contain at least one uppercase letter.";
  if (!/[a-z]/.test(value)) return "Password must contain at least one lowercase letter.";
  if (!/\d/.test(value)) return "Password must contain at least one number.";
  if (!/[!@#$%^&*(),.?\":{}|<>]/.test(value)) return "Password must contain at least one special character.";
  return null;
};

export const RegisterPersonalPage = () => {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<BackendRole>("FARMER");
  const [province, setProvince] = useState("");
  const [district, setDistrict] = useState("");
  const [sector, setSector] = useState("");
  const [cell, setCell] = useState("");
  const [village, setVillage] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const { login, setUser } = useAuth();
  const { showToast } = useToast();

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("umuhinzi_registration") || "null") as { role?: string } | null;
    setRole(normalizeRole(stored?.role || localStorage.getItem("umuhinzi_last_role")));
  }, []);

  const setFieldError = (field: keyof FieldErrors, msg: string | undefined) =>
    setFieldErrors((prev) => ({ ...prev, [field]: msg }));

  const handleNext = async () => {
    const errors: FieldErrors = {};

    if (fullName.trim().length < 2) errors.fullName = "Full name must be at least 2 characters.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) errors.email = "Enter a valid email address.";
    if (phone && !/^(\+?[0-9]{10,15})$/.test(phone.trim())) {
      errors.phone = "Please enter a valid phone number (10-15 digits).";
    }
    if (!province.trim()) errors.province = "Province is required.";
    if (!district.trim()) errors.district = "District is required.";
    if (!sector.trim()) errors.sector = "Sector is required.";
    if (!village.trim()) errors.village = "Village is required.";

    const pwdError = validatePassword(password);
    if (pwdError) errors.password = pwdError;

    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setIsSubmitting(true);

    try {
      const session = await registerRequest({
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim() || undefined,
        password,
        role,
      });

      localStorage.setItem("umuhinzi_token", session.accessToken);
      if (session.refreshToken) {
        localStorage.setItem("umuhinzi_refresh_token", session.refreshToken);
      }

      login(session);

      const updatedUser = await updateMyProfile({
        fullName: fullName.trim(),
        phone: phone.trim() || undefined,
        province,
        district,
        sector,
        cell: cell || undefined,
        village,
      });

      const nextUser = {
        ...session.user,
        ...updatedUser,
        isEmailVerified: updatedUser.isEmailVerified ?? session.user.isEmailVerified,
      };
      setUser(nextUser);
      localStorage.removeItem("umuhinzi_registration");
      showToast("Registration successful. Please verify your email.", "success");

      if (needsEmailVerification(nextUser)) {
        navigate("/verify-email", { replace: true, state: { email: nextUser.email } });
      } else {
        navigate(homeRouteByRole(session.user.role), { replace: true });
      }
    } catch (error) {
      const message = axios.isAxiosError(error)
        ? error.response?.data?.message || error.message
        : error instanceof Error
          ? error.message
          : "Registration failed. Please check your details.";

      const messageLower = message.toLowerCase();
      if (messageLower.includes("email") && messageLower.includes("already")) {
        setFieldError("email", "This email address is already registered.");
      } else if (messageLower.includes("phone") && messageLower.includes("already")) {
        setFieldError("phone", "This phone number is already registered.");
      } else {
        showToast(message, "error");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-10">
      <div className="w-full max-w-2xl rounded-3xl border border-stone-200 bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.06)] sm:p-8">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-stone-900">Create Your Account</h2>
          <p className="mt-2 text-sm text-stone-500">Fill in your details to register your account.</p>
        </div>

        <div className="mt-8 space-y-4">
          <label className="block">
            <span className="text-sm font-medium text-stone-900">Full name</span>
            <input
              value={fullName}
              onChange={(e) => {
                setFullName(e.target.value);
                setFieldError("fullName", undefined);
              }}
              className={`mt-2 w-full rounded-2xl border px-4 py-3 outline-none focus:border-emerald-400 ${
                fieldErrors.fullName ? "border-rose-400 bg-rose-50" : "border-stone-200"
              }`}
            />
            {fieldErrors.fullName && <p className="mt-1 text-xs text-rose-600">{fieldErrors.fullName}</p>}
          </label>

          <label className="block">
            <span className="text-sm font-medium text-stone-900">Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setFieldError("email", undefined);
              }}
              className={`mt-2 w-full rounded-2xl border px-4 py-3 outline-none focus:border-emerald-400 ${
                fieldErrors.email ? "border-rose-400 bg-rose-50" : "border-stone-200"
              }`}
            />
            {fieldErrors.email && <p className="mt-1 text-xs text-rose-600">{fieldErrors.email}</p>}
          </label>

          <label className="block">
            <span className="text-sm font-medium text-stone-900">
              Phone <span className="text-stone-400">(optional)</span>
            </span>
            <input
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                setFieldError("phone", undefined);
              }}
              placeholder="+250..."
              className={`mt-2 w-full rounded-2xl border px-4 py-3 outline-none focus:border-emerald-400 ${
                fieldErrors.phone ? "border-rose-400 bg-rose-50" : "border-stone-200"
              }`}
            />
            {fieldErrors.phone && <p className="mt-1 text-xs text-rose-600">{fieldErrors.phone}</p>}
          </label>

          <label className="block">
            <span className="text-sm font-medium text-stone-900">Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setFieldError("password", undefined);
              }}
              className={`mt-2 w-full rounded-2xl border px-4 py-3 outline-none focus:border-emerald-400 ${
                fieldErrors.password ? "border-rose-400 bg-rose-50" : "border-stone-200"
              }`}
            />
            {fieldErrors.password ? (
              <p className="mt-1 text-xs text-rose-600">{fieldErrors.password}</p>
            ) : (
              <p className="mt-1 text-xs text-stone-400">Min 8 chars, uppercase, lowercase, number, special character</p>
            )}
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            {([
              { label: "Province", value: province, setter: setProvince, field: "province" },
              { label: "District", value: district, setter: setDistrict, field: "district" },
              { label: "Sector", value: sector, setter: setSector, field: "sector" },
              { label: "Cell (optional)", value: cell, setter: setCell, field: null },
            ] as const).map((item) => (
              <label key={item.label} className="block">
                <span className="text-sm font-medium text-stone-900">{item.label}</span>
                <input
                  value={item.value}
                  onChange={(e) => {
                    item.setter(e.target.value);
                    if (item.field) setFieldError(item.field as keyof FieldErrors, undefined);
                  }}
                  className={`mt-2 w-full rounded-2xl border px-4 py-3 outline-none focus:border-emerald-400 ${
                    item.field && fieldErrors[item.field as keyof FieldErrors] ? "border-rose-400 bg-rose-50" : "border-stone-200"
                  }`}
                />
                {item.field && fieldErrors[item.field as keyof FieldErrors] && (
                  <p className="mt-1 text-xs text-rose-600">{fieldErrors[item.field as keyof FieldErrors]}</p>
                )}
              </label>
            ))}

            <label className="block sm:col-span-2">
              <span className="text-sm font-medium text-stone-900">Village</span>
              <input
                value={village}
                onChange={(e) => {
                  setVillage(e.target.value);
                  setFieldError("village", undefined);
                }}
                className={`mt-2 w-full rounded-2xl border px-4 py-3 outline-none focus:border-emerald-400 ${
                  fieldErrors.village ? "border-rose-400 bg-rose-50" : "border-stone-200"
                }`}
              />
              {fieldErrors.village && <p className="mt-1 text-xs text-rose-600">{fieldErrors.village}</p>}
            </label>
          </div>

          <div className="flex justify-center pt-2">
            <button
              onClick={() => void handleNext()}
              disabled={isSubmitting}
              className="rounded-full bg-emerald-500 px-6 py-3 text-sm font-semibold text-white disabled:opacity-70"
            >
              {isSubmitting ? "Creating account..." : "Create Account"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
