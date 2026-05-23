import { useAuth } from "../context/AuthContext";

export const Header = () => {
  const { logout } = useAuth();

  return (
    <header className="flex items-center justify-between border-b border-stone-200 bg-white px-4 py-4 lg:px-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-brand-600">Agriculture fintech</p>
        <h2 className="text-xl font-semibold text-stone-900">Umuhinzi Credit</h2>
      </div>
      <button
        onClick={logout}
        className="rounded-full bg-brand-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-800"
      >
        Logout
      </button>
    </header>
  );
};
