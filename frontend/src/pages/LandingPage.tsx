import { useNavigate } from "react-router-dom";

export const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-stone-100 max-w-6xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-brand-500 flex items-center justify-center">
            <span className="text-white text-xs font-bold">U</span>
          </div>
          <span className="font-black text-stone-900 tracking-tight text-lg">Umuhinzi</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/login")}
            className="text-sm font-medium text-stone-600 hover:text-stone-900 transition-colors"
          >
            Sign in
          </button>
          <button
            onClick={() => navigate("/register")}
            className="text-sm font-medium bg-brand-500 hover:bg-brand-600 text-white px-4 py-2 rounded-full transition-colors"
          >
            Get started
          </button>
        </div>
      </header>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-6 py-20 bg-[linear-gradient(180deg,#f8faf7_0%,#eef5ef_100%)]">
        <div className="inline-flex items-center gap-2 bg-brand-50 border border-brand-200 rounded-full px-4 py-1.5 text-brand-700 text-sm font-medium mb-6">
          Agricultural Credit Platform · Rwanda
        </div>
        <h1 className="text-4xl md:text-6xl font-black text-stone-900 tracking-tight leading-tight max-w-3xl">
          Credit for farmers,<br />
          <span className="text-brand-500">powered by data</span>
        </h1>
        <p className="mt-6 text-lg text-stone-500 max-w-xl leading-relaxed">
          Umuhinzi gives smallholder farmers access to collateral-free loans
          using agricultural productivity data instead of traditional collateral.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 mt-10">
          <button
            onClick={() => navigate("/register")}
            className="px-8 py-3.5 bg-brand-500 hover:bg-brand-600 text-white font-semibold rounded-full transition-colors text-base"
          >
            Apply as a Farmer
          </button>
          <button
            onClick={() => navigate("/login")}
            className="px-8 py-3.5 bg-white hover:bg-stone-50 text-stone-700 font-semibold rounded-full border border-stone-200 transition-colors text-base"
          >
            Sign in
          </button>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-white py-16 px-6">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { value: "45,000+", label: "Farmers served" },
            { value: "RF 2.4B", label: "Loans disbursed" },
            { value: "32%", label: "Yield increase" },
            { value: "15%", label: "Credit score growth" },
          ].map((stat) => (
            <div key={stat.label}>
              <p className="text-3xl font-black text-brand-500 tracking-tight">{stat.value}</p>
              <p className="text-sm text-stone-500 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="bg-stone-50 py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-black text-stone-900 tracking-tight text-center mb-12">
            How it works
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                step: "01",
                title: "Register & verify",
                desc: "Create your account, add your farm details and verify your identity.",
              },
              {
                step: "02",
                title: "Build your score",
                desc: "We analyze your farm yield, history, and livestock to calculate your credit score.",
              },
              {
                step: "03",
                title: "Get funded",
                desc: "Apply for a loan and receive funds directly to your mobile money account.",
              },
            ].map((f) => (
              <div
                key={f.step}
                className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm"
              >
                <span className="text-brand-500 font-black text-2xl">{f.step}</span>
                <h3 className="font-bold text-stone-900 mt-3 mb-2">{f.title}</h3>
                <p className="text-sm text-stone-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-stone-100 py-8 px-6 text-center">
        <p className="text-sm text-stone-400">
          © {new Date().getFullYear()} Umuhinzi. Agricultural credit for Rwanda.
        </p>
      </footer>
    </div>
  );
};
