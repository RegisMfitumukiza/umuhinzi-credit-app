import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export const Header = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="flex items-center justify-between border-b border-stone-200 bg-white px-4 py-4 lg:px-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-brand-600">Agriculture fintech</p>
        <h2 className="text-xl font-semibold text-stone-900">Umuhinzi Credit</h2>
      </div>
      <div className="flex items-center gap-3">
        <button onClick={() => navigate("/account")} className="rounded-full p-2 text-stone-500 hover:bg-stone-100 transition">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
        </button>
        <button onClick={logout} className="rounded-full bg-brand-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-800">Logout</button>
      </div>
    </header>
  );
};
