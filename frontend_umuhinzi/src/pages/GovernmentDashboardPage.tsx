const cards = [
  { label: "Farmers Onboarded", value: "12,450", tone: "+8%" },
  { label: "Approved Loans", value: "4,820", tone: "+14%" },
  { label: "Repayment Success", value: "94.2%", tone: "+1.8%" },
  { label: "Active Cooperatives", value: "158", tone: "+6%" },
];

const regions = [
  { name: "Northern Province", farmers: 3240, loans: 1210 },
  { name: "Eastern Province", farmers: 3080, loans: 980 },
  { name: "Southern Province", farmers: 2910, loans: 910 },
  { name: "Western Province", farmers: 2750, loans: 820 },
  { name: "Kigali City", farmers: 470, loans: 900 },
];

export const GovernmentDashboardPage = () => {
  return (
    <div className="min-h-[calc(100vh-4rem)] px-6 py-8">
      <div className="mx-auto max-w-[1400px]">
        <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-stone-900">Government Dashboard</h1>
            <p className="mt-1 text-sm text-stone-500">National rural finance, productivity, and inclusion insights.</p>
          </div>
          <div className="flex gap-3">
            <button className="rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-stone-700 shadow-sm">Filter Regions</button>
            <button className="rounded-full bg-emerald-500 px-5 py-2 text-sm font-semibold text-white shadow-sm">Export Report</button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {cards.map((card) => (
            <div key={card.label} className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
              <div className="text-sm text-stone-500">{card.label}</div>
              <div className="mt-2 text-2xl font-semibold text-stone-900">{card.value}</div>
              <div className="mt-1 text-xs text-stone-400">{card.tone}</div>
            </div>
          ))}
        </div>

        <div className="mt-6 grid gap-4 xl:grid-cols-[1.4fr_0.9fr]">
          <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-stone-900">Regional Performance</h2>
              <span className="rounded-full bg-stone-100 px-3 py-1 text-xs text-stone-500">Updated today</span>
            </div>
            <div className="space-y-4">
              {regions.map((region) => (
                <div key={region.name} className="rounded-2xl border border-stone-100 p-4">
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="font-semibold text-stone-900">{region.name}</span>
                    <span className="text-stone-500">Loans: {region.loans}</span>
                  </div>
                  <div className="h-2 rounded-full bg-stone-100">
                    <div className="h-2 rounded-full bg-emerald-500" style={{ width: `${Math.min(region.farmers / 35, 100)}%` }} />
                  </div>
                  <div className="mt-2 text-xs text-stone-500">Farmers onboarded: {region.farmers}</div>
                </div>
              ))}
            </div>
          </div>

          <aside className="space-y-4">
            <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
              <div className="text-sm text-stone-500">Financial Inclusion Index</div>
              <div className="mt-2 text-4xl font-semibold text-emerald-600">78%</div>
              <p className="mt-2 text-sm text-stone-500">Growth driven by cooperative integration, digital onboarding, and improved repayment behavior.</p>
            </div>
            <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
              <div className="text-sm text-stone-500">Priority Actions</div>
              <div className="mt-3 space-y-2 text-sm text-stone-600">
                <div>Support districts with low repayment stability</div>
                <div>Expand digitization in underserved regions</div>
                <div>Monitor climate-sensitive lending exposure</div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default GovernmentDashboardPage;
