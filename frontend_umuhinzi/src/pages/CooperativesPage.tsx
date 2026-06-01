export const CooperativesPage = () => {
  const trendPoints = "40,215 110,235 180,110 250,198 320,162 390,172 460,154 530,176 600,168";
  const donutSegments = [
    { dasharray: "214 214", offset: 0, color: "#22c55e" },
    { dasharray: "88 214", offset: -214, color: "#86efac" },
    { dasharray: "34 214", offset: -302, color: "#f59e0b" },
  ];

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#f7f8fa] px-4 py-6 lg:px-8">
      <div className="mx-auto max-w-[1400px]">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-stone-900">Cooperative Overview</h1>
            <p className="mt-1 text-sm text-stone-500">Monitor your group's productivity, financial health, and member performance.</p>
          </div>

          <div className="flex gap-3">
            <button className="rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-stone-700 shadow-sm">Reports</button>
            <button className="rounded-full bg-emerald-500 px-5 py-2 text-sm font-semibold text-white shadow-sm">Manage Loans</button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard title="Total Members" value="1,240" delta="12.5%" accent="blue" />
          <StatCard title="Group Loan Volume" value="RWF 45.2M" delta="8.2%" accent="green" />
          <StatCard title="Avg. Productivity" value="4.2 T/Ha" delta="15.1%" accent="orange" />
          <StatCard title="Repayment Rate" value="98.4%" delta="2.4%" accent="emerald" />
        </div>

        <div className="mt-4 grid gap-4 xl:grid-cols-[1.6fr_0.8fr]">
          <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-stone-900">Seasonal Productivity Trends</h2>
                <p className="text-xs text-stone-500">Historical yield data across primary crops (Tonnes/Hectare)</p>
              </div>
              <span className="rounded-full bg-stone-100 px-3 py-1 text-xs text-stone-600">2023 Season</span>
            </div>

            <div className="relative h-[320px] rounded-xl bg-gradient-to-b from-white to-stone-50 p-4">
              <div className="absolute left-4 top-4 text-xs text-stone-400">10,000</div>
              <div className="absolute left-4 top-[25%] text-xs text-stone-400">7,500</div>
              <div className="absolute left-4 top-[50%] text-xs text-stone-400">5,000</div>
              <div className="absolute left-4 top-[75%] text-xs text-stone-400">2,500</div>
              <div className="absolute bottom-4 left-16 right-6 h-px border-t border-dashed border-stone-200" />

              <svg viewBox="0 0 640 240" className="h-full w-full" role="img" aria-label="Seasonal productivity trend chart">
                <defs>
                  <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22c55e" stopOpacity="0.18" />
                    <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
                  </linearGradient>
                </defs>

                {[40, 95, 150, 205].map((y) => (
                  <line key={y} x1="36" y1={y} x2="610" y2={y} stroke="#ececec" strokeDasharray="4 6" />
                ))}

                <polyline
                  points={`${trendPoints} 600,235 40,235`}
                  fill="url(#trendFill)"
                  stroke="none"
                />
                <polyline
                  points={trendPoints}
                  fill="none"
                  stroke="#22c55e"
                  strokeWidth="3"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
                <polyline
                  points="40,190 110,210 180,58 250,148 320,121 390,150 460,136 530,142 600,128"
                  fill="none"
                  stroke="#fb923c"
                  strokeWidth="3"
                  strokeDasharray="6 6"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />

                {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"].map((label, index) => (
                  <text key={label} x={40 + index * 95} y="220" textAnchor="middle" className="fill-stone-400 text-[11px]">
                    {label}
                  </text>
                ))}
              </svg>

              <div className="absolute bottom-5 left-1/2 flex -translate-x-1/2 gap-6 text-xs text-stone-500">
                <span className="inline-flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-emerald-500" />Maize</span>
                <span className="inline-flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-orange-400" />Coffee</span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-stone-900">Harvest & Financials</h2>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs text-emerald-600">Live</span>
            </div>

            <div className="space-y-3">
              <TimelineItem month="OCT" day="15" title="Coffee Harvest Start" status="Completed" />
              <TimelineItem month="NOV" day="02" title="First Quarter Repayment" status="In Progress" />
              <TimelineItem month="DEC" day="10" title="Input Distribution (Seed)" status="Upcoming" />
              <TimelineItem month="JAN" day="05" title="Annual Group Meeting" status="Upcoming" />
            </div>

            <div className="mt-4 text-center text-sm text-stone-500">View Full Calendar</div>
          </div>
        </div>

        <div className="mt-4 grid gap-4 xl:grid-cols-[1.2fr_0.9fr]">
          <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-stone-900">Member Performance</h2>
              <button className="rounded-full border border-stone-200 px-4 py-2 text-sm text-stone-600">View All</button>
            </div>

            <div className="space-y-3">
              {[
                ["#1", "Alice Mutoni", "Repayment: 100%", "5.2 T/Ha", "Top Performer"],
                ["#2", "Jean Gakweya", "Repayment: 98%", "4.9 T/Ha", ""],
                ["#3", "Safi Uwineza", "Repayment: 100%", "4.8 T/Ha", ""],
                ["#4", "Emile Karemera", "Repayment: 95%", "4.5 T/Ha", ""],
                ["#5", "Grace Uwera", "Repayment: 99%", "4.4 T/Ha", ""],
              ].map(([rank, name, meta, value, tag]) => (
                <div key={rank} className="flex items-center justify-between rounded-xl border border-stone-100 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="w-8 text-sm font-semibold text-stone-400">{rank}</span>
                    <div>
                      <div className="text-sm font-semibold text-stone-900">{name}</div>
                      <div className="text-xs text-stone-500">{meta}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-stone-900">{value}</div>
                    {tag ? <span className="mt-1 inline-block rounded-full bg-amber-100 px-2 py-1 text-[11px] font-semibold text-amber-700">{tag}</span> : null}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-stone-900">Group Loan Status</h2>
              <span className="rounded-full bg-stone-100 px-3 py-1 text-xs text-stone-500">Real-time</span>
            </div>

            <div className="flex h-[280px] items-center justify-center rounded-xl bg-stone-50">
              <div className="relative h-52 w-52">
                <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90" aria-label="Group loan status donut chart" role="img">
                  <circle cx="60" cy="60" r="34" fill="none" stroke="#e5e7eb" strokeWidth="12" />
                  {donutSegments.map((segment) => (
                    <circle
                      key={`${segment.color}-${segment.offset}`}
                      cx="60"
                      cy="60"
                      r="34"
                      fill="none"
                      stroke={segment.color}
                      strokeWidth="12"
                      strokeLinecap="round"
                      strokeDasharray={segment.dasharray}
                      strokeDashoffset={segment.offset}
                    />
                  ))}
                </svg>

                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <div className="text-3xl font-semibold text-stone-900">1,240</div>
                  <div className="text-[11px] font-medium tracking-[0.25em] text-stone-400">TOTAL LOANS</div>
                </div>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-3 gap-3 text-center text-sm">
              <div>
                <div className="text-emerald-500">Fully Repaid</div>
                <div className="mt-1 font-semibold text-stone-900">540</div>
              </div>
              <div>
                <div className="text-emerald-500">Active</div>
                <div className="mt-1 font-semibold text-stone-900">620</div>
              </div>
              <div>
                <div className="text-amber-500">Pending</div>
                <div className="mt-1 font-semibold text-stone-900">80</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, delta, accent }: { title: string; value: string; delta: string; accent: "blue" | "green" | "orange" | "emerald" }) => {
  const accentClasses = {
    blue: "from-blue-50 to-white text-blue-600",
    green: "from-emerald-50 to-white text-emerald-600",
    orange: "from-orange-50 to-white text-orange-600",
    emerald: "from-emerald-50 to-white text-emerald-600",
  };

  return (
    <div className="rounded-2xl border border-stone-200 bg-gradient-to-b p-5 shadow-sm" style={{ backgroundImage: `linear-gradient(to bottom, white, white), linear-gradient(to bottom, var(--tw-gradient-stops))` }}>
      <div className="mb-5 flex items-center justify-between">
        <div className={`flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br ${accentClasses[accent].split(" ").slice(0, 2).join(" ")}`}>+</div>
        <span className="rounded-full border border-stone-200 px-2 py-1 text-[11px] text-stone-500">↗ {delta}</span>
      </div>
      <div className="text-sm text-stone-500">{title}</div>
      <div className="mt-1 text-2xl font-semibold text-stone-900">{value}</div>
    </div>
  );
};

const TimelineItem = ({ month, day, title, status }: { month: string; day: string; title: string; status: string }) => {
  const statusClass = status === "Completed" ? "bg-emerald-100 text-emerald-700" : status === "In Progress" ? "bg-stone-100 text-stone-700" : "bg-amber-100 text-amber-700";

  return (
    <div className="flex items-center gap-3 rounded-xl border border-stone-100 p-3">
      <div className="w-12 rounded-xl border border-stone-200 bg-stone-50 py-2 text-center">
        <div className="text-[10px] font-semibold text-stone-500">{month}</div>
        <div className="text-lg font-semibold text-stone-900">{day}</div>
      </div>
      <div className="flex-1">
        <div className="text-sm font-semibold text-stone-900">{title}</div>
        <div className="text-xs text-stone-500">• Financial</div>
      </div>
      <span className={`rounded-full px-2 py-1 text-[11px] font-semibold ${statusClass}`}>{status}</span>
    </div>
  );
};
