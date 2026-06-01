import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";

export const CooperativeHeader = () => {
  const { logout } = useAuth();

  return (
    <header className="flex items-center justify-between border-b border-stone-200 bg-white px-4 py-4 lg:px-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-emerald-600">Agriculture fintech</p>
        <h2 className="text-xl font-semibold text-stone-900">Umuhinzi Credit</h2>
      </div>
      <div className="flex items-center gap-3">
        <Link to="/cooperatives/profile" className="rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-50">
          Profile
        </Link>
        <button onClick={logout} className="rounded-full bg-emerald-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-800">
          Logout
        </button>
      </div>
    </header>
  );
};
