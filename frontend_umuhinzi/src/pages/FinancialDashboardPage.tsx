export const FinancialDashboardPage = () => {
  const recent = [
    { name: "Ancet Murangira", amount: "RWF 1,200,000", sector: "Coffee", status: "In Review" },
    { name: "Beatrice Uwimana", amount: "RWF 850,000", sector: "Maize", status: "Pending" },
    { name: "Emmanuel Gatete", amount: "RWF 2,100,000", sector: "Livestock", status: "Pending" },
    { name: "Clara Mukantabana", amount: "RWF 450,000", sector: "Tea", status: "In Review" },
    { name: "Didier Nsabimana", amount: "RWF 1,750,000", sector: "Coffee", status: "Pending" },
  ];

  const sectors = [
    { name: "Coffee", color: "bg-green-500" },
    { name: "Maize", color: "bg-yellow-400" },
    { name: "Tea", color: "bg-blue-400" },
    { name: "Livestock", color: "bg-amber-500" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-stone-900">Financial Dashboard</h2>
          <p className="mt-1 text-sm text-stone-500">Welcome back, Jean-Paul. Here is the overview of the loan portfolio for Q3 2024.</p>
        </div>
        <div className="flex gap-3">
          <button className="rounded-full border border-stone-200 bg-white px-4 py-2 text-sm">Audit Logs</button>
          <button className="rounded-full bg-brand-500 px-4 py-2 text-sm font-semibold text-white">New Review Process</button>
        </div>
      </div>

      <section className="grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-panel">
          <p className="text-sm text-stone-500">Active Portfolio</p>
          <p className="mt-2 text-2xl font-semibold">RWF 842.5M</p>
        </div>
        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-panel">
          <p className="text-sm text-stone-500">Active Farmers</p>
          <p className="mt-2 text-2xl font-semibold">2,482</p>
        </div>
        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-panel">
          <p className="text-sm text-stone-500">NPL Ratio</p>
          <p className="mt-2 text-2xl font-semibold">3.1%</p>
        </div>
        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-panel">
          <p className="text-sm text-stone-500">Loan Recovery</p>
          <p className="mt-2 text-2xl font-semibold">96.4%</p>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-panel">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Financial Performance</h3>
            <div className="text-sm text-stone-500">Monthly</div>
          </div>
          <div className="mt-6 h-56 rounded-lg bg-stone-50" />
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-panel">
            <h3 className="text-lg font-semibold">Portfolio by Sector</h3>
            <div className="mt-6 flex items-center gap-4">
              <div className="h-40 w-40 rounded-full bg-gradient-to-r from-green-300 to-emerald-400" />
              <div className="flex flex-1 flex-col gap-2">
                {sectors.map((s) => (
                  <div key={s.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`h-3 w-3 rounded-full ${s.color}`} />
                      <p className="text-sm text-stone-700">{s.name}</p>
                    </div>
                    <p className="text-sm text-stone-600">{Math.floor(Math.random() * 40) + 10}%</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-panel">
            <h3 className="text-lg font-semibold">Recent Applications</h3>
            <div className="mt-4 space-y-3">
              {recent.map((r) => (
                <div key={r.name} className="flex items-center justify-between rounded-md border border-stone-100 p-3">
                  <div>
                    <p className="font-semibold text-stone-900">{r.name}</p>
                    <p className="text-sm text-stone-500">{r.sector}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{r.amount}</p>
                    <p className="text-sm text-stone-500">{r.status}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-panel">Regional Risk Index (placeholder)</div>
        <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-panel">Audit Summary (placeholder)</div>
        <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-panel">Quick Actions (placeholder)</div>
      </section>
    </div>
  );
};
