const schedule = [
  { date: "Oct 15, 2024", title: "Installment 4 of 12 - Seed & Fertilizer Loan", amount: "RWF 45,000", status: "Upcoming" },
  { date: "Nov 15, 2024", title: "Installment 5 of 12", amount: "RWF 45,000", status: "Scheduled" },
  { date: "Dec 15, 2024", title: "Installment 6 of 12", amount: "RWF 45,000", status: "Scheduled" },
];

const history = [
  { date: "Sep 15, 2024", transactionId: "TXN-8921", method: "MTN Mobile Money", ref: "MM-882-X", amount: "RWF 45,000", status: "Success" },
  { date: "Aug 15, 2024", transactionId: "TXN-7734", method: "MTN Mobile Money", ref: "MM-112-A", amount: "RWF 45,000", status: "Success" },
  { date: "Jul 15, 2024", transactionId: "TXN-2210", method: "Airtel Money", ref: "AM-990-Q", amount: "RWF 45,000", status: "Success" },
  { date: "Jun 28, 2024", transactionId: "TXN-1104", method: "Bank Transfer", ref: "BK-001-P", amount: "RWF 12,500", status: "Failed" },
  { date: "Jun 15, 2024", transactionId: "TXN-0082", method: "MTN Mobile Money", ref: "MM-005-X", amount: "RWF 45,000", status: "Success" },
];

