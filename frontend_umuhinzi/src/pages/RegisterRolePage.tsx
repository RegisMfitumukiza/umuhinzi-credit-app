import { useState } from "react";
import { useNavigate } from "react-router-dom";

const roles = [
  {
    key: "FARMER",
    label: "Farmer",
    desc: "Individual farmer seeking credit for seeds, fertilizer, or equipment.",
    icon: "🌱",
  },
  // {
  //   key: "INSTITUTION",
  //   label: "Finance Institution",
  //   desc: "Banks and microfinance institutions looking to invest in local agricultural projects.",
  //   icon: "🏢",
  // },

  {
    key: "COOPERATIVE_MANAGER",
    label: "Cooperative Manager",
    desc: "Managing financial access for a group of smallholder farmers.",
    icon: "👥",
  },
  // {
  //   key: "GOVERNMENT_PARTNER",
  //   label: "Government Partner",
  //   desc: "Monitoring agricultural data and supporting policy implementation.",
  //   icon: "🛡️",
  // },
];

export const RegisterRolePage = () => {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState<string>("FARMER");

  const handleNext = () => {
    localStorage.setItem("umuhinzi_registration", JSON.stringify({ role: selectedRole }));
    localStorage.setItem("umuhinzi_last_role", selectedRole);
    navigate("/register/personal");
  };

  return (
    <div className="min-h-screen bg-[#f6f7f6] px-4 py-10 text-stone-900">
      <div className="mx-auto max-w-4xl">
        <div className="text-center">
          <h1 className="text-3xl font-extrabold tracking-[-0.03em] text-stone-900">Join Umuhinzi Credit</h1>
          <p className="mt-2 text-sm text-stone-500">Start by choosing your primary role on our platform.</p>
        </div>

        <div className="mt-8 flex items-center justify-center gap-10 text-center">
          <div className="flex flex-col items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-sm font-semibold text-white shadow-sm">1</div>
            <span className="text-xs font-semibold text-emerald-600">Account Type</span>
          </div>
          <div className="flex flex-col items-center gap-2 opacity-60">
            <div className="flex h-8 w-8 items-center justify-center rounded-full border border-stone-300 bg-white text-sm font-semibold text-stone-500">2</div>
            <span className="text-xs font-semibold text-stone-500">Personal Info</span>
          </div>
        </div>

        <div className="mt-8 rounded-3xl border border-stone-200 bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.06)] sm:p-8">
          <div className="grid gap-4 md:grid-cols-2">
            {roles.map((role) => {
              const isSelected = selectedRole === role.key;

              return (
                <button
                  key={role.key}
                  type="button"
                  onClick={() => setSelectedRole(role.key)}
                  className={`rounded-2xl border p-5 text-left transition ${
                    isSelected ? "border-emerald-400 bg-emerald-50 shadow-sm" : "border-stone-200 bg-white hover:border-emerald-200 hover:shadow-sm"
                  }`}
                >
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-stone-50 text-lg shadow-sm">{role.icon}</div>
                  <h3 className="text-lg font-semibold text-stone-900">{role.label}</h3>
                  <p className="mt-2 text-sm leading-6 text-stone-500">{role.desc}</p>
                </button>
              );
            })}
          </div>

          <div className="mt-8 border-t border-stone-200 pt-5">
            <div className="flex flex-col-reverse items-center justify-between gap-4 sm:flex-row">
              <p className="text-sm text-stone-500">
                Already have an account? <button onClick={() => navigate("/login")} className="font-semibold text-emerald-600 hover:underline">Log in</button>
              </p>

              <button
                type="button"
                onClick={handleNext}
                className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-600"
              >
                Next Step <span aria-hidden>›</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
