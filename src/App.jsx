import React, { useMemo, useState } from "react";
import ResultsCards from "./components/ResultsCards.jsx";
import ResultsMatrix from "./components/ResultsMatrix.jsx";

const API = "https://rxcompare-backend.onrender.com/api/search";
const FREE_SEARCHES = 1;
const USAGE_KEY = "rxc_search_count";
const REFERRED_KEY = "rxc_referred";

function useGating() {
  const params = new URLSearchParams(window.location.search);
  if (params.get("ref")) {
    localStorage.setItem(REFERRED_KEY, "1");
  }
  const getCount = () => parseInt(localStorage.getItem(USAGE_KEY) || "0", 10);
  const inc = () => localStorage.setItem(USAGE_KEY, String(getCount() + 1));
  const referralUnlocked = localStorage.getItem(REFERRED_KEY) === "1";
  const canSearch = getCount() < FREE_SEARCHES || referralUnlocked;
  return { canSearch, inc, referralUnlocked };
}

function Badge({ children, color = "bg-slate-600" }) {
  return (
    <span className={`text-white text-[11px] px-2 py-0.5 rounded ${color}`}>
      {children}
    </span>
  );
}

function sourceColor(source) {
  return (
    {
      "Cost Plus Drugs": "bg-emerald-600",
      "Walmart $4 List": "bg-indigo-600",
      SingleCare: "bg-blue-600",
      "Blink Health": "bg-fuchsia-600",
      WellRx: "bg-amber-600",
      "Honeybee Health": "bg-rose-600",
      "Costco Pharmacy": "bg-slate-700",
    }[source] || "bg-slate-600"
  );
}

function fmtCurrency(n) {
  if (typeof n !== "number") return n;
  return n.toLocaleString(undefined, { style: "currency", currency: "USD" });
}

