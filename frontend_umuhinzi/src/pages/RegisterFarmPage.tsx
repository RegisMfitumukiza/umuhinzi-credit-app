import { useNavigate } from "react-router-dom";
import { useState } from "react";

export const RegisterFarmPage = () => {
  const navigate = useNavigate();
  const [farmName, setFarmName] = useState("");
  const [landSize, setLandSize] = useState("");
  const [province, setProvince] = useState("");
  const [district, setDistrict] = useState("");

  const handleFinish = () => {
    // Farm details will be created after account verification via /farms
    navigate("/register/verify");
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
            <button onClick={handleFinish} className="rounded-full bg-brand-500 px-6 py-3 text-sm font-semibold text-white">Register</button>
          </div>
        </div>
      </div>
    </div>
  );
};
