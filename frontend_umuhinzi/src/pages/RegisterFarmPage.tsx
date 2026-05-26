import { useNavigate } from "react-router-dom";
import { useState } from "react";

export const RegisterFarmPage = () => {
  const navigate = useNavigate();
  const [farmName, setFarmName] = useState("");
  const [landSize, setLandSize] = useState("");
  const [province, setProvince] = useState("");
  const [district, setDistrict] = useState("");

  const handleFinish = () => {
    const reg = JSON.parse(localStorage.getItem("umuhinzi_registration") || "{}");
    const user = {
      id: `user-${Date.now()}`,
      fullName: reg.fullName || "Demo User",
      email: reg.email || "demo@example.com",
      phone: reg.phone || "",
      role: reg.role || "FARMER",
      farm: { name: farmName, landSize, province, district },
    };

    localStorage.setItem("umuhinzi_user", JSON.stringify(user));
    localStorage.setItem("umuhinzi_token", "demo");
    // cleanup
    localStorage.removeItem("umuhinzi_registration");
    navigate("/farms");
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Farm Details</h2>
      <p className="text-sm text-stone-500">Provide basic information about your primary farm.</p>

      <div className="space-y-4">
        <label className="block">
          <span className="text-sm font-medium">Farm name</span>
          <input value={farmName} onChange={(e) => setFarmName(e.target.value)} className="mt-2 w-full rounded-2xl border border-stone-200 px-4 py-3" />
        </label>

        <label className="block">
          <span className="text-sm font-medium">Land size (ha)</span>
          <input value={landSize} onChange={(e) => setLandSize(e.target.value)} className="mt-2 w-full rounded-2xl border border-stone-200 px-4 py-3" />
        </label>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium">Province</span>
            <input value={province} onChange={(e) => setProvince(e.target.value)} className="mt-2 w-full rounded-2xl border border-stone-200 px-4 py-3" />
          </label>
          <label className="block">
            <span className="text-sm font-medium">District</span>
            <input value={district} onChange={(e) => setDistrict(e.target.value)} className="mt-2 w-full rounded-2xl border border-stone-200 px-4 py-3" />
          </label>
        </div>

        <div className="flex justify-end">
          <button onClick={handleFinish} className="rounded-full bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white">Finish and Enter Farmer Pages</button>
        </div>
      </div>
    </div>
  );
};
