import { useEffect, useState } from "react";
import { api } from "../api/http";

interface MarketPrice {
  id: string;
  cropName: string;
  marketLocation: string;
  pricePerUnit: number;
  unit: string | null;
  recordedAt: string | null;
}

const fmtRwf = (n: number) => `${Math.round(n).toLocaleString()} RWF`;

const fmtDate = (s: string | null) => {
  if (!s) return "—";
  return new Date(s).toLocaleDateString("en-RW", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

export const MarketPricesPage = () => {
  const [prices, setPrices] = useState<MarketPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [cropSearch, setCropSearch] = useState("");
  const [locationSearch, setLocationSearch] = useState("");

  const fetchPrices = (crop: string, location: string) => {
    setLoading(true);
    const params = new URLSearchParams({ limit: "100" });
    if (crop.trim()) params.set("cropName", crop.trim());
    if (location.trim()) params.set("marketLocation", location.trim());
    api
      .get(`/market-prices?${params.toString()}`)
      .then((r) => {
        const d = r.data.data;
        setPrices(Array.isArray(d) ? d : (d?.marketPrices ?? []));
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchPrices("", "");
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPrices(cropSearch, locationSearch);
  };

  const handleClear = () => {
    setCropSearch("");
    setLocationSearch("");
    fetchPrices("", "");
  };

  const hasFilter = cropSearch.trim() !== "" || locationSearch.trim() !== "";

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black text-stone-900 tracking-tight">Market Prices</h1>
        <p className="text-stone-500 text-sm mt-0.5">Current crop prices across Rwandan markets</p>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-3 flex-wrap">
        <input
          type="text"
          value={cropSearch}
          onChange={(e) => setCropSearch(e.target.value)}
          placeholder="Crop name…"
          className="flex-1 min-w-40 rounded-2xl border border-stone-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-all"
        />
        <input
          type="text"
          value={locationSearch}
          onChange={(e) => setLocationSearch(e.target.value)}
          placeholder="Market location…"
          className="flex-1 min-w-40 rounded-2xl border border-stone-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-all"
        />
        <button
          type="submit"
          className="px-5 py-2.5 bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold rounded-full transition-colors"
        >
          Search
        </button>
        {hasFilter && (
          <button
            type="button"
            onClick={handleClear}
            className="px-5 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-600 text-sm font-semibold rounded-full transition-colors"
          >
            Clear
          </button>
        )}
      </form>

      {/* Results */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-brand-500 border-t-transparent" />
        </div>
      ) : prices.length === 0 ? (
        <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center shadow-sm">
          <p className="text-stone-400 font-medium">No market prices found.</p>
          <p className="text-stone-400 text-sm mt-1">Try a different search or check back later.</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {prices.map((price) => (
            <div
              key={price.id}
              className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm space-y-2"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="font-bold text-stone-900 truncate">{price.cropName}</p>
                <span className="text-xs text-stone-400 flex-shrink-0">{fmtDate(price.recordedAt)}</span>
              </div>
              <p className="text-2xl font-black text-brand-600">
                {fmtRwf(price.pricePerUnit)}
                <span className="text-sm font-medium text-stone-400 ml-1">
                  / {price.unit ?? "kg"}
                </span>
              </p>
              <p className="text-xs text-stone-500 flex items-center gap-1.5">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-3.5 h-3.5 text-stone-400 flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                {price.marketLocation}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
