import React, { useMemo } from "react";

export default function ResultsMatrix({ rows, fmtCurrency }) {
  const { sources, pharmacies, cellMap } = useMemo(() => {
    const srcs = Array.from(new Set(rows.map((r) => r.source || "Unknown"))).sort();
    const pharm = Array.from(new Set(rows.map((r) => r.pharmacy || "Unknown"))).sort();
    const cells = {};
    for (const r of rows) {
      const k = `${r.pharmacy || "Unknown"}__${r.source || "Unknown"}`;
      if (!cells[k] || (typeof r.price === "number" && r.price < cells[k].price)) {
        cells[k] = r;
      }
    }
    return { sources: srcs, pharmacies: pharm, cellMap: cells };
  }, [rows]);

  return (
    <div className="overflow-auto border rounded-xl bg-white">
      <table className="min-w-[720px] w-full text-sm">
        <thead>
          <tr>
            <th className="text-left p-3 bg-slate-100 border-b">Pharmacy ↓ / Source →</th>
            {sources.map((s) => (
              <th key={s} className="text-left p-3 bg-slate-100 border-b">{s}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {pharmacies.map((ph) => (
            <tr key={ph} className="border-b">
              <td className="p-3 font-medium">{ph}</td>
              {sources.map((src) => {
                const k = `${ph}__${src}`;
                const r = cellMap[k];
                if (!r) {
                  return <td key={k} className="p-3 text-slate-400">—</td>;
                }
                const price = typeof r.price === "number" ? fmtCurrency(r.price) : r.price;
                return (
                  <td key={k} className="p-3">
                    <a
                      href={r.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-2 py-1 rounded border hover:bg-slate-50"
                    >
                      <span>{price}</span>
                    </a>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
