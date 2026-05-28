import { useNavigate } from "react-router-dom";
import { farmApi } from "../api/farms";
import { FarmForm } from "../components/FarmForm";
import { useToast } from "../context/ToastContext";
import type { FarmFormValues } from "../types/farm";

export const FarmCreatePage = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const handleSubmit = async (values: FarmFormValues) => {
    try {
      await farmApi.create(values);
      showToast("Farm created successfully", "success");
      navigate("/farms");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Failed to create farm", "error");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-stone-900">Create Farm</h1>
        <p className="text-sm text-stone-600">Register a new farm for the authenticated farmer.</p>
      </div>
      <FarmForm submitLabel="Create farm" onSubmit={handleSubmit} />
    </div>
  );
};
