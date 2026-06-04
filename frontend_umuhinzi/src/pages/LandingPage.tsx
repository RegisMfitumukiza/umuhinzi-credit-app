import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { homeRouteByRole } from "../utils/auth";

const partnerLogos = ["RRA", "MINAGRI", "BK Rwanda", "Airtel Money", "MTN MoMo"];

const featureCards = [
  {
    title: "Fair Credit Scoring",
    description: "Our proprietary algorithm analyzes your agricultural history and yield potential to build a fair credit profile.",
    icon: "🛡️",
    iconBg: "bg-blue-50 text-blue-500",
  },
  {
    title: "Quick Mobile Loans",
    description: "Apply in minutes via web or mobile app. Get approved and receive funds directly to your mobile money wallet.",
    icon: "📱",
    iconBg: "bg-emerald-50 text-emerald-500",
  },
  {
    title: "Yield & Data Insights",
    description: "Track your farm productivity over seasons. Receive personalized tips to improve crop quality and output.",
    icon: "🕒",
    iconBg: "bg-amber-50 text-amber-500",
  },
];

const stats = [
  { value: "45,000+", label: "FARMERS EMPOWERED" },
  { value: "RF 2.4B", label: "LOANS DISBURSED" },
  { value: "32%", label: "AVERAGE YIELD INCREASE" },
  { value: "15%", label: "CREDIT SCORE GROWTH" },
];

const testimonials = [
  {
    quote:
      "Umuhinzi Credit changed my life. I used my first loan to buy better seeds and fertilizer, and my yield doubled in one season.",
    name: "Jean Bosco N.",
    role: "MAIZE FARMER, MUSANZE",
  },
  {
    quote:
      "Managing 50 farmers used to be hard. Now, with the digital dashboard, I can track everyone's progress and credit needs in real-time.",
    name: "Marie Claire U.",
    role: "COOPERATIVE MANAGER, RUBAVU",
  },
  {
    quote:
      "The credit scoring system is fair. It actually looks at how well I farm, not just how much I have in the bank.",
    name: "Emmanuel K.",
    role: "COFFEE PRODUCER, KAYONZA",
  },
];

