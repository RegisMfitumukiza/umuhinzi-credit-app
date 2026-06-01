import { useEffect, useState } from "react";
import { CooperativeApplicationsPage } from "./CooperativeApplicationsPage";
import { institutionApi, type InstitutionProfile } from "../api/institutions";

export const FinanceApplicationsPage = () => {
  const [institution, setInstitution] = useState<InstitutionProfile | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const currentInstitution = await institutionApi.getMyInstitution();
        setInstitution(currentInstitution);
      } catch {
        setInstitution(null);
      }
    })();
  }, []);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold text-emerald-700">Finance Institution Applications</p>
            <h2 className="text-2xl font-semibold text-stone-900">
              {institution?.name || "Your institution"}
            </h2>
            <p className="mt-1 text-sm text-stone-500">
              {institution?.status === "ACTIVE"
                ? "Approved institutions can see all farmer applications submitted to them and review them here."
                : "Your institution profile must be approved by an admin before you can see and act on applications."}
            </p>
          </div>
          <div className="rounded-full bg-stone-100 px-4 py-2 text-sm font-semibold text-stone-700">
            Status: {institution?.status || "PENDING"}
          </div>
        </div>
      </div>

      <CooperativeApplicationsPage
        showActions={true}
        scope="institution"
        title="Institution Loan Applications"
        subtitle="These are the farmer applications linked to your approved finance institution."
        emptyStateMessage="No farmer applications have been linked to this institution yet."
      />
    </div>
  );
};

export default FinanceApplicationsPage;
