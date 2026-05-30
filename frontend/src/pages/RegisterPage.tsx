import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/http";
import { useToast } from "../context/ToastContext";

type Step = "personal" | "sent";

interface PersonalData {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  confirm: string;
}

export const RegisterPage = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [step, setStep] = useState<Step>("personal");
  const [loading, setLoading] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");

  const [personal, setPersonal] = useState<PersonalData>({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirm: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (personal.password !== personal.confirm) {
      showToast("Passwords do not match.", "error");
      return;
    }
    setLoading(true);
    try {
      await api.post("/auth/register", {
        fullName: personal.fullName,
        email: personal.email,
        phone: personal.phone || undefined,
        password: personal.password,
        role: "FARMER",
      });
      setRegisteredEmail(personal.email);
      setStep("sent");
    } catch (err: unknown) {
      const msg =
        err &&
        typeof err === "object" &&
        "response" in err &&
        err.response &&
        typeof err.response === "object" &&
        "data" in err.response &&
        err.response.data &&
        typeof err.response.data === "object" &&
        "message" in err.response.data
          ? String((err.response.data as { message: string }).message)
          : "Registration failed. Please try again.";
      showToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f8faf7_0%,#eef5ef_100%)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-full bg-brand-500 flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-lg font-black">U</span>
          </div>
          <h1 className="text-2xl font-black text-stone-900 tracking-tight">
            {step === "personal" ? "Create your account" : "Check your email"}
          </h1>
          <p className="text-stone-500 text-sm mt-1">
            {step === "personal" ? "Step 1 of 2" : "Step 2 of 2"}
          </p>
        </div>

        {/* Progress bar */}
        <div className="flex gap-2 mb-8">
          {(["personal", "sent"] as Step[]).map((s, i) => (
            <div
              key={s}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                (step === "personal" && i === 0) || step === "sent"
                  ? "bg-brand-500"
                  : "bg-stone-200"
              }`}
            />
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-8">
          {/* Step 1: Personal */}
          {step === "personal" && (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <h2 className="font-bold text-stone-900 mb-1">Personal details</h2>

              {(["fullName", "email", "phone", "password", "confirm"] as const).map((field) => (
                <div key={field} className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-stone-700">
                    {field === "confirm"
                      ? "Confirm password"
                      : field === "fullName"
                      ? "Full name"
                      : field === "phone"
                      ? "Phone (optional)"
                      : field.charAt(0).toUpperCase() + field.slice(1)}
                  </label>
                  <input
                    type={
                      field === "password" || field === "confirm"
                        ? "password"
                        : field === "email"
                        ? "email"
                        : "text"
                    }
                    value={personal[field]}
                    onChange={(e) =>
                      setPersonal((p) => ({ ...p, [field]: e.target.value }))
                    }
                    required={field !== "phone"}
                    placeholder={
                      field === "fullName"
                        ? "Jean Pierre Nkurunziza"
                        : field === "email"
                        ? "you@example.com"
                        : field === "phone"
                        ? "+250 7XX XXX XXX"
                        : "••••••••"
                    }
                    className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-all"
                  />
                </div>
              ))}

              <button
                type="submit"
                disabled={loading}
                className="mt-2 w-full py-3 bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white font-semibold rounded-full transition-colors text-sm"
              >
                {loading ? "Creating account…" : "Create account"}
              </button>
            </form>
          )}

          {/* Step 2: Email sent */}
          {step === "sent" && (
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="w-16 h-16 rounded-full bg-brand-50 flex items-center justify-center">
                <svg className="w-8 h-8 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                </svg>
              </div>
              <h2 className="font-bold text-stone-900 text-lg">Verify your email</h2>
              <p className="text-sm text-stone-500 text-center leading-relaxed">
                We sent a verification link to{" "}
                <strong className="text-stone-700">{registeredEmail}</strong>.
                Click the link in that email to activate your account, then sign in.
              </p>
              <p className="text-xs text-stone-400 text-center">
                Don't see it? Check your spam folder.
              </p>
              <button
                onClick={() => navigate("/login")}
                className="mt-2 w-full py-3 bg-brand-500 hover:bg-brand-600 text-white font-semibold rounded-full transition-colors text-sm"
              >
                Go to sign in
              </button>
            </div>
          )}
        </div>

        <p className="text-center text-sm text-stone-500 mt-6">
          Already have an account?{" "}
          <button
            onClick={() => navigate("/login")}
            className="text-brand-600 font-semibold hover:underline"
          >
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
};