export const PaymentsPage = () => {
  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-3xl font-semibold text-stone-900">Repayment Dashboard</h2>
          <p className="mt-2 text-sm text-stone-500">Manage your loan obligations and track payment history via Mobile Money.</p>
        </div>
        <div className="flex gap-3">
          <button className="rounded-full border border-stone-200 bg-white px-5 py-2.5 text-sm font-semibold text-stone-700 shadow-sm">Export Ledger</button>
          <button className="rounded-full bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-500/20">Quick Pay (USSD)</button>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(300px,0.7fr)]">
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <article className="rounded-2xl border border-stone-200 bg-white p-5 shadow-panel">
              <p className="text-sm text-stone-500">Remaining Balance</p>
              <h3 className="mt-3 text-3xl font-semibold text-stone-900">RWF 360,000</h3>
              <p className="mt-2 text-xs text-stone-400">Total debt outstanding -12% vs last month</p>
            </article>
            <article className="rounded-2xl border border-stone-200 bg-white p-5 shadow-panel">
              <p className="text-sm text-stone-500">Next Due Date</p>
              <h3 className="mt-3 text-3xl font-semibold text-stone-900">Oct 15, 2024</h3>
              <p className="mt-2 text-xs text-stone-400">In 12 days</p>
            </article>
            <article className="rounded-2xl border border-stone-200 bg-white p-5 shadow-panel">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm text-stone-500">Repayment Progress</p>
                  <h3 className="mt-3 text-3xl font-semibold text-stone-900">65%</h3>
                </div>
                <div className="rounded-full bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700">+2%</div>
              </div>
              <div className="mt-4 h-2 rounded-full bg-stone-100">
                <div className="h-2 w-[65%] rounded-full bg-brand-500" />
              </div>
              <p className="mt-2 text-xs text-stone-400">RWF 540,000 paid</p>
            </article>
          </div>

          <article className="rounded-[1.5rem] border border-stone-200 bg-white p-5 shadow-panel">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-xl font-semibold text-stone-900">Upcoming Schedule</h3>
                <p className="mt-1 text-sm text-stone-500">View your next 3 scheduled installments</p>
              </div>
              <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">Active Loan: SF-2024-001</span>
            </div>

            <div className="mt-5 space-y-3">
              {schedule.map((item) => (
                <div key={item.date + item.title} className="rounded-2xl border border-stone-200 p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-stone-900">{item.date}</p>
                      <p className="mt-1 text-sm text-stone-600">{item.status}</p>
                      <p className="mt-2 text-sm text-stone-700">{item.title}</p>
                    </div>
                    <div className="flex items-center gap-3 md:text-right">
                      <div>
                        <p className="text-sm font-semibold text-brand-600">{item.amount}</p>
                      </div>
                      <button className="rounded-full bg-brand-500 px-4 py-2 text-sm font-semibold text-white">Pay Now</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 text-center text-sm font-medium text-stone-500">View Full 12-Month Schedule →</div>
          </article>

          <article className="rounded-[1.5rem] border border-stone-200 bg-white p-5 shadow-panel">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-xl font-semibold text-stone-900">Payment History</h3>
                <p className="mt-1 text-sm text-stone-500">Your last 5 mobile money transactions</p>
              </div>
              <div className="flex gap-2">
                <button className="rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-stone-600">Filter</button>
                <button className="rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-stone-600">Download CSV</button>
              </div>
            </div>

            <div className="mt-5 overflow-hidden rounded-2xl border border-stone-200">
              <table className="min-w-full divide-y divide-stone-200 text-sm">
                <thead className="bg-stone-50 text-left text-xs uppercase tracking-[0.2em] text-stone-400">
                  <tr>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Transaction ID</th>
                    <th className="px-4 py-3">Method</th>
                    <th className="px-4 py-3">Ref Number</th>
                    <th className="px-4 py-3">Amount</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 bg-white text-stone-700">
                  {history.map((row) => (
                    <tr key={row.transactionId}>
                      <td className="px-4 py-4">{row.date}</td>
                      <td className="px-4 py-4">{row.transactionId}</td>
                      <td className="px-4 py-4">{row.method}</td>
                      <td className="px-4 py-4">{row.ref}</td>
                      <td className="px-4 py-4 font-semibold text-stone-900">{row.amount}</td>
                      <td className="px-4 py-4">
                        <span className={row.status === "Success" ? "rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700" : "rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700"}>
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-3 flex items-center justify-between text-sm text-stone-500">
              <p>Showing 5 of 24 transactions</p>
              <div className="flex gap-2">
                <button className="rounded-full border border-stone-200 bg-white px-4 py-2 text-sm">Previous</button>
                <button className="rounded-full border border-stone-200 bg-white px-4 py-2 text-sm">Next Page</button>
              </div>
            </div>
          </article>

          <section className="grid gap-4 md:grid-cols-2">
            <article className="rounded-2xl border border-stone-200 bg-white p-5 shadow-panel">
              <h3 className="text-lg font-semibold text-stone-900">Repayment Policy</h3>
              <p className="mt-2 text-sm text-stone-600">Payments made via Mobile Money are typically processed within 5-10 minutes. If your balance doesn’t update after an hour, please contact support or check the transaction ID.</p>
            </article>
            <article className="rounded-2xl border border-stone-200 bg-white p-5 shadow-panel">
              <h3 className="text-lg font-semibold text-stone-900">Having trouble paying?</h3>
              <p className="mt-2 text-sm text-stone-600">We understand farming can be unpredictable. If you anticipate a delay in repayment, contact your cooperative manager before the due date to discuss restructuring options.</p>
            </article>
          </section>
        </div>

        <div className="space-y-4">
          <article className="rounded-[1.5rem] border border-stone-200 bg-white p-5 shadow-panel">
            <h3 className="text-lg font-semibold text-stone-900">Payment Method</h3>
            <p className="mt-1 text-sm text-stone-500">Primary account for USD prompts</p>

            <div className="mt-4 rounded-2xl border border-stone-200 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-stone-900">MTN Mobile Money</p>
                  <p className="mt-1 text-sm text-stone-500">+250 789 *** 123</p>
                </div>
                <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-500">Primary</span>
              </div>
            </div>

            <button className="mt-3 w-full rounded-full border border-stone-200 bg-white px-4 py-2.5 text-sm font-semibold text-stone-700">Change Method</button>
          </article>

          <article className="rounded-[1.5rem] border border-stone-200 bg-brand-50 p-5 shadow-panel">
            <div className="flex items-center gap-3 text-brand-700">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white">✓</div>
              <div>
                <h3 className="text-lg font-semibold text-brand-900">Good Standing</h3>
                <p className="mt-1 text-sm text-brand-800">You have paid 6/12 installments on time. Maintain this to unlock larger loan limits.</p>
              </div>
            </div>
            <button className="mt-4 text-sm font-semibold text-brand-700">View Credit Score Impact</button>
          </article>
        </div>
      </section>
    </div>
  );
};
