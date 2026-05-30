import { useEffect, useState } from "react";
import { api } from "../api/http";
import { useToast } from "../context/ToastContext";

const EXPENSE_TYPES = [
  "SEED", "FERTILIZER", "PESTICIDE", "HERBICIDE", "LABOR",
  "IRRIGATION", "TRANSPORT", "EQUIPMENT", "STORAGE", "RENT",
  "LOAN_REPAYMENT", "OTHER",
] as const;

const CASH_FLOW_STATUSES = ["POSITIVE", "NEUTRAL", "NEGATIVE"] as const;

const EXPENSE_BADGE: Record<string, string> = {
  SEED: "bg-green-100 text-green-800",
  FERTILIZER: "bg-emerald-100 text-emerald-800",
  PESTICIDE: "bg-yellow-100 text-yellow-800",
  HERBICIDE: "bg-lime-100 text-lime-800",
  LABOR: "bg-blue-100 text-blue-800",
  IRRIGATION: "bg-sky-100 text-sky-800",
  TRANSPORT: "bg-violet-100 text-violet-800",
  EQUIPMENT: "bg-orange-100 text-orange-800",
  STORAGE: "bg-amber-100 text-amber-800",
  RENT: "bg-stone-100 text-stone-700",
  LOAN_REPAYMENT: "bg-red-100 text-red-800",
  OTHER: "bg-gray-100 text-gray-700",
};

const CASH_FLOW_BADGE: Record<string, string> = {
  POSITIVE: "bg-emerald-100 text-emerald-800",
  NEUTRAL: "bg-amber-100 text-amber-800",
  NEGATIVE: "bg-red-100 text-red-800",
};

interface Season {
  id: string;
  name: string;
  year: number;
}

interface Expense {
  id: string;
  type: string;
  amount: number;
  description?: string | null;
  expenseDate: string;
  crop?: { id: string; cropName: string } | null;
}

interface FinancialSummary {
  id: string;
  seasonId: string;
  season?: { id: string; name: string; year: number };
  totalIncome: number;
  totalExpenses: number;
  netProfit: number;
  cashFlowStatus: "POSITIVE" | "NEUTRAL" | "NEGATIVE";
  notes?: string | null;
}

interface ExpenseForm {
  type: string;
  amount: string;
  description: string;
  expenseDate: string;
}

interface SummaryForm {
  seasonId: string;
  totalIncome: string;
  totalExpenses: string;
  netProfit: string;
  cashFlowStatus: string;
  notes: string;
}

const EMPTY_EXPENSE_FORM: ExpenseForm = {
  type: "LABOR",
  amount: "",
  description: "",
  expenseDate: "",
};

const EMPTY_SUMMARY_FORM: SummaryForm = {
  seasonId: "",
  totalIncome: "",
  totalExpenses: "",
  netProfit: "",
  cashFlowStatus: "NEUTRAL",
  notes: "",
};

const fieldClass =
  "rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-all";

const fmtRwf = (n: number) => `${n.toLocaleString()} RWF`;
const fmtDate = (d: string) => new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
const typeLabel = (t: string) => t.charAt(0) + t.slice(1).replace(/_/g, " ").toLowerCase();

