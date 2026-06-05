import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { farmApi } from "../api/farms";
import { farmerApi } from "../api/farmer";
import { FarmForm } from "../components/FarmForm";
import { useToast } from "../context/ToastContext";
import { useAuth } from "../context/AuthContext";
import { isFarmerFrontendApproved } from "../utils/farmerApprovalQueue";
import type { FarmFormValues } from "../types/farm";

export const FarmCreatePage = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { user } = useAuth();
  const [isBlocked, setIsBlocked] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const profile = await farmerApi.getProfile();
        const approvedInFrontend = isFarmerFrontendApproved(user?.id);
        setIsBlocked(profile.status === "PENDING" && !approvedInFrontend);
      } catch {
        setIsBlocked(false);
      }
    })();
  }, [user?.id]);

  const handleSubmit = async (values: FarmFormValues) => {
    if (isBlocked) {
      showToast("Your profile is pending cooperative manager approval", "error");
      return;
    }

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
        <p className="text-sm text-stone-600">Register a new farm.</p>
        {isBlocked && (
          <p className="mt-2 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            Access blocked while your farmer status is pending. Wait for cooperative manager approval.
          </p>
        )}
      </div>
      {!isBlocked ? <FarmForm submitLabel="Create farm" onSubmit={handleSubmit} /> : null}
    </div>
  );
};
