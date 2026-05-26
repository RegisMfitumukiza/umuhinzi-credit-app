const topStats = [
  { label: "Total Portfolio Value", value: "RWF 1.2B", tone: "+8%" },
  { label: "Avg. Repayment Rate", value: "94.2%", tone: "+1.2%" },
  { label: "Farmer Inclusion", value: "12,450", tone: "+4%" },
  { label: "Active Cooperatives", value: "158", tone: "-2%" },
];

const recentExports = [
  { id: "exp-001", name: "Portfolio_Summary_Q1.pdf", date: "2026-04-22", size: "1.2MB" },
  { id: "exp-002", name: "Regional_Yield_Analysis.xlsx", date: "2026-03-18", size: "2.8MB" },
  { id: "exp-003", name: "Top_Cooperatives.csv", date: "2026-02-10", size: "480KB" },
];

const topCooperatives = [
  ["Abahinzi Farmers Group", "RWF 4.2M"],
  ["Kigali Highlands Co-op", "RWF 3.6M"],
  ["Nyagatare Growers", "RWF 3.1M"],
  ["Gisenyi Agro Union", "RWF 2.8M"],
];

export const CooperativeReportsPage = () => {
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#f7f8fa] px-4 py-6 lg:px-8">
      <div className="mx-auto max-w-[1400px]">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-stone-900">Reports & Analytics</h1>
            <p className="mt-1 text-sm text-stone-500">Strategic oversight and data-driven impact assessment for your cooperative.</p>
          </div>

          <div className="flex gap-3">
            <button className="rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-stone-700 shadow-sm">Filter Views</button>
            <button className="rounded-full bg-emerald-500 px-5 py-2 text-sm font-semibold text-white shadow-sm">Share Dashboard</button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {topStats.map((stat) => (
            <div key={stat.label} className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <div className="text-sm text-stone-500">{stat.label}</div>
                <span className="rounded-full border border-stone-200 px-2 py-1 text-[11px] text-stone-500">{stat.tone}</span>
              </div>
              <div className="text-2xl font-semibold text-stone-900">{stat.value}</div>
            </div>
          ))}
        </div>

        <div className="mt-4 grid gap-4 xl:grid-cols-[1.45fr_0.65fr]">
          <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-stone-900">Financial Disbursement vs. Repayment</h2>
                <p className="text-xs text-stone-500">Consolidated lending and repayment across the last 12 months</p>
              </div>
              <div className="rounded-full bg-stone-100 px-3 py-1 text-xs text-stone-500">View: Last 12 months</div>
            </div>

            <div className="rounded-2xl bg-gradient-to-b from-white to-stone-50 p-4">
              <svg viewBox="0 0 800 260" className="h-48 w-full" role="img" aria-label="Disbursement vs Repayment">
                <defs>
                  <linearGradient id="repFill" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#22c55e" stopOpacity="0.18" />
                    <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <rect x="0" y="0" width="800" height="260" fill="transparent" />
                <polyline points="40,200 120,180 200,150 280,140 360,130 440,120 520,110 600,95 680,80" fill="none" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                <polyline points="40,220 120,200 200,170 280,162 360,150 440,138 520,128 600,118 680,110" fill="none" stroke="#fb923c" strokeWidth="3" strokeDasharray="6 6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm text-center">
              <div className="text-sm text-stone-500">Portfolio Distribution</div>
              <div className="mt-4 flex items-center justify-center">
                <svg viewBox="0 0 120 120" className="h-28 w-28 -rotate-90" aria-hidden>
                  <circle cx="60" cy="60" r="34" fill="none" stroke="#e5e7eb" strokeWidth="12" />
                  <circle cx="60" cy="60" r="34" fill="none" stroke="#22c55e" strokeWidth="12" strokeDasharray="214 214" strokeDashoffset="0" strokeLinecap="round" />
                </svg>
              </div>
              <div className="mt-3 text-2xl font-semibold text-stone-900">92%</div>
              <div className="mt-1 text-xs text-stone-500">Healthy portfolio</div>
            </div>

            <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-stone-900">Top Performing Cooperatives</h3>
                <button className="text-xs text-stone-500">Export</button>
              </div>
              <div className="space-y-2">
                {topCooperatives.map(([name, val]) => (
                  <div key={name} className="flex items-center justify-between rounded-xl border border-stone-100 px-3 py-2">
                    <div className="text-sm text-stone-900">{name}</div>
                    <div className="text-sm font-semibold text-stone-900">{val}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-4 xl:grid-cols-[1fr_0.8fr]">
          <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-stone-900">Regional Yield Performance</h2>
              <button className="text-xs text-stone-500">Compare Regions</button>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-2xl border border-stone-100 p-4">
                <div className="text-sm font-semibold text-stone-900">Kigali</div>
                <div className="mt-4 h-28">
                  <svg viewBox="0 0 200 100" className="h-full w-full" aria-hidden>
                    <rect x="10" y="30" width="30" height="60" fill="#22c55e" />
                    <rect x="60" y="10" width="30" height="80" fill="#60a5fa" />
                    <rect x="110" y="50" width="30" height="40" fill="#f59e0b" />
                  </svg>
                </div>
              </div>
              <div className="rounded-2xl border border-stone-100 p-4">
                <div className="text-sm font-semibold text-stone-900">Eastern</div>
                <div className="mt-4 h-28">
                  <svg viewBox="0 0 200 100" className="h-full w-full" aria-hidden>
                    <rect x="10" y="20" width="30" height="70" fill="#22c55e" />
                    <rect x="60" y="40" width="30" height="50" fill="#60a5fa" />
                    <rect x="110" y="60" width="30" height="30" fill="#f59e0b" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-stone-900">Export Engine</h3>
            <p className="mt-1 text-xs text-stone-500">Generate CSV or PDF exports for analysis</p>
            <div className="mt-3 space-y-3">
              <div className="flex items-center gap-2">
                <input className="rounded-xl border border-stone-200 px-3 py-2 text-sm" placeholder="From date" />
                <input className="rounded-xl border border-stone-200 px-3 py-2 text-sm" placeholder="To date" />
              </div>
              <div className="flex items-center gap-2">
                <select className="rounded-xl border border-stone-200 px-3 py-2 text-sm">
                  <option>CSV</option>
                  <option>PDF</option>
                </select>
                <button className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white">Download Report</button>
              </div>
            </div>

            <div className="mt-4">
              <div className="text-sm font-semibold text-stone-900">Recent Exports</div>
              <div className="mt-2 space-y-2">
                {recentExports.map((exp) => (
                  <div key={exp.id} className="flex items-center justify-between rounded-xl border border-stone-100 px-3 py-2">
                    <div className="text-sm text-stone-900">{exp.name}</div>
                    <div className="text-xs text-stone-500">{exp.date} • {exp.size}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CooperativeReportsPage;