export const FinancePage = () => {
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);

  // Expenses
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [savingExpense, setSavingExpense] = useState(false);
  const [expenseForm, setExpenseForm] = useState<ExpenseForm>(EMPTY_EXPENSE_FORM);
  const [confirmDeleteExpense, setConfirmDeleteExpense] = useState<string | null>(null);
  const [deletingExpense, setDeletingExpense] = useState<string | null>(null);

  // Financial summaries
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [summaries, setSummaries] = useState<FinancialSummary[]>([]);
  const [showSummaryForm, setShowSummaryForm] = useState(false);
  const [savingSummary, setSavingSummary] = useState(false);
  const [summaryForm, setSummaryForm] = useState<SummaryForm>(EMPTY_SUMMARY_FORM);
  const [confirmDeleteSummary, setConfirmDeleteSummary] = useState<string | null>(null);
  const [deletingSummary, setDeletingSummary] = useState<string | null>(null);

  useEffect(() => {
    Promise.allSettled([
      api.get("/expenses?limit=50"),
      api.get("/financial-summaries?limit=50"),
      api.get("/seasons"),
    ]).then(([expRes, sumRes, seasonsRes]) => {
      if (expRes.status === "fulfilled") {
        const d = expRes.value.data.data;
        setExpenses(Array.isArray(d) ? d : (d?.expenses ?? []));
      }
      if (sumRes.status === "fulfilled") {
        const d = sumRes.value.data.data;
        setSummaries(Array.isArray(d) ? d : (d?.summaries ?? []));
      }
      if (seasonsRes.status === "fulfilled") {
        const d = seasonsRes.value.data.data;
        setSeasons(Array.isArray(d) ? d : []);
      }
    }).finally(() => setLoading(false));
  }, []);

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingExpense(true);
    try {
      const payload: Record<string, unknown> = {
        type: expenseForm.type,
        amount: Number(expenseForm.amount),
        expenseDate: expenseForm.expenseDate,
      };
      if (expenseForm.description) payload.description = expenseForm.description;
      const { data } = await api.post("/expenses", payload);
      setExpenses((prev) => [data.data, ...prev]);
      setExpenseForm(EMPTY_EXPENSE_FORM);
      setShowExpenseForm(false);
      showToast("Expense recorded!", "success");
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "response" in err &&
        err.response && typeof err.response === "object" && "data" in err.response &&
        err.response.data && typeof err.response.data === "object" && "message" in err.response.data
          ? String((err.response.data as { message: string }).message)
          : "Failed to record expense.";
      showToast(msg, "error");
    } finally {
      setSavingExpense(false);
    }
  };

  const handleDeleteExpense = async (id: string) => {
    setDeletingExpense(id);
    try {
      await api.delete(`/expenses/${id}`);
      setExpenses((prev) => prev.filter((e) => e.id !== id));
      setConfirmDeleteExpense(null);
      showToast("Expense deleted.", "success");
    } catch {
      showToast("Failed to delete expense.", "error");
    } finally {
      setDeletingExpense(null);
    }
  };

  const handleAddSummary = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSummary(true);
    try {
      const payload: Record<string, unknown> = {
        seasonId: summaryForm.seasonId,
        cashFlowStatus: summaryForm.cashFlowStatus,
      };
      if (summaryForm.totalIncome) payload.totalIncome = Number(summaryForm.totalIncome);
      if (summaryForm.totalExpenses) payload.totalExpenses = Number(summaryForm.totalExpenses);
      if (summaryForm.netProfit) payload.netProfit = Number(summaryForm.netProfit);
      if (summaryForm.notes) payload.notes = summaryForm.notes;
      const { data } = await api.post("/financial-summaries", payload);
      setSummaries((prev) => [data.data, ...prev]);
      setSummaryForm(EMPTY_SUMMARY_FORM);
      setShowSummaryForm(false);
      showToast("Financial summary saved!", "success");
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "response" in err &&
        err.response && typeof err.response === "object" && "data" in err.response &&
        err.response.data && typeof err.response.data === "object" && "message" in err.response.data
          ? String((err.response.data as { message: string }).message)
          : "Failed to save financial summary.";
      showToast(msg, "error");
    } finally {
      setSavingSummary(false);
    }
  };

  const handleDeleteSummary = async (id: string) => {
    setDeletingSummary(id);
    try {
      await api.delete(`/financial-summaries/${id}`);
      setSummaries((prev) => prev.filter((s) => s.id !== id));
      setConfirmDeleteSummary(null);
      showToast("Financial summary deleted.", "success");
    } catch {
      showToast("Failed to delete financial summary.", "error");
    } finally {
      setDeletingSummary(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* ── Expenses ── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-stone-900 tracking-tight">Finances</h1>
            <p className="text-stone-500 text-sm mt-0.5">
              Farm expenses — {expenses.length} record{expenses.length !== 1 ? "s" : ""}
            </p>
          </div>
          <button
            onClick={() => setShowExpenseForm((v) => !v)}
            className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold rounded-full transition-colors"
          >
            {showExpenseForm ? "Cancel" : "+ Add expense"}
          </button>
        </div>

        {showExpenseForm && (
          <form
            onSubmit={handleAddExpense}
            className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            <h2 className="font-bold text-stone-900 md:col-span-2">New Farm Expense</h2>

            {/* Type */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-stone-700">
                Type <span className="text-red-500">*</span>
              </label>
              <select
                value={expenseForm.type}
                onChange={(e) => setExpenseForm((p) => ({ ...p, type: e.target.value }))}
                required
                className={fieldClass}
              >
                {EXPENSE_TYPES.map((t) => (
                  <option key={t} value={t}>{typeLabel(t)}</option>
                ))}
              </select>
            </div>

            {/* Amount */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-stone-700">
                Amount (RWF) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                step="1"
                value={expenseForm.amount}
                onChange={(e) => setExpenseForm((p) => ({ ...p, amount: e.target.value }))}
                required
                placeholder="e.g. 15000"
                className={fieldClass}
              />
            </div>

            {/* Expense date */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-stone-700">
                Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={expenseForm.expenseDate}
                onChange={(e) => setExpenseForm((p) => ({ ...p, expenseDate: e.target.value }))}
                required
                className={fieldClass}
              />
            </div>

            {/* Description */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-stone-700">
                Description <span className="text-stone-400 font-normal">(optional)</span>
              </label>
              <input
                type="text"
                value={expenseForm.description}
                onChange={(e) => setExpenseForm((p) => ({ ...p, description: e.target.value }))}
                placeholder="e.g. NPK fertilizer for maize"
                className={fieldClass}
              />
            </div>

            <div className="md:col-span-2 flex justify-end gap-3 mt-2">
              <button
                type="button"
                onClick={() => { setShowExpenseForm(false); setExpenseForm(EMPTY_EXPENSE_FORM); }}
                className="px-5 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-sm font-semibold rounded-full transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingExpense}
                className="px-5 py-2.5 bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white text-sm font-semibold rounded-full transition-colors"
              >
                {savingExpense ? "Saving…" : "Save expense"}
              </button>
            </div>
          </form>
        )}

        {expenses.length === 0 ? (
          <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center shadow-sm">
            <p className="text-stone-400 font-medium">No expenses recorded yet</p>
            <p className="text-stone-400 text-sm mt-1">Track your farm costs to improve your credit profile.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-stone-200 shadow-sm divide-y divide-stone-100">
            {expenses.map((item) => (
              <div key={item.id} className="flex items-center justify-between px-5 py-4 gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className={`shrink-0 px-2.5 py-0.5 rounded-full text-xs font-semibold ${EXPENSE_BADGE[item.type] ?? "bg-stone-100 text-stone-600"}`}
                  >
                    {typeLabel(item.type)}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-stone-800">{fmtRwf(item.amount)}</p>
                    <p className="text-xs text-stone-500">
                      {fmtDate(item.expenseDate)}
                      {item.description && ` · ${item.description}`}
                      {item.crop && ` · ${item.crop.cropName}`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {confirmDeleteExpense === item.id ? (
                    <>
                      <button
                        onClick={() => setConfirmDeleteExpense(null)}
                        className="px-3 py-1.5 text-xs font-semibold bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-full transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleDeleteExpense(item.id)}
                        disabled={deletingExpense === item.id}
                        className="px-3 py-1.5 text-xs font-semibold bg-red-500 hover:bg-red-600 disabled:opacity-60 text-white rounded-full transition-colors"
                      >
                        {deletingExpense === item.id ? "…" : "Confirm"}
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setConfirmDeleteExpense(item.id)}
                      className="px-3 py-1.5 text-xs font-semibold bg-stone-100 hover:bg-red-50 text-stone-500 hover:text-red-600 rounded-full transition-colors"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Financial Summaries ── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-stone-900 tracking-tight">Seasonal Summaries</h2>
            <p className="text-stone-500 text-sm mt-0.5">
              {summaries.length} summary{summaries.length !== 1 ? " records" : ""}
            </p>
          </div>
          <button
            onClick={() => setShowSummaryForm((v) => !v)}
            className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold rounded-full transition-colors"
          >
            {showSummaryForm ? "Cancel" : "+ Add summary"}
          </button>
        </div>

        {showSummaryForm && (
          <form
            onSubmit={handleAddSummary}
            className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            <h3 className="font-bold text-stone-900 md:col-span-2">New Financial Summary</h3>

            {/* Season */}
            <div className="flex flex-col gap-1.5 md:col-span-2">
              <label className="text-sm font-medium text-stone-700">
                Season <span className="text-red-500">*</span>
              </label>
              {seasons.length === 0 ? (
                <p className="text-sm text-stone-400 italic py-2">
                  No seasons available. Ask your cooperative admin to create a farming season first.
                </p>
              ) : (
                <select
                  value={summaryForm.seasonId}
                  onChange={(e) => setSummaryForm((p) => ({ ...p, seasonId: e.target.value }))}
                  required
                  className={fieldClass}
                >
                  <option value="">— select a season —</option>
                  {seasons.map((s) => (
                    <option key={s.id} value={s.id}>{s.name} ({s.year})</option>
                  ))}
                </select>
              )}
            </div>

            {/* Cash flow status */}
            <div className="flex flex-col gap-1.5 md:col-span-2">
              <label className="text-sm font-medium text-stone-700">Cash flow status</label>
              <div className="flex gap-3">
                {CASH_FLOW_STATUSES.map((s) => (
                  <label key={s} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="cashFlowStatus"
                      value={s}
                      checked={summaryForm.cashFlowStatus === s}
                      onChange={() => setSummaryForm((p) => ({ ...p, cashFlowStatus: s }))}
                      className="accent-brand-500"
                    />
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${CASH_FLOW_BADGE[s]}`}>
                      {typeLabel(s)}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Total income */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-stone-700">
                Total income (RWF) <span className="text-stone-400 font-normal">(optional)</span>
              </label>
              <input
                type="number"
                min="0"
                step="1"
                value={summaryForm.totalIncome}
                onChange={(e) => setSummaryForm((p) => ({ ...p, totalIncome: e.target.value }))}
                placeholder="e.g. 800000"
                className={fieldClass}
              />
            </div>

            {/* Total expenses */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-stone-700">
                Total expenses (RWF) <span className="text-stone-400 font-normal">(optional)</span>
              </label>
              <input
                type="number"
                min="0"
                step="1"
                value={summaryForm.totalExpenses}
                onChange={(e) => setSummaryForm((p) => ({ ...p, totalExpenses: e.target.value }))}
                placeholder="e.g. 250000"
                className={fieldClass}
              />
            </div>

            {/* Net profit */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-stone-700">
                Net profit (RWF) <span className="text-stone-400 font-normal">(optional)</span>
              </label>
              <input
                type="number"
                step="1"
                value={summaryForm.netProfit}
                onChange={(e) => setSummaryForm((p) => ({ ...p, netProfit: e.target.value }))}
                placeholder="e.g. 550000"
                className={fieldClass}
              />
            </div>

            {/* Notes */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-stone-700">
                Notes <span className="text-stone-400 font-normal">(optional)</span>
              </label>
              <input
                type="text"
                value={summaryForm.notes}
                onChange={(e) => setSummaryForm((p) => ({ ...p, notes: e.target.value }))}
                placeholder="Any additional notes"
                className={fieldClass}
              />
            </div>

            <div className="md:col-span-2 flex justify-end gap-3 mt-2">
              <button
                type="button"
                onClick={() => { setShowSummaryForm(false); setSummaryForm(EMPTY_SUMMARY_FORM); }}
                className="px-5 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-sm font-semibold rounded-full transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingSummary || seasons.length === 0}
                className="px-5 py-2.5 bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white text-sm font-semibold rounded-full transition-colors"
              >
                {savingSummary ? "Saving…" : "Save summary"}
              </button>
            </div>
          </form>
        )}

        {summaries.length === 0 ? (
          <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center shadow-sm">
            <p className="text-stone-400 font-medium">No seasonal summaries yet</p>
            <p className="text-stone-400 text-sm mt-1">Add a financial summary per season to build your credit history.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-stone-200 shadow-sm divide-y divide-stone-100">
            {summaries.map((item) => (
              <div key={item.id} className="px-5 py-4 flex items-center gap-4">
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-stone-800 text-sm">
                      {item.season ? `${item.season.name} (${item.season.year})` : "Season"}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${CASH_FLOW_BADGE[item.cashFlowStatus] ?? "bg-stone-100 text-stone-600"}`}
                    >
                      {typeLabel(item.cashFlowStatus)}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-stone-500">
                    <span>Income: <span className="font-medium text-stone-700">{fmtRwf(item.totalIncome)}</span></span>
                    <span>Expenses: <span className="font-medium text-stone-700">{fmtRwf(item.totalExpenses)}</span></span>
                    <span>
                      Net profit:{" "}
                      <span className={`font-medium ${item.netProfit >= 0 ? "text-emerald-700" : "text-red-700"}`}>
                        {fmtRwf(item.netProfit)}
                      </span>
                    </span>
                  </div>
                  {item.notes && (
                    <p className="text-xs text-stone-400 truncate">{item.notes}</p>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {confirmDeleteSummary === item.id ? (
                    <>
                      <button
                        onClick={() => setConfirmDeleteSummary(null)}
                        className="px-3 py-1.5 text-xs font-semibold bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-full transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleDeleteSummary(item.id)}
                        disabled={deletingSummary === item.id}
                        className="px-3 py-1.5 text-xs font-semibold bg-red-500 hover:bg-red-600 disabled:opacity-60 text-white rounded-full transition-colors"
                      >
                        {deletingSummary === item.id ? "…" : "Confirm"}
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setConfirmDeleteSummary(item.id)}
                      className="px-3 py-1.5 text-xs font-semibold bg-stone-100 hover:bg-red-50 text-stone-500 hover:text-red-600 rounded-full transition-colors"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
