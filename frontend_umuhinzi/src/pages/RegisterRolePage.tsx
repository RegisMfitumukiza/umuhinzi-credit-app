import { useNavigate } from "react-router-dom";

const roles = [
  { key: "FARMER", label: "Farmer", desc: "Individual farmer accessing credit for seeds, fertilizer, or equipment." },
  { key: "INSTITUTION", label: "Institution", desc: "Banks or MFIs looking to invest in local agricultural projects." },
  { key: "COOPERATIVE_MANAGER", label: "Cooperative Manager", desc: "Managing financial access for a group of smallholder farmers." },
  { key: "GOVERNMENT_PARTNER", label: "Government Partner", desc: "Monitoring agricultural data and supporting policy implementation." },
];

export const RegisterRolePage = () => {
  const navigate = useNavigate();

  const handleSelect = (role: string) => {
    const reg = { role };
    localStorage.setItem("umuhinzi_registration", JSON.stringify(reg));
    navigate("/register/personal");
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Join Umuhinzi Credit</h2>
      <p className="text-sm text-stone-500">Start by choosing your primary role on our platform.</p>

      <div className="grid gap-4 md:grid-cols-2">
        {roles.map((r) => (
          <button key={r.key} onClick={() => handleSelect(r.key)} className="rounded-2xl border border-stone-200 p-6 text-left hover:shadow">
            <h3 className="text-lg font-semibold">{r.label}</h3>
            <p className="mt-2 text-sm text-stone-500">{r.desc}</p>
          </button>
        ))}
      </div>
    </div>
  );
};