export default function App() {
  const [form, setForm] = useState({
    drug: "",
    dosage: "",
    quantity: "",
    zip: "",
  });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [best, setBest] = useState(null);
  const [rows, setRows] = useState([]);
  const [tab, setTab] = useState("cards"); // "cards" | "matrix"

  const { canSearch, inc, referralUnlocked } = useGating();

  const gatingBanner = useMemo(() => {
    if (canSearch) return null;
    const link = `${location.origin}${location.pathname}?ref=YOURCODE`;
    return (
      <div className="mb-4 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-sm">
        <strong>Free search used.</strong> Create an account to continue, or
        share your link to unlock free searches:
        <span className="inline-block mt-1 px-2 py-1 bg-white border rounded text-xs ml-2">
          {link}
        </span>
      </div>
    );
  }, [canSearch]);

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");

    if (!canSearch) {
      setErr("Free search used. Please sign up or use a referral link to continue.");
      return;
    }

    setLoading(true);
    setBest(null);
    setRows([]);
    try {
      const res = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      const all = Array.isArray(json.all_results) ? json.all_results : [];
      const cleaned = all
        .filter((r) => typeof r?.price === "number")
        .sort((a, b) => (a.price ?? Infinity) - (b.price ?? Infinity));
      if (!cleaned.length) throw new Error("No prices returned.");

      setBest(json.best_price || cleaned[0]);
      setRows(cleaned);
      inc(); // count this search
    } catch (e2) {
      setErr(e2.message || "Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }

  function setField(k, v) {
    setForm((s) => ({ ...s, [k]: v }));
  }

  function sortBy(kind) {
    const sorted = [...rows];
    if (kind === "price") {
      sorted.sort((a, b) => (a.price ?? Infinity) - (b.price ?? Infinity));
    } else if (kind === "source") {
      sorted.sort((a, b) => (a.source || "").localeCompare(b.source || ""));
    } else if (kind === "pharmacy") {
      sorted.sort((a, b) => (a.pharmacy || "").localeCompare(b.pharmacy || ""));
    }
    setRows(sorted);
  }

  return (
    <div>
      <header className="bg-white border-b">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl sm:text-2xl font-bold">💊 RxCompare</h1>
          <span className="text-xs sm:text-sm text-slate-500">
            Find the lowest cash price
          </span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        {gatingBanner}

        <div className="bg-white rounded-xl shadow-sm border p-4 sm:p-6">
          <h2 className="text-lg font-semibold mb-4">Find the best price</h2>

          <form
            onSubmit={onSubmit}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3"
          >
            <input
              value={form.drug}
              onChange={(e) => setField("drug", e.target.value)}
              placeholder="Drug name (e.g., atorvastatin)"
              required
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring focus:ring-blue-200"
            />
            <input
              value={form.dosage}
              onChange={(e) => setField("dosage", e.target.value)}
              placeholder="Dosage (e.g., 10mg)"
              required
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring focus:ring-blue-200"
            />
            <input
              value={form.quantity}
              onChange={(e) => setField("quantity", e.target.value)}
              placeholder="Quantity (e.g., 30 tablets)"
              required
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring focus:ring-blue-200"
            />
            <input
              value={form.zip}
              onChange={(e) => setField("zip", e.target.value)}
              placeholder="ZIP code"
              required
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring focus:ring-blue-200"
            />

            <div className="sm:col-span-2 lg:col-span-4 flex flex-wrap items-center gap-3">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="4" fill="none"></circle>
                    <path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                  </svg>
                ) : (
                  "Search"
                )}
              </button>
              <div className="text-xs text-slate-500">Tip: Try a nearby ZIP to compare regional prices.</div>
              {referralUnlocked && <Badge color="bg-emerald-600">Referral Unlocked</Badge>}
            </div>
          </form>

          {err && <p className="mt-3 text-sm text-red-600">{err}</p>}
        </div>

        {/* Tabs */}
        {!!rows.length && (
          <div className="mt-6 flex gap-2">
            <button
              onClick={() => setTab("cards")}
              className={`px-3 py-2 rounded-lg text-sm ${
                tab === "cards" ? "bg-slate-200 text-slate-800" : "bg-slate-100 hover:bg-slate-200 text-slate-700"
              }`}
            >
              Cards
            </button>
            <button
              onClick={() => setTab("matrix")}
              className={`px-3 py-2 rounded-lg text-sm ${
                tab === "matrix" ? "bg-slate-200 text-slate-800" : "bg-slate-100 hover:bg-slate-200 text-slate-700"
              }`}
            >
              Matrix
            </button>
          </div>
        )}

        {/* Best price */}
        {best && (
          <section className="mt-4">
            <h3 className="text-lg font-semibold mb-3">Best price</h3>
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold">{fmtCurrency(best.price)}</span>
                    <Badge color={sourceColor(best.source)}>{best.source || "Source"}</Badge>
                  </div>
                  <p className="text-sm text-slate-600 mt-1">
                    <strong>{best.pharmacy || "Pharmacy"}</strong> • {best.dosage || ""} {best.quantity || ""}
                  </p>
                </div>
                <a
                  href={best.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg"
                >
                  View offer
                </a>
              </div>
            </div>
          </section>
        )}

        {/* Cards view */}
        {!!rows.length && tab === "cards" && (
          <section className="mt-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold">All prices</h3>
              <div className="text-sm text-slate-500">
                Sort:&nbsp;
                <button onClick={() => sortBy("price")} className="underline hover:text-slate-700">Price</button>
                &nbsp;•&nbsp;
                <button onClick={() => sortBy("source")} className="underline hover:text-slate-700">Source</button>
                &nbsp;•&nbsp;
                <button onClick={() => sortBy("pharmacy")} className="underline hover:text-slate-700">Pharmacy</button>
              </div>
            </div>
            <ResultsCards rows={rows} fmtCurrency={fmtCurrency} Badge={Badge} sourceColor={sourceColor} />
          </section>
        )}

        {/* Matrix view */}
        {!!rows.length && tab === "matrix" && (
          <section className="mt-6">
            <h3 className="text-lg font-semibold mb-3">Matrix (sources × pharmacies)</h3>
            <ResultsMatrix rows={rows} fmtCurrency={fmtCurrency} />
            <p className="mt-2 text-xs text-slate-500">Click a price to open the offer in a new tab.</p>
          </section>
        )}
      </main>

      <footer className="max-w-5xl mx-auto px-4 pb-8 text-center text-xs text-slate-500">
        Prices shown are cash estimates from public sources and may vary at checkout. Always verify on the source before purchasing.
      </footer>
    </div>
  );
}