export const LandingPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  const handleLogin = () => {
    if (isAuthenticated && user) {
      navigate(homeRouteByRole(user.role));
    } else {
      navigate("/login");
    }
  };

  const handleGetStarted = () => {
    if (isAuthenticated && user) {
      navigate(homeRouteByRole(user.role));
    } else {
      navigate("/register");
    }
  };

  return (
    <div className="min-h-screen bg-white text-stone-900">
      <header className="border-b border-stone-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 lg:px-8">
          <button onClick={() => navigate("/")} className="flex items-center gap-2 text-left">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500 text-white shadow-sm">🌱</span>
            <span className="text-lg font-semibold text-emerald-600">Umuhinzi Credit</span>
          </button>

          <nav className="hidden items-center gap-8 text-sm font-medium text-stone-600 md:flex">
            <a href="#features" className="transition hover:text-stone-900">Features</a>
            <a href="#preview" className="transition hover:text-stone-900">App Preview</a>
            <a href="#credit-score" className="transition hover:text-stone-900">Credit Score</a>
          </nav>

          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/login")} className="text-sm font-medium text-stone-700 transition hover:text-stone-900">
              Log In
            </button>
            <button onClick={() => navigate("/register")} className="rounded-full bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-600">
              Get Started
            </button>
          </div>
        </div>
      </header>

      <main>
        <section className="mx-auto grid max-w-6xl gap-12 px-5 pb-18 pt-20 lg:grid-cols-[1.02fr_0.98fr] lg:items-center lg:px-8 lg:pt-24">
          <div className="space-y-8">
            <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-4 py-1 text-xs font-semibold text-emerald-600">
              Empowering Rwandan Agriculture
            </span>

            <div className="space-y-4">
              <h1 className="max-w-xl text-5xl font-black leading-[0.93] tracking-[-0.05em] text-stone-900 sm:text-[4.6rem]">
                Grow Your Farm with <span className="text-emerald-500">Data-Driven</span> Credit.
              </h1>
              <p className="max-w-xl text-[1rem] leading-7 text-stone-600">
                Umuhinzi Credit provides accessible micro-loans and smart agricultural insights tailored for the modern Rwandan farmer. Unlock your soil&apos;s potential today.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button onClick={() => navigate("/register")} className="rounded-lg bg-emerald-500 px-6 py-3 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(34,197,94,0.24)] transition hover:bg-emerald-600">
                Apply for Loan
              </button>
              <button onClick={() => navigate("/register")} className="rounded-lg border border-stone-300 bg-white px-6 py-3 text-sm font-semibold text-stone-800 transition hover:border-stone-400">
                Get Started
              </button>
            </div>

            <div className="flex items-center gap-3 text-sm text-stone-600">
              <div className="flex -space-x-2">
                {Array.from({ length: 4 }).map((_, index) => (
                  <span key={index} className="h-8 w-8 rounded-full border-2 border-white bg-[radial-gradient(circle_at_30%_30%,#fef3c7_0%,#f59e0b_50%,#92400e_100%)]" />
                ))}
              </div>
              <p>
                Joined by <span className="font-semibold text-stone-900">12,000+</span> farmers this month
              </p>
            </div>
          </div>

          <div className="flex items-center justify-center">
            <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-[linear-gradient(180deg,#fefbf1_0%,#f0dfb0_26%,#96c543_26%,#7db93a_100%)] p-3 shadow-[0_18px_40px_rgba(15,23,42,0.14)]">
              <div className="aspect-[1.05/0.78] rounded-xl bg-[radial-gradient(circle_at_26%_22%,rgba(255,244,214,0.95)_0%,rgba(255,244,214,0.10)_26%,rgba(255,255,255,0)_27%),linear-gradient(180deg,#f9c96f_0%,#efb94d_22%,#84bc3a_22%,#74af32_100%)] shadow-inner">
                <div className="flex h-full flex-col justify-between p-5">
                  <div className="flex justify-end">
                    <div className="rounded-full bg-white/75 px-3 py-1 text-xs font-semibold text-stone-700 backdrop-blur">
                      Rwandan farm field
                    </div>
                  </div>
                  <div className="self-start rounded-2xl bg-white/20 px-4 py-3 text-white backdrop-blur-sm">
                    <p className="text-sm font-semibold">Seasonal monitoring</p>
                    <p className="text-xs text-white/80">Data-driven support for every harvest</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-stone-200 bg-[#f8faf8] py-8">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-6 px-5 text-sm font-semibold uppercase tracking-[0.3em] text-stone-400 lg:px-8">
            <span>Partners in Growth:</span>
            {partnerLogos.map((partner) => (
              <span key={partner} className="tracking-normal text-stone-400 uppercase">
                {partner}
              </span>
            ))}
          </div>
        </section>

        <section id="features" className="mx-auto max-w-6xl px-5 py-24 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-4xl font-black tracking-[-0.03em] text-stone-900">Financial Inclusion for Every Farmer</h2>
            <p className="mt-4 text-lg leading-8 text-stone-500">
              We provide more than just credit. We provide a platform for sustainable agricultural growth through technology.
            </p>
          </div>

          <div className="mt-14 grid gap-6 lg:grid-cols-3">
            {featureCards.map((feature) => (
              <article key={feature.title} className="rounded-2xl border border-stone-200 bg-white p-7 shadow-[0_10px_24px_rgba(15,23,42,0.05)]">
                <div className={`mb-5 inline-flex h-11 w-11 items-center justify-center rounded-xl ${feature.iconBg}`}>
                  <span className="text-lg">{feature.icon}</span>
                </div>
                <h3 className="text-[1.15rem] font-semibold text-stone-900">{feature.title}</h3>
                <p className="mt-4 leading-7 text-stone-600">{feature.description}</p>
                <a href="#preview" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-emerald-600 transition hover:text-emerald-700">
                  Learn more <span aria-hidden>›</span>
                </a>
              </article>
            ))}
          </div>
        </section>

        <section id="credit-score" className="border-y border-stone-200 bg-[#f8faf8] py-20">
          <div className="mx-auto grid max-w-6xl gap-8 px-5 sm:grid-cols-2 lg:grid-cols-4 lg:px-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 shadow-inner">✓</div>
                <div className="text-4xl font-black tracking-[-0.03em] text-stone-900">{stat.value}</div>
                <div className="mt-3 text-sm font-semibold uppercase tracking-[0.2em] text-stone-500">{stat.label}</div>
              </div>
            ))}
          </div>
        </section>

        <section id="preview" className="mx-auto grid max-w-6xl gap-14 px-5 py-24 lg:grid-cols-[1.02fr_0.98fr] lg:items-center lg:px-8">
          <div className="flex justify-center lg:justify-start">
            <div className="w-full max-w-xl rounded-2xl border border-stone-200 bg-white p-6 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
              <div className="rounded-2xl bg-[linear-gradient(135deg,#eaf6ee_0%,#f7fbf8_50%,#ffffff_100%)] p-5">
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-2xl bg-white p-3 shadow-sm">
                    <div className="h-3 w-8 rounded-full bg-emerald-200" />
                    <div className="mt-4 h-14 rounded-xl bg-gradient-to-br from-sky-100 to-sky-300" />
                  </div>
                  <div className="rounded-2xl bg-white p-3 shadow-sm">
                    <div className="h-3 w-8 rounded-full bg-amber-200" />
                    <div className="mt-4 h-14 rounded-xl bg-gradient-to-br from-emerald-100 to-emerald-300" />
                  </div>
                  <div className="rounded-2xl bg-white p-3 shadow-sm">
                    <div className="h-3 w-8 rounded-full bg-indigo-200" />
                    <div className="mt-4 h-14 rounded-xl bg-gradient-to-br from-rose-100 to-rose-300" />
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-white p-4 shadow-sm">
                    <div className="h-3 w-20 rounded-full bg-stone-200" />
                    <div className="mt-4 h-20 rounded-xl bg-[linear-gradient(180deg,#e7f7ef_0%,#b6f0c7_100%)]" />
                  </div>
                  <div className="rounded-2xl bg-white p-4 shadow-sm">
                    <div className="h-3 w-16 rounded-full bg-stone-200" />
                    <div className="mt-4 h-20 rounded-xl bg-[linear-gradient(180deg,#fff6d6_0%,#ffe08a_100%)]" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h2 className="max-w-xl text-4xl font-black tracking-[-0.03em] text-stone-900">Your Farm, Managed from Your Pocket</h2>
            <p className="mt-6 max-w-xl text-lg leading-8 text-stone-500">
              Whether you are a solo farmer or managing a large cooperative, Umuhinzi Credit gives you the tools to track every harvest and every repayment.
            </p>

            <ul className="mt-8 space-y-4 text-stone-700">
              {[
                "Digital Crop & Livestock Records",
                "Real-time Credit Score Tracking",
                "Automated Repayment Reminders",
                "Direct Access to Agri-experts",
              ].map((item) => (
                <li key={item} className="flex items-center gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">✓</span>
                  <span className="font-medium">{item}</span>
                </li>
              ))}
            </ul>

            <button onClick={() => navigate("/register")} className="mt-10 rounded-xl border border-stone-200 bg-white px-6 py-3 text-sm font-semibold text-stone-700 shadow-sm transition hover:border-stone-300">
              See App Preview →
            </button>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 py-10 lg:px-8">
          <div className="text-center">
            <h2 className="text-4xl font-black tracking-[-0.03em] text-stone-900">Trusted by Rwanda&apos;s Agriculture Leaders</h2>
            <p className="mt-4 text-lg text-stone-500">Real stories from the people growing our nation&apos;s future.</p>
          </div>

          <div className="mt-14 grid gap-6 lg:grid-cols-3">
            {testimonials.map((testimonial, index) => (
              <article
                key={testimonial.name}
                className={`rounded-2xl border bg-white p-6 shadow-[0_8px_20px_rgba(15,23,42,0.05)] ${index === 1 ? "border-violet-300 ring-1 ring-violet-200" : "border-stone-200"}`}
              >
                <p className="min-h-[140px] italic leading-8 text-stone-600">“{testimonial.quote}”</p>
                <div className="mt-6 flex items-center gap-3">
                  <div className="h-11 w-11 rounded-full bg-[radial-gradient(circle_at_30%_30%,#d9b38c_0%,#8f5f3d_60%,#4b2e1f_100%)]" />
                  <div>
                    <div className="font-semibold text-stone-900">{testimonial.name}</div>
                    <div className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-400">{testimonial.role}</div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 py-14 lg:px-8">
          <div className="rounded-[1.75rem] bg-emerald-500 px-6 py-14 text-center text-white shadow-[0_18px_44px_rgba(16,185,129,0.24)] sm:px-10">
            <h2 className="text-4xl font-black leading-tight tracking-[-0.04em] sm:text-5xl">Ready to Take Your Farming to the Next Level?</h2>
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-white/90">Join the Umuhinzi Credit community today and get your first credit limit within 24 hours.</p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <button onClick={() => navigate("/register")} className="rounded-lg bg-white px-6 py-3 text-sm font-semibold text-emerald-600 transition hover:bg-stone-100">
                Register Now
              </button>
              <button onClick={() => navigate("/login")} className="rounded-lg bg-white px-6 py-3 text-sm font-semibold text-stone-700 transition hover:bg-stone-100">
                Log In
              </button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-stone-200 bg-white">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 text-sm text-stone-600 lg:grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr] lg:px-8">
          <div>
            <div className="flex items-center gap-2 text-emerald-600">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500 text-white">🌱</span>
              <span className="text-lg font-semibold">Umuhinzi Credit</span>
            </div>
            <p className="mt-4 max-w-sm leading-7">Empowering Rwandan farmers through innovative fintech solutions and smart agricultural insights.</p>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-stone-900">Product</h3>
            <ul className="mt-4 space-y-3">
              <li><a href="#features">Micro-loans</a></li>
              <li><a href="#credit-score">Credit Scoring</a></li>
              <li><a href="#preview">Yield Tracking</a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-stone-900">Resources</h3>
            <ul className="mt-4 space-y-3">
              <li>Farmer Guides</li>
              <li>Success Stories</li>
              <li>Support Center</li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-stone-900">Contact</h3>
            <ul className="mt-4 space-y-3">
              <li>Kigali, Rwanda</li>
              <li>support@umuhinzi.rw</li>
              <li>+250 788 000 000</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-stone-200 py-5 text-center text-xs text-stone-500">© 2026 Umuhinzi Credit. All rights reserved.</div>
      </footer>
    </div>
  );
};
