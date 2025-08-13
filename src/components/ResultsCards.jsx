import React from "react";

export default function ResultsCards({ rows, fmtCurrency, Badge, sourceColor }) {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {rows.map((item, idx) => (
        <div key={idx} className="bg-white border rounded-xl p-4 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold">{item.pharmacy || "Pharmacy"}</span>
              <Badge color={sourceColor(item.source)}>{item.source || "Source"}</Badge>
            </div>
            <p className="text-sm text-slate-600">
              {item.dosage || ""} {item.quantity || ""}
            </p>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold">{fmtCurrency(item.price)}</div>
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-700 underline"
            >
              Open
            </a>
          </div>
        </div>
      ))}
    </div>
  );
}
