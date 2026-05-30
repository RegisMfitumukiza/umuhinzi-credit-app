import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export const UnauthorizedPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 px-4">
      <div className="text-center">
        <h1 className="text-4xl font-black text-stone-900 tracking-tight">403</h1>
        <p className="text-stone-500 mt-2">You don't have access to this page.</p>
        <button
          onClick={() => navigate(user ? "/dashboard" : "/")}
          className="mt-6 px-6 py-3 bg-brand-500 hover:bg-brand-600 text-white font-semibold rounded-full transition-colors text-sm"
        >
          Go home
        </button>
      </div>
    </div>
  );
};
