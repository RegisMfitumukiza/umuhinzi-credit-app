import { useParams } from "react-router-dom";

export const LoanDetailsPage = () => {
  const { id } = useParams();

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold">Loan Details</h2>
      <p className="mt-2 text-sm text-stone-600">Details for loan {id || "-"} (placeholder).</p>
    </div>
  );
};
