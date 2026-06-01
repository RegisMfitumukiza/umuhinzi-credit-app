const metrics = [
  { label: "Total Exposure", value: "RWF 1.2B", delta: "-2% vs last month" },
  { label: "Avg. Risk Score", value: "64/100", delta: "+2 pts vs last month" },
  { label: "PD (Prob. of Default)", value: "3.8%", delta: "-0.4% vs last month" },
  { label: "Active Loans", value: "4,280", delta: "+1.6% vs last month" },
];

const regionalRisk = [
  { district: "Musanze", profile: "Low", pd: "2.2%" },
  { district: "Rubavu", profile: "Medium", pd: "4.5%" },
  { district: "Kayonza", profile: "High", pd: "7.8%" },
  { district: "Huye", profile: "Medium", pd: "3.5%" },
  { district: "Kicukiro", profile: "Low", pd: "1.5%" },
];

const watchlist = [
  { name: "Imbaraga Cooperative", location: "Kayonza", score: "58/100" },
  { name: "Twitezimbere Group", location: "Rubavu", score: "62/100" },
  { name: "Ubworoherane Farmers", location: "Gatsibo", score: "55/100" },
  { name: "Abatangaza Association", location: "Nyabihu", score: "50/100" },
];

export const CooperativeRiskAnalyticsPage = () => {
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#f7f8fa] px-4 py-6 lg:px-8">
      <div className="mx-auto max-w-[1400px]">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-stone-900">Risk Assessment Analytics</h1>
            <p className="mt-1 text-sm text-stone-500">Portfolio-wide credit exposure and predictive modeling.</p>
          </div>

          <div className="flex gap-3">
            <button className="rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-stone-700 shadow-sm">Filter Views</button>
            <button className="rounded-full bg-emerald-500 px-5 py-2 text-sm font-semibold text-white shadow-sm">Export Risk Report</button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {metrics.map((m) => (
            <div key={m.label} className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
              <div className="text-sm text-stone-500">{m.label}</div>
              <div className="mt-2 flex items-baseline justify-between">
                <div className="text-2xl font-semibold text-stone-900">{m.value}</div>
                <div className="text-xs text-stone-400">{m.delta}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 grid gap-4 xl:grid-cols-[1.6fr_1fr]">
          <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
            <div className="mb-4 grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-semibold text-stone-900">Portfolio Risk Distribution</h3>
                <p className="text-xs text-stone-500">Correlation between loan amount and credit risk score per cooperative.</p>
              </div>
              <div className="text-right">
                <div className="inline-flex items-center gap-2 rounded-full bg-stone-50 px-3 py-1 text-xs text-stone-500">Update: Real-time</div>
              </div>
            </div>

            <div className="rounded-2xl bg-white p-4">
              <svg viewBox="0 0 800 300" className="h-60 w-full" aria-hidden>
                {/* Simple scatter plot mock */}
                {[50, 120, 180, 260, 340, 420, 520, 600].map((x, i) => (
                  <circle key={i} cx={x} cy={80 + (i % 5) * 30} r={8 + (i % 3) * 4} fill="#10b981" opacity={0.9} />
                ))}
                <text x="700" y="20" className="fill-stone-400 text-xs">Loan Amount →</text>
              </svg>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-stone-100 p-4">
                <h4 className="text-sm font-semibold text-stone-900">Regional Risk Concentration</h4>
                <div className="mt-3 space-y-3 text-sm text-stone-600">
                  {regionalRisk.map((r) => (
                    <div key={r.district} className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-stone-900">{r.district}</div>
                        <div className="text-xs text-stone-500">{r.profile}</div>
                      </div>
                      <div className="text-sm text-stone-700">{r.pd}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 text-sm text-emerald-600">View Detailed Regional Map →</div>
              </div>

              <div className="rounded-2xl border border-rose-50 bg-rose-50 p-4">
                <h4 className="text-sm font-semibold text-rose-700">High Alert Watchlist</h4>
                <p className="mt-1 text-xs text-rose-700">Accounts exceeding 80% risk threshold.</p>
                <div className="mt-3 space-y-2 text-sm">
                  {watchlist.map((w) => (
                    <div key={w.name} className="flex items-center justify-between rounded-xl border border-rose-100 bg-white px-3 py-2">
                      <div>
                        <div className="font-semibold text-stone-900">{w.name}</div>
                        <div className="text-xs text-stone-500">{w.location}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-xs font-semibold text-rose-600">{w.score}</div>
                        <button className="rounded-full bg-white border border-stone-100 px-3 py-1 text-xs text-stone-600">Review</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <aside className="space-y-4">
            <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
              <h4 className="text-sm font-semibold text-stone-900">Scenario Modeler</h4>
              <p className="mt-1 text-xs text-stone-500">Simulate impact of macro factors on portfolio risk.</p>
              <div className="mt-4 space-y-4">
                <div>
                  <div className="text-xs text-stone-600">Projected Rainfall</div>
                  <input type="range" min={0} max={100} defaultValue={70} className="w-full" />
                </div>
                <div>
                  <div className="text-xs text-stone-600">Commodity Price Volatility</div>
                  <input type="range" min={0} max={100} defaultValue={30} className="w-full" />
                </div>
                <div className="rounded-2xl border border-rose-100 bg-rose-50 p-3">
                  <div className="text-sm font-semibold text-rose-700">CRITICAL WARNING</div>
                  <div className="mt-2 text-xs text-rose-700">Under the current Rainfall projection, PD for Kayonza is projected to rise to 12.4% by Q3.</div>
                </div>
                <button className="w-full rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white">Run Simulation Model</button>
              </div>
            </div>

            <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
              <h4 className="text-sm font-semibold text-stone-900">Risk Documentation</h4>
              <div className="mt-3 space-y-2 text-sm text-stone-600">
                <div className="flex items-center justify-between">
                  <div>Risk Policy 2024.v2</div>
                  <div className="text-xs text-stone-500">PDF</div>
                </div>
                <div className="flex items-center justify-between">
                  <div>Sector Audit Guidelines</div>
                  <div className="text-xs text-stone-500">DOCX</div>
                </div>
                <div className="flex items-center justify-between">
                  <div>Internal Review Memo</div>
                  <div className="text-xs text-stone-500">PDF</div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};
