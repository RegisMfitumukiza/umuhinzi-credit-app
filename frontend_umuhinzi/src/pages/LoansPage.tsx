const loanSteps = ["Details", "Project", "Documents", "Review"];

const termOptions = ["3 Months", "6 Months", "12 Months", "18 Months"];

export const LoansPage = () => {
  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-3xl font-semibold text-stone-900">Loan Application</h2>
          <p className="mt-2 text-sm text-stone-500">Fill out the details below to secure your agricultural funding.</p>
        </div>
        <span className="inline-flex items-center rounded-full bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-700">Ref No: UC-2024-8842</span>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(300px,0.7fr)]">
        <div className="space-y-5">
          <div className="flex items-center justify-between gap-2 rounded-2xl border border-stone-200 bg-white p-5 shadow-panel">
            {loanSteps.map((step, index) => (
              <div key={step} className="flex flex-1 items-center gap-3">
                <div className={index === 0 ? "flex h-9 w-9 items-center justify-center rounded-full bg-brand-500 text-sm font-semibold text-white" : "flex h-9 w-9 items-center justify-center rounded-full border border-stone-300 text-sm font-semibold text-stone-500"}>
                  {index + 1}
                </div>
                <div>
                  <p className={index === 0 ? "text-sm font-semibold text-brand-700" : "text-sm font-medium text-stone-500"}>{step}</p>
                </div>
                {index < loanSteps.length - 1 ? <div className="mx-2 hidden h-px flex-1 bg-stone-200 md:block" /> : null}
              </div>
            ))}
          </div>

          <article className="rounded-[1.5rem] border border-stone-200 bg-white p-6 shadow-panel">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-50 text-brand-700">1</div>
              <div>
                <h3 className="text-xl font-semibold text-stone-900">Loan Details</h3>
                <p className="text-sm text-stone-500">Define how much you need and what it's for.</p>
              </div>
            </div>

            <div className="mt-6 space-y-5">
              <label className="block">
                <span className="text-sm font-medium text-stone-700">Requested Amount (RWF)</span>
                <input
                  defaultValue="RWF 800,000"
                  className="mt-2 w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm outline-none focus:border-brand-500"
                />
                <span className="mt-2 block text-xs text-stone-400">Recommended: Up to 1,250,000 RWF</span>
              </label>

              <label className="block">
                <span className="text-sm font-medium text-stone-700">Loan Purpose</span>
                <input className="mt-2 w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm outline-none focus:border-brand-500" placeholder="e.g. irrigation expansion, fertilizer, livestock feed" />
              </label>

              <div>
                <span className="text-sm font-medium text-stone-700">Repayment Period (Months)</span>
                <div className="mt-3 grid gap-3 md:grid-cols-4">
                  {termOptions.map((option, index) => (
                    <button
                      key={option}
                      type="button"
                      className={index === 1 ? "rounded-xl border-2 border-brand-500 bg-brand-50 px-4 py-3 text-sm font-semibold text-brand-700" : "rounded-xl border border-stone-300 bg-white px-4 py-3 text-sm font-medium text-stone-700"}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button className="rounded-full border border-stone-200 bg-white px-5 py-2.5 text-sm font-semibold text-stone-700">Save Draft</button>
                <button className="rounded-full bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-500/20">Continue →</button>
              </div>
            </div>
          </article>

          <footer className="flex flex-wrap items-center justify-center gap-6 text-xs text-stone-400">
            <span>Secure SSL Encryption</span>
            <span>Data Protected by Rwanda Data Law</span>
            <span>Financial Inclusion Partner</span>
          </footer>
        </div>

        <aside className="space-y-4">
          <article className="rounded-[1.5rem] border border-brand-100 bg-brand-50 p-5 shadow-panel">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-brand-700">Eligibility Verified</h3>
              <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-brand-700">Approved</span>
            </div>
            <div className="mt-4 rounded-2xl border border-white bg-white p-4 shadow-sm">
              <p className="text-sm text-stone-500">Credit Score</p>
              <p className="mt-1 text-3xl font-semibold text-stone-900">720</p>
              <p className="mt-2 text-sm text-stone-600">Based on your farm productivity and repayment history.</p>
            </div>

            <div className="mt-4 rounded-2xl border border-white bg-white p-4 shadow-sm">
              <p className="text-sm text-stone-500">Max Loan Limit:</p>
              <p className="mt-1 text-2xl font-semibold text-stone-900">1,250,000 RWF</p>
            </div>

            <div className="mt-4">
              <p className="text-sm font-semibold text-brand-700">Recommended Loans</p>
              <ul className="mt-3 space-y-2 text-sm text-stone-700">
                <li>Seed & Fertilizer Advance (Low interest)</li>
                <li>Irrigation System Installation</li>
              </ul>
              <p className="mt-4 text-xs text-stone-500">Eligibility is auto-calculated based on farm activity.</p>
            </div>
          </article>

          <article className="rounded-[1.5rem] border border-stone-200 bg-white p-5 shadow-panel">
            <h3 className="text-lg font-semibold text-stone-900">Need Help?</h3>
            <p className="mt-2 text-sm text-stone-500">Stuck on a section? Call our dedicated support line for farmers.</p>

            <div className="mt-4 rounded-2xl border border-brand-100 bg-brand-50 p-4 text-center">
              <p className="text-lg font-semibold text-brand-700">0800 123 456</p>
              <p className="mt-1 text-xs text-stone-500">(Toll-Free in Rwanda)</p>
            </div>

            <button className="mt-3 w-full rounded-full border border-stone-200 bg-white px-4 py-2.5 text-sm font-semibold text-stone-700">Chat with Agent</button>
          </article>
        </aside>
      </section>
    </div>
  );
};
