import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { farmApi } from "../api/farms";
import { FarmForm } from "../components/FarmForm";
import { useToast } from "../context/ToastContext";
import { emptyFarmValues, type FarmFormValues } from "../types/farm";

export const FarmEditPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [initialValues, setInitialValues] = useState<FarmFormValues | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!id) return;

      try {
        const farm = await farmApi.getById(id);
        setInitialValues({
          name: farm.name,
          landSize: String(farm.landSize),
          landUnit: farm.landUnit,
          ownershipType: farm.ownershipType,
          soilType: farm.soilType,
          province: farm.province,
          district: farm.district,
          sector: farm.sector,
          cell: farm.cell,
          village: farm.village,
          latitude: farm.latitude?.toString() ?? "",
          longitude: farm.longitude?.toString() ?? "",
          status: farm.status,
        });
      } catch (error) {
        showToast(error instanceof Error ? error.message : "Failed to load farm", "error");
        setInitialValues(emptyFarmValues);
      }
    };

    load();
  }, [id, showToast]);

  const handleSubmit = async (values: FarmFormValues) => {
    if (!id) return;

    try {
      await farmApi.update(id, values);
      showToast("Farm updated successfully", "success");
      navigate(`/farms/${id}`);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Failed to update farm", "error");
    }
  };

  if (!initialValues) {
    return <p className="text-sm text-stone-500">Loading farm...</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-stone-900">Edit Farm</h1>
        <p className="text-sm text-stone-600">Update the details stored for this farm.</p>
      </div>
      <FarmForm initialValues={initialValues} submitLabel="Save changes" onSubmit={handleSubmit} />
    </div>
  );
};
