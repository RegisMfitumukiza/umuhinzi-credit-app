const farmPlots = [
  {
    name: "Eastern Hill Plot A",
    crop: "Arabica Coffee",
    size: "12.4 Hectares",
    health: "94%",
    tag: "Mature",
  },
  {
    name: "Riverside Maize Field",
    crop: "Sweet Corn",
    size: "8.2 Hectares",
    health: "63%",
    tag: "Growing",
  },
  {
    name: "Kayonza Highlands",
    crop: "Bananas & Plantains",
    size: "15.0 Hectares",
    health: "88%",
    tag: "Harvesting",
  },
];

const livestock = [
  { name: "Cattle", total: "12 Heads Total", status: "Excellent" },
  { name: "Goats", total: "24 Heads Total", status: "Stable" },
  { name: "Poultry", total: "150 Heads Total", status: "Optimal" },
];

export const FarmDashboardPage = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-stone-400">Dashboard &gt; Farm Management</p>
        <h2 className="text-2xl font-semibold text-stone-900">Farmer Profile & Farm Management</h2>
      </div>

      <section className="rounded-[1.75rem] border border-stone-200 bg-white p-6 shadow-panel">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="h-20 w-20 overflow-hidden rounded-full bg-[linear-gradient(135deg,#d8f3dc_0%,#95d5b2_100%)] ring-4 ring-brand-100">
              <div className="flex h-full w-full items-center justify-center text-3xl">👨🏾‍🌾</div>
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h3 className="text-2xl font-semibold text-stone-900">Jean Bosco Ntaganda</h3>
                <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-600">Verified Pro</span>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-stone-500">
                <span>Kayonza District, Eastern Province</span>
                <span>Joined March 2021</span>
                <span className="font-medium text-brand-600">Credit Tier: Gold</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button className="rounded-full border border-stone-200 bg-white px-5 py-2.5 text-sm font-semibold text-stone-700">Edit Profile</button>
            <button className="rounded-full bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-500/20">View Public CV</button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <article className="rounded-2xl border border-stone-200 bg-white p-5 shadow-panel">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-stone-400">Total land managed</p>
          <h3 className="mt-2 text-3xl font-semibold text-stone-900">42.5 Ha</h3>
        </article>
        <article className="rounded-2xl border border-stone-200 bg-white p-5 shadow-panel">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-stone-400">Current crop diversity</p>
          <h3 className="mt-2 text-3xl font-semibold text-stone-900">4 Species</h3>
        </article>
        <article className="rounded-2xl border border-stone-200 bg-white p-5 shadow-panel">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-stone-400">Verified livestock</p>
          <h3 className="mt-2 text-3xl font-semibold text-stone-900">186 Heads</h3>
        </article>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(320px,0.9fr)]">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-stone-900">Registered Farm Plots</h3>
            <div className="flex gap-2">
              <button className="rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-stone-600">Filter</button>
              <button className="rounded-full bg-brand-500 px-4 py-2 text-sm font-semibold text-white">+ Add Farm</button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-2">
            {farmPlots.map((plot) => (
              <article key={plot.name} className="overflow-hidden rounded-[1.5rem] border border-stone-200 bg-white shadow-panel">
                <div className="h-36 bg-[linear-gradient(135deg,#5aa95b_0%,#2d6a4f_45%,#d9ed92_100%)]" />
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="text-base font-semibold text-stone-900">{plot.name}</h4>
                      <p className="mt-1 text-sm text-stone-500">{plot.size}</p>
                    </div>
                    <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">{plot.tag}</span>
                  </div>
                  <div className="mt-4 flex items-center justify-between text-sm text-stone-500">
                    <span>CROP HEALTH INDEX</span>
                    <span className="font-semibold text-brand-700">{plot.health}</span>
                  </div>
                  <div className="mt-3 h-2 rounded-full bg-stone-100">
                    <div className="h-2 rounded-full bg-brand-500" style={{ width: plot.health }} />
                  </div>
                  <div className="mt-4 flex items-center justify-between text-sm">
                    <span className="font-medium text-stone-700">{plot.crop}</span>
                    <button className="font-semibold text-brand-600">Details</button>
                  </div>
                </div>
              </article>
            ))}

            <article className="flex min-h-[22rem] items-center justify-center rounded-[1.5rem] border border-dashed border-stone-300 bg-white p-6 text-center shadow-panel">
              <div>
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-stone-100 text-2xl text-stone-500">+</div>
                <h4 className="mt-4 text-lg font-semibold text-stone-900">Add New Farm Plot</h4>
                <p className="mt-2 text-sm text-stone-500">Register new land assets to improve your credit score and unlock larger loans.</p>
              </div>
            </article>
          </div>

          <article className="rounded-2xl border border-stone-200 bg-white p-4 shadow-panel">
            <div className="flex items-center gap-3 text-sm text-stone-600">
              <span className="rounded-full bg-amber-50 px-2 py-1 text-amber-700">Weather</span>
              <p>High humidity expected in Eastern Kayonza. Risk of fungal blight for maize plots is moderate.</p>
              <span className="rounded-full bg-stone-100 px-2 py-1 text-stone-500">Advisory</span>
            </div>
          </article>
        </div>

        <div className="space-y-4">
          <section className="rounded-[1.5rem] border border-stone-200 bg-white p-5 shadow-panel">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-stone-900">Livestock Ledger</h3>
              <button className="text-lg font-semibold text-stone-400">+</button>
            </div>
            <div className="space-y-3">
              {livestock.map((item) => (
                <div key={item.name} className="rounded-2xl border border-stone-200 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-semibold text-stone-900">{item.name}</p>
                      <p className="text-sm text-stone-500">{item.total}</p>
                    </div>
                    <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">{item.status}</span>
                  </div>
                </div>
              ))}
            </div>
            <button className="mt-4 text-sm font-semibold text-brand-600">Download Asset Report (PDF)</button>
          </section>

          <section className="rounded-[1.5rem] border border-stone-200 bg-white p-5 shadow-panel">
            <h3 className="text-lg font-semibold text-stone-900">Data Verification</h3>
            <p className="mt-2 text-sm text-stone-500">Keep your profile 100% verified</p>
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex items-center justify-between"><span>Identity Document</span><span className="font-semibold text-brand-600">Verified</span></div>
              <div className="flex items-center justify-between"><span>Land Title Deeds</span><span className="font-semibold text-brand-600">Verified</span></div>
              <div className="flex items-center justify-between"><span>Recent Yield Records</span><span className="font-semibold text-amber-600">Pending</span></div>
            </div>
            <div className="mt-4 h-2 rounded-full bg-stone-100">
              <div className="h-2 w-[82%] rounded-full bg-brand-500" />
            </div>
            <button className="mt-4 w-full rounded-full border border-stone-200 bg-white px-4 py-2.5 text-sm font-semibold text-stone-700">Upload Documents</button>
          </section>

          <section className="space-y-3">
            <div className="rounded-2xl border border-stone-200 bg-white px-4 py-4 shadow-panel">
              <div className="flex items-center justify-between">
                <span className="font-medium text-stone-700">Irrigation Records</span>
                <span className="text-stone-400">›</span>
              </div>
            </div>
            <div className="rounded-2xl border border-stone-200 bg-white px-4 py-4 shadow-panel">
              <div className="flex items-center justify-between">
                <span className="font-medium text-stone-700">Fertilizer Log</span>
                <span className="text-stone-400">›</span>
              </div>
            </div>
          </section>
        </div>
      </section>
    </div>
  );
};
